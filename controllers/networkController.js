// ============================================================
// controllers/networkController.js
// This file contains the BUSINESS LOGIC of our application.
// It calculates the network health score, detects issues,
// and generates troubleshooting recommendations.
// ============================================================

const historyController = require('./historyController');

// ============================================================
// HELPER FUNCTION: Calculate Signal Strength Score
// Input: signal strength percentage (0-100)
// Output: score (0-25) + rating string
// ============================================================
function analyzeSignalStrength(signal) {
  let score = 0;
  let rating = '';

  if (signal >= 90) {
    score = 25;
    rating = 'Excellent';
  } else if (signal >= 70) {
    score = 20;
    rating = 'Good';
  } else if (signal >= 50) {
    score = 12;
    rating = 'Fair';
  } else {
    score = 0;
    rating = 'Poor';
  }

  return { score, rating };
}

// ============================================================
// HELPER FUNCTION: Calculate Latency Score
// Input: latency in milliseconds
// Output: score (0-25) + rating string
// ============================================================
function analyzeLatency(latency) {
  let score = 0;
  let rating = '';

  if (latency <= 30) {
    score = 25;
    rating = 'Excellent';
  } else if (latency <= 80) {
    score = 20;
    rating = 'Good';
  } else if (latency <= 150) {
    score = 10;
    rating = 'Fair';
  } else {
    score = 0;
    rating = 'Poor';
  }

  return { score, rating };
}

// ============================================================
// HELPER FUNCTION: Calculate Packet Loss Score
// Input: packet loss percentage (0-100)
// Output: score (0-25) + rating string
// ============================================================
function analyzePacketLoss(packetLoss) {
  let score = 0;
  let rating = '';

  if (packetLoss <= 1) {
    score = 25;
    rating = 'Excellent';
  } else if (packetLoss <= 5) {
    score = 12;
    rating = 'Fair';
  } else {
    score = 0;
    rating = 'Poor';
  }

  return { score, rating };
}

// ============================================================
// HELPER FUNCTION: Calculate Connected Devices Score
// Input: number of connected devices
// Output: score (0-25) + rating string
// ============================================================
function analyzeDevices(devices) {
  let score = 0;
  let rating = '';

  if (devices >= 1 && devices <= 10) {
    score = 25;
    rating = 'Good';
  } else if (devices <= 20) {
    score = 12;
    rating = 'Moderate';
  } else {
    score = 0;
    rating = 'Heavy Load';
  }

  return { score, rating };
}

// ============================================================
// HELPER FUNCTION: Detect Issues
// Looks at the input data and finds problems in the network
// ============================================================
function detectIssues(signal, latency, packetLoss, devices) {
  const issues = [];

  if (signal < 50) {
    issues.push('⚠️ Weak Wi-Fi signal detected.');
  }
  if (latency > 150) {
    issues.push('⚠️ High latency detected (above 150ms).');
  } else if (latency > 80) {
    issues.push('⚠️ Moderate latency detected (above 80ms).');
  }
  if (packetLoss > 5) {
    issues.push('⚠️ High packet loss detected (above 5%).');
  } else if (packetLoss > 1) {
    issues.push('⚠️ Moderate packet loss detected (above 1%).');
  }
  if (devices > 20) {
    issues.push('⚠️ Too many connected devices (above 20).');
  } else if (devices > 10) {
    issues.push('⚠️ Moderate network load (11-20 devices).');
  }

  if (issues.length === 0) {
    issues.push('✅ No major issues detected. Network is healthy!');
  }

  return issues;
}

