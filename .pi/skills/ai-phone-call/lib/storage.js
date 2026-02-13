#!/usr/bin/env node

/**
 * Storage Manager
 * Handles file organization and logging for phone calls
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Storage {
  constructor(callId, businessName = 'unknown') {
    this.callId = callId;
    this.businessName = this.sanitizeFilename(businessName);
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    this.timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
    
    // Create directory name: YYYY-MM-DD_HHMMSS_business_name
    this.dirName = `${this.timestamp}_${this.timeStr}_${this.businessName}`;
    this.baseDir = path.join('/job/logs/phone-calls', this.dirName);
  }

  sanitizeFilename(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50) || 'call';
  }

  async init() {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.symlink(this.baseDir, '/job/logs/phone-calls/latest', 'dir').catch(() => {});
    return this.baseDir;
  }

  async saveCallInfo(info) {
    const filepath = path.join(this.baseDir, 'call-info.json');
    await fs.writeFile(filepath, JSON.stringify(info, null, 2));
    return filepath;
  }

  async saveTranscript(messages) {
    // Save human-readable transcript
    const txtPath = path.join(this.baseDir, 'transcript.txt');
    const lines = messages.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString();
      const speaker = m.role === 'assistant' ? 'AI' : 'Human';
      return `[${time}] ${speaker}: ${m.content}`;
    });
    await fs.writeFile(txtPath, lines.join('\n\n'));

    // Save structured JSON
    const jsonPath = path.join(this.baseDir, 'transcript.json');
    await fs.writeFile(jsonPath, JSON.stringify(messages, null, 2));

    return { txt: txtPath, json: jsonPath };
  }

  async saveReport(report) {
    const filepath = path.join(this.baseDir, 'report.md');
    await fs.writeFile(filepath, report);
    return filepath;
  }

  async saveSummary(summary) {
    const filepath = path.join(this.baseDir, 'summary.json');
    await fs.writeFile(filepath, JSON.stringify(summary, null, 2));
    return filepath;
  }

  async saveRecording(audioBuffer) {
    const filepath = path.join(this.baseDir, 'recording.mp3');
    await fs.writeFile(filepath, audioBuffer);
    return filepath;
  }

  async appendLog(message) {
    const filepath = path.join(this.baseDir, 'debug.log');
    const timestamp = new Date().toISOString();
    await fs.appendFile(filepath, `[${timestamp}] ${message}\n`);
  }

  getPath(filename) {
    return path.join(this.baseDir, filename);
  }
}
