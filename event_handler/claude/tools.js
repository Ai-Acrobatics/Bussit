const { createJob } = require('../tools/create-job');
const { getJobStatus } = require('../tools/github');
const { sendMessage } = require('../tools/telegram');
const fs = require('fs');
const path = require('path');

// Shared fleet tools — absolute paths so every agent uses the same modules
const FLEET_SHARED = '/home/dev/.gemini/antigravity/scratch/fleet_shared';
const TASKS_FILE = path.join(FLEET_SHARED, 'fleet_tasks.json');
const TEAM_DIR_FILE = path.join(FLEET_SHARED, 'TEAM_DIRECTORY.md');

// Shared tool modules
const { webSearch } = require(path.join(FLEET_SHARED, 'tools', 'web-search'));
const { scrapeUrl } = require(path.join(FLEET_SHARED, 'tools', 'firecrawl'));
const { searchPeople, enrichPerson } = require(path.join(FLEET_SHARED, 'tools', 'apollo'));
const { requestAccess, getAccessRequests } = require(path.join(FLEET_SHARED, 'tools', 'access-requests'));
const { logIncident, submitReview, getAgentScorecard, logTraining } = require(path.join(FLEET_SHARED, 'tools', 'feedback'));
const { sendFleetMessage } = require(path.join(FLEET_SHARED, 'tools', 'fleet-comms'));
const { createSession, navigateAndExtract, performAction, closeSession } = require(path.join(FLEET_SHARED, 'tools', 'browserbase'));
const { getSecret, listItems, getAccessLog } = require(path.join(FLEET_SHARED, 'tools', 'onepassword'));
const { listMCPServers, callMCPTool } = require(path.join(FLEET_SHARED, 'tools', 'mcporter'));
const supabaseTasks = require(path.join(FLEET_SHARED, 'tools', 'supabase-tasks'));

// Each agent's own crons file
function getCronsPath() {
  return path.join(__dirname, '..', '..', 'operating_system', 'CRONS.json');
}

