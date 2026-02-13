Build AI Phone Calling Skill for Appointment Booking and Business Calls

Create a comprehensive Pi skill that enables autonomous phone calling capabilities with the following features:

**Core Functionality:**
- Make outbound calls to businesses for appointment booking and general services
- Handle dynamic conversation flows based on user-provided task instructions (no predetermined scripts)
- Real-time speech recognition and voice synthesis for natural conversations
- Full call transcription and conversation logging

**Technical Requirements:**
- Research and implement best phone service API (Twilio, Vonage, etc.)
- Integrate speech-to-text and text-to-speech services
- Build conversation AI that can adapt to different business types and scenarios
- Create skill interface that accepts flexible task parameters (business info, objective, preferred times, etc.)

**Reporting System:**
- Generate detailed call reports including: transcripts, outcomes, next steps, contact info
- Deliver reports via Telegram immediately after calls
- Save all call data and recordings to organized file structure in logs/
- Include success/failure status and any follow-up actions needed

**Skill Configuration:**
- Set up authentication for phone services in LLM_SECRETS
- Create clear documentation for usage and task formatting
- Include error handling for failed calls, busy lines, voicemail scenarios
- Build testing framework with sample scenarios

The skill should be flexible enough to handle any calling task you give it - from booking doctor appointments to calling restaurants for reservations to inquiring about services.