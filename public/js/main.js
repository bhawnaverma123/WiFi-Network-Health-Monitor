// ============================================================
// public/js/main.js
// This is the FRONTEND JavaScript for the Wi-Fi Health Monitor.
// It handles:
//   - Form submission and validation
//   - API calls to the Express backend
//   - Rendering results (score, cards, charts, issues)
//   - History display
//   - Dark mode toggle
//   - PDF export
//   - Sample data generator
// ============================================================

// ============================================================
// SECTION 1: STATE & CHART REFERENCES
// ============================================================

let radarChartInstance = null;   // Reference to Chart.js radar chart
let donutChartInstance = null;   // Reference to Chart.js donut chart
let lastResult = null;           // Stores the last analysis result for PDF export

// ============================================================
// SECTION 2: DOM ELEMENT REFERENCES
// ============================================================

const networkForm       = document.getElementById('networkForm');
const analyzeBtn        = document.getElementById('analyzeBtn');
const clearFormBtn      = document.getElementById('clearFormBtn');
const loadingOverlay    = document.getElementById('loadingOverlay');
const resultsSection    = document.getElementById('resultsSection');
const historySection    = document.getElementById('historySection');

// Score elements
const scoreNumber       = document.getElementById('scoreNumber');
const scoreProgress     = document.getElementById('scoreProgress');
const scoreCircle       = document.getElementById('scoreCircle');
const statusBadge       = document.getElementById('statusBadge');
const scoreDescription  = document.getElementById('scoreDescription');
const analyticsGrid     = document.getElementById('analyticsGrid');
const issuesList        = document.getElementById('issuesList');
const recommendationsList = document.getElementById('recommendationsList');

// History elements
const historyEmpty      = document.getElementById('historyEmpty');
const historyTableWrapper = document.getElementById('historyTableWrapper');
const historyTableBody  = document.getElementById('historyTableBody');

// Button elements
const darkModeToggle    = document.getElementById('darkModeToggle');
const themeIcon         = document.getElementById('themeIcon');
const exportPdfBtn      = document.getElementById('exportPdfBtn');
const sampleDataBtn     = document.getElementById('sampleDataBtn');
const refreshBtn        = document.getElementById('refreshBtn');
const clearHistoryBtn   = document.getElementById('clearHistoryBtn');

// Toast
const toast             = document.getElementById('toast');
const toastMessage      = document.getElementById('toastMessage');
const toastIcon         = document.getElementById('toastIcon');

// ============================================================
// SECTION 3: TOAST NOTIFICATION
// Shows a small pop-up message at the bottom-right
// ============================================================
function showToast(message, type = 'success') {
  // Set icon based on type
  const icons = {
    success: 'fas fa-check-circle',
    error:   'fas fa-times-circle',
    info:    'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle'
  };
  const colors = {
    success: '#10b981',
    error:   '#ef4444',
    info:    '#6366f1',
    warning: '#f59e0b'
  };

  toastIcon.className = icons[type] || icons.success;
  toastIcon.style.color = colors[type] || colors.success;
  toastMessage.textContent = message;

  // Show toast
  toast.classList.add('show');

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================================
// SECTION 4: DARK MODE TOGGLE
// Switches between dark and light theme
// ============================================================
function initTheme() {
  // Check if user had a saved preference
  const savedTheme = localStorage.getItem('wifiMonitorTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  if (theme === 'dark') {
    themeIcon.className = 'fas fa-moon';
  } else {
    themeIcon.className = 'fas fa-sun';
  }
}

darkModeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('wifiMonitorTheme', newTheme);
  updateThemeIcon(newTheme);

  // Re-render charts if visible (so they match the new theme)
  if (lastResult) {
    setTimeout(() => renderCharts(lastResult), 100);
  }

  showToast(`Switched to ${newTheme} mode`, 'info');
});

