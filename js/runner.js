import { HusserRig } from './rig.js';

// Speed Tier & Sonic Cone Thresholds (10 internal vx units = 1 m/s)
const TIER_2_VX = 2510;        // 251 m/s (Tier 2: 251 - 500 m/s)
const TIER_3_VX = 5010;        // 501 m/s (Tier 3: 501 - 1799 m/s)
const SONIC_CONE_VX = 6500;    // 650 m/s (Supersonic Boom Mach Cone threshold)
const FIRE_CONE_VX = 12000;    // 1200 m/s (Surging Meteorite Fire Cone threshold)
const TIER_4_VX = 12500;       // 1250 m/s (Tier 4: HYPERSONIC & Amber Sky threshold)
const PIXELS_PER_METER = 25;

export class EndlessRunner {
    constructor(rig, dataManager, onReturnToEditor, onOpenWorkshop, onReturnToMainMenu, onOpenSettings, soundManager = null) {
        this.rig = rig;
        this.dataManager = dataManager;
        this.onReturnToEditor = onReturnToEditor;
        this.onOpenWorkshop = onOpenWorkshop;
        this.onReturnToMainMenu = onReturnToMainMenu;
        this.onOpenSettings = onOpenSettings;
        this.soundManager = soundManager;

        this.active = false;
        this.paused = false;
        this.raceMode = 'endless'; // 'endless', 'story', or 'sandbox'
        this.currentRivalSpec = null;
        this.rivalRig = new HusserRig();

        this.isDiving = false;
        this.isDashing = false;

        // UI Elements
        this.hudEl = document.getElementById('hud-overlay');
        this.pauseEl = document.getElementById('pause-overlay');
        this.gameOverEl = document.getElementById('gameover-overlay');
        this.gameOverTitleEl = document.getElementById('gameover-title');
        this.speedEl = document.getElementById('hud-speed');
        this.peakLabelEl = document.getElementById('hud-peak-label');
        this.tierBadgeEl = document.getElementById('hud-tier-badge');
        this.draftBadgeEl = document.getElementById('hud-draft-badge');
        this.fuelFillEl = document.getElementById('hud-fuel-fill');
        this.dashFillEl = document.getElementById('hud-dash-fill');
        this.dashStatusEl = document.getElementById('hud-dash-status');
        this.stallWarnEl = document.getElementById('stall-warning');
        this.modeLabelEl = document.getElementById('hud-mode-label');
        this.distEl = document.getElementById('hud-distance');
        this.scrapEl = document.getElementById('hud-scrap');
        if (this.scrapEl) {
            this.scrapEl.innerHTML = '<span id="hud-scrap-total">⚙️ 0</span><span id="hud-scrap-popup" class="scrap-gain-popup"></span>';
            this.scrapTotalEl = document.getElementById('hud-scrap-total');
            this.scrapPopupEl = document.getElementById('hud-scrap-popup');
        }
        this.finalStatsEl = document.getElementById('final-stats-text');
        this.breakdownEl = document.getElementById('gameover-breakdown');
        this.countdownEl = document.getElementById('countdown-banner');
        this.countdownNumEl = document.getElementById('countdown-number');

        this.alertBannerEl = document.getElementById('screen-alert-banner');
        this.alertTitleEl = document.getElementById('screen-alert-title');
        this.alertSubEl = document.getElementById('screen-alert-sub');

        this.raceProgressWrapEl = document.getElementById('hud-race-progress');
        this.raceStageLabelEl = document.getElementById('race-stage-label');
        this.raceRivalLabelEl = document.getElementById('race-rival-label');
        this.racePlayerDotEl = document.getElementById('race-player-dot');
        this.raceRivalDotEl = document.getElementById('race-rival-dot');

        this.bindInputs();
        this.reset();
    }

