// ============================================================
// server.js - Main Express Server
// This is the entry point of our application.
// It sets up the Express server, middleware, and routes.
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import our route files
const networkRoutes = require('./routes/networkRoutes');
const historyRoutes = require('./routes/historyRoutes');

// Create an Express application
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE SETUP
// Middleware runs on every request before it reaches routes
// ============================================================

// Allow Cross-Origin Resource Sharing (so frontend can talk to backend)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// ROUTES
// Routes define what happens when specific URLs are visited
// ============================================================

// Network analysis routes (e.g., POST /api/analyze)
app.use('/api/network', networkRoutes);

// History routes (e.g., GET /api/history)
app.use('/api/history', historyRoutes);

// Serve the main dashboard HTML page for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`\n🚀 Wi-Fi Network Health Monitor is running!`);
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`📁 Data stored in: ./data/history.json`);
  console.log(`\nPress Ctrl+C to stop the server.\n`);
});

module.exports = app;
