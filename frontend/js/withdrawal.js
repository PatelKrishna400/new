/* ═══════════════════════════════════
   TAP EMPIRE — Withdrawal System
   USER withdrawal of game-coin balance.
   Separate from bot Stars revenue.
═══════════════════════════════════ */

'use strict';

function calculateEligibleWithdrawal() {
  /* PRODUCTION: Run this server-side for authoritative values.
     Client calculation is display only.
  */
  if (STATE.economy.globalPayoutPaused) return 0;
  const estRev    = STATE.estimatedAdRevenue;
  const ratio     = STATE.economy.payoutRatio    || 0.30;
  const userBudget= estRev * ratio;
  const maxCoins  = STATE.economy.maximumDailyWithdrawalCoins || 500000;
  const maxUSD    = maxCoins / (STATE.economy.coinsPerStar || 10000) * 0.013;
  return Math.min(userBudget, maxUSD);
}

async function requestWithdrawal() {
  /*
    PRODUCTION: Call POST /api/withdrawal/request { initData } on backend.
    Backend validates everything server-side:
    - initData HMAC (Telegram auth)
    - balance from Firestore (not client)
    - level, adViews, fraud status, global pause
    - creates withdrawal record atomically
  */
  if (STATE.economy.globalPayoutPaused) {
    showToast('⚠️ Withdrawals temporarily under review.');
    return;
  }
  const minCoins = STATE.economy.minimumWithdrawalCoins || 100000;
  const minLevel = STATE.economy.minimumWithdrawalLevel || 10;
  const minAds   = STATE.economy.minimumWithdrawalAdViews || 20;
  const minStars = STATE.economy.minimumWithdrawalStars || 10;
  const uid      = String(STATE.tgUser?.id || 'demo_0');

  if (!uid || uid === 'demo_0')        { showToast('⚠️ Login via Telegram to withdraw');         return; }
  if (STATE.riskStatus === 'suspended'){ showToast('🚨 Account under review. Contact support.'); return; }
  if (STATE.level < minLevel)          { showToast(`⚠️ Reach Level ${minLevel} to withdraw (you: ${STATE.level})`); SFX.error(); return; }
  if (STATE.totalAdViews < minAds)     { showToast(`⚠️ Earn ${minAds} bonus rewards first (${STATE.totalAdViews}/${minAds})`); SFX.error(); return; }
  if (STATE.coins < minCoins)          { showToast(`⚠️ Need ${fmt(minCoins)} coins (you: ${fmt(STATE.coins)})`); SFX.error(); return; }
  if (STATE.pendingWithdrawal)         { showToast('⏳ You already have a pending withdrawal'); return; }

  const stars    = Math.floor(STATE.coins / (STATE.economy.coinsPerStar || 10000));
  const eligible = calculateEligibleWithdrawal();

  if (stars < minStars) { showToast(`⚠️ Minimum ⭐ ${minStars} required`); return; }

  showModal(`
    <div>
      <div style="font-size:20px;font-weight:800;margin-bottom:16px">Confirm Withdrawal</div>
      <div class="card2" style="margin-bottom:14px">
        <div class="withdraw-row"><span class="withdraw-lbl">Spend</span><span class="withdraw-val">💰 ${fmt(STATE.coins)} Coins</span></div>
        <div class="withdraw-row"><span class="withdraw-lbl">Receive</span><span class="withdraw-val" style="color:var(--gold)">⭐ ${stars} Stars</span></div>
        <div class="withdraw-row"><span class="withdraw-lbl">Est. eligible</span><span class="withdraw-val" style="color:var(--success)">$${eligible.toFixed(4)}</span></div>
      </div>
      <div style="font-size:11px;color:var(--muted);text-align:center;line-height:1.5;margin-bottom:16px">
        Withdrawal requests are subject to verification and game rules.<br>
        Estimated values are not guaranteed income. Processing: 1–3 business days.
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn btn-muted" onclick="closeModal()">Cancel</button>
        <button class="btn btn-gold" onclick="closeModal();_confirmWithdrawal(${stars})">Confirm</button>
      </div>
    </div>
  `);
}

async function _confirmWithdrawal(stars) {
  const uid      = String(STATE.tgUser?.id || 'demo_0');
  const coinsToSpend = STATE.coins;
  try {
    await db.runTransaction(async t => {
      const ref  = refs.user(uid);
      const snap = await t.get(ref);
      if (!snap.exists) throw new Error('User not found');
      const d = snap.data();
      if (d.pendingWithdrawal)  throw new Error('Pending withdrawal exists');
      if (d.coins < (STATE.economy.minimumWithdrawalCoins || 100000)) throw new Error('Insufficient coins');
      t.update(ref, {
        coins:             0,
        pendingWithdrawal: true,
        updatedAt:         firebase.firestore.FieldValue.serverTimestamp(),
      });
      t.set(refs.withdraw().doc(), {
        telegramId:      uid,
        username:        STATE.tgUser?.username || '',
        firstName:       STATE.tgUser?.first_name || '',
        requestedCoins:  d.coins,
        payoutAmount:    stars,
        payoutCurrency:  'XTR',
        eligibleUSD:     calculateEligibleWithdrawal(),
        status:          'pending',
        riskStatus:      d.riskStatus || 'ok',
        riskScore:       d.riskScore  || 0,
        createdAt:       firebase.firestore.FieldValue.serverTimestamp(),
        reviewedAt:      null,
        completedAt:     null,
        adminNote:       null,
      });
      // Transaction record
      t.set(refs.txn().doc(), {
        userId:    uid,
        type:      'withdrawal',
        delta:     -d.coins,
        desc:      `Withdrawal Request — ⭐ ${stars} Stars`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
    STATE.coins            = 0;
    STATE.pendingWithdrawal= true;
    updateCoinUI();
    SFX.reward();
    showToast(`✅ Withdrawal requested: ⭐ ${stars} Stars`);
  } catch (e) {
    showToast(`⚠️ ${e.message}`);
    SFX.error();
  }
}
