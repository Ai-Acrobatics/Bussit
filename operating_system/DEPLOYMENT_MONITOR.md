# Deployment Monitoring Task

You are tasked with monitoring deployments and automatically fixing failures when possible.

## Your Mission

Check all configured repositories for deployment status. When you find a failure:

1. Extract error details and categorize the issue
2. Determine if auto-fix is enabled and allowed for this repository/branch
3. If auto-fix is allowed, create a job to investigate and fix the issue
4. Track the deployment status in the tracking spreadsheet
5. Send notifications as configured

## Configuration

Read the configuration file at `/job/operating_system/DEPLOYMENT_MONITOR.json` to get:
- List of repositories to monitor
- Auto-fix settings
- Safety rules
- Notification preferences

## Commands

Use the deployment monitor skill located at `/job/.pi/skills/deployment-monitor/`:

### Check deployments
```bash
cd /job/.pi/skills/deployment-monitor
./check.js --repo owner/repo --track --notify-failures
```

### Check multiple repositories
```bash
cd /job/.pi/skills/deployment-monitor
./check.js --repos owner/repo1,owner/repo2,owner/repo3 --track --notify-failures
```

### Fix a failed deployment
```bash
cd /job/.pi/skills/deployment-monitor
./fix.js --repo owner/repo --run-id 12345678
```

### View deployment history
```bash
cd /job/.pi/skills/deployment-monitor
./history.js --days 7 --status failure
```

### Generate report
```bash
cd /job/.pi/skills/deployment-monitor
./report.js --days 30 --notify
```

## Safety Rules

**Always follow these rules:**

1. **Never skip safety checks** - Respect protected branch settings
2. **Always create PRs** - Never push directly, even to dev branches
3. **Rate limiting** - Don't exceed max fixes per hour
4. **Require approval** - For production/main/master branches
5. **Log everything** - Track all checks and fixes

## When Auto-Fix is Triggered

If a deployment fails and auto-fix is enabled:

1. Extract full error context from GitHub Actions logs
2. Create a detailed job description for investigation
3. Use the `/webhook` endpoint to create a fix job
4. Track the fix attempt in the spreadsheet
5. Send notification about the fix being attempted

## Example Workflow

```bash
# 1. Check deployments
cd /job/.pi/skills/deployment-monitor
./check.js --repos myorg/app1,myorg/app2 --track --notify-failures --auto-fix

# 2. If failures found and auto-fix enabled:
#    - Error details are extracted
#    - Fix job is created automatically
#    - Tracking is updated
#    - Notifications are sent

# 3. Generate report of your work
./report.js --days 1 --format markdown
```

## Output

After completing your check:

1. **Create a summary** in `/job/logs/deployments/YYYY-MM-DD/summary.md`:
   - Number of repositories checked
   - Number of failures found
   - Number of auto-fixes triggered
   - Any issues or errors encountered

2. **Log details** are automatically saved by the skill scripts

3. **Notifications** are sent automatically if configured

## Notes

- Focus on the most recent deployments (last 5-10 runs per repo)
- Prioritize failures in critical repositories
- If unsure about auto-fixing, err on the side of caution
- Always check if there's already an open PR for the same issue
- Be aware of rate limits on both GitHub API and fix attempts
