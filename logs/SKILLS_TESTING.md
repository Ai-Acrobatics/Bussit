# Skills Testing Guide

This document provides test cases and verification steps for both new skills.

## Pre-Testing Checklist

Before testing, ensure:

### Phone Calling
- [ ] Twilio credentials added to `LLM_SECRETS`
- [ ] Dependencies installed: `cd .pi/skills/phone-calling && npm install`
- [ ] Scripts are executable (should already be)
- [ ] You have a test phone number to call

### Deployment Monitoring
- [ ] GitHub token added to `LLM_SECRETS`
- [ ] Repositories configured in `DEPLOYMENT_MONITOR.json`
- [ ] Dependencies installed: `cd .pi/skills/deployment-monitor && npm install`
- [ ] Scripts are executable (should already be)
- [ ] You have at least one repository with workflow runs

---

## Phone Calling Tests

### Test 1: Simple Call (Basic Functionality)

**Purpose:** Verify basic calling works

```bash
cd .pi/skills/phone-calling
./call.js --to "+1YOUR_NUMBER" --say "This is test number one from thepopebot."
```

**Expected Result:**
- ✅ Script runs without errors
- ✅ Call SID is displayed
- ✅ You receive a call
- ✅ You hear the message
- ✅ Log file created in `/job/logs/calls/YYYY-MM-DD/`

**Pass/Fail:** ___________

---

### Test 2: Restaurant Reservation Template

**Purpose:** Verify template system works

```bash
./call.js --to "+1YOUR_NUMBER" --template reservation \
  --data '{"restaurant":"Test Restaurant","date":"tomorrow","time":"7 PM","party_size":2,"name":"Test User","phone":"+1YOUR_NUMBER"}'
```

**Expected Result:**
- ✅ Script runs without errors
- ✅ You receive a call
- ✅ Message includes all details (restaurant, date, time, party size, name)
- ✅ Template fields are properly filled
- ✅ Log file shows template used

**Pass/Fail:** ___________

---

### Test 3: Call Status Check

**Purpose:** Verify status checking works

```bash
# Get Call SID from previous test
./status.js CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Expected Result:**
- ✅ Status information displayed
- ✅ Shows: status, to/from numbers, duration
- ✅ No errors

**Pass/Fail:** ___________

---

### Test 4: Call Logs

**Purpose:** Verify logging system

```bash
./logs.js --days 1
```

**Expected Result:**
- ✅ Shows recent calls
- ✅ Includes details: date, to number, template, status
- ✅ Matches calls you just made
- ✅ No errors

**Pass/Fail:** ___________

---

### Test 5: Custom Script with Menu Navigation

**Purpose:** Verify custom script capability

```bash
./call.js --to "+1YOUR_NUMBER" --script '{
  "steps": [
    {"action": "say", "text": "Testing custom script"},
    {"action": "wait", "seconds": 2},
    {"action": "say", "text": "Step two"},
    {"action": "wait", "seconds": 2},
    {"action": "say", "text": "Step three, goodbye"}
  ]
}'
```

**Expected Result:**
- ✅ You receive a call
- ✅ Hear three messages with pauses between
- ✅ Script executes in order
- ✅ No errors

**Pass/Fail:** ___________

---

## Deployment Monitoring Tests

### Test 6: Basic Deployment Check

**Purpose:** Verify GitHub API integration

```bash
cd .pi/skills/deployment-monitor
./check.js --repo owner/repo
```

(Replace `owner/repo` with your actual repository)

**Expected Result:**
- ✅ Script runs without errors
- ✅ Shows list of workflow runs
- ✅ Displays: workflow name, status, branch, commit, duration
- ✅ No authentication errors

**Pass/Fail:** ___________

---

### Test 7: Multiple Repository Check

**Purpose:** Verify multi-repo support

```bash
./check.js --repos owner/repo1,owner/repo2
```

**Expected Result:**
- ✅ Checks both repositories
- ✅ Shows runs for each repo
- ✅ No errors
- ✅ Handles both repos correctly

**Pass/Fail:** ___________

---

### Test 8: Tracking System

**Purpose:** Verify Excel tracking

```bash
./check.js --repo owner/repo --track
```

**Expected Result:**
- ✅ Script runs successfully
- ✅ Excel file created: `/job/logs/deployments/tracking.xlsx`
- ✅ File contains deployment records
- ✅ Columns are properly formatted
- ✅ Color coding applied (green for success, red for failure)

**Pass/Fail:** ___________

---

### Test 9: Deployment History

**Purpose:** Verify history retrieval

```bash
./history.js --days 7
```

**Expected Result:**
- ✅ Shows deployment history
- ✅ Includes summary statistics
- ✅ Success/failure counts are accurate
- ✅ No errors

**Pass/Fail:** ___________

---

### Test 10: Report Generation

**Purpose:** Verify reporting system

```bash
# Text format
./report.js --days 30

# Markdown format
./report.js --days 30 --format markdown

