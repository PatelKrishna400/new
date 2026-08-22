# 🤖 Telegram Mini App Setup Guide for XP Quest

This guide walks you through connecting your **XP Quest Mobile Web Page** as a **Telegram Web Mini App** that users can open directly inside Telegram chats.

---

## 🛠️ Step 1: Create Your Bot on Telegram

1. Open Telegram and search for **`@BotFather`**.
2. Start a chat with BotFather and send the command:
   ```text
   /newbot
   ```
3. Enter a **Name** for your bot (e.g. `XP Quest RPG Bot`).
4. Enter a **Username** ending in `bot` (e.g. `XpQuestRpg_bot`).
5. BotFather will provide your **API BOT TOKEN** (e.g. `789012345:AAFx...`). Keep this safe!

---

## 🌐 Step 2: Make Your Web App Accessible via HTTPS

Telegram Mini Apps **require an HTTPS URL**.

### Option A: Local Testing with ngrok (Free & Fast)
If running locally:
1. Install ngrok or run:
   ```bash
   npx ngrok http 8080
   ```
2. Copy the generated HTTPS URL (e.g. `https://a1b2-34-56-78.ngrok-free.app`).

### Option B: Free Cloud Hosting (Vercel / Netlify / GitHub Pages)
Upload `index.html`, `styles.css`, and `app.js` to Vercel or Netlify to get a permanent HTTPS link.

---

## 📱 Step 3: Attach the Mini App Menu Button in BotFather

To add the Mini App button inside Telegram chats:

1. In Telegram, send `/mybots` to **`@BotFather`**.
2. Select your bot -> **Bot Settings** -> **Menu Button** -> **Configure Menu Button**.
3. Send the URL of your Web App (e.g. `https://your-domain.ngrok-free.app`).
4. Enter the button text: **`Play XP Quest 🎮`**.

---

## 🚀 Step 4: Run the Telegram Bot Server

Run the `bot.js` script with your credentials:

### On Windows PowerShell:
```powershell
$env:TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_FROM_BOTFATHER"
$env:MINI_APP_URL="https://your-domain.ngrok-free.app"
node bot.js
```

### On Linux / macOS:
```bash
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_FROM_BOTFATHER" MINI_APP_URL="https://your-domain.ngrok-free.app" node bot.js
```

---

## 🎮 How Users Experience Your Telegram Mini App

1. Users search for your Bot or click its link in Telegram.
2. When they send `/start`, the Bot responds with a welcome card and a **"🎮 OPEN XP QUEST MINI APP"** button.
3. Clicking the button opens your mobile XP leveling game **inside Telegram**!
4. The Mini App automatically loads their Telegram First/Last Name, triggers Telegram native haptic vibrations when completing quests or striking bosses, and locks into Telegram full-screen view!
