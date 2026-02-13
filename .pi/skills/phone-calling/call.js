#!/usr/bin/env node

import twilio from 'twilio';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load templates
const TEMPLATES = {
  reservation: {
    description: 'Restaurant reservation',
    script: (data) => ({
      steps: [
        { action: 'say', text: `Hello, I'd like to make a reservation at ${data.restaurant}.` },
        { action: 'wait', seconds: 2 },
        { action: 'say', text: `For ${data.party_size} people on ${data.date} at ${data.time}.` },
        { action: 'wait', seconds: 2 },
        { action: 'say', text: `The name is ${data.name}.` },
        { action: 'wait', seconds: 2 },
        { action: 'say', text: data.phone ? `You can call me back at ${data.phone}. Thank you.` : 'Thank you.' }
      ]
    })
  },
  support: {
    description: 'Customer support call',
    script: (data) => ({
      steps: [
        { action: 'say', text: `Hello, I'm calling ${data.company} regarding ${data.issue}.` },
        { action: 'wait', seconds: 3 },
        ...(data.account ? [{ action: 'say', text: `My account number is ${data.account}.` }] : []),
        { action: 'wait', seconds: 2 }
      ]
    })
  },
  inquiry: {
    description: 'General inquiry',
    script: (data) => ({
      steps: [
        { action: 'say', text: `Hello, I'm calling ${data.business}.` },
        { action: 'wait', seconds: 2 },
        { action: 'say', text: data.question },
        { action: 'wait', seconds: 3 }
      ]
    })
  },
  appointment: {
    description: 'Schedule appointment',
    script: (data) => ({
      steps: [
        { action: 'say', text: `Hello, I'd like to schedule an appointment at ${data.business}.` },
        { action: 'wait', seconds: 2 },
        { action: 'say', text: `For ${data.service}, preferably ${data.date} at ${data.time}.` },
        { action: 'wait', seconds: 2 },
        { action: 'say', text: `My name is ${data.name}, and my phone number is ${data.phone}.` },
        { action: 'wait', seconds: 2 }
      ]
    })
  },
  followup: {
    description: 'Follow up call',
    script: (data) => ({
      steps: [
        { action: 'say', text: `Hello, I'm calling ${data.business} to follow up on ${data.reference}.` },
        { action: 'wait', seconds: 2 },
        { action: 'say', text: data.reason },
        { action: 'wait', seconds: 3 }
      ]
    })
  }
};

// Get Twilio credentials from environment
function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    console.error('Error: Twilio credentials not found in environment.');
    console.error('Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
    console.error('\nAdd these to LLM_SECRETS in your GitHub repository secrets.');
    process.exit(1);
  }

  return { accountSid, authToken, phoneNumber };
}

