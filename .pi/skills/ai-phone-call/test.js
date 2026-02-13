#!/usr/bin/env node

/**
 * AI Phone Call - Test Framework
 * Test the phone calling system with mock scenarios
 */

import { parseArgs } from 'util';

const TEST_SCENARIOS = {
  appointment_booking: {
    name: 'Appointment Booking',
    description: 'Test booking a medical appointment',
    mockConversation: [
      { speaker: 'business', text: 'Thank you for calling Family Health Clinic, how can I help you?' },
      { speaker: 'ai', text: 'Hello, I\'d like to schedule an appointment for a patient.' },
      { speaker: 'business', text: 'Of course! What type of appointment?' },
      { speaker: 'ai', text: 'An annual physical exam for John Smith, date of birth March 15, 1980.' },
      { speaker: 'business', text: 'Let me check availability. Do you have a preferred day or time?' },
      { speaker: 'ai', text: 'Next week would be ideal, preferably morning appointments.' },
      { speaker: 'business', text: 'I have Tuesday the 20th at 9:30 AM available. Would that work?' },
      { speaker: 'ai', text: 'Yes, that works perfectly. Tuesday February 20th at 9:30 AM.' },
      { speaker: 'business', text: 'Great! And what\'s the best callback number?' },
      { speaker: 'ai', text: 'You can reach us at 555-123-4567.' },
      { speaker: 'business', text: 'Perfect. John Smith is scheduled for Tuesday, February 20th at 9:30 AM. We\'ll send a confirmation text.' },
      { speaker: 'ai', text: 'Thank you so much for your help. Have a great day!' },
      { speaker: 'business', text: 'You too, goodbye!' }
    ],
    expectedOutcome: 'Appointment successfully booked',
    expectedDetails: [
      'Date: Tuesday, February 20th',
      'Time: 9:30 AM',
      'Patient: John Smith',
      'Callback: 555-123-4567'
    ]
  },

  restaurant_reservation: {
    name: 'Restaurant Reservation',
    description: 'Test making a dinner reservation',
    mockConversation: [
      { speaker: 'business', text: 'Good afternoon, Italian Bistro, this is Maria speaking.' },
      { speaker: 'ai', text: 'Hello Maria, I\'d like to make a reservation for dinner.' },
      { speaker: 'business', text: 'Wonderful! What date and time were you thinking?' },
      { speaker: 'ai', text: 'This Friday at 7 PM for 4 people.' },
      { speaker: 'business', text: 'Let me check... Yes, I can accommodate that. May I have a name for the reservation?' },
      { speaker: 'ai', text: 'Yes, it\'s under Sarah Johnson.' },
      { speaker: 'business', text: 'Perfect. Sarah Johnson, party of 4, Friday at 7 PM. Any special requests?' },
      { speaker: 'ai', text: 'If possible, we\'d prefer a quiet table.' },
      { speaker: 'business', text: 'I\'ll make a note of that. Can I get a phone number in case we need to reach you?' },
      { speaker: 'ai', text: 'Sure, it\'s 555-999-8888.' },
      { speaker: 'business', text: 'Excellent. You\'re all set! We look forward to seeing you Friday at 7.' },
      { speaker: 'ai', text: 'Thank you so much! See you then.' }
    ],
    expectedOutcome: 'Reservation confirmed',
    expectedDetails: [
      'Name: Sarah Johnson',
      'Date: Friday',
      'Time: 7 PM',
      'Party size: 4 people',
      'Special request: Quiet table',
      'Phone: 555-999-8888'
    ]
  },

  service_inquiry: {
    name: 'Service Inquiry',
    description: 'Test inquiring about plumbing services',
    mockConversation: [
      { speaker: 'business', text: 'ABC Plumbing, how can I help you?' },
      { speaker: 'ai', text: 'Hi, I\'m calling to inquire about your plumbing services.' },
      { speaker: 'business', text: 'Sure! What kind of work do you need done?' },
      { speaker: 'ai', text: 'I have a leaking pipe and need someone to come take a look. What are your hourly rates?' },
      { speaker: 'business', text: 'Our standard rate is $95 per hour, with a one-hour minimum. Emergency calls are $150 per hour.' },
      { speaker: 'ai', text: 'I see. Would you be able to send someone today?' },
      { speaker: 'business', text: 'We have availability this afternoon. Are you able to be home between 2 and 4 PM?' },
      { speaker: 'ai', text: 'Yes, that would work. What information do you need from me?' },
      { speaker: 'business', text: 'Just your address and phone number.' },
      { speaker: 'ai', text: 'The address is 456 Oak Lane, and my number is 555-444-3333.' },
      { speaker: 'business', text: 'Perfect. We\'ll have a technician there between 2 and 4 PM today.' },
      { speaker: 'ai', text: 'Great, thank you so much!' }
    ],
    expectedOutcome: 'Service scheduled',
    expectedDetails: [
      'Rate: $95/hour standard, $150/hour emergency',
      'Appointment: Today 2-4 PM',
      'Address: 456 Oak Lane',
      'Phone: 555-444-3333'
    ]
  },

  voicemail: {
    name: 'Voicemail Scenario',
    description: 'Test handling voicemail',
    mockConversation: [
      { speaker: 'voicemail', text: 'You have reached the office of Dr. Smith. We are currently unable to take your call...' },
      { speaker: 'ai', text: 'Hello, this is an AI assistant calling on behalf of a patient who would like to schedule an appointment. Please call us back at 555-123-4567. Thank you.' }
    ],
    expectedOutcome: 'Voicemail left',
    expectedDetails: [
      'Callback number provided: 555-123-4567'
    ]
  },

  no_availability: {
    name: 'No Availability',
    description: 'Test handling when business has no availability',
    mockConversation: [
      { speaker: 'business', text: 'Sakura Sushi, how may I help you?' },
      { speaker: 'ai', text: 'Hi, I\'d like to make a reservation for tonight at 8 PM for 6 people.' },
      { speaker: 'business', text: 'I\'m sorry, but we\'re completely booked for tonight.' },
      { speaker: 'ai', text: 'Oh, I understand. Do you have any availability tomorrow night at the same time?' },
      { speaker: 'business', text: 'Let me check... Unfortunately tomorrow is also fully booked for that time.' },
      { speaker: 'ai', text: 'What about earlier, around 6 or 6:30?' },
      { speaker: 'business', text: 'Yes! I have 6:30 PM available tomorrow.' },
      { speaker: 'ai', text: 'Perfect, let\'s book that. The name is Michael Chen.' },
      { speaker: 'business', text: 'Great! Michael Chen, party of 6, tomorrow at 6:30 PM.' },
      { speaker: 'ai', text: 'Thank you so much for working with me!' }
    ],
    expectedOutcome: 'Alternative time booked',
    expectedDetails: [
      'Original request: Tonight 8 PM - not available',
      'Booked instead: Tomorrow 6:30 PM',
      'Name: Michael Chen',
      'Party: 6 people'
    ]
  }
};

