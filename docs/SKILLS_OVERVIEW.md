# thepopebot Skills Overview

## New Skills Added

This document provides an overview of the two major skills added to thepopebot: **Phone Calling** and **Deployment Monitoring**.

## 1. Phone Calling Skill

**Location:** `.pi/skills/phone-calling/`

### What It Does

Makes outbound phone calls using Twilio's API with text-to-speech capabilities. Perfect for automating routine phone tasks.

### Use Cases

- **Restaurant Reservations** - Book tables automatically
- **Customer Support** - Call support lines with issues
- **Appointments** - Schedule dental, medical, or service appointments
- **Business Inquiries** - Ask about hours, availability, services
- **Follow-ups** - Check order status, track deliveries

### Quick Example

```bash
cd .pi/skills/phone-calling

# Make a simple call
./call.js --to "+15551234567" --say "Hello, this is a test"

# Book a reservation
./call.js --to "+15551234567" --template reservation \
  --data '{"restaurant":"Olive Garden","date":"Friday","time":"7 PM","party_size":4,"name":"John"}'
```

### Features

✅ Text-to-speech with natural voices  
✅ Pre-built templates for common scenarios  
✅ Custom script support  
✅ IVR menu navigation  
✅ Call logging and status tracking  
✅ Multiple voice options  
✅ Call recording  
✅ Error handling  

### Documentation

- **SKILL.md** - Complete skill documentation (8KB)
- **README.md** - Quick start guide
- **docs/PHONE_CALLING_GUIDE.md** - Comprehensive guide (11KB)

### Setup Requirements

1. Twilio account with phone number
2. Credentials in `LLM_SECRETS`:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER
3. `npm install` in skill directory

---

## 2. Deployment Monitoring & Auto-Fix

**Location:** `.pi/skills/deployment-monitor/`

### What It Does

Monitors GitHub Actions workflows, detects deployment failures, automatically debugs and fixes issues, tracks everything in Excel, and sends notifications.

### Use Cases

- **CI/CD Monitoring** - Watch all your deployments
- **Auto-Fix Failures** - Automatically debug and fix common issues
- **Deployment Tracking** - Maintain history in Excel spreadsheet
- **Team Notifications** - Alert team via Telegram/email
- **Success Metrics** - Track deployment success rates and trends

### Quick Example

```bash
cd .pi/skills/deployment-monitor

# Check deployments
./check.js --repo owner/repo

# Enable auto-fix and monitoring
./check.js --repo owner/repo --watch --auto-fix --notify-failures

# View history
./history.js --days 7 --status failure

# Generate report
./report.js --days 30 --format markdown
```

### Features

✅ Real-time GitHub Actions monitoring  
✅ Automatic error categorization  
✅ Auto-spawn Claude for debugging  
✅ Excel/Google Sheets tracking  
✅ Telegram & email notifications  
✅ Safety measures (approval gates, rate limiting)  
✅ Comprehensive reporting  
✅ Multi-repository support  

### Error Categories

The system automatically identifies:
- **test_failure** - Unit/integration/E2E test failures
- **build_error** - Compilation or build issues
- **dependency_issue** - Package or version conflicts
- **timeout** - Process time limit exceeded
- **configuration_error** - Invalid config or env vars
- **unknown** - Requires investigation

### Auto-Fix Process

```
Detect Failure → Extract Error → Categorize
         ↓
    Spawn Claude Job
         ↓
  Claude Investigates & Fixes
         ↓
   Create Pull Request
         ↓
  Track & Notify → Done
```

### Documentation

- **SKILL.md** - Complete skill documentation (12KB)
- **README.md** - Quick start guide
- **docs/DEPLOYMENT_MONITORING_GUIDE.md** - Comprehensive guide (17KB)
- **operating_system/DEPLOYMENT_MONITOR.md** - Agent task instructions
- **operating_system/DEPLOYMENT_MONITOR.json** - Configuration template

### Setup Requirements

1. GitHub Personal Access Token
2. Credentials in `LLM_SECRETS`:
   - DEPLOYMENT_GITHUB_TOKEN (or GH_TOKEN)
