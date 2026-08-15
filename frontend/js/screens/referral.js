/* ═══════════════════════════════════
   TAP EMPIRE — Social Referral Screen
   • Header: 👥 INVITE FRIENDS
   • Hero Tagline: INVITE • EARN • GROW
   • Stats: Friends invited (24), Active (18), Rewards (125,000 Coins)
   • Referral Link Card: https://t.me/yourbot?start=XXXX
   • Action Buttons: [ 📋 COPY ], [ 📤 SHARE ]
   • How It Works: 4 illustrated/emoji steps
   • Copy Toast Animation + Share Action
═══════════════════════════════════ */

'use strict';

function renderReferralScreen() {
  const el = document.getElementById('screen-referral');
  if (!el) return;

  const uid = STATE.tgUser?.id || '12345678';
  const botUsername = CONFIG?.BOT_USERNAME || 'tap_empire_bot';
  const refLink = `https://t.me/${botUsername}?start=ref_${uid}`;

  const friendsInvited = STATE.referralCount || 24;
  const activeFriends = STATE.activeReferrals || 18;
  const totalEarned = STATE.referralRewards || 125000;

  el.innerHTML = `
    <div class="screen-scroll ref-page-container">
      
      <!-- ── HEADER ── -->
      <div class="ref-header-wrap">
        <div class="ref-title">👥 INVITE FRIENDS</div>
      </div>

      <!-- ── HERO STAT CARD ── -->
      <div class="ref-hero-card">
        <div class="ref-hero-tagline">INVITE &bull; EARN &bull; GROW</div>
        
        <div class="ref-stats-grid">
          <div class="ref-stat-box">
            <div class="ref-stat-val">${fmt(friendsInvited)}</div>
            <div class="ref-stat-lbl">Friends invited</div>
          </div>

          <div class="ref-stat-box">
            <div class="ref-stat-val text-gold">${fmt(activeFriends)}</div>
            <div class="ref-stat-lbl">Active</div>
          </div>

          <div class="ref-stat-box">
            <div class="ref-stat-val text-green">${fmt(totalEarned)}</div>
            <div class="ref-stat-lbl">Rewards</div>
          </div>
        </div>
      </div>

      <!-- ── REFERRAL LINK CARD ── -->
      <div class="ref-link-card">
        <div class="ref-card-title">YOUR UNIQUE INVITE LINK</div>
        
        <div class="ref-input-box">
          <input type="text" class="ref-link-input" id="ref-link-input" value="${refLink}" readonly />
        </div>

        <div class="ref-btn-row">
          <button class="btn btn-gold btn-ref-action" id="btn-copy-ref" onclick="copyReferralLink('${refLink}')">
            📋 COPY
          </button>
          
          <button class="btn btn-primary btn-ref-action" onclick="shareReferralLink('${refLink}')">
            📤 SHARE
          </button>
        </div>
      </div>

      <!-- ── HOW IT WORKS SECTION ── -->
      <div class="ref-how-card">
        <div class="section-title" style="margin-bottom:14px">HOW IT WORKS</div>

        <div class="ref-steps-list">
          
          <div class="ref-step-item">
            <div class="ref-step-num">1️⃣</div>
            <div class="ref-step-text">
              <div class="ref-step-title">Invite a friend</div>
              <div class="ref-step-desc">Share your unique referral link with friends.</div>
            </div>
          </div>

          <div class="ref-step-item">
            <div class="ref-step-num">2️⃣</div>
            <div class="ref-step-text">
              <div class="ref-step-title">Friend joins</div>
              <div class="ref-step-desc">Your friend opens Telegram & starts playing.</div>
            </div>
          </div>

          <div class="ref-step-item">
            <div class="ref-step-num">3️⃣</div>
            <div class="ref-step-text">
              <div class="ref-step-title">Friend becomes active</div>
              <div class="ref-step-desc">Friend reaches Level 2 and completes daily taps.</div>
            </div>
          </div>

          <div class="ref-step-item" style="border-bottom:none">
            <div class="ref-step-num">4️⃣</div>
            <div class="ref-step-text">
              <div class="ref-step-title">You receive eligible reward</div>
              <div class="ref-step-desc">Instant bonus coins & XP added to your balance!</div>
            </div>
          </div>

        </div>
      </div>

      <!-- ── TRUSTWORTHY FOOTER ── -->
      <div class="ref-footer-note">
        🔒 Anti-Cheat Enabled: Self-referrals and automated bots are automatically excluded from rewards.
      </div>

    </div>`;
}

function copyReferralLink(link) {
  const btn = document.getElementById('btn-copy-ref');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(link);
  } else {
    const input = document.getElementById('ref-link-input');
    if (input) {
      input.select();
      document.execCommand('copy');
    }
  }

  if (btn) {
    btn.innerHTML = '✓ COPIED';
    btn.classList.add('btn-copied-state');
    setTimeout(() => {
      if (btn) {
        btn.innerHTML = '📋 COPY';
        btn.classList.remove('btn-copied-state');
      }
    }, 2000);
  }

  SFX.success();
  haptic('success');
  showToast('✓ Referral link copied to clipboard!', 'success');
}

function shareReferralLink(link) {
  const text = encodeURIComponent('🚀 Join me on Tap Empire! Tap, collect coins, and win daily rewards!');
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;

  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }

  haptic('impact');
}
