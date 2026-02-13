#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getDeploymentHistory } from './lib/tracking.js';

// Display deployment history
async function displayHistory(options) {
  console.log(`\n📊 Deployment History (Last ${options.days} days)\n`);
  
  try {
    const records = await getDeploymentHistory({
      days: options.days,
      repository: options.repository,
      status: options.status
    });
    
    if (records.length === 0) {
      console.log('No deployment records found.');
      return;
    }
    
    console.log(`Found ${records.length} deployments:\n`);
    
    for (const record of records) {
      const emoji = record.status === 'success' || record.status === 'completed' ? '✅' : '❌';
      const date = new Date(record.timestamp).toLocaleString();
      
      console.log(`${emoji} ${record.repository} - ${record.workflow}`);
      console.log(`   Time: ${date}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Branch: ${record.branch}`);
      console.log(`   Commit: ${record.commit}`);
      
      if (record.duration) {
        console.log(`   Duration: ${record.duration}s`);
      }
      
      if (record.error) {
        console.log(`   Error: ${record.error.split('\n')[0]}`);
        console.log(`   Category: ${record.category}`);
      }
      
      if (record.auto_fixed) {
        console.log(`   🔧 Auto-fixed: Yes`);
      }
      
      console.log('');
    }
    
    // Summary stats
    const total = records.length;
    const success = records.filter(r => r.status === 'success' || r.status === 'completed').length;
    const failed = records.filter(r => r.status === 'failure' || r.status === 'failed').length;
    const autoFixed = records.filter(r => r.auto_fixed).length;
    
    console.log('=== Summary ===');
    console.log(`Total: ${total}`);
    console.log(`Success: ${success} (${Math.round((success/total)*100)}%)`);
    console.log(`Failed: ${failed} (${Math.round((failed/total)*100)}%)`);
    console.log(`Auto-fixed: ${autoFixed}`);
    
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

// CLI
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('days', {
    alias: 'd',
    type: 'number',
    description: 'Number of days to look back',
    default: 30
  })
  .option('repo', {
    alias: 'r',
    type: 'string',
    description: 'Filter by repository (owner/repo)'
  })
  .option('status', {
    alias: 's',
    type: 'string',
    description: 'Filter by status',
    choices: ['success', 'failure', 'completed', 'failed']
  })
  .example('$0', 'Show last 30 days')
  .example('$0 --days 7', 'Show last 7 days')
  .example('$0 --repo owner/repo --status failure', 'Show failures for specific repo')
  .help()
  .argv;

displayHistory({
  days: argv.days,
  repository: argv.repo,
  status: argv.status
});
