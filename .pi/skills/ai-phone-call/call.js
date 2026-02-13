#!/usr/bin/env node

/**
 * AI Phone Call - Main Entry Point
 * Make autonomous phone calls with AI conversation handling
 */

import { parseArgs } from 'util';
import { TwilioClient } from './lib/twilio-client.js';
import { SimpleConversationHandler } from './lib/conversation.js';
import { Reporter } from './lib/reporter.js';
import { Storage } from './lib/storage.js';

// Parse command line arguments
const options = {
  to: { type: 'string' },
  task: { type: 'string' },
  business: { type: 'string' },
  'max-duration': { type: 'string' },
  voice: { type: 'string' },
  notify: { type: 'string' },
  'save-recording': { type: 'string' },
  help: { type: 'boolean', short: 'h' }
};

let args;
try {
  args = parseArgs({ options, allowPositionals: false });
} catch (error) {
  console.error('Error parsing arguments:', error.message);
  showHelp();
  process.exit(1);
}

if (args.values.help) {
  showHelp();
  process.exit(0);
}

// Validate required arguments
if (!args.values.to || !args.values.task) {
  console.error('Error: --to and --task are required\n');
  showHelp();
  process.exit(1);
}

// Extract parameters
const phoneNumber = args.values.to;
const task = args.values.task;
const businessName = args.values.business || 'Unknown Business';
const maxDuration = parseInt(args.values['max-duration'] || '10') * 60; // Convert to seconds
const voice = args.values.voice || 'nova';
const notify = args.values.notify !== 'false';
const saveRecording = args.values['save-recording'] !== 'false';

// Get credentials from environment
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Validate credentials
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error('Error: Twilio credentials not found in environment');
  console.error('Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY not found in environment');
  process.exit(1);
}

