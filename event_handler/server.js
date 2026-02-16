require('dotenv').config({ path: __dirname + '/.env' });
if (!process.env.PORT) {
  console.error('FATAL: PORT not set. Check .env file.');
  process.exit(1);
}
const PORT = parseInt(process.env.PORT, 10);

const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const { createJob } = require('./tools/create-job');
const { initCrons } = require('/home/dev/ai-acrobatics-fleet/fleet_shared/tools/cron-manager');
const { loadTriggers } = require('./triggers');
const { setWebhook, sendMessage, formatJobNotification, downloadFile, reactToMessage, startTypingIndicator } = require('./tools/telegram');
const { isWhisperEnabled, transcribeAudio } = require('./tools/openai');
const { chat } = require('/home/dev/ai-acrobatics-fleet/fleet_shared/chat');
const { toolDefinitions, toolExecutors } = require('./claude/tools');
const { getToolsForAgent } = require('/home/dev/ai-acrobatics-fleet/fleet_shared/tools/tool-registry');
const { getHistory, updateHistory } = require('/home/dev/ai-acrobatics-fleet/fleet_shared/chat/conversation');
const supabaseLogger = require('/home/dev/ai-acrobatics-fleet/fleet_shared/tools/supabase-logger');
const { logMessageToSupabase } = supabaseLogger;

