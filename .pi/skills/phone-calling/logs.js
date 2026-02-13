#!/usr/bin/env node

import twilio from 'twilio';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Get Twilio credentials
function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('Error: Twilio credentials not found in environment.');
    console.error('Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN');
    process.exit(1);
  }

  return { accountSid, authToken };
}

// Get local logs
function getLocalLogs(days, limit) {
  const logsDir = '/job/logs/calls';
  
  if (!existsSync(logsDir)) {
    return [];
  }

  const logs = [];
  const dates = readdirSync(logsDir).sort().reverse();

  for (const date of dates) {
    // Check if within days limit
    const logDate = new Date(date);
    const daysDiff = Math.floor((Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > days) continue;

    const dateDir = join(logsDir, date);
    const files = readdirSync(dateDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    for (const file of files) {
      if (logs.length >= limit) break;
      
      const logPath = join(dateDir, file);
      const log = JSON.parse(readFileSync(logPath, 'utf8'));
      log._date = date;
      log._file = file;
      logs.push(log);
    }

    if (logs.length >= limit) break;
  }

  return logs;
}

// Get Twilio call logs
async function getTwilioLogs(options) {
  const { accountSid, authToken } = getTwilioCredentials();
  const client = twilio(accountSid, authToken);

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - options.days);

    const params = {
      startTime: startDate,
      limit: options.limit
    };

    if (options.status) {
      params.status = options.status;
    }

    const calls = await client.calls.list(params);

    console.log(`\n=== Twilio Call Logs (Last ${options.days} days) ===\n`);

    if (calls.length === 0) {
      console.log('No calls found.');
      return;
    }

    for (const call of calls) {
      console.log(`Call SID: ${call.sid}`);
      console.log(`  To: ${call.to}`);
      console.log(`  From: ${call.from}`);
      console.log(`  Status: ${call.status}`);
      console.log(`  Duration: ${call.duration ? `${call.duration}s` : 'N/A'}`);
      console.log(`  Start: ${call.startTime || 'N/A'}`);
      if (call.price) {
        console.log(`  Price: ${call.price} ${call.priceUnit}`);
      }
      console.log('');
    }

    console.log(`Total calls: ${calls.length}`);

  } catch (error) {
    console.error('\n✗ Failed to fetch call logs');
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Display local logs
function displayLocalLogs(options) {
  const logs = getLocalLogs(options.days, options.limit);

  console.log(`\n=== Local Call Logs (Last ${options.days} days) ===\n`);

  if (logs.length === 0) {
    console.log('No local logs found.');
    return;
  }

  for (const log of logs) {
    console.log(`Date: ${log._date}`);
    console.log(`File: ${log._file}`);
    console.log(`  Call SID: ${log.callSid}`);
    console.log(`  To: ${log.to}`);
    console.log(`  From: ${log.from}`);
    if (log.template) {
      console.log(`  Template: ${log.template}`);
    }
    console.log(`  Status: ${log.status}`);
    console.log(`  Time: ${new Date(log.timestamp).toLocaleString()}`);
    console.log('');
  }

  console.log(`Total logs: ${logs.length}`);
}

// CLI
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('days', {
    alias: 'd',
    type: 'number',
    description: 'Number of days to look back',
    default: 1
  })
  .option('limit', {
    alias: 'l',
    type: 'number',
    description: 'Maximum number of results',
    default: 20
  })
  .option('status', {
    alias: 's',
    type: 'string',
    description: 'Filter by status',
    choices: ['queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled']
  })
  .option('source', {
    type: 'string',
    description: 'Log source (local or twilio)',
    choices: ['local', 'twilio'],
    default: 'local'
  })
  .example('$0', 'Show local logs from last 24 hours')
  .example('$0 --days 7 --limit 50', 'Show local logs from last 7 days')
  .example('$0 --source twilio --status completed', 'Show completed calls from Twilio')
  .help()
  .argv;

if (argv.source === 'twilio') {
  getTwilioLogs(argv);
} else {
  displayLocalLogs(argv);
}
