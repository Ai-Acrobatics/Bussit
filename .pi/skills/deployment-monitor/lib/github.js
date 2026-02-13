import { Octokit } from '@octokit/rest';

// Initialize GitHub client
export function getGitHubClient() {
  const token = process.env.DEPLOYMENT_GITHUB_TOKEN || process.env.GH_TOKEN;
  
  if (!token) {
    throw new Error('GitHub token not found. Set DEPLOYMENT_GITHUB_TOKEN or GH_TOKEN in LLM_SECRETS.');
  }
  
  return new Octokit({ auth: token });
}

// Get workflow runs for a repository
export async function getWorkflowRuns(owner, repo, options = {}) {
  const octokit = getGitHubClient();
  
  const params = {
    owner,
    repo,
    per_page: options.limit || 10,
    status: options.status || 'all'
  };
  
  if (options.workflow) {
    // Get workflow ID first
    const { data: workflows } = await octokit.actions.listRepoWorkflows({
      owner,
      repo
    });
    
    const workflow = workflows.workflows.find(w => 
      w.name === options.workflow || w.path.includes(options.workflow)
    );
    
    if (workflow) {
      params.workflow_id = workflow.id;
    }
  }
  
  const { data } = await octokit.actions.listWorkflowRunsForRepo(params);
  return data.workflow_runs;
}

// Get specific workflow run
export async function getWorkflowRun(owner, repo, runId) {
  const octokit = getGitHubClient();
  
  const { data: run } = await octokit.actions.getWorkflowRun({
    owner,
    repo,
    run_id: runId
  });
  
  return run;
}

// Get workflow run logs
export async function getWorkflowLogs(owner, repo, runId) {
  const octokit = getGitHubClient();
  
  try {
    const { data } = await octokit.actions.downloadWorkflowRunLogs({
      owner,
      repo,
      run_id: runId
    });
    
    return data;
  } catch (error) {
    console.error(`Failed to get logs: ${error.message}`);
    return null;
  }
}

// Get jobs for a workflow run
export async function getWorkflowJobs(owner, repo, runId) {
  const octokit = getGitHubClient();
  
  const { data } = await octokit.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: runId
  });
  
  return data.jobs;
}

// Extract error from workflow jobs
export async function extractError(owner, repo, runId) {
  const jobs = await getWorkflowJobs(owner, repo, runId);
  const failedJobs = jobs.filter(j => j.conclusion === 'failure');
  
  if (failedJobs.length === 0) {
    return { error: 'No failed jobs found', category: 'unknown' };
  }
  
  const errors = [];
  
  for (const job of failedJobs) {
    const failedSteps = job.steps.filter(s => s.conclusion === 'failure');
    
    for (const step of failedSteps) {
      errors.push({
        job: job.name,
        step: step.name,
        error: step.conclusion
      });
    }
  }
  
  // Categorize error
  const category = categorizeError(errors);
  
  return {
    error: formatErrors(errors),
    category,
    jobs: failedJobs.map(j => ({
      name: j.name,
      conclusion: j.conclusion,
      started_at: j.started_at,
      completed_at: j.completed_at
    }))
  };
}

// Categorize error type
function categorizeError(errors) {
  const errorText = JSON.stringify(errors).toLowerCase();
  
  if (errorText.includes('test') || errorText.includes('spec')) {
    return 'test_failure';
  }
  if (errorText.includes('build') || errorText.includes('compile')) {
    return 'build_error';
  }
  if (errorText.includes('dependency') || errorText.includes('package')) {
    return 'dependency_issue';
  }
  if (errorText.includes('timeout')) {
    return 'timeout';
  }
  if (errorText.includes('config') || errorText.includes('environment')) {
    return 'configuration_error';
  }
  
  return 'unknown';
}

// Format errors for display
function formatErrors(errors) {
  return errors.map(e => `${e.job} / ${e.step}: ${e.error}`).join('\n');
}

// Create a pull request
export async function createPullRequest(owner, repo, options) {
  const octokit = getGitHubClient();
  
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: options.title,
    body: options.body,
    head: options.branch,
    base: options.base || 'main'
  });
  
  return pr;
}

// List workflows
export async function listWorkflows(owner, repo) {
  const octokit = getGitHubClient();
  
  const { data } = await octokit.actions.listRepoWorkflows({
    owner,
    repo
  });
  
  return data.workflows;
}

// Check if deployment should be auto-fixed
export function shouldAutoFix(run, config) {
  if (!config?.auto_fix?.enabled) return false;
  
  // Check if branch is protected
  const protectedBranches = config.safety?.require_approval_for || [];
  if (protectedBranches.includes(run.head_branch)) {
    return false;
  }
  
  // Check if workflow is in allowed list
  const allowedWorkflows = config.auto_fix?.allowed_workflows;
  if (allowedWorkflows && !allowedWorkflows.includes(run.name)) {
    return false;
  }
  
  return true;
}
