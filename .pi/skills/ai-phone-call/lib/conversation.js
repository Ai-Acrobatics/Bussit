#!/usr/bin/env node

/**
 * Conversation AI Handler
 * Manages real-time AI conversation using OpenAI + Twilio Media Streams
 */

import OpenAI from 'openai';
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

export class ConversationHandler extends EventEmitter {
  constructor(openaiApiKey, options = {}) {
    super();
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.voice = options.voice || 'nova';
    this.model = options.model || 'gpt-4-turbo';
    this.maxTokens = options.maxTokens || 150;
    
    this.transcript = [];
    this.audioChunks = [];
    this.conversationActive = false;
    this.callSid = null;
  }

  /**
   * Create system prompt for the AI
   */
  createSystemPrompt(task, businessName) {
    return `You are an AI phone assistant making a call on behalf of a user. Your goal is to complete the following task professionally and efficiently:

TASK: ${task}

${businessName ? `BUSINESS: ${businessName}\n` : ''}
IMPORTANT GUIDELINES:
- Be polite, professional, and concise
- Identify yourself as an AI assistant if directly asked
- Listen carefully and respond appropriately to what you hear
- Ask clarifying questions when needed
- Confirm important details (times, dates, names, etc.)
- If you reach voicemail, leave a brief message with callback info
- If the task cannot be completed, explain why politely
- When the objective is achieved or clearly cannot be completed, end the call gracefully
- Keep responses brief (1-2 sentences typically)

CONVERSATION FLOW:
1. Greet professionally
2. State your purpose clearly
3. Provide necessary information
4. Respond to questions or requests
5. Confirm any arrangements made
6. Thank them and end call

Remember: You are having a real phone conversation. Be natural, responsive, and adaptive to what the other person says.`;
  }

