/* ==========================================================================
   WEBSITE TASK SYSTEM - PORTAL CONTROLLER & SESSION ACCESS GUARD
   js/website.js
   ========================================================================== */

class WebsiteApp {
  constructor() {
    this.toastContainer = null;
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.ensureToastContainer();
      this.enforceTaskAccessGuard();
      this.updateHeaderUserInfo();
      this.bindFirebaseEvents();
    });
  }

  // Security Guard: Prevents direct URL bypass of verification form
  enforceTaskAccessGuard() {
    const path = window.location.pathname.toLowerCase();
    const isProtectedPage = path.endsWith('task.html') || path.endsWith('blog.html');

    if (isProtectedPage) {
      // Check verified session ticket
      const hasVerifiedSession = window.firebaseService ? window.firebaseService.isSessionVerified() : false;
      
      // Also allow admin bypass if in verified admin session
      const isAdminSession = sessionStorage.getItem('WEBSITE_TASK_ADMIN_AUTH') === 'true';

      if (!hasVerifiedSession && !isAdminSession) {
        console.warn('Unauthorized task access attempt. Redirecting to verification form.');
        sessionStorage.setItem('WEBSITE_TASK_REDIRECT_NOTICE', 'Please enter your User Code and Task Code to access the task.');
        window.location.href = 'index.html';
      }
    }
  }

  ensureToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    this.toastContainer = container;

    // Check for redirect notices
    const notice = sessionStorage.getItem('WEBSITE_TASK_REDIRECT_NOTICE');
    if (notice) {
      sessionStorage.removeItem('WEBSITE_TASK_REDIRECT_NOTICE');
      setTimeout(() => this.showToast(notice, 'info'), 400);
    }
  }

  updateHeaderUserInfo() {
    const userTag = document.getElementById('navUserId');
    const blueCoinsVal = document.getElementById('navBlueCoins');
    const statusDot = document.getElementById('navStatusDot');

    if (window.firebaseService) {
      const uid = window.firebaseService.userId;
      const userCode = window.firebaseService.userCode;

      if (userTag) {
        if (userCode) {
          userTag.innerText = userCode;
        } else if (uid) {
          const shortUid = uid.length > 10 ? uid.substring(0, 6) + '...' + uid.slice(-4) : uid;
          userTag.innerText = shortUid;
        }
      }

      if (blueCoinsVal) {
        const bal = window.firebaseService.userBalance.blueCoins || 0;
        blueCoinsVal.innerText = bal.toLocaleString();
      }

      if (statusDot) {
        statusDot.className = 'status-dot' + (window.firebaseService.isOnline ? '' : ' connecting');
      }
    }
  }

  bindFirebaseEvents() {
    window.addEventListener('userAuthReady', () => this.updateHeaderUserInfo());
    window.addEventListener('userBalanceUpdated', () => this.updateHeaderUserInfo());
    window.addEventListener('firebaseStatusChanged', () => this.updateHeaderUserInfo());
  }

  showToast(message, type = 'info') {
    this.ensureToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${icon}</span>
      <span style="flex: 1;">${message}</span>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3800);
  }
}

// Global App Instance
window.websiteApp = new WebsiteApp();
