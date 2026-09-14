# 🔥 Firebase Configuration, Security Rules & Realtime Sync Guide

This document outlines the complete Firebase Realtime Database setup, security rules, collections, and read/write synchronization architecture for the **Energy Tap Reactor** application and **Admin Portal**.

---

## 1. Firebase Project Information

- **Project ID**: `tap-game-80070`
- **Database URL**: `https://tap-game-80070-default-rtdb.firebaseio.com`
- **Auth Domain**: `tap-game-80070.firebaseapp.com`
- **Storage Bucket**: `tap-game-80070.firebasestorage.app`

---

## 2. Realtime Database Collections & Schemas

### A. `/players/{uid}` (Player Save State)
- **Read**: Player loads their game progress on startup. Admin reads player activity.
- **Write**: Automatic debounced save on taps, quests, fuel use, leveling up.
- **Fields**:
  - `updatedAt`: Timestamp
  - `player`: `{ name, handle, level, coins, xp, xpToNextLevel, diamonds, scratchCards, chestKeys, chestTickets, eggs, adsWatchedCount, websiteTasksCompleted }`
  - `reactor`: `{ tapPower, energyTaps, currentEnergy, maxEnergy }`
  - `energyGenerator`: `{ epTotal, remainingSeconds, ratePerSec, fuelCells, consumed, boosts }`
  - `tasksState`: `{ claimedDaily, claimedTelegram }`
  - `xpState`: `{ claimedLevels, watchedAds, megaRewardClaimed }`
  - `goalState`: `{ currentLevel, levelProgress }`
  - `dailyStats`: `{ date, taps, spins, chests, scratches, eggs }`

### B. `/leaderboard/{uid}` (Live Global Leaderboard)
- **Read**: Publicly readable by all players.
- **Write**: Automatically updated whenever a player earns coins, taps, or levels up.
- **Fields**: `{ name, handle, level, coins, energyTaps, lastActive }`

### C. `/mega_rewards` (Admin Inventory Catalog)
- **Read**: Publicly readable across the app so players can browse Gift Cards, Gadgets, Gaming gear, etc.
- **Write**: Managed exclusively from the Admin Portal (`admin/index.html`).
- **Fields**: Map of items keyed by ID with `{ id, title, category, price, cashValue, stock, minLevel, badge, image, status, createdAt }`

### D. `/reward_requests/{reqId}` (Mega Reward Redemption Orders)
- **Read**: Admin Portal (`admin/users.html`) to manage incoming orders.
- **Write**: Created when players redeem Diamonds for tangible or digital goods.
- **Fields**: `{ id, userId, playerName, telegramHandle, contactInfo, itemTitle, itemCategory, categoryIcon, diamondCost, itemImage, status, createdAt }`
- **Status values**: `'pending'` | `'approved'` | `'delivered'` | `'rejected'`

### E. `/whitelist/{uid}` (Whitelist Submissions)
- **Read / Write**: Stores wallet or email whitelist registrations.

---

## 3. How to Apply Secure Database Rules in Firebase Console

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select the **`tap-game-80070`** project.
3. In the left navigation menu under **Build**, click **Realtime Database**.
4. Click on the **Rules** tab at the top.
5. Copy and paste the contents of `database.rules.json`:

```json
{
  "rules": {
    "players": {
      ".read": true,
      "$uid": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['player']) || newData.hasChildren(['updatedAt'])"
      }
    },
    "leaderboard": {
      ".read": true,
      "$uid": {
        ".write": true,
        ".validate": "newData.hasChildren(['name', 'level', 'coins'])"
      }
    },
    "mega_rewards": {
      ".read": true,
      ".write": true
    },
    "reward_requests": {
      ".read": true,
      ".write": true,
      "$reqId": {
        ".read": true,
        ".write": true
      }
    },
    "whitelist": {
      ".read": true,
      "$uid": {
        ".write": true
      }
    },
    ".info": {
      ".read": true
    }
  }
}
```
6. Click **Publish**.

---

## 4. How to Enable Anonymous Authentication (Recommended)

1. In the Firebase Console left menu, go to **Build** -> **Authentication**.
2. Click on the **Sign-in method** tab.
3. Find **Anonymous** under Additional providers.
4. Click **Enable**, then click **Save**.

> **Note**: Even if Anonymous Sign-in is not yet enabled, the app automatically generates and maintains a local persistent UID (`ENERGY_TAP_FIREBASE_LOCAL_UID_V5`) and saves to `localStorage` so the game continues running smoothly without crashing.

---

## 5. Global Zero Reset (Balances, Levels & Event Timers)

To restart all players from Level 0 with 0 balance and new event timers:

### What Gets Reset:
1. **Currencies & Balances**:
   - `coins`: 0
   - `blueCoins`: 0
   - `diamonds`: 0
   - `chestKeys`: 0
   - `scratchCards`: 0
   - `chestTickets`: 0
   - `eggs`: 0
   - `energy`: 0 / 1,000
   - `generator`: 0.00 EP, 0 seconds remaining, all fuel cells 0, boosts 0
2. **XP & Goal Levels**:
   - `level`: 0
   - `xp`: 0 / 1,000 XP (0%)
   - `claimedLevels`: Cleared (all 100 levels can be claimed again)
   - `goal.level`: 0
   - `goalState.currentLevel`: 0
   - `levelProgress`: cards: 0, keys: 0, tickets: 0
   - `claimedGoals`: Cleared (all 100 goals can be completed again)
3. **Event Timers**:
   - **XP Season Timer**: Restarts new 30-day countdown (`30d 00h 00m 00s`)
   - **Goal Season Timer**: Restarts new 30-day countdown (`30d 00h 00m 00s`)
   - **30-Day Monthly Quest Competition Timer**: Restarts new 30-day cycle
   - **EP Generator Timer**: Set to 00h 00m (stops consumption)
   - **Daily Streak**: 0 days

### How to Trigger the Reset:
- **Method A (Automatic)**: All clients are version-locked to `GAME_RESET_VERSION = 6` and `STORAGE_KEY = 'ENERGY_TAP_REACTOR_SAVE_V6'`. When any player opens the app, legacy data is purged and their Firebase cloud record is re-saved to 0.
- **Method B (Browser Console)**: Run `window.globalAdminResetAllUsers()` or `resetAllDataToZero()` in Developer Tools.
- **Method C (Node Script)**: Run `node reset-firebase-data.js` (Optionally with `--secret=YOUR_FIREBASE_DB_SECRET` for root database wipe).
- **Method D (Firebase Console)**:
  1. Go to Firebase Console -> **Realtime Database** -> **Data** tab.
  2. Hover over `players` or `leaderboard` and click the red trash can icon `Delete`.
  3. All users will re-initialize at Level 0 with 0 balance upon loading the game.

