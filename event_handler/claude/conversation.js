/**
 * conversation.js — Persistent Conversation Memory (Supabase-backed)
 *
 * Agents remember ALL conversations — across restarts, across days.
 * Uses Supabase for persistence with local cache for speed.
 *
 * Table: agent_conversations
 *   - agent_id TEXT
 *   - chat_id TEXT
 *   - messages JSONB
 *   - summary TEXT (compressed context from older messages)
 *   - updated_at TIMESTAMPTZ
 *
 * Memory strategy:
 *   - Keep last 60 messages in full detail (recent context)
 *   - Summarize older messages into a running summary (long-term memory)
 *   - Never fully forget — summaries compound forever
 *   - Summaries persist indefinitely with 8000 char cap
 */

const MAX_RECENT_MESSAGES = 10;
const SUMMARY_THRESHOLD = 8; // Summarize when we hit this many messages
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min local cache
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 min cleanup

// Local cache: Map<cacheKey, { messages, summary, lastAccess, dirty }>
const cache = new Map();

function cacheKey(chatId) {
  return `${process.env.BOT_USERNAME || 'agent'}_${chatId}`;
}

// ── Supabase helper ──
async function supaFetch(endpoint, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null; // Graceful fallback if no Supabase

  try {
    const resp = await fetch(`${url}/rest/v1/${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...(options.headers || {}),
      },
      ...(options.body ? { body: options.body } : {}),
    });
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}

/**
 * Get conversation history for a chat (with persistent memory)
 * @param {string} chatId - Telegram chat ID
 * @returns {Promise<Array>} - Message history array
 */
async function getHistory(chatId) {
  const key = cacheKey(chatId);

  // Check local cache first
  const cached = cache.get(key);
  if (cached && Date.now() - cached.lastAccess < CACHE_TTL_MS) {
    cached.lastAccess = Date.now();
    return cached.messages;
  }

  // Load from Supabase
  const agentId = process.env.BOT_USERNAME || 'unknown';
  const rows = await supaFetch(
    `agent_conversations?agent_id=eq.${agentId}&chat_id=eq.${chatId}&limit=1`
  );

  if (rows && rows.length > 0) {
    const row = rows[0];
    const messages = row.messages || [];
    const summary = row.summary || '';

    // If we have a summary, prepend it as system context
    const result = summary
      ? [{ role: 'user', content: `[MEMORY — Previous conversation summary]\n${summary}` },
      { role: 'assistant', content: 'Understood — I remember our previous conversations. How can I help?' },
      ...messages]
      : messages;

    cache.set(key, {
      messages: result,
      rawMessages: messages,
      summary,
      lastAccess: Date.now(),
      dirty: false,
    });

    return result;
  }

  return [];
}

/**
 * Update conversation history (persists to Supabase)
 * @param {string} chatId - Telegram chat ID
 * @param {Array} messages - Full message history from Claude
 */
async function updateHistory(chatId, messages) {
  const key = cacheKey(chatId);
  const agentId = process.env.BOT_USERNAME || 'unknown';

  // Strip any injected memory messages before storing
  const cleanMessages = messages.filter(m =>
    !(m.role === 'user' && typeof m.content === 'string' && m.content.startsWith('[MEMORY —')) &&
    !(m.role === 'assistant' && typeof m.content === 'string' && m.content === 'Understood — I remember our previous conversations. How can I help?')
  );

  // Get existing summary
  const cached = cache.get(key);
  let summary = cached?.summary || '';

  // If we have too many messages, compress older ones into summary
  if (cleanMessages.length > SUMMARY_THRESHOLD) {
    const toSummarize = cleanMessages.slice(0, cleanMessages.length - 10);
    const toKeep = cleanMessages.slice(-10);

    // Build a compact summary of older messages
    const newSummaryParts = toSummarize
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        const prefix = m.role === 'user' ? 'User' : agentId;
        // Truncate long messages
        const short = content.length > 200 ? content.substring(0, 200) + '...' : content;
        return `${prefix}: ${short}`;
      })
      .join('\n');

    // Append to running summary (keep it under 2000 chars)
    summary = summary
      ? `${summary}\n---\n${newSummaryParts}`
      : newSummaryParts;
    if (summary.length > 1000) {
      summary = summary.substring(summary.length - 1000);
    }

    // Store only recent messages
    await persistToSupabase(agentId, chatId, toKeep, summary);

    cache.set(key, {
      messages: toKeep,
      rawMessages: toKeep,
      summary,
      lastAccess: Date.now(),
      dirty: false,
    });
  } else {
    // Store all messages
    const trimmed = cleanMessages.slice(-MAX_RECENT_MESSAGES);
    await persistToSupabase(agentId, chatId, trimmed, summary);

    cache.set(key, {
      messages: trimmed,
      rawMessages: trimmed,
      summary,
      lastAccess: Date.now(),
      dirty: false,
    });
  }
}

/**
 * Persist conversation to Supabase (upsert)
 */
async function persistToSupabase(agentId, chatId, messages, summary) {
  const body = {
    agent_id: agentId,
    chat_id: chatId,
    messages: messages,
    summary: summary || null,
    updated_at: new Date().toISOString(),
  };

  // Try upsert
  await supaFetch('agent_conversations', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Prefer': 'resolution=merge-duplicates' },
    prefer: 'resolution=merge-duplicates',
  });
}

// Cleanup stale LOCAL CACHE only (not Supabase data — agents never delete their own memory)
setInterval(() => {
  const now = Date.now();
  for (const [k, entry] of cache) {
    if (now - entry.lastAccess > CACHE_TTL_MS * 2) {
      cache.delete(k);
    }
  }
}, CLEANUP_INTERVAL_MS);

module.exports = {
  getHistory,
  updateHistory,
};
