#!/usr/bin/env node

import twilio from 'twilio';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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

// Get call status
async function getCallStatus(callSid) {
  const { accountSid, authToken } = getTwilioCredentials();
  const client = twilio(accountSid, authToken);

  try {
    const call = await client.calls(callSid).fetch();

    console.log('\n=== Call Status ===');
    console.log(`Call SID: ${call.sid}`);
    console.log(`Status: ${call.status}`);
    console.log(`To: ${call.to}`);
    console.log(`From: ${call.from}`);
    console.log(`Direction: ${call.direction}`);
    console.log(`Duration: ${call.duration ? `${call.duration}s` : 'N/A'}`);
    console.log(`Start Time: ${call.startTime || 'N/A'}`);
    console.log(`End Time: ${call.endTime || 'N/A'}`);
    
    if (call.price) {
      console.log(`Price: ${call.price} ${call.priceUnit}`);
    }

    // Status descriptions
    const statusDescriptions = {
      queued: 'Call is waiting to be initiated',
      ringing: 'Call is ringing',
      'in-progress': 'Call is currently active',
      completed: 'Call completed successfully',
      failed: 'Call failed to connect',
      busy: 'Number was busy',
      'no-answer': 'No one answered the call',
      canceled: 'Call was canceled'
    };

    if (statusDescriptions[call.status]) {
      console.log(`\nDescription: ${statusDescriptions[call.status]}`);
    }

    return call;
  } catch (error) {
    console.error('\n✗ Failed to fetch call status');
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// CLI
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <call-sid>')
  .demandCommand(1, 'You must provide a call SID')
  .example('$0 CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  .help()
  .argv;

getCallStatus(argv._[0]);
