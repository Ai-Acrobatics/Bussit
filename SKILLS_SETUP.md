# Skills Setup Guide

This guide will help you set up the two new skills for thepopebot: **Phone Calling** and **Deployment Monitoring**.

## Overview

Both skills are fully implemented and ready to use. You just need to:
1. Add credentials
2. Install dependencies
3. Configure settings
4. Enable automation (optional)

---

## 1. Phone Calling Skill

### A. Get Twilio Credentials

1. Sign up at https://www.twilio.com
2. Go to Console Dashboard
3. Note your **Account SID** and **Auth Token**
4. Buy a phone number (Phone Numbers → Buy a number)
5. Note the **Phone Number** (format: +1234567890)

### B. Add Credentials to GitHub

1. Go to your repository → Settings → Secrets and variables → Actions
2. Click on **Repository secrets**
3. Find or create the `LLM_SECRETS` secret
4. Decode current value:
   ```bash
   echo "current_base64_value" | base64 -d
   ```
5. Add Twilio credentials to the JSON:
   ```json
   {
     "existing_keys": "...",
     "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxx",
     "TWILIO_AUTH_TOKEN": "your-auth-token-here",
     "TWILIO_PHONE_NUMBER": "+1234567890"
   }
   ```
6. Re-encode and update the secret:
   ```bash
   echo -n '{"TWILIO_ACCOUNT_SID":"..."}' | base64
   ```

### C. Install Dependencies

The dependencies will be installed automatically when the Docker container runs, but you can pre-install for local testing:

```bash
cd .pi/skills/phone-calling
npm install
```

### D. Test the Skill

Make a test call to your own phone:

```bash
./call.js --to "+1YOUR_NUMBER" --say "This is a test call from thepopebot"
```

You should receive a call immediately.

### E. Enable Automation (Optional)

To schedule automatic calls, edit `operating_system/CRONS.json`:

```json
{
  "name": "daily-reservation-call",
  "schedule": "0 10 * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/phone-calling && ./call.js --to '+15551234567' --template reservation --data '{\"restaurant\":\"Olive Garden\",\"date\":\"tonight\",\"time\":\"7 PM\",\"party_size\":2,\"name\":\"Your Name\"}'",
  "enabled": true
}
```

---

## 2. Deployment Monitoring Skill

