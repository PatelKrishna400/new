// Telegram Mini App Initialization & Haptic Helpers
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    // Enable closing confirmation if supported
    if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
    }
}

function triggerHaptic(type = 'light') {
    if (!tg?.HapticFeedback) return;
    try {
        if (type === 'light' || type === 'medium' || type === 'heavy' || type === 'rigid' || type === 'soft') {
            tg.HapticFeedback.impactOccurred(type);
        } else if (type === 'success' || type === 'warning' || type === 'error') {
            tg.HapticFeedback.notificationOccurred(type);
        }
    } catch (e) {
        // Safe fallback
    }
}

// Wheel Data Presets for Tiers
// Bronze: Single prizes | Silver: Two prizes with Energy | Golden: All two mega prizes
const PRESETS = {
    free: [
        { label: '⚡ 10 Energy', color: '#cd7f32' },
        { label: '⚡ 20 Energy', color: '#d97706' },
        { label: '⚡ 30 Energy', color: '#0d9488' },
        { label: '⚡ 40 Energy', color: '#4f46e5' },
        { label: '⚡ 50 Energy', color: '#c2410c' },
        { label: '🔑 1 Key', color: '#0284c7' },
        { label: '🪙 5 Coins', color: '#b45309' },
        { label: '🔄 Try Again', color: '#475569' }
    ],
    silver: [
        { label: '⚡ 50 En + 🔑 1 Key', color: '#e2e8f0' },
        { label: '⚡ 75 En + 🪙 10 Coins', color: '#94a3b8' },
        { label: '⚡ 100 En + 🎟️ 1 Ticket', color: '#cbd5e1' },
        { label: '⚡ 120 En + 🃏 1 Card', color: '#64748b' },
        { label: '⚡ 150 En + 🥈 1 Silver Ticket', color: '#f8fafc' },
        { label: '⚡ 200 En + 🪙 25 Coins', color: '#475569' },
        { label: '⚡ 250 En + 🔑 2 Keys', color: '#334155' },
        { label: '🔄 Try Again', color: '#1e293b' }
    ],
    golden: [
        { label: '⚡ 500 En + 🥇 2 Gold Tickets', color: '#ffd700' },
        { label: '⚡ 1K En + 👑 100 Coins', color: '#ffb703' },
        { label: '⚡ 1.5K En + 🔑 5 Keys', color: '#f59e0b' },
        { label: '⚡ 2K En + 🃏 5 Cards', color: '#e63946' },
        { label: '⚡ 2.5K En + 🥇 3 Gold Tickets', color: '#fbbf24' },
        { label: '⚡ 750 En + 🪙 50 Coins', color: '#d97706' },
        { label: '⚡ 1.2K En + 🔑 3 Keys', color: '#ffe57f' },
        { label: '🔄 Try Again', color: '#78350f' }
    ]
};

const PALETTE = [
    '#ff007f', '#ffb703', '#8338ec', '#3a86ff', '#06d6a0',
    '#fb5607', '#e63946', '#00b4d8', '#ff4d6d', '#7209b7',
    '#00f5d4', '#f72585', '#70e000', '#f77f00', '#4cc9f0'
];

const PRESET_VERSION = 'v3_single_double_prizes';

class SpinnerApp {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.pointer = document.getElementById('wheelPointer');
        
        this.slices = [];
        this.currentAngle = 0; // In radians
        this.angularVelocity = 0;
        this.isSpinning = false;
        this.lastPegIndex = -1;
        this.currentTier = 'free';
        
        this.stats = {
            totalSpins: 0,
            history: []
        };

        this.player = {
            level: 1,
            currentXp: 50,
            targetXp: 150,
            tickets: {
                free: 5,     // normal ticket
                silver: 2,   // silver ticket (valid 2 days)
                golden: 1    // golden ticket (valid 3 days)
            },
            passes: {
                silver: false,
                golden: false
            },
            passAdsWatched: {
                silver: 0,
                golden: 0
            }
        };

