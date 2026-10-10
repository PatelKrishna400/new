/**
 * ADMIN AUTHENTICATION & ACCESS CONTROL (admin/js/auth.js)
 * Master PIN Authentication, Session Gate, & Security Handlers (Master Password: 0911)
 */

const ADMIN_SESSION_KEY = 'ENERGY_TAP_ADMIN_AUTH_USER';

function getCurrentAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
window.getCurrentAdminSession = getCurrentAdminSession;

function checkAdminAuthGate() {
  const session = getCurrentAdminSession();
  const gate = document.getElementById('adminLoginGate');
  const badge = document.getElementById('currentAdminBadge');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const nameEl = document.getElementById('headerAdminName');
  const roleEl = document.getElementById('headerAdminRole');
  const avatarEl = document.getElementById('headerAdminAvatar');

  if (session && session.username) {
    if (gate) gate.style.display = 'none';
    if (badge) badge.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'flex';

    if (nameEl) nameEl.textContent = session.name || session.username;
    if (roleEl) roleEl.textContent = session.role || 'Admin';
    if (avatarEl) avatarEl.textContent = (session.username || 'A')[0].toUpperCase();
  } else {
    if (gate) gate.style.display = 'flex';
    if (badge) badge.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}
window.checkAdminAuthGate = checkAdminAuthGate;

function handleAdminLogin(event) {
  if (event) event.preventDefault();
  const userInput = document.getElementById('loginAdminUser');
  const passInput = document.getElementById('loginAdminPass');
  const errBox = document.getElementById('loginErrorMessage');
  const submitBtn = document.getElementById('adminLoginSubmitBtn');

  const userVal = userInput ? userInput.value.trim().toLowerCase() : '';
  const passVal = passInput ? passInput.value.trim() : '';

  if (!userVal || !passVal) {
    showLoginError('Please enter both username and password.');
    return;
  }

  if (errBox) errBox.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span><span>Verifying Access...</span>';
  }

  const admins = (window.adminState && window.adminState.adminUsers && window.adminState.adminUsers.length > 0)
    ? window.adminState.adminUsers
    : [
        { username: 'admin', password: '0911', role: 'Super Admin', name: 'Master Admin' },
        { username: 'admin2', password: '0911', role: 'Operations Admin', name: 'Secondary Admin' }
      ];

  const match = (passVal === '0911')
    ? (admins.find(a => a.username.toLowerCase() === userVal) || { username: userVal || 'admin', role: 'Super Admin', name: 'Master Admin' })
    : admins.find(a => a.username.toLowerCase() === userVal && a.password === passVal);

  setTimeout(() => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>🔓</span><span>Authenticate & Enter</span>';
    }

    if (match) {
      const authObj = {
        username: match.username,
        name: match.name || match.username,
        role: match.role || 'Admin',
        loginTime: Date.now()
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(authObj));
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(authObj));
      checkAdminAuthGate();
    } else {
      showLoginError('Invalid password. Admin password is: 0911');
    }
  }, 300);
}
window.handleAdminLogin = handleAdminLogin;

function showLoginError(msg) {
  const errBox = document.getElementById('loginErrorMessage');
  if (errBox) {
    errBox.textContent = msg;
    errBox.style.display = 'block';
  } else {
    alert(msg);
  }
}
window.showLoginError = showLoginError;

function logoutAdmin() {
  if (confirm('Are you sure you want to log out from the Admin Panel?')) {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    checkAdminAuthGate();
    const userInput = document.getElementById('loginAdminUser');
    const passInput = document.getElementById('loginAdminPass');
    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';
  }
}
window.logoutAdmin = logoutAdmin;

window.addEventListener('adminUsersUpdated', () => {
  const session = getCurrentAdminSession();
  if (session && window.adminState && window.adminState.adminUsers) {
    const stillExists = window.adminState.adminUsers.some(a => a.username.toLowerCase() === session.username.toLowerCase());
    if (!stillExists) {
      alert('Your admin account has been removed. You will now be signed out.');
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      checkAdminAuthGate();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuthGate();
});