    bindInputs() {
        const leanPedal = document.getElementById('pedal-lean');
        const boostPedal = document.getElementById('pedal-boost');

        const setDive = (state) => {
            if (!this.active || this.paused || this.finishing || this.countdownTimer > 0) return;
            if (state && !this.isDiving && this.soundManager) {
                this.soundManager.playSfx('lean', 1.0, 0.7);
            }
            this.isDiving = state;
            if (leanPedal) leanPedal.classList.toggle('pressed', state);
        };
        const setDash = (state) => {
            if (!this.active || this.paused || this.finishing || this.countdownTimer > 0) return;
            if (state && !this.isDashing && this.soundManager) {
                this.soundManager.playSfx('boost', 1.0, 0.85);
            }
            this.isDashing = state;
            if (boostPedal) boostPedal.classList.toggle('pressed', state);
        };

        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.active && !this.finishing) {
                    e.preventDefault();
                    const settingsEl = document.getElementById('settings-modal');
                    if (settingsEl && settingsEl.style.display === 'flex') {
                        settingsEl.style.display = 'none';
                        return;
                    }
                    this.togglePause();
                }
                return;
            }
            if (['Space', 'ArrowDown', 'KeyS'].includes(e.code)) setDive(true);
            if (['ShiftLeft', 'ShiftRight', 'KeyD', 'ArrowRight'].includes(e.code)) setDash(true);
        });

        window.addEventListener('keyup', (e) => {
            if (['Space', 'ArrowDown', 'KeyS'].includes(e.code)) setDive(false);
            if (['ShiftLeft', 'ShiftRight', 'KeyD', 'ArrowRight'].includes(e.code)) setDash(false);
        });

        if (leanPedal) {
            leanPedal.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                leanPedal.setPointerCapture(e.pointerId);
                setDive(true);
            });
            const endLean = (e) => { e.preventDefault(); setDive(false); };
            leanPedal.addEventListener('pointerup', endLean);
            leanPedal.addEventListener('pointercancel', endLean);
        }

        if (boostPedal) {
            boostPedal.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                boostPedal.setPointerCapture(e.pointerId);
                setDash(true);
            });
            const endBoost = (e) => { e.preventDefault(); setDash(false); };
            boostPedal.addEventListener('pointerup', endBoost);
            boostPedal.addEventListener('pointercancel', endBoost);
        }

        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'touch') return;
            if (e.button === 2) setDash(true);
            else setDive(true);
        });
        window.addEventListener('pointerup', (e) => {
            if (e.pointerType === 'touch') return;
            if (e.button === 2) setDash(false);
            else setDive(false);
        });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        document.getElementById('hud-pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('pause-resume-btn').addEventListener('click', () => this.togglePause(false));
        document.getElementById('pause-restart-btn').addEventListener('click', () => {
            this.togglePause(false);
            if (this.raceMode === 'story' && this.currentRivalSpec) {
                this.startStoryRace(this.currentRivalSpec);
            } else if (this.raceMode === 'sandbox') {
                this.startSandbox();
            } else {
                this.startEndless();
            }
        });
        document.getElementById('pause-settings-btn').addEventListener('click', () => {
            if (this.onOpenSettings) this.onOpenSettings();
        });
        document.getElementById('pause-editor-btn')?.addEventListener('click', () => {
            this.stop();
            this.onReturnToEditor();
        });
        document.getElementById('pause-menu-btn').addEventListener('click', () => {
            this.stop();
            if (this.onReturnToMainMenu) this.onReturnToMainMenu();
        });

        document.getElementById('retry-btn').addEventListener('click', () => {
            this.gameOverEl.style.display = 'none';
            if (this.raceMode === 'story' && this.currentRivalSpec) {
                this.startStoryRace(this.currentRivalSpec);
            } else if (this.raceMode === 'sandbox') {
                this.startSandbox();
            } else {
                this.startEndless();
            }
        });

        document.getElementById('gameover-workshop-btn').addEventListener('click', () => {
            this.stop();
            this.onOpenWorkshop();
        });

        document.getElementById('back-studio-btn').addEventListener('click', () => {
            this.stop();
            this.onReturnToEditor();
        });

        document.getElementById('gameover-menu-btn').addEventListener('click', () => {
            this.stop();
            if (this.onReturnToMainMenu) this.onReturnToMainMenu();
        });

        document.getElementById('hud-abort-btn')?.addEventListener('click', () => {
            this.stop();
            if (this.onReturnToMainMenu) this.onReturnToMainMenu();
        });
    }

    togglePause(forceState = null) {
        if (!this.active) return;
        this.paused = forceState !== null ? forceState : !this.paused;
        this.isDiving = false;
        this.isDashing = false;
        this.isBoostingNow = false;
        document.getElementById('pedal-lean')?.classList.remove('pressed');
        document.getElementById('pedal-boost')?.classList.remove('pressed');
        if (!this.paused) {
            const settingsEl = document.getElementById('settings-modal');
            if (settingsEl) settingsEl.style.display = 'none';
        }
        this.pauseEl.style.display = this.paused ? 'flex' : 'none';
        this.updateHUD();
    }

    getUpgradeStats() {
        const u = this.dataManager.state.upgrades;
        return {
            baseDrive: 480 + (u.engine - 1) * 95,
            runAccel: 380 + (u.engine - 1) * 75,
            dashThrust: 1350 + (u.engine - 1) * 240,
            groundDragCoeff: Math.max(0.005, 0.040 / (1 + (u.engine - 1) * 0.15)),
            maxEnergy: 100 + (u.fuel - 1) * 28,
            energyEfficiency: 1 / (1 + (u.fuel - 1) * 0.12),
            pumpMultiplier: 1 + (u.traction - 1) * 0.15,
            dashRechargeRate: 14 + (u.traction - 1) * 3.2
        };
    }

    startEndless() {
        this.raceMode = 'endless';
        this.currentRivalSpec = null;
        this.reset();
        this.active = true;
        this.paused = false;
        this.introDuration = 3.0;
        this.countdownTimer = 3.0;
        this.lastCountdownSec = 4;
        this.hudEl.style.display = 'flex';
        this.pauseEl.style.display = 'none';
        this.raceProgressWrapEl.style.display = 'none';
        this.gameOverEl.style.display = 'none';
        this.scrapEl.style.display = 'block';
        this.modeLabelEl.textContent = 'ENDLESS';
    }

    startSandbox() {
        this.raceMode = 'sandbox';
        this.currentRivalSpec = null;
        this.reset();
        this.active = true;
        this.paused = false;
        this.countdownTimer = 2.6;
        this.lastCountdownSec = 4;
        this.hudEl.style.display = 'flex';
        this.pauseEl.style.display = 'none';
        this.raceProgressWrapEl.style.display = 'none';
        this.gameOverEl.style.display = 'none';
        this.scrapEl.style.display = 'none';
        this.modeLabelEl.textContent = 'SANDBOX';
    }

    startStoryRace(rivalSpec) {
        this.raceMode = 'story';
        this.currentRivalSpec = rivalSpec;
        this.rivalRig.generatePresetTextures(rivalSpec.colors);
        this.reset();
        this.active = true;
        this.paused = false;
        this.countdownTimer = 2.6;
        this.lastCountdownSec = 4;
        this.hudEl.style.display = 'flex';
        this.pauseEl.style.display = 'none';
        this.raceProgressWrapEl.style.display = 'block';
        this.raceStageLabelEl.textContent = rivalSpec.stageName.toUpperCase();
        this.raceRivalLabelEl.textContent = `VS ${rivalSpec.name.toUpperCase()}`;
        this.gameOverEl.style.display = 'none';
        this.scrapEl.style.display = 'block';
        this.modeLabelEl.textContent = `VERSUS ${rivalSpec.distanceMeters}m`;
    }

    stop() {
        this.active = false;
        this.finishing = false;
        this.paused = false;
        this.isDiving = false;
        this.isDashing = false;
        this.isBoostingNow = false;
        document.getElementById('pedal-lean')?.classList.remove('pressed');
        document.getElementById('pedal-boost')?.classList.remove('pressed');
        if (this.soundManager) this.soundManager.updateRunnerAudio(0, 0, false, false, false);
        this.hudEl.style.display = 'none';
        this.pauseEl.style.display = 'none';
        this.gameOverEl.style.display = 'none';
        this.alertBannerEl.style.display = 'none';
        if (this.stallWarnEl) this.stallWarnEl.style.display = 'none';
        this.updateHUD();
    }

    // Fast deterministic integer hash for glitch-free parallax & procedural details
    hashInt(n) {
        let x = (n | 0) + 0x9e3779b9;
        x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
        x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
        return (x ^ (x >>> 16)) >>> 0;
    }

    // Generates the next random Biome span according to exact meter specifications
    queueNextBiome(startX) {
        const choices = ['city', 'desert', 'forest', 'mountains', 'beach_ocean'];
        const lastMain = this.lastMainBiome || null;
        const pool = lastMain ? choices.filter(b => b !== lastMain) : choices;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        this.lastMainBiome = picked;

        if (picked === 'city') {
            const lenMeters = 1000 + Math.random() * 4000; // 1,000 - 5,000m
            const lenPx = lenMeters * PIXELS_PER_METER;
            this.biomeSpans.push({ startX, endX: startX + lenPx, biome: 'city' });
            return startX + lenPx;
        } else if (picked === 'desert') {
            const lenMeters = 10000 + Math.random() * 10000; // 10,000 - 20,000m
            const lenPx = lenMeters * PIXELS_PER_METER;
            this.biomeSpans.push({ startX, endX: startX + lenPx, biome: 'desert' });
            return startX + lenPx;
        } else if (picked === 'forest') {
            const lenMeters = 5000 + Math.random() * 5000; // 5,000 - 10,000m
            const lenPx = lenMeters * PIXELS_PER_METER;
            this.biomeSpans.push({ startX, endX: startX + lenPx, biome: 'forest' });
            return startX + lenPx;
        } else if (picked === 'mountains') {
            const lenMeters = 7500 + Math.random() * 7500; // 7,500 - 15,000m
            const lenPx = lenMeters * PIXELS_PER_METER;
            this.biomeSpans.push({ startX, endX: startX + lenPx, biome: 'mountains' });
            return startX + lenPx;
        } else {
            // Beach & Ocean: 5,000 - 10,000m total (starts and ends with short sandy beach, ocean in the middle)
            const totalMeters = 5000 + Math.random() * 5000;
            const startBeachMeters = Math.min(1100, Math.max(650, totalMeters * 0.14));
            const endBeachMeters = Math.min(1100, Math.max(650, totalMeters * 0.14));
            const oceanMeters = Math.max(2500, totalMeters - startBeachMeters - endBeachMeters);

            const b1Px = startBeachMeters * PIXELS_PER_METER;
            const ocPx = oceanMeters * PIXELS_PER_METER;
            const b2Px = endBeachMeters * PIXELS_PER_METER;

            this.biomeSpans.push({ startX, endX: startX + b1Px, biome: 'beach' });
            this.biomeSpans.push({ startX: startX + b1Px, endX: startX + b1Px + ocPx, biome: 'ocean' });
            this.biomeSpans.push({ startX: startX + b1Px + ocPx, endX: startX + b1Px + ocPx + b2Px, biome: 'beach' });
            return startX + b1Px + ocPx + b2Px;
        }
    }

    ensureBiomeSpans(targetX) {
        if (!this.biomeSpans || this.biomeSpans.length === 0) {
            this.biomeSpans = [];
            this.lastMainBiome = null;
            if (this.raceMode === 'sandbox') {
                this.biomeSpans.push({ startX: -50000, endX: 1e9, biome: 'city' });
                return;
            }
            let curX = -50000;
            const firstEnd = this.queueNextBiome(0);
            this.biomeSpans[0].startX = curX;
            curX = firstEnd;
            while (curX < targetX) {
                curX = this.queueNextBiome(curX);
            }
            return;
        }
        let lastEnd = this.biomeSpans[this.biomeSpans.length - 1].endX;
        while (lastEnd < targetX) {
            lastEnd = this.queueNextBiome(lastEnd);
        }
        if (this.biomeSpans.length > 40) {
            const minKeepX = (this.worldX || 0) - 60000;
            this.biomeSpans = this.biomeSpans.filter(b => b.endX > minKeepX);
        }
    }

    getBiomeAt(x) {
        if (this.raceMode === 'sandbox') return 'city';
        if (!this.biomeSpans || this.biomeSpans.length === 0) this.ensureBiomeSpans(x + 50000);
        const last = this.biomeSpans[this.biomeSpans.length - 1];
        if (x >= last.endX) this.ensureBiomeSpans(x + 100000);
        for (let i = 0; i < this.biomeSpans.length; i++) {
            const b = this.biomeSpans[i];
            if (x >= b.startX && x <= b.endX) return b.biome;
        }
        return this.biomeSpans[0]?.biome || 'city';
    }

    reset() {
        this.finishing = false;
        this.isDiving = false;
        this.isDashing = false;
        this.isBoostingNow = false;
        this.isDashRecharging = false;
        this.airborneTime = 0;
        this.boostTrailVisibility = 0;
        document.getElementById('pedal-lean')?.classList.remove('pressed');
        document.getElementById('pedal-boost')?.classList.remove('pressed');
        if (this.alertBannerEl) this.alertBannerEl.style.display = 'none';
        if (this.stallWarnEl) this.stallWarnEl.style.display = 'none';
        const stats = this.getUpgradeStats();

        this.biomeSpans = [];
        this.lastMainBiome = null;
        this.forceMountainDropNext = false;
        this.cloudDrift = 0;
        this.ensureBiomeSpans(150000);

        const startBiome = this.getBiomeAt(0);
        this.segments = [
            { startX: -3000, endX: 1800, startY: 440, endY: 440, type: 'flat_highway', amp: 0, freq: 1, biome: startBiome }
        ];
        this.next10kMilestoneMeters = 10000;
        this.ensureTerrainSegments(30000);

        this.worldX = 0;
        this.y = this.getTerrainY(0);
        this.vx = 0;
        this.vy = 0;
        this.grounded = true;

        this.maxEnergy = stats.maxEnergy;
        this.adrenaline = this.maxEnergy;
        this.dashCharge = 100;
        this.runScrap = 0;
        this.peakSpeedMs = 0;
        this.speedTier = 1;
        this.isDrafting = false;
        this.countdownTimer = 2.6;
        this.lastCountdownSec = 4;

        this.isExhausted = false;
        this.preDrainPaceVx = 460;
        this.targetPaceVx = 0;
        this.paceRecoveryTimer = 0;
        this.lastPaceTickSec = 0;
        this.stopTimer = 0;
        this.lastStopTickSec = 0;
        this.sonicAlertTimer = 0;
        this.straightZoneAlertTimer = 0;

        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.sonicBoomFlash = 0;
        this.tier2SkyBlend = 0;
        this.tier3SkyBlend = 0;
        this.tier4SkyBlend = 0;
        this.cameraZoom = 1.0;

        if (this.raceMode === 'story' && this.currentRivalSpec) {
            this.finishWorldX = this.currentRivalSpec.distanceMeters * PIXELS_PER_METER;
            this.ensureTerrainSegments(this.finishWorldX + 10000);
            this.rival = {
                x: 0,
                y: this.getTerrainY(0),
                vx: 0,
                vy: 0,
                grounded: true,
                dashTimer: 0
            };
        } else {
            this.finishWorldX = Infinity;
            this.rival = null;
        }

        this.items = [];
        this.props = [];
        this.particles = [];
        this.shockwaves = [];
        this.afterimages = [];

        // Pre-spawn obstacles & items BEFORE the 3-2-1-Go countdown so nothing pops in when the countdown ends!
        this.nextSpawnX = 320;
        if (this.raceMode !== 'sandbox') {
            while (this.nextSpawnX < 18000) {
                this.spawnWorldChunk(this.nextSpawnX, this.nextSpawnX + 4500);
                this.nextSpawnX += 4500;
            }
        }
    }

    ensureTerrainSegments(targetX) {
        this.ensureBiomeSpans(targetX + 60000);
        let lastSeg = this.segments[this.segments.length - 1];

        while (lastSeg.endX < targetX) {
            if (this.raceMode === 'sandbox') {
                const flatSeg = {
                    startX: lastSeg.endX,
                    endX: lastSeg.endX + 10000,
                    startY: 440,
                    endY: 440,
                    type: 'flat_highway',
                    amp: 0,
                    freq: 1,
                    biome: 'city'
                };
                this.segments.push(flatSeg);
                lastSeg = flatSeg;
                continue;
            }

            const segStartX = lastSeg.endX;
            const biome = this.getBiomeAt(segStartX + 100);
            const span = this.biomeSpans.find(b => segStartX >= b.startX && segStartX < b.endX);
            const maxRemainingInBiome = span ? Math.max(1200, span.endX - segStartX) : 8000;

            const milestoneWorldX = this.next10kMilestoneMeters * PIXELS_PER_METER;
            if (this.raceMode === 'endless' && segStartX >= milestoneWorldX - 4000) {
                const straightSeg = {
                    startX: segStartX,
                    endX: segStartX + 30000,
                    startY: lastSeg.endY,
                    endY: lastSeg.endY,
                    type: 'proving_straight_10k',
                    milestoneMeters: this.next10kMilestoneMeters,
                    amp: 0,
                    freq: 1,
                    biome
                };
                this.segments.push(straightSeg);
                lastSeg = straightSeg;
                this.next10kMilestoneMeters += 10000;
                continue;
            }

            let type = 'flat_highway';
            let length = 3000 + Math.random() * 3000;
            let deltaY = 0;
            let amp = 0;
            let freq = 1;

            if (biome === 'ocean') {
                // Ocean water area is 100% completely flat
                type = 'flat_highway';
                length = Math.min(maxRemainingInBiome, 4500 + Math.random() * 4000);
                deltaY = 0;
                amp = 0;
            } else if (biome === 'city' || biome === 'forest' || biome === 'beach') {
                // Uncommon slopes: mostly flat-ish with small to moderate uphills and downhills
                const roll = Math.random();
                if (roll < 0.62) {
                    type = 'flat_highway';
                    length = 3200 + Math.random() * 3400;
                    deltaY = 0;
                    amp = 0;
                } else if (roll < 0.78) {
                    type = 'rolling_sine';
                    length = 3000 + Math.random() * 2600;
                    deltaY = (Math.random() - 0.48) * 95;
                    amp = 42 + Math.random() * 58;
                    freq = 1 + Math.floor(Math.random() * 2);
                } else if (roll < 0.90) {
                    type = 'mega_drop';
                    length = 2400 + Math.random() * 2000;
                    deltaY = 95 + Math.random() * 135;
                    amp = 35 + Math.random() * 45;
                } else {
                    type = 'uphill_climb';
                    length = 2200 + Math.random() * 1800;
                    deltaY = -(80 + Math.random() * 110);
                    amp = 30 + Math.random() * 40;
                }
                length = Math.min(length, maxRemainingInBiome);
            } else if (biome === 'desert') {
                // Desert: Common slopes, many deep downhills & inclines, moderate up/down hills, large hills
                const roll = Math.random();
                if (roll < 0.14) {
                    type = 'flat_highway';
                    length = 2800 + Math.random() * 2400;
                } else if (roll < 0.42) {
                    type = 'mega_drop';
                    length = 3000 + Math.random() * 2600;
                    deltaY = 380 + Math.random() * 480;
                    amp = 110 + Math.random() * 110;
                } else if (roll < 0.64) {
                    type = 'rolling_sine';
                    length = 4200 + Math.random() * 3400;
                    deltaY = (Math.random() - 0.42) * 260;
                    amp = 165 + Math.random() * 175;
                    freq = 2 + Math.floor(Math.random() * 2);
                } else if (roll < 0.82) {
                    type = 'ski_ramp';
                    length = 2600 + Math.random() * 2200;
                    deltaY = 160 + Math.random() * 220;
                    amp = 230 + Math.random() * 160;
                } else if (roll < 0.92) {
                    type = 'canyon_bowl';
                    length = 3400 + Math.random() * 2600;
                    deltaY = 80 + Math.random() * 140;
                    amp = 290 + Math.random() * 220;
                } else {
                    type = 'uphill_climb';
                    length = 2400 + Math.random() * 2000;
                    deltaY = -(210 + Math.random() * 250);
                    amp = 75 + Math.random() * 65;
                }
                length = Math.min(length, maxRemainingInBiome);
            } else if (biome === 'mountains') {
                // Mountains: Steep inclines ALWAYS accompanied by deep downhills, plus large hills & deep drops
                if (this.forceMountainDropNext) {
                    this.forceMountainDropNext = false;
                    type = 'mega_drop';
                    length = 3200 + Math.random() * 2600;
                    deltaY = 520 + Math.random() * 580;
                    amp = 145 + Math.random() * 130;
                } else {
                    const roll = Math.random();
                    if (roll < 0.10) {
                        type = 'flat_highway';
                        length = 2400 + Math.random() * 2000;
                    } else if (roll < 0.36) {
                        // Steep incline accompanied immediately by a deep downhill on the next segment
                        type = 'uphill_climb';
                        length = 2300 + Math.random() * 1700;
                        deltaY = -(340 + Math.random() * 340);
                        amp = 95 + Math.random() * 85;
                        this.forceMountainDropNext = true;
                    } else if (roll < 0.62) {
                        type = 'mega_drop';
                        length = 3000 + Math.random() * 2600;
                        deltaY = 440 + Math.random() * 520;
                        amp = 135 + Math.random() * 120;
                    } else if (roll < 0.82) {
                        type = 'rolling_sine';
                        length = 4200 + Math.random() * 3400;
                        deltaY = (Math.random() - 0.38) * 320;
                        amp = 220 + Math.random() * 220;
                        freq = 2 + Math.floor(Math.random() * 2);
                    } else {
                        type = 'canyon_bowl';
                        length = 3400 + Math.random() * 2800;
                        deltaY = 120 + Math.random() * 180;
                        amp = 340 + Math.random() * 250;
                    }
                }
                length = Math.min(length, maxRemainingInBiome);
            }

            const newSeg = {
                startX: segStartX,
                endX: segStartX + length,
                startY: lastSeg.endY,
                endY: lastSeg.endY + deltaY,
                type,
                amp,
                freq,
                biome
            };
            this.segments.push(newSeg);
            lastSeg = newSeg;
        }

        if (this.segments.length > 60) {
            this.segments = this.segments.filter(s => s.endX > (this.worldX || 0) - 15000);
        }
    }

    getSegmentAt(x) {
        for (let i = 0; i < this.segments.length; i++) {
            const s = this.segments[i];
            if (x >= s.startX && x <= s.endX) return s;
        }
        return this.segments[this.segments.length - 1] || this.segments[0];
    }

    getTerrainY(x) {
        if (x <= this.segments[0].startX) return this.segments[0].startY;
        const last = this.segments[this.segments.length - 1];
        if (x >= last.endX) {
            this.ensureTerrainSegments(x + 25000);
        }

        const seg = this.getSegmentAt(x);
        const span = Math.max(1, seg.endX - seg.startX);
        const t = Math.max(0, Math.min(1, (x - seg.startX) / span));
        const smoothT = t * t * (3 - 2 * t);
        const baseLine = seg.startY + (seg.endY - seg.startY) * smoothT;
        const windowEnv = Math.sin(t * Math.PI);
        const c1Window = windowEnv * windowEnv;

        if (seg.type === 'flat_highway' || seg.type === 'proving_straight_10k') {
            return baseLine;
        } else if (seg.type === 'mega_drop') {
            return baseLine + Math.sin(t * Math.PI * 2) * seg.amp * c1Window;
        } else if (seg.type === 'ski_ramp') {
            return baseLine + Math.sin(t * Math.PI * 1.65) * seg.amp * c1Window;
        } else if (seg.type === 'rolling_sine') {
            return baseLine + Math.sin(t * Math.PI * 2 * seg.freq) * seg.amp * c1Window;
        } else if (seg.type === 'canyon_bowl') {
            return baseLine + seg.amp * c1Window;
        } else if (seg.type === 'uphill_climb') {
            return baseLine - Math.sin(t * Math.PI) * seg.amp * c1Window;
        }
        return baseLine;
    }

    getTerrainSlope(x) {
        return (this.getTerrainY(x + 4) - this.getTerrainY(x - 4)) / 8;
    }

    isFlatSection(x) {
        return Math.abs(this.getTerrainSlope(x)) < 0.018;
    }

    createBiomeObstacle(px, ty, slope, biome) {
        const BIOME_OBSTACLES = {
            city: ['car', 'lamp_post', 'dumpster', 'bush', 'tree'],
            desert: ['dead_bush', 'cactus'],
            forest: ['bush', 'tree', 'fallen_log', 'tall_grass'],
            mountains: ['bush', 'tree', 'snow_pile'],
            beach: ['beach_umbrella', 'lifeguard_post', 'fallen_coconut', 'sun_chair'],
            ocean: []
        };
        const pool = BIOME_OBSTACLES[biome] || [];
        if (pool.length === 0) return null;

        const kind = pool[Math.floor(Math.random() * pool.length)];
        const variant = Math.floor(Math.random() * 1000);

        const specs = {
            car:              { w: 345, h: 164, debris: ['#3b82f6', '#ef4444', '#e2e8f0', '#1e293b'] },
            lamp_post:        { w: 85,  h: 390, debris: ['#475569', '#94a3b8', '#fef08a'] },
            dumpster:         { w: 185, h: 142, debris: ['#15803d', '#1e293b', '#64748b'] },
            bush:             { w: 168, h: 115, debris: biome === 'mountains' ? ['#f8fafc', '#15803d', '#166534'] : ['#22c55e', '#15803d', '#4ade80'] },
            tree:             { w: 260, h: 440, debris: biome === 'mountains' ? ['#f8fafc', '#166534', '#5c3a21'] : ['#16a34a', '#15803d', '#78350f'] },
            dead_bush:        { w: 150, h: 112, debris: ['#92400e', '#78350f', '#b45309'] },
            cactus:           { w: 142, h: 310, debris: ['#15803d', '#22c55e', '#bbf7d0'] },
            fallen_log:       { w: 285, h: 112, debris: ['#5c3a21', '#78350f', '#22c55e'] },
            tall_grass:       { w: 170, h: 108, debris: ['#22c55e', '#4ade80', '#15803d'] },
            snow_pile:        { w: 225, h: 115, debris: ['#ffffff', '#e2e8f0', '#cbd5e1'] },
            beach_umbrella:   { w: 235, h: 285, debris: ['#ef4444', '#ffffff', '#38bdf8', '#facc15'] },
            lifeguard_post:   { w: 245, h: 395, debris: ['#f8fafc', '#ef4444', '#d97706'] },
            fallen_coconut:   { w: 96,  h: 72,  debris: ['#5c3a21', '#3f2716', '#f8fafc'] },
            sun_chair:        { w: 195, h: 105, debris: ['#38bdf8', '#f8fafc', '#f97316'] }
        };

        const s = specs[kind] || specs.bush;
        return {
            x: px,
            y: ty,
            slope,
            w: s.w,
            h: s.h,
            kind,
            biome,
            variant,
            debrisColors: s.debris,
            color: s.debris[0],
            neon: s.debris[1] || s.debris[0],
            shattered: false
        };
    }

    spawnWorldChunk(startX, endX) {
        if (this.raceMode === 'sandbox') return;
        this.ensureTerrainSegments(endX + 10000);

        let x = startX;
        while (x < endX) {
            const step = 900 + Math.random() * 650;
            x += step;
            if (this.raceMode === 'story' && x > this.finishWorldX - 200) break;

            const ty = this.getTerrainY(x);
            const roll = Math.random();

            if (roll < 0.46) {
                this.items.push({ x, y: ty - 48, type: 'cell', collected: false });
            } else if (roll < 0.85) {
                this.items.push({ x, y: ty - 58, type: 'scrap', collected: false });
            } else {
                this.items.push({ x, y: ty - 68, type: 'module', collected: false });
            }
        }

        for (let px = startX; px < endX; px += 620 + Math.random() * 480) {
            if (this.raceMode === 'story' && px > this.finishWorldX - 250) break;
            const seg = this.getSegmentAt(px);
            const biome = seg?.biome || this.getBiomeAt(px);
            // Ocean water area has zero obstacles
            if (biome === 'ocean') continue;

            const ty = this.getTerrainY(px);
            const slope = this.getTerrainSlope(px);
            const obs = this.createBiomeObstacle(px, ty, slope, biome);
            if (obs) this.props.push(obs);
        }
    }

    spawnDebris(x, y, color, count = 14) {
        if (this.dataManager.state.settings?.particles === false) return;
        const cappedCount = Math.min(count, 10);
        while (this.particles.length + cappedCount > 180) {
            this.particles.shift();
        }
        for (let i = 0; i < cappedCount; i++) {
            const angle = -Math.PI * Math.random();
            const speed = 220 + Math.random() * 520;
            this.particles.push({
                x,
                y: y - Math.random() * 60,
                vx: Math.cos(angle) * speed + this.vx * 0.35,
                vy: Math.sin(angle) * speed - 150,
                size: 6 + Math.random() * 14,
                rot: Math.random() * Math.PI,
                vRot: (Math.random() - 0.5) * 12,
                color,
                shape: 'rect',
                gravity: 900,
                decay: 1.4,
                life: 1.0
            });
        }
    }

    // Triggers biome-accurate footstep splash trails synced to stride cadence & scaled with speed
    updateFootstepSplash(dt) {
        if (this.dataManager.state.settings?.particles === false) return;
        if (!this.grounded || this.vx < 35) return;

        // Step interval shortens as speed increases (matches running cadence)
        const stepInterval = Math.max(0.032, 0.22 - Math.min(0.18, (this.vx / 5500) * 0.18));
        this.stepSplashTimer = (this.stepSplashTimer || 0) - dt;
        if (this.stepSplashTimer <= 0) {
            this.stepSplashTimer = stepInterval;
            const seg = this.getSegmentAt(this.worldX);
            const biome = seg?.biome || this.getBiomeAt(this.worldX);
            this.spawnFootstepSplash(this.worldX, this.y, biome);
        }
    }

    spawnFootstepSplash(x, y, biome) {
        const speedMs = this.vx / 10;
        // Intensity scales continuously from 0.6x at low speed up to 4.2x at high speeds
        const intensity = Math.min(4.2, 0.55 + Math.pow(speedMs / 260, 0.85));

        let colors, baseCount, sizeRange, upVel, backVel, gravity, growRate, decay, shapeMode;

        if (biome === 'ocean') {
            // Huge splashes of water & foam plumes shooting up and behind the runner
            colors = ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#ffffff'];
            baseCount = Math.min(20, Math.round(6 + intensity * 3.8));
            sizeRange = [10 * Math.min(2.2, intensity * 0.85), 24 * Math.min(2.4, intensity * 0.95)];
            upVel = [180 * intensity, 440 * intensity];
            backVel = [140 * intensity, 380 * intensity];
            gravity = 980;
            growRate = 28 * Math.min(2, intensity * 0.7);
            decay = 1.35;
            shapeMode = 'circle';
        } else if (biome === 'city') {
            // Compact little dust clouds puffing behind the heels on city pavement
            colors = ['rgba(203, 213, 225, 0.82)', 'rgba(148, 163, 184, 0.78)', 'rgba(226, 232, 240, 0.85)'];
            baseCount = Math.min(10, Math.round(2 + intensity * 1.6));
            sizeRange = [7 * Math.min(1.7, 0.7 + intensity * 0.3), 15 * Math.min(1.8, 0.7 + intensity * 0.35)];
            upVel = [28 * intensity, 95 * intensity];
            backVel = [65 * intensity, 175 * intensity];
            gravity = 160; // Low gravity so dust clouds float and billow
            growRate = 22 * Math.min(1.8, 0.6 + intensity * 0.4);
            decay = 1.85;
            shapeMode = 'circle';
        } else if (biome === 'forest') {
            // Brown cloud of dirt & soil clods kicked up behind the runner
            colors = ['#78350f', '#92400e', '#5c3a21', '#a16207', '#451a03'];
            baseCount = Math.min(14, Math.round(4 + intensity * 2.4));
            sizeRange = [9 * Math.min(1.9, 0.75 + intensity * 0.4), 20 * Math.min(2.0, 0.75 + intensity * 0.45)];
            upVel = [65 * intensity, 210 * intensity];
            backVel = [95 * intensity, 260 * intensity];
            gravity = 460;
            growRate = 26 * Math.min(1.9, 0.7 + intensity * 0.45);
            decay = 1.55;
            shapeMode = 'mixed';
        } else if (biome === 'desert' || biome === 'beach') {
            // Golden/amber sand spray & sandy plumes thrown up behind the runner
            colors = ['#fde047', '#fbbf24', '#f59e0b', '#d97706', '#fef08a'];
            baseCount = Math.min(16, Math.round(4 + intensity * 2.8));
            sizeRange = [6 * Math.min(1.8, 0.75 + intensity * 0.38), 16 * Math.min(1.9, 0.75 + intensity * 0.42)];
            upVel = [85 * intensity, 260 * intensity];
            backVel = [110 * intensity, 310 * intensity];
            gravity = 760;
            growRate = 18 * Math.min(1.8, 0.6 + intensity * 0.4);
            decay = 1.5;
            shapeMode = 'mixed';
        } else {
            // Mountains: Snowy powder puffs & ice crystals
            colors = ['#ffffff', '#f8fafc', '#e2e8f0', '#bae6fd'];
            baseCount = Math.min(14, Math.round(4 + intensity * 2.4));
            sizeRange = [8 * Math.min(1.9, 0.75 + intensity * 0.4), 18 * Math.min(2.0, 0.75 + intensity * 0.45)];
            upVel = [70 * intensity, 220 * intensity];
            backVel = [95 * intensity, 260 * intensity];
            gravity = 420;
            growRate = 24 * Math.min(1.8, 0.7 + intensity * 0.4);
            decay = 1.55;
            shapeMode = 'circle';
        }

        while (this.particles.length + baseCount > 180) {
            this.particles.shift();
        }

        const slope = this.getTerrainSlope(x);
        for (let i = 0; i < baseCount; i++) {
            const kickBack = backVel[0] + Math.random() * (backVel[1] - backVel[0]);
            const kickUp = upVel[0] + Math.random() * (upVel[1] - upVel[0]);
            const sz = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
            const isCircle = shapeMode === 'circle' || (shapeMode === 'mixed' && i % 3 !== 0);

            this.particles.push({
                x: x - 14 - Math.random() * 24,
                y: y - 2 - Math.random() * 10,
                // Carries a portion of forward velocity minus backward foot-kick so the splash trails behind you
                vx: this.vx * 0.52 - kickBack,
                vy: -kickUp + slope * this.vx * 0.25,
                size: sz,
                growRate: isCircle ? growRate : 0,
                gravity,
                decay: decay * (0.85 + Math.random() * 0.3),
                rot: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: isCircle ? 'circle' : 'rect',
                life: 0.85 + Math.random() * 0.2
            });
        }
    }

    // Distinct Tier 3 Overdrive Surge (501 m/s)
    triggerTier3Surge(x, y) {
        if (this.soundManager) {
            this.soundManager.playSfx('tier3', 1.0, 0.95);
        }
        if (this.dataManager.state.settings?.screenShake !== false) {
            this.shakeTimer = 0.45;
            this.shakeIntensity = 13;
        }
        this.sonicBoomFlash = 0.65;
        this.sonicAlertTimer = 2.4;
        this.shockwaves.push({ x, y, radius: 14, maxRadius: 720, alpha: 0.95, color: '244, 63, 94', width: 10 });
        this.shockwaves.push({ x: x - 20, y, radius: 28, maxRadius: 580, alpha: 0.85, color: '56, 189, 248', width: 8 });
        this.spawnDebris(x, y, '#f43f5e', 14);
    }

    // Full Supersonic Boom Detonation (650+ m/s)
    triggerSonicBoom(x, y) {
        if (this.soundManager) {
            this.soundManager.playSfx('sonic_boom', 1.0, 1.0);
        }
        if (this.dataManager.state.settings?.screenShake !== false) {
            this.shakeTimer = 0.65;
            this.shakeIntensity = 18;
        }
        this.sonicBoomFlash = 0.85;
        this.sonicAlertTimer = 2.8;

        this.shockwaves.push({ x, y, radius: 12, maxRadius: 950, alpha: 1.0, color: '255, 255, 255', width: 14 });
        this.shockwaves.push({ x: x - 18, y, radius: 28, maxRadius: 780, alpha: 0.9, color: '56, 189, 248', width: 9 });
        this.shockwaves.push({ x: x - 35, y, radius: 42, maxRadius: 620, alpha: 0.85, color: '244, 63, 94', width: 7 });
        this.spawnDebris(x, y, '#ffffff', 22);
        this.spawnDebris(x, y, '#38bdf8', 16);
    }

    // 1500+ m/s Meteorite Fire Cone Ignition (No screen flash)
    triggerFireCone(x, y) {
        if (this.soundManager) {
            this.soundManager.playSfx('fire_cone', 1.0, 1.0);
        }
        if (this.dataManager.state.settings?.screenShake !== false) {
            this.shakeTimer = 0.55;
            this.shakeIntensity = 14;
        }
        this.sonicAlertTimer = 2.6;

        this.shockwaves.push({ x, y, radius: 14, maxRadius: 1100, alpha: 0.9, color: '254, 240, 138', width: 14 });
        this.shockwaves.push({ x, y, radius: 30, maxRadius: 920, alpha: 0.85, color: '249, 115, 22', width: 10 });
        this.spawnDebris(x, y, '#facc15', 14);
        this.spawnDebris(x, y, '#f97316', 14);
    }

    // 1800+ m/s Hypersonic Tier Breakthrough (Triggers Screen Flash + Shockwaves!)
    triggerHypersonic(x, y) {
        if (this.soundManager) {
            this.soundManager.playSfx('sonic_boom', 1.2, 1.0);
        }
        if (this.dataManager.state.settings?.screenShake !== false) {
            this.shakeTimer = 0.75;
            this.shakeIntensity = 20;
        }
        this.sonicBoomFlash = 0.92;
        this.sonicAlertTimer = 3.0;

        this.shockwaves.push({ x, y, radius: 16, maxRadius: 1200, alpha: 1.0, color: '255, 255, 255', width: 16 });
        this.shockwaves.push({ x: x - 24, y, radius: 34, maxRadius: 980, alpha: 0.95, color: '56, 189, 248', width: 12 });
        this.shockwaves.push({ x: x - 48, y, radius: 52, maxRadius: 820, alpha: 0.9, color: '250, 204, 21', width: 9 });
        this.spawnDebris(x, y, '#ffffff', 20);
        this.spawnDebris(x, y, '#38bdf8', 18);
    }

    update(dt) {
        if (!this.active || this.paused) return;

        // Post-Run Coast-to-Halt State: Game keeps running while character slows down to Idle!
        if (this.finishing) {
            this.isDiving = false;
            this.isDashing = false;
            this.isBoostingNow = false;

            while (this.raceMode !== 'sandbox' && this.worldX + 16000 > this.nextSpawnX) {
                this.spawnWorldChunk(this.nextSpawnX, this.nextSpawnX + 4500);
                this.nextSpawnX += 4500;
            }

            if (this.grounded) {
                // Smoothly decelerate to a complete stop on the track
                const decel = 540 + this.vx * 1.45;
                this.vx = Math.max(0, this.vx - decel * dt);
                this.worldX += this.vx * dt;
                this.y = this.getTerrainY(this.worldX);
                this.vy = this.getTerrainSlope(this.worldX) * this.vx;
            } else {
                this.vx = Math.max(0, this.vx - this.vx * 0.65 * dt);
                this.vy += 900 * dt;
                this.worldX += this.vx * dt;
                this.y += this.vy * dt;
                const groundY = this.getTerrainY(this.worldX);
                if (this.y >= groundY) {
                    this.y = groundY;
                    this.grounded = true;
                    this.vy = 0;
                }
            }

            if (this.vx >= TIER_4_VX) {
                this.speedTier = 4;
                this.tier2SkyBlend = Math.min(1, this.tier2SkyBlend + dt * 1.8);
                this.tier3SkyBlend = Math.min(1, this.tier3SkyBlend + dt * 1.8);
                this.tier4SkyBlend = Math.min(1, this.tier4SkyBlend + dt * 1.8);
            } else if (this.vx >= TIER_3_VX) {
                this.speedTier = 3;
                this.tier2SkyBlend = Math.min(1, this.tier2SkyBlend + dt * 1.8);
                this.tier3SkyBlend = Math.min(1, this.tier3SkyBlend + dt * 1.8);
                this.tier4SkyBlend = Math.max(0, this.tier4SkyBlend - dt * 1.8);
            } else if (this.vx >= TIER_2_VX) {
                this.speedTier = 2;
                this.tier2SkyBlend = Math.min(1, this.tier2SkyBlend + dt * 1.8);
                this.tier3SkyBlend = Math.max(0, this.tier3SkyBlend - dt * 1.8);
                this.tier4SkyBlend = Math.max(0, this.tier4SkyBlend - dt * 1.8);
            } else {
                this.speedTier = 1;
                this.tier2SkyBlend = Math.max(0, this.tier2SkyBlend - dt * 1.8);
                this.tier3SkyBlend = Math.max(0, this.tier3SkyBlend - dt * 1.8);
                this.tier4SkyBlend = Math.max(0, this.tier4SkyBlend - dt * 1.8);
            }

            // Transition animation from Sonic -> Run -> Idle as character comes to a halt
            if (!this.grounded) {
                this.rig.animState = 'air';
                this.rig.update(dt);
            } else if (this.vx > 950) {
                this.rig.animState = 'sonic';
                this.rig.update(dt * (this.vx / 380));
            } else if (this.vx > 22) {
                this.rig.animState = 'run';
                this.rig.update(dt * Math.max(0.55, this.vx / 380));
            } else {
                this.vx = 0;
                this.rig.animState = 'idle';
                this.rig.update(dt);
            }

            if (this.raceMode === 'story' && this.rival && this.currentRivalSpec) {
                this.rival.vx = Math.max(0, this.rival.vx - (480 + this.rival.vx * 1.2) * dt);
                this.rival.x += this.rival.vx * dt;
                this.rival.y = this.getTerrainY(this.rival.x);
                this.rivalRig.animState = this.rival.vx > 25 ? 'run' : 'idle';
                this.rivalRig.update(dt * (this.rival.vx > 25 ? Math.max(0.55, this.rival.vx / 380) : 1.0));
            }

            this.updateFootstepSplash(dt);

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += (p.gravity ?? 900) * dt;
                if (p.growRate) p.size += p.growRate * dt;
                p.rot += p.vRot * dt;
                p.life -= dt * (p.decay ?? 1.4);
                if (p.life <= 0) this.particles.splice(i, 1);
            }
            for (let i = this.afterimages.length - 1; i >= 0; i--) {
                this.afterimages[i].alpha -= dt * 2.4;
                if (this.afterimages[i].alpha <= 0) this.afterimages.splice(i, 1);
            }
            for (let i = this.shockwaves.length - 1; i >= 0; i--) {
                const sw = this.shockwaves[i];
                sw.radius += 1150 * dt;
                sw.alpha -= dt * 1.65;
                if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
            }
            if (this.shakeTimer > 0) this.shakeTimer -= dt;
            if (this.sonicBoomFlash > 0) this.sonicBoomFlash = Math.max(0, this.sonicBoomFlash - dt * 2.2);

            const speedAboveBase = Math.max(0, this.vx - 500);
            const targetZoom = Math.max(0.58, 1.0 - Math.min(0.42, (speedAboveBase / 7500) * 0.42));
            this.cameraZoom += (targetZoom - this.cameraZoom) * Math.min(1, dt * 4.2);

            if (this.soundManager) {
                this.soundManager.updateRunnerAudio(dt, this.vx, this.grounded, false, this.vx > 25);
            }
            this.updateHUD();
            return;
        }

        // 3-2-1-GO Launch Sequence (Sonic Rush Slow-Mo Silhouette Intro in Endless Mode)
        if (this.countdownTimer > 0) {
            this.isDiving = false;
            this.isDashing = false;
            this.isBoostingNow = false;
            this.countdownTimer -= dt;
            this.countdownEl.style.display = 'block';
            const sec = Math.ceil(this.countdownTimer);
            if (sec !== this.lastCountdownSec) {
                this.lastCountdownSec = sec;
                if (this.soundManager) {
                    this.soundManager.playSfx(sec > 0 ? 'countdown_tick' : 'countdown_go', 1.0, 0.9);
                }
            }
            const labelText = sec > 0 ? String(sec) : 'GO!';
            if (this.countdownNumEl) this.countdownNumEl.textContent = labelText;
            else this.countdownEl.textContent = labelText;

            if (this.raceMode === 'endless') {
                const introTotal = this.introDuration || 3.0;
                const introProgress = Math.min(1, Math.max(0, 1 - this.countdownTimer / introTotal));
                // Ramps velocity from slow-motion (75) up to launch speed (460) so the whole stage moves with the character!
                const slowMoCurve = Math.pow(introProgress, 1.65);
                this.vx = 75 + slowMoCurve * 385;
                this.worldX += this.vx * dt;
                this.y = this.getTerrainY(this.worldX);
                this.vy = this.getTerrainSlope(this.worldX) * this.vx;
                this.cloudDrift = (this.cloudDrift || 0) + (4 + slowMoCurve * 14) * dt;

                this.rig.animState = 'run';
                this.rig.update(dt * (this.vx / 380));
                this.updateFootstepSplash(dt);

                for (let i = this.particles.length - 1; i >= 0; i--) {
                    const p = this.particles[i];
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vy += (p.gravity ?? 900) * dt;
                    if (p.growRate) p.size += p.growRate * dt;
                    p.rot += p.vRot * dt;
                    p.life -= dt * (p.decay ?? 1.4);
                    if (p.life <= 0) this.particles.splice(i, 1);
                }
            } else {
                this.rig.animState = 'idle';
                this.rig.update(dt);
            }

            this.rivalRig.animState = 'idle';
            this.rivalRig.update(dt);
            if (this.countdownTimer <= 0) {
                this.vx = 460;
                if (this.rival) this.rival.vx = 520;
                setTimeout(() => { this.countdownEl.style.display = 'none'; }, 450);
            }
            this.updateHUD();
            return;
        }

        this.cloudDrift = (this.cloudDrift || 0) + 18 * dt;
        const stats = this.getUpgradeStats();
        const prevVx = this.vx;

        this.ensureTerrainSegments(this.worldX + 35000);
        while (this.raceMode !== 'sandbox' && this.worldX + 16000 > this.nextSpawnX) {
            this.spawnWorldChunk(this.nextSpawnX, this.nextSpawnX + 4500);
            this.nextSpawnX += 4500;
        }

        // Check Slipstream Drafting behind NPC Rival in Story Mode
        this.isDrafting = false;
        if (this.raceMode === 'story' && this.rival) {
            const gap = this.rival.x - this.worldX;
            if (gap > 35 && gap < 420) {
                this.isDrafting = true;
            }
        }
        this.draftBadgeEl.style.display = this.isDrafting ? 'inline-block' : 'none';

        // Hyper-Dash Capacitor (With 0%->20% Recharge Lock & Airborne Buffer so the Boost Bar Never Flickers!)
        if (this.raceMode === 'sandbox') {
            this.dashCharge = 100;
            this.adrenaline = this.maxEnergy;
            this.isDashRecharging = false;
        } else {
            if (this.dashCharge <= 0.5) {
                this.dashCharge = 0;
                this.isDashRecharging = true;
            } else if (this.isDashRecharging && this.dashCharge >= 20) {
                this.isDashRecharging = false;
            }
        }

        const isTrulyAirborne = !this.grounded && (this.airborneTime || 0) > 0.085;
        const canDash = !this.isExhausted && !this.isDiving && this.isDashing && !isTrulyAirborne &&
            (this.raceMode === 'sandbox' || (!this.isDashRecharging && this.dashCharge > 0));
        this.isBoostingNow = canDash;

        if (canDash) {
            if (this.raceMode !== 'sandbox') {
                this.dashCharge = Math.max(0, this.dashCharge - 46 * dt);
                this.adrenaline = Math.max(0, this.adrenaline - 16.5 * stats.energyEfficiency * dt);
                if (this.dashCharge <= 0.5) {
                    this.dashCharge = 0;
                    this.isDashRecharging = true;
                }
            }
            if (this.grounded) {
                this.vx += stats.dashThrust * dt;
            }
        } else if (this.raceMode !== 'sandbox') {
            this.dashCharge = Math.min(100, this.dashCharge + stats.dashRechargeRate * dt);
            if (this.isDashRecharging && this.dashCharge >= 20) {
                this.isDashRecharging = false;
            }
        }

        const preStepX = this.worldX;
        const preStepY = this.y;
        const slope = this.getTerrainSlope(this.worldX);
        const gravity = this.isDiving ? 3250 : 900;
        this.currentAirDragMs2 = 0;

        const isLowStaminaDrain = !this.isDiving && (this.isExhausted || (this.adrenaline / this.maxEnergy < 0.12));

        if (this.grounded) {
            if (slope > 0.02) {
                const diveMultiplier = (this.isDiving ? 1880 : (this.isExhausted ? 320 : 560)) * stats.pumpMultiplier;
                this.vx += slope * diveMultiplier * dt;
            } else if (slope < -0.02) {
                if (this.isDiving) {
                    const inclinePenalty = Math.abs(slope) * 2650 + 540;
                    this.vx -= inclinePenalty * dt;
                } else {
                    const uphillDrag = Math.max(160, 380 / stats.pumpMultiplier);
                    this.vx += slope * uphillDrag * dt;
                    const accelMult = this.isExhausted ? 0.15 : 0.45;
                    this.vx += stats.runAccel * accelMult * dt;
                }
            } else {
                if (this.isDiving) {
                    const flatSlideFriction = 440 + this.vx * 0.22;
                    this.vx -= flatSlideFriction * dt;
                } else if (!this.isExhausted) {
                    this.vx += stats.runAccel * dt;
                }
            }

            if (this.isDrafting && !this.isDiving && !this.isExhausted) {
                this.vx += 420 * dt;
            }

            if (this.isExhausted) {
                const recoveryJogSpeed = Math.max(240, stats.baseDrive * 0.48);
                if (!this.isDiving && this.vx > recoveryJogSpeed) {
                    this.vx -= (620 + (this.vx - recoveryJogSpeed) * 0.85) * dt;
                } else if (!this.isDiving && this.vx < recoveryJogSpeed) {
                    this.vx += 180 * dt;
                }
            } else {
                if (this.vx < stats.baseDrive && !this.isDiving) {
                    this.vx += 240 * dt;
                }
                if (!this.isDiving && this.adrenaline / this.maxEnergy < 0.12 && this.vx > 750) {
                    this.vx -= 700 * dt;
                }
            }

            const dragFactor = this.isDrafting ? stats.groundDragCoeff * 0.55 : stats.groundDragCoeff;
            this.vx -= this.vx * dragFactor * dt;

            const prevSlope = slope;
            this.vy = prevSlope * Math.max(0, this.vx);
            this.worldX += Math.max(0, this.vx) * dt;

            const nextTerrainY = this.getTerrainY(this.worldX);
            const nextSlope = this.getTerrainSlope(this.worldX);
            const ballisticY = this.y + this.vy * dt + 0.5 * gravity * dt * dt;
            const slopeDropRate = (nextSlope - prevSlope) * this.vx;

            if (!this.isDiving && this.vx > 520 && (nextTerrainY > ballisticY + 2.5 || slopeDropRate > 230)) {
                this.grounded = false;
                this.y = ballisticY;
            } else {
                this.y = nextTerrainY;
                this.vy = nextSlope * Math.max(0, this.vx);
            }
        } else {
            const totalSpeed = Math.hypot(this.vx, this.vy);
            const dragCoeff = this.isDiving ? 0.52 : 1.0;

            const linearAirDrag = totalSpeed * 0.32;
            const quadraticAirDrag = (totalSpeed * totalSpeed) * 0.00018;
            const totalAirDecel = (linearAirDrag + quadraticAirDrag) * dragCoeff;
            this.currentAirDragMs2 = Math.round(totalAirDecel / 10);

            if (totalSpeed > 0) {
                const vxRatio = this.vx / totalSpeed;
                const vyRatio = this.vy / totalSpeed;
                this.vx = Math.max(0, this.vx - totalAirDecel * vxRatio * dt);
                this.vy -= (totalAirDecel * vyRatio * 0.35) * dt;
            }

            this.vy += gravity * dt;
            this.worldX += this.vx * dt;
            this.y += this.vy * dt;

            const groundY = this.getTerrainY(this.worldX);
            if (this.y >= groundY) {
                this.y = groundY;
                this.grounded = true;

                if (slope > 0.06) {
                    const pumpBonus = (this.isDiving ? 320 : 120) * stats.pumpMultiplier + Math.max(0, this.vy * 0.22);
                    this.vx += pumpBonus;
                    this.dashCharge = Math.min(100, this.dashCharge + 18);
                    if (this.dashCharge >= 20) this.isDashRecharging = false;
                    this.spawnDebris(this.worldX, this.y, '#38bdf8', 12);
                } else if (slope < -0.12 && this.isDiving) {
                    this.vx *= 0.52;
                }
                this.vy = slope * this.vx;
            }
        }

        this.airborneTime = this.grounded ? 0 : (this.airborneTime || 0) + dt;
        this.vx = Math.max(0, this.vx);

        if (!isLowStaminaDrain && this.paceRecoveryTimer <= 0) {
            const envSlowing = !this.grounded || slope < -0.02 || (this.isDiving && slope <= 0.02);
            if (this.vx >= this.preDrainPaceVx || envSlowing) {
                this.preDrainPaceVx = Math.max(460, this.vx);
            }
        }

        // 3-Second Grace Timer When Player Stops Moving (Disabled in Sandbox)
        if (this.raceMode !== 'sandbox') {
            if (this.vx <= 18) {
                if (this.stopTimer <= 0) {
                    this.stopTimer = 3.0;
                    this.lastStopTickSec = 4;
                } else {
                    this.stopTimer -= dt;
                    const sec = Math.ceil(this.stopTimer);
                    if (sec > 0 && sec !== this.lastStopTickSec) {
                        this.lastStopTickSec = sec;
                        if (this.soundManager) this.soundManager.playSfx('countdown_tick', 1.0, 0.9);
                    }
                    if (this.stopTimer <= 0) {
                        this.stopTimer = 0;
                        this.lastStopTickSec = 0;
                        this.vx = 0;
                        this.updateHUD();
                        this.triggerRunEnd('stopped');
                        return;
                    }
                }
            } else if (this.vx > 25) {
                this.stopTimer = 0;
                this.lastStopTickSec = 0;
            }
        }

        const currentSpeedMs = Math.round(this.vx / 10);
        if (currentSpeedMs > this.peakSpeedMs) {
            this.peakSpeedMs = currentSpeedMs;
        }

        // Threshold Triggers: 501 m/s (Tier 3), 650 m/s (Sonic Cone), 1500 m/s (Fire Cone - no flash), 1800 m/s (Hypersonic - flash!)
        if (this.vx >= TIER_4_VX && prevVx < TIER_4_VX) {
            this.triggerHypersonic(this.worldX, this.y - 60);
        } else if (this.vx >= FIRE_CONE_VX && prevVx < FIRE_CONE_VX) {
            this.triggerFireCone(this.worldX, this.y - 60);
        } else if (this.vx >= SONIC_CONE_VX && prevVx < SONIC_CONE_VX) {
            this.triggerSonicBoom(this.worldX, this.y - 60);
        } else if (this.vx >= TIER_3_VX && prevVx < TIER_3_VX) {
            this.triggerTier3Surge(this.worldX, this.y - 60);
        }

        if (this.vx >= TIER_4_VX) {
            this.speedTier = 4;
            this.tier2SkyBlend = Math.min(1, this.tier2SkyBlend + dt * 1.8);
            this.tier3SkyBlend = Math.min(1, this.tier3SkyBlend + dt * 1.8);
            this.tier4SkyBlend = Math.min(1, this.tier4SkyBlend + dt * 1.8);
        } else if (this.vx >= TIER_3_VX) {
            this.speedTier = 3;
            this.tier2SkyBlend = Math.min(1, this.tier2SkyBlend + dt * 1.8);
            this.tier3SkyBlend = Math.min(1, this.tier3SkyBlend + dt * 1.8);
            this.tier4SkyBlend = Math.max(0, this.tier4SkyBlend - dt * 1.8);
        } else if (this.vx >= TIER_2_VX) {
            this.speedTier = 2;
            this.tier2SkyBlend = Math.min(1, this.tier2SkyBlend + dt * 1.8);
            this.tier3SkyBlend = Math.max(0, this.tier3SkyBlend - dt * 1.8);
            this.tier4SkyBlend = Math.max(0, this.tier4SkyBlend - dt * 1.8);
        } else {
            this.speedTier = 1;
            this.tier2SkyBlend = Math.max(0, this.tier2SkyBlend - dt * 1.8);
            this.tier3SkyBlend = Math.max(0, this.tier3SkyBlend - dt * 1.8);
            this.tier4SkyBlend = Math.max(0, this.tier4SkyBlend - dt * 1.8);
        }

        if (this.isDiving) {
            this.rig.animState = this.grounded ? 'curl' : 'air_curl';
        } else if (!this.grounded) {
            this.rig.animState = 'air';
        } else if (this.speedTier >= 2 || canDash) {
            this.rig.animState = 'sonic';
        } else {
            this.rig.animState = 'run';
        }
        const animSpeedScale = !this.grounded ? 1.0 : Math.max(0.85, this.vx / 380);
        this.rig.update(dt * animSpeedScale);

        // Smooth Trail Envelope: Ramps in immediately on Boost, and smoothly fades out over ~0.38s when Boost is released!
        if (canDash) {
            this.boostTrailVisibility = Math.min(1, (this.boostTrailVisibility || 0) + dt * 14);
        } else {
            this.boostTrailVisibility = Math.max(0, (this.boostTrailVisibility || 0) - dt * 2.65);
        }

        if (this.boostTrailVisibility > 0.01) {
            const curSlopeAngle = Math.atan(this.getTerrainSlope(this.worldX));
            const curAirAngle = Math.max(-0.55, Math.min(0.65, Math.atan2(this.vy, this.vx) * 0.6));
            const curRot = this.grounded ? curSlopeAngle * 0.65 : curAirAngle;
            const stepDx = Math.max(1, this.worldX - preStepX);
            const maxTrailSpan = 165 * (0.45 + 0.55 * this.boostTrailVisibility);
            const spanX = Math.min(stepDx, maxTrailSpan);
            const subCount = stepDx > 40 ? 5 : 2;

            for (let s = subCount; s >= 1; s--) {
                const t = (s - 0.5) / subCount;
                const distBehind = Math.max(8, spanX * Math.pow(t, 1.65));
                const snapX = this.worldX - distBehind;
                const snapY = this.grounded
                    ? this.getTerrainY(snapX)
                    : this.y + (preStepY - this.y) * Math.min(1, distBehind / stepDx);

                this.afterimages.push({
                    x: snapX,
                    y: snapY,
                    rot: curRot,
                    rigTime: this.rig.time - t * dt * animSpeedScale,
                    animState: this.rig.animState,
                    alpha: (1.0 - t * 0.28) * this.boostTrailVisibility
                });
            }
            while (this.afterimages.length > 10) {
                this.afterimages.shift();
            }
        }

        const isStalling = !this.isDiving && !this.isExhausted && this.vx < 340;

        if (this.raceMode === 'sandbox') {
            this.adrenaline = this.maxEnergy;
            this.isExhausted = false;
        } else if (this.isExhausted) {
            const regenRate = this.maxEnergy * 0.30;
            this.adrenaline = Math.min(this.maxEnergy, this.adrenaline + regenRate * dt);
            if (this.adrenaline >= this.maxEnergy * 0.35) {
                this.isExhausted = false;
            }
        } else {
            let energyDrain;
            if (this.isDiving) {
                energyDrain = 3.25 * stats.energyEfficiency;
            } else {
                const highSpeedBurn = this.vx > 850 ? Math.pow((this.vx - 850) / 100, 1.25) * 2.1 * stats.energyEfficiency : 0;
                const baseDrain = isStalling ? 16.5 : (5.8 * stats.energyEfficiency + highSpeedBurn);
                const draftRelief = this.isDrafting ? 0.68 : 1.0;
                energyDrain = baseDrain * draftRelief;
            }
            this.adrenaline = Math.max(0, this.adrenaline - energyDrain * dt);

            if (this.adrenaline <= 0) {
                this.adrenaline = 0;
                this.isExhausted = true;
                this.isDashing = false;

                if (this.raceMode === 'endless' && this.paceRecoveryTimer <= 0) {
                    this.targetPaceVx = Math.max(480, this.preDrainPaceVx);
                    this.paceRecoveryTimer = 10.0;
                    this.lastPaceTickSec = 11;
                }
            }
        }

        if (this.raceMode === 'endless' && this.paceRecoveryTimer > 0) {
            if (this.vx > this.targetPaceVx + 10) {
                this.paceRecoveryTimer = 0;
                this.lastPaceTickSec = 0;
                this.targetPaceVx = 0;
                this.preDrainPaceVx = this.vx;
            } else {
                this.paceRecoveryTimer -= dt;
                const paceSec = Math.ceil(this.paceRecoveryTimer);
                if (paceSec > 0 && paceSec !== this.lastPaceTickSec) {
                    this.lastPaceTickSec = paceSec;
                    if (this.soundManager) {
                        this.soundManager.playSfx('countdown_tick', 1.0, 1.0);
                    }
                }
                if (this.paceRecoveryTimer <= 0) {
                    this.paceRecoveryTimer = 0;
                    this.lastPaceTickSec = 0;
                    this.updateHUD();
                    this.triggerRunEnd('pace_failed');
                    return;
                }
            }
        }

        const activeSeg = this.getSegmentAt(this.worldX);
        if (activeSeg && activeSeg.type === 'proving_straight_10k') {
            this.straightZoneAlertTimer = 0.5;
        } else if (this.straightZoneAlertTimer > 0) {
            this.straightZoneAlertTimer -= dt;
        }

        if (this.sonicAlertTimer > 0) this.sonicAlertTimer -= dt;
        if (this.sonicBoomFlash > 0) this.sonicBoomFlash = Math.max(0, this.sonicBoomFlash - dt * 2.2);

        this.updateScreenAlerts(isStalling, canDash, slope);

        if (this.raceMode === 'story' && this.rival && this.currentRivalSpec) {
            this.updateRivalAI(dt);

            if (this.worldX >= this.finishWorldX) {
                this.triggerRunEnd('story_win');
                return;
            } else if (this.rival.x >= this.finishWorldX) {
                this.triggerRunEnd('story_loss');
                return;
            }
        }

        for (const item of this.items) {
            if (!item.collected && Math.hypot(item.x - this.worldX, item.y - (this.y - 45)) < 92) {
                item.collected = true;
                if (this.soundManager) this.soundManager.playSfx('pickup', item.type === 'module' ? 1.25 : 1.0, 0.85);
                if (item.type === 'cell') {
                    this.adrenaline = Math.min(this.maxEnergy, this.adrenaline + 28);
                    if (this.adrenaline >= this.maxEnergy * 0.25) this.isExhausted = false;
                    this.dashCharge = Math.min(100, this.dashCharge + 22);
                    if (this.dashCharge >= 20) this.isDashRecharging = false;
                    this.spawnDebris(item.x, item.y, '#38bdf8', 8);
                } else if (item.type === 'scrap') {
                    const scrapGain = 12;
                    this.runScrap += scrapGain;
                    this.dataManager.addScrap(scrapGain);
                    if (this.scrapPopupEl) {
                        this.scrapPopupEl.textContent = `+${scrapGain}`;
                        this.scrapPopupEl.classList.remove('pop-active');
                        void this.scrapPopupEl.offsetWidth;
                        this.scrapPopupEl.classList.add('pop-active');
                    }
                    this.spawnDebris(item.x, item.y, '#c084fc', 8);
                } else if (item.type === 'module') {
                    const wasBelowTier3 = this.vx < TIER_3_VX;
                    const wasBelowCone = this.vx < SONIC_CONE_VX;
                    const wasBelowFire = this.vx < FIRE_CONE_VX;
                    const wasBelowTier4 = this.vx < TIER_4_VX;
                    this.vx += 460;
                    if (wasBelowTier4 && this.vx >= TIER_4_VX) {
                        this.triggerHypersonic(this.worldX, this.y - 60);
                    } else if (wasBelowFire && this.vx >= FIRE_CONE_VX) {
                        this.triggerFireCone(this.worldX, this.y - 60);
                    } else if (wasBelowCone && this.vx >= SONIC_CONE_VX) {
                        this.triggerSonicBoom(this.worldX, this.y - 60);
                    } else if (wasBelowTier3 && this.vx >= TIER_3_VX) {
                        this.triggerTier3Surge(this.worldX, this.y - 60);
                    }
                    this.adrenaline = Math.min(this.maxEnergy, this.adrenaline + 20);
                    this.isExhausted = false;
                    this.dashCharge = 100;
                    if (this.dataManager.state.settings?.screenShake !== false) {
                        this.shakeTimer = 0.3;
                        this.shakeIntensity = 10;
                    }
                    this.shockwaves.push({ x: this.worldX, y: this.y - 45, radius: 10, maxRadius: 500, alpha: 1, color: '250, 204, 21', width: 7 });
                    this.spawnDebris(item.x, item.y, '#facc15', 14);
                }
            }
        }

        if (this.speedTier >= 3) {
            if (this.dataManager.state.settings?.screenShake !== false) {
                this.shakeTimer = Math.max(this.shakeTimer, 0.1);
                // In Hypersonic (1800+ m/s), shake intensity scales with speed up to a cap at 3000 m/s (30000 vx)
                let targetContinuousShake = 5;
                if (this.vx >= TIER_4_VX) {
                    const shakeProgress = Math.min(1, (this.vx - TIER_4_VX) / (30000 - TIER_4_VX));
                    targetContinuousShake = 7 + shakeProgress * 15; // Scales from 7 (at 1800 m/s) to 22 (at 3000 m/s)
                }
                if (this.shakeIntensity > targetContinuousShake) {
                    this.shakeIntensity = Math.max(targetContinuousShake, this.shakeIntensity - dt * 24);
                } else {
                    this.shakeIntensity = targetContinuousShake;
                }
            }
        }

        // Breakable Obstacles: Only shatter when at Speed Tier 3 (Sub-Sonic / Supersonic / Hypersonic) and up!
        if (this.speedTier >= 3) {
            for (const prop of this.props) {
                const hitHalfW = Math.max(260, prop.w * 0.75);
                if (!prop.shattered && Math.abs(prop.x - this.worldX) < hitHalfW) {
                    prop.shattered = true;
                    if (this.soundManager) {
                        this.soundManager.playSfx('obstacle_break', 0.9 + Math.random() * 0.22, 0.85);
                    }
                    const cols = prop.debrisColors || [prop.color, prop.neon];
                    this.spawnDebris(prop.x, prop.y - Math.min(140, prop.h * 0.45), cols[0], 10);
                    this.spawnDebris(prop.x, prop.y - Math.min(140, prop.h * 0.45), cols[1] || cols[0], 8);
                }
            }
        }

        this.updateFootstepSplash(dt);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.gravity ?? 900) * dt;
            if (p.growRate) p.size += p.growRate * dt;
            p.rot += p.vRot * dt;
            p.life -= dt * (p.decay ?? 1.4);
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            const ai = this.afterimages[i];
            ai.alpha -= dt * 3.8;
            if (ai.alpha <= 0 || (this.worldX - ai.x) > 185) {
                this.afterimages.splice(i, 1);
            }
        }

        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += 1150 * dt;
            sw.alpha -= dt * 1.65;
            if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
        }

        if (this.shakeTimer > 0) this.shakeTimer -= dt;

        const speedAboveBase = Math.max(0, this.vx - 500);
        const targetZoom = Math.max(0.58, 1.0 - Math.min(0.42, (speedAboveBase / 7500) * 0.42));
        this.cameraZoom += (targetZoom - this.cameraZoom) * Math.min(1, dt * 4.2);

        if (this.soundManager) {
            this.soundManager.updateRunnerAudio(dt, this.vx, this.grounded, this.isDiving, this.active && !this.paused);
        }

        this.items = this.items.filter(i => i.x > this.worldX - 4500 && !i.collected);
        this.props = this.props.filter(p => p.x > this.worldX - 4500);

        this.updateHUD();
    }

    updateScreenAlerts(isStalling, canDash, slope) {
        const staminaPct = (this.adrenaline / this.maxEnergy) * 100;
        const opacity = (this.dataManager.state.settings?.alertOpacity ?? 92) / 100;
        this.alertBannerEl.style.opacity = opacity;

        if (this.stopTimer > 0) {
            this.alertBannerEl.style.display = 'block';
            this.alertBannerEl.className = 'screen-alert-banner';
            this.alertTitleEl.textContent = 'MOVE!';
            this.alertSubEl.textContent = `${this.stopTimer.toFixed(1)}s`;
        } else if (this.raceMode === 'endless' && this.paceRecoveryTimer > 0) {
            const targetMs = Math.round(this.targetPaceVx / 10) + 1;
            const curMs = Math.round(this.vx / 10);
            this.alertBannerEl.style.display = 'block';
            this.alertBannerEl.className = 'screen-alert-banner';
            this.alertTitleEl.textContent = `TOO SLOW! ${curMs} / ${targetMs} m/s`;
            this.alertSubEl.textContent = `${this.paceRecoveryTimer.toFixed(1)}s`;
        } else if (!this.isExhausted && staminaPct <= 22) {
            this.alertBannerEl.style.display = 'block';
            this.alertBannerEl.className = 'screen-alert-banner warn-amber';
            this.alertTitleEl.textContent = 'LOW STAMINA!';
            this.alertSubEl.textContent = `${Math.ceil(staminaPct)}%`;
        } else if (this.straightZoneAlertTimer > 0) {
            const activeSeg = this.getSegmentAt(this.worldX);
            const kmLabel = activeSeg?.milestoneMeters ? `${activeSeg.milestoneMeters.toLocaleString()}m` : '10,000m';
            this.alertBannerEl.style.display = 'block';
            this.alertBannerEl.className = 'screen-alert-banner info-cyan';
            this.alertTitleEl.textContent = `${kmLabel}`;
            this.alertSubEl.textContent = `BOOST ZONE ${Math.round(this.vx / 10)} m/s`;
        } else if (this.sonicAlertTimer > 0) {
            const curMs = Math.round(this.vx / 10);
            this.alertBannerEl.style.display = 'block';
            this.alertBannerEl.className = 'screen-alert-banner info-cyan';
            this.alertTitleEl.textContent = this.vx >= SONIC_CONE_VX ? 'SONIC BOOM!' : 'HUSS! HUSS! HUSS!';
            this.alertSubEl.textContent = `${curMs} m/s`;
        } else {
            this.alertBannerEl.style.display = 'none';
        }

        this.stallWarnEl.style.display = 'inline';
        if (this.isExhausted) {
            this.stallWarnEl.style.color = '#f97316';
            this.stallWarnEl.textContent = 'STAMINA EXHAUSTED!';
        } else if (this.isDiving) {
            if (!this.grounded) {
                this.stallWarnEl.style.color = '#38bdf8';
                this.stallWarnEl.textContent = `DIVE -${this.currentAirDragMs2} m/s²`;
            } else if (slope > 0.02) {
                this.stallWarnEl.style.color = '#4ade80';
                this.stallWarnEl.textContent = 'DOWNHILL!';
            } else {
                this.stallWarnEl.style.color = '#ef4444';
                this.stallWarnEl.textContent = 'SPEED DROPPING!';
            }
        } else if (!this.grounded) {
            this.stallWarnEl.style.color = '#facc15';
            this.stallWarnEl.textContent = `DRAG -${this.currentAirDragMs2} m/s²`;
        } else if (isStalling) {
            this.stallWarnEl.style.color = '#ef4444';
            this.stallWarnEl.textContent = 'LOW SPEED!';
        } else if (canDash) {
            this.stallWarnEl.style.color = '#facc15';
            this.stallWarnEl.textContent = 'HUSS!!!';
        } else {
            this.stallWarnEl.style.display = 'none';
        }
    }

    updateRivalAI(dt) {
        const r = this.rival;
        const spec = this.currentRivalSpec;
        const rSlope = this.getTerrainSlope(r.x);

        const aiDiving = rSlope > 0.05;
        if (Math.abs(rSlope) < 0.03 && r.dashTimer <= 0 && Math.random() < spec.dashFreq * dt * 1.8) {
            r.dashTimer = 0.85;
        }

        let targetVx = spec.baseSpeed;
        if (aiDiving) {
            targetVx += 650 + rSlope * 900;
        } else if (rSlope < -0.06) {
            targetVx -= 180;
        }

        if (r.dashTimer > 0) {
            r.dashTimer -= dt;
            targetVx += spec.dashThrust || 750;
        }

        const playerLead = this.worldX - r.x;
        if (playerLead > 30) {
            targetVx += Math.min(550, playerLead * 0.45);
        }

        r.vx += (targetVx - r.vx) * 3.2 * dt;
        r.x += r.vx * dt;
        r.y = this.getTerrainY(r.x);

        if (aiDiving) {
            this.rivalRig.animState = 'curl';
        } else if (r.vx >= 950 || r.dashTimer > 0) {
            this.rivalRig.animState = 'sonic';
        } else {
            this.rivalRig.animState = 'run';
        }
        this.rivalRig.update(dt * (r.vx / 380));
    }

    updateHUD() {
        const displaySpeed = Math.round(this.vx / 10);
        const distanceMeters = Math.floor(this.worldX / PIXELS_PER_METER);

        this.speedEl.textContent = `${displaySpeed} m/s`;
        if (this.peakLabelEl) {
            this.peakLabelEl.textContent = `PEAK: ${this.peakSpeedMs} m/s`;
        }
        this.distEl.textContent = this.raceMode === 'story'
            ? `${distanceMeters} / ${this.currentRivalSpec.distanceMeters} m`
            : `${distanceMeters.toLocaleString()} m`;
        if (this.scrapTotalEl) {
            this.scrapTotalEl.textContent = `⚙️ ${this.dataManager.state.scrap}`;
        }
        const staminaRatio = Math.max(0, Math.min(1, this.adrenaline / this.maxEnergy));
        const redness = Math.pow(1 - staminaRatio, 0.85);
        this.fuelFillEl.style.width = `${staminaRatio * 100}%`;
        const stCol1 = this.lerpColor([249, 115, 22], [153, 27, 27], redness);
        const stCol2 = this.lerpColor([250, 204, 21], [220, 38, 38], redness);
        const stCol3 = this.lerpColor([254, 240, 138], [239, 68, 68], redness);
        this.fuelFillEl.style.background = `linear-gradient(90deg, ${stCol1}, ${stCol2}, ${stCol3})`;
        const fuelHeaderEl = this.fuelFillEl.parentElement?.previousElementSibling;
        if (fuelHeaderEl) {
            fuelHeaderEl.style.color = this.lerpColor([250, 204, 21], [239, 68, 68], redness);
        }
        this.dashFillEl.style.width = `${this.dashCharge}%`;
        const s = this.dataManager.state.settings || {};
        const trailCol = s.trailColor || '#38bdf8';
        const isBoosting = Boolean(this.isBoostingNow && this.active && !this.paused && !this.finishing && this.countdownTimer <= 0);

        this.dashFillEl.style.background = s.trailRainbow
            ? 'linear-gradient(90deg, #ef4444, #f97316, #facc15, #22c55e, #38bdf8, #a855f7, #ec4899)'
            : trailCol;

        const dashBgEl = this.dashFillEl.parentElement;
        const dashHeaderEl = this.dashStatusEl?.parentElement;
        if (dashBgEl) {
            dashBgEl.style.setProperty('--boost-glow-color', s.trailRainbow ? '#38bdf8' : trailCol);
            dashBgEl.classList.toggle('boosting', isBoosting);
        }
        this.dashFillEl.classList.toggle('boosting', isBoosting);
        if (dashHeaderEl) {
            dashHeaderEl.style.setProperty('--boost-glow-color', s.trailRainbow ? '#38bdf8' : trailCol);
            dashHeaderEl.style.color = s.trailRainbow ? '#38bdf8' : trailCol;
            dashHeaderEl.classList.toggle('boosting', isBoosting);
        }

        const isTrulyAirborne = !this.grounded && (this.airborneTime || 0) > 0.085;
        this.dashStatusEl.textContent = isBoosting
            ? 'ACTIVE'
            : (isTrulyAirborne ? 'AIRBORNE' : (!this.isDashRecharging && this.dashCharge >= 20 ? 'READY' : 'RECHARGING...'));

        const isHypersonic = this.vx >= TIER_4_VX;
        const isSupersonic = this.vx >= SONIC_CONE_VX && !isHypersonic;
        this.tierBadgeEl.classList.toggle('hypersonic-fire', isHypersonic);
        this.tierBadgeEl.classList.toggle('supersonic-fire', isSupersonic);

        if (this.speedTier === 4) {
            this.tierBadgeEl.textContent = 'HYPERSONIC';
            this.tierBadgeEl.style.color = '#f0f9ff';
        } else if (this.speedTier === 3) {
            this.tierBadgeEl.textContent = isSupersonic ? 'SUPERSONIC' : 'SUB-SONIC';
            this.tierBadgeEl.style.color = isSupersonic ? '#fffbeb' : '#f43f5e';
        } else if (this.speedTier === 2) {
            this.tierBadgeEl.textContent = 'SPRINT';
            this.tierBadgeEl.style.color = '#facc15';
        } else {
            this.tierBadgeEl.textContent = 'WARMUP';
            this.tierBadgeEl.style.color = '#38bdf8';
        }

        if (this.raceMode === 'story' && this.rival) {
            const pPct = Math.min(100, (this.worldX / this.finishWorldX) * 100);
            const rPct = Math.min(100, (this.rival.x / this.finishWorldX) * 100);
            this.racePlayerDotEl.style.left = `${pPct}%`;
            this.raceRivalDotEl.style.left = `${rPct}%`;
        }
    }

    async triggerRunEnd(reason) {
        if (this.finishing) return;
        this.finishing = true;
        this.paused = false;
        this.isDiving = false;
        this.isDashing = false;
        document.getElementById('pedal-lean')?.classList.remove('pressed');
        document.getElementById('pedal-boost')?.classList.remove('pressed');
        this.alertBannerEl.style.display = 'none';
        if (this.stallWarnEl) this.stallWarnEl.style.display = 'none';
        if (this.pauseEl) this.pauseEl.style.display = 'none';

        const distanceMeters = Math.floor(this.worldX / PIXELS_PER_METER);
        const score = Math.round(distanceMeters * 1.8 + this.peakSpeedMs * 22);

        if (reason === 'story_win') {
            const reward = this.currentRivalSpec.rewardScrap;
            this.dataManager.addScrap(reward);
            this.dataManager.markRivalCleared(this.currentRivalSpec.id);
            this.gameOverTitleEl.textContent = '🏆 Victory! Husser Defeated';
            this.gameOverTitleEl.style.color = '#4ade80';
            this.finalStatsEl.textContent = `You out-hussed ${this.currentRivalSpec.name} on the ${this.currentRivalSpec.distanceMeters}m strip and won ⚙️${reward}.`;
        } else if (reason === 'story_loss') {
            this.gameOverTitleEl.textContent = '❌ Defeat! Rival Crossed First';
            this.gameOverTitleEl.style.color = '#ef4444';
            this.finalStatsEl.textContent = `${this.currentRivalSpec.name} beat you to the finish line (${Math.round(this.currentRivalSpec.baseSpeed / 10)}+ m/s).`;
        } else if (reason === 'stopped') {
            this.gameOverTitleEl.textContent = 'Game Over';
            this.gameOverTitleEl.style.color = '#f97316';
            this.finalStatsEl.textContent = `You had no forward motion for 3.0 seconds! Release Lean on inclines or use Boost to keep moving.`;
        } else if (reason === 'pace_failed') {
            const targetMs = Math.round(this.targetPaceVx / 10) + 1;
            const finalMs = Math.round(this.vx / 10);
            this.gameOverTitleEl.textContent = 'Game Over';
            this.gameOverTitleEl.style.color = '#ef4444';
            this.finalStatsEl.textContent = `After draining your stamina, you had 10.0s to surpass your speed of ${targetMs} m/s (reached ${finalMs} m/s).`;
        } else {
            this.gameOverTitleEl.textContent = '⚡ RUN COMPLETE';
            this.gameOverTitleEl.style.color = '#ef4444';
            this.finalStatsEl.textContent = `Your score, distance, and peak speed have been recorded to the Top Hussers Leaderboard.`;
        }

        // Display the Game Over modal and buttons immediately before any async network call!
        this.breakdownEl.innerHTML = `
            <div class="stat-tile"><span>TOP SCORE</span><strong>${(reason === 'story_loss' ? 0 : score).toLocaleString()} pts</strong></div>
            <div class="stat-tile"><span>DISTANCE</span><strong>${distanceMeters.toLocaleString()} m</strong></div>
            <div class="stat-tile"><span>PEAK SPEED</span><strong>${this.peakSpeedMs} m/s</strong></div>
        `;
        this.gameOverEl.style.display = 'flex';

        if (reason !== 'story_loss') {
            try {
                await this.dataManager.recordRunScore(distanceMeters, this.peakSpeedMs);
            } catch (err) {
                console.warn('Score sync warning:', err);
            }
        }
    }

    lerpColor(c1, c2, t) {
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }

    getSpeedStretch() {
        const rawSetting = this.dataManager.state.settings?.charStretch;
        const intensity = rawSetting === false ? 0 : (typeof rawSetting === 'number' ? rawSetting : 100) / 100;
        if (intensity <= 0) {
            return { stretchX: 1, stretchY: 1 };
        }

        const STRETCH_START_VX = 3750;
        const STRETCH_CAP_VX = 7500;

        if (this.vx <= STRETCH_START_VX) {
            return { stretchX: 1, stretchY: 1 };
        }

        const clampedVx = Math.min(this.vx, STRETCH_CAP_VX);
        const excessMs = (clampedVx - STRETCH_START_VX) / 10;
        const stretchX = 1 + Math.pow(excessMs / 320, 1.08) * intensity;
        const stretchY = Math.max(0.45, 1 / Math.pow(stretchX, 0.25));
        return { stretchX, stretchY };
    }

    drawAerodynamicCones(ctx, stretchX = 1) {
        if (this.dataManager.state.settings?.particles === false) return;

        if (!this.grounded && this.currentAirDragMs2 > 6) {
            const dragIntensity = Math.min(1, this.currentAirDragMs2 / 95);
            const apexX = 78 * stretchX;
            const tailX = -245;
            const spreadY = 155;

            ctx.save();
            ctx.translate(0, -72);

            const coneGrad = ctx.createLinearGradient(apexX, 0, tailX, 0);
            coneGrad.addColorStop(0, `rgba(224, 242, 254, ${0.30 * dragIntensity})`);
            coneGrad.addColorStop(0.45, `rgba(56, 189, 248, ${0.14 * dragIntensity})`);
            coneGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

            ctx.fillStyle = coneGrad;
            ctx.beginPath();
            ctx.moveTo(apexX, 0);
            ctx.quadraticCurveTo(-20, -spreadY * 0.72, tailX, -spreadY);
            ctx.lineTo(tailX + 35, 0);
            ctx.lineTo(tailX, spreadY);
            ctx.quadraticCurveTo(-20, spreadY * 0.72, apexX, 0);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 255, 255, ${0.32 * dragIntensity})`;
            ctx.lineWidth = 2.5;
            for (let i = 0; i < 3; i++) {
                const offset = i * 36 + ((performance.now() * 0.18) % 36);
                ctx.beginPath();
                ctx.arc(20 - offset, 0, 75 + i * 26, -0.88, 0.88);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 2A. Regular 620+ m/s Sound Barrier Cone (Stays active underneath the Fire Cone!)
        const CONE_SPAWN_VX = 6200;
        const CONE_LIMIT_VX = 13000;
        if (this.vx >= CONE_SPAWN_VX) {
            const isSupersonic = this.vx >= SONIC_CONE_VX;
            const rawProgress = Math.min(1, Math.max(0, (this.vx - CONE_SPAWN_VX) / (CONE_LIMIT_VX - CONE_SPAWN_VX)));
            const sweepT = 1 - Math.pow(1 - rawProgress, 1.75);

            const baseAlpha = isSupersonic
                ? 0.46
                : 0.18 + ((this.vx - CONE_SPAWN_VX) / (SONIC_CONE_VX - CONE_SPAWN_VX)) * 0.24;

            const apexX = 88 * stretchX;
            const coneLen = 22 + sweepT * 458;
            const spreadY = 340 - sweepT * 235;
            const tailX = apexX - coneLen;

            ctx.save();
            ctx.translate(0, -72);

            const machGrad = ctx.createLinearGradient(apexX, 0, tailX, 0);
            machGrad.addColorStop(0, `rgba(255, 255, 255, ${baseAlpha})`);
            machGrad.addColorStop(0.35, `rgba(186, 230, 253, ${baseAlpha * 0.72})`);
            machGrad.addColorStop(0.75, `rgba(244, 63, 94, ${baseAlpha * 0.38})`);
            machGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

            ctx.fillStyle = machGrad;
            ctx.beginPath();
            ctx.moveTo(apexX, 0);
            ctx.lineTo(tailX, -spreadY);
            ctx.quadraticCurveTo(apexX - coneLen * 0.65, 0, tailX, spreadY);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 255, 255, ${baseAlpha * 0.95})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(apexX, 0);
            ctx.lineTo(apexX - coneLen * 1.06, -spreadY * 1.06);
            ctx.moveTo(apexX, 0);
            ctx.lineTo(apexX - coneLen * 1.06, spreadY * 1.06);
            ctx.stroke();

            const ring1X = apexX - coneLen * 0.28;
            const ring2X = apexX - coneLen * 0.62;
            const ringRx1 = 6 + sweepT * 20;
            const ringRx2 = 8 + sweepT * 28;

            ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha * 0.5})`;
            ctx.beginPath();
            ctx.ellipse(ring1X, 0, ringRx1, spreadY * 0.52, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(56, 189, 248, ${baseAlpha * 0.85})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(ring2X, 0, ringRx2, spreadY * 0.78, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        // 2B. 1500+ m/s Uncapped Surging Fire Cone (Starts tiny -> caps vertical size -> stretches infinitely & flickers faster with speed)
        if (this.vx >= FIRE_CONE_VX) {
            const now = performance.now();
            const dtFire = Math.min(0.05, Math.max(0.001, (now - (this.lastFireConeNow || now)) / 1000));
            this.lastFireConeNow = now;

            const excessMs = Math.max(0, (this.vx - FIRE_CONE_VX) / 10); // Speed above 1500 m/s
            // Flicker frequency accelerates continuously with speed without phase-jumping
            const flickerRate = 1 + Math.pow(excessMs / 110, 1.15);
            this.fireConePhase = (this.fireConePhase || 0) + dtFire * flickerRate;

            // Vertical growth stops once it reaches full height, while horizontal length stretches infinitely
            const sizeGrowth = 1 - Math.exp(-excessMs / 170);
            const pulse = Math.sin(this.fireConePhase * 26) * 16 * sizeGrowth;
            const flutter = Math.cos(this.fireConePhase * 42) * 9 * sizeGrowth;
            const flickerAlpha = 0.88 + Math.sin(this.fireConePhase * 58) * 0.12;

            // Smooth 0.0 -> 1.0 transition from Orange Fire to Blue Flame starting at 2500 m/s (25000 vx)
            const blueBlend = Math.min(1, Math.max(0, (this.vx - 25000) / 4500));
            const mixRgba = (c1, c2, alpha) => {
                const r = Math.round(c1[0] + (c2[0] - c1[0]) * blueBlend);
                const g = Math.round(c1[1] + (c2[1] - c1[1]) * blueBlend);
                const b = Math.round(c1[2] + (c2[2] - c1[2]) * blueBlend);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            const apexX = 88 * stretchX;
            // Vertical height starts at 8px and stops growing at ~130px; length stretches infinitely!
            const coneLen = 14 + Math.pow(excessMs, 1.04) * 1.55 + Math.max(0, pulse);
            const spreadY = 8 + sizeGrowth * 122 + flutter * 0.45;
            const tailX = apexX - coneLen;
            const baseAlpha = Math.min(0.82, (0.36 + sizeGrowth * 0.42) * flickerAlpha);

            ctx.save();
            ctx.translate(0, -72);

            // Outer scorching meteorite / blue-plasma wake
            const outerGrad = ctx.createLinearGradient(apexX + 16, 0, tailX - 40, 0);
            outerGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, baseAlpha * 1.15)})`);
            outerGrad.addColorStop(0.16, mixRgba([254, 240, 138], [186, 230, 253], Math.min(1, baseAlpha * 1.05)));
            outerGrad.addColorStop(0.45, mixRgba([249, 115, 22], [56, 189, 248], baseAlpha * 0.92));
            outerGrad.addColorStop(0.78, mixRgba([220, 38, 38], [37, 99, 235], baseAlpha * 0.58));
            outerGrad.addColorStop(1, mixRgba([124, 45, 18], [15, 23, 42], 0));

            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.moveTo(apexX + 16, 0);
            ctx.quadraticCurveTo(apexX - coneLen * 0.25, -spreadY * 0.92, tailX, -spreadY * 1.15);
            ctx.quadraticCurveTo(apexX - coneLen * 0.62, 0, tailX, spreadY * 1.15);
            ctx.quadraticCurveTo(apexX - coneLen * 0.25, spreadY * 0.92, apexX + 16, 0);
            ctx.closePath();
            ctx.fill();

            // Inner white-hot core cone
            const coreTailX = apexX - coneLen * 0.78;
            const coreGrad = ctx.createLinearGradient(apexX + 10, 0, coreTailX, 0);
            coreGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, baseAlpha * 1.2)})`);
            coreGrad.addColorStop(0.32, mixRgba([253, 224, 71], [103, 232, 249], baseAlpha * 0.95));
            coreGrad.addColorStop(0.72, mixRgba([249, 115, 22], [2, 132, 199], baseAlpha * 0.6));
            coreGrad.addColorStop(1, mixRgba([234, 88, 12], [29, 78, 216], 0));

            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.moveTo(apexX + 10, 0);
            ctx.lineTo(coreTailX, -spreadY * 0.6);
            ctx.quadraticCurveTo(apexX - coneLen * 0.45, 0, coreTailX, spreadY * 0.6);
            ctx.closePath();
            ctx.fill();

            // Surging shockwave boundary ribs
            ctx.strokeStyle = mixRgba([254, 240, 138], [165, 243, 252], Math.min(1, baseAlpha * 1.15));
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(apexX + 14, 0);
            ctx.quadraticCurveTo(apexX - coneLen * 0.35, -spreadY * 0.8 + flutter, tailX, -spreadY * 1.12);
            ctx.moveTo(apexX + 14, 0);
            ctx.quadraticCurveTo(apexX - coneLen * 0.35, spreadY * 0.8 - flutter, tailX, spreadY * 1.12);
            ctx.stroke();

            // Plasma compression rings pulsing backward faster and faster with speed
            const ringCount = Math.min(6, 2 + Math.floor(coneLen / 220));
            for (let i = 0; i < ringCount; i++) {
                const cycle = ((this.fireConePhase * 1.8 + i / ringCount) % 1);
                const ringX = apexX - cycle * coneLen * 0.88;
                const ringSpread = spreadY * (0.22 + cycle * 0.82);
                const ringAlpha = (1 - cycle) * baseAlpha * 1.05;
                ctx.strokeStyle = i % 2 === 0
                    ? mixRgba([253, 224, 71], [103, 232, 249], ringAlpha)
                    : mixRgba([249, 115, 22], [56, 189, 248], ringAlpha);
                ctx.lineWidth = 2.8;
                ctx.beginPath();
                ctx.ellipse(ringX, 0, 8 + cycle * 24, ringSpread, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    // 1. Background Layer: Large Varied Clouds in Screen Space (Never teleports or zooms with camera FOV; moves strictly left)
    drawBackgroundClouds(ctx, canvasW, canvasH) {
        const layers = [
            { ratio: 0.05, spacing: 920, yTop: 45, yRange: 210, minScale: 1.35, maxScale: 2.35, alpha: 0.78 },
            { ratio: 0.11, spacing: 780, yTop: 75, yRange: 250, minScale: 1.65, maxScale: 2.95, alpha: 0.94 }
        ];

        for (let li = 0; li < layers.length; li++) {
            const layer = layers[li];
            // Strictly monotonic leftward scroll driven by player distance + wind drift
            const scrollX = Math.max(0, this.worldX) * layer.ratio + (this.cloudDrift || 0) * (li + 1) * 0.8;
            const firstSlot = Math.floor((scrollX - 700) / layer.spacing);
            const lastSlot = Math.ceil((scrollX + canvasW + 700) / layer.spacing);

            for (let s = firstSlot; s <= lastSlot; s++) {
                const h = this.hashInt(s * 97 + li * 503);
                if ((h % 10) < 2) continue;

                const offsetX = (h % 340) - 170;
                const normY = ((h >>> 8) % 1000) / 1000; // Fixed 0..1 ratio: never jumps when viewport resizes or zooms!
                const normScale = ((h >>> 18) % 1000) / 1000;

                const cx = s * layer.spacing - scrollX + offsetX;
                const cy = layer.yTop + normY * layer.yRange;
                const sc = layer.minScale + normScale * (layer.maxScale - layer.minScale);

                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(sc, sc);
                ctx.globalAlpha = layer.alpha;

                // Deep cloud base shadow
                ctx.fillStyle = '#cbd5e1';
                ctx.beginPath();
                ctx.roundRect(-92, -4, 184, 34, 17);
                ctx.fill();

                // Mid cloud puffs
                ctx.fillStyle = '#f1f5f9';
                ctx.beginPath();
                ctx.arc(-52, -4, 32, 0, Math.PI * 2);
                ctx.arc(-8, -18, 44, 0, Math.PI * 2);
                ctx.arc(38, -10, 36, 0, Math.PI * 2);
                ctx.arc(68, 0, 24, 0, Math.PI * 2);
                ctx.fill();

                // Bright sunlit top puffs
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-54, -9, 26, 0, Math.PI * 2);
                ctx.arc(-10, -24, 38, 0, Math.PI * 2);
                ctx.arc(34, -15, 30, 0, Math.PI * 2);
                ctx.arc(64, -4, 19, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        }
    }

    // 2. Multi-Pass Midground Layer (Zoom-Proof Fixed Proportions & Slanted Beach-Ocean Midground Shoreline)
    drawMidgroundLayer(ctx, canvasW, canvasH) {
        if (this.raceMode === 'sandbox') return;
        const midRatio = 0.36;
        const slotWidth = 230;
        const midScrollX = Math.max(0, this.worldX) * midRatio;
        const firstSlot = Math.floor((midScrollX - 1000) / slotWidth);
        const lastSlot = Math.ceil((midScrollX + canvasW + 1000) / slotWidth);

        const baseY = Math.round(canvasH * 0.64);
        const skirtBottom = canvasH + 350;

        const fillCircle = (cx, cy, r) => {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        };

        // PASS 1: Continuous Ground Foundation (With Slanted & Faded Beach <-> Ocean Midground Transition)
        for (let s = firstSlot; s <= lastSlot; s++) {
            const screenX = s * slotWidth - midScrollX;
            const slotWorldX = (s * slotWidth) / midRatio;
            const biome = this.getBiomeAt(slotWorldX);
            const leftX = screenX - slotWidth * 0.6;
            const widthX = slotWidth * 1.2 + 4;

            if (biome === 'city') {
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(leftX, baseY, widthX, 14);
                ctx.fillStyle = '#64748b';
                ctx.fillRect(leftX, baseY + 14, widthX, 8);
                const streetGrad = ctx.createLinearGradient(0, baseY + 22, 0, baseY + 180);
                streetGrad.addColorStop(0, '#334155');
                streetGrad.addColorStop(0.35, '#1e293b');
                streetGrad.addColorStop(1, '#0f172a');
                ctx.fillStyle = streetGrad;
                ctx.fillRect(leftX, baseY + 22, widthX, skirtBottom - (baseY + 22));
                ctx.fillStyle = '#475569';
                ctx.fillRect(screenX - 45, baseY + 46, 90, 5);
            } else if (biome === 'desert' || biome === 'beach' || biome === 'ocean') {
                // Draw continuous warm sand base under Desert, Beach, AND Ocean so Ocean can slant & fade over it with zero vertical line!
                const sandFloor = ctx.createLinearGradient(0, baseY - 12, 0, baseY + 180);
                sandFloor.addColorStop(0, '#f59e0b');
                sandFloor.addColorStop(0.45, '#d97706');
                sandFloor.addColorStop(1, '#78350f');
                ctx.fillStyle = sandFloor;
                ctx.fillRect(leftX, baseY - 12, widthX, skirtBottom - baseY + 24);
            } else if (biome === 'forest') {
                const forestFloor = ctx.createLinearGradient(0, baseY - 10, 0, baseY + 180);
                forestFloor.addColorStop(0, '#15803d');
                forestFloor.addColorStop(0.35, '#14532d');
                forestFloor.addColorStop(1, '#052e16');
                ctx.fillStyle = forestFloor;
                ctx.fillRect(leftX, baseY - 10, widthX, skirtBottom - baseY + 20);
            } else if (biome === 'mountains') {
                const rockFloor = ctx.createLinearGradient(0, baseY - 10, 0, baseY + 180);
                rockFloor.addColorStop(0, '#475569');
                rockFloor.addColorStop(1, '#1e293b');
                ctx.fillStyle = rockFloor;
                ctx.fillRect(leftX, baseY - 10, widthX, skirtBottom - baseY + 20);
            }
        }

        // PASS 1B: Slanted & Faded Midground Ocean Water (Eliminates the vertical line between Beach sand and Ocean in the midground!)
        if (this.biomeSpans) {
            const oceanTopY = baseY - 28;
            const slantScreenW = 420;
            const fadeScreenW = 190;

            for (let i = 0; i < this.biomeSpans.length; i++) {
                const span = this.biomeSpans[i];
                if (span.biome !== 'ocean') continue;

                const startScreenX = span.startX * midRatio - midScrollX;
                const endScreenX = span.endX * midRatio - midScrollX;
                if (endScreenX + slantScreenW < -200 || startScreenX - slantScreenW > canvasW + 200) continue;

                ctx.save();
                // Main slanted ocean midground body (\ at entry, / at exit)
                const oGrad = ctx.createLinearGradient(0, oceanTopY, 0, baseY + 140);
                oGrad.addColorStop(0, '#0369a1');
                oGrad.addColorStop(0.5, '#0284c7');
                oGrad.addColorStop(1, '#0ea5e9');
                ctx.fillStyle = oGrad;
                ctx.beginPath();
                ctx.moveTo(startScreenX, oceanTopY);
                ctx.lineTo(endScreenX, oceanTopY);
                ctx.lineTo(endScreenX - slantScreenW, skirtBottom);
                ctx.lineTo(startScreenX + slantScreenW, skirtBottom);
                ctx.closePath();
                ctx.fill();

                // Entry diagonal gradient fade (Beach sand -> Ocean blue)
                const entryGrad = ctx.createLinearGradient(
                    startScreenX - fadeScreenW, baseY,
                    startScreenX + slantScreenW * 0.55 + fadeScreenW, baseY
                );
                entryGrad.addColorStop(0, '#f59e0b');
                entryGrad.addColorStop(0.45, '#d97706');
                entryGrad.addColorStop(1, '#0284c7');
                ctx.fillStyle = entryGrad;
                ctx.beginPath();
                ctx.moveTo(startScreenX - fadeScreenW, baseY - 12);
                ctx.lineTo(startScreenX + fadeScreenW, oceanTopY);
                ctx.lineTo(startScreenX + slantScreenW + fadeScreenW, skirtBottom);
                ctx.lineTo(startScreenX + slantScreenW - fadeScreenW, skirtBottom);
                ctx.closePath();
                ctx.fill();

                // Slanted sandy shoreline beach wedge dipping into the midground ocean at Entry (\)
                const entryShoreGrad = ctx.createLinearGradient(startScreenX - 90, baseY - 12, startScreenX + slantScreenW * 0.65, baseY + 160);
                entryShoreGrad.addColorStop(0, '#fbbf24');
                entryShoreGrad.addColorStop(0.5, '#f59e0b');
                entryShoreGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
                ctx.fillStyle = entryShoreGrad;
                ctx.beginPath();
                ctx.moveTo(startScreenX - 120, baseY - 12);
                ctx.lineTo(startScreenX + 30, oceanTopY);
                ctx.lineTo(startScreenX + slantScreenW * 0.75, skirtBottom);
                ctx.lineTo(startScreenX - 120, skirtBottom);
                ctx.closePath();
                ctx.fill();

                // Exit diagonal gradient fade (Ocean blue -> Beach sand)
                const exitGrad = ctx.createLinearGradient(
                    endScreenX - slantScreenW * 0.55 - fadeScreenW, baseY,
                    endScreenX + fadeScreenW, baseY
                );
                exitGrad.addColorStop(0, '#0284c7');
                exitGrad.addColorStop(0.55, '#d97706');
                exitGrad.addColorStop(1, '#f59e0b');
                ctx.fillStyle = exitGrad;
                ctx.beginPath();
                ctx.moveTo(endScreenX - fadeScreenW, oceanTopY);
                ctx.lineTo(endScreenX + fadeScreenW, baseY - 12);
                ctx.lineTo(endScreenX - slantScreenW + fadeScreenW, skirtBottom);
                ctx.lineTo(endScreenX - slantScreenW - fadeScreenW, skirtBottom);
                ctx.closePath();
                ctx.fill();

                // Slanted sandy shoreline wedge rising out of the midground ocean at Exit (/)
                const exitShoreGrad = ctx.createLinearGradient(endScreenX - slantScreenW * 0.65, baseY + 160, endScreenX + 90, baseY - 12);
                exitShoreGrad.addColorStop(0, 'rgba(2, 132, 199, 0)');
                exitShoreGrad.addColorStop(0.5, '#f59e0b');
                exitShoreGrad.addColorStop(1, '#fbbf24');
                ctx.fillStyle = exitShoreGrad;
                ctx.beginPath();
                ctx.moveTo(endScreenX - 30, oceanTopY);
                ctx.lineTo(endScreenX + 120, baseY - 12);
                ctx.lineTo(endScreenX + 120, skirtBottom);
                ctx.lineTo(endScreenX - slantScreenW * 0.75, skirtBottom);
                ctx.closePath();
                ctx.fill();

                // Continuous rolling wave crests clipped to the ocean span
                const waveLeft = Math.max(-100, startScreenX + 20);
                const waveRight = Math.min(canvasW + 100, endScreenX - 20);
                if (waveRight > waveLeft) {
                    const wavePhase = performance.now() * 0.003;
                    ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    for (let wx = waveLeft; wx <= waveRight; wx += 24) {
                        const worldWaveX = wx + midScrollX;
                        const wy = oceanTopY + 14 + Math.sin(wavePhase + worldWaveX * 0.025) * 5;
                        if (wx === waveLeft) ctx.moveTo(wx, wy);
                        else ctx.lineTo(wx, wy);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        // PASS 2: Back-Layer Silhouettes (Fixed Proportional Pixel Heights — Never Stretches When Browser Zooms Out!)
        for (let s = firstSlot; s <= lastSlot; s++) {
            const screenX = s * slotWidth - midScrollX;
            const slotWorldX = (s * slotWidth) / midRatio;
            const biome = this.getBiomeAt(slotWorldX);
            const h = this.hashInt(s * 131 + 17);

            if (biome === 'city') {
                const backColors = ['#0f172a', '#1e3a8a', '#334155', '#1e293b', '#0369a1'];
                const backW = 240 + ((h >>> 3) % 80);
                const backH = 440 + ((h >>> 7) % 150);
                const backX = screenX + 85 - backW * 0.5;
                const backY = baseY - backH;
                ctx.fillStyle = backColors[h % backColors.length];
                ctx.fillRect(backX, backY, backW, backH);
            } else if (biome === 'forest') {
                const bgTreeH = 410 + ((h >>> 6) % 130);
                const bgTx = screenX + 75;
                const crownY = baseY - bgTreeH + 95;
                ctx.fillStyle = '#3f2716';
                ctx.fillRect(bgTx - 22, crownY, 44, baseY - crownY + 8);
                ctx.fillStyle = '#14532d';
                // Individual circle calls so Canvas never draws straight chord lines between puffs!
                fillCircle(bgTx - 62, crownY + 25, 92);
                fillCircle(bgTx + 62, crownY + 25, 92);
                fillCircle(bgTx, crownY - 35, 108);
            } else if (biome === 'desert') {
                const backDuneW = 680 + ((h >>> 3) % 380);
                const backDuneH = 220 + ((h >>> 6) % 170);
                const bx = screenX + 110;
                const by = baseY - backDuneH;
                ctx.fillStyle = '#d97706';
                ctx.beginPath();
                ctx.moveTo(bx - backDuneW * 0.65, baseY + 18);
                ctx.quadraticCurveTo(bx - backDuneW * 0.2, by - 12, bx, by);
                ctx.quadraticCurveTo(bx + backDuneW * 0.2, by + 12, bx + backDuneW * 0.65, baseY + 18);
                ctx.closePath();
                ctx.fill();
            }
        }

        // PASS 3: Foreground Midground Structures (Fixed Proportional Heights — Never Warps on Zoom!)
        for (let s = firstSlot; s <= lastSlot; s++) {
            const screenX = s * slotWidth - midScrollX;
            const slotWorldX = (s * slotWidth) / midRatio;
            const biome = this.getBiomeAt(slotWorldX);
            const h = this.hashInt(s * 131 + 17);

            ctx.save();
            if (biome === 'city') {
                const palettes = [
                    { face: '#1e293b', side: '#0f172a', glass: '#334155', accent: '#475569', border: '#090d16', awning: '#0284c7' },
                    { face: '#60a5fa', side: '#2563eb', glass: '#93c5fd', accent: '#bfdbfe', border: '#1d4ed8', awning: '#1e3a8a' },
                    { face: '#f8fafc', side: '#cbd5e1', glass: '#e2e8f0', accent: '#94a3b8', border: '#64748b', awning: '#0284c7' },
                    { face: '#475569', side: '#1e293b', glass: '#64748b', accent: '#94a3b8', border: '#0f172a', awning: '#38bdf8' },
                    { face: '#bae6fd', side: '#38bdf8', glass: '#e0f2fe', accent: '#7dd3fc', border: '#0284c7', awning: '#0f172a' }
                ];
                const palIdx = (s * 2 + (h % 2)) % palettes.length;
                const pal = palettes[(palIdx + palettes.length) % palettes.length];

                const bw = 225 + (h % 85);
                const bh = 350 + ((h >>> 4) % 210);
                const sideW = 38;
                const bx = screenX - bw / 2;
                const by = baseY - bh;

                ctx.fillStyle = pal.face;
                ctx.fillRect(bx, by, bw, bh);

                ctx.fillStyle = pal.side;
                ctx.fillRect(bx + bw, by + 12, sideW, bh - 12);

                ctx.strokeStyle = pal.border;
                ctx.lineWidth = 4;
                ctx.strokeRect(bx, by, bw, bh);

                if ((h & 1) === 0) {
                    ctx.fillStyle = pal.side;
                    ctx.fillRect(bx + bw * 0.16, by - 42, bw * 0.68, 42);
                    ctx.fillStyle = pal.accent;
                    ctx.fillRect(bx + bw * 0.32, by - 68, bw * 0.36, 26);
                }

                const lobbyH = 54;
                const glassBottom = baseY - lobbyH - 12;
                ctx.fillStyle = pal.glass;
                if ((h % 3) === 0) {
                    const colW = Math.floor((bw - 56) / 3);
                    for (let c = 0; c < 3; c++) {
                        ctx.fillRect(bx + 18 + c * (colW + 10), by + 24, colW, Math.max(20, glassBottom - (by + 24)));
                    }
                } else if ((h % 3) === 1) {
                    for (let yBand = by + 32; yBand < glassBottom - 24; yBand += 68) {
                        ctx.fillRect(bx + 22, yBand, bw - 44, 28);
                    }
                } else {
                    const panelH = Math.max(20, glassBottom - (by + 28));
                    ctx.fillRect(bx + 28, by + 28, bw - 56, panelH);
                    ctx.fillStyle = pal.accent;
                    ctx.globalAlpha = 0.35;
                    ctx.beginPath();
                    ctx.moveTo(bx + 28, by + 28);
                    ctx.lineTo(bx + bw - 28, by + 28);
                    ctx.lineTo(bx + 28, Math.min(glassBottom, by + 190));
                    ctx.closePath();
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }

                ctx.fillStyle = pal.side;
                ctx.fillRect(bx + 2, baseY - lobbyH, bw - 4, lobbyH);
                const doorW = Math.min(90, bw * 0.42);
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(screenX - doorW * 0.5, baseY - lobbyH + 14, doorW, lobbyH - 14);
                ctx.fillStyle = '#38bdf8';
                ctx.globalAlpha = 0.45;
                ctx.fillRect(screenX - doorW * 0.5 + 6, baseY - lobbyH + 20, doorW * 0.5 - 8, lobbyH - 20);
                ctx.fillRect(screenX + 2, baseY - lobbyH + 20, doorW * 0.5 - 8, lobbyH - 20);
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = pal.awning;
                ctx.fillRect(screenX - doorW * 0.62, baseY - lobbyH + 4, doorW * 1.24, 12);
            } else if (biome === 'desert') {
                const duneW = 640 + (h % 460);
                const duneH = 240 + ((h >>> 4) % 240);
                const crestX = screenX + ((h % 90) - 45);
                const crestY = baseY - duneH;
                const duneBaseY = baseY + 36 + (h % 28);

                const dGrad = ctx.createLinearGradient(0, crestY, 0, duneBaseY);
                dGrad.addColorStop(0, '#fde047');
                dGrad.addColorStop(0.55, '#f59e0b');
                dGrad.addColorStop(1, '#d97706');
                ctx.fillStyle = dGrad;
                ctx.beginPath();
                ctx.moveTo(crestX - duneW * 0.72, duneBaseY);
                ctx.quadraticCurveTo(crestX - duneW * 0.25, crestY - 14, crestX, crestY);
                ctx.quadraticCurveTo(crestX + duneW * 0.28, crestY + 18, crestX + duneW * 0.72, duneBaseY);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = 'rgba(146, 64, 14, 0.34)';
                ctx.beginPath();
                ctx.moveTo(crestX, crestY);
                ctx.quadraticCurveTo(crestX + duneW * 0.28, crestY + 18, crestX + duneW * 0.72, duneBaseY);
                ctx.lineTo(crestX + duneW * 0.14, duneBaseY);
                ctx.quadraticCurveTo(crestX - duneW * 0.06, crestY + duneH * 0.55, crestX, crestY);
                ctx.closePath();
                ctx.fill();

                if ((h % 10) < 5) {
                    const cx = crestX;
                    const cy = crestY + 10;
                    ctx.fillStyle = '#15803d';
                    ctx.beginPath();
                    ctx.roundRect(cx - 10, cy - 92, 20, 98, 9);
                    ctx.roundRect(cx - 36, cy - 64, 28, 14, 6);
                    ctx.roundRect(cx - 36, cy - 86, 14, 32, 6);
                    ctx.roundRect(cx + 8, cy - 52, 28, 14, 6);
                    ctx.roundRect(cx + 22, cy - 76, 14, 34, 6);
                    ctx.fill();
                }
            } else if (biome === 'forest') {
                const treeH = 310 + (h % 160);
                const tx = screenX;
                const ty = baseY;
                const crownY = ty - treeH + 85;

                ctx.fillStyle = '#5c3a21';
                ctx.fillRect(tx - 20, crownY, 40, ty - crownY + 6);
                ctx.fillStyle = '#3f2716';
                ctx.fillRect(tx, crownY, 20, ty - crownY + 6);

                if ((h & 1) === 0) {
                    for (let tier = 0; tier < 4; tier++) {
                        const tw = 140 - tier * 24;
                        const topY = ty - treeH + tier * 56;
                        ctx.fillStyle = tier % 2 === 0 ? '#22c55e' : '#16a34a';
                        ctx.beginPath();
                        ctx.moveTo(tx, topY);
                        ctx.lineTo(tx - tw, topY + 115);
                        ctx.lineTo(tx + tw, topY + 115);
                        ctx.closePath();
                        ctx.fill();
                    }
                } else {
                    ctx.fillStyle = '#15803d';
                    fillCircle(tx - 54, crownY + 18, 76);
                    fillCircle(tx + 54, crownY + 18, 76);
                    fillCircle(tx, crownY - 32, 88);

                    ctx.fillStyle = '#22c55e';
                    fillCircle(tx - 26, crownY - 20, 64);
                    fillCircle(tx + 24, crownY - 6, 56);
                }

                const bushPositions = [screenX - 58, screenX + 58];
                bushPositions.forEach((bx, bIdx) => {
                    const by = baseY - 6;
                    ctx.fillStyle = '#166534';
                    fillCircle(bx - 42, by + 6, 46);
                    fillCircle(bx + 42, by + 6, 46);
                    fillCircle(bx, by - 22, 56);

                    ctx.fillStyle = '#22c55e';
                    fillCircle(bx - 28, by - 4, 34);
                    fillCircle(bx + 26, by - 2, 32);
                    fillCircle(bx, by - 28, 42);

                    if (((h + bIdx) & 1) === 0) {
                        const flowerCols = ['#f43f5e', '#facc15', '#ec4899', '#c084fc'];
                        const fCol = flowerCols[(h + bIdx) % flowerCols.length];
                        const offsets = [[-32, -6], [-16, -24], [2, -32], [20, -22], [34, -4]];
                        for (const [ox, oy] of offsets) {
                            ctx.fillStyle = fCol;
                            fillCircle(bx + ox, by + oy, 7);
                            ctx.fillStyle = '#fef08a';
                            fillCircle(bx + ox, by + oy, 3);
                        }
                    }
                });
            } else if (biome === 'mountains') {
                const mw = 640 + (h % 340);
                const mh = 340 + ((h >>> 4) % 210);
                const peakX = screenX;
                const peakY = baseY - mh;
                const mBaseY = baseY + 45;

                ctx.fillStyle = '#64748b';
                ctx.beginPath();
                ctx.moveTo(peakX, peakY);
                ctx.lineTo(peakX - mw * 0.65, mBaseY);
                ctx.lineTo(peakX, mBaseY);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#334155';
                ctx.beginPath();
                ctx.moveTo(peakX, peakY);
                ctx.lineTo(peakX + mw * 0.65, mBaseY);
                ctx.lineTo(peakX, mBaseY);
                ctx.closePath();
                ctx.fill();

                const snowDepth = mh * 0.38;
                const snowW = mw * 0.65 * 0.38;
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.moveTo(peakX, peakY);
                ctx.lineTo(peakX - snowW, peakY + snowDepth);
                ctx.lineTo(peakX - snowW * 0.48, peakY + snowDepth - 22);
                ctx.lineTo(peakX, peakY + snowDepth + 14);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#cbd5e1';
                ctx.beginPath();
                ctx.moveTo(peakX, peakY);
                ctx.lineTo(peakX + snowW, peakY + snowDepth);
                ctx.lineTo(peakX + snowW * 0.45, peakY + snowDepth - 18);
                ctx.lineTo(peakX, peakY + snowDepth + 14);
                ctx.closePath();
                ctx.fill();
            } else if (biome === 'beach') {
                const px = screenX;
                const py = baseY + 12;
                const lean = ((h % 70) - 35) * 1.3;
                const topX = px + lean;
                const topY = py - (290 + (h % 130));

                ctx.strokeStyle = '#78350f';
                ctx.lineWidth = 22;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(px, py + 24);
                ctx.quadraticCurveTo(px + lean * 0.35, (py + topY) * 0.5, topX, topY);
                ctx.stroke();

                ctx.fillStyle = '#451a03';
                fillCircle(topX - 10, topY + 10, 11);
                fillCircle(topX + 10, topY + 8, 11);

                const frondAngles = [-2.55, -1.95, -1.25, -0.45, 0.35, 1.05];
                for (const fa of frondAngles) {
                    const fx = topX + Math.cos(fa) * 125;
                    const fy = topY + Math.sin(fa) * 75 + 28;
                    ctx.strokeStyle = fa < -1 ? '#15803d' : '#22c55e';
                    ctx.lineWidth = 11;
                    ctx.beginPath();
                    ctx.moveTo(topX, topY);
                    ctx.quadraticCurveTo((topX + fx) * 0.5, topY - 32, fx, fy);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
    }

    // 3. Large, Ground-Planted 3D Breakable Obstacles (Rooted into the surface so nothing ever floats!)
    drawObstacleProp(ctx, prop) {
        const { x, y, w, h, kind, slope, biome, variant } = prop;
        ctx.save();
        // Sink 8px into the 16px-thick surface crust so obstacles on curved hills never float at the edges
        ctx.translate(x, y + 8);
        ctx.rotate(Math.atan(slope || 0) * 0.85);

        if (kind === 'car') {
            const carColors = [
                { body: '#2563eb', roof: '#60a5fa', dark: '#1e3a8a' },
                { body: '#dc2626', roof: '#f87171', dark: '#7f1d1d' },
                { body: '#e2e8f0', roof: '#ffffff', dark: '#64748b' },
                { body: '#334155', roof: '#64748b', dark: '#0f172a' }
            ];
            const c = carColors[(variant || 0) % carColors.length];
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(-w * 0.48, -6, w * 0.96, 10);
            ctx.fillStyle = c.body;
            ctx.beginPath();
            ctx.roundRect(-w * 0.5, -h * 0.58, w, h * 0.40, 14);
            ctx.fill();
            ctx.fillStyle = c.roof;
            ctx.beginPath();
            ctx.moveTo(-w * 0.34, -h * 0.58);
            ctx.lineTo(-w * 0.18, -h);
            ctx.lineTo(w * 0.22, -h);
            ctx.lineTo(w * 0.38, -h * 0.58);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(-w * 0.28, -h * 0.60);
            ctx.lineTo(-w * 0.15, -h * 0.91);
            ctx.lineTo(w * 0.19, -h * 0.91);
            ctx.lineTo(w * 0.32, -h * 0.60);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(w * 0.43, -h * 0.48, 12, 16);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-w * 0.49, -h * 0.48, 10, 16);
            const wheelR = h * 0.22;
            [-w * 0.31, w * 0.31].forEach(wx => {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(wx, -wheelR + 2, wheelR, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#94a3b8';
                ctx.beginPath();
                ctx.arc(wx, -wheelR + 2, wheelR * 0.5, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (kind === 'lamp_post') {
            ctx.fillStyle = '#334155';
            ctx.fillRect(-22, -26, 44, 30);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-7, -h, 14, h - 22);
            ctx.fillRect(-7, -h, 68, 12);
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(50, -h + 16, 18, 0, Math.PI * 2);
            ctx.fill();
        } else if (kind === 'dumpster') {
            ctx.fillStyle = '#15803d';
            ctx.fillRect(-w * 0.5, -h, w * 0.78, h + 4);
            ctx.fillStyle = '#166534';
            ctx.fillRect(w * 0.28, -h + 8, w * 0.22, h - 4);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-w * 0.53, -h - 14, w * 1.06, 18);
            ctx.fillStyle = '#14532d';
            ctx.fillRect(-w * 0.26, -h + 16, 10, h - 24);
            ctx.fillRect(0, -h + 16, 10, h - 24);
        } else if (kind === 'bush') {
            const isSnow = biome === 'mountains';
            ctx.fillStyle = '#14532d';
            ctx.beginPath();
            ctx.arc(-w * 0.26, -h * 0.28, h * 0.42, 0, Math.PI * 2);
            ctx.arc(w * 0.26, -h * 0.28, h * 0.42, 0, Math.PI * 2);
            ctx.arc(0, -h * 0.52, h * 0.52, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = isSnow ? '#f8fafc' : '#22c55e';
            ctx.beginPath();
            ctx.arc(-w * 0.18, -h * 0.38, h * 0.32, 0, Math.PI * 2);
            ctx.arc(w * 0.16, -h * 0.34, h * 0.30, 0, Math.PI * 2);
            ctx.arc(0, -h * 0.60, h * 0.38, 0, Math.PI * 2);
            ctx.fill();
        } else if (kind === 'tree') {
            const isSnow = biome === 'mountains';
            ctx.fillStyle = '#5c3a21';
            ctx.fillRect(-24, -h * 0.42, 48, h * 0.44);
            ctx.fillStyle = '#3f2716';
            ctx.fillRect(0, -h * 0.42, 24, h * 0.44);
            if (isSnow || (variant % 2 === 0 && biome !== 'city')) {
                for (let t = 0; t < 3; t++) {
                    const tw = w * 0.52 - t * 24;
                    const ty = -h + t * (h * 0.21);
                    ctx.fillStyle = '#15803d';
                    ctx.beginPath();
                    ctx.moveTo(0, ty);
                    ctx.lineTo(-tw, ty + h * 0.34);
                    ctx.lineTo(tw, ty + h * 0.34);
                    ctx.closePath();
                    ctx.fill();
                    if (isSnow) {
                        ctx.fillStyle = '#f8fafc';
                        ctx.beginPath();
                        ctx.moveTo(0, ty);
                        ctx.lineTo(-tw * 0.55, ty + h * 0.18);
                        ctx.lineTo(tw * 0.55, ty + h * 0.18);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            } else {
                ctx.fillStyle = '#15803d';
                ctx.beginPath();
                ctx.arc(-w * 0.24, -h * 0.56, w * 0.32, 0, Math.PI * 2);
                ctx.arc(w * 0.24, -h * 0.56, w * 0.32, 0, Math.PI * 2);
                ctx.arc(0, -h * 0.74, w * 0.38, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.arc(-w * 0.12, -h * 0.72, w * 0.28, 0, Math.PI * 2);
                ctx.arc(w * 0.14, -h * 0.60, w * 0.24, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (kind === 'dead_bush') {
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            const branches = [
                [0, 4, 0, -h * 0.9], [0, -h * 0.3, -w * 0.35, -h * 0.8], [0, -h * 0.42, w * 0.38, -h * 0.85],
                [-w * 0.18, -h * 0.55, -w * 0.44, -h * 0.94], [w * 0.18, -h * 0.6, w * 0.45, -h * 0.96]
            ];
            ctx.beginPath();
            for (const [x1, y1, x2, y2] of branches) {
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.stroke();
        } else if (kind === 'cactus') {
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.roundRect(-24, -h, 48, h + 6, 24);
            ctx.roundRect(-72, -h * 0.65, 52, 28, 14);
            ctx.roundRect(-72, -h * 0.88, 28, h * 0.28, 14);
            ctx.roundRect(20, -h * 0.52, 52, 28, 14);
            ctx.roundRect(44, -h * 0.78, 28, h * 0.30, 14);
            ctx.fill();
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.roundRect(-12, -h + 8, 16, h - 12, 8);
            ctx.fill();
        } else if (kind === 'fallen_log') {
            ctx.fillStyle = '#5c3a21';
            ctx.beginPath();
            ctx.roundRect(-w * 0.5, -h + 6, w, h, 28);
            ctx.fill();
            ctx.fillStyle = '#3f2716';
            ctx.fillRect(-w * 0.45, -h * 0.5 + 6, w * 0.85, h * 0.5);
            ctx.fillStyle = '#d6b38c';
            ctx.beginPath();
            ctx.ellipse(w * 0.44, -h * 0.5 + 6, 22, h * 0.48, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1c1008';
            ctx.beginPath();
            ctx.ellipse(w * 0.44, -h * 0.5 + 6, 14, h * 0.32, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.roundRect(-w * 0.3, -h - 2, w * 0.52, 18, 9);
            ctx.fill();
        } else if (kind === 'tall_grass') {
            const blades = [-64, -46, -28, -10, 8, 26, 44, 62];
            blades.forEach((bx, idx) => {
                ctx.strokeStyle = idx % 2 === 0 ? '#16a34a' : '#22c55e';
                ctx.lineWidth = 9;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(bx, 4);
                ctx.quadraticCurveTo(bx + (idx % 2 === 0 ? -14 : 14), -h * 0.55, bx + (idx - 3.5) * 6, -h * 0.85 - (idx % 3) * 12);
                ctx.stroke();
            });
        } else if (kind === 'snow_pile') {
            // Centered at y = +4 so the flat bottom of the snow pile sits 100% flush with the snow surface!
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(-w * 0.24, 4, h * 0.58, Math.PI, 0);
            ctx.arc(w * 0.24, 4, h * 0.52, Math.PI, 0);
            ctx.arc(0, 4, h * 0.78, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-w * 0.20, 4, h * 0.48, Math.PI, 0);
            ctx.arc(w * 0.18, 4, h * 0.42, Math.PI, 0);
            ctx.arc(-4, 4, h * 0.66, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
        } else if (kind === 'beach_umbrella') {
            ctx.save();
            ctx.rotate(0.15);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-6, -h, 12, h + 10);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -h + 75, w * 0.5, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, -h - 42);
            ctx.lineTo(-w * 0.2, -h + 75);
            ctx.lineTo(w * 0.2, -h + 75);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (kind === 'lifeguard_post') {
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(-68, 6); ctx.lineTo(-48, -h * 0.42);
            ctx.moveTo(68, 6);  ctx.lineTo(48, -h * 0.42);
            ctx.moveTo(-58, -h * 0.21); ctx.lineTo(58, -h * 0.21);
            ctx.stroke();
            ctx.fillStyle = '#b45309';
            ctx.fillRect(-92, -h * 0.45, 184, 18);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(-66, -h * 0.84, 132, h * 0.39);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-40, -h * 0.76, 80, 48);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(-88, -h * 0.84);
            ctx.lineTo(0, -h);
            ctx.lineTo(88, -h * 0.84);
            ctx.closePath();
            ctx.fill();
        } else if (kind === 'fallen_coconut') {
            ctx.fillStyle = '#5c3a21';
            ctx.beginPath();
            ctx.arc(-18, -18, 26, 0, Math.PI * 2);
            ctx.arc(22, -16, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3f2716';
            ctx.beginPath();
            ctx.arc(-12, -24, 4, 0, Math.PI * 2);
            ctx.arc(-22, -26, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (kind === 'sun_chair') {
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 11;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-74, 4); ctx.lineTo(-42, -30);
            ctx.moveTo(64, 4);  ctx.lineTo(32, -30);
            ctx.moveTo(-84, -30); ctx.lineTo(42, -30);
            ctx.lineTo(84, -90);
            ctx.stroke();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.moveTo(-80, -34);
            ctx.lineTo(38, -34);
            ctx.lineTo(78, -90);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Smooth RGB Color Blending Helper for Seamless Biome Transitions
    getBlendedBiomeColorsAt(x) {
        const PAL = {
            city:      { ugTop: [63, 63, 70],    ugBot: [24, 24, 27],   strata: [82, 82, 91],    surf: [156, 163, 175], surfEdge: [212, 212, 216] },
            desert:    { ugTop: [180, 83, 9],    ugBot: [120, 53, 15],  strata: [217, 119, 6],   surf: [251, 191, 36],  surfEdge: [253, 230, 138] },
            forest:    { ugTop: [92, 58, 33],    ugBot: [46, 26, 13],   strata: [120, 53, 15],   surf: [34, 197, 94],   surfEdge: [74, 222, 128] },
            mountains: { ugTop: [51, 65, 85],    ugBot: [15, 23, 42],   strata: [71, 85, 105],   surf: [248, 250, 252], surfEdge: [255, 255, 255] },
            beach:     { ugTop: [180, 83, 9],    ugBot: [120, 53, 15],  strata: [217, 119, 6],   surf: [251, 191, 36],  surfEdge: [253, 230, 138] },
            ocean:     { ugTop: [2, 132, 199],   ugBot: [12, 74, 110],  strata: [56, 189, 248],  surf: [56, 189, 248],  surfEdge: [186, 230, 253] }
        };

        const fadeHalfW = 900;
        if (!this.biomeSpans || this.biomeSpans.length === 0) {
            const p = PAL.city;
            return {
                ugTop: `rgb(${p.ugTop.join(',')})`,
                ugBot: `rgb(${p.ugBot.join(',')})`,
                strata: `rgb(${p.strata.join(',')})`,
                surf: `rgb(${p.surf.join(',')})`,
                surfEdge: `rgb(${p.surfEdge.join(',')})`
            };
        }

        let curSpanIdx = 0;
        for (let i = 0; i < this.biomeSpans.length; i++) {
            if (x >= this.biomeSpans[i].startX && x <= this.biomeSpans[i].endX) {
                curSpanIdx = i;
                break;
            }
        }

        const curSpan = this.biomeSpans[curSpanIdx] || this.biomeSpans[0];
        const pCur = PAL[curSpan.biome] || PAL.city;
        let pOther = pCur;
        let t = 0;

        if (x - curSpan.startX < fadeHalfW && curSpanIdx > 0) {
            const prevBiome = this.biomeSpans[curSpanIdx - 1].biome;
            if (!((curSpan.biome === 'ocean' && prevBiome === 'beach') || (curSpan.biome === 'beach' && prevBiome === 'ocean'))) {
                pOther = PAL[prevBiome] || pCur;
                t = 0.5 * (1 - (x - curSpan.startX) / fadeHalfW);
            }
        } else if (curSpan.endX - x < fadeHalfW && curSpanIdx < this.biomeSpans.length - 1) {
            const nextBiome = this.biomeSpans[curSpanIdx + 1].biome;
            if (!((curSpan.biome === 'ocean' && nextBiome === 'beach') || (curSpan.biome === 'beach' && nextBiome === 'ocean'))) {
                pOther = PAL[nextBiome] || pCur;
                t = 0.5 * (1 - (curSpan.endX - x) / fadeHalfW);
            }
        }

        return {
            ugTop: this.lerpColor(pCur.ugTop, pOther.ugTop, t),
            ugBot: this.lerpColor(pCur.ugBot, pOther.ugBot, t),
            strata: this.lerpColor(pCur.strata, pOther.strata, t),
            surf: this.lerpColor(pCur.surf, pOther.surf, t),
            surfEdge: this.lerpColor(pCur.surfEdge, pOther.surfEdge, t)
        };
    }

    drawFlatSilhouette(ctx, scale = 0.58, alpha = 1.0) {
        if (!this.silCanvas) {
            this.silCanvas = document.createElement('canvas');
            this.silCanvas.width = 560;
            this.silCanvas.height = 560;
        } else if (this.silCanvas.width !== 560) {
            this.silCanvas.width = 560;
            this.silCanvas.height = 560;
        }
        const sctx = this.silCanvas.getContext('2d');
        sctx.clearRect(0, 0, 560, 560);
        sctx.globalCompositeOperation = 'source-over';
        this.rig.draw(sctx, 280, 280, scale);
        sctx.globalCompositeOperation = 'source-in';
        sctx.fillStyle = '#000000';
        sctx.fillRect(0, 0, 560, 560);
        sctx.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.drawImage(this.silCanvas, -280, -280 - 85);
        ctx.restore();
    }

    draw(ctx, canvasW, canvasH) {
        ctx.save();

        // 1. Default Crisp Blue Sky Background (Always stays its default blue across the sky!)
        const sky = ctx.createLinearGradient(0, 0, 0, canvasH);
        sky.addColorStop(0, '#0ea5e9');
        sky.addColorStop(0.65, '#7dd3fc');
        sky.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 2. Slanted (\\\\\\) Left-Side Speed Tier Gradient Overlay that Smoothly Transitions into the Blue Sky
        const useTierSky = this.dataManager.state.settings?.tierSkyColor !== false;
        const tierAlpha = useTierSky ? Math.max(this.tier2SkyBlend, this.tier3SkyBlend, this.tier4SkyBlend) : 0;
        if (tierAlpha > 0.005) {
            // Blend active tier color: Tier 2 (Deep Indigo) -> Tier 3 (Crimson Red) -> Tier 4 (Hypersonic Amber)
            const t23 = [
                30 + (159 - 30) * this.tier3SkyBlend,
                27 + (18 - 27) * this.tier3SkyBlend,
                75 + (57 - 75) * this.tier3SkyBlend
            ];
            const r = Math.round(t23[0] + (217 - t23[0]) * this.tier4SkyBlend);
            const g = Math.round(t23[1] + (119 - t23[1]) * this.tier4SkyBlend);
            const b = Math.round(t23[2] + (6 - t23[2]) * this.tier4SkyBlend);

            ctx.save();
            // Horizontal shear (+0.48) makes vertical lines slant like \\\\\\ from top-left to bottom-right!
            ctx.transform(1, 0, 0.48, 1, 0, 0);
            const reachW = canvasW * 0.68;
            const tierGrad = ctx.createLinearGradient(0, 0, reachW, 0);
            tierGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.92 * tierAlpha})`);
            tierGrad.addColorStop(0.38, `rgba(${r}, ${g}, ${b}, ${0.68 * tierAlpha})`);
            tierGrad.addColorStop(0.72, `rgba(${r}, ${g}, ${b}, ${0.26 * tierAlpha})`);
            tierGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            ctx.fillStyle = tierGrad;
            ctx.fillRect(-canvasH, 0, reachW + canvasH, canvasH);
            ctx.restore();
        }

        // 3. Draw Parallax Background Clouds & Raised Midgrounds in Screen Space
        this.drawBackgroundClouds(ctx, canvasW, canvasH);
        this.drawMidgroundLayer(ctx, canvasW, canvasH);

        const zoom = this.cameraZoom || 1.0;
        const viewW = canvasW / zoom;
        const viewH = canvasH / zoom;

        ctx.scale(zoom, zoom);

        const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
        const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
        const camX = this.worldX - viewW * 0.25 + shakeX;
        const camY = this.y - viewH * 0.64 + shakeY;

        ctx.translate(-camX, -camY);

        // 4. Single Continuous Full-Screen Underground & Surface Polygon (Zero Vertical Seams!)
        const startX = Math.floor(camX / 20) * 20 - 80;
        const endX = camX + viewW + 160;
        const bottomY = camY + viewH + 800;

        const ugHorizGrad = ctx.createLinearGradient(startX, 0, endX, 0);
        const strataHorizGrad = ctx.createLinearGradient(startX, 0, endX, 0);
        const surfHorizGrad = ctx.createLinearGradient(startX, 0, endX, 0);
        const edgeHorizGrad = ctx.createLinearGradient(startX, 0, endX, 0);

        const stops = 12;
        for (let i = 0; i <= stops; i++) {
            const frac = i / stops;
            const sampleX = startX + (endX - startX) * frac;
            const bPal = this.getBlendedBiomeColorsAt(sampleX);
            const segAtSample = this.getSegmentAt(sampleX);
            const is10k = segAtSample && segAtSample.type === 'proving_straight_10k';

            // Keep the base underground polygon sandy amber ('rgb(180, 83, 9)') under Ocean spans so the slanted ocean water can fade over it with zero vertical cut!
            const rawBiome = this.getBiomeAt(sampleX);
            ugHorizGrad.addColorStop(frac, rawBiome === 'ocean' ? 'rgb(180, 83, 9)' : bPal.ugTop);
            strataHorizGrad.addColorStop(frac, bPal.strata);
            surfHorizGrad.addColorStop(frac, is10k ? '#fde047' : bPal.surf);
            edgeHorizGrad.addColorStop(frac, is10k ? '#ffffff' : bPal.surfEdge);
        }

        // Single unbroken underground polygon across the entire screen
        ctx.beginPath();
        ctx.moveTo(startX, bottomY);
        for (let x = startX; x <= endX; x += 20) {
            ctx.lineTo(x, this.getTerrainY(x));
        }
        ctx.lineTo(endX, this.getTerrainY(endX));
        ctx.lineTo(endX, bottomY);
        ctx.closePath();

        ctx.fillStyle = ugHorizGrad;
        ctx.fill();

        // Slanted & Smoothly Faded Beach <-> Ocean Underground Water Body (Drawn BEFORE depthGrad so shading matches 100%!)
        if (this.biomeSpans) {
            const slantW = 1400; // Horizontal slant distance of the seabed
            const fadeBand = 480; // Soft gradient feathering across the diagonal slant
            for (let i = 0; i < this.biomeSpans.length; i++) {
                const span = this.biomeSpans[i];
                if (span.biome !== 'ocean') continue;
                if (span.endX + slantW < startX || span.startX - slantW > endX) continue;

                const syStart = this.getTerrainY(span.startX);
                const syEnd = this.getTerrainY(span.endX);

                // 1. Main slanted ocean water basin polygon (slants down-right at entry \ and up-right at exit /)
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(span.startX, syStart);
                ctx.lineTo(span.endX, syEnd);
                ctx.lineTo(span.endX - slantW, bottomY);
                ctx.lineTo(span.startX + slantW, bottomY);
                ctx.closePath();
                ctx.fillStyle = 'rgb(2, 132, 199)';
                ctx.fill();

                // 2. Soft diagonal gradient fade along the Entry Shoreline (Beach sandy amber rgb(180,83,9) -> Ocean blue rgb(2,132,199))
                if (span.startX + slantW + fadeBand >= startX && span.startX - fadeBand <= endX) {
                    const entryGrad = ctx.createLinearGradient(
                        span.startX - fadeBand * 0.4, syStart + 180,
                        span.startX + slantW * 0.55 + fadeBand * 0.6, syStart + 180
                    );
                    entryGrad.addColorStop(0, 'rgb(180, 83, 9)');
                    entryGrad.addColorStop(0.5, 'rgb(91, 108, 104)');
                    entryGrad.addColorStop(1, 'rgb(2, 132, 199)');

                    ctx.fillStyle = entryGrad;
                    ctx.beginPath();
                    ctx.moveTo(span.startX - fadeBand, syStart);
                    ctx.lineTo(span.startX + fadeBand, syStart);
                    ctx.lineTo(span.startX + slantW + fadeBand, bottomY);
                    ctx.lineTo(span.startX + slantW - fadeBand, bottomY);
                    ctx.closePath();
                    ctx.fill();
                }

                // 3. Soft diagonal gradient fade along the Exit Shoreline (Ocean blue rgb(2,132,199) -> Beach sandy amber rgb(180,83,9))
                if (span.endX + fadeBand >= startX && span.endX - slantW - fadeBand <= endX) {
                    const exitGrad = ctx.createLinearGradient(
                        span.endX - slantW * 0.55 - fadeBand * 0.6, syEnd + 180,
                        span.endX + fadeBand * 0.4, syEnd + 180
                    );
                    exitGrad.addColorStop(0, 'rgb(2, 132, 199)');
                    exitGrad.addColorStop(0.5, 'rgb(91, 108, 104)');
                    exitGrad.addColorStop(1, 'rgb(180, 83, 9)');

                    ctx.fillStyle = exitGrad;
                    ctx.beginPath();
                    ctx.moveTo(span.endX - fadeBand, syEnd);
                    ctx.lineTo(span.endX + fadeBand, syEnd);
                    ctx.lineTo(span.endX - slantW + fadeBand, bottomY);
                    ctx.lineTo(span.endX - slantW - fadeBand, bottomY);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        // Vertical depth shading applied uniformly over the entire underground (including the slanted beach-ocean fade!)
        ctx.beginPath();
        ctx.moveTo(startX, bottomY);
        for (let x = startX; x <= endX; x += 20) {
            ctx.lineTo(x, this.getTerrainY(x));
        }
        ctx.lineTo(endX, this.getTerrainY(endX));
        ctx.lineTo(endX, bottomY);
        ctx.closePath();

        const depthGrad = ctx.createLinearGradient(0, camY + viewH * 0.45, 0, camY + viewH + 300);
        depthGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        depthGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = depthGrad;
        ctx.fill();

        // Continuous subsurface strata band
        ctx.beginPath();
        for (let x = startX; x <= endX; x += 24) {
            const ty = this.getTerrainY(x) + 36;
            if (x === startX) ctx.moveTo(x, ty);
            else ctx.lineTo(x, ty);
        }
        ctx.strokeStyle = strataHorizGrad;
        ctx.lineWidth = 14;
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Continuous Biome Surface Layer
        ctx.beginPath();
        for (let x = startX; x <= endX; x += 16) {
            const ty = this.getTerrainY(x);
            if (x === startX) ctx.moveTo(x, ty);
            else ctx.lineTo(x, ty);
        }
        ctx.strokeStyle = surfHorizGrad;
        ctx.lineWidth = 16;
        ctx.stroke();

        ctx.strokeStyle = edgeHorizGrad;
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // 5. Draw Ground-Planted Breakable Biome Obstacles
        for (const prop of this.props) {
            if (prop.shattered) continue;
            if (prop.x < camX - 500 || prop.x > camX + viewW + 500) continue;
            this.drawObstacleProp(ctx, prop);
        }

        for (const seg of this.segments) {
            if (seg.type === 'proving_straight_10k' && seg.startX > camX - 300 && seg.startX < camX + viewW + 300) {
                const gy = seg.startY;
                ctx.save();
                ctx.strokeStyle = '#fde047';
                ctx.lineWidth = 8;
                ctx.strokeRect(seg.startX - 10, gy - 250, 20, 250);
                ctx.fillStyle = '#fde047';
                ctx.font = 'bold 20px sans-serif';
                ctx.fillText(`⚡ ${seg.milestoneMeters.toLocaleString()}m SPEED TEST ZONE`, seg.startX - 110, gy - 265);
                ctx.restore();
            }
        }

        if (this.raceMode === 'story' && Number.isFinite(this.finishWorldX)) {
            const fy = this.getTerrainY(this.finishWorldX);
            ctx.save();
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 10;
            ctx.strokeRect(this.finishWorldX - 12, fy - 240, 24, 240);
            ctx.fillStyle = '#4ade80';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText('🏁 FINISH', this.finishWorldX - 48, fy - 255);
            ctx.restore();
        }

        for (const item of this.items) {
            if (item.collected) continue;
            if (item.x < camX - 150 || item.x > camX + viewW + 150) continue;
            ctx.save();
            ctx.translate(item.x, item.y);
            if (item.type === 'cell') {
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(0, 0, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();
            } else if (item.type === 'scrap') {
                ctx.fillStyle = '#c084fc';
                ctx.rotate(performance.now() * 0.004);
                ctx.fillRect(-12, -12, 24, 24);
            } else if (item.type === 'module') {
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        if (this.isDrafting && this.rival) {
            ctx.save();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                const wy = this.y - 30 - i * 22;
                ctx.beginPath();
                ctx.moveTo(this.rival.x - 20, wy);
                ctx.lineTo(this.worldX + 20, wy);
                ctx.stroke();
            }
            ctx.restore();
        }

        if (this.raceMode === 'story' && this.rival) {
            const rAngle = Math.atan(this.getTerrainSlope(this.rival.x));
            ctx.save();
            ctx.translate(this.rival.x, this.rival.y);
            ctx.rotate(rAngle * 0.65);
            this.rivalRig.draw(ctx, 0, -85, 0.58);
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(this.currentRivalSpec.name, -45, -165);
            ctx.restore();
        }

        const { stretchX, stretchY } = this.getSpeedStretch();
        const settings = this.dataManager.state.settings || {};
        const trailColor = settings.trailColor || '#38bdf8';
        const isRainbow = Boolean(settings.trailRainbow);
        const rainbowPalette = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#a855f7', '#ec4899'];

        const savedRigTime = this.rig.time;
        const savedAnimState = this.rig.animState;
        const maxTrailDist = 185;

        for (let i = 0; i < this.afterimages.length; i++) {
            const ai = this.afterimages[i];
            const distBehind = this.worldX - ai.x;
            if (distBehind <= 2 || distBehind > maxTrailDist) continue;

            // Density & brightness are strongest right behind the character and taper off steeply with distance
            const closeness = Math.max(0, 1 - distBehind / maxTrailDist);
            const a = Math.max(0, Math.min(1, ai.alpha)) * Math.pow(closeness, 1.65);
            if (a <= 0.015) continue;

            const tintHex = isRainbow
                ? rainbowPalette[(Math.floor(performance.now() / 55) + i) % rainbowPalette.length]
                : trailColor;

            // Freeze the rig at the exact pose & time when this afterimage was created (zero motion!)
            if (ai.rigTime !== undefined) this.rig.time = ai.rigTime;
            if (ai.animState) this.rig.animState = ai.animState;

            ctx.save();
            ctx.translate(ai.x, ai.y);
            if (ai.rot) ctx.rotate(ai.rot);
            ctx.scale(stretchX, stretchY);

            // Pass 1: Vibrant tinted silhouette
            ctx.globalAlpha = a * 0.85;
            this.rig.draw(ctx, 0, -85, 0.58, tintHex);

            // Pass 2: Additive neon glow & core bloom
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = a * 0.62;
            this.rig.draw(ctx, 0, -87, 0.62, tintHex);
            ctx.globalAlpha = a * 0.32 * closeness;
            this.rig.draw(ctx, 0, -85, 0.56, '#ffffff');

            ctx.restore();
        }

        this.rig.time = savedRigTime;
        this.rig.animState = savedAnimState;

        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }
            ctx.restore();
        }

        for (const sw of this.shockwaves) {
            ctx.save();
            ctx.strokeStyle = `rgba(${sw.color || '244, 63, 94'}, ${sw.alpha})`;
            ctx.lineWidth = sw.width || 8;
            ctx.beginPath();
            ctx.ellipse(sw.x, sw.y, sw.radius * 0.55, sw.radius, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Sonic Rush Style Endless Intro: White screen + slow-mo black silhouette fading into the stage
        const isEndlessIntro = this.raceMode === 'endless' && this.countdownTimer > 0;
        let introWhiteAlpha = 0;
        let introZoom = 1;
        let introOffsetX = 0;
        let introOffsetY = 0;

        if (isEndlessIntro) {
            const introTotal = this.introDuration || 3.0;
            const prog = Math.min(1, Math.max(0, 1 - this.countdownTimer / introTotal));
            // Holds pure white until 58% of the intro, then smoothly fades out to reveal the stage
            if (prog < 0.58) {
                introWhiteAlpha = 1.0;
            } else {
                const fadeT = (prog - 0.58) / 0.42;
                introWhiteAlpha = 0.5 * (1 + Math.cos(fadeT * Math.PI));
            }
            const easeOut = Math.pow(1 - prog, 1.65);
            introZoom = 1 + easeOut * 0.65;
            introOffsetX = easeOut * (viewW * 0.16);
            introOffsetY = -easeOut * 45;

            if (introWhiteAlpha > 0.005) {
                ctx.save();
                ctx.fillStyle = `rgba(255, 255, 255, ${introWhiteAlpha})`;
                ctx.fillRect(camX - 200, camY - 200, viewW + 400, viewH + 400);
                ctx.restore();
            }
        }

        const slopeAngle = Math.atan(this.getTerrainSlope(this.worldX));
        const airAngle = Math.max(-0.55, Math.min(0.65, Math.atan2(this.vy, this.vx) * 0.6));
        ctx.save();
        ctx.translate(this.worldX + introOffsetX, this.y + introOffsetY);
        ctx.rotate(this.grounded ? slopeAngle * 0.65 : airAngle);
        ctx.scale(introZoom, introZoom);

        // 2000+ m/s Character Overdrive Glow (Shifts from Solar Gold/Orange to Electric Blue at 2500+ m/s)
        const GLOW_START_VX = 20000; // 2000 m/s
        if (this.vx >= GLOW_START_VX) {
            const glowIntensity = Math.min(1, (this.vx - GLOW_START_VX) / 4000);
            const blueGlowBlend = Math.min(1, Math.max(0, (this.vx - 25000) / 4500));
            const pulse = 0.88 + Math.sin(performance.now() * 0.025) * 0.12;
            const alpha = glowIntensity * pulse;

            const innerRgb = [
                Math.round(254 + (165 - 254) * blueGlowBlend),
                Math.round(240 + (243 - 240) * blueGlowBlend),
                Math.round(138 + (252 - 138) * blueGlowBlend)
            ];
            const outerRgb = [
                Math.round(249 + (56 - 249) * blueGlowBlend),
                Math.round(115 + (189 - 115) * blueGlowBlend),
                Math.round(22 + (248 - 22) * blueGlowBlend)
            ];
            const tintHex = blueGlowBlend > 0.5 ? '#67e8f9' : '#fde047';

            ctx.save();
            ctx.scale(stretchX, stretchY);

            // Radiant aura halo behind character
            const auraGrad = ctx.createRadialGradient(0, -78, 8, 0, -78, 115);
            auraGrad.addColorStop(0, `rgba(255, 255, 255, ${0.75 * alpha})`);
            auraGrad.addColorStop(0.35, `rgba(${innerRgb[0]}, ${innerRgb[1]}, ${innerRgb[2]}, ${0.55 * alpha})`);
            auraGrad.addColorStop(0.7, `rgba(${outerRgb[0]}, ${outerRgb[1]}, ${outerRgb[2]}, ${0.28 * alpha})`);
            auraGrad.addColorStop(1, `rgba(${outerRgb[0]}, ${outerRgb[1]}, ${outerRgb[2]}, 0)`);
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, -78, 115, 0, Math.PI * 2);
            ctx.fill();

            // Glowing outer character rim (uses pre-baked tintCache for 60 FPS)
            ctx.globalAlpha = 0.65 * alpha;
            this.rig.draw(ctx, 0, -85, 0.63, tintHex);
            ctx.restore();

            ctx.save();
            ctx.scale(stretchX, stretchY);
            this.rig.draw(ctx, 0, -85, 0.58);
            // Bright inner core bloom overlay on the character
            ctx.globalAlpha = 0.38 * alpha;
            this.rig.draw(ctx, 0, -85, 0.58, '#ffffff');
            ctx.restore();
        } else {
            ctx.save();
            ctx.scale(stretchX, stretchY);
            this.rig.draw(ctx, 0, -85, 0.58);
            if (introWhiteAlpha > 0.005) {
                this.drawFlatSilhouette(ctx, 0.58, introWhiteAlpha);
            }
            ctx.restore();
        }

        this.drawAerodynamicCones(ctx, stretchX);
        ctx.restore();

        ctx.restore();

        if (this.sonicBoomFlash > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.sonicBoomFlash * 0.45})`;
            ctx.fillRect(0, 0, canvasW, canvasH);
            ctx.restore();
        }
    }
}