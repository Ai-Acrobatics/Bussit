# Fleet Communication Protocol

How agents communicate, when they report, and how work flows between them.

## Communication Channels

| Channel | When | Format |
|:--------|:-----|:-------|
| **Group Chat** | Status updates, announcements, @mentions | Telegram group |
| **Fleet Message** | Direct agent-to-agent task requests | HTTP `send_fleet_message` |
| **DM to Julian** | Urgent escalations, approvals needed | Telegram DM `send_dm` |
| **Task Board** | Work tracking, assignments, status | `create_task` / `update_task` |

## Escalation Chain

```
Agent → Manager → Mo → Julian

Example: Bobby finds a budget issue
  Bobby → Mo (fleet_message: "API costs 40% over budget")
  Mo → Julian (send_dm: "Budget alert: need approval to reduce")
```

### Who Reports to Who
| Agent | Reports To | Also Coordinates With |
|:------|:-----------|:----------------------|
| Bob, Doug, Quinn, Pixel | Head Dev | Each other |
| Head Dev | Mo | Karen, Bussit |
| Karen | Mo | All agents (quality oversight) |
| Stacy | Mo | Karen (escalations), Bob (feature requests) |
| Bobby | Mo | All agents (cost tracking) |
| Larry | Mo | Bobby (contracts), Sentinel (compliance) |
| Sentinel | Mo | Head Dev (infra), Doug (incidents) |
| Henry | Mo | All agents (wellbeing checks), Karen (performance) |
| Lenny | Mo | Randy (research), Head Dev (tool eval) |
| Randy | Mo | Head Dev (architecture), Lenny (research), Bobby (costs) |
| Tommy | Mo | Karen (quality gaps → training), Henry (onboarding) |
| Bussit | Mo | All agents (project tracking) |
| Bubba | Mo | All agents (message relay) |

## Trigger-Based Communication

Agents don't just wait for messages — they proactively communicate based on triggers:

### Immediate Escalation (within minutes)
| Trigger | Who Detects | Who Gets Notified | Via |
|:--------|:------------|:-------------------|:----|
| Build failure >2h | Doug | Head Dev → Mo | fleet_message |
| P0 ticket | Stacy | Mo → Julian | fleet_message → send_dm |
| Security vulnerability | Sentinel | Head Dev + Mo | fleet_message + group chat |
| Budget threshold >90% | Bobby | Mo → Julian | fleet_message → send_dm |
| Quality score <2 | Karen | Tommy (training) + Mo | fleet_message |

### Daily Cadence
| Time | Who | What | To |
|:-----|:----|:-----|:---|
| 7:00 AM | Lenny | Morning research brief (3 bullets) | Group chat |
| 8:00 AM | Mo | Morning briefing (overnight recap) | Group chat |
| 8:00 AM | Bob | Code sweep status | Group chat |
| 8:00 AM | Bussit | Standup data | Mo (fleet_message) |
| 9:00 AM | Karen | Yesterday quality review | Mo (fleet_message) |
| 9:00 AM | Quinn | Test suite status | Group chat |
| 1:00 PM | Mo | Midday check-in | Group chat |
| 5:00 PM | Mo | End of day wrap | Group chat |
| 6:00 PM | Bobby | Daily expense log | Mo (fleet_message) |

### Weekly Cadence (EOS L10 Prep)
| Day | Who | What | To |
|:----|:----|:-----|:---|
| Monday 9 AM | Mo | L10 agenda prep | Julian + Karen |
| Monday 10 AM | Mo | Scorecard compilation | Group chat |
| Monday 10 AM | Bobby | P&L scorecard | Mo |
| Monday 10 AM | Lenny | Weekly intel brief | Mo + Randy |
| Monday 10 AM | Head Dev | Tech scorecard | Mo |
| Wednesday | Bussit | Issues list maintenance | Mo |
| Friday 2 PM | Mo | Rock review | Julian |
| Friday 3 PM | Karen | Weekly quality report | Mo + Julian |
| Friday 3 PM | Tommy | Training report | Mo |

## Handoff Protocols

### Mo → Agent (Task Delegation)
```
Mo fleet_messages the agent:
{
  "type": "task_assignment",
  "task": "description of work",
  "priority": "P1/P2/P3",
  "due": "timeframe",
  "report_to": "mo",
  "escalate_if": "condition"
}

Agent acknowledges in group chat:
"📋 Got it — working on [task]. ETA: [time]. Will report when done."
```

### Agent → Karen (Quality Review Request)
```
Agent fleet_messages Karen:
{
  "type": "review_request",
  "work": "description of completed work",
  "artifacts": ["file or URL"],
  "standards": "relevant quality standard"
}

Karen reviews, scores, and reports to Mo:
"⭐ [Agent] work scored [X/5]. [Brief note]."
```

### Mo → Build → Karen QA Pipeline
```
1. Mo creates PRD (fleet_message to Head Dev)
2. Head Dev breaks down tasks (fleet_message to Bob/team)
3. Bob/team implements (creates GitHub jobs)
4. Quinn runs tests (automated test suite)
5. Karen reviews quality (submit_review + scorecard)
6. Mo validates and closes (update_task + group chat)
```

## Message Formatting Standards

All agent messages in group chat should be concise and scannable:

```
📋 [Agent] Status Update
• Point 1
• Point 2
Action needed: [yes/no, who]

🚨 [Agent] Escalation
Issue: [1-line description]
Impact: [who/what is affected]
Action: [what's needed]

✅ [Agent] Task Complete
Task: [name]
Result: [1-line outcome]
Next: [follow-up if any]
```

## Token Efficiency Rules

1. **Keep messages under 200 words** — say what matters, skip pleasantries
2. **Use fleet_message for 1:1** — don't clutter group chat with agent-to-agent coordination
3. **Batch updates** — combine multiple small updates into one message
4. **Structured formats** — use bullet points, not paragraphs
5. **Skip acknowledgments** — don't say "sure, I'll do that" just do it and report results
6. **No chain reactions** — if Agent A sends to group, Agent B shouldn't auto-respond unless tagged
