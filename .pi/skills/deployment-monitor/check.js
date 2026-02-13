#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getWorkflowRuns, extractError } from './lib/github.js';
import { trackDeployment, saveLog } from './lib/tracking.js';
import { notify } from './lib/notifications.js';

// Check deployments for a repository
async function checkDeployments(owner, repo, options = {}) {
  console.log(`\n🔍 Checking deployments for ${owner}/${repo}...`);
  
  try {
    const runs = await getWorkflowRuns(owner, repo, {
      limit: options.limit || 10,
      workflow: options.workflow,
      status: options.filterStatus
    });
    
    if (runs.length === 0) {
      console.log('No workflow runs found.');
      return [];
    }
    
    console.log(`\nFound ${runs.length} workflow runs:\n`);
    
    const results = [];
    
    for (const run of runs) {
      const status = run.conclusion || run.status;
      const emoji = getStatusEmoji(status);
      
      console.log(`${emoji} ${run.name}`);
      console.log(`  Run #${run.run_number} (${run.id})`);
      console.log(`  Status: ${status}`);
      console.log(`  Branch: ${run.head_branch}`);
      console.log(`  Commit: ${run.head_sha.substring(0, 7)}`);
      console.log(`  Started: ${new Date(run.created_at).toLocaleString()}`);
      
      let duration = null;
      if (run.updated_at) {
        const start = new Date(run.created_at);
        const end = new Date(run.updated_at);
        duration = Math.round((end - start) / 1000);
        console.log(`  Duration: ${duration}s`);
      }
      
      const result = {
        repository: `${owner}/${repo}`,
        workflow: run.name,
        status: status,
        run_id: run.id,
        run_number: run.run_number,
        branch: run.head_branch,
        commit: run.head_sha,
        started_at: run.created_at,
        completed_at: run.updated_at,
        duration: duration,
        url: run.html_url
      };
      
      // If failed, extract error details
      if (status === 'failure') {
        console.log('  🔍 Extracting error details...');
        
        const errorDetails = await extractError(owner, repo, run.id);
        result.error = errorDetails.error;
        result.category = errorDetails.category;
        
        console.log(`  Error: ${errorDetails.error.split('\n')[0]}`);
        console.log(`  Category: ${errorDetails.category}`);
        
        // Track failure
        if (options.track) {
          await trackDeployment({
            ...result,
            timestamp: new Date().toISOString()
          });
        }
        
        // Notify about failure
        if (options.notifyFailures) {
          await notify('failure', {
            ...result,
            auto_fix_enabled: options.autoFix || false,
            investigating: options.autoFix
          });
        }
      } else if (status === 'success' && options.notifySuccess) {
        // Track success
        if (options.track) {
          await trackDeployment({
            ...result,
            timestamp: new Date().toISOString()
          });
        }
        
        await notify('success', result);
      }
      
      console.log('');
      results.push(result);
    }
    
    // Save check log
    if (options.log) {
      const logPath = saveLog('check', {
        timestamp: new Date().toISOString(),
        repository: `${owner}/${repo}`,
        runs: results
      });
      console.log(`Log saved: ${logPath}`);
    }
    
    return results;
    
  } catch (error) {
    console.error(`\n✗ Error checking deployments: ${error.message}`);
    throw error;
  }
}

// Get emoji for status
function getStatusEmoji(status) {
  switch (status) {
    case 'success':
    case 'completed':
      return '✅';
    case 'failure':
    case 'failed':
      return '❌';
    case 'cancelled':
      return '⚪';
    case 'in_progress':
    case 'queued':
      return '🔵';
    default:
      return '⚫';
  }
}

// Check multiple repositories
async function checkMultipleRepos(repos, options) {
  const allResults = [];
  
  for (const repoString of repos) {
    const [owner, repo] = repoString.split('/');
    
    if (!owner || !repo) {
      console.error(`Invalid repository format: ${repoString} (expected: owner/repo)`);
      continue;
    }
    
    try {
      const results = await checkDeployments(owner, repo, options);
      allResults.push(...results);
    } catch (error) {
      console.error(`Failed to check ${repoString}: ${error.message}`);
    }
  }
  
  return allResults;
}

// Watch mode - continuous monitoring
async function watchMode(repos, options) {
  console.log('\n👀 Starting watch mode (press Ctrl+C to stop)...\n');
  
  const interval = options.interval || 60; // seconds
  const seenRuns = new Set();
  
  const check = async () => {
    const results = await checkMultipleRepos(repos, {
      ...options,
      limit: 5 // Only check recent runs in watch mode
    });
    
    // Only notify about new failures
    const newFailures = results.filter(r => 
      r.status === 'failure' && !seenRuns.has(r.run_id)
    );
    
    if (newFailures.length > 0 && options.notifyFailures) {
      console.log(`\n⚠️  Found ${newFailures.length} new failure(s)!`);
    }
    
    // Remember seen runs
    results.forEach(r => seenRuns.add(r.run_id));
  };
  
  // Initial check
  await check();
  
  // Periodic checks
  setInterval(check, interval * 1000);
}

// CLI
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --repo owner/repo [options]')
  .option('repo', {
    type: 'string',
    description: 'Repository to check (owner/repo)'
  })
  .option('repos', {
    type: 'string',
    description: 'Multiple repositories (comma-separated)'
  })
  .option('workflow', {
    type: 'string',
    description: 'Filter by workflow name'
  })
  .option('limit', {
    alias: 'l',
    type: 'number',
    description: 'Number of runs to check',
    default: 10
  })
  .option('status', {
    alias: 's',
    type: 'string',
    description: 'Filter by status',
    choices: ['completed', 'in_progress', 'queued']
  })
  .option('watch', {
    alias: 'w',
    type: 'boolean',
    description: 'Continuous monitoring mode',
    default: false
  })
  .option('interval', {
    type: 'number',
    description: 'Check interval in seconds (watch mode)',
    default: 60
  })
  .option('track', {
    type: 'boolean',
    description: 'Track deployments in spreadsheet',
    default: true
  })
  .option('log', {
    type: 'boolean',
    description: 'Save check log',
    default: true
  })
  .option('notify-failures', {
    type: 'boolean',
    description: 'Send notifications for failures',
    default: false
  })
  .option('notify-success', {
    type: 'boolean',
    description: 'Send notifications for successes',
    default: false
  })
  .option('auto-fix', {
    type: 'boolean',
    description: 'Enable auto-fix for failures',
    default: false
  })
  .example('$0 --repo owner/repo')
  .example('$0 --repo owner/repo --watch --notify-failures')
  .example('$0 --repos owner/repo1,owner/repo2,owner/repo3')
  .check((argv) => {
    if (!argv.repo && !argv.repos) {
      throw new Error('Must provide --repo or --repos');
    }
    return true;
  })
  .help()
  .argv;

// Main
(async () => {
  try {
    const repos = argv.repos ? argv.repos.split(',') : [argv.repo];
    
    if (argv.watch) {
      await watchMode(repos, argv);
    } else {
      await checkMultipleRepos(repos, argv);
    }
  } catch (error) {
    console.error(`\n✗ Fatal error: ${error.message}`);
    process.exit(1);
  }
})();
