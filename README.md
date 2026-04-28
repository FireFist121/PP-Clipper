# 🚀 AntyGravity — Twitch Clip Automation Bot

> **Free alternative to StreamSnip.com** — automatically download Twitch clips and serve them via Discord.

---

## ✨ Features

- `!clip <streamer>` — Fetch & download the latest clip from any Twitch streamer
- `!clip <url>` — Download a specific clip by Twitch URL
- `!stats` — See total clips downloaded, storage used, uptime
- `!help` — Full command list
- `!ping` — Check bot latency
- SQLite database — tracks all clips, streamers, servers
- Auto-organizes clips by streamer folder
- Caches clips locally (no re-download)

---

## 🛠 Setup

### Prerequisites
- [Node.js 18+](https://nodejs.org)
- [FFmpeg](https://ffmpeg.org/download.html) installed and on PATH
- A Discord Bot Token
- Twitch API credentials

### Step 1 — Discord Bot
1. Go to https://discord.com/developers/applications
2. Click **New Application** → name it `AntyGravity`
3. Go to **Bot** → click **Add Bot**
4. Under **Privileged Gateway Intents**, enable:
   - ✅ **Message Content Intent**
   - ✅ **Server Members Intent**
5. Copy your **Bot Token**
6. Go to **OAuth2 → URL Generator**, select `bot`, then permissions:
   - Send Messages, Embed Links, Attach Files, Read Message History
7. Use the generated URL to invite the bot to your server

### Step 2 — Twitch API
1. Go to https://dev.twitch.tv/console
2. Click **Register Your Application**
   - Name: `AntyGravity`
   - OAuth Redirect URL: `http://localhost`
   - Category: `Application Integration`
3. Copy your **Client ID** and generate a **Client Secret**

### Step 3 — Environment Variables
```bash
cp .env.example .env
```
Edit `.env` and fill in:
```
DISCORD_TOKEN=your_discord_bot_token
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

### Step 4 — Install & Run
```bash
npm install
npm run bot
```

---

## 📁 Project Structure

```
antygravity/
├── bot/
│   ├── index.js              # Bot entry point
│   ├── commands/
│   │   ├── clip.js           # !clip command
│   │   ├── help.js           # !help command
│   │   ├── ping.js           # !ping command
│   │   └── stats.js          # !stats command
│   └── utils/
│       ├── twitch.js         # Twitch API client
│       └── logger.js         # Winston logger
├── shared/
│   ├── db.js                 # SQLite database
│   └── storage.js            # File system manager
├── clips/                    # Auto-created on first run
│   ├── downloads/            # Clip MP4 files
│   ├── thumbnails/           # Clip thumbnails
│   └── temp/                 # Temp files
├── data/                     # SQLite database file
├── logs/                     # Log files
├── .env.example
├── package.json
└── README.md
```

---

## 🎮 Commands

| Command | Description |
|---|---|
| `!clip <streamer>` | Get latest clip from a Twitch streamer |
| `!clip <url>` | Download a specific clip by URL |
| `!help` | Show all commands |
| `!ping` | Check bot latency |
| `!stats` | Bot statistics |

---

## 🗺 Roadmap

- [x] Phase 1: Discord Bot + Twitch API
- [ ] Phase 2: Auto-monitoring (cron jobs)
- [ ] Phase 3: Smart notifications
- [ ] Phase 4: Web Dashboard (React + Express)
- [ ] Phase 5: Video editing (FFmpeg trim/merge)

---

## 💰 Hosting Options

| Option | Cost | Best For |
|---|---|---|
| Local PC | Free | Development |
| Replit | Free tier | Testing |
| Railway.app | ~$5/mo | Small usage |
| DigitalOcean | ~$6/mo | Production |

---

*Made with ❤️ for AntyGravity 🚀 — "Free, Powerful, Yours"*
