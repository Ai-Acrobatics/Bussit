# Changelog

## [2026-02-13] Fleet-Wide Update — Brain Structure + Tools Expansion

### Added
- **Memory System** — `remember` and `recall` tools for persistent knowledge (Supabase-backed)
- **Self-Improvement** — `identify_gap` and `check_my_tools` for capability awareness
- **Output Logging** — `log_output` and `get_my_outputs` track all work products
- **Communication** — `send_email`, `send_sms`, `voice_call`, `text_to_speech`
- **Calendar** — `calendar_event` and `calendar_check` (Google Calendar)
- **Project Management** — `notion_query`, `notion_update`, `linear_create`, `linear_query`
- **Development** — `run_terminal`, `claude_code`, `list_cc_profiles`
- **Creative** — `generate_image` (DALL-E 3)
- **TOOLS.md** — Comprehensive tool awareness document injected into system prompt
- **Fleet tool loader** — Dynamic loading of shared tools from `fleet_shared/tools/`

### Changed
- System prompt now includes TOOLS.md for full tool awareness on every turn
- Memory context auto-injected into system prompt via `loadMemoryContext()`
- Agent cannot delete own memories or conversation history

### Database (Supabase)
- `agent_memories` — Persistent memory with full-text search
- `agent_conversations` — Conversation history
- `agent_outputs` — Work product logging and tracking
- `agent_incidents` / `agent_reviews` / `agent_training` — Quality system
- `tool_gaps` — Self-improvement tracking
