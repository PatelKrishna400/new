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