// ============================================================
// SECTION 5: FORM VALIDATION
// Checks each input field before submitting
// ============================================================
function validateForm() {
  let isValid = true;

  // Reset all errors first
  ['signal', 'latency', 'packet', 'devices', 'uptime'].forEach(field => {
    document.getElementById(`${field}Error`).textContent = '';
    document.getElementById(`${field}Group`).classList.remove('error');
  });

  // Helper to show an error on a specific field
  function showError(fieldId, groupId, message) {
    document.getElementById(`${fieldId}Error`).textContent = message;
    document.getElementById(`${groupId}Group`).classList.add('error');
    isValid = false;
  }

  // Signal Strength: 0-100
  const signal = parseFloat(document.getElementById('signalStrength').value);
  if (isNaN(signal) || document.getElementById('signalStrength').value.trim() === '') {
    showError('signal', 'signal', 'Signal strength is required.');
  } else if (signal < 0 || signal > 100) {
    showError('signal', 'signal', 'Must be between 0 and 100.');
  }

  // Latency: >= 0
  const latency = parseFloat(document.getElementById('latency').value);
  if (isNaN(latency) || document.getElementById('latency').value.trim() === '') {
    showError('latency', 'latency', 'Latency is required.');
  } else if (latency < 0) {
    showError('latency', 'latency', 'Must be 0 or greater.');
  }

  // Packet Loss: 0-100
  const packetLoss = parseFloat(document.getElementById('packetLoss').value);
  if (isNaN(packetLoss) || document.getElementById('packetLoss').value.trim() === '') {
    showError('packet', 'packet', 'Packet loss is required.');
  } else if (packetLoss < 0 || packetLoss > 100) {
    showError('packet', 'packet', 'Must be between 0 and 100.');
  }

  // Connected Devices: >= 0
  const devices = parseInt(document.getElementById('connectedDevices').value);
  if (isNaN(devices) || document.getElementById('connectedDevices').value.trim() === '') {
    showError('devices', 'devices', 'Number of devices is required.');
  } else if (devices < 0) {
    showError('devices', 'devices', 'Must be 0 or greater.');
  }

  // Router Uptime: >= 0
  const uptime = parseFloat(document.getElementById('routerUptime').value);
  if (isNaN(uptime) || document.getElementById('routerUptime').value.trim() === '') {
    showError('uptime', 'uptime', 'Router uptime is required.');
  } else if (uptime < 0) {
    showError('uptime', 'uptime', 'Must be 0 or greater.');
  }

  return isValid;
}

// ============================================================
// SECTION 6: SCORE CIRCLE ANIMATION
// Animates the circular SVG progress indicator
// ============================================================
function animateScoreCircle(score, status) {
  // The SVG circle circumference is 2 * π * r = 2 * 3.14159 * 52 ≈ 326.7
  const circumference = 326.7;
  const progressRatio = score / 100;
  const dashOffset = circumference - (circumference * progressRatio);

  // Set colors based on status
  const colorMap = {
    'Excellent': '#10b981',
    'Good':      '#3b82f6',
    'Fair':      '#f59e0b',
    'Poor':      '#ef4444'
  };
  const color = colorMap[status] || '#6366f1';

  // Update the SVG stroke
  scoreProgress.style.strokeDashoffset = dashOffset;
  scoreProgress.style.stroke = color;

  // Animate the score number counting up
  let start = 0;
  const duration = 1500; // ms
  const startTime = performance.now();

  function countUp(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentScore = Math.round(eased * score);
    scoreNumber.textContent = currentScore;

    if (progress < 1) {
      requestAnimationFrame(countUp);
    }
  }

  requestAnimationFrame(countUp);
}