        this.loadState();
        this.initBulbs();
        this.bindEvents();
        this.applyTierTheme(this.currentTier);
        this.renderWheel();
        this.updateUI();
    }

    loadState() {
        try {
            const ver = localStorage.getItem('lucky_wheel_preset_ver');
            if (ver !== PRESET_VERSION) {
                localStorage.removeItem('lucky_wheel_slices_silver');
                localStorage.removeItem('lucky_wheel_slices_free');
                localStorage.removeItem('lucky_wheel_slices_golden');
                localStorage.setItem('lucky_wheel_preset_ver', PRESET_VERSION);
            }

            const savedTier = localStorage.getItem('lucky_wheel_tier');
            if (savedTier && PRESETS[savedTier]) {
                this.currentTier = savedTier;
            }

            const savedSlices = localStorage.getItem('lucky_wheel_slices_' + this.currentTier);
            const savedStats = localStorage.getItem('lucky_wheel_stats');
            const savedPlayer = localStorage.getItem('lucky_wheel_player');
            
            if (savedSlices) {
                this.slices = JSON.parse(savedSlices);
            } else {
                this.slices = JSON.parse(JSON.stringify(PRESETS[this.currentTier]));
            }

            if (savedStats) {
                this.stats = JSON.parse(savedStats);
            }

            if (savedPlayer) {
                this.player = JSON.parse(savedPlayer);
                this.player.passes = this.player.passes || { silver: false, golden: false };
                this.player.passAdsWatched = this.player.passAdsWatched || { silver: 0, golden: 0 };
            }

            // Sync tickets and resources from Tap Empire parent if available
            try {
                const rawSync = localStorage.getItem('tap_empire_sync_state');
                if (rawSync) {
                    const sync = JSON.parse(rawSync);
                    if (sync.tickets !== undefined) {
                        this.player.tickets.free = Math.max(this.player.tickets.free, sync.tickets);
                    }
                }
            } catch (e) {}

        } catch (e) {
            this.slices = JSON.parse(JSON.stringify(PRESETS.free));
        }

        // Validate active tier against pass ownership
        if (this.currentTier === 'silver' && !this.player.passes.silver) {
            this.currentTier = 'free';
        } else if (this.currentTier === 'golden' && !this.player.passes.golden) {
            this.currentTier = 'free';
        }
    }

    saveState() {
        try {
            localStorage.setItem('lucky_wheel_tier', this.currentTier);
            localStorage.setItem('lucky_wheel_slices_' + this.currentTier, JSON.stringify(this.slices));
            localStorage.setItem('lucky_wheel_stats', JSON.stringify(this.stats));
            localStorage.setItem('lucky_wheel_player', JSON.stringify(this.player));

            // Sync tickets back to Tap Empire
            try {
                const rawSync = localStorage.getItem('tap_empire_sync_state');
                const sync = rawSync ? JSON.parse(rawSync) : {};
                sync.tickets = this.player.tickets.free;
                localStorage.setItem('tap_empire_sync_state', JSON.stringify(sync));
            } catch (e) {}
        } catch (e) {
            console.error(e);
        }
    }

    applyTierTheme(tierName) {
        document.body.classList.remove('theme-free', 'theme-silver', 'theme-golden');
        document.body.classList.add(`theme-${tierName}`);

        document.querySelectorAll('.tier-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tier === tierName);
        });
    }

    setTier(tierName) {
        if (this.isSpinning || !PRESETS[tierName]) return;

        // Check Pass Ownership
        if (tierName === 'silver' && !this.player.passes.silver) {
            triggerHaptic('warning');
            this.showPassModal('silver');
            return;
        }

        if (tierName === 'golden' && !this.player.passes.golden) {
            triggerHaptic('warning');
            this.showPassModal('golden');
            return;
        }

        this.currentTier = tierName;
        this.applyTierTheme(tierName);

        const savedSlices = localStorage.getItem('lucky_wheel_slices_' + tierName);
        if (savedSlices) {
            this.slices = JSON.parse(savedSlices);
        } else {
            this.slices = JSON.parse(JSON.stringify(PRESETS[tierName]));
        }

        this.saveState();
        this.renderWheel();
        this.updateUI();
    }

    initBulbs() {
        const container = document.getElementById('wheelBulbs');
        container.innerHTML = '';
        const numBulbs = 20;
        const radius = 50; // percentage

        for (let i = 0; i < numBulbs; i++) {
            const angle = (i / numBulbs) * (Math.PI * 2);
            const x = 50 + radius * 0.94 * Math.cos(angle);
            const y = 50 + radius * 0.94 * Math.sin(angle);

            const bulb = document.createElement('div');
            bulb.className = 'bulb';
            bulb.style.left = `${x}%`;
            bulb.style.top = `${y}%`;
            bulb.style.animationDelay = `${(i % 4) * 0.3}s`;
            container.appendChild(bulb);
        }
    }

    bindEvents() {
        // Spin Buttons (Primary Bottom Button & Center Hub Circle)
        const spinAction = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            triggerHaptic('medium');
            this.startSpin();
        };

        const primaryBtn = document.getElementById('primarySpinBtn');
        const centerBtn = document.getElementById('centerSpinBtn');
        const centerHub = document.querySelector('.wheel-center-hub');

        if (primaryBtn) {
            primaryBtn.addEventListener('click', spinAction);
            primaryBtn.addEventListener('touchstart', spinAction, { passive: false });
        }

        if (centerBtn) {
            centerBtn.addEventListener('click', spinAction);
            centerBtn.addEventListener('touchstart', spinAction, { passive: false });
        }

        if (centerHub) {
            centerHub.addEventListener('click', spinAction);
            centerHub.addEventListener('touchstart', spinAction, { passive: false });
        }

        // Tier Tabs (Free, Silver, Golden)
        document.querySelectorAll('.tier-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isSpinning) return;
                triggerHaptic('light');
                this.setTier(btn.dataset.tier);
                window.soundEngine.playButtonClick();
            });
        });

        // Watch Ad Bonus Button (for Bronze Extra XP Gift)
        const watchAdBtn = document.getElementById('watchAdBtn');
        if (watchAdBtn) {
            watchAdBtn.addEventListener('click', () => {
                triggerHaptic('medium');
                this.playVideoAdReward();
            });
        }

        // Ticket Shop Convert Buttons — run ad first, then convert
        document.querySelectorAll('.exchange-btn[data-convert]').forEach(btn => {
            btn.addEventListener('click', () => {
                const cost       = parseInt(btn.dataset.cost, 10);
                const costType   = btn.dataset.costType;   // 'free' = bronze
                const reward     = parseInt(btn.dataset.reward, 10);
                const rewardType = btn.dataset.rewardType; // 'silver' or 'golden'

                const available = this.player.tickets[costType] || 0;
                if (available < cost) {
                    triggerHaptic('warning');
                    this.showModal('Not Enough Tickets! 🥉', `You need ${cost} Bronze Tickets (You have ${available}). Watch an ad below to earn free tickets!`, '🎟️');
                    return;
                }

                triggerHaptic('medium');
                // Run ad first, then perform exchange on completion
                this.playVideoAdThenConvert(cost, costType, reward, rewardType);
            });
        });

        // Shop Watch Ad for 2 Free Tickets Button
        const shopWatchAdBtn = document.getElementById('shopWatchAdBtn');
        if (shopWatchAdBtn) {
            shopWatchAdBtn.addEventListener('click', () => {
                triggerHaptic('medium');
                this.playVideoAdForTickets(2);
            });
        }

        // Shop Buy Pass Buttons
        const shopSilverPassBtn = document.getElementById('shopBuySilverPassBtn');
        if (shopSilverPassBtn) {
            shopSilverPassBtn.addEventListener('click', () => {
                triggerHaptic('medium');
                if (!this.player.passes.silver) {
                    this.showPassModal('silver');
                }
            });
        }

        const shopGoldenPassBtn = document.getElementById('shopBuyGoldenPassBtn');
        if (shopGoldenPassBtn) {
            shopGoldenPassBtn.addEventListener('click', () => {
                triggerHaptic('medium');
                if (!this.player.passes.golden) {
                    this.showPassModal('golden');
                }
            });
        }

        // Pass Modal Action Buttons
        const closePassModalBtn = document.getElementById('closePassModalBtn');
        if (closePassModalBtn) {
            closePassModalBtn.addEventListener('click', () => {
                this.closePassModal();
            });
        }

        const buyPassWithStarsBtn = document.getElementById('buyPassWithStarsBtn');
        if (buyPassWithStarsBtn) {
            buyPassWithStarsBtn.addEventListener('click', () => {
                triggerHaptic('medium');
                this.unlockPassWithStars(this.activePassModalTier);
            });
        }

        const buyPassWithAdsBtn = document.getElementById('buyPassWithAdsBtn');
        if (buyPassWithAdsBtn) {
            buyPassWithAdsBtn.addEventListener('click', () => {
                triggerHaptic('medium');
                this.watchAdForPass(this.activePassModalTier);
            });
        }

        // Tab Navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                triggerHaptic('light');
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
                window.soundEngine.playButtonClick();
            });
        });

        // Add Slice Button (if present)
        const addSliceBtn = document.getElementById('addSliceBtn');
        if (addSliceBtn) {
            addSliceBtn.addEventListener('click', () => {
                if (this.isSpinning) return;
                triggerHaptic('medium');
                const newColor = PALETTE[this.slices.length % PALETTE.length];
                this.slices.push({
                    label: `Item ${this.slices.length + 1}`,
                    color: newColor
                });
                this.saveState();
                this.renderWheel();
                this.updateUI();
                window.soundEngine.playButtonClick();
            });
        }

        // Clear History Button (if present)
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                triggerHaptic('light');
                this.stats.history = [];
                this.saveState();
                this.updateHistoryUI();
                window.soundEngine.playButtonClick();
            });
        }

        // Sound Toggle (if present)
        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                triggerHaptic('light');
                const isMuted = window.soundEngine.toggleMute();
                soundBtn.textContent = isMuted ? '🔇' : '🔊';
            });
        }

        // Fullscreen Toggle (if present)
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                triggerHaptic('light');
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }

        // Modal Actions
        document.getElementById('modalCloseBtn').addEventListener('click', () => {
            triggerHaptic('light');
            this.closeModal();
        });

        document.getElementById('modalSpinAgainBtn').addEventListener('click', () => {
            triggerHaptic('medium');
            this.closeModal();
            setTimeout(() => this.startSpin(), 250);
        });

        // Touch & Drag on Canvas
        let startAngle = 0;
        let isDragging = false;

        const getEventCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - (rect.left + rect.width / 2),
                y: clientY - (rect.top + rect.height / 2)
            };
        };

        const handleStart = (e) => {
            if (this.isSpinning) return;
            isDragging = true;
            const coords = getEventCoords(e);
            startAngle = Math.atan2(coords.y, coords.x);
        };

        const handleMove = (e) => {
            if (!isDragging || this.isSpinning) return;
            const coords = getEventCoords(e);
            const currentMoveAngle = Math.atan2(coords.y, coords.x);
            const diff = currentMoveAngle - startAngle;
            this.currentAngle += diff;
            startAngle = currentMoveAngle;
            this.renderWheel();
        };

        const handleEnd = () => {
            if (isDragging) {
                isDragging = false;
            }
        };

        this.canvas.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);

        this.canvas.addEventListener('touchstart', handleStart, { passive: true });
        window.addEventListener('touchmove', handleMove, { passive: true });
        window.addEventListener('touchend', handleEnd, { passive: true });
    }

    renderWheel() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = width / 2 - 35; // rim margin

        ctx.clearRect(0, 0, width, height);

        if (this.slices.length === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('Please add slices', centerX, centerY);
            return;
        }

        const arcSize = (Math.PI * 2) / this.slices.length;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.currentAngle);

        // 1. Draw Slices with Rich Gradients & Embossed Borders
        this.slices.forEach((slice, index) => {
            const startAngle = index * arcSize;
            const endAngle = startAngle + arcSize;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();

            // Rich multi-stop radial gradient for depth
            const grad = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius);
            grad.addColorStop(0, '#ffffff33');
            grad.addColorStop(0.2, slice.color);
            grad.addColorStop(0.85, this.darkenColor(slice.color, 18));
            grad.addColorStop(1, this.darkenColor(slice.color, 38));
            ctx.fillStyle = grad;
            ctx.fill();

            // 3D Embossed Divider Lines
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.stroke();

            // Render ONLY Emojis on Wheel Slices (Properly Sized & Centered)
            ctx.save();
            const bisectAngle = startAngle + arcSize / 2;
            ctx.rotate(bisectAngle);

            const emojiString = this.extractEmojis(slice.label);
            const isMultiple = emojiString.includes(' ') || Array.from(emojiString).length > 2;

            const fontSize = isMultiple ? 48 : 60;
            ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 3;

            // Center emoji at 65% radius
            const radialDistance = radius * 0.65;
            ctx.fillText(emojiString, radialDistance, 0);
            ctx.restore();
        });

        // 2. Ornate Inner Gold Concentric Ring & Star Accents
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.36, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Miniature Gold Diamond Stars at Slice Junctions
        for (let i = 0; i < this.slices.length; i++) {
            const angle = i * arcSize;
            const starX = Math.cos(angle) * (radius * 0.36);
            const starY = Math.sin(angle) * (radius * 0.36);

            ctx.save();
            ctx.translate(starX, starY);
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 3. Outer Metallic Gold/Platinum Beveled Rim
        ctx.beginPath();
        ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
        ctx.lineWidth = 6;
        const rimGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
        rimGrad.addColorStop(0, '#ffd700');
        rimGrad.addColorStop(0.3, '#ffffff');
        rimGrad.addColorStop(0.5, '#ffb703');
        rimGrad.addColorStop(0.8, '#d97706');
        rimGrad.addColorStop(1, '#ffd700');
        ctx.strokeStyle = rimGrad;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // 4. 3D Jeweled Pegs with Specular Highlight Reflection
        for (let i = 0; i < this.slices.length; i++) {
            const pegAngle = i * arcSize;
            const px = Math.cos(pegAngle) * (radius + 14);
            const py = Math.sin(pegAngle) * (radius + 14);

            // Peg Outer Brass Ring
            ctx.beginPath();
            ctx.arc(px, py, 8.5, 0, Math.PI * 2);
            ctx.fillStyle = '#b45309';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            ctx.fill();

            // Peg Golden Body
            ctx.beginPath();
            ctx.arc(px, py, 6.5, 0, Math.PI * 2);
            const pegGrad = ctx.createRadialGradient(px - 2, py - 2, 1, px, py, 7);
            pegGrad.addColorStop(0, '#ffffff');
            pegGrad.addColorStop(0.4, '#ffd700');
            pegGrad.addColorStop(1, '#d97706');
            ctx.fillStyle = pegGrad;
            ctx.fill();

            // Peg Sparkle Specular Highlight
            ctx.beginPath();
            ctx.arc(px - 2, py - 2, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        // 5. Glossy 3D Glass Arc Reflection (Upper Hemisphere Sheen)
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius - 4, Math.PI * 1.05, Math.PI * 1.95);
        ctx.quadraticCurveTo(0, -radius * 0.15, -radius * 0.95, -radius * 0.28);
        const glassGrad = ctx.createLinearGradient(0, -radius, 0, 0);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        glassGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
        glassGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glassGrad;
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    extractEmojis(label) {
        if (!label) return '⚡';
        // Match all emojis and symbols
        const emojiRegex = /[\p{Extended_Pictographic}\u{1F000}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const matches = label.match(emojiRegex);
        if (matches && matches.length > 0) {
            return matches.join(' ');
        }
        return label;
    }

    startSpin() {
        if (this.isSpinning || this.slices.length === 0) return;

        const tier = this.currentTier;
        const availableTickets = this.player.tickets[tier] || 0;

        if (availableTickets <= 0) {
            triggerHaptic('warning');
            if (tier === 'free') {
                this.showModal('No Bronze Tickets! 🥉', 'Watch an ad in the shop below to claim +2 Free Tickets!', '🎟️');
            } else if (tier === 'silver') {
                this.showModal('No Silver Tickets! 🥈', 'Convert 5 Free Tickets into 1 Silver Ticket in the shop below!', '🥈');
            } else {
                this.showModal('No Golden Tickets! 🥇', 'Convert 10 Free Tickets into 1 Golden Ticket in the shop below!', '🥇');
            }
            return;
        }

        // Deduct 1 ticket for current tier
        this.player.tickets[tier]--;
        this.saveState();
        this.updateUI();

        this.isSpinning = true;
        this.setControlsDisabled(true);
        window.soundEngine.playSpinStart();

        // 1. Pick target winning slice randomly
        const numSlices = this.slices.length;
        const arcSize = (Math.PI * 2) / numSlices;
        const targetSliceIndex = Math.floor(Math.random() * numSlices);

        // 2. Calculate target angle so the TOP POINTER points EXACTLY AT THE MIDDLE of the winning slice
        // Pointer is at Top (-PI / 2). Middle of slice is at (targetSliceIndex + 0.5) * arcSize
        const extraRotations = (Math.floor(Math.random() * 3) + 6) * (Math.PI * 2);
        const startAngle = this.currentAngle;
        let targetAngle = -Math.PI / 2 - (targetSliceIndex + 0.5) * arcSize;

        while (targetAngle < startAngle + extraRotations) {
            targetAngle += (Math.PI * 2);
        }

        const totalDelta = targetAngle - startAngle;
        const duration = 4200; // 4.2 seconds smooth luxury spin
        const startTime = performance.now();

        // Ease-out cubic animation curve for realistic deceleration
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animateSpin = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / duration);
            const easedProgress = easeOutCubic(progress);

            this.currentAngle = startAngle + totalDelta * easedProgress;
            this.angularVelocity = (1 - progress) * 0.4;

            this.checkPegTick();
            this.renderWheel();

            if (progress < 1) {
                requestAnimationFrame(animateSpin);
            } else {
                this.currentAngle = targetAngle;
                this.isSpinning = false;
                this.angularVelocity = 0;
                this.setControlsDisabled(false);
                this.renderWheel();
                this.onSpinComplete();
            }
        };

        requestAnimationFrame(animateSpin);
    }

    checkPegTick() {
        const numSlices = this.slices.length;
        const arcSize = (Math.PI * 2) / numSlices;
        
        const pointerAngle = -Math.PI / 2;
        let relativeAngle = (pointerAngle - this.currentAngle) % (Math.PI * 2);
        if (relativeAngle < 0) relativeAngle += Math.PI * 2;

        const currentPegIndex = Math.floor(relativeAngle / arcSize);

        if (currentPegIndex !== this.lastPegIndex) {
            this.lastPegIndex = currentPegIndex;
            
            // Pointer recoil
            this.pointer.classList.remove('ticking');
            void this.pointer.offsetWidth;
            this.pointer.classList.add('ticking');

            // Telegram Haptic & Sound
            triggerHaptic('light');
            window.soundEngine.playTick(this.angularVelocity * 2);
        }
    }

    onSpinComplete() {
        const winnerIndex = this.getWinningIndex();
        const winner = this.slices[winnerIndex];

        if (!winner) return;

        const isTryAgain = winner.label.toLowerCase().includes('try again');

        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        this.stats.totalSpins++;
        this.stats.history.unshift({
            name: winner.label,
            color: winner.color,
            time: timeString
        });

        if (this.stats.history.length > 50) {
            this.stats.history.pop();
        }

        if (isTryAgain) {
            triggerHaptic('warning');
            this.showModal('🔄 Try Again', 'So close! Spin again for another chance!', '🔄');
        } else {
            // Process XP and Ticket Rewards
            const levelUpOccurred = this.awardPrize(winner.label);

            triggerHaptic('success');
            window.soundEngine.playWin();
            window.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 140);

            if (levelUpOccurred) {
                setTimeout(() => {
                    window.confetti.burst(window.innerWidth / 2, window.innerHeight / 3, 100);
                }, 300);
                this.showModal(`⭐ LEVEL UP! (Lv. ${this.player.level})`, `Won ${winner.label} + Bonus: 🥈 2 Silver & 🥇 1 Gold Tickets!`, '🌟');
            } else {
                this.showModal(winner.label, 'Reward collected! Added to your account!', '⚡');
            }
        }

        this.saveState();
        this.updateUI();
    }

    awardPrize(label) {
        let levelUp = false;
        const clean = label.toLowerCase();

        // 1. Parse Tickets
        if (clean.includes('silver ticket')) {
            const match = label.match(/\d+/);
            const count = match ? parseInt(match[0], 10) : 1;
            this.player.tickets.silver += count;
        } else if (clean.includes('gold ticket') || clean.includes('golden ticket')) {
            const match = label.match(/\d+/);
            const count = match ? parseInt(match[0], 10) : 1;
            this.player.tickets.golden += count;
        } else if (clean.includes('bronze ticket') || clean.includes('normal ticket')) {
            const match = label.match(/\d+/);
            const count = match ? parseInt(match[0], 10) : 2;
            this.player.tickets.free += count;
        }

        // 2. Parse XP
        let gainedXp = 0;
        if (label.includes('XP') || label.includes('xp')) {
            if (label.includes('10K')) gainedXp = 10000;
            else if (label.includes('5K')) gainedXp = 5000;
            else if (label.includes('3K')) gainedXp = 3000;
            else if (label.includes('2.5K')) gainedXp = 2500;
            else if (label.includes('1.5K')) gainedXp = 1500;
            else if (label.includes('1K')) gainedXp = 1000;
            else {
                const xpMatch = label.match(/⭐\s*\+?(\d+)/) || label.match(/(\d+)\s*XP/i);
                if (xpMatch) gainedXp = parseInt(xpMatch[1], 10);
            }
        }

        if (gainedXp > 0) {
            this.player.currentXp += gainedXp;
            while (this.player.currentXp >= this.player.targetXp) {
                this.player.level++;
                this.player.currentXp -= this.player.targetXp;
                this.player.targetXp = Math.floor(this.player.targetXp * 1.5);
                this.player.tickets.silver += 2;
                this.player.tickets.golden += 1;
                levelUp = true;
            }
        }

        return levelUp;
    }

    getWinningIndex() {
        const numSlices = this.slices.length;
        if (numSlices === 0) return -1;
        const arcSize = (Math.PI * 2) / numSlices;
        
        let normalizedAngle = (-Math.PI / 2 - this.currentAngle) % (Math.PI * 2);
        if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

        return Math.floor(normalizedAngle / arcSize) % numSlices;
    }

    showModal(prizeName, message = 'The wheel has chosen your prize!', icon = '🎉') {
        const iconEl = document.querySelector('.winner-icon-burst');
        const tagEl = document.querySelector('.modal-tag');
        const titleEl = document.getElementById('winnerText');
        const descEl = document.getElementById('winnerDesc') || document.querySelector('#winnerModal p');
        const spinAgainBtn = document.getElementById('modalSpinAgainBtn');
        const adBonusCard = document.getElementById('adBonusCard');
        const adBonusText = document.getElementById('adBonusText');
        const adXpAmount = document.getElementById('adXpAmount');
        const watchAdBtn = document.getElementById('watchAdBtn');

        if (iconEl) iconEl.textContent = icon;
        if (tagEl) tagEl.textContent = prizeName.includes('Try Again') ? 'ALMOST THERE!' : 'CONGRATULATIONS!';
        if (titleEl) titleEl.textContent = prizeName;
        if (descEl) descEl.textContent = message;
        if (spinAgainBtn) spinAgainBtn.textContent = 'Spin Again';

        // Bronze Extra Gift & XP Bonus Ad trigger
        const isBronze = (this.currentTier === 'free');
        const isTryAgain = prizeName.includes('Try Again');

        if (isBronze && !isTryAgain && adBonusCard) {
            // Random 1 to 5 XP points
            this.currentBonusXp = Math.floor(Math.random() * 5) + 1;
            if (adXpAmount) adXpAmount.textContent = this.currentBonusXp;
            if (adBonusText) adBonusText.textContent = `⭐ Claim +${this.currentBonusXp} XP Extra Gift!`;
            
            if (watchAdBtn) {
                watchAdBtn.disabled = false;
                watchAdBtn.innerHTML = `<span>📺 Watch Ad for +<strong>${this.currentBonusXp}</strong> XP</span>`;
            }
            adBonusCard.style.display = 'flex';
        } else if (adBonusCard) {
            adBonusCard.style.display = 'none';
        }

        document.getElementById('winnerModal').classList.add('active');
    }

    playVideoAdReward() {
        const adModal = document.getElementById('adPlayerModal');
        const progressBar = document.getElementById('adProgressBar');
        const countdownText = document.getElementById('adCountdownText');
        const watchAdBtn = document.getElementById('watchAdBtn');
        const adBonusText = document.getElementById('adBonusText');

        if (!adModal) return;

        adModal.classList.add('active');
        if (progressBar) progressBar.style.width = '0%';
        if (countdownText) countdownText.textContent = 'Reward unlocking in 3s...';

        let secondsLeft = 3;
        let progress = 0;

        const interval = setInterval(() => {
            progress += 10;
            if (progressBar) progressBar.style.width = `${progress}%`;

            if (progress % 33 === 0 && secondsLeft > 1) {
                secondsLeft--;
                if (countdownText) countdownText.textContent = `Reward unlocking in ${secondsLeft}s...`;
            }

            if (progress >= 100) {
                clearInterval(interval);
                adModal.classList.remove('active');

                // Award the +1 to +5 XP Points to player
                const bonus = this.currentBonusXp || 3;
                this.player.currentXp += bonus;

                while (this.player.currentXp >= this.player.targetXp) {
                    this.player.level++;
                    this.player.currentXp -= this.player.targetXp;
                    this.player.targetXp = Math.floor(this.player.targetXp * 1.5);
                    this.player.tickets.silver += 2;
                    this.player.tickets.golden += 1;
                }

                this.saveState();
                this.updateUI();

                // Feedback
                triggerHaptic('success');
                window.soundEngine.playWin();
                window.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 100);

                if (adBonusText) adBonusText.textContent = `✅ Claimed +${bonus} XP Extra Gift!`;
                if (watchAdBtn) {
                    watchAdBtn.disabled = true;
                    watchAdBtn.innerHTML = `<span>🎉 XP Claimed!</span>`;
                }
            }
        }, 300);
    }

    playVideoAdForTickets(ticketCount = 2) {
        this._runAdModal(3, () => {
            this.player.tickets.free += ticketCount;
            this.saveState();
            this.updateUI();
            triggerHaptic('success');
            window.soundEngine.playWin();
            window.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 90);
            this.showModal('🎁 Ad Reward Claimed!', `Added +${ticketCount} Free 🥉 Bronze Tickets to your account!`, '🎟️');
        });
    }

    // Run ad then do a ticket conversion
    playVideoAdThenConvert(cost, costType, reward, rewardType) {
        this._runAdModal(3, () => {
            this.player.tickets[costType] -= cost;
            this.player.tickets[rewardType] += reward;
            this.saveState();
            this.updateUI();
            triggerHaptic('success');
            window.soundEngine.playWin();
            window.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 90);
            const rewardIcon = rewardType === 'silver' ? '🥈' : '🥇';
            const rewardName = rewardType === 'silver' ? 'Silver Ticket' : 'Golden Ticket';
            this.showModal('🎉 Convert Complete!', `Watched ad ✅ Converted ${cost} 🥉 Bronze → +${reward} ${rewardIcon} ${rewardName}!`, rewardIcon);
        });
    }

    // Shared ad modal runner — calls onComplete when ad finishes
    _runAdModal(durationSec = 3, onComplete) {
        const adModal     = document.getElementById('adPlayerModal');
        const progressBar = document.getElementById('adProgressBar');
        const countdownEl = document.getElementById('adCountdownText');

        if (!adModal) { if (onComplete) onComplete(); return; }

        adModal.classList.add('active');
        if (progressBar) progressBar.style.width = '0%';
        if (countdownEl) countdownEl.textContent = `Reward unlocking in ${durationSec}s...`;

        let secondsLeft = durationSec;
        let progress    = 0;
        const steps     = durationSec * (1000 / 300);  // steps per second at 300ms tick
        const increment = 100 / steps;

        const interval = setInterval(() => {
            progress = Math.min(progress + increment, 100);
            if (progressBar) progressBar.style.width = `${progress}%`;

            const elapsed = Math.round((progress / 100) * durationSec);
            const remaining = Math.max(durationSec - elapsed, 0);
            if (countdownEl && remaining !== secondsLeft) {
                secondsLeft = remaining;
                countdownEl.textContent = remaining > 0
                    ? `Reward unlocking in ${remaining}s...`
                    : 'Done! Collecting reward...';
            }

            if (progress >= 100) {
                clearInterval(interval);
                adModal.classList.remove('active');
                if (onComplete) onComplete();
            }
        }, 300);
    }

    showPassModal(tier = 'silver') {
        this.activePassModalTier = tier;
        const passModal = document.getElementById('passModal');
        const passIconBurst = document.getElementById('passIconBurst');
        const passTitle = document.getElementById('passTitle');
        const passDesc = document.getElementById('passDesc');
        const perk1 = document.getElementById('perk1');
        const perk2 = document.getElementById('perk2');
        const perk3 = document.getElementById('perk3');
        const perk4 = document.getElementById('perk4');
        const passStarsBtnText = document.getElementById('passStarsBtnText');
        const passAdCount = document.getElementById('passAdCount');

        if (!passModal) return;

        const isSilver = (tier === 'silver');
        const targetAdCount = isSilver ? 50 : 100;
        const currentAds = (this.player.passAdsWatched && this.player.passAdsWatched[tier]) || 0;
        const starPrice = isSilver ? 500 : 1000;

        if (passIconBurst) passIconBurst.textContent = isSilver ? '🥈' : '🥇';
        if (passTitle) passTitle.textContent = isSilver ? 'Unlock Silver VIP Pass' : 'Unlock Golden VIP Pass';
        if (passDesc) passDesc.textContent = isSilver 
            ? 'Get permanent access to the Silver Wheel with double combos and energy prizes!' 
            : 'Get permanent access to the Golden Wheel with Mega Jackpot 2.5K Energy rewards!';

        if (perk1) perk1.textContent = isSilver ? '✨ Unlimited Silver Wheel Access' : '👑 Unlimited Golden Wheel Access';
        if (perk2) perk2.textContent = isSilver ? '⚡ Double Combos (Energy + Keys, Coins, Cards)' : '💎 2x Mega Combos + 100 Coins Jackpot';
        if (perk3) perk3.textContent = isSilver ? '⏱️ Silver Tickets valid for 2 Days' : '⏱️ Golden Tickets valid for 3 Days';
        if (perk4) perk4.textContent = isSilver ? '🎁 High XP Level-Up Multipliers' : '🥇 Golden Mega Spin Combos';

        if (passStarsBtnText) {
            passStarsBtnText.textContent = `⭐ ${starPrice} Telegram Stars`;
        }

        if (passAdCount) {
            passAdCount.textContent = `${Math.min(currentAds, targetAdCount)}/${targetAdCount}`;
        }

        passModal.classList.add('active');
    }

    closePassModal() {
        const passModal = document.getElementById('passModal');
        if (passModal) passModal.classList.remove('active');
    }

    unlockPassWithStars(tier = 'silver') {
        const isSilver = (tier === 'silver');
        const starCost = isSilver ? 500 : 1000;

        // If Telegram WebApp Stars Invoice is available, can trigger openInvoice
        // In local/app environment, confirm purchase:
        this.player.passes[tier] = true;
        this.saveState();
        this.updateUI();

        this.closePassModal();
        triggerHaptic('success');
        window.soundEngine.playWin();
        window.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 100);

        const tierName = isSilver ? 'Silver' : 'Golden';
        const tierIcon = isSilver ? '🥈' : '🥇';
        this.showModal(`🎉 ${tierName} Pass Activated!`, `Purchased with ${starCost} Telegram Stars! Full VIP access is now active!`, tierIcon);
        this.setTier(tier);
    }

    watchAdForPass(tier = 'silver') {
        const isSilver = (tier === 'silver');
        const targetAdCount = isSilver ? 50 : 100;

        this.playVideoAdReward();

        // Count towards pass unlock
        this.player.passAdsWatched[tier] = (this.player.passAdsWatched[tier] || 0) + 1;
        const currentAds = this.player.passAdsWatched[tier];

        const passAdCount = document.getElementById('passAdCount');
        if (passAdCount) passAdCount.textContent = `${Math.min(currentAds, targetAdCount)}/${targetAdCount}`;

        if (currentAds >= targetAdCount) {
            this.player.passes[tier] = true;
            this.saveState();
            this.updateUI();
            this.closePassModal();

            setTimeout(() => {
                const tierName = isSilver ? 'Silver' : 'Golden';
                const tierIcon = isSilver ? '🥈' : '🥇';
                this.showModal(`🎉 ${tierName} Pass Unlocked!`, `Watched all ${targetAdCount} ads! VIP access to ${tierName} Wheel is now active!`, tierIcon);
                this.setTier(tier);
            }, 3200);
        }
    }

    closeModal() {
        document.getElementById('winnerModal').classList.remove('active');
    }

    setControlsDisabled(disabled) {
        const primaryBtn = document.getElementById('primarySpinBtn');
        const centerBtn = document.getElementById('centerSpinBtn');
        const addSliceBtn = document.getElementById('addSliceBtn');

        if (primaryBtn) primaryBtn.disabled = disabled;
        if (centerBtn) centerBtn.disabled = disabled;
        if (addSliceBtn) addSliceBtn.disabled = disabled;
    }

    updateUI() {
        // Player XP & Level
        const levelEl = document.getElementById('playerLevel');
        const curXpEl = document.getElementById('currentXp');
        const tgtXpEl = document.getElementById('targetXp');
        const xpFillEl = document.getElementById('xpFill');

        if (levelEl) levelEl.textContent = this.player.level;
        if (curXpEl) curXpEl.textContent = this.player.currentXp;
        if (tgtXpEl) tgtXpEl.textContent = this.player.targetXp;
        if (xpFillEl) {
            const pct = Math.min(100, Math.max(0, (this.player.currentXp / this.player.targetXp) * 100));
            xpFillEl.style.width = `${pct}%`;
        }

        // Tier Ticket Counters
        const normalTicketEl = document.getElementById('ticketCountNormal');
        const silverTicketEl = document.getElementById('ticketCountSilver');
        const goldenTicketEl = document.getElementById('ticketCountGolden');

        if (normalTicketEl) normalTicketEl.textContent = this.player.tickets.free;
        if (silverTicketEl) silverTicketEl.textContent = this.player.tickets.silver;
        if (goldenTicketEl) goldenTicketEl.textContent = this.player.tickets.golden;

        // Pass Lock Badges on Tabs
        const silverLockBadge = document.getElementById('silverLockBadge');
        const goldenLockBadge = document.getElementById('goldenLockBadge');

        if (silverLockBadge) {
            if (this.player.passes.silver) {
                silverLockBadge.textContent = '🔓 Unlocked';
                silverLockBadge.classList.add('unlocked');
            } else {
                silverLockBadge.textContent = '🔒 Locked';
                silverLockBadge.classList.remove('unlocked');
            }
        }

        if (goldenLockBadge) {
            if (this.player.passes.golden) {
                goldenLockBadge.textContent = '🔓 Unlocked';
                goldenLockBadge.classList.add('unlocked');
            } else {
                goldenLockBadge.textContent = '🔒 Locked';
                goldenLockBadge.classList.remove('unlocked');
            }
        }

        // Shop Pass Buttons
        const shopSilverBtn = document.getElementById('shopBuySilverPassBtn');
        const shopSilverLabel = document.getElementById('shopSilverPassLabel');
        if (shopSilverBtn && shopSilverLabel) {
            if (this.player.passes.silver) {
                shopSilverBtn.disabled = true;
                shopSilverLabel.textContent = '✅ Unlocked';
            } else {
                shopSilverBtn.disabled = false;
                shopSilverLabel.textContent = 'Unlock (15 🥉)';
            }
        }

        const shopGoldenBtn = document.getElementById('shopBuyGoldenPassBtn');
        const shopGoldenLabel = document.getElementById('shopGoldenPassLabel');
        if (shopGoldenBtn && shopGoldenLabel) {
            if (this.player.passes.golden) {
                shopGoldenBtn.disabled = true;
                shopGoldenLabel.textContent = '✅ Unlocked';
            } else {
                shopGoldenBtn.disabled = false;
                shopGoldenLabel.textContent = 'Unlock (30 🥉)';
            }
        }

        // Spin Button Text - Clean "SPIN" across all tiers
        const primaryBtn = document.getElementById('primarySpinBtn');
        const centerBtn = document.getElementById('centerSpinBtn');
        
        if (primaryBtn) primaryBtn.innerHTML = `<span>SPIN</span>`;
        if (centerBtn) centerBtn.innerHTML = `SPIN`;

        // Stats (if present)
        const totalSpinsEl = document.getElementById('statTotalSpins');
        const slicesCountEl = document.getElementById('statSlicesCount');
        const tabSliceCountEl = document.getElementById('tabSliceCount');
        const lastWonEl = document.getElementById('statLastWon');

        if (totalSpinsEl) totalSpinsEl.textContent = this.stats.totalSpins;
        if (slicesCountEl) slicesCountEl.textContent = this.slices.length;
        if (tabSliceCountEl) tabSliceCountEl.textContent = this.slices.length;

        if (lastWonEl) {
            const latestWin = this.stats.history.length > 0 ? this.stats.history[0].name : '-';
            lastWonEl.textContent = latestWin.length > 10 ? latestWin.substring(0, 10) + '...' : latestWin;
        }

        this.updateSlicesListUI();
        this.updateHistoryUI();
    }

    updateSlicesListUI() {
        const container = document.getElementById('slicesList');
        if (!container) return;
        container.innerHTML = '';

        this.slices.forEach((slice, index) => {
            const row = document.createElement('div');
            row.className = 'slice-item-row';

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.className = 'slice-color-picker';
            colorInput.value = slice.color;
            colorInput.addEventListener('input', (e) => {
                slice.color = e.target.value;
                this.saveState();
                this.renderWheel();
            });

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'slice-input-name';
            nameInput.value = slice.label;
            nameInput.placeholder = 'Segment label...';
            nameInput.addEventListener('input', (e) => {
                slice.label = e.target.value;
                this.saveState();
                this.renderWheel();
            });

            const delBtn = document.createElement('button');
            delBtn.className = 'slice-delete-btn';
            delBtn.innerHTML = '🗑️';
            delBtn.title = 'Remove Slice';
            delBtn.addEventListener('click', () => {
                if (this.isSpinning) return;
                triggerHaptic('light');
                if (this.slices.length <= 2) {
                    alert('The wheel must have at least 2 segments.');
                    return;
                }
                this.slices.splice(index, 1);
                this.saveState();
                this.renderWheel();
                this.updateUI();
                window.soundEngine.playButtonClick();
            });

            row.appendChild(colorInput);
            row.appendChild(nameInput);
            row.appendChild(delBtn);
            container.appendChild(row);
        });
    }

    updateHistoryUI() {
        const container = document.getElementById('historyList');
        if (!container) return;

        if (this.stats.history.length === 0) {
            container.innerHTML = '<div class="empty-state">No spins recorded yet. Spin the wheel to get started!</div>';
            return;
        }

        container.innerHTML = '';
        this.stats.history.forEach(item => {
            const row = document.createElement('div');
            row.className = 'history-item';

            const left = document.createElement('div');
            left.className = 'history-item-left';

            const badge = document.createElement('div');
            badge.className = 'history-badge';
            badge.style.backgroundColor = item.color;
            badge.style.boxShadow = `0 0 8px ${item.color}`;

            const name = document.createElement('span');
            name.className = 'history-name';
            name.textContent = item.name;

            left.appendChild(badge);
            left.appendChild(name);

            const time = document.createElement('span');
            time.className = 'history-time';
            time.textContent = item.time;

            row.appendChild(left);
            row.appendChild(time);
            container.appendChild(row);
        });
    }

    darkenColor(color, percent) {
        let num = parseInt(color.replace('#', ''), 16);
        let amt = Math.round(2.55 * percent);
        let R = (num >> 16) - amt;
        let G = (num >> 8 & 0x00FF) - amt;
        let B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16)
            .slice(1);
    }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.spinnerApp = new SpinnerApp();
});
