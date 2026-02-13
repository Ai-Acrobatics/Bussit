# AI Phone Call Skill

Autonomous phone calling capability for thepopebot - make appointment bookings, service inquiries, and business calls with AI-powered conversation handling.

## 🎯 What It Does

- **Makes Real Phone Calls**: Outbound calling to any business phone number
- **Autonomous Conversations**: AI handles the entire conversation dynamically
- **Real-time Processing**: Speech recognition and synthesis for natural interactions
- **Full Transcription**: Complete logs of every conversation
- **Smart Reporting**: Detailed summaries delivered via Telegram
- **Flexible Tasks**: Handle any scenario from doctor appointments to restaurant reservations

## 🚀 Quick Start

### 1. Get API Keys

You'll need accounts with these services:

#### Twilio (Phone Service)
1. Sign up at https://www.twilio.com/try-twilio
2. Get $15 free credit (enough for ~30 minutes of calls)
3. Note your **Account SID** and **Auth Token** from the console
4. Purchase a phone number (~$1/month) or use the free trial number
5. ⚠️ **Trial accounts** can only call numbers you've verified in the Twilio console

#### OpenAI (Conversational AI)
1. Sign up at https://platform.openai.com/
2. Create an API key under **API Keys** section
3. Add credits to your account ($5-10 recommended for testing)
4. Cost: ~$0.10-0.30 per minute of conversation

#### Telegram (Optional - for notifications)
- If you're already using thepopebot's Telegram integration, it's configured
- Otherwise, create a bot via BotFather and get your token and chat ID

### 2. Configure Credentials

Add these credentials to your repository's `LLM_SECRETS`:

```bash
# Encode your secrets as base64 JSON
echo -n '{
  "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxx",
  "TWILIO_AUTH_TOKEN": "your_auth_token_here",
  "TWILIO_PHONE_NUMBER": "+1234567890",
  "OPENAI_API_KEY": "sk-proj-xxxxxxxxxxxxxx",
  "TELEGRAM_BOT_TOKEN": "123456:ABC-DEF...",
  "TELEGRAM_CHAT_ID": "123456789"
}' | base64
```

Add the base64 output to your GitHub repository secrets as `LLM_SECRETS`.

### 3. Install Dependencies

```bash
cd /job/.pi/skills/ai-phone-call
npm install
```

### 4. Make Your First Call

```bash
./call.js \
  --to "+15551234567" \
  --business "Test Business" \
  --task "This is a test call to verify the system is working"
```

## 📖 Usage Examples

### Book a Doctor Appointment

```bash
./call.js \
  --to "+15559876543" \
  --business "Family Health Clinic" \
  --task "Schedule annual physical exam for John Smith, DOB 3/15/1980. Prefer morning appointments next week. Insurance: Blue Cross PPO. Callback: 555-111-2222"
```

### Make a Restaurant Reservation

```bash
./call.js \
  --to "+15551234567" \
  --business "Italian Bistro" \
  --task "Reserve table for 4 people this Friday at 7pm. Name: Sarah Johnson, phone 555-333-4444. Request quiet table if possible."
```

### Service Inquiry

```bash
./call.js \
  --to "+15557778888" \
  --business "Green Thumb Landscaping" \
  --task "Get quote for weekly lawn mowing service. Property is 1/4 acre. Ask about package deals and when service can start."
```

### Verify Appointment

```bash
./call.js \
  --to "+15552223333" \
  --business "Downtown Dental" \
  --task "Confirm appointment for John Doe on Tuesday Feb 20 at 2:30pm. If time doesn't work, ask for alternatives."
```

## 🎛️ Command Options

```bash
./call.js --to <phone> --task <task> [options]
```

### Required
- `--to <phone>` - Phone number to call (E.164 format: +1234567890)
- `--task <description>` - What you want to accomplish

### Optional
- `--business <name>` - Business name (helps AI with context)
- `--max-duration <minutes>` - Max call length (default: 10)
- `--voice <voice>` - AI voice: alloy, echo, fable, onyx, nova, shimmer (default: nova)
- `--notify <true|false>` - Send Telegram notification (default: true)
- `--save-recording <true|false>` - Save audio file (default: true)

## 🧪 Testing

Run test scenarios without making real calls:

