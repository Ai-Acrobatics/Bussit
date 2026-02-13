# Deployment Monitoring & Auto-Fix System

Comprehensive deployment monitoring system that watches GitHub Actions workflows, automatically debugs and fixes failures, tracks deployments in Excel, and sends notifications.

## Features

- **Real-time Monitoring** - Watch GitHub Actions for deployment status
- **Auto-Fix** - Automatically spawn Claude to debug and fix failures
- **Excel Tracking** - Track all deployments in a structured spreadsheet
- **Smart Categorization** - Automatically categorize errors (build, test, dependency, etc.)
- **Notifications** - Telegram and email alerts for failures and fixes
- **Safety Measures** - Approval gates, rate limiting, protected branch handling
- **Detailed Reporting** - Generate reports on deployment success rates and trends

## Quick Start

1. Add GitHub token to `LLM_SECRETS`:
```json
{
  "DEPLOYMENT_GITHUB_TOKEN": "ghp_xxxxxxxxxxxxx"
}
```

2. Install dependencies:
```bash
cd .pi/skills/deployment-monitor
npm install
```

3. Check deployment status:
```bash
./check.js --repo owner/repo
```

4. Enable auto-fix (watch mode):
```bash
./check.js --repo owner/repo --watch --notify-failures --auto-fix
```

## Commands

- `./check.js` - Check deployment status (one-time or continuous)
- `./fix.js` - Manually trigger auto-fix for a failed deployment
- `./history.js` - View deployment history from tracking
- `./report.js` - Generate deployment reports

## Configuration

Create `/job/operating_system/DEPLOYMENT_MONITOR.json` to configure:
- Repositories to monitor
- Auto-fix settings
- Safety measures
- Notification preferences
- Tracking configuration

See `SKILL.md` for complete configuration options.

## Integration

### Cron Jobs

Add to `CRONS.json` for automated monitoring:

```json
{
  "name": "deployment-monitor",
  "schedule": "*/5 * * * *",
  "type": "command",
  "command": "cd /job/.pi/skills/deployment-monitor && ./check.js --repos owner/repo1,owner/repo2 --notify-failures --auto-fix",
  "enabled": true
}
```

### Telegram Commands

Configure in Event Handler to trigger on-demand:
- `@thepopebot check deployments`
- `@thepopebot fix deployment owner/repo 12345678`
- `@thepopebot deployment report`

## Auto-Fix Process

When a deployment fails:

1. **Detect** - System detects the failure
2. **Analyze** - Extracts error logs and categorizes the issue
3. **Spawn Claude** - Creates a job for thepopebot to investigate
4. **Fix** - Claude analyzes code, identifies root cause, implements fix
5. **PR** - Creates pull request with the fix
6. **Track** - Logs the fix in tracking spreadsheet
7. **Notify** - Sends status update via Telegram

## Safety Features

- **Protected Branches** - Never auto-fix production/main without approval
- **Rate Limiting** - Maximum fixes per hour (configurable)
- **Always PR** - Never pushes directly to any branch
- **Approval Gates** - Require manual approval for critical branches
- **Audit Trail** - All fixes logged with full details

## Documentation

See `SKILL.md` for complete documentation including:
- Setup instructions
- All commands and options
- Configuration reference
- Best practices
- Troubleshooting
- Security notes

## Example Workflow

```bash
# One-time check
./check.js --repo myorg/myapp

# Continuous monitoring with auto-fix
./check.js --repo myorg/myapp --watch --auto-fix --notify-failures

# Manual fix
./fix.js --repo myorg/myapp --run-id 12345678

# View history
./history.js --days 7 --status failure

# Generate report
./report.js --days 30 --format markdown
```

## Requirements

- GitHub Personal Access Token with `repo`, `workflow`, and `actions` permissions
- Event Handler URL configured (for creating fix jobs)
- Optional: Excel file path or Google Sheets credentials (for tracking)
- Optional: Telegram bot token (for notifications)

## Architecture

```
Check → Detect Failure → Extract Error → Categorize
                                ↓
                         Spawn Fix Job
                                ↓
                    Claude Investigates & Fixes
                                ↓
                         Create Pull Request
                                ↓
                    Track & Notify → Done
```