3. Event Handler URL for auto-fix
4. `npm install` in skill directory
5. Update DEPLOYMENT_MONITOR.json with your repos

---

## Integration with thepopebot

### Cron Jobs

Both skills can be scheduled via `operating_system/CRONS.json`:

**Phone Calling:**
```json
{
  "name": "daily-reservation",
  "schedule": "0 10 * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/phone-calling && ./call.js --to '+15551234567' --template reservation --data '{...}'",
  "enabled": true
}
```

**Deployment Monitoring:**
```json
{
  "name": "deployment-monitor",
  "schedule": "*/5 * * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/deployment-monitor && ./check.js --repos owner/repo1,owner/repo2 --auto-fix",
  "enabled": true
}
```

### Telegram Commands

Both skills can be triggered via Telegram:

**Phone Calling:**
```
@thepopebot call +15551234567 and say "Hello"
@thepopebot make a reservation at Olive Garden for 4 people on Friday at 7 PM
```

**Deployment Monitoring:**
```
@thepopebot check deployments
@thepopebot fix deployment owner/repo 12345678
@thepopebot deployment report
```

### Agent Jobs

Both skills can be used by the agent in tasks:

**Phone Calling:**
```
Use the phone-calling skill to call the dentist at +15551234567 
and schedule a cleaning appointment for next week.
```

**Deployment Monitoring:**
```
Read operating_system/DEPLOYMENT_MONITOR.md and check all 
configured repositories for failed deployments. Auto-fix if enabled.
```

---

## File Structure

```
.pi/skills/
├── phone-calling/
│   ├── SKILL.md (8KB)
│   ├── README.md
│   ├── package.json
│   ├── call.js (9KB)
│   ├── status.js (2.2KB)
│   └── logs.js (4.6KB)
│
└── deployment-monitor/
    ├── SKILL.md (12KB)
    ├── README.md (4KB)
    ├── package.json
    ├── check.js (7.6KB)
    ├── fix.js (8.8KB)
    ├── history.js (2.9KB)
    ├── report.js (6.3KB)
    └── lib/
        ├── github.js (4.8KB)
        ├── tracking.js (7KB)
        └── notifications.js (5.3KB)

operating_system/
├── DEPLOYMENT_MONITOR.md (3KB)
├── DEPLOYMENT_MONITOR.json (1KB)
├── CRONS.json (updated with deployment jobs)
└── TRIGGERS.json (updated with deployment triggers)

docs/
├── PHONE_CALLING_GUIDE.md (11KB)
├── DEPLOYMENT_MONITORING_GUIDE.md (17KB)
└── SKILLS_OVERVIEW.md (this file)

logs/
├── calls/ (phone call logs)
│   └── YYYY-MM-DD/
│       └── call-NNN-*.json
└── deployments/ (deployment logs)
    ├── YYYY-MM-DD/
    │   └── *.json
    └── tracking.xlsx
```

---

## Dependencies

### Phone Calling
- `twilio` (^5.3.5) - Twilio API client
- `yargs` (^17.7.2) - CLI argument parsing

### Deployment Monitoring
- `@octokit/rest` (^21.0.2) - GitHub API client
- `exceljs` (^4.4.0) - Excel file manipulation
- `googleapis` (^144.0.0) - Google Sheets API (optional)
- `nodemailer` (^6.9.15) - Email notifications
- `yargs` (^17.7.2) - CLI argument parsing
- `node-fetch` (^3.3.2) - HTTP requests

Install all dependencies:
```bash
cd .pi/skills/phone-calling && npm install
cd .pi/skills/deployment-monitor && npm install
```

---

## Security Considerations

### Phone Calling
- Credentials stored in `LLM_SECRETS` (accessible to agent)
- Call recordings may contain sensitive information
- Phone numbers logged locally - handle carefully
- Be aware of Twilio usage costs
- Comply with TCPA and local regulations

### Deployment Monitoring
- GitHub token has full repository access
- Never log credentials in tracking spreadsheets
- Review auto-applied fixes regularly
- Consider approval requirements for production
- Monitor GitHub Actions usage costs

---

## Cost Estimates