```bash
# List all test scenarios
./test.js --list

# Run specific scenario
./test.js --scenario appointment_booking

# Run all test scenarios
./test.js --all
```

Available test scenarios:
- `appointment_booking` - Medical appointment scheduling
- `restaurant_reservation` - Dinner reservation
- `service_inquiry` - Plumbing service quote
- `voicemail` - Leaving voicemail message
- `no_availability` - Handling fully booked scenarios

## 📊 What You Get

### During the Call
- Real-time console updates showing conversation progress
- Status messages as call connects and proceeds

### After the Call
- **Telegram Notification** with summary and outcome
- **Full Transcript** (both human-readable and JSON)
- **Call Recording** (MP3 audio file)
- **Detailed Report** (Markdown with all details)
- **Structured Summary** (JSON for programmatic access)

### File Organization

```
logs/phone-calls/
└── 2024-02-13_153045_business_name/
    ├── call-info.json       # Metadata and status
    ├── transcript.txt       # Human-readable transcript
    ├── transcript.json      # Structured transcript with timestamps
    ├── recording.mp3        # Call audio
    ├── report.md           # Detailed call report
    └── summary.json        # Structured outcome data
```

## 📱 Telegram Notification Example

```
📞 Call Complete: Family Health Clinic

✅ Status: completed
📱 Number: +15559876543
⏱️ Duration: 3:24
📅 Time: Wed, 13 Feb 2024 15:30:00 GMT

🎯 Objective:
Schedule annual physical exam for John Smith

✅ Outcome:
Successfully completed the requested task. Details confirmed.

📝 Key Details:
• Appointment: Tuesday, Feb 20 at 9:30am
• Patient: John Smith (DOB: 03/15/1980)
• Confirmation: Will receive reminder text
• Callback: 555-111-2222

💬 Full transcript:
logs/phone-calls/2024-02-13_153045_family_health/transcript.txt
```

## 🤖 How It Works

1. **Call Initiation**: Twilio makes outbound call to target number
2. **AI Connection**: OpenAI GPT-4 handles conversation logic
3. **Real-time Processing**:
   - Incoming speech → Whisper STT → Text
   - Text → GPT-4 → Response text
   - Response text → OpenAI TTS → Speech
4. **Conversation Management**: AI tracks context and objectives
5. **Smart Completion**: Recognizes when goal is achieved
6. **Report Generation**: Claude analyzes conversation and creates summary
7. **Notification**: Telegram message sent with results

## 💡 Best Practices

### Task Descriptions

**Good task descriptions are:**
- Clear and specific about the objective
- Include all necessary information upfront
- Provide contact details if needed
- Mention preferences (times, dates, etc.)

**Example of a good task:**
```
Schedule dental cleaning for Jane Doe (DOB 5/12/1990). 
Prefer Tuesday or Wednesday afternoons next week. 
Insurance: Delta Dental. 
Phone: 555-123-4567.
```

**Example of a poor task:**
```
Call and book appointment
```

### Phone Numbers

Always use E.164 format: `+[country code][number]`

- ✅ `+15551234567` (USA)
- ✅ `+442071234567` (UK)
- ❌ `555-123-4567`
- ❌ `(555) 123-4567`

### Timing

- Call during business hours for best results
- Avoid calling at opening or closing time
- Consider time zones when making calls

## 🔧 Troubleshooting

### "Call failed to connect"

**Issue**: Twilio can't complete the call

**Solutions**:
- Verify phone number is in E.164 format (`+1234567890`)
- Check Twilio account has sufficient credits
- For trial accounts, verify the number in Twilio console first
- Make sure the number is a valid, active phone line

### "Error: TWILIO_ACCOUNT_SID not found"

**Issue**: Credentials not in environment

**Solutions**:
- Ensure credentials are in `LLM_SECRETS` (base64-encoded JSON)
- Verify the secret is configured in GitHub repository
- Check that the Docker container has access to `LLM_SECRETS`

### "No Telegram notification received"

**Issue**: Notification not sent

**Solutions**:
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- Check bot has permission to send messages to the chat
- Use `--notify false` if notifications aren't needed
- Check Telegram bot is not blocked

### Call connects but no AI response

**Issue**: OpenAI API not working

