# AI Phone Call - Usage Examples

Real-world examples for common scenarios.

## Medical & Healthcare

### Book Doctor Appointment

```bash
./call.js \
  --to "+15551234567" \
  --business "Family Health Center" \
  --task "Schedule annual physical exam for John Smith, date of birth March 15, 1980. Patient has Blue Cross Blue Shield insurance. Prefer morning appointments next week. Callback number is 555-123-4567."
```

### Dental Cleaning

```bash
./call.js \
  --to "+15559876543" \
  --business "Bright Smile Dental" \
  --task "Book dental cleaning appointment for Sarah Johnson. Last cleaning was 6 months ago. Prefer Tuesday or Wednesday afternoons. Patient phone: 555-888-9999."
```

### Veterinary Appointment

```bash
./call.js \
  --to "+15557778888" \
  --business "Pet Care Veterinary Clinic" \
  --task "New patient appointment for dog named Max, 2-year-old Golden Retriever. Needs vaccination checkup. Owner: Lisa Brown, phone 555-444-5555. Prefer afternoon appointments."
```

### Specialist Referral

```bash
./call.js \
  --to "+15552223333" \
  --business "Orthopedic Specialists" \
  --task "Book appointment with Dr. Martinez for knee pain consultation. Referred by Dr. Smith. Patient: Michael Chen, DOB 8/20/1975. Insurance: Aetna PPO. Flexible with timing."
```

### Prescription Refill Check

```bash
./call.js \
  --to "+15553334444" \
  --business "Main Street Pharmacy" \
  --task "Check if prescription #123456 for John Doe is ready for pickup. If not ready, ask when it will be available. Patient phone: 555-111-2222."
```

## Food & Dining

### Restaurant Reservation (Date Night)

```bash
./call.js \
  --to "+15556667777" \
  --business "Italian Bistro" \
  --task "Reserve table for 2 on Friday February 16th at 7:00 PM. Name: David Williams. Request a quiet, romantic table if possible. Phone: 555-999-8888. Celebrating anniversary."
```

### Large Group Dinner

```bash
./call.js \
  --to "+15558889999" \
  --business "Sakura Sushi Restaurant" \
  --task "Make reservation for party of 8 on Saturday at 6:30 PM. Birthday celebration. Ask about omakase menu availability and if they can accommodate food allergies (shellfish). Contact: Jennifer Lee, 555-777-6666."
```

### Takeout Order Inquiry

```bash
./call.js \
  --to "+15551112222" \
  --business "Pizza Palace" \
  --task "Ask about menu and prices for large pizzas. Interested in ordering 3 large pizzas for delivery. Ask about delivery time and minimum order. Address: 123 Main Street."
```

### Catering Quote

```bash
./call.js \
  --to "+15554445555" \
  --business "Elegant Affairs Catering" \
  --task "Request quote for office lunch catering for 25 people on March 15th. Need vegetarian and gluten-free options. Budget approximately $300-400. Contact: Robert Martinez, 555-222-3333."
```

## Home Services

### Plumbing Emergency

```bash
./call.js \
  --to "+15556667788" \
  --business "ABC Plumbing Services" \
  --task "Have leaking pipe under kitchen sink. Ask about emergency service rates and availability today. Prefer afternoon between 2-5 PM. Address: 456 Oak Lane. Phone: 555-444-3333."
```

### Lawn Service Quote

```bash
./call.js \
  --to "+15559998877" \
  --business "Green Thumb Landscaping" \
  --task "Get quote for weekly lawn mowing service starting in March. Property is approximately 1/4 acre. Ask about package deals including trimming and edging. Address: 789 Elm Street. Contact: Tom Wilson, 555-888-7777."
```

### HVAC Maintenance

```bash
./call.js \
  --to "+15553332222" \
  --business "Cool Air Heating & AC" \
  --task "Schedule annual AC maintenance checkup before summer. System is 5 years old, last serviced 1 year ago. Prefer weekday appointments. Property address: 321 Pine Ave. Owner: Nancy Davis, 555-666-5555."
```

### House Cleaning Service

```bash
./call.js \
  --to "+15557776666" \
  --business "Sparkle Clean Services" \
  --task "Inquire about biweekly house cleaning service. 3-bedroom, 2-bath home. Ask about rates, what's included, and scheduling availability. Prefer Friday mornings. Contact: Maria Garcia, 555-333-4444."
```

### Handyman Services

```bash
./call.js \
  --to "+15558887777" \
  --business "Fix-It Handyman" \
  --task "Need several small repairs: leaky faucet, door hinge, outlet replacement. Ask about hourly rate and minimum charge. Available for appointment next week. Address: 555 Maple Drive. Phone: 555-999-8888."
```

