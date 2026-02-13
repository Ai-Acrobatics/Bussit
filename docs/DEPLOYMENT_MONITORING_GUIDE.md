# Deployment Monitoring & Auto-Fix - Complete Guide

## Overview

The deployment monitoring system watches your GitHub Actions workflows, detects failures, automatically debugs and fixes issues, tracks everything in Excel, and sends notifications. It's like having a DevOps engineer on call 24/7.

## Key Features

- **Real-time Monitoring** - Continuously watch GitHub Actions
- **Error Categorization** - Automatically identify issue types
- **Auto-Fix** - Spawn Claude to debug and fix problems
- **Excel Tracking** - Track all deployments in spreadsheet
- **Smart Reporting** - Success rates, trends, and analytics
- **Safety First** - Approval gates, rate limiting, protected branches
- **Multi-Channel Notifications** - Telegram and email alerts

## Prerequisites

### 1. GitHub Personal Access Token

Create a token with these permissions:
- `repo` (full repository access)
- `workflow` (read/write workflows)
- `actions` (read/write actions)

### 2. Add Credentials

Add to `LLM_SECRETS` in GitHub repository secrets:

```json
{
  "DEPLOYMENT_GITHUB_TOKEN": "ghp_xxxxxxxxxxxxx"
}
```

For Event Handler integration (required for auto-fix):
```json
{
  "GH_WEBHOOK_URL": "https://your-event-handler.com",
  "API_KEY": "your-api-key"
}
```

### 3. Install Dependencies

```bash
cd .pi/skills/deployment-monitor
npm install
```

### 4. Configuration

Edit `operating_system/DEPLOYMENT_MONITOR.json`:

```json
{
  "repositories": [
    {
      "owner": "myorg",
      "repo": "myapp",
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
      "chat_ids": ["123456789"]
    }
  },
  "safety": {
    "require_approval_for": ["production", "main", "master"],
    "always_create_pr": true
  }
}
```

## Quick Start

### 1. Check Single Repository

```bash
cd .pi/skills/deployment-monitor
./check.js --repo owner/repo
```

Output:
```
🔍 Checking deployments for owner/repo...

Found 10 workflow runs:

✅ CI/CD Pipeline
  Run #123 (456789012)
  Status: success
  Branch: main
  Commit: abc1234
  Started: 2/13/2026, 10:00:00 AM
  Duration: 180s

❌ Deploy to Production
  Run #122 (456789011)
  Status: failure
  Branch: main
  Commit: def5678
  Started: 2/13/2026, 9:30:00 AM
  Duration: 240s
  🔍 Extracting error details...
  Error: Build timeout after 30 minutes
  Category: timeout
```

### 2. Enable Auto-Fix

```bash
./check.js --repo owner/repo --auto-fix --notify-failures
```

This will:
1. Check for failures
2. Extract error details
3. Create a job for Claude to fix it
4. Track the attempt
5. Send notification

### 3. Continuous Monitoring

```bash
./check.js --repo owner/repo --watch --auto-fix --notify-failures
```

Runs continuously, checking every 60 seconds (configurable with `--interval`).

### 4. Monitor Multiple Repositories

```bash
./check.js --repos owner/repo1,owner/repo2,owner/repo3 --watch
```

## Commands Reference

### check.js - Monitor Deployments

```bash
# Basic check
./check.js --repo owner/repo

# Multiple repos
./check.js --repos owner/repo1,owner/repo2

# Filter by workflow
./check.js --repo owner/repo --workflow "CI/CD"

# Watch mode
./check.js --repo owner/repo --watch

# With notifications
./check.js --repo owner/repo --notify-failures --notify-success

# Enable auto-fix
./check.js --repo owner/repo --auto-fix
```

**Options:**
- `--repo` - Single repository (owner/repo)
- `--repos` - Multiple repositories (comma-separated)
- `--workflow` - Filter by workflow name
- `--limit` - Number of runs to check (default: 10)
- `--status` - Filter by status (completed, in_progress, queued)
- `--watch` - Continuous monitoring
- `--interval` - Check interval in seconds (default: 60)
- `--track` - Track in spreadsheet (default: true)
- `--notify-failures` - Notify on failures
- `--notify-success` - Notify on successes
- `--auto-fix` - Enable automatic fixing

### fix.js - Manually Fix Deployment

```bash
# Fix a specific run
./fix.js --repo owner/repo --run-id 12345678

# Force fix (override safety checks)
./fix.js --repo owner/repo --run-id 12345678 --force
```

