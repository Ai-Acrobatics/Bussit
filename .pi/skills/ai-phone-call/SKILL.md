---
name: ai-phone-call
description: Make autonomous phone calls for appointment booking, service inquiries, and business conversations. Handles dynamic conversations with real-time AI, full transcription, and Telegram reporting.
---

# AI Phone Call

Make outbound phone calls with autonomous AI conversation handling. Perfect for booking appointments, calling businesses, making service inquiries, or any phone-based task.

## Features

- **Dynamic Conversations**: No scripts - AI adapts to any business type or scenario
- **Real-time Processing**: Speech recognition and synthesis for natural conversations
- **Full Transcription**: Complete conversation logs with timestamps
- **Smart Reporting**: Detailed reports sent via Telegram immediately after calls
- **Flexible Tasks**: Handle any calling scenario with simple task descriptions

## Setup

### Required API Keys

Add these to your repository's `LLM_SECRETS` (base64-encoded JSON):

```json
{
  "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxx",
  "TWILIO_AUTH_TOKEN": "your_auth_token",
  "TWILIO_PHONE_NUMBER": "+1234567890",
  "OPENAI_API_KEY": "sk-proj-xxxxxx",
  "TELEGRAM_BOT_TOKEN": "your_bot_token",
  "TELEGRAM_CHAT_ID": "your_chat_id"
}
```

### Getting API Keys

1. **Twilio** (Phone Service):
   - Sign up at https://www.twilio.com/try-twilio
   - Get $15 free credit (enough for ~30 minutes of calls)
   - Find Account SID and Auth Token in console dashboard
   - Purchase a phone number (~$1/month) or use trial number
   - Note: Trial accounts can only call verified numbers

2. **OpenAI** (Conversational AI):
   - Sign up at https://platform.openai.com/
   - Create an API key under API Keys section
   - Add credits to your account (calls use GPT-4 + Whisper + TTS)
   - Cost: ~$0.10-0.30 per minute of conversation

3. **Telegram** (For reports):
   - Already configured if you're using thepopebot's Telegram integration
   - Bot token and chat ID from your existing setup

### Installation

```bash
cd {baseDir}
npm install
```

## Usage

### Basic Call

```bash
{baseDir}/call.js --to "+15551234567" --task "Call this restaurant and ask if they have availability for dinner tonight at 7pm for 2 people"
```

### Appointment Booking

```bash
{baseDir}/call.js \
  --to "+15559876543" \
  --business "Dr. Smith's Dental Office" \
  --task "Book a dental cleaning appointment for next week, preferably Tuesday or Wednesday afternoon. My name is John Doe, DOB 01/15/1985, phone 555-123-4567."
```

### Service Inquiry

```bash
{baseDir}/call.js \
  --to "+15551112222" \
  --business "ABC Plumbing" \
  --task "Ask about their hourly rates for emergency plumbing service and if they can come today for a leaking pipe."
```

### Reservation with Preferences

```bash
{baseDir}/call.js \
  --to "+15553334444" \
  --business "The Italian Place" \
  --task "Make a reservation for Friday night at 8pm for 4 people. Request a quiet table if possible. Name: Sarah Johnson, phone: 555-999-8888." \
  --max-duration 5
```

### Options

- `--to <phone>` - Phone number to call (E.164 format: +1234567890) [REQUIRED]
- `--task <description>` - What you want to accomplish on the call [REQUIRED]
- `--business <name>` - Business name (helps AI understand context) [optional]
- `--max-duration <minutes>` - Maximum call length in minutes (default: 10)
- `--voice <voice>` - AI voice to use: alloy, echo, fable, onyx, nova, shimmer (default: nova)
- `--notify` - Send Telegram notification when call completes (default: true)
- `--save-recording` - Save call audio file (default: true)

## How It Works