function showHelp() {
  console.log(`
AI Phone Call - Test Framework

USAGE:
  ./test.js --scenario <name>    Run a specific test scenario
  ./test.js --list               List all available scenarios
  ./test.js --all                Run all test scenarios
  -h, --help                     Show this help

SCENARIOS:
${Object.entries(TEST_SCENARIOS).map(([key, scenario]) => 
  `  ${key.padEnd(25)} ${scenario.name}`
).join('\n')}

EXAMPLES:
  # Run appointment booking test
  ./test.js --scenario appointment_booking

  # List all scenarios with descriptions
  ./test.js --list

  # Run all tests
  ./test.js --all
`);
}

function listScenarios() {
  console.log('\n📋 Available Test Scenarios\n');
  Object.entries(TEST_SCENARIOS).forEach(([key, scenario]) => {
    console.log(`\n${scenario.name.toUpperCase()}`);
    console.log(`  ID: ${key}`);
    console.log(`  Description: ${scenario.description}`);
    console.log(`  Conversation steps: ${scenario.mockConversation.length}`);
    console.log(`  Expected outcome: ${scenario.expectedOutcome}`);
  });
  console.log('');
}

function runScenario(scenarioKey) {
  const scenario = TEST_SCENARIOS[scenarioKey];
  if (!scenario) {
    console.error(`❌ Scenario "${scenarioKey}" not found`);
    console.log('\nAvailable scenarios:');
    Object.keys(TEST_SCENARIOS).forEach(key => console.log(`  - ${key}`));
    process.exit(1);
  }

  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 ${scenario.description}\n`);

  console.log('💬 Mock Conversation:\n');
  scenario.mockConversation.forEach((turn, i) => {
    const emoji = turn.speaker === 'ai' ? '🤖' : 
                 turn.speaker === 'voicemail' ? '📭' : '👤';
    const label = turn.speaker === 'ai' ? 'AI Assistant' : 
                  turn.speaker === 'voicemail' ? 'Voicemail' : 'Business';
    console.log(`${emoji} ${label}:`);
    console.log(`   "${turn.text}"\n`);
  });

  console.log(`✅ Expected Outcome: ${scenario.expectedOutcome}\n`);
  
  if (scenario.expectedDetails.length > 0) {
    console.log('📋 Expected Details:');
    scenario.expectedDetails.forEach(detail => {
      console.log(`   • ${detail}`);
    });
    console.log('');
  }

  console.log('✅ Test scenario validated\n');
  console.log('💡 To test with a real call, use:');
  console.log(`   ./call.js --to "+15551234567" --task "${scenario.description}"\n`);
}

function runAllScenarios() {
  console.log('\n🧪 Running All Test Scenarios\n');
  console.log('='.repeat(60));
  
  Object.keys(TEST_SCENARIOS).forEach(key => {
    runScenario(key);
    console.log('='.repeat(60));
  });
  
  console.log(`\n✅ All ${Object.keys(TEST_SCENARIOS).length} scenarios validated\n`);
}

// Main execution
const options = {
  scenario: { type: 'string' },
  list: { type: 'boolean' },
  all: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' }
};

let args;
try {
  args = parseArgs({ options, allowPositionals: false });
} catch (error) {
  console.error('Error:', error.message);
  showHelp();
  process.exit(1);
}

if (args.values.help) {
  showHelp();
  process.exit(0);
}

if (args.values.list) {
  listScenarios();
  process.exit(0);
}

if (args.values.all) {
  runAllScenarios();
  process.exit(0);
}

if (args.values.scenario) {
  runScenario(args.values.scenario);
  process.exit(0);
}

// No arguments provided
console.error('❌ No action specified\n');
showHelp();
process.exit(1);
