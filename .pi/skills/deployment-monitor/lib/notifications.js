import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import { readFileSync, existsSync } from 'fs';

// Load configuration
function loadConfig() {
  const configPath = '/job/operating_system/DEPLOYMENT_MONITOR.json';
  
  if (existsSync(configPath)) {
    return JSON.parse(readFileSync(configPath, 'utf8'));
  }
  
  return null;
}

// Send Telegram notification
export async function sendTelegramNotification(message, options = {}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.log('Telegram bot token not found, skipping notification');
    return;
  }
  
  const config = loadConfig();
  const chatIds = options.chatIds || config?.notifications?.telegram?.chat_ids || [];
  
  if (chatIds.length === 0) {
    console.log('No Telegram chat IDs configured');
    return;
  }
  
  for (const chatId of chatIds) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      });
      
      if (response.ok) {
        console.log(`✓ Telegram notification sent to ${chatId}`);
      } else {
        console.error(`✗ Failed to send Telegram notification: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`✗ Telegram notification error: ${error.message}`);
    }
  }
}

// Send email notification
export async function sendEmailNotification(subject, body, options = {}) {
  const config = loadConfig();
  
  if (!config?.notifications?.email?.enabled) {
    console.log('Email notifications not enabled');
    return;
  }
  
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };
  
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    console.log('SMTP credentials not found, skipping email');
    return;
  }
  
  const recipients = options.recipients || config.notifications.email.recipients || [];
  
  if (recipients.length === 0) {
    console.log('No email recipients configured');
    return;
  }
  
  try {
    const transporter = nodemailer.createTransporter(smtpConfig);
    
    const info = await transporter.sendMail({
      from: smtpConfig.auth.user,
      to: recipients.join(', '),
      subject: subject,
      html: body
    });
    
    console.log(`✓ Email sent: ${info.messageId}`);
  } catch (error) {
    console.error(`✗ Email error: ${error.message}`);
  }
}

// Format deployment failure notification
export function formatFailureNotification(deployment) {
  const emoji = deployment.status === 'failure' ? '🔴' : '⚠️';
  
  return `${emoji} **Deployment Failed**

*Repository:* ${deployment.repository}
*Workflow:* ${deployment.workflow}
*Branch:* ${deployment.branch}
*Commit:* \`${deployment.commit}\`
*Error:* ${deployment.error}
*Category:* ${deployment.category}

*Run:* #${deployment.run_id}
*Auto-fix:* ${deployment.auto_fix_enabled ? 'Enabled ✓' : 'Disabled'}

${deployment.investigating ? '🔍 Status: Investigating...' : ''}`;
}

// Format deployment success notification
export function formatSuccessNotification(deployment) {
  return `✅ **Deployment Successful**

*Repository:* ${deployment.repository}
*Workflow:* ${deployment.workflow}
*Branch:* ${deployment.branch}
*Commit:* \`${deployment.commit}\`
*Duration:* ${deployment.duration}s

*Run:* #${deployment.run_id}`;
}

// Format fix notification
export function formatFixNotification(fix) {
  return `🔧 **Auto-Fix Applied**

*Repository:* ${fix.repository}
*Issue:* ${fix.issue}
*Solution:* ${fix.solution}
*PR:* #${fix.pr_number}

*Status:* ${fix.status}
${fix.tests_passing ? '✅ Tests passing' : '⚠️ Tests pending'}
${fix.approval_required ? '⏳ Awaiting approval' : ''}`;
}

// Format report notification
export function formatReportNotification(report) {
  const successRate = report.success_rate;
  const emoji = successRate >= 90 ? '🎯' : successRate >= 75 ? '✅' : '⚠️';
  
  let message = `${emoji} **Deployment Report**

*Total Deployments:* ${report.total}
*Success:* ${report.success} (${successRate}%)
*Failed:* ${report.failed}
*Avg Duration:* ${report.avg_duration}s
*Auto-Fixed:* ${report.auto_fixed}

*Top Error Categories:*
`;
  
  const categories = Object.entries(report.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  categories.forEach(([cat, count]) => {
    message += `• ${cat}: ${count}\n`;
  });
  
  return message;
}

// Send notification based on type
export async function notify(type, data) {
  let message;
  
  switch (type) {
    case 'failure':
      message = formatFailureNotification(data);
      break;
    case 'success':
      message = formatSuccessNotification(data);
      break;
    case 'fix':
      message = formatFixNotification(data);
      break;
    case 'report':
      message = formatReportNotification(data);
      break;
    default:
      message = JSON.stringify(data, null, 2);
  }
  
  await sendTelegramNotification(message);
}
