# Arambh — Personal Productivity Dashboard

<div align="center">

![Arambh Logo](favicon.png)

**A beautiful, fully offline personal productivity dashboard**  
built with pure HTML, CSS & JavaScript — no frameworks, no dependencies.

[![Made by Pradeep Kumar](https://img.shields.io/badge/Made%20by-Pradeep%20Kumar-7C6FFF?style=for-the-badge&logo=heart)](https://github.com/prdip01)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

---

## ✨ Overview

**Arambh** (आरम्भ — meaning *"The Beginning"* in Hindi) is a feature-rich, multi-page personal dashboard designed to help you track your **studies**, **finances**, **tasks**, and **projects** — all in one place, without any internet connection or account needed.

> 🔒 All your data stays **100% on your device** via `localStorage`. Nothing is sent to any server.

---

## 🖥️ Live Preview

Simply open `index.html` in any modern browser — no build step, no server required.

```bash
# Clone the repository
git clone https://github.com/prdip01/Aarabh.git
cd Aarabh

# Open in browser (macOS)
open index.html

# Open in browser (Windows)
start index.html

# Open in browser (Linux)
xdg-open index.html
```

---

## 📋 Features

### 🏠 Dashboard Home (`index.html`)
| Feature | Description |
|---|---|
| **4 Summary Ring Cards** | Animated SVG rings for Study, Money, Reminders & Projects — click to navigate |
| **Monthly Calendar** | Full calendar with 🔺 red triangle markers on reminder due dates |
| **Quick Links** | Add/edit/delete external links directly from the dashboard |
| **Study Widget** | Today's study hours with subject breakdown |
| **Budget Widget** | Animated donut ring showing monthly spend vs budget |
| **Upcoming Tasks** | Top 5 tasks sorted by due date with overdue highlighting |

### 📚 Study Goal (`study.html`)
| Feature | Description |
|---|---|
| **Session Logger** | Log date, subject, hours, topics & notes |
| **Subject Manager** | Add up to 6 subjects with custom colors |
| **30-Day Heatmap** | Visual grid — 🟩 studied, 🟥 missed, ⬜ no data — filterable by subject |
| **Bar Chart** | Total hours per subject with color-coded bars |
| **Weekly Trend Chart** | Canvas-rendered 7-day bar + line chart |
| **PDF Export** | Generate and print a 30-day study report |

### 💰 Money Goal (`money.html`)
| Feature | Description |
|---|---|
| **Budget Ring** | Large animated donut — 🟢 Green / 🟡 Yellow / 🔴 Red based on spend % |
| **Expense Logger** | Amount, date, category (6 types), optional note |
| **Inline Table Editing** | Edit or delete transactions without leaving the page |
| **Category Chart** | Horizontal bars showing spend distribution by category |
| **Month Filter** | Browse expenses by any past month |
| **Summary Cards** | Total spent, remaining, top category, daily average |

### 🔔 Reminders & Tasks (`reminders.html`)
| Feature | Description |
|---|---|
| **Task Creation** | Title, due date, priority (Low/Medium/High), description |
| **3 View Modes** | Upcoming (by date) / By Priority (grouped) / Completed archive |
| **Priority Coding** | Red/Yellow/Green left border on cards |
| **Overdue Detection** | Automatic red badge for past-due tasks |
| **Calendar Sync** | Due dates auto-appear as 🔺 on Dashboard calendar |
| **Sidebar Badge** | Pending count shown live in navigation |

### 🚀 Project Goal (`projects.html`)
| Feature | Description |
|---|---|
| **Project Cards** | Grid with SVG progress ring per project |
| **Status Cycling** | Click badge to cycle: ⏳ Not Started → 🔄 In Progress → ✅ Completed |
| **Progress Slider** | Live drag-to-update 0–100% progress per project |
| **External Links** | 🌐 Deploy link + 🐙 GitHub repository (open in new tab) |
| **CRUD** | Add, Edit, Duplicate, Delete any project |
| **Filters** | All / In Progress / Completed / Not Started |

### ⚙️ Settings (`settings.html`)
| Feature | Description |
|---|---|
| **Subject Manager** | Add, rename, recolor, delete study subjects |
| **Budget Config** | Set default monthly budget |
| **Quick Links Manager** | Add/remove/edit links shown on the dashboard |
| **Theme Toggle** | Dark 🌙 / Light ☀️ mode with persistence |
| **Accent Color** | 12 preset colors + custom color picker |
| **Data Export** | Download full backup as `.json` |
| **Data Import** | Restore from a `.json` backup file |
| **Clear All Data** | Full reset with confirmation dialog |

---

## 📁 Project Structure

```
Aarabh/
├── index.html          # Dashboard Home
├── study.html          # Study Goal page
├── money.html          # Money Goal page
├── reminders.html      # Reminders & Tasks page
├── projects.html       # Project Goal page
├── settings.html       # Settings page
├── favicon.png         # App icon (bookmark & tab)
├── README.md           # This file
│
├── css/
│   └── main.css        # Global design system, CSS variables, responsive layout
│
└── js/
    ├── store.js        # Unified localStorage data layer (all CRUD helpers)
    ├── components.js   # Sidebar, topbar, ring SVG, toast, modal, utilities
    ├── dashboard.js    # Dashboard home logic
    ├── study.js        # Study goal logic + canvas chart
    ├── money.js        # Money goal logic
    ├── reminders.js    # Reminders logic
    ├── projects.js     # Projects logic
    └── settings.js     # Settings logic
```

---

## 🎨 Design System

Built on a token-based CSS system in `css/main.css`:

```css
/* Core accent color — auto-updates entire UI */
--accent: #7C6FFF;

/* 8px spacing grid */
--space-1: 4px;  --space-2: 8px;  --space-4: 16px;  --space-8: 32px;

/* Dark / Light theme tokens */
--bg-primary  --bg-card  --text-primary  --text-muted  --border
```

**Visual Highlights:**
- 🌙 Dark mode by default with toggle to light mode
- 🎨 12 accent color presets + custom color picker
- 💫 Animated SVG progress rings throughout the app
- 📊 Canvas-rendered weekly chart on the Study page
- ✨ Smooth page fade-in (0.25s) on every load
- 📱 Fully responsive — hamburger menu on mobile

---

## 💾 Data Architecture

All data is stored in a single `localStorage` key: `arambh_v1`

```json
{
  "settings": {
    "theme": "dark",
    "accentColor": "#7C6FFF",
    "budget": 10000,
    "subjects": [{ "id": "s1", "name": "Mathematics", "color": "#7C6FFF" }],
    "quickLinks": [{ "id": "ql1", "name": "ChatGPT", "url": "https://chatgpt.com", "icon": "🤖" }]
  },
  "study": {
    "sessions": [{ "id": "abc", "date": "2026-06-01", "subjectId": "s1", "hours": 2, "topics": "Algebra" }]
  },
  "money": {
    "budget": 10000,
    "expenses": [{ "id": "xyz", "amount": 250, "date": "2026-06-01", "category": "Food", "note": "Lunch" }]
  },
  "reminders": {
    "tasks": [{ "id": "t1", "title": "Submit Assignment", "dueDate": "2026-06-05", "priority": "high", "completed": false }]
  },
  "projects": {
    "list": [{ "id": "p1", "name": "Portfolio Site", "status": "In Progress", "progress": 65 }]
  }
}
```

---

## 🚀 Getting Started

### Option 1 — Open Directly
```bash
open index.html       # macOS
start index.html      # Windows
xdg-open index.html   # Linux
```

### Option 2 — Local Server (recommended)
```bash
# Python 3
python3 -m http.server 5500
# Open: http://localhost:5500

# Node.js
npx serve .
# Open: http://localhost:3000
```

### Option 3 — VS Code Live Server
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**

---

## 🌐 Browser Support

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full support |
| Firefox 88+ | ✅ Full support |
| Safari 14+ | ✅ Full support |
| Edge 90+ | ✅ Full support |

> **Note:** JavaScript must be enabled. localStorage is unavailable in private/incognito mode on some browsers.

---

## 🤝 Contributing

```bash
# Fork the repo, then:
git clone https://github.com/prdip01/Aarabh.git
cd Aarabh

# Create a feature branch
git checkout -b feature/my-new-feature

# Make your changes, then commit
git add .
git commit -m "feat: add my new feature"

# Push and open a Pull Request
git push origin feature/my-new-feature
```

**Ideas for contributions:**
- [ ] PWA support (manifest + service worker)
- [ ] Pomodoro timer on Study page
- [ ] Recurring tasks in Reminders
- [ ] CSV export for expenses
- [ ] Multi-device sync via Supabase

---

## 📄 License

MIT License — Copyright (c) 2026 Pradeep Kumar

---

<div align="center">

**Made with ❤️ by Pradeep Kumar**

*"Arambh — Because every great journey needs a great beginning."*

⭐ Star this repo if you found it useful!

</div>