**What happens:**
1. Fetches workflow run details
2. Extracts error logs
3. Categorizes the error
4. Determines fix strategy
5. Creates a job for Claude
6. Tracks the fix attempt
7. Sends notification

### history.js - View Past Deployments

```bash
# Last 30 days (default)
./history.js

# Last 7 days
./history.js --days 7

# Specific repo
./history.js --repo owner/repo

# Only failures
./history.js --status failure

# Combined
./history.js --repo owner/repo --days 14 --status failure
```

### report.js - Generate Reports

```bash
# Text report
./report.js

# Markdown format
./report.js --format markdown

# HTML report
./report.js --format html > report.html

# JSON data
./report.js --format json

# With notification
./report.js --format markdown --notify

# Last 7 days
./report.js --days 7

# Specific repo
./report.js --repo owner/repo
```

## Error Categories

The system automatically categorizes failures:

### test_failure
Unit tests, integration tests, or E2E tests failed.

**Common causes:**
- Test assertions not met
- Mocks out of date
- Race conditions
- Environment differences

**Fix strategy:**
- Analyze test logs
- Fix assertions
- Update mocks/fixtures
- Fix timing issues

### build_error
Compilation, bundling, or build process failed.

**Common causes:**
- Syntax errors
- Type errors
- Import/export issues
- Build configuration problems

**Fix strategy:**
- Check syntax
- Resolve imports
- Update build config
- Fix type issues

### dependency_issue
Package installation or dependency resolution failed.

**Common causes:**
- Missing dependencies
- Version conflicts
- Lock file out of sync
- Registry issues

**Fix strategy:**
- Update package.json
- Resolve conflicts
- Regenerate lock file
- Update dependencies

### timeout
Process exceeded time limit.

**Common causes:**
- Build too slow
- Tests running forever
- Resource constraints
- Inefficient processes

**Fix strategy:**
- Increase timeout
- Optimize build
- Parallelize tasks
- Fix infinite loops

### configuration_error
Invalid configuration or environment variables.

**Common causes:**
- Missing env vars
- Invalid config files
- Wrong secrets
- Incorrect paths

**Fix strategy:**
- Update env vars
- Fix config syntax
- Update secrets
- Correct paths

### unknown
Unrecognized error pattern.

**Fix strategy:**
- Deep log analysis
- Identify root cause
- Propose solution
- Implement fix

## Auto-Fix Process

When auto-fix is triggered:

### 1. Detection
System detects a failed workflow run.

### 2. Analysis
```
- Fetch workflow run details
- Get all job logs
- Extract error messages
- Identify failed steps
- Categorize error type
```

### 3. Strategy
```
Based on error category:
- test_failure → Fix test code
- build_error → Fix build issues
- dependency_issue → Update packages
- timeout → Optimize or increase limit
- configuration_error → Fix config
- unknown → General investigation
```

### 4. Job Creation
Creates a detailed job for Claude:
```markdown
# Fix Deployment Failure

## Repository
owner/repo

## Error
[Full error details]

## Your Task
1. Clone repository
2. Investigate failure
3. Implement fix
4. Run tests
5. Create PR
```

### 5. Execution
Claude (thepopebot):
- Clones the repo
- Analyzes the code
- Identifies root cause
- Implements fix
- Tests the solution
- Creates pull request

### 6. Tracking
```
- Log to Excel spreadsheet
- Record: timestamp, repo, error, fix, outcome
- Update metrics
```

### 7. Notification
```
Telegram message:
🔧 Auto-Fix Applied

Repository: owner/repo
Issue: Build timeout
Solution: Increased timeout, optimized build
PR: #789
Status: Tests passing
```

## Safety Features

### Protected Branches

Define in config:
```json
{
  "safety": {
    "require_approval_for": ["production", "main", "master"]
  }
}
```

Auto-fix will NOT run for these branches unless `--force` is used.

### Rate Limiting

Maximum auto-fixes per hour (default: 5):
```json
{
  "auto_fix": {
    "max_attempts": 5
  }
}
```

Prevents runaway fix loops.

### Always PR

```json
{
  "safety": {
    "always_create_pr": true
  }
}
```

Never pushes directly. Always creates a PR for review.

### Never Auto-Deploy

```json
{
  "safety": {
    "never_auto_deploy": ["production"]
  }
}
```

Won't trigger deployments to these environments.

## Excel Tracking

All deployments are tracked in Excel at:
```
/job/logs/deployments/tracking.xlsx
```

### Columns

- **Timestamp** - When the deployment occurred
- **Repository** - owner/repo
- **Workflow** - Workflow name
- **Status** - success/failure
- **Duration** - Time in seconds
- **Commit** - Short SHA
- **Branch** - Branch name
- **Error** - Error message (if failed)
- **Category** - Error category
- **Fix Applied** - Yes/No
- **Auto Fixed** - Yes/No
- **Run ID** - GitHub run ID