// Build TwiML for call script
function buildTwiML(script, voice = 'Polly.Amy') {
  let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>';
  
  for (const step of script.steps) {
    switch (step.action) {
      case 'say':
        twiml += `<Say voice="${voice}">${escapeXml(step.text)}</Say>`;
        break;
      case 'pause':
      case 'wait':
        twiml += `<Pause length="${step.seconds || 1}"/>`;
        break;
      case 'press':
        twiml += `<Play digits="${step.digit}"/>`;
        break;
      case 'gather':
        twiml += `<Gather input="speech" timeout="${step.timeout || 5}" speechTimeout="auto">`;
        if (step.prompt) {
          twiml += `<Say voice="${voice}">${escapeXml(step.prompt)}</Say>`;
        }
        twiml += `</Gather>`;
        break;
      case 'listen':
        twiml += `<Pause length="${step.seconds || 5}"/>`;
        break;
    }
  }
  
  twiml += '</Response>';
  return twiml;
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Save call log
function saveCallLog(callData) {
  const date = new Date().toISOString().split('T')[0];
  const logDir = join('/job/logs/calls', date);
  
  mkdirSync(logDir, { recursive: true });
  
  // Find next call number for today
  const files = require('fs').readdirSync(logDir);
  const callNumbers = files
    .filter(f => f.startsWith('call-') && f.endsWith('.json'))
    .map(f => parseInt(f.match(/call-(\d+)/)?.[1] || '0'))
    .filter(n => !isNaN(n));
  
  const nextNumber = callNumbers.length > 0 ? Math.max(...callNumbers) + 1 : 1;
  const filename = `call-${String(nextNumber).padStart(3, '0')}-${callData.template || 'custom'}.json`;
  
  const logPath = join(logDir, filename);
  writeFileSync(logPath, JSON.stringify(callData, null, 2));
  
  console.log(`\nCall log saved: ${logPath}`);
  return logPath;
}

// Make the call
async function makeCall(options) {
  const { accountSid, authToken, phoneNumber } = getTwilioCredentials();
  const client = twilio(accountSid, authToken);

  let script;
  let templateName;

  // Determine script
  if (options.template) {
    templateName = options.template;
    const template = TEMPLATES[options.template];
    if (!template) {
      console.error(`Error: Unknown template "${options.template}"`);
      console.error(`Available templates: ${Object.keys(TEMPLATES).join(', ')}`);
      process.exit(1);
    }
    
    const data = options.data ? JSON.parse(options.data) : {};
    script = template.script(data);
  } else if (options.script) {
    script = JSON.parse(options.script);
  } else if (options.say) {
    script = {
      steps: [
        { action: 'say', text: options.say }
      ]
    };
  } else {
    console.error('Error: Must provide --say, --template, or --script');
    process.exit(1);
  }

  // Build TwiML
  const twiml = buildTwiML(script, options.voice);
  
  console.log('\n=== Making Call ===');
  console.log(`To: ${options.to}`);
  console.log(`From: ${options.from || phoneNumber}`);
  if (templateName) {
    console.log(`Template: ${templateName}`);
  }
  console.log('\n=== TwiML ===');
  console.log(twiml);
  console.log('\n=== Initiating Call ===');

  try {
    const call = await client.calls.create({
      to: options.to,
      from: options.from || phoneNumber,
      twiml: twiml,
      timeout: options.timeout || 120,
      record: options.record || false,
      statusCallback: options.webhook,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });

    console.log(`\n✓ Call initiated successfully`);
    console.log(`Call SID: ${call.sid}`);
    console.log(`Status: ${call.status}`);

    // Save log
    const logData = {
      callSid: call.sid,
      to: options.to,
      from: options.from || phoneNumber,
      template: templateName,
      data: options.data ? JSON.parse(options.data) : null,
      script: script,
      twiml: twiml,
      status: call.status,
      timestamp: new Date().toISOString(),
      record: options.record || false
    };

    saveCallLog(logData);

    console.log(`\nCheck status with: ${__dirname}/status.js ${call.sid}`);

    return call;
  } catch (error) {
    console.error('\n✗ Call failed');
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// CLI
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --to <number> [options]')
  .option('to', {
    alias: 't',
    type: 'string',
    description: 'Phone number to call (E.164 format)',
    demandOption: true
  })
  .option('say', {
    alias: 's',
    type: 'string',
    description: 'Simple text to speak'
  })
  .option('template', {
    type: 'string',
    description: 'Call template (reservation, support, inquiry, appointment, followup)',
    choices: Object.keys(TEMPLATES)
  })
  .option('data', {
    type: 'string',
    description: 'JSON data for template'
  })
  .option('script', {
    type: 'string',
    description: 'Custom JSON script'
  })
  .option('from', {
    type: 'string',
    description: 'Override Twilio phone number'
  })
  .option('voice', {
    type: 'string',
    description: 'TTS voice (default: Polly.Amy)',
    default: 'Polly.Amy'
  })
  .option('timeout', {
    type: 'number',
    description: 'Call timeout in seconds',
    default: 120
  })
  .option('record', {
    type: 'boolean',
    description: 'Record the call',
    default: false
  })
  .option('webhook', {
    type: 'string',
    description: 'Webhook URL for status updates'
  })
  .example('$0 --to +15551234567 --say "Hello, this is a test"')
  .example('$0 --to +15551234567 --template reservation --data \'{"restaurant":"Olive Garden","date":"Friday","time":"7 PM","party_size":4,"name":"John"}\'')
  .help()
  .argv;

makeCall(argv);
