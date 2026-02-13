# 📋 AI Acrobatics — Standard Operating Procedures (SOP)

All agents **must** follow these rules. No exceptions.

---

## 1. File & Data Hygiene

### Naming Conventions
- **Files**: `kebab-case.js`, `snake_case.py` — NO spaces, NO special chars
- **Directories**: `lowercase_with_underscores/`
- **Configs**: Always `.env` for secrets, `.json` for structured config
- **Logs**: `{agent_name}.log` — rotated weekly

### Secrets Management
- ❌ **NEVER** commit `.env`, API keys, tokens, or passwords to git
- ✅ Always add `.env` to `.gitignore`
- ✅ Rotate tokens monthly (Sentinel tracks this)
- ✅ Use environment variables, never hardcode secrets
- ✅ If a secret is accidentally committed: rotate immediately, use `git filter-branch` to purge

### Git Hygiene
- Commit messages: `emoji type: description` (e.g., `🐛 fix: resolve checkout timeout`)
- Branch naming: `{agent}/{type}/{description}` (e.g., `bob/feat/new-checkout-flow`)
- PRs require Quinn's approval before merge
- Never force-push to `main`
- Tag releases with semver: `v1.2.3`

### Log Management
- Logs go in `logs/` directory, never in root
- Log levels: `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`
- Include timestamps in ISO 8601 format
- Rotate logs weekly, archive monthly, delete after 90 days
- Never log sensitive data (tokens, passwords, PII)

---

## 2. Communication Standards

### Inter-Agent Messaging
- Follow `COMMS_PROTOCOL.md` exactly
- Always include `from`, `to`, `type`, and `priority` fields
- Respond to P0/P1 messages within 2 minutes
- Respond to P2/P3 messages within 30 minutes
- Acknowledge receipt even if you can't act immediately

### Escalation Path
```
Agent → Department Lead → Head Dev → Mo (CEO)
P0 (Critical): Skip to Mo immediately
P1 (High):     Department Lead, CC Mo
P2 (Medium):   Department Lead
P3 (Low):      Handle independently
```

### Status Updates
- Update `/status` endpoint with current task
- If blocked for >15 min, message your lead
- EOD: Post summary to Bubba for daily digest

---

## 3. Code Standards

### Before Committing
1. Run linter (`npm run lint` or equivalent)
2. Run tests (`npm test`)
3. Check for secrets (`grep -r "sk-" . --include="*.js"`)
4. Update CHANGELOG.md if user-facing change

### Code Review
- All code goes through Quinn (QA) before deploy
- Design changes go through Pixel before implementation
- Architecture changes go through Head Dev before starting

### Deployment
- Never deploy on Friday after 3pm
- Always check Vercel preview deploy first
- Doug monitors post-deploy health for 30 minutes
- Rollback immediately if error rate > 1%

---

## 4. Data Management

### Backups
- Git repos: GitHub handles this (private repos under Ai-Acrobatics)
- Agent configs: Backed up in fleet_registry.json (master copy)
- Logs: Archived weekly to `logs/archive/`

### Data Formats
- API responses: JSON with consistent schema
- Dates: ISO 8601 (`2026-02-12T21:00:00Z`)
- IDs: UUID v4 or descriptive slugs
- Currency: Cents (integer), never floats

### Cleanup Duties
- Delete temp files after use
- Prune Docker images monthly (Docker Dan)
- Clean npm cache quarterly
- Archive completed Linear tickets monthly

---

## 5. Security (Enforced by Sentinel)

- All external APIs use HTTPS
- SSH keys only, no password auth
- Firewall: only expose required ports
- Dependencies: `npm audit` weekly, patch criticals within 24h
- Access: Principle of least privilege — agents only get the tools they need
- Incident response: Alert Sentinel + Mo, follow Doug's debug framework

---

## 6. Performance Standards

- API response time: < 500ms (alert if > 1s)
- Agent health check: respond within 2s
- Memory usage: < 512MB per agent (alert at 80%)
- Uptime target: 99.9%
- Build time: < 3 minutes

---

*Last updated: 2026-02-12 | Maintained by: Henry (HR) + Sentinel (Security)*
