# 📡 Wi-Fi Network Health Monitor Dashboard


The **Wi-Fi Network Health Monitor** is a web application that takes 5 network parameters as input, runs a rule-based scoring engine, and produces:

- A **Network Health Score** (0–100)
- A **Status Label** (Excellent / Good / Fair / Poor)
- **Detected Issues** in the network
- **Smart Troubleshooting Recommendations**
- **Visual Analytics** with charts
- **Analysis History** stored locally in JSON

This project simulates the core functionality of real-world WLAN quality monitoring tools used by companies like Aprecomm, Ekahau, and NetSpot.

---

## 📁 Project Structure

```
wifi-network-health-monitor/
│
├── server.js                  # Main Express server (entry point)
├── package.json               # Node.js project config & dependencies
│
├── routes/
│   ├── networkRoutes.js       # API routes for network analysis
│   └── historyRoutes.js       # API routes for history
│
├── controllers/
│   ├── networkController.js   # Business logic: scoring, issues, recommendations
│   └── historyController.js   # JSON file read/write logic
│
├── public/                    # Static files served to browser
│   ├── index.html             # Main dashboard HTML page
│   ├── css/
│   │   └── style.css          # Premium dark/light mode CSS
│   └── js/
│       └── main.js            # Frontend JavaScript (API calls, charts, UI)
│
├── data/
│   └── history.json           # JSON file storing analysis history
│
├── README.md                  # This file
└── INTERVIEW_GUIDE.md         # Interview preparation guide
```

---

## ⚙️ Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (comes with Node.js)

### Step 1: Navigate to the project folder
```bash
cd wifi-network-health-monitor
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Start the server
```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

### Step 4: Open the app
Open your browser and go to:
```
http://localhost:3000
```

---

## 🚀 Features

| Feature | Description |
|--------|-------------|
| 📊 Network Analysis | Rule-based health scoring engine |
| 🎯 Health Score | 0–100 score calculated from 4 metrics |
| ⚠️ Issue Detection | Automatically identifies network problems |
| 💡 Recommendations | Context-aware troubleshooting suggestions |
| 📈 Analytics Cards | Visual cards for each metric |
| 📉 Charts | Radar & Donut charts via Chart.js |
| 🕐 History | Last 10 analyses stored in JSON |
| 🌓 Dark/Light Mode | Toggle between themes |
| 📄 PDF Export | Download full report as PDF (jsPDF) |
| 🧪 Sample Data | One-click realistic test data |
| 📱 Responsive | Works on mobile, tablet, desktop |

---

## 🧮 Health Score Logic

The total score (0–100) is the sum of 4 parameters, each worth **25 points maximum**:

### Signal Strength
| Range | Rating | Points |
|-------|--------|--------|
| 90–100% | Excellent | 25 |
| 70–89% | Good | 20 |
| 50–69% | Fair | 12 |
| Below 50% | Poor | 0 |

### Latency
| Range | Rating | Points |
|-------|--------|--------|
| 0–30 ms | Excellent | 25 |
| 31–80 ms | Good | 20 |
| 81–150 ms | Fair | 10 |
| Above 150 ms | Poor | 0 |

### Packet Loss
| Range | Rating | Points |
|-------|--------|--------|
| 0–1% | Excellent | 25 |
| 2–5% | Fair | 12 |
| Above 5% | Poor | 0 |

### Connected Devices
| Range | Rating | Points |
|-------|--------|--------|
| 1–10 | Good | 25 |
| 11–20 | Moderate | 12 |
| Above 20 | Heavy Load | 0 |

### Overall Status
| Total Score | Status |
|------------|--------|
| 85–100 | ✅ Excellent |
| 65–84 | 👍 Good |
| 40–64 | ⚠️ Fair |
| 0–39 | 🔴 Poor |

---

## 🛠️ Technologies Used

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | Web framework for the backend server |
| **HTML5** | Structure of the web page |
| **CSS3** | Styling with dark/light theme support |
| **Vanilla JavaScript** | Frontend logic and API calls |
| **JSON file** | Simple data storage (no database needed) |
| **Chart.js** | Radar & Donut charts |
| **jsPDF** | PDF report generation |
| **Font Awesome** | Icons |
| **Google Fonts** | Typography (Inter, Outfit) |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/network/analyze` | Submit network data for analysis |
| `GET` | `/api/history` | Retrieve analysis history |
| `DELETE` | `/api/history/clear` | Clear all history |

### Example API Request
```bash
curl -X POST http://localhost:3000/api/network/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "signalStrength": 75,
    "latency": 45,
    "packetLoss": 2,
    "connectedDevices": 8,
    "routerUptime": 48
  }'
```

### Example API Response
```json
{
  "success": true,
  "data": {
    "healthScore": 69,
    "status": "Good",
    "issues": ["⚠️ Moderate packet loss detected (above 1%)."],
    "recommendations": ["🔄 Restart the router to reduce packet loss."],
    "scores": {
      "signal": { "score": 20, "rating": "Good", "max": 25 },
      "latency": { "score": 20, "rating": "Good", "max": 25 },
      "packetLoss": { "score": 12, "rating": "Fair", "max": 25 },
      "devices": { "score": 25, "rating": "Good", "max": 25 }
    }
  }
}
```

<img width="1907" height="900" alt="image" src="https://github.com/user-attachments/assets/1cf919fe-00f0-4d84-bddb-30740eb745ec" />
<img width="1887" height="902" alt="image" src="https://github.com/user-attachments/assets/2f0da789-af09-40f3-9bb0-f9f8a25f8f66" />