// ============================================================
// SECTION 7: RENDER ANALYTICS CARDS
// Creates the 6 metric cards showing each parameter's rating
// ============================================================
function renderAnalyticsCards(data) {
  const { inputs, scores, healthScore, status } = data;

  // Define card configurations
  const cards = [
    {
      icon: 'fas fa-signal',
      label: 'Signal Strength',
      value: inputs.signalStrength,
      unit: '%',
      rating: scores.signal.rating,
      score: scores.signal.score,
      maxScore: 25,
      color: '#6366f1'
    },
    {
      icon: 'fas fa-clock',
      label: 'Latency',
      value: inputs.latency,
      unit: 'ms',
      rating: scores.latency.rating,
      score: scores.latency.score,
      maxScore: 25,
      color: '#06b6d4'
    },
    {
      icon: 'fas fa-triangle-exclamation',
      label: 'Packet Loss',
      value: inputs.packetLoss,
      unit: '%',
      rating: scores.packetLoss.rating,
      score: scores.packetLoss.score,
      maxScore: 25,
      color: '#f59e0b'
    },
    {
      icon: 'fas fa-laptop',
      label: 'Connected Devices',
      value: inputs.connectedDevices,
      unit: 'devices',
      rating: scores.devices.rating,
      score: scores.devices.score,
      maxScore: 25,
      color: '#8b5cf6'
    },
    {
      icon: 'fas fa-power-off',
      label: 'Router Uptime',
      value: inputs.routerUptime,
      unit: 'hours',
      rating: inputs.routerUptime > 720 ? 'Long Uptime' : 'Normal',
      score: null,
      maxScore: null,
      color: '#10b981'
    },
    {
      icon: 'fas fa-heart-pulse',
      label: 'Overall Health',
      value: healthScore,
      unit: '/ 100',
      rating: status,
      score: healthScore,
      maxScore: 100,
      color: '#ef4444'
    }
  ];

  // Build HTML for each card
  analyticsGrid.innerHTML = cards.map(card => {
    const ratingClass = card.rating.toLowerCase().replace(/\s+/g, '-');
    const scoreBar = card.score !== null
      ? `<div class="mini-progress">
           <div class="mini-bar" style="width: ${(card.score / card.maxScore) * 100}%; background: ${card.color};"></div>
         </div>
         <small style="color:var(--text-muted); font-size:0.72rem;">${card.score}/${card.maxScore} pts</small>`
      : '';

    return `
      <div class="analytics-card">
        <div class="analytics-card-icon" style="background: ${card.color}22; color: ${card.color};">
          <i class="${card.icon}"></i>
        </div>
        <div class="analytics-card-label">${card.label}</div>
        <div>
          <span class="analytics-card-value">${card.value}</span>
          <span class="analytics-card-unit"> ${card.unit}</span>
        </div>
        <span class="analytics-card-rating rating-${ratingClass}">${card.rating}</span>
        ${scoreBar}
      </div>
    `;
  }).join('');

  // Add mini-progress bar styles (added dynamically to avoid cluttering CSS)
  if (!document.getElementById('miniProgressStyle')) {
    const style = document.createElement('style');
    style.id = 'miniProgressStyle';
    style.textContent = `
      .mini-progress {
        width: 100%;
        height: 4px;
        background: var(--border-color);
        border-radius: 2px;
        overflow: hidden;
        margin-top: 0.3rem;
      }
      .mini-bar {
        height: 100%;
        border-radius: 2px;
        transition: width 1s ease;
      }
    `;
    document.head.appendChild(style);
  }
}

