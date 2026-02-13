#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateReport } from './lib/tracking.js';
import { notify } from './lib/notifications.js';

// Generate and display report
async function displayReport(options) {
  console.log(`\n📈 Deployment Report\n`);
  
  try {
    const report = await generateReport({
      days: options.days,
      repository: options.repository,
      include_records: options.format === 'json'
    });
    
    if (report.total === 0) {
      console.log('No deployment data available.');
      return;
    }
    
    if (options.format === 'json') {
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    
    if (options.format === 'markdown') {
      displayMarkdownReport(report, options);
    } else if (options.format === 'html') {
      displayHtmlReport(report, options);
    } else {
      displayTextReport(report, options);
    }
    
    // Send notification if requested
    if (options.notify) {
      await notify('report', report);
      console.log('\n✓ Report sent via notifications');
    }
    
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

// Display text report
function displayTextReport(report, options) {
  console.log(`Period: Last ${options.days} days`);
  if (options.repository) {
    console.log(`Repository: ${options.repository}`);
  }
  console.log('');
  
  console.log(`Total Deployments: ${report.total}`);
  console.log(`Success: ${report.success} (${report.success_rate}%)`);
  console.log(`Failed: ${report.failed} (${Math.round((report.failed/report.total)*100)}%)`);
  console.log(`Average Duration: ${report.avg_duration}s`);
  console.log(`Auto-fixed: ${report.auto_fixed}`);
  console.log('');
  
  if (Object.keys(report.categories).length > 0) {
    console.log('Error Categories:');
    const sorted = Object.entries(report.categories)
      .sort((a, b) => b[1] - a[1]);
    
    for (const [category, count] of sorted) {
      const percentage = Math.round((count / report.total) * 100);
      console.log(`  ${category}: ${count} (${percentage}%)`);
    }
  }
}

// Display markdown report
function displayMarkdownReport(report, options) {
  console.log(`# Deployment Report\n`);
  console.log(`**Period:** Last ${options.days} days`);
  if (options.repository) {
    console.log(`**Repository:** ${options.repository}`);
  }
  console.log('');
  
  console.log(`## Summary\n`);
  console.log(`- **Total Deployments:** ${report.total}`);
  console.log(`- **Success:** ${report.success} (${report.success_rate}%)`);
  console.log(`- **Failed:** ${report.failed} (${Math.round((report.failed/report.total)*100)}%)`);
  console.log(`- **Average Duration:** ${report.avg_duration}s`);
  console.log(`- **Auto-fixed:** ${report.auto_fixed}`);
  console.log('');
  
  if (Object.keys(report.categories).length > 0) {
    console.log(`## Error Categories\n`);
    const sorted = Object.entries(report.categories)
      .sort((a, b) => b[1] - a[1]);
    
    for (const [category, count] of sorted) {
      const percentage = Math.round((count / report.total) * 100);
      console.log(`- **${category}:** ${count} (${percentage}%)`);
    }
  }
}

// Display HTML report
function displayHtmlReport(report, options) {
  const successRate = report.success_rate;
  const statusColor = successRate >= 90 ? 'green' : successRate >= 75 ? 'orange' : 'red';
  
  console.log(`<!DOCTYPE html>
<html>
<head>
  <title>Deployment Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .stat { display: inline-block; margin: 10px 20px; }
    .stat-label { font-weight: bold; }
    .stat-value { font-size: 24px; color: ${statusColor}; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #366092; color: white; }
  </style>
</head>
<body>
  <h1>📈 Deployment Report</h1>
  <p><strong>Period:</strong> Last ${options.days} days</p>
  ${options.repository ? `<p><strong>Repository:</strong> ${options.repository}</p>` : ''}
  
  <div class="summary">
    <div class="stat">
      <div class="stat-label">Total Deployments</div>
      <div class="stat-value">${report.total}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Success Rate</div>
      <div class="stat-value">${report.success_rate}%</div>
    </div>
    <div class="stat">
      <div class="stat-label">Avg Duration</div>
      <div class="stat-value">${report.avg_duration}s</div>
    </div>
    <div class="stat">
      <div class="stat-label">Auto-fixed</div>
      <div class="stat-value">${report.auto_fixed}</div>
    </div>
  </div>
  
  ${Object.keys(report.categories).length > 0 ? `
  <h2>Error Categories</h2>
  <table>
    <tr>
      <th>Category</th>
      <th>Count</th>
      <th>Percentage</th>
    </tr>
    ${Object.entries(report.categories)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `
    <tr>
      <td>${cat}</td>
      <td>${count}</td>
      <td>${Math.round((count/report.total)*100)}%</td>
    </tr>
    `).join('')}
  </table>
  ` : ''}
</body>
</html>`);
}

// CLI
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('days', {
    alias: 'd',
    type: 'number',
    description: 'Number of days to include',
    default: 30
  })
  .option('repo', {
    alias: 'r',
    type: 'string',
    description: 'Filter by repository (owner/repo)'
  })
  .option('format', {
    alias: 'f',
    type: 'string',
    description: 'Output format',
    choices: ['text', 'markdown', 'html', 'json'],
    default: 'text'
  })
  .option('notify', {
    alias: 'n',
    type: 'boolean',
    description: 'Send report via notifications',
    default: false
  })
  .example('$0', 'Text report for last 30 days')
  .example('$0 --format markdown --days 7', 'Markdown report for last 7 days')
  .example('$0 --repo owner/repo --format html', 'HTML report for specific repo')
  .help()
  .argv;

displayReport({
  days: argv.days,
  repository: argv.repo,
  format: argv.format,
  notify: argv.notify
});
