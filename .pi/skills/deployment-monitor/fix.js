#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getWorkflowRun, extractError } from './lib/github.js';
import { saveLog } from './lib/tracking.js';
import { notify } from './lib/notifications.js';
import { readFileSync, existsSync } from 'fs';
import fetch from 'node-fetch';

// Load configuration
function loadConfig() {
  const configPath = '/job/operating_system/DEPLOYMENT_MONITOR.json';
  
  if (existsSync(configPath)) {
    return JSON.parse(readFileSync(configPath, 'utf8'));
  }
  
  return null;
}

// Create a job to fix deployment
async function createFixJob(owner, repo, runId, errorDetails) {
  const eventHandlerUrl = process.env.GH_WEBHOOK_URL;
  const apiKey = process.env.API_KEY;
  
  if (!eventHandlerUrl || !apiKey) {
    throw new Error('Event handler URL or API key not configured');
  }
  
  // Build job description
  const jobDescription = `
# Fix Deployment Failure

A deployment has failed and requires investigation and fixing.

## Repository
${owner}/${repo}

## Workflow Run
- Run ID: ${runId}
- Error Category: ${errorDetails.category}

## Error Details
${errorDetails.error}

## Failed Jobs
${JSON.stringify(errorDetails.jobs, null, 2)}

## Your Task

1. **Investigate the failure:**
   - Clone the repository
   - Check out the branch that failed
   - Review the error logs and context
   - Identify the root cause

2. **Implement a fix:**
   - Make necessary code changes
   - Update dependencies if needed
   - Fix configuration issues
   - Update tests if required

3. **Test the fix:**
   - Run tests locally if possible
   - Verify the fix addresses the root cause

4. **Create a pull request:**
   - Commit your changes with a clear message
   - Create a PR with description of the fix
   - Reference this deployment failure in the PR

5. **Update tracking:**
   - Log the fix details to /job/logs/deployments/
   - Include: what was wrong, what you changed, why it fixes the issue

## Safety Rules

- Always create a PR, never push directly
- Run tests before creating PR
- Keep changes minimal and focused
- Document what you changed and why

## Notes

Focus on fixing the immediate issue. If you identify larger problems, create issues for follow-up rather than expanding the scope of this fix.
`.trim();

  // Create job via event handler
  try {
    const response = await fetch(`${eventHandlerUrl}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        job: jobDescription,
        metadata: {
          type: 'deployment-fix',
          repository: `${owner}/${repo}`,
          run_id: runId,
          category: errorDetails.category,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create job: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    throw new Error(`Failed to create fix job: ${error.message}`);
  }
}

// Check if auto-fix is allowed
function isAutoFixAllowed(run, config) {
  if (!config?.auto_fix?.enabled) {
    return { allowed: false, reason: 'Auto-fix not enabled in config' };
  }
  
  // Check protected branches
  const protectedBranches = config.safety?.require_approval_for || ['production', 'main', 'master'];
  if (protectedBranches.includes(run.head_branch)) {
    return { allowed: false, reason: `Branch "${run.head_branch}" requires manual approval` };
  }
  
  // Check workflow allowlist
  const allowedWorkflows = config.auto_fix?.allowed_workflows;
  if (allowedWorkflows && allowedWorkflows.length > 0) {
    if (!allowedWorkflows.includes(run.name)) {
      return { allowed: false, reason: `Workflow "${run.name}" not in allowed list` };
    }
  }
  
  // Check rate limiting
  // (In a real implementation, you'd track fix attempts per hour)
  
  return { allowed: true };
}

// Fix a failed deployment
async function fixDeployment(owner, repo, runId, options = {}) {
  console.log(`\n🔧 Attempting to fix deployment...`);
  console.log(`Repository: ${owner}/${repo}`);
  console.log(`Run ID: ${runId}\n`);
  
  try {
    // Get run details
    const run = await getWorkflowRun(owner, repo, runId);
    
    console.log(`Workflow: ${run.name}`);
    console.log(`Status: ${run.conclusion || run.status}`);
    console.log(`Branch: ${run.head_branch}`);
    console.log(`Commit: ${run.head_sha.substring(0, 7)}`);
    
    if (run.conclusion !== 'failure') {
      console.log(`\n⚠️  Workflow is not failed (status: ${run.conclusion || run.status})`);
      return;
    }
    
    // Load config and check if auto-fix is allowed
    const config = loadConfig();
    
    if (!options.force) {
      const { allowed, reason } = isAutoFixAllowed(run, config);
      
      if (!allowed) {
        console.log(`\n❌ Auto-fix not allowed: ${reason}`);
        console.log('Use --force to override (not recommended for production)');
        return;
      }
    }
    
    // Extract error details
    console.log('\n🔍 Extracting error details...');
    const errorDetails = await extractError(owner, repo, runId);
    
    console.log(`\nError Category: ${errorDetails.category}`);
    console.log(`Error: ${errorDetails.error.split('\n')[0]}`);
    
    // Determine fix strategy
    const strategy = determineFixStrategy(errorDetails.category, config);
    console.log(`\nFix Strategy: ${strategy.name}`);
    console.log(`Actions: ${strategy.actions.join(', ')}`);
    
    // Create fix job
    console.log('\n📋 Creating fix job...');
    const job = await createFixJob(owner, repo, runId, errorDetails);
    
    console.log(`✓ Fix job created: ${job.job_id || job.branch}`);
    
    // Save log
    const logPath = saveLog('fix', {
      timestamp: new Date().toISOString(),
      repository: `${owner}/${repo}`,
      run_id: runId,
      workflow: run.name,
      branch: run.head_branch,
      commit: run.head_sha,
      error: errorDetails.error,
      category: errorDetails.category,
      strategy: strategy.name,
      job_id: job.job_id || job.branch,
      status: 'in_progress'
    });
    
    console.log(`\nLog saved: ${logPath}`);
    
    // Notify
    await notify('fix', {
      repository: `${owner}/${repo}`,
      issue: errorDetails.error.split('\n')[0],
      solution: strategy.name,
      status: 'Investigation started',
      tests_passing: false,
      approval_required: false
    });
    
    console.log('\n✓ Fix process initiated');
    console.log(`Monitor progress: check logs in /job/logs/deployments/`);
    
    return job;
    
  } catch (error) {
    console.error(`\n✗ Failed to initiate fix: ${error.message}`);
    throw error;
  }
}

// Determine fix strategy based on error category
function determineFixStrategy(category, config) {
  const strategies = {
    test_failure: {
      name: 'Fix Test Failures',
      actions: ['analyze_test_logs', 'fix_assertions', 'update_mocks', 'run_tests']
    },
    build_error: {
      name: 'Fix Build Issues',
      actions: ['check_syntax', 'resolve_imports', 'update_config', 'rebuild']
    },
    dependency_issue: {
      name: 'Fix Dependencies',
      actions: ['update_packages', 'resolve_conflicts', 'fix_lockfile', 'reinstall']
    },
    timeout: {
      name: 'Fix Timeout',
      actions: ['increase_timeout', 'optimize_process', 'split_tasks']
    },
    configuration_error: {
      name: 'Fix Configuration',
      actions: ['update_env_vars', 'fix_config_files', 'update_secrets']
    },
    unknown: {
      name: 'General Investigation',
      actions: ['analyze_logs', 'identify_cause', 'propose_solution', 'implement_fix']
    }
  };
  
  return strategies[category] || strategies.unknown;
}

// CLI
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --repo owner/repo --run-id <id> [options]')
  .option('repo', {
    alias: 'r',
    type: 'string',
    description: 'Repository (owner/repo)',
    demandOption: true
  })
  .option('run-id', {
    type: 'number',
    description: 'Workflow run ID to fix',
    demandOption: true
  })
  .option('force', {
    type: 'boolean',
    description: 'Force fix even for protected branches',
    default: false
  })
  .example('$0 --repo owner/repo --run-id 12345678')
  .example('$0 --repo owner/repo --run-id 12345678 --force')
  .help()
  .argv;

// Main
(async () => {
  try {
    const [owner, repo] = argv.repo.split('/');
    
    if (!owner || !repo) {
      console.error('Invalid repository format. Expected: owner/repo');
      process.exit(1);
    }
    
    await fixDeployment(owner, repo, argv.runId, {
      force: argv.force
    });
    
  } catch (error) {
    console.error(`\n✗ Fatal error: ${error.message}`);
    process.exit(1);
  }
})();