### Phone Calling (Twilio)
- US/Canada calls: ~$0.013/minute
- International: Varies by country
- SMS (if added): ~$0.0075/message

Example: 100 calls/month × 2 min/call × $0.013 = ~$2.60/month

### Deployment Monitoring
- GitHub Actions: Included in your GitHub plan
- API calls: Free (5,000 requests/hour)
- LLM usage (auto-fix): $0.10 - $1.00 per fix attempt

Example: 5 auto-fixes/week × $0.50 = ~$10/month

---

## Testing

### Phone Calling
```bash
# Test with your own number first
cd .pi/skills/phone-calling
./call.js --to "+1YOUR_NUMBER" --say "This is a test call from thepopebot"

# Check call status
./status.js <call-sid>

# View logs
./logs.js --days 1
```

### Deployment Monitoring
```bash
# Check deployments (no auto-fix)
cd .pi/skills/deployment-monitor
./check.js --repo owner/repo

# Test with a failed deployment
./fix.js --repo owner/repo --run-id <failed-run-id>

# View tracking
./history.js --days 7
```

---

## Troubleshooting

### Phone Calling

**"Credentials not found"**
```bash
/job/.pi/skills/llm-secrets/llm-secrets.js | grep TWILIO
```
Add to `LLM_SECRETS` if missing.

**"Invalid phone number"**  
Use E.164 format: `+[country][number]`  
Example: `+15551234567`

**"Call failed"**  
Check Twilio console logs for details.

### Deployment Monitoring

**"GitHub token not found"**
```bash
/job/.pi/skills/llm-secrets/llm-secrets.js | grep DEPLOYMENT_GITHUB_TOKEN
```
Add to `LLM_SECRETS` if missing.

**"No deployments found"**  
Verify repository name and token permissions.

**"Auto-fix not triggering"**  
Check `DEPLOYMENT_MONITOR.json` configuration.

---

## Best Practices

### Phone Calling
1. Test with your own number first
2. Verify business hours before calling
3. Keep messages concise and clear
4. Always provide a callback number
5. Review call logs regularly

### Deployment Monitoring
1. Start with monitoring only (no auto-fix)
2. Review patterns before enabling auto-fix
3. Test on dev/staging before production
4. Require approval for production branches
5. Monitor auto-fix success rate

---

## Support & Resources

### Documentation
- Full skill docs in each `SKILL.md`
- Comprehensive guides in `docs/`
- Quick start in each `README.md`

### External Resources
- Twilio Docs: https://www.twilio.com/docs
- GitHub Actions: https://docs.github.com/en/actions
- Octokit: https://octokit.github.io/rest.js

### Logs
- Phone calls: `/job/logs/calls/`
- Deployments: `/job/logs/deployments/`

### Configuration
- Phone: Credentials in `LLM_SECRETS`
- Deployments: `operating_system/DEPLOYMENT_MONITOR.json`

---

## Future Enhancements

### Phone Calling
- [ ] Inbound call handling (webhooks)
- [ ] Speech-to-text for responses
- [ ] SMS capabilities
- [ ] Conference calling
- [ ] Call analytics dashboard

### Deployment Monitoring
- [ ] Support for GitLab, Bitbucket
- [ ] Custom fix strategies per repository
- [ ] Machine learning for error prediction
- [ ] Real-time dashboard
- [ ] Slack/Discord integration

---

## Summary

Both skills are production-ready and fully integrated with thepopebot's architecture. They leverage the two-layer system (Event Handler + Docker Agent) and can be triggered via cron jobs, webhooks, Telegram commands, or direct agent tasks.

- **Phone Calling**: Automate routine phone calls
- **Deployment Monitoring**: Keep your deployments healthy

Together, they give thepopebot powerful capabilities for both real-world interactions (phone calls) and DevOps automation (deployment monitoring).

## Quick Links

- [Phone Calling Guide](./PHONE_CALLING_GUIDE.md)
- [Deployment Monitoring Guide](./DEPLOYMENT_MONITORING_GUIDE.md)
- [Phone Calling Skill](../.pi/skills/phone-calling/SKILL.md)
- [Deployment Monitoring Skill](../.pi/skills/deployment-monitor/SKILL.md)