// --- Task Board Helpers ---
function readTasks() {
  try { return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8')); }
  catch { return { last_updated: new Date().toISOString(), tasks: [] }; }
}
function writeTasks(data) {
  data.last_updated = new Date().toISOString();
  fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
}
function nextTaskId(tasks) {
  const nums = tasks.map(t => parseInt(t.id.replace('TASK-', '')) || 0);
  return `TASK-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`;
}

// --- Cron Helpers ---
function readCrons() {
  try { return JSON.parse(fs.readFileSync(getCronsPath(), 'utf8')); }
  catch { return { crons: [] }; }
}
function writeCrons(data) {
  fs.writeFileSync(getCronsPath(), JSON.stringify(data, null, 2));
}

// ========== TOOL DEFINITIONS (22 tools) ==========

const toolDefinitions = [
  // --- MCP Tools ---
  {
    name: 'mcp_list',
    description: 'List available MCP servers and their tools. Use this to discover capabilities from connected MCP servers (e.g. "linear", "filesystem"). returns JSON.',
    input_schema: {
      type: 'object',
      properties: {
        server: { type: 'string', description: 'Optional: name of specific server to list tools for.' }
      }
    }
  },
  {
    name: 'mcp_call',
    description: 'Call a tool on a specific MCP server.',
    input_schema: {
      type: 'object',
      properties: {
        server: { type: 'string', description: 'Name of the MCP server (e.g. "linear", "filesystem")' },
        tool: { type: 'string', description: 'Name of the tool to call' },
        args: { type: 'object', description: 'Arguments for the tool' }
      },
      required: ['server', 'tool']
    }
  },
  // ─── Coding / Jobs ───
  {
    name: 'create_job',
    description: 'Create an autonomous coding job (GitHub Actions). Spawns a worker that clones the repo, makes changes, and opens a PR.',
    input_schema: {
      type: 'object',
      properties: {
        job_description: { type: 'string', description: 'Detailed job description.' },
      },
      required: ['job_description'],
    },
  },
  {
    name: 'get_job_status',
    description: 'Check status of running GitHub Actions coding jobs.',
    input_schema: {
      type: 'object',
      properties: { job_id: { type: 'string', description: 'Optional job ID.' } },
      required: [],
    },
  },

  // ─── Communication ───
  {
    name: 'send_group_message',
    description: 'Post to the team group chat. Tag @username for specific people, @all for everyone.',
    input_schema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Message to post.' } },
      required: ['message'],
    },
  },
  {
    name: 'send_dm',
    description: 'DM the owner (Julian) privately. Only for sensitive/urgent matters.',
    input_schema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Private message to Julian.' } },
      required: ['message'],
    },
  },
  {
    name: 'send_fleet_message',
    description: 'Send a direct message to another agent internally (bypasses Telegram). For agent-to-agent requests, updates, escalations.',
    input_schema: {
      type: 'object',
      properties: {
        target_agent: { type: 'string', description: 'Agent key: bob, mo, karen, larry, etc.' },
        message: { type: 'string', description: 'Message to send.' },
        type: { type: 'string', enum: ['request', 'update', 'feedback', 'escalation'] },
      },
      required: ['target_agent', 'message'],
    },
  },

  // ─── Research & Data ───
  {
    name: 'web_search',
    description: 'Search the web using Perplexity AI. Returns summarized results with citations.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query.' },
        context: { type: 'string', description: 'Optional context.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'scrape_url',
    description: 'Scrape a web page using FireCrawl. Returns clean markdown content.',
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'URL to scrape.' } },
      required: ['url'],
    },
  },
  {
    name: 'search_people',
    description: 'Search for people/leads using Apollo. Find contacts by name, title, company, or domain.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query.' },
        titles: { type: 'array', items: { type: 'string' }, description: 'Job title filter.' },
        domains: { type: 'array', items: { type: 'string' }, description: 'Company domain filter.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'enrich_contact',
    description: 'Enrich a contact by email using Apollo. Returns full professional profile.',
    input_schema: {
      type: 'object',
      properties: { email: { type: 'string', description: 'Email to enrich.' } },
      required: ['email'],
    },
  },

  // ─── Browser Automation ───
  {
    name: 'browse_web',
    description: 'Open a remote browser, navigate to a URL, and extract or interact with page content using BrowserBase + Stagehand. Use when you need to log in, fill forms, click buttons, or scrape dynamic content.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to.' },
        instruction: { type: 'string', description: 'What to do on the page (extract data, click button, fill form, etc.).' },
      },
      required: ['url', 'instruction'],
    },
  },
  {
    name: 'browser_action',
    description: 'Perform an action in an existing browser session (click, type, scroll, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Browser session ID from browse_web.' },
        instruction: { type: 'string', description: 'What to do (e.g., "Click Submit", "Type hello in the search box").' },
      },
      required: ['session_id', 'instruction'],
    },
  },

  // ─── Credentials & Secrets ───
  {
    name: 'get_secret',
    description: 'Look up an API key or credential from 1Password. All access is logged. Ask Mo for permission first if unsure.',
    input_schema: {
      type: 'object',
      properties: {
        item: { type: 'string', description: '1Password item name (e.g., "Perplexity API Key").' },
        field: { type: 'string', description: 'Field to retrieve (default: password). Can be: api_key, username, etc.' },
        vault: { type: 'string', description: 'Vault name (default: "API Keys").' },
      },
      required: ['item'],
    },
  },
  {
    name: 'list_secrets',
    description: 'List available items in a 1Password vault (names only, no secrets). Use to check what keys are available.',
    input_schema: {
      type: 'object',
      properties: {
        vault: { type: 'string', description: 'Vault name (default: "API Keys").' },
      },
      required: [],
    },
  },

  // ─── Quality & Feedback ───
  {
    name: 'log_incident',
    description: 'Log a quality incident. Karen is primary reviewer, but anyone can report.',
    input_schema: {
      type: 'object',
      properties: {
        agent: { type: 'string', description: 'Agent involved.' },
        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        description: { type: 'string', description: 'What happened.' },
        category: { type: 'string', enum: ['code-quality', 'missed-deadline', 'communication', 'security', 'process'] },
      },
      required: ['agent', 'severity', 'description'],
    },
  },
  {
    name: 'submit_review',
    description: 'Submit a quality review/score for an agent\'s work.',
    input_schema: {
      type: 'object',
      properties: {
        agent: { type: 'string' }, score: { type: 'number', description: '1-10.' },
        feedback: { type: 'string' },
        category: { type: 'string', enum: ['code', 'design', 'communication', 'process', 'testing'] },
      },
      required: ['agent', 'score', 'feedback'],
    },
  },
  {
    name: 'get_scorecard',
    description: 'Get an agent\'s quality scorecard — avg score, reviews by category.',
    input_schema: {
      type: 'object',
      properties: { agent: { type: 'string' } },
      required: ['agent'],
    },
  },
  {
    name: 'log_training',
    description: 'Log a training assignment or completion. Tommy tracks skill development.',
    input_schema: {
      type: 'object',
      properties: {
        agent: { type: 'string' }, skill: { type: 'string' },
        status: { type: 'string', enum: ['assigned', 'in_progress', 'completed', 'verified'] },
        notes: { type: 'string' },
      },
      required: ['agent', 'skill', 'status'],
    },
  },

  // ─── Access & Permissions ───
  {
    name: 'request_access',
    description: 'Request access to a resource. Goes to Mo, Mo escalates to Julian.',
    input_schema: {
      type: 'object',
      properties: {
        resource: { type: 'string', description: 'What you need.' },
        reason: { type: 'string', description: 'Why you need it.' },
        urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      },
      required: ['resource', 'reason'],
    },
  },
  {
    name: 'get_access_requests',
    description: 'View pending access requests. Mo reviews these.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'denied', 'provisioned'] },
        agent: { type: 'string' },
      },
      required: [],
    },
  },

  // ─── Task Board ───
  {
    name: 'get_team_tasks',
    description: 'View the shared team task board.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done', 'blocked'] },
        assigned_to: { type: 'string' },
      },
      required: [],
    },
  },
  {
    name: 'create_task',
    description: 'Add a new task to the shared board.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' }, description: { type: 'string' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        assigned_to: { type: 'string' },
        collaborators: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'description', 'assigned_to'],
    },
  },
  {
    name: 'update_task',
    description: 'Update a task — status, comments, reassign, flag blockers.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done', 'blocked'] },
        note: { type: 'string' }, assigned_to: { type: 'string' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
      },
      required: ['task_id'],
    },
  },

  // ─── Team & Scheduling ───
  { name: 'get_team_directory', description: 'Look up who does what, escalation paths.', input_schema: { type: 'object', properties: {}, required: [] } },
  { name: 'get_my_crons', description: 'View your scheduled/recurring tasks.', input_schema: { type: 'object', properties: {}, required: [] } },
  {
    name: 'add_cron',
    description: 'Add a recurring task to your schedule.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' }, schedule: { type: 'string', description: 'Cron expression.' },
        task: { type: 'string' }, enabled: { type: 'boolean' },
      },
      required: ['name', 'schedule', 'task'],
    },
  },
  {
    name: 'remove_cron',
    description: 'Remove a recurring task.',
    input_schema: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
];

