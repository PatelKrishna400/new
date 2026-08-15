/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Combo System v2 (updated)
   • Uses .combo-box wrapper matching CSS
   • Visual-only countdown — zero DB writes
   • RAF-driven timer bar
═══════════════════════════════════════════════════════════ */

'use strict';

let _comboRafId = null;

function incrementCombo() {
  STATE.comboCount++;
  if (STATE.comboCount > STATE.bestCombo) STATE.bestCombo = STATE.comboCount;

  const resetMs = STATE.economy.comboResetMs || 2000;
  STATE.comboExpiry = Date.now() + resetMs;

  clearTimeout(STATE.comboTimer);
  STATE.comboTimer = setTimeout(() => {
    STATE.comboCount = 0;
    updateComboUI();
  }, resetMs);

  updateComboUI();

  if (STATE.comboCount > 0 && STATE.comboCount % 10 === 0) SFX.combo();
}

function getComboMultiplier() {
  const thresholds = STATE.economy.comboThresholds || [5, 10, 20, 50];
  const multipliers = STATE.economy.comboMultipliers || [2, 3, 5, 10];
  let mult = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (STATE.comboCount >= thresholds[i]) { mult = multipliers[i]; break; }
  }
  return mult;
}

/** Dynamic tap limit boost tied to active combo streak */
function getComboTapLimitBonus() {
  const combo = STATE.comboCount || 0;
  if (combo >= 50) return 30; // +30 Taps/sec limit
  if (combo >= 20) return 20; // +20 Taps/sec limit
  if (combo >= 10) return 10; // +10 Taps/sec limit
  if (combo >= 5)  return 5;  // +5 Taps/sec limit
  return 0;
}

function updateComboUI() {
  const area = document.getElementById('combo-area');
  if (!area) return;

  const mult = getComboMultiplier();
  const limitBonus = getComboTapLimitBonus();

  if (STATE.comboCount > 0 && mult > 1) {
    area.innerHTML = `
      <div class="combo-box">
        <span class="combo-badge">
          COMBO ×${mult}
          <span class="combo-mult-sub">(${STATE.comboCount})</span>
          ${limitBonus > 0 ? `<span class="combo-limit-sub">+${limitBonus} Tap/s Limit</span>` : ''}
        </span>
        <div class="combo-timer-bar">
          <div class="combo-timer-fill" id="combo-fill"></div>
        </div>
      </div>`;
    _startComboRaf();
  } else if (STATE.comboCount > 0) {
    area.innerHTML = `
      <span style="font-size:11px;color:var(--muted);font-weight:700;letter-spacing:0.5px">
        ${STATE.comboCount} taps ${limitBonus > 0 ? `(+${limitBonus} Tap/s Limit)` : '— keep going!'}
      </span>`;
    _stopComboRaf();
  } else {
    area.innerHTML = '';
    _stopComboRaf();
  }
}

function _startComboRaf() {
  if (_comboRafId) return;
  _tickComboBar();
}

function _stopComboRaf() {
  if (_comboRafId) cancelAnimationFrame(_comboRafId);
  _comboRafId = null;
}

function _tickComboBar() {
  const fill = document.getElementById('combo-fill');
  if (!fill) { _comboRafId = null; return; }

  const resetMs = STATE.economy.comboResetMs || 2000;
  const pct = Math.max(0, ((STATE.comboExpiry - Date.now()) / resetMs) * 100);
  fill.style.width = pct.toFixed(1) + '%';

  _comboRafId = pct > 0 ? requestAnimationFrame(_tickComboBar) : null;
}
