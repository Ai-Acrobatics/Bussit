import ExcelJS from 'exceljs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Get tracking file path
function getTrackingFile() {
  const configPath = '/job/operating_system/DEPLOYMENT_MONITOR.json';
  
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    return config.tracking?.file;
  }
  
  return process.env.DEPLOYMENT_TRACKING_FILE || '/job/logs/deployments/tracking.xlsx';
}

// Initialize tracking workbook
async function initWorkbook() {
  const filePath = getTrackingFile();
  const workbook = new ExcelJS.Workbook();
  
  if (existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
  } else {
    // Create new workbook with headers
    const worksheet = workbook.addWorksheet('Deployments');
    
    worksheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 20 },
      { header: 'Repository', key: 'repository', width: 30 },
      { header: 'Workflow', key: 'workflow', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Duration (s)', key: 'duration', width: 15 },
      { header: 'Commit', key: 'commit', width: 15 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Error', key: 'error', width: 50 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Fix Applied', key: 'fix_applied', width: 15 },
      { header: 'Auto Fixed', key: 'auto_fixed', width: 15 },
      { header: 'Run ID', key: 'run_id', width: 15 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
  }
  
  return { workbook, filePath };
}

// Add deployment record
export async function trackDeployment(data) {
  const { workbook, filePath } = await initWorkbook();
  const worksheet = workbook.getWorksheet('Deployments') || workbook.addWorksheet('Deployments');
  
  // Ensure directory exists
  mkdirSync(dirname(filePath), { recursive: true });
  
  // Calculate duration
  let duration = null;
  if (data.started_at && data.completed_at) {
    const start = new Date(data.started_at);
    const end = new Date(data.completed_at);
    duration = Math.round((end - start) / 1000);
  }
  
  // Add row
  worksheet.addRow({
    timestamp: data.timestamp || new Date().toISOString(),
    repository: data.repository,
    workflow: data.workflow,
    status: data.status,
    duration: duration,
    commit: data.commit?.substring(0, 7),
    branch: data.branch,
    error: data.error || '',
    category: data.category || '',
    fix_applied: data.fix_applied ? 'Yes' : 'No',
    auto_fixed: data.auto_fixed ? 'Yes' : 'No',
    run_id: data.run_id
  });
  
  // Apply conditional formatting for status
  const lastRow = worksheet.lastRow;
  const statusCell = lastRow.getCell('status');
  
  if (data.status === 'success' || data.status === 'completed') {
    statusCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF90EE90' }
    };
  } else if (data.status === 'failure' || data.status === 'failed') {
    statusCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B6B' }
    };
  }
  
  // Save workbook
  await workbook.xlsx.writeFile(filePath);
  
  console.log(`✓ Deployment tracked: ${filePath}`);
  
  return filePath;
}

// Get deployment history
export async function getDeploymentHistory(options = {}) {
  const { workbook } = await initWorkbook();
  const worksheet = workbook.getWorksheet('Deployments');
  
  if (!worksheet) {
    return [];
  }
  
  const records = [];
  const now = new Date();
  const daysAgo = new Date(now - (options.days || 30) * 24 * 60 * 60 * 1000);
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    
    const record = {
      timestamp: row.getCell('timestamp').value,
      repository: row.getCell('repository').value,
      workflow: row.getCell('workflow').value,
      status: row.getCell('status').value,
      duration: row.getCell('duration').value,
      commit: row.getCell('commit').value,
      branch: row.getCell('branch').value,
      error: row.getCell('error').value,
      category: row.getCell('category').value,
      fix_applied: row.getCell('fix_applied').value === 'Yes',
      auto_fixed: row.getCell('auto_fixed').value === 'Yes',
      run_id: row.getCell('run_id').value
    };
    
    // Filter by date
    const recordDate = new Date(record.timestamp);
    if (recordDate < daysAgo) return;
    
    // Filter by repository
    if (options.repository && record.repository !== options.repository) return;
    
    // Filter by status
    if (options.status && record.status !== options.status) return;
    
    records.push(record);
  });
  
  return records.reverse(); // Most recent first
}

// Generate deployment report
export async function generateReport(options = {}) {
  const records = await getDeploymentHistory(options);
  
  if (records.length === 0) {
    return {
      total: 0,
      success: 0,
      failed: 0,
      success_rate: 0,
      avg_duration: 0,
      auto_fixed: 0,
      categories: {}
    };
  }
  
  const total = records.length;
  const success = records.filter(r => r.status === 'success' || r.status === 'completed').length;
  const failed = records.filter(r => r.status === 'failure' || r.status === 'failed').length;
  const success_rate = Math.round((success / total) * 100);
  
  const durations = records.filter(r => r.duration).map(r => r.duration);
  const avg_duration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  
  const auto_fixed = records.filter(r => r.auto_fixed).length;
  
  // Count by category
  const categories = {};
  records.forEach(r => {
    if (r.category) {
      categories[r.category] = (categories[r.category] || 0) + 1;
    }
  });
  
  return {
    total,
    success,
    failed,
    success_rate,
    avg_duration,
    auto_fixed,
    categories,
    records: options.include_records ? records : undefined
  };
}

// Save log to JSON
export function saveLog(type, data) {
  const date = new Date().toISOString().split('T')[0];
  const logDir = `/job/logs/deployments/${date}`;
  
  mkdirSync(logDir, { recursive: true });
  
  // Find next log number
  const files = require('fs').readdirSync(logDir);
  const logNumbers = files
    .filter(f => f.startsWith(`${type}-`) && f.endsWith('.json'))
    .map(f => parseInt(f.match(/(\d+)/)?.[1] || '0'))
    .filter(n => !isNaN(n));
  
  const nextNumber = logNumbers.length > 0 ? Math.max(...logNumbers) + 1 : 1;
  const filename = `${type}-${String(nextNumber).padStart(3, '0')}.json`;
  
  const logPath = `${logDir}/${filename}`;
  writeFileSync(logPath, JSON.stringify(data, null, 2));
  
  return logPath;
}
