# Phone Calling Skill - Complete Guide

## Overview

The phone calling skill enables thepopebot to make outbound phone calls using Twilio's API. This is useful for:

- Making restaurant reservations
- Calling customer support
- Scheduling appointments
- Following up on orders
- General business inquiries
- Automating routine phone tasks

## Prerequisites

1. **Twilio Account**
   - Sign up at https://www.twilio.com
   - Purchase a phone number
   - Get your Account SID and Auth Token

2. **Credentials Setup**
   ```json
   {
     "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxx",
     "TWILIO_AUTH_TOKEN": "your-auth-token",
     "TWILIO_PHONE_NUMBER": "+1234567890"
   }
   ```
   
   Add these to your GitHub repository secrets as `LLM_SECRETS` (base64 encoded).

3. **Install Dependencies**
   ```bash
   cd .pi/skills/phone-calling
   npm install
   ```

## Quick Start Examples

### Simple Test Call

```bash
./call.js --to "+15551234567" --say "Hello, this is a test call from thepopebot."
```

### Restaurant Reservation

```bash
./call.js --to "+15551234567" --template reservation \
  --data '{
    "restaurant": "Olive Garden",
    "date": "Friday evening",
    "time": "7 PM",
    "party_size": 4,
    "name": "John Smith",
    "phone": "+15559876543"
  }'
```

This will call the restaurant and say:
> "Hello, I'd like to make a reservation at Olive Garden. For 4 people on Friday evening at 7 PM. The name is John Smith. You can call me back at +15559876543. Thank you."

### Customer Support Call

```bash
./call.js --to "+18005551234" --template support \
  --data '{
    "company": "Acme Corp",
    "issue": "I need to check my order status",
    "account": "ORD-12345"
  }'
```

### General Inquiry

```bash
./call.js --to "+15551234567" --template inquiry \
  --data '{
    "business": "ABC Store",
    "question": "What are your hours of operation today?"
  }'
```

### Schedule Appointment

```bash
./call.js --to "+15551234567" --template appointment \
  --data '{
    "business": "City Dental",
    "service": "teeth cleaning",
    "date": "next week",
    "time": "morning",
    "name": "Jane Doe",
    "phone": "+15559876543"
  }'
```

## Advanced Usage

### Custom Call Script

For complex calls with menu navigation:

```bash
./call.js --to "+18005551234" --script '{
  "steps": [
    {"action": "say", "text": "Hello, I need help with my account"},
    {"action": "wait", "seconds": 2},
    {"action": "press", "digit": "1"},
    {"action": "wait", "seconds": 3},
    {"action": "say", "text": "My account number is 12345"},
    {"action": "press", "digit": "2"},
    {"action": "wait", "seconds": 2},
    {"action": "say", "text": "Thank you, goodbye"}
  ]
}'
```

### Call with Recording

```bash
./call.js --to "+15551234567" --say "Important message" --record
```

### Use Different Voice

```bash
./call.js --to "+15551234567" --say "Hello" --voice "Polly.Matthew"
```

Available voices:
- `Polly.Amy` (British English, female) - default
- `Polly.Emma` (British English, female)
- `Polly.Brian` (British English, male)
- `Polly.Joanna` (US English, female)
- `Polly.Matthew` (US English, male)
- `Polly.Ivy` (US English, female, child)

See full list: https://www.twilio.com/docs/voice/twiml/say/text-speech#amazon-polly

## Checking Call Status

After making a call, you'll receive a Call SID. Check its status:

```bash
./status.js CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Output:
```
=== Call Status ===
Call SID: CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Status: completed
To: +15551234567
From: +11234567890
Direction: outbound-api
Duration: 45s
Start Time: 2026-02-13T12:30:00Z
End Time: 2026-02-13T12:30:45Z
Price: -0.013 USD