// ─── Load agent config and build filtered tool set ───
let agentToolDefs = toolDefinitions;
let agentToolExecs = toolExecutors;
let agentDisplayName = 'Agent';
let agentRole = '';
try {
  const configPath = path.join(__dirname, '..', 'config.agentic.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const capabilities = config.capabilities || [];
  agentDisplayName = config.identity?.name || 'Agent';
  agentRole = config.identity?.role || '';
  const { definitions, executors } = getToolsForAgent(capabilities, toolDefinitions, toolExecutors);
  agentToolDefs = definitions;
  agentToolExecs = executors;
  console.log(`${agentDisplayName}: loaded ${definitions.length} tools (filtered from ${toolDefinitions.length} by ${capabilities.length} capabilities)`);
} catch (err) {
  console.warn('Could not load agent config for tool filtering, using all tools:', err.message);
}
const { githubApi, getJobStatus } = require('./tools/github');
const { getApiKey } = require('/home/dev/ai-acrobatics-fleet/fleet_shared/chat');
const { render_md } = require('./utils/render-md');

const app = express();

app.use(helmet());
app.use(express.json());

const { API_KEY, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN, GH_WEBHOOK_SECRET, GH_OWNER, GH_REPO, TELEGRAM_CHAT_ID, TELEGRAM_VERIFICATION } = process.env;

// Bot token from env, can be overridden by /telegram/register
let telegramBotToken = TELEGRAM_BOT_TOKEN || null;

// Routes that have their own authentication
const PUBLIC_ROUTES = ['/telegram/webhook', '/github/webhook', '/ping'];

// Global x-api-key auth (skip for routes with their own auth)
app.use((req, res, next) => {
  if (PUBLIC_ROUTES.includes(req.path)) {
    return next();
  }
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.use(loadTriggers());

// GET /ping - health check endpoint
app.get('/ping', (req, res) => {
  res.json({ message: 'Pong!' });
});

// GET /jobs/status - get running job status
app.get('/jobs/status', async (req, res) => {
  try {
    const result = await getJobStatus(req.query.job_id);
    res.json(result);
  } catch (err) {
    console.error('Failed to get job status:', err);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// POST /webhook - create a new job
app.post('/webhook', async (req, res) => {
  const { job } = req.body;
  if (!job) return res.status(400).json({ error: 'Missing job field' });

  try {
    const result = await createJob(job);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// POST /telegram/register - register a Telegram webhook
app.post('/telegram/register', async (req, res) => {
  const { bot_token, webhook_url } = req.body;
  if (!bot_token || !webhook_url) {
    return res.status(400).json({ error: 'Missing bot_token or webhook_url' });
  }

  try {
    const result = await setWebhook(bot_token, webhook_url, TELEGRAM_WEBHOOK_SECRET);
    telegramBotToken = bot_token;
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register webhook' });
  }
});

// POST /telegram/webhook - receive Telegram updates
app.post('/telegram/webhook', async (req, res) => {
  // Validate secret token if configured
  if (TELEGRAM_WEBHOOK_SECRET) {
    const headerSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (headerSecret !== TELEGRAM_WEBHOOK_SECRET) {
      return res.status(200).json({ ok: true });
    }
  }

  const update = req.body;
  const message = update.message || update.edited_message;

  if (message && message.chat && telegramBotToken) {
    const chatId = String(message.chat.id);

    let messageText = null;

    if (message.text) {
      messageText = message.text;
    }

    // Check for verification code
    if (TELEGRAM_VERIFICATION && messageText === TELEGRAM_VERIFICATION) {
      await sendMessage(telegramBotToken, chatId, `Your chat ID:\n<code>${chatId}</code>`);
      return res.status(200).json({ ok: true });
    }

    // --- Group Chat Support ---
    const chatType = message.chat.type;
    const allowedGroupIds = (process.env.TELEGRAM_GROUP_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    const botUsername = process.env.BOT_USERNAME || '';
    const botDepartment = process.env.BOT_DEPARTMENT || '';


    // LOGGING: Index incoming message to Supabase
    // Mark as read=true so relay polling (which queries read=false) doesn't also process it
    const receiver = message.chat.type === 'private' ? botUsername : (message.chat.title || message.chat.id.toString());
    const sender = message.from.username || message.from.first_name || 'unknown';

    if (message.text) {
      logMessageToSupabase(sender, receiver, message.text, 'text', { read: true }).catch(err => console.error('Log Error:', err));
    } else if (message.photo) {
      const fileId = message.photo[message.photo.length - 1].file_id;
      logMessageToSupabase(sender, receiver, `[Photo] FileID: ${fileId}`, 'image', { read: true }).catch(err => console.error('Log Error:', err));
    } else if (message.document) {
      const fileName = message.document.file_name || 'document';
      logMessageToSupabase(sender, receiver, `[Document] ${fileName} (${message.document.mime_type})`, 'file', { read: true }).catch(err => console.error('Log Error:', err));
    } else if (message.voice) {
      logMessageToSupabase(sender, receiver, '[Voice Message]', 'voice', { read: true }).catch(err => console.error('Log Error:', err));
    }


    console.log(`[Telegram] From: ${sender} Text: ${message.text || '[Non-text]'}`);

    // Bots respond in any group they're a member of (Telegram only sends webhooks for groups the bot is in)

    // Skip service messages
    if (!message.text && !message.voice) {
      return res.status(200).json({ ok: true });
    }

    const isFromBot = message.from && message.from.is_bot;
    const text = (message.text || '').toLowerCase();
    const isDM = message.chat.type === 'private';

    // Check if mentioned (only matters in groups)
    const isMentioned = botUsername && text.includes(`@${botUsername.toLowerCase()}`);
    const isAll = text.includes('@all') || text.includes('@everyone');
    const isDepartment = botDepartment && text.includes(`@${botDepartment.toLowerCase()}`);
    const isMo = botUsername && /^mo[_-]|_mo_|_mo$/i.test(botUsername);

    // In DMs: always respond. In groups: need mention, @all, or be Mo
    if (isFromBot) {
      if (!isMentioned && !isAll && !isDepartment) return res.status(200).json({ ok: true });
    } else if (!isDM) {
      // Group message from human — need mention or Mo
      if (!isMo && !isMentioned && !isAll && !isDepartment) return res.status(200).json({ ok: true });
    }

    // Strip @mention
    if (botUsername && messageText) {
      messageText = messageText.replace(new RegExp(`@${botUsername}`, 'gi'), '').trim();
    }

    // Add Context
    if (messageText) {
      const senderName = message.from ? (message.from.first_name || message.from.username || 'Someone') : 'Someone';
      const senderLabel = isFromBot ? `[Bot: ${message.from.username}]` : `[Owner: ${senderName}]`;
      messageText = `${senderLabel} in group "${message.chat.title || 'Fleet'}": ${messageText}`;
    }

  } else {
    // DM Check (Partial Logic here, simplified for robustness)
    if (TELEGRAM_CHAT_ID && message && String(message.chat.id) !== TELEGRAM_CHAT_ID) {
      // Ignore random DMs
      return res.status(200).json({ ok: true });
    }
  }

  // --- Logic Block for Processing ---
  if (message && message.chat && telegramBotToken) {
    const chatId = String(message.chat.id);

    // Acknowledge Receipt
    await reactToMessage(telegramBotToken, chatId, message.message_id).catch(() => { });

    if (message.voice) {
      if (!isWhisperEnabled()) {
        await sendMessage(telegramBotToken, chatId, 'Voice messages not supported (Missing OpenAI Key).');
        return res.status(200).json({ ok: true });
      }
      try {
        const { buffer, filename } = await downloadFile(telegramBotToken, message.voice.file_id);
        const transcript = await transcribeAudio(buffer, filename);
        await sendMessage(telegramBotToken, chatId, `🎤 Transcript: "${transcript}"`);
        // Continue processing with transcript
        // Simplified here: we'll just return for now as per original code logic usually handled text or voice
        return res.status(200).json({ ok: true });
      } catch (err) {
        console.error('Voice Error:', err);
        await sendMessage(telegramBotToken, chatId, 'Error transcribing voice.');
        return res.status(200).json({ ok: true });
      }
    }

    // Respond to content
    res.status(200).json({ ok: true }); // Ack immediately

    if (message.text) {
      const stopTyping = startTypingIndicator(telegramBotToken, chatId);
      try {
        // Smart model routing for webhook messages
        const isOwnerMsg = TELEGRAM_CHAT_ID && String(message.chat.id) === TELEGRAM_CHAT_ID;
        const isGroupMsg = message.chat.type === 'group' || message.chat.type === 'supergroup';
        const textLower = (message.text || '').toLowerCase();
        const needsDeep = /\b(analyze|review|debug|investigate|plan|architect|design|estimate|audit|assess|create task|assign|delegate|build|implement|deploy|fix|diagnose)\b/i.test(textLower);

        let webhookModel, webhookProvider;
        if (isOwnerMsg && needsDeep) {
          // Premium path: owner DMs needing deep reasoning
          webhookModel = process.env.EVENT_HANDLER_MODEL;
          webhookProvider = process.env.LLM_PROVIDER;
          console.log(`[Webhook] 🧠 Premium model: ${webhookModel}`);
        } else {
          // Economy path: group chat, simple DMs, bot mentions
          webhookModel = process.env.CHAT_MODEL || process.env.EVENT_HANDLER_MODEL;
          webhookProvider = process.env.CHAT_PROVIDER || process.env.LLM_PROVIDER;
          console.log(`[Webhook] 💬 Chat model: ${webhookModel}`);
        }

        const history = await getHistory(chatId);
        const { response, history: newHistory } = await chat(
          message.text,
          history,
          agentToolDefs,
          agentToolExecs,
          webhookModel,
          webhookProvider
        );
        updateHistory(chatId, newHistory);
        await sendMessage(telegramBotToken, chatId, response);
      } catch (err) {
        console.error('Claude Error:', err);
        await sendMessage(telegramBotToken, chatId, 'Error processing message.').catch(() => { });
      } finally {
        stopTyping();
      }
    }
  } else {
    res.status(200).json({ ok: true });
  }
});

function extractJobId(branchName) {
  if (!branchName || !branchName.startsWith('job/')) return null;
  return branchName.slice(4);
}

async function summarizeJob(results) {
  try {
    const apiKey = getApiKey();
    const systemPrompt = render_md(path.join(__dirname, '..', 'operating_system', 'JOB_SUMMARY.md'));
    const userMessage = [
      results.job ? `## Task\n${results.job}` : '',
      results.commit_message ? `## Commit Message\n${results.commit_message}` : '',
      results.changed_files?.length ? `## Changed Files\n${results.changed_files.join('\n')}` : '',
      results.pr_status ? `## PR Status\n${results.pr_status}` : '',
      results.merge_result ? `## Merge Result\n${results.merge_result}` : '',
      results.pr_url ? `## PR URL\n${results.pr_url}` : '',
      results.log ? `## Agent Log\n${results.log}` : '',
    ].filter(Boolean).join('\n\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.EVENT_HANDLER_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
    const result = await response.json();
    return (result.content?.[0]?.text || '').trim() || 'Job completed.';
  } catch (err) {
    console.error('Failed to summarize job:', err);
    return 'Job completed.';
  }
}

app.post('/github/webhook', async (req, res) => {
  if (GH_WEBHOOK_SECRET) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return res.status(401).json({ error: 'Missing signature' });
    const expected = 'sha256=' + crypto.createHmac('sha256', GH_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body)).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const event = req.headers['x-github-event'];
  const payload = req.body;

  if (event !== 'pull_request') return res.status(200).json({ ok: true, skipped: true });

  const pr = payload.pull_request;
  if (!pr) return res.status(200).json({ ok: true, skipped: true });

  const branchName = pr.head?.ref;
  const jobId = extractJobId(branchName);
  if (!jobId) return res.status(200).json({ ok: true, skipped: true, reason: 'not a job branch' });

  if (!TELEGRAM_CHAT_ID || !telegramBotToken) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'no chat to notify' });
  }

  try {
    const results = payload.job_results || {};
    results.pr_url = pr.html_url;
    const message = await summarizeJob(results);
    await sendMessage(telegramBotToken, TELEGRAM_CHAT_ID, message);
    const history = await getHistory(TELEGRAM_CHAT_ID);
    history.push({ role: 'assistant', content: message });
    await updateHistory(TELEGRAM_CHAT_ID, history);
    res.status(200).json({ ok: true, notified: true });
  } catch (err) {
    console.error('Failed to process GitHub webhook:', err);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

const { pollMessages } = require('/home/dev/ai-acrobatics-fleet/fleet_shared/tools/relay-poller');

const POLL_INTERVAL = 3000;
const myName = process.env.BOT_USERNAME || 'unknown_bot';
const myGroups = (process.env.TELEGRAM_GROUP_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

let pollTimeout = null;
const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  if (process.env.SUPABASE_URL) {
    console.log(`[Relay] Starting Poller for ${myName}`);
    function schedulePoll() {
      pollTimeout = setTimeout(async () => {
        try {
          await pollMessages(myName, myGroups, async (msg) => {
            const sender = msg.sender;
            const text = msg.message;
            const receiver = msg.receiver;
            console.log(`[Relay] Processing msg from ${sender}: ${text}`);
            if (sender === myName) return;

            // --- Cron/Internal messages: never forward to Telegram ---
            const isSystemMessage = sender === 'sys_cron' ||
              /heartbeat|SYSTEM_ONLINE/i.test(text);

            if (isSystemMessage) {
              console.log(`[Relay] Internal message from ${sender} — processing silently`);
              // Process sys_cron agent tasks without Telegram spam
              if (sender === 'sys_cron' && text.startsWith('REQUEST:')) {
                try {
                  const contextText = `[Internal cron task]: ${text}`;
                  const chatId = `cron_${myName}`;
                  const useModel = process.env.CHAT_MODEL || process.env.EVENT_HANDLER_MODEL;
                  const useProvider = process.env.CHAT_PROVIDER || process.env.LLM_PROVIDER;
                  const history = await getHistory(chatId);
                  const { response, history: newHistory } = await chat(
                    contextText, history, agentToolDefs, agentToolExecs, useModel, useProvider
                  );
                  updateHistory(chatId, newHistory);

                  // Always log to Supabase so reports are visible in Dashboard Daddy
                  await supabaseLogger.logMessageToSupabase(myName, 'cron_output', response, 'text');
                  console.log(`[Relay] Cron task done: ${response.substring(0, 80)}...`);

                  // Cron reports stay in Supabase/Dashboard Daddy only — no Telegram spam
                  console.log(`[Relay] Cron report logged to Supabase (${response.length} chars) — not forwarding to Telegram`);
                } catch (cronErr) {
                  console.error(`[Relay] Cron task failed:`, cronErr.message);
                }
              }
              return; // Heartbeat broadcasts never reach Telegram
            }

            // --- Agent-to-Agent Communication Rules ---
            // Agents only communicate for: task assignments, important updates, handoffs
            // Agents do NOT have back-and-forth conversations with each other
            const ownerNames = ['owner', 'julian', 'julianb233', 'julianb', 'Julian Bradley'];
            const isFromOwner = ownerNames.some(n => sender.toLowerCase() === n.toLowerCase());
            const isFromAgent = !isFromOwner && (sender.endsWith('_bot') || sender.includes('Bot'));

            // Mo CEO: forward important agent messages to owner's Telegram
            if (/^mo[_-]|_mo_|_mo$/i.test(myName) && receiver === myName) {
              if (telegramBotToken && TELEGRAM_CHAT_ID) {
                await sendMessage(telegramBotToken, TELEGRAM_CHAT_ID, `[${agentDisplayName}] ${sender}: ${text}`);
              }
              return;
            }

            // Agent-to-agent: silently drop — prevents conversation loops
            // Agents use send_agent_message tool to intentionally delegate tasks
            // Replies to those messages are suppressed to avoid back-and-forth
            if (isFromAgent) {
              console.log(`[Relay] Received from agent ${sender} — dropped (loop prevention)`);
              return;
            }

            const contextText = `[Message from ${sender}]: ${text}`;
            const chatId = (receiver === myName || receiver === 'all') ? `dm_${sender}` : receiver;

            // Smart model routing: use cheap CHAT_MODEL for simple fleet chat,
            // escalate to premium EVENT_HANDLER_MODEL for complex reasoning/tasks
            const needsReasoning = /\b(analyze|review|debug|investigate|plan|architect|design|estimate|audit|assess|create task|assign|delegate|build|implement|deploy|fix|diagnose)\b/i.test(text);
            const needsTools = /\b(search|look up|check|run|execute|find|list|scan|fetch)\b/i.test(text);

            let useModel, useProvider;
            if (isFromOwner || needsReasoning || needsTools) {
              // Premium path: owner messages or complex tasks
              useModel = process.env.EVENT_HANDLER_MODEL;
              useProvider = process.env.LLM_PROVIDER;
              console.log(`[Relay] Premium model: ${useModel} (reason: ${isFromOwner ? 'owner' : needsReasoning ? 'reasoning' : 'tools'})`);
            } else {
              // Economy path: simple fleet chat
              useModel = process.env.CHAT_MODEL || process.env.EVENT_HANDLER_MODEL;
              useProvider = process.env.CHAT_PROVIDER || process.env.LLM_PROVIDER;
              console.log(`[Relay] Chat model: ${useModel}`);
            }

            try {
              const history = await getHistory(chatId);
              const { response, history: newHistory } = await chat(
                contextText,
                history,
                agentToolDefs,
                agentToolExecs,
                useModel,
                useProvider
              );
              updateHistory(chatId, newHistory);

              if (receiver !== myName && receiver !== 'all') {
                await sendMessage(telegramBotToken, receiver, response);
              } else {
                await supabaseLogger.logMessageToSupabase(myName, sender, response, 'text');
                console.log(`[Relay] Replied to ${sender} via DB`);
              }
            } catch (err) {
              console.error('[Relay] Processing Error:', err);
            }
          });
        } catch (err) {
          console.error('[Relay] Poll cycle error:', err.message);
        }
        schedulePoll();
      }, POLL_INTERVAL);
    }
    schedulePoll();
  }
  initCrons(__dirname, process.env.BOT_USERNAME || 'unknown_agent');
});

// Graceful shutdown
function shutdown() {
  console.log('[Shutdown] Received signal, shutting down...');
  if (pollTimeout) clearTimeout(pollTimeout);
  server.close(() => {
    console.log('[Shutdown] Server closed.');
    process.exit(0);
  });
  // Force exit after 10 seconds if server.close hangs
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
