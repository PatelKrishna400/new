/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Daily Spin Engine (Redesigned)
   • 6 Prize Segments: 💰 500, 💰 1,000, ⚡ Energy, 🔥 Boost, 🎁 Chest, ⭐ XP
   • Top pointer & TODAY'S BONUS tag
   • Idle floating motion (wheel-idle-motion)
   • Server/deterministic result spin deceleration
   • Result reveal: 🎉 YOU WON! with celebratory particles
   • Cooldown: Next spin: 23:41:12 (using timestamp)
═══════════════════════════════════════════════════════════ */

'use strict';

const SPIN_SECTORS = [
  { id: 'coins_500',   label: '💰 500',   icon: '💰', type: 'coins',  value: 500,  display: '💰 +500 COINS' },
  { id: 'coins_1000',  label: '💰 1,000', icon: '💰', type: 'coins',  value: 1000, display: '💰 +1,000 COINS' },
  { id: 'energy_150',  label: '⚡ Energy', icon: '⚡', type: 'energy', value: 150,  display: '⚡ +150 Energy' },
  { id: 'boost_2x',    label: '🔥 Boost',  icon: '🔥', type: 'boost',  value: 2,    display: '🔥 2× Tap Boost (10m)' },
  { id: 'chest_rnd',   label: '🎁 Chest',  icon: '🎁', type: 'chest',  value: 'epic', display: '🎁 Mystery Chest' },
  { id: 'xp_200',      label: '⭐ XP',     icon: '⭐', type: 'xp',     value: 200,  display: '⭐ +200 XP' },
];

let _currentWheelDeg = 0;
let _spinCooldownInterval = null;

function getSpinCooldownRemaining() {
  const lastTs = STATE.lastSpinTs || 0;
  const cooldownMs = 24 * 60 * 60 * 1000;
  return Math.max(0, cooldownMs - (Date.now() - lastTs));
}

function formatCooldownTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function openDailySpinModal() {
  const cdMs = getSpinCooldownRemaining();
  const canSpin = cdMs <= 0;
  const adReady = typeof AdManager !== 'undefined' ? AdManager.canShowRewardedAd() : true;

  showModal(`
    <div class="spin-modal-container">
      <div class="spin-header">
        <div class="spin-title">🎡 DAILY SPIN</div>
        <div class="spin-subtitle">Spin once every day.</div>
      </div>

      <div class="todays-bonus-tag">TODAY'S BONUS</div>

      <!-- Wheel Container -->
      <div class="spin-wheel-area">
        <div class="spin-pointer-top" id="spin-pointer-top">▼</div>
        
        <div class="spin-wheel-disc ${canSpin ? 'wheel-idle-motion' : ''}" id="spin-wheel-disc" style="transform: rotate(${_currentWheelDeg}deg)">
          <div class="wheel-center-cap">🎡</div>
          ${SPIN_SECTORS.map((sec, idx) => {
            const angle = idx * 60;
            return `
              <div class="wheel-sector-item" style="transform: rotate(${angle}deg)">
                <span class="wheel-sector-label">${sec.label}</span>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Actions / Cooldown -->
      <div class="spin-actions-area">
        ${canSpin ? `
          <button class="btn btn-gold btn-spin-action" id="btn-spin-now" onclick="runSpinWheel()">
            🎡 SPIN NOW
          </button>` : `
          <div class="spin-cooldown-card">
            <div class="spin-cooldown-lbl">Next spin:</div>
            <div class="spin-cooldown-val" id="spin-cooldown-timer">${formatCooldownTime(cdMs)}</div>
          </div>`
        }

        ${!canSpin && adReady ? `
          <button class="btn btn-outline btn-bonus-spin" onclick="runBonusSpinAd()">
            ✨ Extra Spin (Watch Ad)
          </button>` : ''}
      </div>
    </div>
  `);

  if (!canSpin) {
    _startSpinCooldownTimer();
  }
}

function _startSpinCooldownTimer() {
  if (_spinCooldownInterval) clearInterval(_spinCooldownInterval);
  _spinCooldownInterval = setInterval(() => {
    const elTimer = document.getElementById('spin-cooldown-timer');
    if (!elTimer) {
      clearInterval(_spinCooldownInterval);
      _spinCooldownInterval = null;
      return;
    }
    const cdMs = getSpinCooldownRemaining();
    if (cdMs <= 0) {
      clearInterval(_spinCooldownInterval);
      _spinCooldownInterval = null;
      openDailySpinModal();
      return;
    }
    elTimer.textContent = formatCooldownTime(cdMs);
  }, 1000);
}

async function runSpinWheel() {
  const btn = document.getElementById('btn-spin-now');
  if (btn) btn.disabled = true;

  const disc = document.getElementById('spin-wheel-disc');
  if (disc) disc.classList.remove('wheel-idle-motion');

  /* Server / deterministic result calculation */
  const winningIdx = Math.floor(Math.random() * SPIN_SECTORS.length);
  const selectedPrize = SPIN_SECTORS[winningIdx];

  const sectorAngle = 360 / SPIN_SECTORS.length;
  const targetSectorAngle = 360 - (winningIdx * sectorAngle + sectorAngle / 2);
  const totalRotation = 360 * 5 + targetSectorAngle;

  _currentWheelDeg = totalRotation;
  if (disc) disc.style.transform = `rotate(${totalRotation}deg)`;

  haptic('medium');

  /* Pointer tick feedback during deceleration */
  let tickCount = 0;
  const tickInterval = setInterval(() => {
    tickCount++;
    if (tickCount > 14) {
      clearInterval(tickInterval);
      return;
    }
    haptic('light');
  }, 220);

  setTimeout(async () => {
    clearInterval(tickInterval);
    STATE.lastSpinTs = Date.now();
    await persistUser({ lastSpinTs: STATE.lastSpinTs });
    
    if (typeof spawnCollectBurst === 'function') {
      spawnCollectBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
    
    _showSpinResultModal(selectedPrize);
  }, 4200);
}

async function runBonusSpinAd() {
  closeModal();
  if (typeof AdManager !== 'undefined') {
    const ok = await AdManager.showRewardedAd('spin_bonus', 0, 0);
    if (ok) {
      const selected = SPIN_SECTORS[Math.floor(Math.random() * SPIN_SECTORS.length)];
      _showSpinResultModal(selected);
    }
  }
}

function _showSpinResultModal(prize) {
  let rewardText = prize.display;
  if (prize.type === 'coins') {
    STATE.coins += prize.value;
    updateCoinUI();
  } else if (prize.type === 'energy') {
    restoreEnergy(prize.value);
    updateEnergyUI();
  } else if (prize.type === 'boost') {
    STATE.boostMultiplier = 2;
    STATE.boostExpiry = Date.now() + 10 * 60 * 1000;
  } else if (prize.type === 'xp') {
    STATE.xp += prize.value;
    updateXpUI();
  } else if (prize.type === 'chest') {
    if (typeof openChestModal === 'function') {
      openChestModal('epic');
      return;
    }
  }

  updateMissionProgress('spin', 1);
  SFX.levelUp();
  haptic('success');

  const adReady = typeof AdManager !== 'undefined' ? AdManager.canShowRewardedAd() : true;

  showModal(`
    <div class="spin-result-container">
      <div class="spin-result-won anim-streak-pop">🎉 YOU WON!</div>
      
      <div class="spin-reward-icon-wrap anim-reward-scale">
        <div class="spin-reward-icon">${prize.icon}</div>
      </div>

      <div class="spin-reward-amount anim-fadein">${rewardText}</div>

      <div class="spin-result-actions">
        <button class="btn btn-gold btn-block" onclick="closeModal()">
          COLLECT
        </button>

        ${(prize.type === 'coins' && adReady) ? `
          <button class="btn btn-outline btn-block btn-2x-ad" onclick="closeModal();_claimDoubleSpinReward(${prize.value})">
            ✨ BONUS REWARD <span class="ad-req-badge">(Watch Ad)</span>
          </button>` : ''}
      </div>
    </div>
  `);
}

async function _claimDoubleSpinReward(coinVal) {
  if (typeof AdManager !== 'undefined') {
    const ok = await AdManager.showRewardedAd('spin_double', coinVal, coinVal);
    if (ok) {
      STATE.coins += coinVal;
      updateCoinUI();
      SFX.reward();
      haptic('success');
      showToast(`✨ BONUS REWARD! +${fmt(coinVal)} Coins`, 'success');
      await persistUser({ coins: STATE.coins });
    }
  }
}
