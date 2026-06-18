// ============================================================
// routes/networkRoutes.js
// Defines the API endpoints related to network analysis.
// Routes connect URLs to controller functions.
// ============================================================

const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');

// POST /api/network/analyze
// Called when user clicks "Analyze Network" button
// Expects: { signalStrength, latency, packetLoss, connectedDevices, routerUptime }
router.post('/analyze', networkController.analyzeNetwork);

module.exports = router;
