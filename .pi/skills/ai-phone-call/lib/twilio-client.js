#!/usr/bin/env node

/**
 * Twilio Client
 * Handles phone call creation and management via Twilio API
 */

import twilio from 'twilio';

export class TwilioClient {
  constructor(accountSid, authToken, fromNumber) {
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
    this.accountSid = accountSid;
  }

  /**
   * Make an outbound call with AI conversation handling
   * Returns call SID and status updates via callback
   */
  async makeCall(toNumber, websocketUrl, maxDuration = 600) {
    try {
      // Create TwiML for the call that connects to our WebSocket
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${websocketUrl}">
      <Parameter name="callSid" value="{{CallSid}}" />
    </Stream>
  </Connect>
</Response>`;

      const call = await this.client.calls.create({
        to: toNumber,
        from: this.fromNumber,
        twiml: twiml,
        timeout: 60, // Ring for 60 seconds before giving up
        timeLimit: maxDuration, // Max call duration in seconds
        record: true, // Record the call
        recordingStatusCallback: null, // We'll fetch recording later
        statusCallback: null, // We'll poll for status
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      });

      return {
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from
      };
    } catch (error) {
      throw new Error(`Twilio call failed: ${error.message}`);
    }
  }

  /**
   * Get call status
   */
  async getCallStatus(callSid) {
    try {
      const call = await this.client.calls(callSid).fetch();
      return {
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        price: call.price,
        priceUnit: call.priceUnit
      };
    } catch (error) {
      throw new Error(`Failed to fetch call status: ${error.message}`);
    }
  }

  /**
   * Wait for call to complete and return final status
   */
  async waitForCallComplete(callSid, timeoutSeconds = 900) {
    const startTime = Date.now();
    const pollInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeoutSeconds * 1000) {
      const status = await this.getCallStatus(callSid);

      if (status.status === 'completed' || 
          status.status === 'failed' || 
          status.status === 'busy' ||
          status.status === 'no-answer' ||
          status.status === 'canceled') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Call status check timeout');
  }

  /**
   * Get call recording URL
   */
  async getRecording(callSid) {
    try {
      const recordings = await this.client.recordings.list({
        callSid: callSid,
        limit: 1
      });

      if (recordings.length === 0) {
        return null;
      }

      const recording = recordings[0];
      const recordingUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;
      
      return {
        sid: recording.sid,
        duration: recording.duration,
        url: recordingUrl
      };
    } catch (error) {
      console.error('Failed to fetch recording:', error.message);
      return null;
    }
  }

  /**
   * Download call recording as buffer
   */
  async downloadRecording(recordingUrl) {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.client.password}`).toString('base64');
      const response = await fetch(recordingUrl, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.buffer();
    } catch (error) {
      throw new Error(`Failed to download recording: ${error.message}`);
    }
  }

  /**
   * Hangup an active call
   */
  async hangupCall(callSid) {
    try {
      await this.client.calls(callSid).update({
        status: 'completed'
      });
      return true;
    } catch (error) {
      console.error('Failed to hangup call:', error.message);
      return false;
    }
  }
}
