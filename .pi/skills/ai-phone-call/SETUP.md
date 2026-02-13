# Setup Guide - AI Phone Call Skill

This guide walks you through setting up the AI Phone Call skill step-by-step.

## Prerequisites

- A thepopebot repository with GitHub Actions configured
- Access to repository secrets (Admin/Owner permissions)
- Credit card for Twilio and OpenAI free trials (won't be charged for trials)

## Step 1: Get Twilio Credentials

### Create Account
1. Go to https://www.twilio.com/try-twilio
2. Click "Sign up" and create a free account
3. Verify your email and phone number
4. You'll receive $15 in free credit automatically

### Get Your Credentials
1. After signup, you'll see your **Twilio Console Dashboard**
2. Find these values (copy them somewhere safe):
   - **Account SID** (starts with "AC...")
   - **Auth Token** (click "Show" to reveal)

### Get a Phone Number
1. In the Twilio Console, go to **Phone Numbers → Manage → Buy a number**
2. Select your country (USA)
3. Click "Search" to find available numbers
4. Choose any number and click "Buy" (~$1/month, deducted from your $15 credit)
5. Copy your new phone number in E.164 format (e.g., `+15551234567`)

### Trial Account Limitations
Trial accounts can only call **verified phone numbers**:

1. Go to **Phone Numbers → Manage → Verified Caller IDs**
2. Click "Add a new verified number"
3. Enter your cell phone number
4. Complete the verification process

You can verify up to 10 numbers for testing.

## Step 2: Get OpenAI API Key

### Create Account
1. Go to https://platform.openai.com/signup
2. Sign up with email or Google/Microsoft account
3. Verify your email address

### Add Credits
1. Go to **Settings → Billing**
2. Click "Add payment method"
3. Add a credit/debit card
4. Click "Add to credit balance"
5. Add $5-10 for testing (should last for 20-50 calls)

### Create API Key
1. Go to **API Keys** (left sidebar)
2. Click "Create new secret key"
3. Give it a name like "thepopebot-phone-calls"
4. Copy the key (starts with "sk-proj-..." or "sk-...")
5. **IMPORTANT**: Save this somewhere safe - you can't see it again!

### Set Usage Limits (Recommended)
1. Go to **Settings → Limits**
2. Set a monthly budget (e.g., $10)
3. Enable email notifications for usage

## Step 3: Configure Repository Secrets

### Encode Your Credentials

Create a JSON file with all your credentials:

```bash
cat > /tmp/phone-secrets.json << 'EOF'
{
  "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "TWILIO_AUTH_TOKEN": "your_auth_token_here",
  "TWILIO_PHONE_NUMBER": "+15551234567",
  "OPENAI_API_KEY": "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "TELEGRAM_BOT_TOKEN": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
  "TELEGRAM_CHAT_ID": "123456789"
}
EOF
```

**Replace these values with your real credentials:**
- `TWILIO_ACCOUNT_SID` - From Twilio Console
- `TWILIO_AUTH_TOKEN` - From Twilio Console
- `TWILIO_PHONE_NUMBER` - The number you purchased
- `OPENAI_API_KEY` - From OpenAI API Keys page
- `TELEGRAM_BOT_TOKEN` - Your existing Telegram bot token (if using)
- `TELEGRAM_CHAT_ID` - Your Telegram chat ID (if using)

> 💡 If you don't have Telegram configured, you can omit those two fields or set them to empty strings.

### Encode to Base64

```bash
# Encode the JSON file to base64
base64 -w 0 /tmp/phone-secrets.json > /tmp/phone-secrets-base64.txt

# Display the encoded string
cat /tmp/phone-secrets-base64.txt
```

Copy the entire base64 string from the output.

### Add to GitHub Repository

#### Option A: Add to Existing LLM_SECRETS

If you already have `LLM_SECRETS` configured:

1. Get your current `LLM_SECRETS` value
2. Decode it: `echo "YOUR_BASE64_HERE" | base64 -d`
3. Add the new credentials to the JSON
4. Re-encode and update the secret

#### Option B: Create New LLM_SECRETS

If this is your first LLM secret:

1. Go to your GitHub repository
2. Click **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `LLM_SECRETS`
5. Value: Paste your base64 string
6. Click **Add secret**

### Verify Installation

After adding the secret, test it:

```bash
# In your Docker container or job
echo $TWILIO_ACCOUNT_SID
# Should output: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

echo $OPENAI_API_KEY
# Should output: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Install Dependencies

Run this in a thepopebot job or in your Docker container:

```bash
cd /job/.pi/skills/ai-phone-call
npm install
```

This installs:
- `twilio` - Phone service SDK
- `openai` - AI conversation handling
- `ws` - WebSocket support
- `winston` - Logging

## Step 5: Test the Skill

### Test with Mock Scenarios

```bash
cd /job/.pi/skills/ai-phone-call

# List test scenarios
./test.js --list

# Run appointment booking test
./test.js --scenario appointment_booking
```

This tests the skill logic without making real calls.

### Test with a Real Call

**Test by calling your own phone:**

```bash
./call.js \
  --to "+15551234567" \
  --task "This is a test call. Please say 'test successful' and hang up." \
  --max-duration 1
```

Replace `+15551234567` with your own verified phone number.

**What to expect:**
1. Your phone will ring
2. You'll hear: "Hello, this is an AI assistant calling..."
3. The call will record your response
4. After hanging up, you'll get a report and Telegram notification

### Test Full Workflow

Make a real call to a business (during their hours):

```bash
./call.js \
  --to "+18005551234" \
  --business "Test Restaurant" \
  --task "Ask about business hours and if they take reservations"
```

**Choose a business that:**
- Is open now (check hours first)
- Accepts phone inquiries
- Won't mind a brief, polite inquiry call

## Step 6: Review Results

After a call completes, check:

### Console Output
- Shows real-time progress
- Displays final status and duration
- Lists file paths for all generated files

### Generated Files
```bash
ls -la logs/phone-calls/latest/
```

Should contain:
- `call-info.json` - Metadata
- `transcript.txt` - Readable transcript
- `transcript.json` - Structured data
- `recording.mp3` - Audio (if enabled)
- `report.md` - Detailed report
- `summary.json` - Structured summary

### Telegram Notification
Check your Telegram for a message with:
- Call status and duration
- Objective and outcome
- Key details extracted
- Link to full transcript

## Common Issues

### "Trial account - cannot call this number"

**Problem**: Twilio trial can only call verified numbers

**Solution**:
1. Go to Twilio Console → Phone Numbers → Verified Caller IDs
2. Add and verify the target number
3. Or upgrade to a paid account ($0 balance, no monthly fees)

### "Insufficient credits"

**Problem**: OpenAI or Twilio balance is too low

**Solution**:
1. Check OpenAI billing: https://platform.openai.com/settings/organization/billing
2. Check Twilio balance: https://console.twilio.com/
3. Add more credits to the low account

### "Environment variable not found"

**Problem**: Credentials not loaded

**Solution**:
1. Verify `LLM_SECRETS` is in GitHub repository secrets
2. Check base64 encoding is correct: `echo "YOUR_BASE64" | base64 -d`
3. Ensure no trailing whitespace in the base64 string
4. Restart your Docker container/job

### Call connects but hangs up immediately

**Problem**: TwiML or conversation handler issue

**Solution**:
1. Check console logs for error messages
2. Verify OpenAI API key is valid
3. Make sure OpenAI account has credits
4. Try with a simpler task description

### No Telegram notification

**Problem**: Telegram credentials missing or invalid

**Solution**:
1. Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in secrets
2. Test the bot manually: send a message to verify it's working
3. Use `--notify false` if you don't need notifications

## Next Steps

Once setup is complete:

1. **Try Different Scenarios**: Use the test framework to explore capabilities
2. **Real Calls**: Start with simple inquiries to businesses you actually need to contact
3. **Review Transcripts**: Learn how the AI handles different situations
4. **Customize Tasks**: Experiment with different task descriptions
5. **Integrate with Jobs**: Use the skill in thepopebot automation workflows

## Usage Tips

### Writing Good Tasks

**Be Specific**:
```bash
# Good
--task "Book haircut for John Doe next Tuesday afternoon. Phone: 555-1234."

# Bad
--task "Make an appointment"
```

**Include All Info**:
```bash
# Good
--task "Reserve table for 4 on Friday Feb 16 at 7pm. Name: Sarah Chen, phone: 555-9876. Request window seat if available."

# Bad  
--task "Make a reservation"
```

**Mention Preferences**:
```bash
# Good
--task "Schedule dental cleaning next week. Prefer morning appointments. Patient: Jane Smith (DOB 5/12/90), insurance: Delta Dental."

# Bad
--task "Book dentist"
```

### Cost Management

- Use `--max-duration` to limit long calls
- Test with short calls first
- Set OpenAI usage limits
- Monitor Twilio usage in console
- Most calls should cost $0.15-0.40

### Best Practices

1. **Call during business hours**: 9am-5pm local time
2. **Be respectful**: Don't abuse the system
3. **Verify numbers**: Use E.164 format (+1234567890)
4. **Review transcripts**: Learn from each call
5. **Start simple**: Test with straightforward tasks first

## Support Resources

- **Twilio Help**: https://www.twilio.com/docs/usage/tutorials
- **OpenAI Documentation**: https://platform.openai.com/docs
- **Test Framework**: `./test.js --list`
- **Skill Documentation**: See `SKILL.md` and `README.md`

## Security Notes

- **Never commit credentials**: Always use `LLM_SECRETS`
- **Limit API keys**: Create separate keys for each project
- **Set usage limits**: Prevent unexpected charges
- **Monitor usage**: Check billing dashboards regularly
- **Rotate keys**: Change API keys periodically

---

## Quick Reference Card

### Credentials Needed
```json
{
  "TWILIO_ACCOUNT_SID": "From Twilio Console",
  "TWILIO_AUTH_TOKEN": "From Twilio Console",  
  "TWILIO_PHONE_NUMBER": "+1234567890",
  "OPENAI_API_KEY": "sk-proj-...",
  "TELEGRAM_BOT_TOKEN": "Optional",
  "TELEGRAM_CHAT_ID": "Optional"
}
```

### Make a Call
```bash
./call.js --to "+15551234567" --task "Your objective here"
```

### Test First
```bash
./test.js --scenario appointment_booking
```

### Check Logs
```bash
ls -la logs/phone-calls/latest/
```

---

**You're all set! 🎉**

Try your first call and let the AI handle the conversation.
