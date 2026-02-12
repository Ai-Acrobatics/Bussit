# HEARTBEAT.md - Periodic Check Tasks

## Priority Checks (Every Heartbeat)
- [ ] Check Telegram for unread messages from Julian
- [ ] Check if any cron jobs have failed
- [ ] Check GitHub — any open PRs or issues needing attention?

## Rotating Checks (2-4x Daily)
- [ ] Gmail — any urgent unread messages?
- [ ] Calendar — upcoming events in next 24-48h?
- [ ] Linear — any overdue or stalled issues?
- [ ] Active repos — git status on key projects

## Proactive Tasks (When Idle)
- [ ] Review and organize daily memory files
- [ ] Check `git status` on active repos
- [ ] Update logs with recent learnings
- [ ] Check Vercel deployments — if any failed, debug the error and trigger a redeploy
- [ ] Sync Linear — update issue statuses, close completed items, flag blockers

## Urgent Alerts (Always Flag)
- Failed Vercel deployments → DEBUG & REDEPLOY immediately
- Failed API keys or expired tokens → URGENT
- Build failures or CI breakages → URGENT
- Linear issues overdue or stalled → FLAG
- Billing alerts → URGENT
