# AI Phone Call Skill - Verification Checklist

Use this checklist to verify the skill is properly installed and configured.

## ✅ Installation Verification

### Files Present

```bash
cd /job/.pi/skills/ai-phone-call
ls -1
```

Should show:
- [ ] `call.js` (executable)
- [ ] `test.js` (executable)
- [ ] `package.json`
- [ ] `package-lock.json`
- [ ] `SKILL.md`
- [ ] `README.md`
- [ ] `SETUP.md`
- [ ] `EXAMPLES.md`
- [ ] `lib/` directory
- [ ] `node_modules/` directory

### Library Files

```bash
ls -1 lib/
```

Should show:
- [ ] `conversation.js`
- [ ] `reporter.js`
- [ ] `storage.js`
- [ ] `twilio-client.js`

### Dependencies Installed

```bash
npm list --depth=0
```

Should show:
- [ ] `twilio@^5.3.5`
- [ ] `openai@^4.77.0`
- [ ] `ws@^8.18.0`
- [ ] `node-fetch@^3.3.2`
- [ ] `winston@^3.17.0`

### Executables

```bash
./call.js --help
./test.js --list
```

Should display help/list without errors:
- [ ] `call.js` shows usage instructions
- [ ] `test.js` shows 5 test scenarios

## 🔐 Credentials Configuration

### Environment Variables Check

```bash
# Run this in a job or container where LLM_SECRETS is loaded
echo "Checking credentials..."

# Twilio (required)
test -n "$TWILIO_ACCOUNT_SID" && echo "✓ TWILIO_ACCOUNT_SID" || echo "✗ TWILIO_ACCOUNT_SID missing"
test -n "$TWILIO_AUTH_TOKEN" && echo "✓ TWILIO_AUTH_TOKEN" || echo "✗ TWILIO_AUTH_TOKEN missing"
test -n "$TWILIO_PHONE_NUMBER" && echo "✓ TWILIO_PHONE_NUMBER" || echo "✗ TWILIO_PHONE_NUMBER missing"

# OpenAI (required)
test -n "$OPENAI_API_KEY" && echo "✓ OPENAI_API_KEY" || echo "✗ OPENAI_API_KEY missing"

# Telegram (optional)
test -n "$TELEGRAM_BOT_TOKEN" && echo "✓ TELEGRAM_BOT_TOKEN" || echo "○ TELEGRAM_BOT_TOKEN not set (optional)"
test -n "$TELEGRAM_CHAT_ID" && echo "✓ TELEGRAM_CHAT_ID" || echo "○ TELEGRAM_CHAT_ID not set (optional)"
```

Expected results:
- [ ] All Twilio credentials present (✓)
- [ ] OpenAI API key present (✓)
- [ ] Telegram credentials present or noted as optional

### Credential Format Validation

```bash
# Twilio Account SID should start with "AC"
echo $TWILIO_ACCOUNT_SID | grep -q "^AC" && echo "✓ Valid format" || echo "✗ Invalid format"

# Twilio phone number should be E.164 format (+1234567890)
echo $TWILIO_PHONE_NUMBER | grep -q "^+[0-9]\{10,15\}$" && echo "✓ Valid format" || echo "✗ Invalid format"

# OpenAI API key should start with "sk-"
echo $OPENAI_API_KEY | grep -q "^sk-" && echo "✓ Valid format" || echo "✗ Invalid format"
```

Expected:
- [ ] Twilio Account SID format valid
- [ ] Phone number in E.164 format
- [ ] OpenAI key format valid

## 🧪 Testing

### Test Framework

```bash
./test.js --list
```

Verify displays:
- [ ] 5 test scenarios listed
- [ ] Each with description and step count

```bash
./test.js --scenario appointment_booking
```

Verify shows:
- [ ] Complete mock conversation
- [ ] Expected outcome
- [ ] Key details
- [ ] No errors

### All Scenarios

```bash
./test.js --all
```

Should run through all 5 scenarios:
- [ ] appointment_booking
- [ ] restaurant_reservation
- [ ] service_inquiry
- [ ] voicemail
- [ ] no_availability

## 📁 Permissions

### File Permissions

```bash
ls -l call.js test.js
```

Should show executable (`-rwxr-xr-x`):
- [ ] `call.js` is executable
- [ ] `test.js` is executable

### Directory Permissions

```bash
mkdir -p /job/logs/phone-calls && echo "✓ Can create directories" || echo "✗ Permission denied"
touch /job/logs/phone-calls/test.txt && rm /job/logs/phone-calls/test.txt && echo "✓ Can write files" || echo "✗ Permission denied"
```

Expected:
- [ ] Can create directories in `/job/logs/`
- [ ] Can write files to logs directory

## 🔌 API Connectivity

### Twilio Connection Test

```bash
# This requires valid credentials
node -e "
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch()
  .then(account => console.log('✓ Twilio connection successful'))
  .catch(err => console.log('✗ Twilio connection failed:', err.message));
"
```

Expected:
- [ ] Twilio connection successful

### OpenAI Connection Test

```bash
# This requires valid API key
node -e "
const OpenAI = require('openai').default;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
openai.models.list()
  .then(() => console.log('✓ OpenAI connection successful'))
  .catch(err => console.log('✗ OpenAI connection failed:', err.message));
"
```

Expected:
- [ ] OpenAI connection successful

## 📞 Test Call (Optional)

### Call Your Own Phone

