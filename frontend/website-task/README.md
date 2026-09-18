# Energy Tap - Website Task & Financial Education System

A complete, production-ready **Website Task & 10-Chapter Financial Education System** built for the **Energy Tap Game** project. The system includes a 10-chapter educational financial blog, 50 configurable direct-link advertisement placements with interactive timers, atomic reward claims in **Blue Coins**, a dedicated website task dashboard with roadmap tracking, and a comprehensive real-time Admin Panel.

---

## 1. File Structure

```text
d:\project\websit task\
├── index.html                 # Main landing portal & gateway
├── blog.html                  # 10-Chapter financial curriculum with 5 ads per page
├── task.html                  # Dedicated Website Task dashboard & roadmap
├── admin.html                 # Real-time Admin Control Panel
│
├── css/
│   ├── style.css              # Core design tokens, dark cyber theme, shared UI
│   ├── blog.css               # Blog reader UI, progress bar, ad cards, timer animations
│   ├── task.css               # Task progression dashboard, metric cards, roadmap
│   └── admin.css              # Admin layout, statistics grid, data tables, modals
│
├── js/
│   ├── firebase.js            # Firebase RTDB, Auth, Atomic Transactions & presence
│   ├── website.js             # Shared portal controller, session bridge & toast engine
│   ├── blog.js                # 10-Chapter content engine, timers & claim verification
│   ├── task.js                # Task overview controller, roadmap & progress calculations
│   └── admin.js               # Admin authentication, real-time dashboard & live CRUD
│
├── database.rules.json        # Production Firebase Realtime Database Security Rules
└── README.md                  # System architecture, documentation, and setup guide
```

---

## 2. Firebase Database Schema

### A. Website Tasks & Ads Configuration (`/websiteTasks/financialBlog`)
```json
{
  "enabled": true,
  "title": "Financial Knowledge Task",
  "totalPages": 10,
  "rewardPerPage": 100,
  "rewardPerAd": 50,
  "completionReward": 500,
  "pages": {
    "page1": { "order": 1, "title": "Introduction to Personal Finance", "subtitle": "...", "reward": 100, "enabled": true },
    "page2": { "order": 2, "title": "Budgeting Frameworks & Expenses", "subtitle": "...", "reward": 100, "enabled": true }
  },
  "ads": {
    "page1_ad1": {
      "id": "page1_ad1",
      "pageId": "page1",
      "position": 1,
      "title": "Apex Financial Terminal [Slot #1]",
      "description": "Access real-time market intelligence...",
      "url": "https://finance.yahoo.com",
      "reward": 50,
      "timer": 15,
      "enabled": true,
      "dailyLimit": 1
    }
  }
}
```

### B. User Progress & Synchronization (`/users/{uid}` & `/players/{uid}`)
```json
{
  "users": {
    "USER_ID": {
      "blueCoins": 650,
      "websiteTask": {
        "currentPage": 2,
        "completedPages": {
          "page1": 1789733000000
        },
        "completedAds": {
          "page1_ad1": 1789733050000,
          "page1_ad2": 1789733090000
        },
        "claimedRewards": {
          "page1": 100,
          "page1_ad1": 50,
          "page1_ad2": 50
        },
        "totalEarned": 200,
        "completed": false,
        "finalRewardClaimed": false,
        "lastActivity": 1789733090000
      }
    }
  },
  "players": {
    "USER_ID": {
      "player": {
        "blueCoins": 650
      },
      "tasks": {
        "claimedWebsite": {
          "financial_blog_page1": true,
          "financial_blog_page1_ad1": true
        }
      }
    }
  }
}
```

---

## 3. Financial Education Curriculum (10 Pages)

1. **Chapter 1: Introduction to Personal Finance & Financial Health**
   - Defining assets vs liabilities, calculating net worth, three pillars of financial hygiene, and overcoming present bias.
2. **Chapter 2: Budgeting Frameworks & Expense Optimization**
   - The 50/30/20 framework, zero-based accounting, auditing subscription creep, and the 72-hour delay rule.
3. **Chapter 3: Saving Strategies & Emergency Liquidity Reserves**
   - 3-6 month emergency fund, High-Yield Savings Accounts (HYSA), sinking funds for irregular expenses, and pay-yourself-first automation.
4. **Chapter 4: Bank Accounts, APY & The Mechanics of Interest**
   - The compounding formula, APY vs APR distinctions, real vs nominal returns, and the Rule of 72.
5. **Chapter 5: Understanding Loans, Credit Scores & Debt Elimination**
   - FICO scoring breakdown, good vs destructive debt, Debt Avalanche vs Debt Snowball, and avoiding minimum payment traps.
6. **Chapter 6: Investing Fundamentals & The Compounding Engine**
   - Why investing is mandatory to beat inflation, the risk-return spectrum, Dollar-Cost Averaging (DCA), and the time-horizon advantage.
7. **Chapter 7: Stocks, Mutual Funds, ETFs & Index Investing**
   - Fractional business ownership, SPIVA empirical research, minimizing expense ratios, and ETF vs mutual fund mechanics.
8. **Chapter 8: Risk Management, Asset Allocation & Diversification**
   - Modern Portfolio Theory, age-based asset allocation (accumulation vs consolidation vs distribution), and annual rebalancing.
9. **Chapter 9: Long-Term Wealth Planning & Retirement Architecture**
   - Pre-tax vs Roth tax advantage, the 4% Safe Withdrawal Rule (Trinity Study), Sequence of Returns Risk (SRR), and beneficiary designations.
10. **Chapter 10: Common Financial Pitfalls & The Master Wealth Blueprint**
    - The top 5 wealth destroyers, actionable 6-step financial order of operations, and final completion celebration.

---

## 4. Advertisement & Verification Engine

- **5 Placements per Page** (50 total across 10 chapters).
- When a user clicks a sponsor ad:
  1. Opens direct link destination in a new tab.
  2. Initiates countdown timer with visible seconds countdown and glow animation.
  3. Once remaining duration reaches zero, button transforms into `🎁 Claim Reward`.
  4. Reward is credited atomically via Firebase transaction to prevent race conditions and duplicate claims.
  5. Ad card state immediately updates to `✅ Reward Claimed`.

---

## 5. Security & Admin Authorization

- **Firebase Security Rules (`database.rules.json`)**:
  - `websiteTasks`: Read-only for general public; write permissions strictly restricted to authenticated administrators.
  - `users`: Authenticated user can only write to their own UID record; schema validated for required fields.
  - `activity_log`: Appends audit trails for every reward transaction.
- **Admin Authentication**:
  - Protected with passkey authentication (`admin7080` or custom environment key) stored in protected browser session.
  - Admin controls immediately broadcast real-time edits to Firebase RTDB without requiring code changes or redeployment.

---

## 6. How to Run Locally

You can run this project with any local HTTP server:

```powershell
# Using Python
python -m http.server 8080

# Or using Node
npx serve . -p 8080
```

Open your browser at:
- **Landing Portal**: `http://localhost:8080/index.html`
- **Website Task**: `http://localhost:8080/task.html`
- **Financial Blog**: `http://localhost:8080/blog.html`
- **Admin Panel**: `http://localhost:8080/admin.html` (Passkey: `admin7080`)
