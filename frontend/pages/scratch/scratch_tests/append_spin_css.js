const fs = require('fs');
const path = require('path');

const cssToAdd = `
/* ==========================================================================
   CROWN LEVEL QUEST TAB (REPLACES READY TO SPIN TAB)
   ========================================================================== */
.spin-level-display {
  width: 100%;
  max-width: 380px;
  margin: 10px auto 4px auto;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
  border: 1.5px solid rgba(245, 158, 11, 0.4);
  border-radius: 18px;
  padding: 14px 16px;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(245, 158, 11, 0.15);
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.spin-level-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #fbbf24, #f59e0b, transparent);
}

.spin-level-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.spin-level-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spin-level-crown-badge {
  font-size: 24px;
  filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.8));
  animation: crownBob 2s infinite ease-in-out;
}

@keyframes crownBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px) scale(1.08); }
}

.spin-level-name {
  font-size: 13px;
  font-weight: 900;
  color: #fbbf24;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.spin-level-sub {
  font-size: 10.5px;
  color: #94a3b8;
  margin-top: 1px;
}

.spin-level-gift-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(245, 158, 11, 0.25) 100%);
  border: 1.2px solid rgba(245, 158, 11, 0.5);
  border-radius: 99px;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 800;
  color: #fef08a;
  letter-spacing: 0.5px;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
  cursor: pointer;
  animation: pulseGiftBadge 2.2s infinite ease-in-out;
}

@keyframes pulseGiftBadge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); box-shadow: 0 0 14px rgba(245, 158, 11, 0.4); }
}

.gift-badge-icon {
  font-size: 13px;
}

.spin-level-progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.spin-crown-track {
  width: 100%;
  height: 10px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  overflow: hidden;
  position: relative;
}

.spin-crown-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #fde047 100%);
  border-radius: 99px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.8);
}

.spin-crown-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.spin-crown-count {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  color: #fbbf24;
}

.spin-crown-status {
  color: #94a3b8;
  font-size: 10.5px;
}

/* ==========================================================================
   MYSTERY GIFT WINNING MODAL (TRIGGERED WHEN CROWN GOAL REACHED)
   ========================================================================== */
.spin-gift-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(3, 7, 18, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 18px;
  box-sizing: border-box;
}

.spin-gift-backdrop.active {
  display: flex !important;
  animation: fadeInGiftBackdrop 0.3s ease-out;
}

@keyframes fadeInGiftBackdrop {
  from { opacity: 0; }
  to { opacity: 1; }
}

.spin-gift-modal {
  width: 100%;
  max-width: 360px;
  background: linear-gradient(165deg, rgba(26, 32, 53, 0.98) 0%, rgba(11, 17, 36, 0.99) 100%);
  border: 2px solid #fbbf24;
  border-radius: 24px;
  padding: 26px 20px;
  text-align: center;
  box-shadow: 
    0 25px 60px rgba(0, 0, 0, 0.9),
    0 0 40px rgba(251, 191, 36, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  animation: scaleUpGiftModal 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

@keyframes scaleUpGiftModal {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.spin-gift-badge {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1.5px;
  color: #040919;
  background: linear-gradient(90deg, #fde047 0%, #f59e0b 100%);
  padding: 4px 14px;
  border-radius: 99px;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.6);
  text-transform: uppercase;
}

.spin-gift-chest-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0;
}

.spin-gift-chest-icon {
  font-size: 64px;
  filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.8));
  animation: giftChestBounce 1.5s infinite ease-in-out;
}

@keyframes giftChestBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-6px) rotate(-4deg); }
  75% { transform: translateY(-6px) rotate(4deg); }
}

.spin-gift-sparkles {
  position: absolute;
  font-size: 20px;
  top: -4px;
  right: -4px;
  animation: spinSparklePulse 1.2s infinite ease-in-out;
}

@keyframes spinSparklePulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.3); opacity: 1; }
}

.spin-gift-title {
  font-size: 20px;
  font-weight: 900;
  color: #fef08a;
  margin: 0;
  letter-spacing: 0.5px;
}

.spin-gift-sub {
  font-size: 12.5px;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.4;
}

.spin-gift-rewards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  width: 100%;
  margin: 6px 0;
}

.gift-reward-card {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.gift-reward-card.gold { border-color: rgba(245, 158, 11, 0.5); }
.gift-reward-card.blue { border-color: rgba(56, 189, 248, 0.5); }
.gift-reward-card.purple { border-color: rgba(168, 85, 247, 0.5); }
.gift-reward-card.cyan { border-color: rgba(6, 182, 212, 0.5); }

.gift-reward-card .reward-icon { font-size: 18px; }
.gift-reward-card .reward-val { font-size: 12px; font-weight: 900; color: #f1f5f9; font-family: 'JetBrains Mono', monospace; }
.gift-reward-card .reward-label { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }

.spin-gift-claim-btn {
  width: 100%;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #040919;
  border: none;
  border-radius: 14px;
  padding: 12px;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.6px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.5);
  transition: all 0.2s ease;
  margin-top: 4px;
}

.spin-gift-claim-btn:active {
  transform: scale(0.96);
}
`;

const target = path.join(__dirname, '../frontend/pages/spin/spin.css');
fs.appendFileSync(target, cssToAdd, 'utf8');
console.log('Appended to spin.css successfully!');