## Professional Services

### Hair Salon Appointment

```bash
./call.js \
  --to "+15552224444" \
  --business "Style Studio Salon" \
  --task "Book haircut with stylist Jessica if available. Client: Emma Thompson. Prefer Saturday morning appointments. Last cut was 2 months ago, same style. Phone: 555-777-9999."
```

### Auto Repair Estimate

```bash
./call.js \
  --to "+15556668888" \
  --business "Quality Auto Repair" \
  --task "Vehicle making squeaking noise when braking. 2018 Honda Accord, 60,000 miles. Ask about diagnostic fee and availability this week for inspection. Owner: James Brown, 555-111-3333."
```

### Legal Consultation

```bash
./call.js \
  --to "+15559991111" \
  --business "Smith & Associates Law Firm" \
  --task "Request initial consultation with estate planning attorney. Need to create will and trust. Available for phone or in-person meeting. Contact: Patricia Johnson, 555-444-7777."
```

### Tax Preparation

```bash
./call.js \
  --to "+15553335555" \
  --business "Thompson Tax Services" \
  --task "Schedule appointment for 2024 tax return preparation. Self-employed with home office deduction. Need appointment before April 15th. Contact: Richard Anderson, 555-888-2222."
```

## Personal Services

### Pet Grooming

```bash
./call.js \
  --to "+15557772222" \
  --business "Pampered Pets Grooming" \
  --task "Book grooming appointment for standard poodle named Buddy. Needs full grooming including haircut, bath, nail trim. Prefer weekend appointments. Owner: Susan Miller, 555-666-8888."
```

### Photography Session

```bash
./call.js \
  --to "+15558883333" \
  --business "Memories Photography Studio" \
  --task "Inquire about family photo session pricing and availability. Family of 4 including 2 young children. Interested in outdoor session in spring. Contact: Kelly White, 555-222-4444."
```

### Gym Membership

```bash
./call.js \
  --to "+15554446666" \
  --business "Fitness First Gym" \
  --task "Ask about membership options and pricing. Interested in month-to-month membership. Ask about personal training packages and current promotions. Phone: 555-999-7777."
```

## Confirmations & Follow-ups

### Appointment Confirmation

```bash
./call.js \
  --to "+15551113333" \
  --business "Downtown Dental Office" \
  --task "Confirm appointment for John Smith on Tuesday, February 20th at 2:30 PM. If time slot isn't available, ask for alternatives on same day. Patient phone: 555-444-6666."
```

### Order Status Check

```bash
./call.js \
  --to "+15556665555" \
  --business "Custom Furniture Makers" \
  --task "Check status of custom dining table order placed 3 weeks ago. Order number #12345. Customer: Robert Wilson. Expected delivery was mid-February. Phone: 555-777-8888."
```

### Reservation Modification

```bash
./call.js \
  --to "+15559997777" \
  --business "Hotel Grand" \
  --task "Modify reservation for March 5-7. Originally 2 nights, need to extend to 3 nights (March 5-8). Confirmation number: ABC123. Guest: Laura Martinez, 555-333-9999."
```

### Service Feedback

```bash
./call.js \
  --to "+15552226666" \
  --business "Bob's Auto Repair" \
  --task "Follow up on service completed yesterday. Car is running well, wanted to thank them and ask about recommended service intervals. Customer: Mike Taylor, 555-888-4444."
```

## Information Requests

### Business Hours Inquiry

```bash
./call.js \
  --to "+15557778888" \
  --business "Community Library" \
  --task "Ask about library hours on weekends and holidays. Also inquire if they offer any special programs for adults."
```

### Directions and Parking

```bash
./call.js \
  --to "+15554443333" \
  --business "City Medical Center" \
  --task "Ask for directions to orthopedic clinic within the medical center. Inquire about parking options and fees. Appointment on Tuesday at 10 AM."
```

### Insurance Verification

```bash
./call.js \
  --to "+15556669999" \
  --business "Valley Pediatrics" \
  --task "Verify that they accept Blue Cross Blue Shield insurance for new patients. Patient is 5-year-old child. If yes, ask about new patient intake process."
```

### Menu and Pricing

```bash
./call.js \
  --to "+15558881111" \
  --business "Thai Garden Restaurant" \
  --task "Ask about vegetarian menu options. Interested in pad thai and curry dishes. Request to-go menu be emailed if possible to sarah@email.com"
```

## Special Situations

### Cancellation Due to Emergency

