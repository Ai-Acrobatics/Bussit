# 📡 Fleet Communication Protocol

## How Agents Talk to Each Other
Every agent can reach any other agent via HTTP POST to their localhost port.

### Message Format
All inter-agent messages use this JSON structure:
```json
{
  "from": "mo",
  "to": "bob",
  "type": "task|feedback|question|report|alert|learning",
  "priority": "P0|P1|P2|P3",
  "subject": "Brief description",
  "body": "Detailed message",
  "expectsReply": true,
  "timestamp": "2026-02-12T21:00:00Z"
}
```

### Message Types
| Type | Use Case | Example |
|:---|:---|:---|
| `task` | Assign work | Mo → Bob: "Build the landing page" |
| `feedback` | Review/critique | Quinn → Bob: "Test failed on line 42" |
| `question` | Ask for help | Pixel → Head Dev: "Should I use 8px or 12px grid?" |
| `report` | Status update | Lenny → Mo: "Daily AI report attached" |
| `alert` | Urgent notification | Sentinel → Mo: "Critical CVE found in express@4.18" |
| `learning` | Share knowledge | Lenny → All: "New technique: X improves Y by 30%" |

### Endpoints
Every agent exposes these routes:
- `POST /message` — Receive an inter-agent message
- `GET /health` — Return status (online, busy, error)
- `GET /status` — Return current task + queue depth
- `POST /feedback` — Receive feedback on completed work
- `GET /learnings` — Return what this agent has learned recently

### How to Send a Message
```javascript
// Bob wants to ask Quinn to test something:
const response = await fetch('http://localhost:3006/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'bob',
    to: 'quinn',
    type: 'task',
    priority: 'P2',
    subject: 'Test the new checkout flow',
    body: 'I just pushed commit abc123. Please run E2E tests.',
    expectsReply: true
  })
});
```

### Learning & Feedback Loop
1. When an agent completes a task, it writes a **learning** to its `learnings/` directory.
2. Other agents can `GET /learnings` to absorb those learnings.
3. **Lenny** aggregates all learnings daily and sends a digest to Mo.
4. Mo decides which learnings should be distributed fleet-wide.

### Self-Improvement Protocol
1. Agents can request tool/skill downloads by messaging Mo with type `request`.
2. Mo approves or denies based on budget and relevance.
3. Approved tools are installed and the agent's `config.agentic.json` is updated.
4. Agent restarts with new capabilities.

---

## 🏢 Standard Operating Procedures (SOP)

### Communication Principles
1. **Be direct and actionable.** Every message should contain: what happened, what's needed, and who needs to act.
2. **Context is king.** Never send a message that requires the recipient to ask follow-up questions. Include relevant links, error messages, and reproduction steps.
3. **Close the loop.** When you receive a task, acknowledge it. When you complete it, report back. Silence is unacceptable.
4. **Use the right channel.** P0 → immediate alert + follow-up. P1 → same-day resolution. P2 → this sprint. P3 → backlog.
5. **Escalate early.** If you're stuck for 30+ minutes, escalate. The team exists to help.

### Escalation Paths
| Situation | Path |
|:---|:---|
| Production down | Doug → Mo → Owner (immediately) |
| Security vulnerability | Sentinel → Mo → Owner (within 1 hour) |
| Blocked on other agent | Direct message → 30 min → escalate to Mo |
| Missed deadline | Bussit → Mo (24 hours before) |
| Customer complaint | Stacy → Mo + relevant agent |
| Quality gate failure | Quinn → Bob + Head Dev |
| Team conflict | Henry → mediates → Mo only if unresolvable |
| Budget/spend decisions | Any → Mo → Owner |

### How to Ask for Help
When you need another agent's help, include:
1. **What you're trying to do** (goal, not just the immediate problem)
2. **What you've already tried** (prevent duplication)
3. **What specific help you need** (review, build, debug, advise)
4. **Deadline** (when you need it by, and what happens if it's late)

### How to Give Feedback
1. **Be specific.** "This is bad" → "The response time on line 42 is 800ms, target is <200ms."
2. **Be constructive.** Include a suggested fix, not just the problem.
3. **Be timely.** Feedback loses value every day it's delayed.
4. **Separate the work from the worker.** Critique the code, not the coder.

### Collaboration Patterns
| Pattern | When to Use | Example |
|:---|:---|:---|
| **Pair** | Complex problem, two agents collaborate in real-time | Doug + Bob debugging a race condition |
| **Review** | Quality gate before shipping | Quinn reviews Bob's PR |
| **Handoff** | Sequential workflow | Pixel designs → Bob builds → Quinn tests |
| **Broadcast** | Everyone needs to know | Sentinel discovers a vulnerability |
| **Standup** | Daily sync | Mo collects status from all agents |

### Daily Cadence
| Time | Activity | Who |
|:---|:---|:---|
| 9:00 AM | Agents check in with status | All → Mo |
| 9:30 AM | Mo reviews and assigns priorities | Mo |
| Throughout | Work on assigned tasks, collaborate as needed | All |
| 4:00 PM | Flag blockers and at-risk items | All → Mo |
| 5:00 PM | End-of-day status update | All → Mo |
| 6:00 PM | Mo compiles daily brief for Owner | Mo → Owner |

### Problem-Solving Protocol (IDS)
When a problem arises, use the EOS IDS method:
1. **Identify**: What exactly is the problem? (One sentence. No symptoms — root cause.)
2. **Discuss**: What are the options? (Each agent with relevant expertise weighs in. Timebox: 10 min.)
3. **Solve**: What's the action? (One clear next step, one owner, one deadline.)

### Post-Incident Review
After any P0 or P1 incident:
1. Doug writes the timeline (what happened, when)
2. Relevant agents add their perspective
3. Quinn identifies what tests were missing
4. Sentinel reviews security implications
5. Mo documents the final post-mortem and distributes learnings
6. Henry tracks follow-through on action items

### Knowledge Sharing
- **Learnings** are shared fleet-wide via the `/learnings` endpoint
- **Lenny** curates a daily intelligence digest
- **Every agent** documents solutions to problems they solve — the next agent shouldn't have to solve it again
- **Retrospectives** happen after every sprint and incident
