/* ==========================================================================
   WEBSITE TASK DASHBOARD CONTROLLER - js/task.js
   Real-time progress, 10-page roadmap, ad task completion metrics
   ========================================================================== */

class TaskDashboardController {
  constructor() {
    this.init();
  }

  init() {
    window.addEventListener('userProgressUpdated', () => this.renderDashboard());
    window.addEventListener('websiteTaskConfigUpdated', () => this.renderDashboard());
    window.addEventListener('userBalanceUpdated', () => this.renderDashboard());

    document.addEventListener('DOMContentLoaded', () => {
      this.renderDashboard();
    });
  }

  renderDashboard() {
    const userProgress = window.firebaseService ? window.firebaseService.userProgress : {
      currentPage: 1,
      completedPages: {},
      completedAds: {},
      claimedRewards: {},
      totalEarned: 0,
      completed: false,
      finalRewardClaimed: false
    };

    const taskConfig = window.firebaseService ? window.firebaseService.taskConfig : null;
    const pagesConfig = (taskConfig && taskConfig.pages) ? taskConfig.pages : (window.DEFAULT_FINANCIAL_BLOG_CONFIG ? window.DEFAULT_FINANCIAL_BLOG_CONFIG.pages : {});
    const adsConfig = (taskConfig && taskConfig.ads) ? taskConfig.ads : (window.DEFAULT_FINANCIAL_BLOG_CONFIG ? window.DEFAULT_FINANCIAL_BLOG_CONFIG.ads : {});

    // 1. Calculate Page Progress
    const completedPagesCount = Object.keys(userProgress.completedPages || {}).length;
    const totalPages = 10;
    const pagePercent = Math.min(100, Math.round((completedPagesCount / totalPages) * 100));

    // 2. Calculate Ad Task Progress
    const completedAdsCount = Object.keys(userProgress.completedAds || {}).length;
    const totalAds = Object.keys(adsConfig).length || 50;

    // 3. Calculate Available and Earned Rewards
    // Page rewards: 10 * 100 = 1000
    // Ad rewards: 50 * 50 = 2500
    // Final reward: 500
    // Total potential pool = 4000 Blue Coins
    let totalPotentialRewards = 0;
    Object.keys(pagesConfig).forEach(k => totalPotentialRewards += (pagesConfig[k].reward || 100));
    Object.keys(adsConfig).forEach(k => totalPotentialRewards += (adsConfig[k].reward || 50));
    totalPotentialRewards += (taskConfig && taskConfig.completionReward) ? taskConfig.completionReward : 500;

    const totalEarned = userProgress.totalEarned || 0;
    const availableReward = Math.max(0, totalPotentialRewards - totalEarned);

    // Update DOM Elements
    const pagesCountEl = document.getElementById('statCompletedPages');
    const adsCountEl = document.getElementById('statCompletedAds');
    const availableRewardEl = document.getElementById('statAvailableReward');
    const earnedRewardEl = document.getElementById('statTotalEarned');
    const progressFillEl = document.getElementById('mainProgressBarFill');
    const progressPercentEl = document.getElementById('mainProgressPercent');
    const summaryPagesEl = document.getElementById('progressSummaryPages');
    const summaryAdsEl = document.getElementById('progressSummaryAds');

    if (pagesCountEl) pagesCountEl.innerText = `${completedPagesCount} / ${totalPages} Pages`;
    if (adsCountEl) adsCountEl.innerText = `${completedAdsCount} / ${totalAds} Completed`;
    if (availableRewardEl) availableRewardEl.innerText = `${availableReward.toLocaleString()} Blue Coins`;
    if (earnedRewardEl) earnedRewardEl.innerText = `${totalEarned.toLocaleString()} Blue Coins`;

    if (progressFillEl) progressFillEl.style.width = `${pagePercent}%`;
    if (progressPercentEl) progressPercentEl.innerText = `${pagePercent}% Completed`;
    if (summaryPagesEl) summaryPagesEl.innerText = `Curriculum Progress: ${completedPagesCount} of ${totalPages} Chapters`;
    if (summaryAdsEl) summaryAdsEl.innerText = `Sponsor Tasks: ${completedAdsCount} of ${totalAds} Finished`;

    // Render 10-Page Roadmap
    this.renderRoadmap(userProgress, pagesConfig);

    // Render Final Completion Banner if 10/10 complete
    const finalBanner = document.getElementById('finalCompletionBanner');
    if (finalBanner) {
      if (completedPagesCount >= 10 || userProgress.completed) {
        finalBanner.style.display = 'block';
      } else {
        finalBanner.style.display = 'none';
      }
    }
  }

  renderRoadmap(userProgress, pagesConfig) {
    const container = document.getElementById('taskRoadmapContainer');
    if (!container) return;
    container.innerHTML = '';

    const unlockedMax = Math.max(userProgress.currentPage || 1, 1);

    for (let i = 1; i <= 10; i++) {
      const pageKey = `page${i}`;
      const page = pagesConfig[pageKey] || { title: `Financial Education Chapter ${i}`, reward: 100 };
      const isDone = !!(userProgress.completedPages && userProgress.completedPages[pageKey]);
      const isCurrent = (i === unlockedMax) && !isDone;
      const isLocked = i > unlockedMax && !isDone;

      let cardClass = 'roadmap-card';
      if (isDone) cardClass += ' completed';
      else if (isCurrent) cardClass += ' active';
      else if (isLocked) cardClass += ' locked';

      let statusBadge = '';
      let actionBtn = '';

      if (isDone) {
        statusBadge = '<span class="status-tag done">✓ Completed</span>';
        actionBtn = `<a href="blog.html#page${i}" class="btn btn-outline btn-sm">📖 Review Chapter</a>`;
      } else if (isCurrent) {
        statusBadge = '<span class="status-tag current">🚀 In Progress</span>';
        actionBtn = `<a href="blog.html#page${i}" class="btn btn-primary btn-sm">⚡ Continue Task →</a>`;
      } else {
        statusBadge = '<span class="status-tag locked">🔒 Locked</span>';
        actionBtn = `<button class="btn btn-outline btn-sm" disabled>Locked</button>`;
      }

      const card = document.createElement('div');
      card.className = cardClass;
      card.innerHTML = `
        <div class="roadmap-left">
          <div class="roadmap-page-number">${i}</div>
          <div class="roadmap-details">
            <h4>${page.title}</h4>
            <div class="roadmap-meta">
              <span>Chapter Reward: <strong>+${page.reward || 100} Blue Coins</strong></span>
              <span>•</span>
              <span>5 Direct-Link Sponsor Tasks</span>
            </div>
          </div>
        </div>
        <div class="roadmap-right">
          ${statusBadge}
          ${actionBtn}
        </div>
      `;
      container.appendChild(card);
    }
  }
}

// Global Instance
window.taskDashboardController = new TaskDashboardController();