// ============================================================
// HELPER FUNCTION: Generate Troubleshooting Recommendations
// Based on what's wrong, suggest what the user should do
// ============================================================
function generateRecommendations(signal, latency, packetLoss, devices) {
  const recommendations = [];

  // Signal strength recommendations
  if (signal < 50) {
    recommendations.push('📶 Move closer to the router to improve signal strength.');
    recommendations.push('🧱 Reduce physical obstructions (walls, furniture) between device and router.');
    recommendations.push('📡 Consider using a Wi-Fi range extender or mesh network.');
  } else if (signal < 70) {
    recommendations.push('📶 Try repositioning your router to a more central location.');
  }

  // Latency recommendations
  if (latency > 150) {
    recommendations.push('🔄 Restart the router to clear memory and refresh connections.');
    recommendations.push('🌐 Contact your ISP if high latency persists.');
    recommendations.push('📻 Switch to the 5 GHz band for lower latency (if supported).');
  } else if (latency > 80) {
    recommendations.push('🔄 Restart the router to improve latency.');
    recommendations.push('📻 Consider switching to the 5 GHz band for better performance.');
  }

  // Packet loss recommendations
  if (packetLoss > 5) {
    recommendations.push('🔌 Check all cable connections to the router and modem.');
    recommendations.push('📞 Contact your ISP if packet loss remains persistently high.');
    recommendations.push('🔄 Try factory resetting the router as a last resort.');
  } else if (packetLoss > 1) {
    recommendations.push('🔄 Restart the router to reduce packet loss.');
    recommendations.push('📡 Check for interference from neighboring Wi-Fi networks.');
  }

  // Device load recommendations
  if (devices > 20) {
    recommendations.push('📱 Reduce the number of connected devices to improve performance.');
    recommendations.push('⚙️ Enable Quality of Service (QoS) settings on your router.');
    recommendations.push('🔒 Check if unauthorized devices are connected to your network.');
  } else if (devices > 10) {
    recommendations.push('📱 Consider disconnecting idle devices to free up bandwidth.');
  }

  // If everything is fine
  if (recommendations.length === 0) {
    recommendations.push('✅ Your network is performing well! No action needed.');
    recommendations.push('💡 Continue monitoring periodically to maintain optimal performance.');
  }

  return recommendations;
}

// ============================================================
// HELPER FUNCTION: Get Overall Health Status Label
// Converts a numeric score into a human-readable label
// ============================================================
function getHealthStatus(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

// ============================================================
// MAIN CONTROLLER FUNCTION: analyzeNetwork
// This is called when POST /api/network/analyze is requested.
// It orchestrates all the helper functions above.
// ============================================================
async function analyzeNetwork(req, res) {
  try {
    // 1. Extract input data from the request body
    const {
      signalStrength,
      latency,
      packetLoss,
      connectedDevices,
      routerUptime
    } = req.body;

    // 2. Validate that all required fields are present
    if (
      signalStrength === undefined ||
      latency === undefined ||
      packetLoss === undefined ||
      connectedDevices === undefined ||
      routerUptime === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: signalStrength, latency, packetLoss, connectedDevices, routerUptime'
      });
    }

    // 3. Convert string inputs to numbers
    const signal = parseFloat(signalStrength);
    const lat = parseFloat(latency);
    const pktLoss = parseFloat(packetLoss);
    const devices = parseInt(connectedDevices);
    const uptime = parseFloat(routerUptime);

    // 4. Validate ranges
    if (signal < 0 || signal > 100) {
      return res.status(400).json({ success: false, message: 'Signal Strength must be between 0 and 100.' });
    }
    if (lat < 0) {
      return res.status(400).json({ success: false, message: 'Latency must be a positive number.' });
    }
    if (pktLoss < 0 || pktLoss > 100) {
      return res.status(400).json({ success: false, message: 'Packet Loss must be between 0 and 100.' });
    }
    if (devices < 0) {
      return res.status(400).json({ success: false, message: 'Connected Devices must be a positive number.' });
    }

    // 5. Calculate individual scores (each max 25 points = total max 100)
    const signalAnalysis = analyzeSignalStrength(signal);
    const latencyAnalysis = analyzeLatency(lat);
    const packetLossAnalysis = analyzePacketLoss(pktLoss);
    const devicesAnalysis = analyzeDevices(devices);

    // 6. Calculate total health score
    const totalScore =
      signalAnalysis.score +
      latencyAnalysis.score +
      packetLossAnalysis.score +
      devicesAnalysis.score;

    // 7. Get overall health status
    const status = getHealthStatus(totalScore);

    // 8. Detect issues
    const issues = detectIssues(signal, lat, pktLoss, devices);

    // 9. Generate recommendations
    const recommendations = generateRecommendations(signal, lat, pktLoss, devices);

    // 10. Build the result object
    const result = {
      timestamp: new Date().toISOString(),
      inputs: {
        signalStrength: signal,
        latency: lat,
        packetLoss: pktLoss,
        connectedDevices: devices,
        routerUptime: uptime
      },
      scores: {
        signal: { score: signalAnalysis.score, rating: signalAnalysis.rating, max: 25 },
        latency: { score: latencyAnalysis.score, rating: latencyAnalysis.rating, max: 25 },
        packetLoss: { score: packetLossAnalysis.score, rating: packetLossAnalysis.rating, max: 25 },
        devices: { score: devicesAnalysis.score, rating: devicesAnalysis.rating, max: 25 }
      },
      healthScore: totalScore,
      status: status,
      issues: issues,
      recommendations: recommendations
    };

    // 11. Save to history
    await historyController.saveToHistory(result);

    // 12. Send back the result
    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in analyzeNetwork:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again.'
    });
  }
}

module.exports = { analyzeNetwork };
