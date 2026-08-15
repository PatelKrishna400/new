/* ═══════════════════════════════════════════════════════════
   TAP EMPIRE — Client Security & Anti-Fraud Monitor
   Adheres to Section #45 of Master Prompt Specification
   Monitors tap frequency, prevents automated clickers,
   and flags suspicious tap patterns to server.
═══════════════════════════════════════════════════════════ */

'use strict';

const SecurityEngine = {
  maxTapsPerSecond: 20,
  tapTimestamps: [],

  /**
   * Validate every tap event for human rhythm and reasonable speed
   */
  validateTap() {
    const now = Date.now();
    this.tapTimestamps.push(now);

    // Keep only timestamps from the last 1 second
    this.tapTimestamps = this.tapTimestamps.filter(ts => now - ts <= 1000);

    if (this.tapTimestamps.length > this.maxTapsPerSecond) {
      showToast('⚠️ Tap speed limit exceeded! Please tap naturally.');
      return false;
    }
    return true;
  },

  /**
   * Calculate local risk metrics before flushing batch to server
   */
  getRiskAssessment() {
    const rapidCount = this.tapTimestamps.length;
    return {
      tapsPerSec: rapidCount,
      isSuspicious: rapidCount > 18,
    };
  }
};