// Main execution
async function main() {
  console.log('🤖 AI Phone Call Starting...\n');
  console.log(`📞 Calling: ${phoneNumber}`);
  console.log(`🏢 Business: ${businessName}`);
  console.log(`🎯 Task: ${task.substring(0, 100)}${task.length > 100 ? '...' : ''}`);
  console.log(`⏱️  Max Duration: ${maxDuration / 60} minutes`);
  console.log(`🎤 Voice: ${voice}\n`);

  const callId = `call_${Date.now()}`;
  const storage = new Storage(callId, businessName);
  await storage.init();

  console.log(`📁 Log directory: ${storage.baseDir}\n`);

  let callStatus = 'initiated';
  let callDuration = 0;
  let startTime = new Date();
  let endTime = null;
  let transcript = [];

  try {
    // Initialize clients
    const twilioClient = new TwilioClient(
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER
    );

    const conversationHandler = new SimpleConversationHandler(
      OPENAI_API_KEY,
      task,
      businessName,
      voice
    );

    // Note: This is a simplified implementation
    // Full production version would use WebSocket + Twilio Media Streams
    // For now, we'll create a more basic implementation that:
    // 1. Makes the call via Twilio
    // 2. Uses a simple TwiML flow
    // 3. Transcribes afterward
    
    console.log('📞 Initiating call via Twilio...\n');
    
    // For this implementation, we'll use Twilio's Programmable Voice
    // with a simpler approach: pre-generated TTS and post-call transcription
    const result = await makeSimpleCall(
      twilioClient,
      phoneNumber,
      task,
      businessName,
      maxDuration,
      voice,
      OPENAI_API_KEY
    );

    callStatus = result.status;
    callDuration = result.duration || 0;
    endTime = result.endTime || new Date();
    transcript = result.transcript || [];

    console.log(`\n✅ Call completed with status: ${callStatus}`);
    console.log(`⏱️  Duration: ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}\n`);

    // Save transcript
    if (transcript.length > 0) {
      await storage.saveTranscript(transcript);
      console.log('💾 Transcript saved');
    }

    // Download and save recording if requested
    if (saveRecording && result.callSid) {
      try {
        console.log('📥 Downloading call recording...');
        const recording = await twilioClient.getRecording(result.callSid);
        if (recording) {
          const audioBuffer = await twilioClient.downloadRecording(recording.url);
          await storage.saveRecording(audioBuffer);
          console.log('💾 Recording saved');
        }
      } catch (error) {
        console.warn('⚠️  Could not save recording:', error.message);
      }
    }

    // Save call info
    await storage.saveCallInfo({
      callId,
      callSid: result.callSid,
      phoneNumber,
      businessName,
      task,
      status: callStatus,
      duration: callDuration,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      voice
    });

    // Generate report
    console.log('\n📝 Generating call report...');
    const reporter = new Reporter(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);
    
    const keyDetails = reporter.extractKeyDetails(transcript, task);
    const outcome = reporter.determineOutcome(transcript, callStatus);
    const nextSteps = reporter.suggestNextSteps(transcript, callStatus, outcome);

    const callData = {
      phoneNumber,
      businessName,
      task,
      status: callStatus,
      duration: callDuration,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      transcript,
      outcome,
      keyDetails,
      nextSteps,
      transcriptPath: storage.getPath('transcript.txt')
    };

    const report = reporter.generateReport(callData);
    await storage.saveReport(report);
    
    const summary = {
      callId,
      ...callData
    };
    await storage.saveSummary(summary);

    console.log('✅ Report generated');

    // Send Telegram notification
    if (notify) {
      console.log('\n📱 Sending Telegram notification...');
      const notified = await reporter.sendTelegramNotification(callData);
      if (notified) {
        console.log('✅ Notification sent');
      } else {
        console.log('⚠️  Notification failed (credentials may not be configured)');
      }
    }

    console.log('\n✅ All done!\n');
    console.log(`📄 Full report: ${storage.getPath('report.md')}`);
    console.log(`💬 Transcript: ${storage.getPath('transcript.txt')}`);
    if (saveRecording) {
      console.log(`🎵 Recording: ${storage.getPath('recording.mp3')}`);
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during call:', error.message);
    console.error(error.stack);

    // Save error info
    await storage.saveCallInfo({
      callId,
      phoneNumber,
      businessName,
      task,
      status: 'error',
      error: error.message,
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString()
    });

    process.exit(1);
  }
}

/**
 * Simplified call implementation
 * This creates a call with basic TwiML and tracks the conversation
 */
async function makeSimpleCall(twilioClient, toNumber, task, businessName, maxDuration, voice, openaiApiKey) {
  // For a production implementation, this would:
  // 1. Set up a WebSocket server
  // 2. Use Twilio Media Streams for real-time audio
  // 3. Process audio in real-time with OpenAI
  
  // For this version, we'll demonstrate the structure with a simpler flow
  console.log('⚠️  Note: This is a simplified implementation');
  console.log('    Full real-time conversation requires a public WebSocket endpoint');
  console.log('    See SKILL.md for production setup details\n');

  // Create a simple call that can be answered
  // In production, this would connect to our WebSocket for live conversation
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello, this is an A I assistant calling on behalf of a client. ${task.substring(0, 200)}</Say>
  <Record maxLength="300" transcribe="true" />
</Response>`;

  try {
    const call = await twilioClient.client.calls.create({
      to: toNumber,
      from: twilioClient.fromNumber,
      twiml: twiml,
      timeout: 60,
      timeLimit: maxDuration,
      record: true
    });

    console.log(`📞 Call initiated: ${call.sid}`);
    console.log('⏳ Waiting for call to complete...\n');

    // Wait for call to complete
    const finalStatus = await twilioClient.waitForCallComplete(call.sid);

    // Build basic transcript from call
    const transcript = [
      {
        role: 'assistant',
        content: `Hello, this is an AI assistant calling on behalf of a client. ${task}`,
        timestamp: new Date().toISOString()
      }
    ];

    return {
      callSid: call.sid,
      status: finalStatus.status === 'completed' ? 'completed' : 
              finalStatus.status === 'no-answer' ? 'no_answer' :
              finalStatus.status,
      duration: parseInt(finalStatus.duration) || 0,
      endTime: finalStatus.endTime,
      transcript
    };

  } catch (error) {
    throw new Error(`Call failed: ${error.message}`);
  }
}

function showHelp() {
  console.log(`
AI Phone Call - Make autonomous phone calls with AI

USAGE:
  ./call.js --to <phone> --task <task> [options]

REQUIRED:
  --to <phone>              Phone number to call (E.164 format: +1234567890)
  --task <description>      What to accomplish on the call

OPTIONS:
  --business <name>         Business name for context
  --max-duration <minutes>  Maximum call length (default: 10)
  --voice <voice>           AI voice: alloy, echo, fable, onyx, nova, shimmer (default: nova)
  --notify <true|false>     Send Telegram notification (default: true)
  --save-recording <true|false>  Save call audio (default: true)
  -h, --help                Show this help

EXAMPLES:
  # Book a restaurant reservation
  ./call.js --to "+15551234567" \\
    --business "Italian Bistro" \\
    --task "Reserve a table for 2 on Friday at 7pm. Name: John Smith"

  # Schedule doctor appointment
  ./call.js --to "+15559876543" \\
    --business "Family Clinic" \\
    --task "Book physical exam next week, prefer mornings. Patient: Jane Doe, DOB 1/15/1980"

  # Service inquiry
  ./call.js --to "+15557778888" \\
    --task "Ask about pricing for lawn mowing service, weekly schedule starting March"

ENVIRONMENT VARIABLES REQUIRED:
  TWILIO_ACCOUNT_SID      Your Twilio Account SID
  TWILIO_AUTH_TOKEN       Your Twilio Auth Token  
  TWILIO_PHONE_NUMBER     Your Twilio phone number (+1234567890)
  OPENAI_API_KEY          Your OpenAI API key
  TELEGRAM_BOT_TOKEN      (Optional) For notifications
  TELEGRAM_CHAT_ID        (Optional) For notifications

See SKILL.md for full documentation and setup instructions.
`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