// ============================================================
// SECTION 8: RENDER CHARTS
// Creates the Radar and Donut charts using Chart.js
// ============================================================
function renderCharts(data) {
  const { inputs, scores } = data;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  // Colors for chart labels and gridlines
  const gridColor  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  // --- RADAR CHART ---
  // Shows normalized values of each metric
  const radarData = {
    labels: ['Signal Strength', 'Latency Score', 'Packet Loss Score', 'Device Load'],
    datasets: [{
      label: 'Current Network',
      data: [
        scores.signal.score,
        scores.latency.score,
        scores.packetLoss.score,
        scores.devices.score
      ],
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: '#6366f1',
      borderWidth: 2,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointRadius: 5
    }]
  };

  // Destroy old chart instance before creating a new one
  if (radarChartInstance) {
    radarChartInstance.destroy();
  }

  const radarCtx = document.getElementById('radarChart').getContext('2d');
  radarChartInstance = new Chart(radarCtx, {
    type: 'radar',
    data: radarData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0,
          max: 25,
          ticks: {
            stepSize: 5,
            color: labelColor,
            backdropColor: 'transparent',
            font: { size: 10 }
          },
          grid: { color: gridColor },
          pointLabels: {
            color: labelColor,
            font: { size: 11, family: 'Inter' }
          },
          angleLines: { color: gridColor }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  // --- DONUT CHART ---
  // Shows the breakdown of each score
  const donutData = {
    labels: ['Signal', 'Latency', 'Packet Loss', 'Devices'],
    datasets: [{
      data: [
        scores.signal.score,
        scores.latency.score,
        scores.packetLoss.score,
        scores.devices.score
      ],
      backgroundColor: ['#6366f1', '#06b6d4', '#f59e0b', '#8b5cf6'],
      borderColor: isDark ? '#111827' : '#ffffff',
      borderWidth: 3,
      hoverOffset: 8
    }]
  };

  if (donutChartInstance) {
    donutChartInstance.destroy();
  }

  const donutCtx = document.getElementById('donutChart').getContext('2d');
  donutChartInstance = new Chart(donutCtx, {
    type: 'doughnut',
    data: donutData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: labelColor,
            font: { size: 11, family: 'Inter' },
            padding: 15,
            usePointStyle: true,
            pointStyleWidth: 8
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed} / 25 pts`
          }
        }
      }
    }
  });
}

// ============================================================
// SECTION 9: RENDER ISSUES & RECOMMENDATIONS
// ============================================================
function renderIssues(issues) {
  issuesList.innerHTML = issues.map(issue => {
    const isOk = issue.startsWith('✅');
    return `<li class="${isOk ? 'issue-ok' : ''}">${issue}</li>`;
  }).join('');
}

function renderRecommendations(recommendations) {
  recommendationsList.innerHTML = recommendations
    .map(rec => `<li>${rec}</li>`)
    .join('');
}

// ============================================================
// SECTION 10: RENDER SCORE BANNER
// Updates the status badge and description text
// ============================================================
function renderScoreBanner(result) {
  const { healthScore, status } = result;
  const statusLower = status.toLowerCase();

  // Set status badge class and text
  statusBadge.className = `score-status-badge ${statusLower}`;
  statusBadge.textContent = status;

  // Set scoreCircle class for color
  scoreCircle.className = `score-circle score-${statusLower}`;

  // Set score description
  const descriptions = {
    'Excellent': '🎉 Your Wi-Fi network is performing exceptionally well. All metrics are in the optimal range.',
    'Good':      '👍 Your network is in good shape with minor room for improvement.',
    'Fair':      '⚠️ Your network has some issues that may affect user experience. Check recommendations.',
    'Poor':      '🔴 Your network is experiencing significant issues. Immediate attention recommended.'
  };
  scoreDescription.textContent = descriptions[status] || 'Analysis complete.';

  // Animate score circle
  animateScoreCircle(healthScore, status);
}

// ============================================================
// SECTION 11: LOAD & RENDER HISTORY
// Fetches history from backend and displays in table
// ============================================================
async function loadHistory() {
  try {
    const response = await fetch('/api/history');
    const data = await response.json();

    if (!data.success || data.data.length === 0) {
      historyEmpty.style.display = 'flex';
      historyTableWrapper.style.display = 'none';
      return;
    }

    // Show table, hide empty state
    historyEmpty.style.display = 'none';
    historyTableWrapper.style.display = 'block';

    // Build table rows
    historyTableBody.innerHTML = data.data.map((item, index) => {
      const statusLower = item.status.toLowerCase();
      return `
        <tr>
          <td><strong>${index + 1}</strong></td>
          <td>${item.date}</td>
          <td>${item.signalStrength}%</td>
          <td>${item.latency} ms</td>
          <td>${item.packetLoss}%</td>
          <td>${item.connectedDevices}</td>
          <td>
            <span class="history-score" style="color: ${getStatusColor(item.status)};">
              ${item.healthScore}
            </span>
          </td>
          <td>
            <span class="history-badge badge-${statusLower}">${item.status}</span>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading history:', error);
  }
}

// Helper: Get color for a status string
function getStatusColor(status) {
  const colors = {
    'Excellent': '#10b981',
    'Good':      '#3b82f6',
    'Fair':      '#f59e0b',
    'Poor':      '#ef4444'
  };
  return colors[status] || '#6366f1';
}

// ============================================================
// SECTION 12: FORM SUBMISSION - MAIN ANALYSIS HANDLER
// ============================================================
networkForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Stop page from reloading

  // 1. Validate the form
  if (!validateForm()) {
    showToast('Please fix the errors in the form.', 'error');
    return;
  }

  // 2. Collect form data
  const formData = {
    signalStrength:   parseFloat(document.getElementById('signalStrength').value),
    latency:          parseFloat(document.getElementById('latency').value),
    packetLoss:       parseFloat(document.getElementById('packetLoss').value),
    connectedDevices: parseInt(document.getElementById('connectedDevices').value),
    routerUptime:     parseFloat(document.getElementById('routerUptime').value)
  };

  // 3. Show loading spinner
  loadingOverlay.style.display = 'flex';
  resultsSection.style.display = 'none';
  analyzeBtn.disabled = true;

  try {
    // 4. Send data to Express backend
    const response = await fetch('/api/network/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const responseData = await response.json();

    if (!responseData.success) {
      throw new Error(responseData.message || 'Analysis failed.');
    }

    // 5. Store last result (for PDF export)
    lastResult = responseData.data;

    // 6. Hide loading spinner
    loadingOverlay.style.display = 'none';

    // 7. Show results section
    resultsSection.style.display = 'block';

    // 8. Render all result components
    renderScoreBanner(lastResult);
    renderAnalyticsCards(lastResult);
    renderCharts(lastResult);
    renderIssues(lastResult.issues);
    renderRecommendations(lastResult.recommendations);

    // 9. Reload history table
    loadHistory();

    // 10. Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 11. Show success notification
    showToast(`Analysis complete! Health Score: ${lastResult.healthScore}/100`, 'success');

  } catch (error) {
    console.error('Analysis error:', error);
    loadingOverlay.style.display = 'none';
    showToast(error.message || 'Analysis failed. Please try again.', 'error');
  } finally {
    analyzeBtn.disabled = false;
  }
});

// ============================================================
// SECTION 13: CLEAR FORM BUTTON
// ============================================================
clearFormBtn.addEventListener('click', () => {
  networkForm.reset();
  // Clear any validation errors
  ['signal', 'latency', 'packet', 'devices', 'uptime'].forEach(field => {
    document.getElementById(`${field}Error`).textContent = '';
    document.getElementById(`${field}Group`).classList.remove('error');
  });
  showToast('Form cleared.', 'info');
});

// ============================================================
// SECTION 14: SAMPLE DATA GENERATOR
// Fills the form with realistic example data
// ============================================================
sampleDataBtn.addEventListener('click', () => {
  // Predefined sample datasets for demonstration
  const samples = [
    // Good network
    { signal: 85, latency: 25, packetLoss: 0.5, devices: 7, uptime: 48, label: 'Good Network' },
    // Poor network
    { signal: 35, latency: 200, packetLoss: 8, devices: 25, uptime: 720, label: 'Poor Network' },
    // Fair network
    { signal: 60, latency: 100, packetLoss: 3, devices: 15, uptime: 96, label: 'Fair Network' },
    // Excellent network
    { signal: 95, latency: 10, packetLoss: 0, devices: 5, uptime: 24, label: 'Excellent Network' }
  ];

  // Pick a random sample
  const sample = samples[Math.floor(Math.random() * samples.length)];

  document.getElementById('signalStrength').value    = sample.signal;
  document.getElementById('latency').value           = sample.latency;
  document.getElementById('packetLoss').value        = sample.packetLoss;
  document.getElementById('connectedDevices').value  = sample.devices;
  document.getElementById('routerUptime').value      = sample.uptime;

  showToast(`Loaded: ${sample.label}. Click "Analyze Network"!`, 'info');
});

// ============================================================
// SECTION 15: REFRESH BUTTON
// ============================================================
refreshBtn.addEventListener('click', () => {
  window.location.reload();
});

// ============================================================
// SECTION 16: CLEAR HISTORY BUTTON
// ============================================================
clearHistoryBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to clear all analysis history?')) return;

  try {
    const response = await fetch('/api/history/clear', { method: 'DELETE' });
    const data = await response.json();

    if (data.success) {
      loadHistory(); // Refresh the history display
      showToast('History cleared successfully.', 'success');
    } else {
      showToast('Failed to clear history.', 'error');
    }
  } catch (error) {
    console.error('Error clearing history:', error);
    showToast('Error clearing history.', 'error');
  }
});

