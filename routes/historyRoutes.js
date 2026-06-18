// ============================================================
// routes/historyRoutes.js
// Defines the API endpoints related to analysis history.
// ============================================================

const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

// GET /api/history
// Fetch all stored analysis history
router.get('/', historyController.getHistory);

// DELETE /api/history/clear
// Clear all analysis history
router.delete('/clear', historyController.clearHistory);

module.exports = router;