### Color Coding

- 🟢 Success = Green background
- 🔴 Failure = Red background

### Metrics

From the tracking data:
- **Success Rate** - Percentage of successful deployments
- **MTTR** - Mean Time To Recovery
- **Top Errors** - Most common failure types
- **Auto-Fix Rate** - Percentage successfully auto-fixed

## Notifications

### Telegram

**Failure notification:**
```
🔴 Deployment Failed

Repository: owner/repo
Workflow: CI/CD Pipeline
Branch: main
Error: Build timeout after 30 minutes
Run: #12345678

Auto-fix: Enabled ✓
Status: Investigating...
```

**Fix notification:**
```
🔧 Auto-Fix Applied

Repository: owner/repo
Issue: Build timeout
Solution: Increased timeout configuration
PR: #789
Status: Tests passing, awaiting approval
```

**Success notification:**
```
✅ Deployment Successful

Repository: owner/repo
Workflow: CI/CD Pipeline
Branch: main
Commit: abc1234
Duration: 180s
Run: #12345678
```

### Email

HTML-formatted email with:
- Deployment summary
- Error details (if failed)
- Fix details (if auto-fixed)
- Links to GitHub

Configure in `DEPLOYMENT_MONITOR.json`:
```json
{
  "notifications": {
    "email": {
      "enabled": true,
      "recipients": ["team@example.com"]
    }
  }
}
```

Requires SMTP credentials in `LLM_SECRETS`:
```json
{
  "SMTP_HOST": "smtp.gmail.com",
  "SMTP_PORT": "587",
  "SMTP_USER": "your-email@example.com",
  "SMTP_PASS": "your-app-password"
}
```

## Integration with thepopebot

### Cron Jobs

Add to `operating_system/CRONS.json`:

**Quick checks (every 5 minutes):**
```json
{
  "name": "deployment-monitor-quick",
  "schedule": "*/5 * * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/deployment-monitor && ./check.js --repos owner/repo1,owner/repo2 --track --notify-failures --auto-fix",
  "enabled": true
}
```

**Full agent checks (every 15 minutes):**
```json
{
  "name": "deployment-monitor-full",
  "schedule": "*/15 * * * *",
  "type": "agent",
  "job": "Read the file at operating_system/DEPLOYMENT_MONITOR.md and complete the tasks described there.",
  "enabled": true
}
```

**Daily reports:**
```json
{
  "name": "deployment-report-daily",
  "schedule": "0 9 * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/deployment-monitor && ./report.js --days 1 --format markdown --notify",
  "enabled": true
}
```

### GitHub Webhooks

Add to `operating_system/TRIGGERS.json`:

```json
{
  "name": "github-deployment-failure",
  "watch_path": "/github/webhook",
  "actions": [
    {
      "type": "command",
      "command": "cd /job/.pi/skills/deployment-monitor && ./check.js --repo {{body.repository.full_name}} --track --notify-failures --auto-fix"
    }
  ],
  "enabled": true
}
```

This triggers immediate checks when GitHub sends webhook events.

### Telegram Commands

Configure in Event Handler to respond to:

```
@thepopebot check deployments
@thepopebot fix deployment owner/repo 12345678
@thepopebot deployment report
@thepopebot deployment status
```

## Best Practices

### Starting Out

1. **Start passive** - Monitor only, no auto-fix
   ```bash
   ./check.js --repo owner/repo --watch --notify-failures
   ```

2. **Review patterns** - Understand common failures
   ```bash
   ./history.js --days 30 --status failure
   ```

3. **Test auto-fix** - Try on dev/staging first
   ```bash
   ./check.js --repo owner/staging --auto-fix
   ```

4. **Enable gradually** - Production last
   ```json
   {
     "repositories": [
       {"repo": "dev-app", "auto_fix": true},
       {"repo": "staging-app", "auto_fix": true},
       {"repo": "prod-app", "auto_fix": false}
     ]
   }
   ```

### Ongoing Operations

1. **Review auto-fixes** - Check PRs created by bot
2. **Update config** - Refine allowed actions
3. **Monitor costs** - Track GitHub Actions minutes and API usage
4. **Alert on repeats** - If same error keeps occurring, investigate deeper

### Production Safety

1. **Require approval** - Always for production branches
2. **Never push directly** - Always create PRs
3. **Test thoroughly** - Comprehensive test suites
4. **Monitor closely** - Watch auto-fix success rate
5. **Have rollback plan** - Be ready to revert if needed

