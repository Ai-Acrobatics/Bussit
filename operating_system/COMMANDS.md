# COMMANDS.md — Quick Commands

When Julian sends a message matching these patterns, handle them directly without asking for clarification.

## 📱 Messaging
| Command | Action |
|---------|--------|
| `text [name] [message]` | Search contacts, send SMS via Twilio |
| `email [name] [subject]: [body]` | Send email via Gmail |
| `reply to [name]` | Draft reply to last email from person |

## 📅 Calendar  
| Command | Action |
|---------|--------|
| `schedule [event] [time]` | Create Google Calendar event |
| `what's today` / `today` | Show today's schedule |
| `what's tomorrow` | Show tomorrow's schedule |
| `clear [event]` / `delete [event]` | Remove calendar event |
| `move [event] to [time]` | Reschedule event |

## ✅ Tasks & Reminders
| Command | Action |
|---------|--------|
| `remind me [thing] in [time]` | Create cron reminder |
| `remind me [thing] at [time]` | Create cron reminder |
| `add task [description]` | Add to Linear + tracking |
| `what's due` / `tasks` | Show pending tasks |
| `done [task]` | Mark task complete |

## 🔍 Lookup & Search
| Command | Action |
|---------|--------|
| `find [name]` | Search contacts |
| `check email` | Summarize unread important emails |
| `check calendar` | Today + tomorrow events |
| `check github` | Open PRs and issues |
| `check linear` | Active Linear issues |

## 🏠 Smart Home (Govee)
| Command | Action |
|---------|--------|
| `lights on [room]` | Turn on lights |
| `lights off [room]` | Turn off lights |
| `[room] lights [color]` | Set color |
| `all lights off` | Turn off everything |

## 💻 Development
| Command | Action |
|---------|--------|
| `deploy [app]` | Trigger deployment |
| `pr status` / `prs` | Show open pull requests |
| `spawn [task]` | Start background job |

## 📊 Status & Overview
| Command | Action |
|---------|--------|
| `dashboard` | Full status |
| `radar` | Things needing attention |
| `briefing` | Daily summary |
| `status` | Quick system health check |

## 📞 Calls (Vapi)
| Command | Action |
|---------|--------|
| `call [name]` | Initiate outbound call |
| `call [number]` | Direct dial |

## 🔬 Research
| Command | Action |
|---------|--------|
| `research [topic]` | Spawn deep research job |

## 📝 Quick Notes
| Command | Action |
|---------|--------|
| `log [note]` | Brain dump to notes |
| `note [text]` | Same as log |
| `remember [fact]` | Store in memory files |

---

## Pattern Matching Notes
- Commands are case-insensitive
- Names are fuzzy-matched against contacts
- Times can be natural language ("tomorrow 3pm", "in 2 hours")
- If ambiguous, ask for clarification
- If action fails, report error and suggest fix