// ============================================================
// SECTION 17: EXPORT PDF REPORT
// Uses jsPDF to generate a downloadable PDF report
// ============================================================
exportPdfBtn.addEventListener('click', () => {
  if (!lastResult) {
    showToast('No analysis to export. Run an analysis first.', 'warning');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- PDF Header ---
    doc.setFillColor(99, 102, 241); // Indigo background
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Wi-Fi Network Health Report', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 30);

    // --- Health Score ---
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NETWORK HEALTH SCORE', 15, 55);

    doc.setFontSize(40);
    const statusColors = {
      'Excellent': [16, 185, 129],
      'Good':      [59, 130, 246],
      'Fair':      [245, 158, 11],
      'Poor':      [239, 68, 68]
    };
    const color = statusColors[lastResult.status] || [99, 102, 241];
    doc.setTextColor(...color);
    doc.text(`${lastResult.healthScore}/100`, 15, 75);

    doc.setFontSize(16);
    doc.text(`Status: ${lastResult.status}`, 15, 88);

    // --- Divider ---
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 95, 195, 95);

    // --- Input Parameters ---
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('INPUT PARAMETERS', 15, 108);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const params = [
      ['Signal Strength', `${lastResult.inputs.signalStrength}%`],
      ['Latency',         `${lastResult.inputs.latency} ms`],
      ['Packet Loss',     `${lastResult.inputs.packetLoss}%`],
      ['Connected Devices', `${lastResult.inputs.connectedDevices}`],
      ['Router Uptime',   `${lastResult.inputs.routerUptime} hours`]
    ];
    params.forEach(([label, value], i) => {
      doc.text(`${label}:`, 20, 120 + i * 9);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 90, 120 + i * 9);
      doc.setFont('helvetica', 'normal');
    });

    // --- Score Breakdown ---
    doc.line(15, 168, 195, 168);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('SCORE BREAKDOWN', 15, 180);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const scores = [
      ['Signal Strength', `${lastResult.scores.signal.score}/25 (${lastResult.scores.signal.rating})`],
      ['Latency',         `${lastResult.scores.latency.score}/25 (${lastResult.scores.latency.rating})`],
      ['Packet Loss',     `${lastResult.scores.packetLoss.score}/25 (${lastResult.scores.packetLoss.rating})`],
      ['Device Load',     `${lastResult.scores.devices.score}/25 (${lastResult.scores.devices.rating})`]
    ];
    scores.forEach(([label, value], i) => {
      doc.text(`${label}:`, 20, 192 + i * 9);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 90, 192 + i * 9);
      doc.setFont('helvetica', 'normal');
    });

    // --- Issues ---
    doc.line(15, 235, 195, 235);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('ISSUES DETECTED', 15, 247);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    lastResult.issues.forEach((issue, i) => {
      // Strip emoji
      const cleanIssue = issue.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
      doc.text(`• ${cleanIssue}`, 20, 258 + i * 8);
    });

    // --- Recommendations (new page) ---
    doc.addPage();

    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SMART RECOMMENDATIONS', 15, 13);

    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    lastResult.recommendations.forEach((rec, i) => {
      const cleanRec = rec.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
      const lines = doc.splitTextToSize(`• ${cleanRec}`, 175);
      doc.text(lines, 20, 35 + i * 14);
    });

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text('Wi-Fi Network Health Monitor | Educational Project | Fresher Interview Portfolio', 15, 287);
      doc.text(`Page ${i} of ${pageCount}`, 180, 287);
    }

    // Save the PDF
    doc.save(`wifi-health-report-${Date.now()}.pdf`);
    showToast('PDF report exported successfully!', 'success');

  } catch (error) {
    console.error('PDF export error:', error);
    showToast('PDF export failed. Please try again.', 'error');
  }
});

// ============================================================
// SECTION 18: INITIALIZATION
// Run when the page first loads
// ============================================================
function init() {
  initTheme();    // Apply saved theme preference
  loadHistory();  // Load existing history from backend
}

// Start the application
init();