1. **Call Setup**: Creates Twilio call to target number
2. **AI Connection**: Establishes WebSocket for real-time AI conversation
3. **Live Conversation**: AI listens, understands context, and responds naturally
4. **Transcription**: Full conversation logged in real-time
5. **Smart Completion**: AI knows when objective is achieved or call should end
6. **Report Generation**: Detailed summary created and sent via Telegram
7. **File Storage**: Transcripts and recordings saved to `logs/phone-calls/`

## Conversation AI Capabilities

The AI can handle:

- **Natural greetings and introductions**
- **Answering questions** about caller identity, purpose, contact info
- **Providing information** from the task description
- **Asking follow-up questions** to clarify details
- **Handling objections** or alternative suggestions
- **Negotiating times/dates** for appointments
- **Taking notes** of important information provided
- **Recognizing completion** and ending gracefully
- **Handling transfers** to voicemail or other people
- **Dealing with mistakes** and repeating information

## Call Reports

After each call, you receive a Telegram message with:

```
📞 Call Complete: Dr. Smith's Dental Office

✅ Status: Success
📱 Number: +15559876543
⏱️ Duration: 3:24
📅 Timestamp: 2024-02-13 15:30 UTC

🎯 Objective:
Book a dental cleaning appointment for next week

✅ Outcome:
Appointment booked for Tuesday, Feb 20 at 2:30pm

📝 Key Details:
- Appointment: Tuesday, Feb 20, 2:30pm
- Patient: John Doe (DOB: 01/15/1985)
- Confirmation: Will receive reminder text
- Location: 123 Main St

💬 Full transcript available at:
logs/phone-calls/2024-02-13_153045_dental_office/transcript.txt
```

## File Organization

```
logs/phone-calls/
└── YYYY-MM-DD_HHMMSS_business_name/
    ├── call-info.json          # Metadata (phone, duration, status)
    ├── transcript.txt          # Full conversation transcript
    ├── transcript.json         # Structured transcript with timestamps
    ├── recording.mp3           # Call audio (if --save-recording)
    ├── report.md               # Detailed call report
    └── summary.json            # Structured outcome data
```

## Handling Different Scenarios

### Voicemail

If the call goes to voicemail, the AI will:
- Leave a brief message with callback number
- Log as "voicemail" status
- Suggest retry times in report

### Busy/No Answer

- Automatically logged as "no_answer" or "busy"
- No charges for failed connections
- Retry suggestions in report

### Call Transfers

- AI can handle being transferred to another person
- Maintains context and continues conversation
- Notes transfer in transcript

### Language Barriers

- AI can request to speak with English speaker (if needed)
- Patient and polite when understanding is difficult
- May suggest callback or alternative contact method

### Complex Multi-Step Tasks

- AI breaks down complex requests into conversation steps
- Tracks what information has been gathered
- Asks clarifying questions when needed

## Examples

### Doctor Appointment
```bash
{baseDir}/call.js --to "+15551234567" \
  --business "Family Health Clinic" \
  --task "Schedule annual physical for John Smith (DOB 3/15/1980). Prefer morning appointments next week. Insurance: Blue Cross PPO. Phone: 555-111-2222"
```

### Restaurant Reservation
```bash
{baseDir}/call.js --to "+15559876543" \
  --business "Sakura Sushi" \
  --task "Reservation for tomorrow (Feb 14) at 7pm, party of 6. Ask about omakase menu availability. Contact: Mary Chen, 555-333-4444"
```

### Service Quote
```bash
{baseDir}/call.js --to "+15557778888" \
  --business "Green Thumb Landscaping" \
  --task "Get quote for weekly lawn mowing service. Property size: 1/4 acre, starting in March. Ask about package deals. Address: 456 Oak Lane"
```

### Veterinary Appointment
```bash
{baseDir}/call.js --to "+15552223333" \
  --business "Pet Care Veterinary" \
  --task "New patient appointment for dog (Max, 2yr old Golden Retriever). Needs vaccination checkup. Owner: Lisa Brown, 555-444-5555. Prefer afternoons."
```

## Testing

Use the test framework to verify functionality:

