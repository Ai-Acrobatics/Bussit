const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const { createJob } = require('./tools/create-job');

// Allowlist of safe commands for action execution
const ALLOWED_COMMANDS = new Set(['node', 'npm', 'git', 'curl', 'echo', 'ls', 'cat', 'date']);

/**
 * Execute a single action
 * @param {Object} action - { type, job, command, url, method, headers, vars }
 * @param {Object} opts - { cwd, data }
 * @returns {Promise<string>} Result description for logging
 */
async function executeAction(action, opts = {}) {
  const type = action.type || 'agent';

  if (type === 'command') {
    const parts = action.command.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    if (!ALLOWED_COMMANDS.has(cmd)) {
      throw new Error(`Command not allowed: ${cmd}`);
    }
    const { stdout, stderr } = await execFileAsync(cmd, args, { cwd: opts.cwd });
    return (stdout || stderr || '').trim();
  }

  if (type === 'http') {
    const method = (action.method || 'POST').toUpperCase();
    const headers = { 'Content-Type': 'application/json', ...action.headers };
    const fetchOpts = { method, headers };

    if (method !== 'GET') {
      const body = { ...action.vars };
      if (opts.data) body.data = opts.data;
      fetchOpts.body = JSON.stringify(body);
    }

    const res = await fetch(action.url, fetchOpts);
    return `${method} ${action.url} → ${res.status}`;
  }

  // Default: agent
  const result = await createJob(action.job);
  return `job ${result.job_id}`;
}

module.exports = { executeAction };