### A. Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: "thepopebot Deployment Monitor"
4. Expiration: No expiration (or your preference)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `actions` (Read and write GitHub Actions)
6. Click "Generate token"
7. **Copy the token** (you won't see it again!)

### B. Add Credentials to GitHub

1. Go to your repository → Settings → Secrets and variables → Actions
2. Update `LLM_SECRETS`:
   ```json
   {
     "existing_keys": "...",
     "DEPLOYMENT_GITHUB_TOKEN": "ghp_xxxxxxxxxxxxx"
   }
   ```
3. Re-encode and update the secret

### C. Configure Repositories to Monitor

Edit `operating_system/DEPLOYMENT_MONITOR.json`:

```json
{
  "repositories": [
    {
      "owner": "your-github-username",
      "repo": "your-repo-name",
      "workflows": ["CI/CD", "Deploy"],
      "auto_fix": true,
      "notify": true,
      "tracking": true
    }
  ],
  "auto_fix": {
    "enabled": true,
    "max_attempts": 3
  },
  "notifications": {
    "telegram": {
      "enabled": true,
      "chat_ids": []
    }
  },
  "safety": {
    "require_approval_for": ["production", "main", "master"],
    "always_create_pr": true
  }
}
```

**Important:** Replace `your-github-username` and `your-repo-name` with your actual repositories.

### D. Install Dependencies

```bash
cd .pi/skills/deployment-monitor
npm install
```

### E. Test the Skill

Check deployments for one of your repositories:

```bash
./check.js --repo your-username/your-repo
```

You should see a list of recent workflow runs.

### F. Enable Automation

#### Quick Checks (Every 5 Minutes)

Edit `operating_system/CRONS.json`, find the `deployment-monitor-quick` job and update it:

```json
{
  "name": "deployment-monitor-quick",
  "schedule": "*/5 * * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/deployment-monitor && ./check.js --repos your-username/repo1,your-username/repo2 --track --notify-failures --auto-fix",
  "enabled": true
}
```

#### Full Agent Checks (Every 15 Minutes)

```json
{
  "name": "deployment-monitor-full",
  "schedule": "*/15 * * * *",
  "type": "agent",
  "job": "Read the file at operating_system/DEPLOYMENT_MONITOR.md and complete the tasks described there.",
  "enabled": true
}
```

#### Daily Reports

```json
{
  "name": "deployment-report-daily",
  "schedule": "0 9 * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/deployment-monitor && ./report.js --days 1 --format markdown --notify",
  "enabled": true
}
```

---

## 3. Telegram Integration (Optional)

To get Telegram notifications for deployment failures:

### A. Get Your Telegram Chat ID

1. Start a chat with your bot (if you have one configured)
2. Send a message: `/start`
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find your `chat_id` in the response

### B. Add Chat ID to Configuration

Edit `operating_system/DEPLOYMENT_MONITOR.json`:

```json
{
  "notifications": {
    "telegram": {
      "enabled": true,
      "chat_ids": ["123456789"]
    }
  }
}
```

Replace `123456789` with your actual chat ID.

---

## 4. Verification Checklist

### Phone Calling
- [ ] Twilio credentials added to `LLM_SECRETS`
- [ ] Dependencies installed (`npm install`)
- [ ] Test call successful
- [ ] Cron jobs configured (if desired)
- [ ] Call logs working (`./logs.js`)

### Deployment Monitoring
- [ ] GitHub token added to `LLM_SECRETS`
- [ ] Repositories configured in `DEPLOYMENT_MONITOR.json`
- [ ] Dependencies installed (`npm install`)
- [ ] Test check successful (`./check.js`)
- [ ] Cron jobs enabled (if desired)
- [ ] Telegram notifications configured (if desired)

---

## 5. Quick Commands Reference

### Phone Calling

```bash
cd .pi/skills/phone-calling

# Make a simple call
./call.js --to "+15551234567" --say "Hello"

# Make a reservation
./call.js --to "+15551234567" --template reservation \
  --data '{"restaurant":"Olive Garden","date":"Friday","time":"7 PM","party_size":4,"name":"John"}'

# Check call status
./status.js CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# View call logs
./logs.js --days 7
```

### Deployment Monitoring

```bash
cd .pi/skills/deployment-monitor

# Check deployments
./check.js --repo owner/repo

# Watch continuously
./check.js --repo owner/repo --watch --notify-failures

# Fix a failed deployment
./fix.js --repo owner/repo --run-id 12345678

# View history
./history.js --days 7 --status failure

# Generate report
./report.js --days 30 --format markdown
```

---

## 6. Troubleshooting

### Phone Calling Issues

**"Credentials not found"**
```bash
# In a running job, check:
/job/.pi/skills/llm-secrets/llm-secrets.js | grep TWILIO
```

If missing, add to `LLM_SECRETS` in GitHub secrets.

**"Invalid phone number"**  
Ensure E.164 format: `+[country_code][number]`  
Example: `+15551234567`

**Call doesn't complete**  
Check Twilio console logs for details.

### Deployment Monitoring Issues

**"GitHub token not found"**
```bash
# In a running job, check:
/job/.pi/skills/llm-secrets/llm-secrets.js | grep DEPLOYMENT
```

**"No deployments found"**  
- Verify repository name is correct
- Check token has proper permissions
- Ensure workflows exist and have run

**Auto-fix not working**  
- Check `DEPLOYMENT_MONITOR.json` config
- Verify `auto_fix.enabled` is `true`
- Check branch isn't in `require_approval_for`

---

## 7. Documentation

Comprehensive guides available:

- **Phone Calling:** `docs/PHONE_CALLING_GUIDE.md` (11KB)
- **Deployment Monitoring:** `docs/DEPLOYMENT_MONITORING_GUIDE.md` (17KB)
- **Skills Overview:** `docs/SKILLS_OVERVIEW.md` (11KB)

Each skill also has:
- `SKILL.md` - Loaded by Pi agent
- `README.md` - Quick reference

---

## 8. Safety Notes

### Phone Calling
- Test with your own number first
- Respect business hours
- Comply with TCPA regulations
- Monitor Twilio usage costs
- Don't call emergency numbers

### Deployment Monitoring
- Start with monitoring only (no auto-fix)
- Test on dev/staging before production
- Require approval for production branches
- Review auto-fixes regularly
- Monitor GitHub Actions usage

---

## 9. Support

If you need help:

1. **Check logs:**
   - Phone: `/job/logs/calls/`
   - Deployments: `/job/logs/deployments/`

2. **Review documentation:**
   - Skill docs in `.pi/skills/*/SKILL.md`
   - Guides in `docs/`

3. **Test manually:**
   - Run scripts directly to debug
   - Check error messages

4. **Verify credentials:**
   - Use `llm-secrets.js` to check what's available

---

## 10. Next Steps

After setup:

1. **Test both skills** individually
2. **Enable cron jobs** for automation
3. **Monitor logs** to ensure everything works
4. **Adjust configurations** based on your needs
5. **Review auto-fixes** to ensure quality
6. **Set up notifications** to stay informed

---

## Success!

Both skills are now ready to use. thepopebot can:

✅ Make phone calls on your behalf  
✅ Monitor your deployments 24/7  
✅ Automatically fix common deployment issues  
✅ Keep you informed via Telegram  
✅ Track everything for reporting  

Enjoy your enhanced thepopebot! 🤖📞🚀