// ========== TOOL EXECUTORS ==========

const toolExecutors = {
  // --- MCP Tools ---
  mcp_list: async ({ server }) => {
    try {
      return listMCPServers(server);
    } catch (err) {
      return `Error listing MCP servers: ${err.message}`;
    }
  },
  mcp_call: async ({ server, tool, args }) => {
    try {
      return callMCPTool(server, tool, args || {});
    } catch (err) {
      return `Error calling MCP tool ${server}.${tool}: ${err.message}`;
    }
  },
  create_job: async (input) => {
    const result = await createJob(input.job_description);
    return { success: true, job_id: result.job_id, branch: result.branch };
  },
  get_job_status: async (input) => await getJobStatus(input.job_id),

  // Communication
  send_group_message: async (input) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const groupIds = (process.env.TELEGRAM_GROUP_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!token || !groupIds.length) return { success: false, error: 'Group not configured' };
    for (const gid of groupIds) await sendMessage(token, gid, input.message);
    return { success: true, sent_to: groupIds.length + ' group(s)' };
  },
  send_dm: async (input) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const oid = process.env.TELEGRAM_CHAT_ID;
    if (!token || !oid) return { success: false, error: 'DM not configured' };
    await sendMessage(token, oid, input.message);
    return { success: true, sent_to: 'owner' };
  },
  send_fleet_message: async (input) => {
    const botName = process.env.BOT_USERNAME || 'unknown';
    const result = await sendFleetMessage(input.target_agent, botName, input.message, input.type || 'request');
    return { success: true, ...result };
  },

  // Research
  web_search: async (input) => {
    try { return { success: true, ...(await webSearch(input.query, input.context)) }; }
    catch (err) { return { success: false, error: err.message }; }
  },
  scrape_url: async (input) => {
    try { return { success: true, ...(await scrapeUrl(input.url)) }; }
    catch (err) { return { success: false, error: err.message }; }
  },
  search_people: async (input) => {
    try { return { success: true, ...(await searchPeople({ q: input.query, person_titles: input.titles, organization_domains: input.domains })) }; }
    catch (err) { return { success: false, error: err.message }; }
  },
  enrich_contact: async (input) => {
    try { return { success: true, ...(await enrichPerson(input.email)) }; }
    catch (err) { return { success: false, error: err.message }; }
  },

  // Browser automation
  browse_web: async (input) => {
    try {
      const session = await createSession();
      const result = await navigateAndExtract(session.id, input.url, input.instruction);
      return { success: true, session_id: session.id, ...result };
    } catch (err) { return { success: false, error: err.message }; }
  },
  browser_action: async (input) => {
    try {
      const result = await performAction(input.session_id, input.instruction);
      return { success: true, ...result };
    } catch (err) { return { success: false, error: err.message }; }
  },

  // Credentials
  get_secret: async (input) => {
    const botName = process.env.BOT_USERNAME || 'unknown';
    try {
      const value = getSecret(botName, input.item, input.field || 'password', input.vault || 'API Keys');
      return { success: true, value };
    } catch (err) { return { success: false, error: err.message }; }
  },
  list_secrets: async (input) => {
    try {
      const items = listItems(input.vault || 'API Keys');
      return { success: true, items };
    } catch (err) { return { success: false, error: err.message }; }
  },

  // Quality & Feedback
  log_incident: async (input) => {
    const botName = process.env.BOT_USERNAME || 'unknown';
    const incident = logIncident(botName, input.agent, input.severity, input.description, input.category || 'general');
    return { success: true, incident_id: incident.id };
  },
  submit_review: async (input) => {
    const botName = process.env.BOT_USERNAME || 'unknown';
    const review = submitReview(botName, input.agent, input.score, input.feedback, input.category || 'general');
    return { success: true, review_id: review.id };
  },
  get_scorecard: async (input) => ({ success: true, ...(getAgentScorecard(input.agent)) }),
  log_training: async (input) => {
    const botName = process.env.BOT_USERNAME || 'unknown';
    const entry = logTraining(botName, input.agent, input.skill, input.status, input.notes || '');
    return { success: true, training_id: entry.id };
  },

  // Access
  request_access: async (input) => {
    const botName = process.env.BOT_USERNAME || 'unknown';
    const req = requestAccess(botName, input.resource, input.reason, input.urgency || 'medium');
    return { success: true, request_id: req.id, note: 'Mo will review and escalate to Julian.' };
  },
  get_access_requests: async (input) => {
    const requests = getAccessRequests({ status: input.status, agent: input.agent });
    return { success: true, total: requests.length, requests };
  },

  // Tasks
  get_team_tasks: async (input) => {
    const data = readTasks();
    let tasks = data.tasks;
    if (input.status) tasks = tasks.filter(t => t.status === input.status);
    if (input.assigned_to) tasks = tasks.filter(t => t.assigned_to === input.assigned_to);
    return {
      total: tasks.length, last_updated: data.last_updated, tasks: tasks.map(t => ({
        id: t.id, title: t.title, status: t.status, priority: t.priority,
        assigned_to: t.assigned_to, collaborators: t.collaborators, tags: t.tags,
        latest_update: t.updates?.length ? t.updates[t.updates.length - 1] : null,
      }))
    };
  },
  create_task: async (input) => {
    const data = readTasks();
    const botName = process.env.BOT_USERNAME || 'unknown';
    const task = {
      id: nextTaskId(data.tasks), title: input.title, description: input.description,
      status: 'todo', priority: input.priority || 'medium', assigned_to: input.assigned_to,
      collaborators: input.collaborators || [], created_by: botName,
      created_at: new Date().toISOString(), due_date: null, tags: input.tags || [], updates: [],
    };
    data.tasks.push(task);
    writeTasks(data);
    return { success: true, task_id: task.id, title: task.title };
  },
  update_task: async (input) => {
    const data = readTasks();
    const task = data.tasks.find(t => t.id === input.task_id);
    if (!task) return { success: false, error: `Task ${input.task_id} not found` };
    const botName = process.env.BOT_USERNAME || 'unknown';
    if (input.status) task.status = input.status;
    if (input.assigned_to) task.assigned_to = input.assigned_to;
    if (input.priority) task.priority = input.priority;
    if (input.note) task.updates.push({ by: botName, at: new Date().toISOString(), note: input.note });
    writeTasks(data);
    return { success: true, task_id: task.id, status: task.status, updates_count: task.updates.length };
  },

  // Team & Scheduling
  get_team_directory: async () => {
    try { return { success: true, directory: fs.readFileSync(TEAM_DIR_FILE, 'utf8') }; }
    catch { return { success: false, error: 'Team directory not found' }; }
  },
  get_my_crons: async () => ({ success: true, crons: readCrons().crons || [] }),
  add_cron: async (input) => {
    const data = readCrons();
    data.crons = (data.crons || []).filter(c => c.name !== input.name);
    data.crons.push({ name: input.name, schedule: input.schedule, task: input.task, enabled: input.enabled !== false, added_at: new Date().toISOString() });
    writeCrons(data);
    return { success: true, name: input.name, schedule: input.schedule };
  },
  remove_cron: async (input) => {
    const data = readCrons();
    const before = (data.crons || []).length;
    data.crons = (data.crons || []).filter(c => c.name !== input.name);
    if (data.crons.length === before) return { success: false, error: `Cron "${input.name}" not found` };
    writeCrons(data);
    return { success: true, removed: input.name };
  },
};

