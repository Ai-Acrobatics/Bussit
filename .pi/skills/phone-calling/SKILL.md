---
name: phone-calling
description: Make outbound phone calls using Twilio. Handle reservations, customer support, inquiries, and automated phone tasks with text-to-speech and speech-to-text capabilities.
---

# Phone Calling Skill

Make and manage outbound phone calls using Twilio's API. This skill enables thepopebot to make calls on your behalf for reservations, customer support, inquiries, and other phone-based tasks.

## Setup

### 1. Twilio Account

1. Sign up at https://www.twilio.com
2. Get a phone number from the Twilio console
3. Obtain your Account SID and Auth Token

### 2. Add Credentials to LLM_SECRETS

Add these credentials to your `LLM_SECRETS` in GitHub repository secrets:

```json
{
  "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxx",
  "TWILIO_AUTH_TOKEN": "your-auth-token",
  "TWILIO_PHONE_NUMBER": "+1234567890"
}
```

Update the repository secret:
```bash
# Encode the JSON
echo -n '{"TWILIO_ACCOUNT_SID":"ACxxx...","TWILIO_AUTH_TOKEN":"xxx","TWILIO_PHONE_NUMBER":"+1xxx"}' | base64
```

### 3. Install Dependencies

```bash
cd {baseDir}
npm install
```

## Making Calls

### Basic Call with TTS

```bash
{baseDir}/call.js --to "+15551234567" --say "Hello, this is a test call from thepopebot."
```

### Restaurant Reservation

```bash
{baseDir}/call.js --to "+15551234567" --template reservation \
  --data '{"restaurant":"Olive Garden","date":"Friday","time":"7 PM","party_size":4,"name":"John Smith"}'
```

### Customer Support Call

```bash
{baseDir}/call.js --to "+18005551234" --template support \
  --data '{"company":"Acme Corp","issue":"billing question","account":"12345"}'
```

### General Inquiry

```bash
{baseDir}/call.js --to "+15551234567" --template inquiry \
  --data '{"business":"ABC Store","question":"What are your hours?"}'
```

### Custom Script with Menu Navigation

```bash
{baseDir}/call.js --to "+18005551234" --script '{
  "steps": [
    {"action": "say", "text": "Hello, I need help with my account"},
    {"action": "press", "digit": "1"},
    {"action": "wait", "seconds": 3},
    {"action": "say", "text": "My account number is 12345"},
    {"action": "press", "digit": "2"}
  ]
}'
```

## Options

- `--to <number>` - Phone number to call (E.164 format: +1234567890)
- `--say <text>` - Simple text to speak (uses TTS)
- `--template <name>` - Use a predefined call template
- `--data <json>` - Data for template (JSON string)
- `--script <json>` - Custom call script with steps
- `--from <number>` - Override default Twilio number
- `--timeout <seconds>` - Call timeout (default: 120)
- `--record` - Record the call audio
- `--webhook <url>` - Webhook URL for call status updates

## Call Templates

### reservation
Makes a restaurant reservation. Required data:
```json
{
  "restaurant": "Restaurant Name",
  "date": "Friday evening" | "Tomorrow",
  "time": "7 PM" | "7:00 PM",
  "party_size": 2,
  "name": "Your Name",
  "phone": "+1234567890" (optional, for callback)
}
```

### support
Customer support call. Required data:
```json
{
  "company": "Company Name",
  "issue": "Brief description of issue",
  "account": "Account number" (optional)
}
```

### inquiry
General business inquiry. Required data:
```json
{
  "business": "Business Name",
  "question": "What would you like to ask?"
}
```

### appointment
Schedule an appointment. Required data:
```json
{
  "business": "Business Name",
  "service": "Type of service",
  "date": "Preferred date",
  "time": "Preferred time",
  "name": "Your Name",
  "phone": "+1234567890"
}
```

### followup
Follow up on previous communication. Required data:
```json
{
  "business": "Business Name",
  "reference": "Order/ticket/reference number",
  "reason": "Reason for follow-up"
}
```

## Call Scripts

Custom scripts support these actions:

- `{"action": "say", "text": "Hello"}` - Speak text using TTS
- `{"action": "press", "digit": "1"}` - Press DTMF digit (0-9, *, #)
- `{"action": "wait", "seconds": 3}` - Pause for N seconds
- `{"action": "gather", "prompt": "Say yes or no", "timeout": 5}` - Gather speech input
- `{"action": "listen", "seconds": 10}` - Listen without prompt

## Checking Call Status

```bash
{baseDir}/status.js <call-sid>
```

Returns call status: queued, ringing, in-progress, completed, failed, busy, no-answer

## View Call Logs

```bash
{baseDir}/logs.js                    # Recent calls (last 24 hours)
{baseDir}/logs.js --days 7           # Last 7 days
{baseDir}/logs.js --limit 50         # Limit results
{baseDir}/logs.js --status completed # Filter by status
```

## Best Practices

### Before Making a Call

1. **Verify the number format** - Use E.164 format (+1234567890)
2. **Check business hours** - Don't call outside business hours
3. **Prepare information** - Have all necessary details ready
4. **Test with your own number first** - Verify the script works

### During Call Flow

1. **Use appropriate pauses** - Give time for IVR menus and humans to respond
2. **Handle menu navigation** - Know the menu structure if possible
3. **Be concise** - Keep messages clear and brief
4. **Provide callback info** - Always include a callback number

### After the Call

1. **Check call status** - Verify the call completed successfully
2. **Log the outcome** - Save results to logs/
3. **Follow up if needed** - Create follow-up tasks for unsuccessful calls

## Error Handling

The skill handles these scenarios:

- **Busy signal** - Call status will be "busy"
- **No answer** - Call status will be "no-answer"
- **Voicemail** - Leaves message if voicemail is detected
- **Invalid number** - Call fails with error
- **Network issues** - Retry with exponential backoff

## Call Logs

All calls are logged to `/job/logs/calls/YYYY-MM-DD/`:

```
logs/calls/2026-02-13/
  ├── call-001-reservation.json
  ├── call-002-support.json
  └── call-003-inquiry.json
```

Each log contains:
- Call SID
- To/From numbers
- Duration
- Status
- Template used
- Data provided
- Timestamp
- Recording URL (if recorded)

## Voice Settings

Default voice is Polly.Amy (British English female). To change:

```bash
{baseDir}/call.js --to "+1234567890" --say "Hello" --voice "Polly.Matthew"
```

Available voices: https://www.twilio.com/docs/voice/twiml/say/text-speech#amazon-polly

## Security Notes

- Credentials are stored in LLM_SECRETS (accessible to the agent)
- Call recordings contain sensitive information - handle carefully
- Never log phone numbers to public locations
- Be aware of Twilio usage costs
- Comply with TCPA and local regulations

## Common Use Cases

### Restaurant Reservation
```bash
{baseDir}/call.js --to "+15551234567" --template reservation \
  --data '{"restaurant":"Olive Garden","date":"Friday","time":"7 PM","party_size":4,"name":"John Smith","phone":"+15559876543"}'
```

### Check Business Hours
```bash
{baseDir}/call.js --to "+15551234567" --template inquiry \
  --data '{"business":"ABC Store","question":"What are your hours of operation?"}'
```

### Customer Support
```bash
{baseDir}/call.js --to "+18005551234" --template support \
  --data '{"company":"Acme Corp","issue":"Need to check order status","account":"ORD-12345"}'
```

### Schedule Appointment
```bash
{baseDir}/call.js --to "+15551234567" --template appointment \
  --data '{"business":"City Dental","service":"cleaning","date":"next week","time":"morning","name":"Jane Doe","phone":"+15559876543"}'
```

## Troubleshooting

### Credentials Not Found
```bash
# Check if credentials are available
/job/.pi/skills/llm-secrets/llm-secrets.js | grep TWILIO
```

### Call Failed
```bash
# Check call status
{baseDir}/status.js <call-sid>

# View recent call logs
{baseDir}/logs.js --limit 5
```

### Dependencies Missing
```bash
cd {baseDir}
npm install
```

## Integration with Telegram

You can trigger calls via Telegram chat:

```
@thepopebot call +15551234567 "Hello, this is a test call"
```

Or use templates:

```
@thepopebot make a reservation at Olive Garden for 4 people on Friday at 7 PM under John Smith
```

The bot will parse the message, extract details, and make the call using the appropriate template.
