/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Native Telegram Mini App Settings Engine
   • Header: ⚙️ SETTINGS
   • Sections: 🎮 GAME, 🔔 NOTIFICATIONS, 🎨 APPEARANCE, ℹ️ ABOUT
   • Native Telegram Theme Variable integration with fallbacks
   • Interactive toggles with slide animation & haptic feedback
   • Action Button: [ 🚪 CLOSE ]
═══════════════════════════════════════════════════════════ */

'use strict';

const SETTINGS_STATE = {
  sound: true,
  vibe: true,
  graphics: 'AUTO',
  notifDaily: true,
  notifEvents: true,
  animQuality: 'AUTO',
  perfMode: 'AUTO'
};

function openSettingsModal() {
  const s = SETTINGS_STATE;

  showModal(`
    <div class="settings-modal-container">
      
      <!-- Header -->
      <div class="settings-header">
        <div class="settings-title">⚙️ SETTINGS</div>
      </div>

      <!-- 🎮 GAME SECTION -->
      <div class="settings-section">
        <div class="settings-sec-title">🎮 GAME</div>

        <div class="settings-row">
          <span class="settings-label">Sound</span>
          <button class="settings-toggle-btn ${s.sound ? 'on' : 'off'}" onclick="toggleSettingItem(event, 'sound')">
            <span class="toggle-slider"></span>
            <span class="toggle-lbl">${s.sound ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div class="settings-row">
          <span class="settings-label">Vibration</span>
          <button class="settings-toggle-btn ${s.vibe ? 'on' : 'off'}" onclick="toggleSettingItem(event, 'vibe')">
            <span class="toggle-slider"></span>
            <span class="toggle-lbl">${s.vibe ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div class="settings-row">
          <span class="settings-label">Graphics</span>
          <button class="settings-chip-btn" onclick="cycleSettingChoice(event, 'graphics', ['AUTO', 'LOW', 'MED', 'HIGH'])">
            ${s.graphics}
          </button>
        </div>
      </div>

      <!-- 🔔 NOTIFICATIONS SECTION -->
      <div class="settings-section">
        <div class="settings-sec-title">🔔 NOTIFICATIONS</div>

        <div class="settings-row">
          <span class="settings-label">Daily Bonus</span>
          <button class="settings-toggle-btn ${s.notifDaily ? 'on' : 'off'}" onclick="toggleSettingItem(event, 'notifDaily')">
            <span class="toggle-slider"></span>
            <span class="toggle-lbl">${s.notifDaily ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div class="settings-row">
          <span class="settings-label">Events</span>
          <button class="settings-toggle-btn ${s.notifEvents ? 'on' : 'off'}" onclick="toggleSettingItem(event, 'notifEvents')">
            <span class="toggle-slider"></span>
            <span class="toggle-lbl">${s.notifEvents ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      <!-- 🎨 APPEARANCE SECTION -->
      <div class="settings-section">
        <div class="settings-sec-title">🎨 APPEARANCE</div>

        <div class="settings-row">
          <span class="settings-label">Animation Quality</span>
          <button class="settings-chip-btn" onclick="cycleSettingChoice(event, 'animQuality', ['AUTO', 'HIGH', 'LOW'])">
            ${s.animQuality}
          </button>
        </div>

        <div class="settings-row">
          <span class="settings-label">Performance Mode</span>
          <button class="settings-chip-btn" onclick="cycleSettingChoice(event, 'perfMode', ['AUTO', 'BATTERY', 'PERF'])">
            ${s.perfMode}
          </button>
        </div>
      </div>

      <!-- ℹ️ ABOUT SECTION -->
      <div class="settings-section">
        <div class="settings-sec-title">ℹ️ ABOUT</div>

        <div class="settings-row">
          <span class="settings-label">Version</span>
          <span class="settings-value-text">v1.0.0</span>
        </div>

        <div class="settings-links-row">
          <span class="settings-link" onclick="openExternalLink('https://t.me/YOUR_BOT_TERMS')">Terms</span>
          <span class="link-dot">&bull;</span>
          <span class="settings-link" onclick="openExternalLink('https://t.me/YOUR_BOT_PRIVACY')">Privacy</span>
          <span class="link-dot">&bull;</span>
          <span class="settings-link" onclick="openExternalLink('https://t.me/YOUR_SUPPORT_CHANNEL')">Support</span>
        </div>
      </div>

      <!-- 🚪 CLOSE BUTTON -->
      <button class="btn btn-settings-close" onclick="closeModal()">
        🚪 CLOSE
      </button>

    </div>
  `);
}

function toggleSettingItem(e, key) {
  const btn = e ? e.currentTarget : null;
  SETTINGS_STATE[key] = !SETTINGS_STATE[key];
  const isVal = SETTINGS_STATE[key];

  if (key === 'sound') {
    if (typeof soundEnabled !== 'undefined') window.soundEnabled = isVal;
  }

  if (btn) {
    btn.classList.add('anim-toggle-slide');
    if (isVal) {
      btn.classList.remove('off');
      btn.classList.add('on');
    } else {
      btn.classList.remove('on');
      btn.classList.add('off');
    }
    const lbl = btn.querySelector('.toggle-lbl');
    if (lbl) lbl.textContent = isVal ? 'ON' : 'OFF';

    setTimeout(() => btn.classList.remove('anim-toggle-slide'), 250);
  }

  haptic('selection');
  showToast(`${key} ${isVal ? 'enabled' : 'disabled'}`, 'default', 1400);
}

function cycleSettingChoice(e, key, options) {
  const btn = e ? e.currentTarget : null;
  const currIdx = options.indexOf(SETTINGS_STATE[key]);
  const nextIdx = (currIdx + 1) % options.length;
  SETTINGS_STATE[key] = options[nextIdx];

  if (btn) {
    btn.textContent = SETTINGS_STATE[key];
    btn.classList.add('anim-chip-pop');
    setTimeout(() => btn.classList.remove('anim-chip-pop'), 200);
  }

  haptic('selection');
  showToast(`${key}: ${SETTINGS_STATE[key]}`, 'default', 1400);
}
