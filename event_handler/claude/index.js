const path = require('path');
const { render_md } = require('../utils/render-md');

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

// Web search tool definition (Anthropic built-in)
const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 5,
};

/**
 * Get Anthropic API key from environment
 * @returns {string} API key
 */
function getApiKey() {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  return 'disabled'; // Allow proceeding if using Ollama
}

/**
 * Call LLM API (Anthropic or Ollama)
 * @param {Array} messages - Conversation messages
 * @param {Array} tools - Tool definitions
 * @returns {Promise<Object>} Formatted response (Claude style)
 */
async function callLLM(messages, tools, memoryContext = '', modelOverride = null) {
  const provider = process.env.LLM_PROVIDER || 'anthropic'; // 'anthropic', 'ollama'
  const model = modelOverride || process.env.EVENT_HANDLER_MODEL || DEFAULT_MODEL;
  const systemPrompt = render_md(path.join(__dirname, '..', '..', 'operating_system', 'CHATBOT.md'));

  // --- ANTHROPIC ---
  if (provider === 'anthropic') {
    const apiKey = getApiKey();
    if (apiKey === 'disabled') throw new Error('ANTHROPIC_API_KEY required for Anthropic provider');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        tools,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} ${error}`);
    }
    return response.json();
  }

  // --- OLLAMA (Local) ---
  if (provider === 'ollama') {
    const baseURL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace('localhost', '127.0.0.1');
    console.log(`[Ollama] Connecting to ${baseURL} with model ${model}...`);

    // Adapt messages to OpenAI format (Ollama uses this)
    // Claude 'user' content can be string or array. OpenAI expects string or array (multimodal).
    // Claude 'assistant' content can be array. OpenAI expects string or tool_calls.

    const adaptedMessages = messages.map(m => {
      // Simple text mapping for now. 
      // TODO: Handle complex Claude content blocks if necessary.
      let content = m.content;
      if (Array.isArray(content)) {
        // Extract text parts
        content = content.filter(c => c.type === 'text').map(c => c.text).join('\n');
      }
      return { role: m.role, content };
    });

    // Prepend System Prompt to messages
    adaptedMessages.unshift({ role: 'system', content: systemPrompt });

    const response = await fetch(`${baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, // e.g., 'kimmy', 'code_x'
        messages: adaptedMessages,
        tools: tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.input_schema // Claude 'input_schema' maps to OpenAI 'parameters'
          }
        })),
        stream: false
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    // --- ADAPTER: Normalize to Claude Format ---
    const contentArray = [];

    if (choice.message.content) {
      contentArray.push({ type: 'text', text: choice.message.content });
    }

    if (choice.message.tool_calls) {
      choice.message.tool_calls.forEach(tc => {
        contentArray.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments)
        });
      });
      return {
        stop_reason: 'tool_use',
        content: contentArray,
        id: data.id,
        model: data.model,
        role: 'assistant'
      };
    }

    return {
      stop_reason: 'end_turn',
      content: contentArray,
      id: data.id,
      model: data.model,
      role: 'assistant'
    };
  }

  // --- KIMI 2.5 (Moonshot API) ---
  if (provider === 'kimi') {
    const apiKey = process.env.SUMMARY_API_KEY || process.env.KIMI_API_KEY;
    if (!apiKey) throw new Error('SUMMARY_API_KEY or KIMI_API_KEY required for Kimi provider');

    const baseURL = process.env.SUMMARY_API_BASE || 'https://api.moonshot.ai/v1';
    console.log(`[Kimi] Calling ${baseURL} with model ${model}...`);
    console.log(`[Kimi] Key: ${apiKey ? apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4) : 'MISSING'}`);

    const adaptedMessages = messages.map(m => {
      let content = m.content;
      if (Array.isArray(content)) {
        content = content.filter(c => c.type === 'text').map(c => c.text).join('\n');
      }
      return { role: m.role, content };
    });

    adaptedMessages.unshift({ role: 'system', content: systemPrompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

    let response;
    try {
      response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: adaptedMessages,
          stream: false,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      throw new Error(`Kimi fetch failed: ${fetchErr.message}`);
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log(`[Kimi] Response received. Model: ${data.model}, Tokens: ${data.usage?.total_tokens || '?'}`);
    const choice = data.choices[0];

    const contentArray = [];
    if (choice.message.content) {
      contentArray.push({ type: 'text', text: choice.message.content });
    }

    if (choice.message.tool_calls) {
      choice.message.tool_calls.forEach(tc => {
        contentArray.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments)
        });
      });
      return {
        stop_reason: 'tool_use',
        content: contentArray,
        id: data.id,
        model: data.model,
        role: 'assistant'
      };
    }

    return {
      stop_reason: 'end_turn',
      content: contentArray,
      id: data.id,
      model: data.model,
      role: 'assistant'
    };
  }

  throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
}

/**
 * Process a conversation turn with LLM, handling tool calls
 * @param {string} userMessage - User's message
 * @param {Array} history - Conversation history
 * @param {Array} toolDefinitions - Available tools
 * @param {Object} toolExecutors - Tool executor functions
 * @returns {Promise<{response: string, history: Array}>}
 */
async function chat(userMessage, history, toolDefinitions, toolExecutors, modelOverride) {
  // Add user message to history
  const messages = [...history, { role: 'user', content: userMessage }];

  let response = await callLLM(messages, toolDefinitions, '', modelOverride);
  let assistantContent = response.content;

  // Add assistant response to history
  messages.push({ role: 'assistant', content: assistantContent });

  // Handle tool use loop
  while (response.stop_reason === 'tool_use') {
    const toolResults = [];

    for (const block of assistantContent) {
      if (block.type === 'tool_use') {
        // Skip web_search - it's a server-side tool executed by Anthropic
        if (block.name === 'web_search') {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: "Web search is currently disabled/rate-limited. Please use internal knowledge.",
          });
          continue;
        }

        const executor = toolExecutors[block.name];
        let result;

        if (executor) {
          try {
            result = await executor(block.input);
          } catch (err) {
            result = { error: err.message };
          }
        } else {
          result = { error: `Unknown tool: ${block.name}` };
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }

    // If no client-side tools to execute, we're done
    if (toolResults.length === 0) {
      break;
    }

    // Add tool results to messages
    messages.push({ role: 'user', content: toolResults });

    // Get next response from LLM
    response = await callLLM(messages, toolDefinitions, '', modelOverride);
    assistantContent = response.content;

    // Add new assistant response to history
    // Check if this is a "KeepAlive" or empty response? No, just add whatever we get.
    messages.push({ role: 'assistant', content: assistantContent });
  }

  // Extract text response
  const textBlocks = assistantContent.filter((block) => block.type === 'text');
  const responseText = textBlocks.map((block) => block.text).join('\n');

  return {
    response: responseText,
    history: messages,
  };
}

module.exports = {
  chat,
  getApiKey,
};
