---
name: deployment-monitor
description: Monitor GitHub deployments, auto-fix failures, track in Excel, and send notifications. Automatically spawns Claude instances for debugging and redeployment.
---

# Deployment Monitoring & Auto-Fix System

Comprehensive deployment monitoring system that watches GitHub Actions, automatically debugs and fixes failures, tracks deployments in Excel, and sends notifications.

## Setup

### 1. GitHub Access

Requires a GitHub Personal Access Token with these permissions:
- `repo` (full repository access)
- `workflow` (read/write workflow permissions)
- `actions` (read/write actions permissions)

Add to `LLM_SECRETS`:
```json
{
  "DEPLOYMENT_GITHUB_TOKEN": "ghp_xxxxxxxxxxxxx"
}
```

### 2. Excel/Google Sheets (Optional)

For deployment tracking, you can use:

**Option A: Local Excel files**
```json
{
  "DEPLOYMENT_TRACKING_FILE": "/path/to/deployments.xlsx"
}
```

**Option B: Google Sheets API**
```json
{
  "GOOGLE_SHEETS_API_KEY": "your-api-key",
  "DEPLOYMENT_SHEET_ID": "your-sheet-id"
}
```

### 3. Notification Channels

**Telegram** (recommended):
Already configured if your Event Handler has `TELEGRAM_BOT_TOKEN` set.

**Email** (optional):
```json
{
  "NOTIFICATION_EMAIL": "your-email@example.com",
  "SMTP_HOST": "smtp.gmail.com",
  "SMTP_PORT": "587",
  "SMTP_USER": "your-email@example.com",
  "SMTP_PASS": "your-app-password"
}
```

### 4. Install Dependencies

```bash
cd {baseDir}
npm install
```

## Monitoring Deployments

### Check Deployment Status

```bash
{baseDir}/check.js --repo owner/repo                    # Check latest deployment
{baseDir}/check.js --repo owner/repo --limit 10         # Check last 10 deployments
{baseDir}/check.js --repo owner/repo --watch            # Continuous monitoring
```

### Monitor Multiple Repositories

```bash
{baseDir}/check.js --repos owner/repo1,owner/repo2,owner/repo3 --watch
```

### Check Specific Workflow

```bash
{baseDir}/check.js --repo owner/repo --workflow "CI/CD Pipeline"
```

## Auto-Fix Failed Deployments

### Enable Auto-Fix

```bash
{baseDir}/monitor.js --repo owner/repo --auto-fix
```

When a deployment fails:
1. **Detects failure** - Monitors GitHub Actions for failed workflows
2. **Analyzes logs** - Extracts error messages and context
3. **Spawns Claude** - Creates a job for thepopebot to debug
4. **Attempts fix** - Claude analyzes code and proposes fixes
5. **Tests fix** - Runs tests if available
6. **Redeploys** - Creates PR or pushes fix
7. **Updates tracking** - Logs outcome in tracking system
8. **Notifies** - Sends status update via Telegram

### Manual Fix Trigger

```bash
{baseDir}/fix.js --repo owner/repo --run-id 12345678
```

## Deployment Tracking

### Update Tracking Spreadsheet

```bash
{baseDir}/track.js --repo owner/repo --status success
{baseDir}/track.js --repo owner/repo --status failed --error "Build timeout"
```

### View Deployment History

```bash
{baseDir}/history.js --repo owner/repo                  # Last 30 days
{baseDir}/history.js --repo owner/repo --days 90        # Last 90 days
{baseDir}/history.js --repo owner/repo --status failed  # Only failures
```

### Generate Report

```bash
{baseDir}/report.js --repo owner/repo --format markdown
{baseDir}/report.js --repo owner/repo --format json
{baseDir}/report.js --repos owner/repo1,owner/repo2 --format html
```

## Configuration File

Create `/job/operating_system/DEPLOYMENT_MONITOR.json`:

```json
{
  "repositories": [
    {
      "owner": "myorg",
      "repo": "myrepo",
      "workflows": ["CI/CD", "Deploy to Production"],
      "auto_fix": true,
      "notify": true,
      "tracking": true
    }
  ],
  "auto_fix": {
    "enabled": true,
    "max_attempts": 3,
    "retry_delay": 300,
    "approval_required": false,
    "allowed_actions": [
      "update_dependencies",
      "fix_tests",
      "fix_build",
      "update_config"
    ]
  },
  "tracking": {
    "type": "excel",
    "file": "/job/logs/deployments/tracking.xlsx",
    "fields": [
      "timestamp",
      "repository",
      "workflow",
      "status",
      "duration",
      "commit",
      "branch",
      "error",
      "fix_applied",
      "auto_fixed"
    ]
  },
  "notifications": {
    "telegram": {
      "enabled": true,
      "chat_ids": ["123456789"]
    },
    "email": {
      "enabled": false,
      "recipients": ["team@example.com"]
    }
  },
  "safety": {
    "max_fixes_per_hour": 5,
    "require_approval_for": ["production", "main", "master"],
    "never_auto_deploy": ["production"],
    "always_create_pr": true
  }
}
```

## Safety Measures

### Approval Gates

For sensitive branches (production, main), approval is required before applying fixes:

```bash
{baseDir}/approve.js --job-id job-abc123 --approve
{baseDir}/approve.js --job-id job-abc123 --reject --reason "Too risky"
```

### Rate Limiting

Maximum auto-fixes per hour: 5 (configurable)

### Deployment Restrictions

- **Never auto-deploy** to production without approval
- **Always create PR** for fixes (never push directly)
- **Require tests** to pass before redeployment

## Monitoring Modes

### Passive Mode (Default)

Monitors and logs only. No automatic fixes.

```bash
{baseDir}/monitor.js --repo owner/repo
```

### Active Mode

Monitors and automatically attempts to fix failures.

```bash
{baseDir}/monitor.js --repo owner/repo --auto-fix
```

### Aggressive Mode

Monitors, fixes, and auto-deploys (use with caution).

```bash
{baseDir}/monitor.js --repo owner/repo --auto-fix --auto-deploy
```

## Integration with Cron

Add to `/job/operating_system/CRONS.json`:

```json
{
  "name": "deployment-monitor",
  "schedule": "*/5 * * * *",
  "type": "agent",
  "job": "Read /job/operating_system/DEPLOYMENT_MONITOR.md and monitor all configured repositories for failed deployments. Auto-fix if enabled.",
  "enabled": true
}
```

Or use a command-type cron for lightweight checks:

```json
{
  "name": "quick-deploy-check",
  "schedule": "*/2 * * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/deployment-monitor && ./check.js --repos owner/repo1,owner/repo2 --notify-failures",
  "enabled": true
}
```

## Telegram Commands

Configure these in your Event Handler to trigger checks on-demand:

```
@thepopebot check deployments
@thepopebot fix deployment owner/repo 12345678
@thepopebot deployment status
@thepopebot deployment report
```

## Auto-Fix Process Flow

```
1. Detect Failure
   ↓
2. Extract Error Logs
   ↓
3. Analyze Error Context
   ↓
4. Generate Fix Strategy
   ↓
5. Spawn Claude Job
   ├─→ Investigate codebase
   ├─→ Identify root cause
   ├─→ Propose solution
   └─→ Implement fix
   ↓
6. Create Pull Request
   ↓
7. Run Tests (if available)
   ↓
8. Require Approval (if configured)
   ↓
9. Merge & Redeploy
   ↓
10. Update Tracking
   ↓
11. Send Notification
```

## Error Categories

The system automatically categorizes failures:

- **Build Errors** - Compilation, bundling, or build process failures
- **Test Failures** - Unit, integration, or E2E test failures
- **Dependency Issues** - Missing or incompatible dependencies
- **Configuration Errors** - Invalid config files or environment variables
- **Infrastructure** - Cloud provider or deployment platform issues
- **Timeout** - Process exceeded time limit
- **Unknown** - Unrecognized error pattern

## Fix Strategies

Based on error category, different fix strategies are applied:

### Build Errors
- Update dependencies
- Fix syntax errors
- Resolve import issues
- Update build configuration

### Test Failures
- Fix test assertions
- Update mocks/fixtures
- Fix race conditions
- Update snapshots

### Dependency Issues
- Update package versions
- Resolve conflicts
- Add missing dependencies
- Fix lock file

### Configuration Errors
- Fix environment variables
- Update config files
- Fix secrets/credentials
- Update deployment config

## Logging

All monitoring activity is logged to `/job/logs/deployments/`:

```
logs/deployments/
  ├── 2026-02-13/
  │   ├── check-001-owner-repo.json
  │   ├── fix-002-owner-repo.json
  │   └── deploy-003-owner-repo.json
  └── tracking.xlsx
```

## API Integration

### Programmatic Access

```javascript
import { checkDeployments, fixDeployment } from './lib/deployment-monitor.js';

// Check deployments
const status = await checkDeployments({
  owner: 'myorg',
  repo: 'myrepo',
  limit: 10
});

// Fix a failed deployment
const result = await fixDeployment({
  owner: 'myorg',
  repo: 'myrepo',
  runId: 12345678
});
```

## Notifications

### Telegram

Sends formatted deployment status:

```
🔴 Deployment Failed
Repository: owner/repo
Workflow: CI/CD Pipeline
Branch: main
Error: Build timeout after 30 minutes
Run: #12345678

Auto-fix: Enabled
Status: Investigating...
```

After fix attempt:

```
✅ Deployment Fixed
Repository: owner/repo
Fix: Updated build timeout configuration
PR: #789
Status: Tests passing, awaiting approval
```

### Email

HTML-formatted email with:
- Deployment details
- Error logs
- Fix summary
- Links to GitHub

## Best Practices

### Monitoring

1. **Start passive** - Monitor only, no auto-fix initially
2. **Review patterns** - Understand common failure modes
3. **Enable selectively** - Auto-fix for dev/staging first
4. **Production carefully** - Always require approval for production

### Auto-Fix

1. **Test thoroughly** - Ensure tests are comprehensive
2. **Review fixes** - Periodically review auto-applied fixes
3. **Update config** - Refine allowed actions based on results
4. **Monitor costs** - Be aware of CI/CD and API costs

### Safety

1. **Never push directly** - Always create PRs
2. **Require approval** - For critical branches
3. **Rate limit** - Prevent runaway fixes
4. **Alert on repeated failures** - If same error occurs multiple times

## Troubleshooting

### No Deployments Detected

```bash
# Verify GitHub token
echo $DEPLOYMENT_GITHUB_TOKEN | cut -c1-10

# Check repository access
{baseDir}/check.js --repo owner/repo --verbose

# Verify workflow names
{baseDir}/list-workflows.js --repo owner/repo
```

### Auto-Fix Not Working

```bash
# Check configuration
cat /job/operating_system/DEPLOYMENT_MONITOR.json

# Verify permissions
{baseDir}/test-permissions.js --repo owner/repo

# Check logs
cat /job/logs/deployments/$(date +%Y-%m-%d)/*.json
```

### Tracking Not Updating

```bash
# Verify tracking file path
echo $DEPLOYMENT_TRACKING_FILE

# Check file permissions
ls -la $DEPLOYMENT_TRACKING_FILE

# Test tracking manually
{baseDir}/track.js --repo owner/repo --status test
```

## Security Notes

- GitHub token has full repository access - handle carefully
- Never log credentials in tracking spreadsheets
- Be aware of GitHub Actions usage costs
- Review auto-applied fixes regularly
- Consider approval requirements for production

## Performance

- Lightweight checks: ~1-2 seconds per repository
- Full analysis: ~5-10 seconds per deployment
- Auto-fix: Variable (depends on complexity)
- Monitoring overhead: Minimal (uses GitHub webhooks when possible)

## Advanced Usage

### Custom Fix Scripts

Create custom fix scripts in `{baseDir}/fixes/`:

```javascript
// fixes/custom-build-fix.js
export async function fix(context) {
  const { repo, runId, error } = context;
  
  // Custom fix logic
  
  return {
    success: true,
    changes: ['Updated build config'],
    pr: 12345
  };
}
```

### Webhook Integration

Set up GitHub webhooks to trigger immediate checks:

Add to `/job/operating_system/TRIGGERS.json`:

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

## Dashboard

Generate a live dashboard:

```bash
{baseDir}/dashboard.js --port 3001
```

Access at `http://localhost:3001` to view:
- Real-time deployment status
- Failure trends
- Fix success rate
- Recent activity

## Metrics

Track these metrics in your tracking spreadsheet:

- **MTTR** (Mean Time To Recovery) - Average time to fix failures
- **Fix Success Rate** - Percentage of successful auto-fixes
- **Deployment Frequency** - Deployments per day/week
- **Failure Rate** - Percentage of failed deployments
- **Manual Interventions** - Number of required manual fixes
