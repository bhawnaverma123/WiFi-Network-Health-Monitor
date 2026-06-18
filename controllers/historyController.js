// ============================================================
// controllers/historyController.js
// This file manages reading and writing analysis history
// to a local JSON file (our simple database).
// ============================================================

const fs = require('fs');
const path = require('path');

// Path to the JSON file where we store history
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'history.json');
const MAX_HISTORY_ITEMS = 10; // Keep only the last 10 analyses

// ============================================================
// HELPER: Ensure the data directory and file exist
// This is called before any read/write operation
// ============================================================
function ensureDataFile() {
  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create history.json with empty array if it doesn't exist
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

// ============================================================
// FUNCTION: Read all history from JSON file
// ============================================================
function readHistory() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading history file:', error);
    return [];
  }
}

// ============================================================
// FUNCTION: Write history array back to JSON file
// ============================================================
function writeHistory(historyArray) {
  ensureDataFile();
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyArray, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing history file:', error);
    return false;
  }
}

// ============================================================
// EXPORTED FUNCTION: Save a new analysis result to history
// Keeps only the last MAX_HISTORY_ITEMS entries
// ============================================================
async function saveToHistory(analysisResult) {
  // Read existing history
  let history = readHistory();

  // Add new result at the beginning (most recent first)
  history.unshift({
    id: Date.now(), // Unique ID using current timestamp
    date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    healthScore: analysisResult.healthScore,
    status: analysisResult.status,
    signalStrength: analysisResult.inputs.signalStrength,
    latency: analysisResult.inputs.latency,
    packetLoss: analysisResult.inputs.packetLoss,
    connectedDevices: analysisResult.inputs.connectedDevices,
    routerUptime: analysisResult.inputs.routerUptime
  });

  // Keep only the last MAX_HISTORY_ITEMS entries
  if (history.length > MAX_HISTORY_ITEMS) {
    history = history.slice(0, MAX_HISTORY_ITEMS);
  }

  // Save back to file
  writeHistory(history);
}

// ============================================================
// EXPORTED FUNCTION: Get all analysis history
// Called when GET /api/history is requested
// ============================================================
async function getHistory(req, res) {
  try {
    const history = readHistory();
    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error in getHistory:', error);
    return res.status(500).json({
      success: false,
      message: 'Error reading history.'
    });
  }
}

// ============================================================
// EXPORTED FUNCTION: Clear all analysis history
// Called when DELETE /api/history/clear is requested
// ============================================================
async function clearHistory(req, res) {
  try {
    writeHistory([]);
    return res.status(200).json({
      success: true,
      message: 'History cleared successfully.'
    });
  } catch (error) {
    console.error('Error in clearHistory:', error);
    return res.status(500).json({
      success: false,
      message: 'Error clearing history.'
    });
  }
}

module.exports = { saveToHistory, getHistory, clearHistory };