## Troubleshooting

### "GitHub token not found"

```bash
# Check credentials
/job/.pi/skills/llm-secrets/llm-secrets.js | grep DEPLOYMENT_GITHUB_TOKEN
```

If missing, add to `LLM_SECRETS` in GitHub secrets.

### "Failed to create job"

Check Event Handler configuration:
- Is `GH_WEBHOOK_URL` set?
- Is `API_KEY` set?
- Is Event Handler running?

### "No deployments detected"

```bash
# Verify repository access
./check.js --repo owner/repo --verbose

# List workflows
./check.js --repo owner/repo --workflow "CI/CD"
```

Check:
- Repository name is correct
- Token has proper permissions
- Workflows exist

### Auto-fix not triggering

Check configuration:
```bash
cat /job/operating_system/DEPLOYMENT_MONITOR.json
```

Verify:
- `auto_fix.enabled` is `true`
- Branch not in `require_approval_for`
- Workflow not excluded

### Tracking not updating

```bash
# Check file path
ls -la /job/logs/deployments/tracking.xlsx

# Try manual tracking
cd .pi/skills/deployment-monitor
./check.js --repo owner/repo --track
```

## Advanced Usage

### Custom Fix Scripts

Create custom logic in `fixes/`:

```javascript
// .pi/skills/deployment-monitor/fixes/custom-timeout.js
export async function fix(context) {
  const { repo, runId, error } = context;
  
  // Custom fix logic
  if (error.includes('timeout')) {
    // Implement fix
    return {
      success: true,
      changes: ['Increased timeout to 60 minutes'],
      pr: 12345
    };
  }
  
  return { success: false };
}
```

### Webhook Integration

Set up GitHub webhooks to trigger immediate checks:

1. **In GitHub repo settings:**
   - Webhooks → Add webhook
   - Payload URL: `https://your-event-handler.com/github/webhook`
   - Content type: `application/json`
   - Events: Workflow runs

2. **In TRIGGERS.json:**
   ```json
   {
     "name": "github-deployment-webhook",
     "watch_path": "/github/webhook",
     "actions": [
       {
         "type": "command",
         "command": "cd /job/.pi/skills/deployment-monitor && ./check.js --repo {{body.repository.full_name}} --run-id {{body.workflow_run.id}}"
       }
     ],
     "enabled": true
   }
   ```

### Dashboard (Future)

Generate live dashboard:
```bash
./dashboard.js --port 3001
```

View at `http://localhost:3001`:
- Real-time deployment status
- Failure trends
- Fix success rate
- Recent activity

## Metrics & Analytics

### Key Metrics

**Success Rate:**
```
(Successful deployments / Total deployments) × 100
```

**MTTR (Mean Time To Recovery):**
```
Average time from failure to fix
```

**Auto-Fix Success Rate:**
```
(Successfully auto-fixed / Total fix attempts) × 100
```

**Deployment Frequency:**
```
Deployments per day/week
```

### Generate Report

```bash
# 30-day report
./report.js --days 30

# Output:
# Total Deployments: 150
# Success: 135 (90%)
# Failed: 15 (10%)
# Average Duration: 240s
# Auto-fixed: 12
#
# Error Categories:
#   test_failure: 8 (53%)
#   build_error: 4 (27%)
#   timeout: 2 (13%)
#   dependency_issue: 1 (7%)
```

## Cost Considerations

### GitHub Actions

- Free tier: 2,000 minutes/month
- Paid: $0.008/minute (Linux)

Monitor usage in GitHub settings.

### API Calls

- GitHub API: 5,000 requests/hour (authenticated)
- Usually sufficient for monitoring

### LLM Usage (Auto-Fix)

Each auto-fix job:
- Spawns Claude instance
- Cost depends on task complexity
- Typical: $0.10 - $1.00 per fix

Budget accordingly based on failure rate.

## Security Considerations

1. **Token permissions** - Use least privilege
2. **Protected branches** - Require reviews
3. **Audit logs** - Track all auto-fixes
4. **Rate limiting** - Prevent abuse
5. **Approval gates** - For critical systems

## Resources

- GitHub Actions Docs: https://docs.github.com/en/actions
- Octokit (GitHub API): https://octokit.github.io/rest.js
- ExcelJS Docs: https://github.com/exceljs/exceljs
- TelegramBots API: https://core.telegram.org/bots/api

## Support

For issues:
- Check `/job/logs/deployments/` for details
- Review tracking spreadsheet
- Check GitHub Actions logs
- Verify configuration in DEPLOYMENT_MONITOR.json