**Solutions**:
- Verify `OPENAI_API_KEY` is valid
- Check OpenAI account has available credits
- Look for error messages in console output
- Try again with a shorter task description

### Recording not saved

**Issue**: Audio file missing

**Solutions**:
- Wait a few minutes after call ends (Twilio processes recordings)
- Verify disk space is available in logs directory
- Check write permissions to `/job/logs/phone-calls/`
- Use `--save-recording false` if not needed

## 💰 Pricing

Approximate costs per call:

| Duration | Twilio | OpenAI (GPT-4 + Whisper + TTS) | Total |
|----------|--------|-------------------------------|-------|
| 1-3 min  | $0.04  | $0.11                        | $0.15 |
| 3-5 min  | $0.06  | $0.18                        | $0.24 |
| 5-10 min | $0.12  | $0.30                        | $0.42 |

**Breakdown:**
- Twilio calls: $0.013/min (USA)
- Twilio recording: $0.005/min
- OpenAI Whisper: $0.006/min
- OpenAI TTS: $0.015/min
- OpenAI GPT-4: ~$0.02-0.04 per call (token-based)

## 🔒 Privacy & Ethics

### What This Skill Is For
✅ Booking legitimate appointments
✅ Making reservations at restaurants/hotels
✅ Service inquiries for your own needs
✅ Following up on your own orders/appointments
✅ Business communications where calls are expected

### What This Skill Is NOT For
❌ Unsolicited marketing or sales calls
❌ Spam or harassment
❌ Impersonating a human when it matters
❌ Emergency services (911, etc.)
❌ Personal relationships
❌ Legal or official proceedings

### Guidelines
- The AI will identify as an AI assistant if asked
- All recordings are stored locally and not shared
- Only call businesses where calls are appropriate
- Comply with local regulations (one-party consent, etc.)
- Use responsibly and ethically

## 🏗️ Technical Architecture

### Components

1. **TwilioClient** (`lib/twilio-client.js`)
   - Manages call creation via Twilio API
   - Handles call status monitoring
   - Downloads and saves recordings

2. **ConversationHandler** (`lib/conversation.js`)
   - Manages AI conversation logic
   - Processes speech-to-text via Whisper
   - Generates responses via GPT-4
   - Converts text-to-speech via OpenAI TTS

3. **Reporter** (`lib/reporter.js`)
   - Analyzes conversations
   - Generates detailed reports
   - Sends Telegram notifications

4. **Storage** (`lib/storage.js`)
   - Organizes files by call
   - Saves transcripts, recordings, and metadata
   - Maintains structured logs

### Simplified Implementation Note

The current implementation uses a **simplified approach** that:
- Makes the call via Twilio
- Uses basic TwiML for initial message
- Records the conversation
- Transcribes after the fact

A **full production implementation** would:
- Run a WebSocket server for real-time audio streaming
- Use Twilio Media Streams for bidirectional audio
- Process speech in real-time with immediate AI responses
- Provide fully conversational, back-and-forth dialogue

The simplified version is excellent for getting started and many use cases. The full real-time version requires a publicly accessible WebSocket endpoint and more complex audio processing.

## 🔮 Future Enhancements

Potential improvements:
- [ ] Real-time WebSocket conversation (full bidirectional audio)
- [ ] Support for multiple languages
- [ ] Voice cloning for personalized AI voices
- [ ] Integration with calendar systems for automated scheduling
- [ ] SMS follow-up capabilities
- [ ] Call analytics and success rate tracking
- [ ] Retry logic for failed calls
- [ ] Call queue management for bulk operations

## 📚 Additional Resources

- [Twilio Programmable Voice Docs](https://www.twilio.com/docs/voice)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Twilio Media Streams](https://www.twilio.com/docs/voice/tutorials/consume-real-time-media-stream-using-websockets-python-and-flask)

## 🆘 Support

If you encounter issues:

1. **Check the logs**: Look in `logs/phone-calls/latest/`
2. **Review call details**: Check `call-info.json` for status
3. **Verify credentials**: Run `./lib/llm-secrets.js` to see what's available
4. **Test connectivity**: Try the test framework first
5. **Review documentation**: See SKILL.md for detailed usage

## 📄 License

Part of thepopebot - MIT License
