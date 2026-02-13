# Phone Calling Skill

Comprehensive phone calling capabilities for thepopebot using Twilio's API.

## Quick Start

1. Add Twilio credentials to `LLM_SECRETS`:
```json
{
  "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxx",
  "TWILIO_AUTH_TOKEN": "your-auth-token",
  "TWILIO_PHONE_NUMBER": "+1234567890"
}
```

2. Install dependencies:
```bash
cd .pi/skills/phone-calling
npm install
```

3. Make a test call:
```bash
./call.js --to "+15551234567" --say "Hello, this is a test call"
```

## Features

- **Outbound Calls** - Make calls to any phone number
- **Text-to-Speech** - Natural voice synthesis using Amazon Polly
- **Call Templates** - Pre-built scripts for common scenarios
- **Menu Navigation** - Handle IVR systems with DTMF tones
- **Call Logging** - Track all calls with detailed logs
- **Status Monitoring** - Check call status in real-time
- **Recording** - Optional call recording

## Available Templates

- `reservation` - Restaurant reservations
- `support` - Customer support calls
- `inquiry` - General business inquiries
- `appointment` - Schedule appointments
- `followup` - Follow-up calls

## Examples

### Make a Reservation
```bash
./call.js --to "+15551234567" --template reservation \
  --data '{"restaurant":"Olive Garden","date":"Friday","time":"7 PM","party_size":4,"name":"John Smith"}'
```

### Customer Support
```bash
./call.js --to "+18005551234" --template support \
  --data '{"company":"Acme Corp","issue":"billing question","account":"12345"}'
```

### Custom Script
```bash
./call.js --to "+18005551234" --script '{
  "steps": [
    {"action": "say", "text": "Hello, I need help"},
    {"action": "press", "digit": "1"},
    {"action": "wait", "seconds": 3}
  ]
}'
```

## Commands

- `./call.js` - Make a call
- `./status.js <call-sid>` - Check call status
- `./logs.js` - View call logs

## Documentation

See `SKILL.md` for complete documentation.

## Security

- Credentials are stored in `LLM_SECRETS` (accessible to the agent)
- Never log phone numbers to public repositories
- Be aware of Twilio usage costs
- Comply with TCPA and local regulations