# JSON format
./report.js --days 30 --format json
```

**Expected Result:**
- ✅ All three formats work
- ✅ Shows: total deployments, success rate, avg duration
- ✅ Lists error categories
- ✅ Statistics are accurate

**Pass/Fail:** ___________

---

### Test 11: Error Extraction (Manual)

**Purpose:** Verify error categorization

Find a failed workflow run and test:

```bash
./check.js --repo owner/repo --status completed --limit 20
```

Look for a failure, then:

```bash
./fix.js --repo owner/repo --run-id <failed-run-id>
```

**Expected Result:**
- ✅ Identifies failed run
- ✅ Extracts error details
- ✅ Categorizes error type
- ✅ Shows fix strategy
- ✅ (Optional) Creates fix job if auto-fix enabled

**Pass/Fail:** ___________

---

### Test 12: Watch Mode (Optional, Long-Running)

**Purpose:** Verify continuous monitoring

```bash
./check.js --repo owner/repo --watch --interval 30
```

(Let it run for a few minutes, then Ctrl+C)

**Expected Result:**
- ✅ Runs continuously
- ✅ Checks every 30 seconds
- ✅ Shows new runs as they occur
- ✅ Can be stopped with Ctrl+C

**Pass/Fail:** ___________

---

## Integration Tests

### Test 13: Phone Calling via Agent Job

**Purpose:** Verify agent can use the skill

Create a job:
```markdown
Use the phone-calling skill to call +1YOUR_NUMBER and say "This is an integration test"
```

**Expected Result:**
- ✅ Agent loads the skill
- ✅ Agent makes the call
- ✅ You receive the call
- ✅ Message is correct

**Pass/Fail:** ___________

---

### Test 14: Deployment Monitoring via Agent Job

**Purpose:** Verify agent can use the skill

Create a job:
```markdown
Read operating_system/DEPLOYMENT_MONITOR.md and check deployments for owner/repo
```

**Expected Result:**
- ✅ Agent loads the skill
- ✅ Agent checks deployments
- ✅ Agent creates summary
- ✅ Tracking is updated

**Pass/Fail:** ___________

---

## Cron Job Tests

### Test 15: Phone Calling Cron (Optional)

**Purpose:** Verify scheduled calls work

Add to `CRONS.json`:
```json
{
  "name": "test-call-cron",
  "schedule": "* * * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/phone-calling && ./call.js --to '+1YOUR_NUMBER' --say 'Cron test'",
  "enabled": true
}
```

**Expected Result:**
- ✅ Call is made every minute (for testing)
- ✅ Cron job executes successfully
- ✅ Logs show cron execution

Remember to disable after testing!

**Pass/Fail:** ___________

---

### Test 16: Deployment Monitoring Cron

**Purpose:** Verify scheduled monitoring works

Enable in `CRONS.json`:
```json
{
  "name": "deployment-monitor-quick",
  "schedule": "*/5 * * * *",
  "enabled": true
}
```

Wait 5 minutes and check logs:
```bash
ls -l /job/logs/deployments/
```

**Expected Result:**
- ✅ Cron job runs every 5 minutes
- ✅ Deployments are checked
- ✅ Logs are created
- ✅ Tracking is updated

**Pass/Fail:** ___________

---

## Notification Tests

### Test 17: Telegram Notification (Optional)

**Purpose:** Verify Telegram integration

If you have Telegram configured:

```bash
cd .pi/skills/deployment-monitor
./check.js --repo owner/repo --notify-failures
```

**Expected Result:**
- ✅ If failures found, Telegram message sent
- ✅ Message includes: repo, workflow, error
- ✅ Message is formatted correctly

**Pass/Fail:** ___________

---

## Error Handling Tests

### Test 18: Invalid Phone Number

**Purpose:** Verify error handling

```bash
cd .pi/skills/phone-calling
./call.js --to "invalid" --say "Test"
```

**Expected Result:**
- ✅ Script shows clear error message
- ✅ Doesn't crash
- ✅ Exits with error code

**Pass/Fail:** ___________

---

### Test 19: Invalid Repository

**Purpose:** Verify error handling

```bash
cd .pi/skills/deployment-monitor
./check.js --repo invalid/repo
```

**Expected Result:**
- ✅ Script shows clear error message
- ✅ Doesn't crash
- ✅ Exits with error code

**Pass/Fail:** ___________

---

### Test 20: Missing Credentials

**Purpose:** Verify credential checking

Remove credentials temporarily and test:

```bash
# This should fail gracefully
cd .pi/skills/phone-calling
unset TWILIO_ACCOUNT_SID
./call.js --to "+1234567890" --say "Test"
```

**Expected Result:**
- ✅ Clear error message about missing credentials
- ✅ Doesn't crash
- ✅ Suggests how to fix

**Pass/Fail:** ___________

---

## Performance Tests

### Test 21: Large Call Log Retrieval

**Purpose:** Verify performance with many logs

```bash
cd .pi/skills/phone-calling
./logs.js --days 30 --limit 100
```

**Expected Result:**
- ✅ Completes in reasonable time (< 5 seconds)
- ✅ Displays results correctly
- ✅ No memory issues

**Pass/Fail:** ___________

---

### Test 22: Large Deployment History

**Purpose:** Verify performance with many records

```bash
cd .pi/skills/deployment-monitor
./history.js --days 90
```

**Expected Result:**
- ✅ Completes in reasonable time (< 10 seconds)
- ✅ Displays results correctly
- ✅ Excel file loads properly

**Pass/Fail:** ___________

---

## Test Summary

Total Tests: 22

**Passed:** _______  
**Failed:** _______  
**Skipped:** _______

### Critical Issues Found

(List any critical issues that must be fixed)

1. 
2. 
3. 

### Minor Issues Found

(List any minor issues or improvements)

1. 
2. 
3. 

### Notes

(Add any additional notes or observations)

---

## Sign-Off

**Tester:** _______________  
**Date:** _______________  
**Overall Result:** Pass / Fail / Pass with Issues

**Ready for Production:** Yes / No / With Restrictions

---

## Next Steps

After testing:

1. [ ] Fix any critical issues found
2. [ ] Document any workarounds needed
3. [ ] Update configuration based on test results
4. [ ] Enable production cron jobs
5. [ ] Monitor first few runs closely
6. [ ] Update team on new capabilities