  /**
   * Start WebSocket server for Twilio Media Streams
   */
  async startMediaServer(port = 3000) {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port });

      this.wss.on('listening', () => {
        console.log(`WebSocket server listening on port ${port}`);
        resolve(`wss://YOUR_SERVER_URL:${port}`); // Note: Needs public URL
      });

      this.wss.on('error', reject);

      this.wss.on('connection', (ws) => {
        console.log('Twilio connected to WebSocket');
        this.handleMediaStream(ws);
      });
    });
  }

  /**
   * Handle incoming Twilio media stream
   */
  handleMediaStream(ws) {
    let streamSid = null;
    let callSid = null;
    let audioBuffer = Buffer.alloc(0);

    ws.on('message', async (message) => {
      try {
        const msg = JSON.parse(message.toString());

        switch (msg.event) {
          case 'start':
            streamSid = msg.start.streamSid;
            callSid = msg.start.callSid;
            this.callSid = callSid;
            console.log(`Stream started: ${streamSid}`);
            this.emit('call_started', { callSid, streamSid });
            
            // Send initial greeting
            await this.sendInitialGreeting(ws);
            break;

          case 'media':
            // Incoming audio from caller (base64 encoded mulaw)
            const payload = Buffer.from(msg.media.payload, 'base64');
            audioBuffer = Buffer.concat([audioBuffer, payload]);

            // Process when we have enough audio (~1 second)
            if (audioBuffer.length >= 8000) {
              await this.processIncomingAudio(audioBuffer, ws);
              audioBuffer = Buffer.alloc(0);
            }
            break;

          case 'stop':
            console.log('Stream stopped');
            this.conversationActive = false;
            this.emit('call_ended', { callSid });
            break;
        }
      } catch (error) {
        console.error('Error handling media stream:', error);
        this.emit('error', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket closed');
      this.conversationActive = false;
    });
  }

  /**
   * Send initial AI greeting
   */
  async sendInitialGreeting(ws) {
    const greeting = await this.generateResponse(
      "Start the conversation with a professional greeting and state your purpose.",
      true
    );

    await this.sendAudioToTwilio(ws, greeting);
  }

  /**
   * Process incoming audio from caller and generate response
   */
  async processIncomingAudio(audioBuffer, ws) {
    try {
      // Convert mulaw audio to text using Whisper
      const transcription = await this.transcribeAudio(audioBuffer);
      
      if (!transcription || transcription.trim().length === 0) {
        return; // Silence or unclear audio
      }

      console.log(`Caller: ${transcription}`);
      this.transcript.push({
        role: 'user',
        content: transcription,
        timestamp: new Date().toISOString()
      });

      this.emit('transcript_update', this.transcript);

      // Generate AI response
      const response = await this.generateResponse(transcription);
      
      if (response) {
        console.log(`AI: ${response}`);
        await this.sendAudioToTwilio(ws, response);
      }

    } catch (error) {
      console.error('Error processing audio:', error);
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper
   */
  async transcribeAudio(audioBuffer) {
    try {
      // Convert mulaw to wav format that Whisper expects
      // For production, use proper audio conversion library
      // This is simplified - actual implementation needs audio format conversion
      
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioBuffer, // Needs to be proper file format
        model: 'whisper-1',
        language: 'en'
      });

      return transcription.text;
    } catch (error) {
      console.error('Transcription error:', error.message);
      return null;
    }
  }

  /**
   * Generate AI response based on conversation context
   */
  async generateResponse(userMessage, isInitial = false) {
    try {
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

      // Add conversation history
      this.transcript.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });

      // Add current message if not initial
      if (!isInitial) {
        messages.push({ role: 'user', content: userMessage });
      }

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: 0.7
      });

      const response = completion.choices[0].message.content;

      this.transcript.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });

      this.emit('transcript_update', this.transcript);

      // Check if conversation should end
      if (this.shouldEndConversation(response)) {
        this.emit('should_end_call');
      }

      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      return null;
    }
  }

  /**
   * Convert text to speech and send to Twilio
   */
  async sendAudioToTwilio(ws, text) {
    try {
      // Generate speech using OpenAI TTS
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: this.voice,
        input: text,
        speed: 1.0
      });

      const audioBuffer = Buffer.from(await mp3.arrayBuffer());

      // Convert to mulaw format for Twilio
      // This is simplified - needs proper audio conversion
      const mulawAudio = this.convertToMulaw(audioBuffer);

      // Send to Twilio in chunks
      const chunkSize = 160; // 20ms of audio at 8kHz
      for (let i = 0; i < mulawAudio.length; i += chunkSize) {
        const chunk = mulawAudio.slice(i, i + chunkSize);
        ws.send(JSON.stringify({
          event: 'media',
          streamSid: this.streamSid,
          media: {
            payload: chunk.toString('base64')
          }
        }));
        
        // Small delay to simulate real-time streaming
        await new Promise(resolve => setTimeout(resolve, 20));
      }

    } catch (error) {
      console.error('Error sending audio:', error);
    }
  }

  /**
   * Simple audio format conversion (placeholder)
   * In production, use proper audio library like 'wavefile' or 'node-audio'
   */
  convertToMulaw(mp3Buffer) {
    // This is a placeholder - actual implementation needs:
    // 1. Decode MP3 to PCM
    // 2. Resample to 8kHz mono
    // 3. Convert to mulaw encoding
    // Libraries: ffmpeg, sox, or native Node.js audio processing
    return mp3Buffer; // Simplified for example
  }

  /**
   * Determine if conversation should end
   */
  shouldEndConversation(response) {
    const endPhrases = [
      'goodbye',
      'thank you for your time',
      'have a great day',
      'talk to you later',
      'that\'s all i needed',
      'i\'ll let you go'
    ];

    const lowerResponse = response.toLowerCase();
    return endPhrases.some(phrase => lowerResponse.includes(phrase));
  }

  /**
   * Initialize conversation with task
   */
  initialize(task, businessName) {
    this.systemPrompt = this.createSystemPrompt(task, businessName);
    this.conversationActive = true;
    this.transcript = [];
  }

  /**
   * Get conversation transcript
   */
  getTranscript() {
    return this.transcript;
  }

  /**
   * Stop conversation
   */
  stop() {
    this.conversationActive = false;
    if (this.wss) {
      this.wss.close();
    }
  }
}

/**
 * Simplified version using GPT-4 + external STT/TTS
 * This is more practical for initial implementation
 */
export class SimpleConversationHandler {
  constructor(openaiApiKey, task, businessName, voice = 'nova') {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.task = task;
    this.businessName = businessName;
    this.voice = voice;
    this.transcript = [];
    this.systemPrompt = this.createSystemPrompt(task, businessName);
  }

  createSystemPrompt(task, businessName) {
    return `You are an AI phone assistant making a call on behalf of a user. Your goal is to complete the following task professionally and efficiently:

TASK: ${task}

${businessName ? `BUSINESS: ${businessName}\n` : ''}
IMPORTANT GUIDELINES:
- Be polite, professional, and concise
- Identify yourself as an AI assistant if directly asked
- Listen carefully and respond appropriately
- Keep responses brief (1-3 sentences)
- Confirm important details
- End call gracefully when objective is achieved

You are in a real phone conversation. Be natural and responsive.`;
  }

  async generateResponse(userMessage) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.transcript,
      { role: 'user', content: userMessage }
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages,
      max_tokens: 150,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    
    this.transcript.push(
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response, timestamp: new Date().toISOString() }
    );

    return response;
  }

  getTranscript() {
    return this.transcript;
  }
}