// --- Supabase Task Tracking ---
// Merge Supabase tools into the tool arrays
for (const def of supabaseTasks.TOOL_DEFINITIONS) {
  // Avoid duplicates: rename if conflicts with existing task board tools
  const name = def.name === 'create_task' ? 'sb_create_task' :
    def.name === 'update_task' ? 'sb_update_task' :
      def.name;
  toolDefinitions.push({ ...def, name });
  if (supabaseTasks.HANDLERS[def.name]) {
    toolExecutors[name] = supabaseTasks.HANDLERS[def.name];
  }
}

// --- Memory System (remember/recall — persistent agent knowledge) ---
let loadMemoryContext = async () => '';
try {
  const memoryTools = require(require("path").join(__dirname, "..", "..", "..", "fleet_shared", "tools", "memory-system"));
  for (const def of memoryTools.TOOL_DEFINITIONS) {
    toolDefinitions.push(def);
    if (memoryTools.HANDLERS[def.name]) toolExecutors[def.name] = memoryTools.HANDLERS[def.name];
  }
  loadMemoryContext = memoryTools.loadMemoryContext;
} catch (e) { console.warn("[TOOLS] memory-system not available:", e.message); }

// --- Dynamic tool loader for fleet_shared tools ---
// --- Dynamic tool loader for fleet_shared tools ---
const FLEET_TOOLS = ["run-terminal", "generate-image", "self-improve", "send-email", "calendar", "linear", "notion", "claude-code", "voice-call", "send-sms", 'output-log', 'identify_gap', 'check_my_tools', 'send-file', 'google-drive', 'google-contacts', 'google-calendar', 'google-gmail', 'google-tasks', 'google-sheets', 'google-slides'];
for (const toolName of FLEET_TOOLS) {
  try {
    const mod = require(require("path").join(__dirname, "..", "..", "..", "fleet_shared", "tools", toolName));
    if (mod.TOOL_DEFINITIONS) {
      for (const def of mod.TOOL_DEFINITIONS) {
        toolDefinitions.push(def);
        if (mod.HANDLERS && mod.HANDLERS[def.name]) toolExecutors[def.name] = mod.HANDLERS[def.name];
      }
    }
  } catch (e) { console.warn("[TOOLS] " + toolName + " not available:", e.message); }
}

// --- Voice (ElevenLabs) ---
try {
  const { sendVoiceMessage } = require(require("path").join(__dirname, "..", "..", "..", "fleet_shared", "tools", "voice"));
  toolDefinitions.push({
    name: 'send_voice',
    description: 'Send a voice message (audio) to the group or user using ElevenLabs TTS.',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Text to speak.' },
        voice_id: { type: 'string', description: 'Optional ElevenLabs voice ID.' }
      },
      required: ['message']
    }
  });
  toolExecutors['send_voice'] = async (input) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const gids = (process.env.TELEGRAM_GROUP_IDS || '').split(',');
    // Default to Group
    const chatId = gids[0] ? gids[0].trim() : process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return { success: false, error: 'Target not configured' };

    try {
      await sendVoiceMessage(token, chatId, input.message, input.voice_id);
      return { success: true, sent_to: chatId };
    } catch (err) { return { success: false, error: err.message }; }
  };
} catch (e) { console.warn("[TOOLS] voice not available:", e.message); }

module.exports = { toolDefinitions, toolExecutors, loadMemoryContext };