Description: Call completed successfully
```

## Viewing Call Logs

### Local Logs

```bash
./logs.js                          # Last 24 hours
./logs.js --days 7                 # Last 7 days
./logs.js --days 7 --limit 50      # Last 7 days, max 50 results
```

### Twilio Logs

```bash
./logs.js --source twilio
./logs.js --source twilio --status completed
./logs.js --source twilio --days 30
```

## Call Templates

### reservation
**Use for:** Restaurant reservations, event bookings

**Required data:**
- `restaurant` - Name of restaurant
- `date` - Date for reservation (e.g., "Friday", "tomorrow")
- `time` - Time (e.g., "7 PM", "7:30 PM")
- `party_size` - Number of people
- `name` - Name for reservation
- `phone` - (optional) Callback number

### support
**Use for:** Customer support, help desk calls

**Required data:**
- `company` - Company name
- `issue` - Description of issue
- `account` - (optional) Account/order number

### inquiry
**Use for:** General questions, information requests

**Required data:**
- `business` - Business name
- `question` - What you want to ask

### appointment
**Use for:** Scheduling appointments

**Required data:**
- `business` - Business name
- `service` - Type of service/appointment
- `date` - Preferred date
- `time` - Preferred time
- `name` - Your name
- `phone` - Your phone number

### followup
**Use for:** Following up on orders, tickets, requests

**Required data:**
- `business` - Business name
- `reference` - Order/ticket/reference number
- `reason` - Reason for follow-up

## Integration with thepopebot

### Via Cron Job

Add to `operating_system/CRONS.json`:

```json
{
  "name": "daily-reservation",
  "schedule": "0 10 * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/phone-calling && ./call.js --to '+15551234567' --template reservation --data '{\"restaurant\":\"Olive Garden\",\"date\":\"tonight\",\"time\":\"7 PM\",\"party_size\":2,\"name\":\"Bot\"}'",
  "enabled": true
}
```

### Via Agent Job

```json
{
  "name": "weekly-appointments",
  "schedule": "0 9 * * 1",
  "type": "agent",
  "job": "Use the phone-calling skill to call the dentist at +15551234567 and schedule a cleaning appointment for next week.",
  "enabled": true
}
```

### Via Telegram

The agent can parse messages and make calls:

```
@thepopebot call +15551234567 and say "Hello, this is a test"
```

```
@thepopebot make a reservation at Olive Garden for 4 people tomorrow at 7 PM under John Smith
```

## Best Practices

### Before Calling

1. **Verify the number** - Ensure it's correct and in E.164 format (+1234567890)
2. **Check business hours** - Don't call outside operating hours
3. **Test first** - Call your own number to test the script
4. **Prepare details** - Have all information ready (names, dates, etc.)

### During the Call

1. **Use pauses** - Give time for responses and menu options
2. **Be clear** - Use simple, direct language
3. **Provide callback** - Always include a phone number for them to reach you
4. **Stay concise** - Keep messages short and focused

### After the Call

1. **Check status** - Verify the call completed successfully
2. **Review logs** - Check what happened during the call
3. **Follow up** - If no answer or busy, try again later
4. **Document** - Note any special instructions for next time

## Handling Common Scenarios

### Busy Signal

If the number is busy, the call status will be "busy". Wait a few minutes and try again.

### No Answer

Status will be "no-answer". The call rang but wasn't picked up. Try again during business hours.

### Voicemail

The message will be left on voicemail. Keep it short and include a callback number.

### Menu Navigation

For IVR systems, use custom scripts with `press` actions:

```json
{
  "steps": [
    {"action": "wait", "seconds": 3},
    {"action": "press", "digit": "1"},
    {"action": "wait", "seconds": 2},
    {"action": "press", "digit": "2"},
    {"action": "say", "text": "Your message here"}
  ]
}
```

### Call Disconnected

If a call fails mid-way, check the status to see what happened. You may need to try again.

## Troubleshooting

### "Credentials not found"

```bash
# Check if credentials are available
/job/.pi/skills/llm-secrets/llm-secrets.js | grep TWILIO
```

If not listed, add them to `LLM_SECRETS` in GitHub secrets.

### "Invalid phone number"

Ensure the number is in E.164 format: `+[country code][number]`
- US: `+15551234567`
- UK: `+441234567890`

### "Call failed to connect"

Check:
- Number is valid and active
- Number accepts incoming calls
- Twilio account has sufficient balance
- Number isn't blocked

### Dependencies missing

```bash
cd .pi/skills/phone-calling
npm install
```

## Cost Considerations

Twilio charges per minute of call time:
- US/Canada: ~$0.013/min
- International: Varies by country

Check current rates: https://www.twilio.com/voice/pricing

Monitor your usage in the Twilio console.

## Legal & Compliance

1. **TCPA Compliance** - Only call numbers that have consented
2. **Hours** - Respect calling hours (typically 8 AM - 9 PM local time)
3. **DNC List** - Respect Do Not Call registry
4. **Recording** - Inform the other party if recording (varies by jurisdiction)
5. **Purpose** - Only use for legitimate business purposes

## Security

- Credentials stored in `LLM_SECRETS` (accessible to agent)
- Call recordings may contain sensitive information
- Phone numbers logged locally - handle carefully
- Review call logs regularly
- Be cautious with auto-dialing

## Examples by Use Case

### Restaurant Reservations
```bash
./call.js --to "+15551111111" --template reservation \
  --data '{"restaurant":"Bella Italia","date":"Friday","time":"8 PM","party_size":2,"name":"Smith"}'
```

### Check Order Status
```bash
./call.js --to "+18885551234" --template support \
  --data '{"company":"Amazon","issue":"checking order status","account":"123-4567890-1234567"}'
```

### Schedule Dentist Appointment
```bash
./call.js --to "+15552222222" --template appointment \
  --data '{"business":"Smile Dental","service":"cleaning","date":"next week","time":"afternoon","name":"John","phone":"+15559999999"}'
```

### Ask Business Hours
```bash
./call.js --to "+15553333333" --template inquiry \
  --data '{"business":"ABC Hardware","question":"What time do you close today?"}'
```

### Follow Up on Delivery
```bash
./call.js --to "+18885554444" --template followup \
  --data '{"business":"FedEx","reference":"7946123456","reason":"Package hasn't arrived yet"}'
```

## Advanced: Creating Custom Templates

You can extend the templates in `call.js`:

```javascript
const TEMPLATES = {
  // ... existing templates ...
  
  my_custom: {
    description: 'My custom call type',
    script: (data) => ({
      steps: [
        { action: 'say', text: `Hello, ${data.greeting}` },
        { action: 'wait', seconds: 2 },
        { action: 'say', text: data.message }
      ]
    })
  }
};
```

Then use it:
```bash
./call.js --to "+15551234567" --template my_custom \
  --data '{"greeting":"how are you?","message":"Just checking in"}'
```

## Resources

- Twilio Voice Docs: https://www.twilio.com/docs/voice
- TwiML Reference: https://www.twilio.com/docs/voice/twiml
- Amazon Polly Voices: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
- E.164 Format: https://en.wikipedia.org/wiki/E.164

## Support

For issues with:
- **Twilio API**: Check Twilio console logs
- **Call quality**: Review recording (if enabled)
- **Skill bugs**: Check `/job/logs/calls/` for details
- **Integration**: Review `SKILL.md` documentation