```bash
./call.js \
  --to "+15553337777" \
  --business "Dr. Anderson's Office" \
  --task "Cancel appointment for today at 3 PM due to family emergency. Patient: John Doe. Ask about rescheduling for next week. Phone: 555-111-9999."
```

### Gift Card Balance

```bash
./call.js \
  --to "+15559994444" \
  --business "Spa Serenity" \
  --task "Check gift card balance for card number 1234-5678-9012. Also ask if it can be used for any services or if there are restrictions."
```

### Weather-Related Rescheduling

```bash
./call.js \
  --to "+15552228888" \
  --business "Outdoor Adventures Tours" \
  --task "Kayak tour scheduled for tomorrow, but weather forecast shows rain. Ask about rescheduling options or refund policy. Booking reference: OA-12345. Contact: Alex Johnson, 555-666-7777."
```

### Senior/Student Discount Inquiry

```bash
./call.js \
  --to "+15557773333" \
  --business "Downtown Movie Theater" \
  --task "Ask about senior citizen discount policies for matinee shows. Also inquire about group rates for party of 6. Interested in Friday afternoon showing."
```

## Integration with thepopebot

### Scheduled Appointment Booking (Cron Job)

Add to `operating_system/CRONS.json`:

```json
{
  "name": "weekly-appointment-check",
  "schedule": "0 9 * * MON",
  "type": "agent",
  "job": "Use the ai-phone-call skill to call my dentist at +15551234567 and check if I have any upcoming appointments scheduled. If not, book a cleaning appointment for next month.",
  "enabled": true
}
```

### Webhook-Triggered Callback

Add to `operating_system/TRIGGERS.json`:

```json
{
  "name": "appointment-reminder-call",
  "watch_path": "/webhook",
  "actions": [
    {
      "type": "agent",
      "job": "Use ai-phone-call skill to call {{body.phone_number}} and remind them about their appointment on {{body.date}} at {{body.time}}. Business: {{body.business_name}}"
    }
  ],
  "enabled": true
}
```

### Telegram-Initiated Call

Chat with your bot:
```
Book me a dentist appointment for next week
```

The bot can use the skill to make the call and report back.

## Tips for Writing Good Tasks

### ✅ Good Task Descriptions

- Include all necessary information
- Be specific about preferences
- Provide contact details
- Mention any constraints

### ❌ Poor Task Descriptions

- Too vague ("call them")
- Missing key info (no callback number)
- Unclear objective ("check something")
- Too complex (multiple unrelated tasks)

### Template for Appointments

```
Book [SERVICE_TYPE] for [PERSON_NAME] [DETAILS].
Prefer [TIME_PREFERENCE].
[INSURANCE/SPECIAL_INFO].
Callback: [PHONE_NUMBER].
```

### Template for Reservations

```
Reserve [WHAT] for [NUMBER] people on [DATE] at [TIME].
Name: [NAME].
Phone: [PHONE].
[SPECIAL_REQUESTS].
```

### Template for Inquiries

```
Ask about [TOPIC].
[RELEVANT_DETAILS].
[FOLLOW_UP_QUESTIONS].
Contact: [NAME], [PHONE].
```

## Cost Optimization Tips

1. **Set Duration Limits**: Use `--max-duration` for simple inquiries
   ```bash
   ./call.js --to "+1555..." --task "..." --max-duration 3
   ```

2. **Group Related Calls**: Make multiple inquiries in one call when possible

3. **Test First**: Use test framework before real calls

4. **Monitor Usage**: Check Twilio and OpenAI dashboards regularly

5. **Off-Peak Hours**: Call during business slow times for shorter wait

## Advanced Usage

### Custom Voice Selection

```bash
./call.js --to "+1555..." --task "..." --voice "fable"
```

Available voices: alloy, echo, fable, onyx, nova (default), shimmer

### Without Telegram Notification

```bash
./call.js --to "+1555..." --task "..." --notify false
```

### Without Recording

```bash
./call.js --to "+1555..." --task "..." --save-recording false
```

### Maximum Duration Control

```bash
./call.js --to "+1555..." --task "..." --max-duration 15
```

## Batch Processing

Create a CSV file with multiple calls:

```csv
phone,business,task
+15551234567,Doctor Office,Book physical exam
+15559876543,Dentist,Schedule cleaning
+15557778888,Restaurant,Make reservation for 4 on Friday
```

Process with a script:

```bash
#!/bin/bash
while IFS=',' read -r phone business task; do
  ./call.js --to "$phone" --business "$business" --task "$task"
  sleep 120  # Wait 2 minutes between calls
done < calls.csv
```

---

**Need more examples?** Check the test scenarios:
```bash
./test.js --list
```

Or see `SKILL.md` and `README.md` for additional use cases.