```bash
# Test call with mock responses (no actual call)
{baseDir}/test.js --scenario appointment_booking

# Test with real call to your own number
{baseDir}/call.js --to "+15551234567" --task "This is a test call. Please say 'test successful' and hang up." --max-duration 1

# List available test scenarios
{baseDir}/test.js --list
```

## Pricing Estimate

Based on typical usage with Twilio + OpenAI:

- **Short calls** (1-3 min): $0.15 - $0.40
- **Medium calls** (3-7 min): $0.40 - $0.80
- **Long calls** (7-10 min): $0.80 - $1.20

Breakdown:
- Twilio: ~$0.013/min for calls + $0.005/min for recording
- OpenAI GPT-4-turbo: ~$0.01-0.02 per call (tokens)
- OpenAI Whisper (STT): ~$0.006/min
- OpenAI TTS: ~$0.015/min

## Troubleshooting

### "Call failed to connect"
- Verify phone number is in E.164 format (+1234567890)
- Check Twilio account has sufficient credits
- If trial account, verify number is verified in Twilio console

### "AI not responding"
- Check OpenAI API key is valid and has credits
- Verify network connectivity
- Check logs for WebSocket connection errors

### "No Telegram notification"
- Verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set
- Check bot has permissions to send messages
- Use `--notify false` to disable if not needed

### "Recording not saved"
- Verify write permissions to logs/ directory
- Check disk space available
- Use `--save-recording false` if not needed

## Limitations

- **Trial Twilio accounts**: Can only call verified phone numbers
- **Business hours**: More successful during business operating hours
- **Language**: Currently optimized for English conversations
- **Call length**: Default 10-minute maximum (configurable)
- **Complexity**: Very complex multi-step negotiations may need human follow-up

## Privacy & Ethics

- **Consent**: Only call businesses where calling is appropriate
- **Honesty**: AI identifies as an AI assistant when asked
- **Recording**: Complies with one-party consent laws (caller consent)
- **Data**: All transcripts stored locally, not shared
- **Purpose**: Designed for legitimate business communications only

## Advanced Usage

### Custom System Prompt

Create a custom prompt file for specialized scenarios:

```bash
{baseDir}/call.js --to "+15551234567" \
  --task "$(cat my-task.txt)" \
  --prompt-file custom-prompt.txt
```

### Integration with Jobs

Use in a thepopebot job:

```markdown
Use the ai-phone-call skill to book dentist appointment:

/job/.pi/skills/ai-phone-call/call.js \
  --to "+15559876543" \
  --business "Downtown Dental" \
  --task "Book cleaning appointment for next week, Tuesday or Wednesday afternoon preferred. Patient: John Doe, 555-111-2222"

Then summarize the outcome in your job report.
```

### Batch Calling

Make multiple calls in sequence (script example):

```bash
#!/bin/bash
# call-list.sh
while IFS=',' read -r phone business task; do
  {baseDir}/call.js --to "$phone" --business "$business" --task "$task"
  sleep 60  # Wait between calls
done < call-list.csv
```

## When to Use

- ✅ Booking appointments (medical, service, personal)
- ✅ Making reservations (restaurants, hotels, venues)
- ✅ Service inquiries (pricing, availability, hours)
- ✅ Follow-up calls (checking order status, confirmations)
- ✅ Information gathering (business details, requirements)
- ✅ Simple scheduling (arranging meetings, callbacks)

## When NOT to Use

- ❌ Emergency services (911, urgent medical)
- ❌ Unsolicited sales/marketing
- ❌ Personal relationships (friends, family)
- ❌ Legal/official proceedings
- ❌ Sensitive personal matters requiring human judgment
- ❌ Any situation where AI assistance would be inappropriate

## Support

Issues or improvements? The skill is designed to be:
- **Self-contained**: All logic in this directory
- **Well-documented**: Code comments explain every step
- **Extensible**: Easy to add new features or providers
- **Debuggable**: Detailed logging at every stage

For debugging, check:
- `logs/phone-calls/latest/` - Most recent call logs
- Error messages in terminal output
- Twilio console for call status and logs
- OpenAI usage dashboard for API issues
