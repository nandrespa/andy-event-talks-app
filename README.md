# 📊 BigQuery Release Notes Viewer

A sleek, dark-mode web application built with **Python Flask** that pulls the latest [Google BigQuery release notes](https://cloud.google.com/bigquery/docs/release-notes) from the official Atom feed and presents them in a beautiful, filterable card interface — with one-click sharing to **X (Twitter)**.

---

## ✨ Features

- 🔄 **Live feed** — fetches the official BigQuery Atom XML feed on demand
- 🃏 **Card grid** — each release date rendered as a glassmorphism card
- 🏷️ **Type badges** — Features, Announcements, Issues, Deprecations, and more, each colour-coded automatically
- 🔍 **Filter bar** — filter cards by update type without a page reload
- 📋 **Summary pills** — at-a-glance count of total releases, features, and announcements
- ↻ **Refresh button** — animated spinner while fetching; timestamps the last update
- 📖 **Read more / collapse** — long entries collapse cleanly with a toggle
- 𝕏 **Tweet modal** — pre-fills a tweet with the entry snippet + link + hashtags, enforces Twitter's 280-char limit, and opens Twitter's compose window in a popup
- ⚠️ **Error & empty states** — graceful UI for network failures or filtered-out results

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     YOUR BROWSER                        │
│          HTML + CSS + JavaScript  (Client Side)         │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP  (localhost:5000)
┌────────────────────────▼────────────────────────────────┐
│                 FLASK SERVER  (app.py)                  │
│              Python  (Server Side)                      │
└────────────────────────┬────────────────────────────────┘
                         │  HTTPS
┌────────────────────────▼────────────────────────────────┐
│          Google Cloud — Atom XML Feed                   │
│  docs.cloud.google.com/feeds/bigquery-release-notes.xml │
└─────────────────────────────────────────────────────────┘
```

The browser never calls Google Cloud directly. Flask proxies the request server-to-server (bypassing CORS), parses the raw XML, and returns clean JSON to the client.

---

## 📁 Project Structure

```
bq-releases-notes/
│
├── app.py                  # Flask app — routes, XML fetch, JSON API
├── requirements.txt        # Python dependencies (Flask only)
│
├── templates/
│   └── index.html          # Page shell served by Flask/Jinja2
│
└── static/
    ├── css/
    │   └── style.css       # Full design system — dark mode, animations, modal
    └── js/
        └── app.js          # All client logic — fetch, render, filter, tweet
```

---

## 🚀 Quickstart

### Prerequisites

- Python 3.9+
- pip

### 1. Clone the repo

```bash
git clone https://github.com/nandrespa/andy-event-talks-app.git
cd andy-event-talks-app
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the app

```bash
python app.py
```

Open your browser at **[http://127.0.0.1:5000](http://127.0.0.1:5000)** 🎉

---

## 🔌 API Reference

### `GET /`
Returns the main HTML page shell.

---

### `GET /api/release-notes`
Fetches, parses, and returns all BigQuery release note entries as JSON.

**Success response `200 OK`:**
```json
{
  "status": "ok",
  "entries": [
    {
      "id":      "tag:google.com,2016:bigquery-release-notes#June_17_2026",
      "title":   "June 17, 2026",
      "updated": "2026-06-17T00:00:00-07:00",
      "link":    "https://docs.cloud.google.com/bigquery/docs/release-notes#June_17_2026",
      "content": "<h3>Feature</h3><p>You can enable autonomous embedding...</p>"
    }
  ]
}
```

**Error response `500 Internal Server Error`:**
```json
{
  "status": "error",
  "message": "urlopen error [Errno -2] Name or service not known"
}
```

---

## 𝕏 Tweet Flow

No Twitter/X API credentials are required. The app uses Twitter's public **Web Intent** URL:

```
https://twitter.com/intent/tweet?text=<encoded-tweet>
```

When you click **"Post on X"**, a 560x420 Twitter compose popup opens with the pre-filled text. You must be logged in to Twitter to complete the post.

---

## 🛠️ Built With

| Layer | Technology |
|-------|-----------|
| Backend | [Python](https://python.org) + [Flask](https://flask.palletsprojects.com/) |
| XML parsing | Python stdlib `xml.etree.ElementTree` |
| HTTP fetch | Python stdlib `urllib.request` |
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES2017+) |
| Fonts | [Google Fonts — Inter & Space Grotesk](https://fonts.google.com/) |
| Tweet sharing | [Twitter Web Intents](https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/guides/web-intent) |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
