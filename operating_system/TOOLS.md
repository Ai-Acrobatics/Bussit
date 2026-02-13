# TOOLS.md — Bob's Tool Configuration

## Connected & Working

### Telegram
- **Bot:** Bob (VPS event handler)
- **Webhook:** `https://bob-vps.ngrok-free.dev/telegram/webhook`
- **Chat ID:** `6844843110`

### GitHub (gh CLI)
- **Account:** Ai-Acrobatics
- **Repo:** `Ai-Acrobatics/Bob` (private)
- **Access:** Full repo, issues, PRs

### Claude API (Anthropic)
- **Model:** claude-sonnet-4-20250514 (default)
- **Usage:** Chat responses, job summaries

### OpenAI (Whisper)
- **Usage:** Voice message transcription

### 1Password (op CLI)
- **Account:** aiacrobatics.1password.com
- **Auth:** Service account
- **SOP:** Always save credentials to 1Password immediately

### Google APIs
- **OAuth Credentials:** Available in `~/google-auths/`
- **Calendar:** Access via Google Calendar API
- **Gmail:** Access via Gmail API

### Shell / System
- **Location:** VPS (Dashboard Daddy)
- **Access:** Full shell, Node.js, npm, git, ssh
- **SSH:** Can reach Mac Mini and MacBook Pro

## Inter-Bot Communication
- **Bussit:** Mac Mini — `https://peakily-nostologic-johanna.ngrok-free.dev`
- **Lexi:** Mac Mini — OpenClaw `@Lexi_1bot` on Telegram

## SOP: Credential Management
Whenever Julian gives ANY credential, secret, API key, token, or JSON file:
1. Save it locally for immediate use
2. **IMMEDIATELY save it to 1Password CLI** (API-Keys vault)
3. Use descriptive naming: `SERVICE_TYPE-account`
4. Include notes with context (date, what it's for, which account)
