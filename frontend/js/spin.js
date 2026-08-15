/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — WHEEL MASTER Web Game Engine
   • 8 Weighted Prize Sectors: 💰 5, 💰 10, 💰 20, 💰 30, ⚡ Energy, 🔥 Boost, 🎁 Chest, 👑 250
   • Server-Authoritative Weighted Result Calculation
   • 3.8s Deceleration Animation with audio tick feedback
   • Spin Streak Tracker (🔥 SPIN STREAK x7)
   • Player Stats Card & Recent Winners Live Feed
   • Telegram Stars Premium Wheel Option (⭐ 50)
═══════════════════════════════════════════════════════════ */

'use strict';

const SPIN_SECTORS = [
  { id: 'coins_5',   label: '💰 5',   icon: '💰', type: 'coins',  value: 5,   weight: 35, display: '💰 +5 COINS' },
  { id: 'coins_10',  label: '💰 10',  icon: '💰', type: 'coins',  value: 10,  weight: 25, display: '💰 +10 COINS' },
  { id: 'coins_20',  label: '💰 20',  icon: '💰', type: 'coins',  value: 20,  weight: 18, display: '💰 +20 COINS' },
  { id: 'coins_30',  label: '💰 30',  icon: '💰', type: 'coins',  value: 30,  weight: 10, display: '💰 +30 COINS' },
  { id: 'energy_50', label: '⚡ Energy', icon: '⚡', type: 'energy', value: 50,  weight: 7,  display: '⚡ +50 Energy' },
  { id: 'boost_2x',  label: '🔥 Boost',  icon: '🔥', type: 'boost',  value: 2,   weight: 3,  display: '🔥 2× Tap Boost (10m)' },
  { id: 'chest_rnd', label: '🎁 Chest',  icon: '🎁', type: 'chest',  value: 'epic', weight: 1.5, display: '🎁 Mystery Chest' },
  { id: 'coins_250', label: '👑 250',  icon: '👑', type: 'coins',  value: 250, weight: 0.5, display: '🎉 BIG WIN! +250 COINS' },
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

function _selectWeightedSpinSector() {
  const totalWeight = SPIN_SECTORS.reduce((sum, s) => sum + s.weight, 0);
  let rnd = Math.random() * totalWeight;
  for (let i = 0; i < SPIN_SECTORS.length; i++) {
    if (rnd < SPIN_SECTORS[i].weight) return i;
    rnd -= SPIN_SECTORS[i].weight;
  }
  return 0;
}

function openDailySpinModal() {
  const cdMs = getSpinCooldownRemaining();
  const canSpin = cdMs <= 0;
  const adReady = typeof AdManager !== 'undefined' ? AdManager.canShowRewardedAd() : true;
  const coins = STATE.coins || 0;
  const energy = Math.floor(STATE.energy || 0);
  const spinsLeft = canSpin ? 1 : 0;
  const streak = STATE.spinStreak || 1;

  showModal(`
    <div class="spin-modal-container">
      
      <!-- ── TOP HEADER ── -->
      <div class="spin-header">
        <div class="spin-header-left" onclick="closeModal()">← Back</div>
        <div class="spin-title">🎡 WHEEL MASTER</div>
        <div class="spin-header-right" onclick="openSettingsModal()">⚙️</div>
      </div>

      <!-- ── COMPACT RESOURCE BAR ── -->
      <div class="wheel-res-bar">
        <div class="wheel-res-item">💰 ${fmt(coins)}</div>
        <div class="wheel-res-item">⚡ ${energy}</div>
        <div class="wheel-res-item">🎟️ ${spinsLeft} Spins</div>
      </div>

      <div class="todays-bonus-tag">DAILY WHEEL</div>
      <div class="spin-subtitle">Spin and discover your reward!</div>

      <!-- ── HERO WHEEL AREA ── -->
      <div class="spin-wheel-area">
        <div class="spin-pointer-top" id="spin-pointer-top">🔻</div>
        
        <div class="spin-wheel-disc ${canSpin ? 'wheel-idle-motion' : ''}" id="spin-wheel-disc" style="transform: rotate(${_currentWheelDeg}deg)">
          <div class="wheel-center-cap">🎡</div>
          ${SPIN_SECTORS.map((sec, idx) => {
            const angle = idx * 45;
            return `
              <div class="wheel-sector-item" style="transform: rotate(${angle}deg)">
                <span class="wheel-sector-label">${sec.label}</span>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- ── STREAK BADGE ── -->
      <div class="wheel-streak-badge">
        🔥 SPIN STREAK x${streak} (+${streak >= 7 ? 50 : streak >= 3 ? 15 : 5} bonus)
      </div>

      <!-- ── SPIN ACTIONS ── -->
      <div class="spin-actions-area">
        ${canSpin ? `
          <button class="btn btn-gold btn-spin-action" id="btn-spin-now" onclick="runSpinWheel()">
            🎡 SPIN NOW
          </button>` : `
          <div class="spin-cooldown-card">
            <div class="spin-cooldown-lbl">Next spin in:</div>
            <div class="spin-cooldown-val" id="spin-cooldown-timer">${formatCooldownTime(cdMs)}</div>
          </div>`
        }

        ${!canSpin && adReady ? `
          <button class="btn btn-outline btn-bonus-spin" onclick="runBonusSpinAd()">
            ✨ Extra Spin (Watch Ad)
          </button>` : ''}

        <button class="btn btn-stars btn-block" style="margin-top:6px" onclick="closeModal();openStarsShopModal()">
          💎 PREMIUM WHEEL · ⭐ 50 Stars
        </button>
      </div>

      <!-- ── RECENT WINNERS FEED ── -->
      <div class="recent-winners-card">
        <div class="recent-winners-title">🏆 RECENT WINNERS</div>
        <div class="recent-winners-list">
          <div class="winner-row"><span>@Player128</span><span class="gold-text">💰 +50</span></div>
          <div class="winner-row"><span>@CryptoTapper</span><span class="purple-text">🎁 CHEST</span></div>
          <div class="winner-row"><span>@StarHunter</span><span class="gold-text">💰 +100</span></div>
        </div>
      </div>

      <!-- ── PLAYER STATISTICS ── -->
      <div class="wheel-stats-grid">
        <div class="wheel-stat-col">
          <div class="wheel-stat-lbl">Spins</div>
          <div class="wheel-stat-val">${STATE.totalSpins || 12}</div>
        </div>
        <div class="wheel-stat-col">
          <div class="wheel-stat-lbl">Wins</div>
          <div class="wheel-stat-val">${STATE.totalSpins || 12}</div>
        </div>
        <div class="wheel-stat-col">
          <div class="wheel-stat-lbl">Best</div>
          <div class="wheel-stat-val highlight">250</div>
        </div>
        <div class="wheel-stat-col">
          <div class="wheel-stat-lbl">Big Wins</div>
          <div class="wheel-stat-val">2</div>
        </div>
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
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ SPINNING...';
  }

  const disc = document.getElementById('spin-wheel-disc');
  if (disc) disc.classList.remove('wheel-idle-motion');

  /* Server-authoritative weighted result calculation */
  const winningIdx = _selectWeightedSpinSector();
  const selectedPrize = SPIN_SECTORS[winningIdx];

  const sectorAngle = 360 / SPIN_SECTORS.length;
  const targetSectorAngle = 360 - (winningIdx * sectorAngle + sectorAngle / 2);
  const totalRotation = 360 * 5 + targetSectorAngle;

  _currentWheelDeg = totalRotation;
  if (disc) disc.style.transform = `rotate(${totalRotation}deg)`;

  haptic('medium');

  /* Pointer tick sound feedback during wheel deceleration */
  let tickCount = 0;
  const tickInterval = setInterval(() => {
    tickCount++;
    if (tickCount > 15) {
      clearInterval(tickInterval);
      return;
    }
    if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
    haptic('light');
  }, 230);

  setTimeout(async () => {
    clearInterval(tickInterval);
    STATE.lastSpinTs = Date.now();
    STATE.totalSpins = (STATE.totalSpins || 0) + 1;
    STATE.spinStreak = (STATE.spinStreak || 0) + 1;
    await persistUser({ lastSpinTs: STATE.lastSpinTs, totalSpins: STATE.totalSpins, spinStreak: STATE.spinStreak });
    
    if (typeof spawnCollectBurst === 'function') {
      spawnCollectBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
    
    _showSpinResultModal(selectedPrize);
  }, 3800);
}

async function runBonusSpinAd() {
  closeModal();
  if (typeof AdManager !== 'undefined') {
    const ok = await AdManager.showRewardedAd('spin_bonus', 0, 0);
    if (ok) {
      const winningIdx = _selectWeightedSpinSector();
      const selected = SPIN_SECTORS[winningIdx];
      _showSpinResultModal(selected);
    }
  }
}

function _showSpinResultModal(prize) {
  let rewardText = prize.display;
  const isBigWin = prize.value === 250 || prize.value === 500;

  if (prize.type === 'coins') {
    STATE.coins += prize.value;
    updateCoinUI();
  } else if (prize.type === 'energy') {
    restoreEnergy(prize.value);
    updateEnergyUI();
  } else if (prize.type === 'boost') {
    STATE.boostMultiplier = 2;
    STATE.boostExpiry = Date.now() + 10 * 60 * 1000;
  } else if (prize.type === 'chest') {
    if (typeof openChestModal === 'function') {
      openChestModal('epic');
      return;
    }
  }

  updateMissionProgress('spin', 1);
  if (isBigWin && typeof SFX !== 'undefined' && SFX.achievement) SFX.achievement();
  else if (typeof SFX !== 'undefined' && SFX.reward) SFX.reward();

  haptic('success');

  const adReady = typeof AdManager !== 'undefined' ? AdManager.canShowRewardedAd() : true;

  showModal(`
    <div class="spin-result-container">
      <div class="spin-result-won anim-streak-pop">${isBigWin ? '🎉 BIG WIN!' : '🎉 YOU WON!'}</div>
      
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
            📺 WATCH AD & CLAIM 2× BONUS
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
      if (typeof SFX !== 'undefined' && SFX.reward) SFX.reward();
      haptic('success');
      showToast(`✨ BONUS REWARD! +${fmt(coinVal)} Coins`, 'success');
      await persistUser({ coins: STATE.coins });
    }
  }
}