```bash
./call.js \
  --to "+15551234567" \
  --task "This is a test call to verify the system is working. Please say 'test successful' and hang up." \
  --max-duration 1 \
  --notify false
```

Replace `+15551234567` with your verified phone number.

Expected results:
- [ ] Call initiates without errors
- [ ] Phone rings
- [ ] Console shows progress
- [ ] Files created in `logs/phone-calls/`

### Verify Output Files

```bash
ls -la logs/phone-calls/latest/
```

Should contain:
- [ ] `call-info.json`
- [ ] `transcript.txt`
- [ ] `transcript.json`
- [ ] `report.md`
- [ ] `summary.json`
- [ ] `recording.mp3` (if call connected)

## 📊 Review Test Results

### Check Call Info

```bash
cat logs/phone-calls/latest/call-info.json
```

Verify contains:
- [ ] callId
- [ ] phoneNumber
- [ ] status
- [ ] duration
- [ ] timestamps

### Review Transcript

```bash
cat logs/phone-calls/latest/transcript.txt
```

Should show:
- [ ] AI greeting message
- [ ] Human responses (if any)
- [ ] Timestamps
- [ ] Proper formatting

### Inspect Report

```bash
cat logs/phone-calls/latest/report.md
```

Should include:
- [ ] Header with status emoji
- [ ] Objective section
- [ ] Outcome section
- [ ] File paths
- [ ] Proper markdown formatting

## 📱 Telegram Integration (Optional)

If Telegram credentials are configured:

```bash
./call.js \
  --to "+15551234567" \
  --task "Test notification" \
  --max-duration 1
```

Expected:
- [ ] Telegram notification received
- [ ] Contains call summary
- [ ] Shows status and duration
- [ ] Includes file paths

## 🐛 Troubleshooting Tests

### Missing Credentials Error

```bash
# Should fail gracefully with clear error
unset TWILIO_ACCOUNT_SID
./call.js --to "+1555..." --task "test"
```

Expected:
- [ ] Clear error message about missing credential
- [ ] No stack trace or crash
- [ ] Helpful guidance on what's missing

### Invalid Phone Number

```bash
./call.js --to "555-1234" --task "test"
```

Expected:
- [ ] Clear error about phone number format
- [ ] Suggestion to use E.164 format
- [ ] No crash

### Missing Arguments

```bash
./call.js --to "+15551234567"
# (no --task argument)
```

Expected:
- [ ] Error about missing required argument
- [ ] Shows usage/help information
- [ ] No crash

## 📚 Documentation Review

### SKILL.md

```bash
grep -q "ai-phone-call" SKILL.md && echo "✓" || echo "✗"
```

Verify contains:
- [ ] Description in frontmatter
- [ ] Setup instructions
- [ ] Usage examples
- [ ] All command options documented
- [ ] Troubleshooting section

### README.md

```bash
wc -l README.md
```

Should be substantial (400+ lines):
- [ ] Quick start guide
- [ ] Detailed examples
- [ ] API key setup instructions
- [ ] Cost estimates
- [ ] Best practices

### SETUP.md

Verify includes:
- [ ] Step-by-step setup walkthrough
- [ ] Screenshots or clear instructions for getting API keys
- [ ] Configuration examples
- [ ] Testing procedures

### EXAMPLES.md

Should contain:
- [ ] Multiple real-world scenarios
- [ ] Different business types
- [ ] Various use cases
- [ ] Integration examples

## ✨ Final Validation

Run complete end-to-end test:

```bash
# 1. Test framework works
./test.js --scenario appointment_booking

# 2. Help is accessible
./call.js --help

# 3. Can check available secrets
/job/.pi/skills/llm-secrets/llm-secrets.js

# 4. Dependencies installed correctly
npm list --depth=0 | grep -E "twilio|openai|ws"

# 5. Files are organized
ls -R | grep -v node_modules
```

All should complete without errors:
- [ ] Test framework runs
- [ ] Help displays
- [ ] Can list secrets
- [ ] Dependencies confirmed
- [ ] File structure correct

## 🎯 Success Criteria

### Minimum Requirements (Trial/Testing)

- [x] All code files present
- [x] Dependencies installed
- [x] Test framework works
- [x] Help/documentation accessible
- [ ] Credentials configured
- [ ] Can make test call to verified number

### Production Ready

- [ ] All minimum requirements met
- [ ] Successfully completed 3+ test calls
- [ ] Transcripts reviewed and accurate
- [ ] Telegram notifications working
- [ ] Cost monitoring in place
- [ ] Error handling tested

## 📝 Notes Section

Use this space to record any issues or customizations:

```
Date: ___________
Tester: ___________

Issues Found:
-
-
-

Customizations Made:
-
-
-

Test Call Results:
- Call 1: ___________ (status)
- Call 2: ___________ (status)  
- Call 3: ___________ (status)

Total Cost: $_______
```

---

## Quick Commands Reference

```bash
# List dependencies
npm list --depth=0

# Test credentials
echo $TWILIO_ACCOUNT_SID | cut -c1-10

# Run test
./test.js --scenario appointment_booking

# Make call
./call.js --to "+1555..." --task "..." --max-duration 3

# Check logs
ls -la logs/phone-calls/latest/

# View report
cat logs/phone-calls/latest/report.md
```

---

**Status**: [ ] Not Started / [ ] In Progress / [ ] Complete

**Date Completed**: ___________

**Verified By**: ___________
