import { HusserRig } from './rig.js';

// Speed Tier & Sonic Cone Thresholds (10 internal vx units = 1 m/s)
const TIER_2_VX = 2510;        // 251 m/s (Tier 2: 251 - 500 m/s)
const TIER_3_VX = 5010;        // 501 m/s (Tier 3: 501 - 1799 m/s)
const SONIC_CONE_VX = 6500;    // 650 m/s (Supersonic Boom Mach Cone threshold)
const FIRE_CONE_VX = 15000;    // 1500 m/s (Surging Meteorite Fire Cone threshold)
const TIER_4_VX = 18000;       // 1800 m/s (Tier 4: HYPERSONIC & Amber Sky threshold)
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
        if (!this.paused) {
            const settingsEl = document.getElementById('settings-modal');
            if (settingsEl) settingsEl.style.display = 'none';
        }
        this.pauseEl.style.display = this.paused ? 'flex' : 'none';
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
        this.countdownTimer = 2.6;
        this.lastCountdownSec = 4;
        this.hudEl.style.display = 'flex';
        this.pauseEl.style.display = 'none';
        this.raceProgressWrapEl.style.display = 'none';
        this.gameOverEl.style.display = 'none';
        this.scrapEl.style.display = 'block';
        this.modeLabelEl.textContent = 'ENDLESS SPRINT';
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
        this.modeLabelEl.textContent = 'SANDBOX (FLAT TRACK)';
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
        if (this.soundManager) this.soundManager.updateRunnerAudio(0, 0, false, false, false);
        this.hudEl.style.display = 'none';
        this.pauseEl.style.display = 'none';
        this.gameOverEl.style.display = 'none';
        this.alertBannerEl.style.display = 'none';
    }

    reset() {
        this.finishing = false;
        const stats = this.getUpgradeStats();

        this.segments = [
            { startX: -1000, endX: 1800, startY: 440, endY: 440, type: 'flat_highway', amp: 0, freq: 1 }
        ];
        this.next10kMilestoneMeters = 10000;
        this.ensureTerrainSegments(18000);

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
        this.stopTimer = 0;
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
            this.ensureTerrainSegments(this.finishWorldX + 5000);
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
        this.nextSpawnX = 950;
    }

    ensureTerrainSegments(targetX) {
        const archetypes = ['flat_highway', 'mega_drop', 'ski_ramp', 'rolling_sine', 'canyon_bowl', 'uphill_climb'];
        let lastSeg = this.segments[this.segments.length - 1];

        while (lastSeg.endX < targetX) {
            // Sandbox Mode: Pure infinite flat proving highway
            if (this.raceMode === 'sandbox') {
                const flatSeg = {
                    startX: lastSeg.endX,
                    endX: lastSeg.endX + 10000,
                    startY: 440,
                    endY: 440,
                    type: 'flat_highway',
                    amp: 0,
                    freq: 1
                };
                this.segments.push(flatSeg);
                lastSeg = flatSeg;
                continue;
            }

            const milestoneWorldX = this.next10kMilestoneMeters * PIXELS_PER_METER;

            if (this.raceMode === 'endless' && lastSeg.endX >= milestoneWorldX - 4000) {
                const straightSeg = {
                    startX: lastSeg.endX,
                    endX: lastSeg.endX + 30000,
                    startY: lastSeg.endY,
                    endY: lastSeg.endY,
                    type: 'proving_straight_10k',
                    milestoneMeters: this.next10kMilestoneMeters,
                    amp: 0,
                    freq: 1
                };
                this.segments.push(straightSeg);
                lastSeg = straightSeg;
                this.next10kMilestoneMeters += 10000;
                continue;
            }

            const prevType = lastSeg.type;
            let type;
            if (prevType !== 'flat_highway' && Math.random() < 0.42) {
                type = 'flat_highway';
            } else {
                const choices = archetypes.filter(a => a !== prevType);
                type = choices[Math.floor(Math.random() * choices.length)];
            }

            let length = 2600 + Math.random() * 3800;
            let deltaY = 0;
            let amp = 0;
            let freq = 1;

            if (type === 'flat_highway') {
                length = 3400 + Math.random() * 3800;
                deltaY = 0;
            } else if (type === 'mega_drop') {
                length = 2800 + Math.random() * 2400;
                deltaY = 340 + Math.random() * 440;
                amp = 95 + Math.random() * 90;
            } else if (type === 'ski_ramp') {
                length = 2400 + Math.random() * 1900;
                deltaY = 120 + Math.random() * 180;
                amp = 240 + Math.random() * 150;
            } else if (type === 'rolling_sine') {
                length = 4000 + Math.random() * 3600;
                deltaY = (Math.random() - 0.45) * 260;
                amp = 160 + Math.random() * 170;
                freq = 2 + Math.floor(Math.random() * 3);
            } else if (type === 'canyon_bowl') {
                length = 3200 + Math.random() * 2600;
                deltaY = 0;
                amp = 300 + Math.random() * 240;
            } else if (type === 'uphill_climb') {
                length = 2200 + Math.random() * 2000;
                deltaY = -(220 + Math.random() * 260);
                amp = 75 + Math.random() * 65;
            }

            const newSeg = {
                startX: lastSeg.endX,
                endX: lastSeg.endX + length,
                startY: lastSeg.endY,
                endY: Math.max(-700, Math.min(2400, lastSeg.endY + deltaY)),
                type,
                amp,
                freq
            };
            this.segments.push(newSeg);
            lastSeg = newSeg;
        }

        if (this.segments.length > 35) {
            this.segments = this.segments.filter(s => s.endX > (this.worldX || 0) - 9000);
        }
    }

    getSegmentAt(x) {
        for (let i = 0; i < this.segments.length; i++) {
            const s = this.segments[i];
            if (x >= s.startX && x <= s.endX) return s;
        }
        return this.segments[0];
    }

    getTerrainY(x) {
        if (x <= this.segments[0].startX) return this.segments[0].startY;
        const last = this.segments[this.segments.length - 1];
        if (x >= last.endX) {
            this.ensureTerrainSegments(x + 15000);
        }

        const seg = this.getSegmentAt(x);
        const t = (x - seg.startX) / (seg.endX - seg.startX);
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

    spawnWorldChunk(startX, endX) {
        if (this.raceMode === 'sandbox') return;
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

        for (let px = startX; px < endX; px += 380 + Math.random() * 280) {
            const ty = this.getTerrainY(px);
            const h = 100 + Math.random() * 190;
            const w = 50 + Math.random() * 55;
            this.props.push({
                x: px,
                y: ty,
                w,
                h,
                color: Math.random() > 0.5 ? '#1e293b' : '#334155',
                neon: this.isFlatSection(px) ? '#facc15' : (Math.random() > 0.5 ? '#38bdf8' : '#f43f5e'),
                shattered: false
            });
        }
    }

    spawnDebris(x, y, color, count = 14) {
        if (this.dataManager.state.settings?.particles === false) return;
        const cappedCount = Math.min(count, 10);
        while (this.particles.length + cappedCount > 65) {
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
                life: 1.0
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

    // 1500+ m/s Meteorite Fire Cone Ignition & 1800+ m/s Hypersonic Surge
    triggerFireCone(x, y) {
        if (this.soundManager) {
            this.soundManager.playSfx('fire_cone', 1.0, 1.0);
        }
        if (this.dataManager.state.settings?.screenShake !== false) {
            this.shakeTimer = 0.75;
            this.shakeIntensity = 22;
        }
        this.sonicBoomFlash = 0.92;
        this.sonicAlertTimer = 3.0;

        this.shockwaves.push({ x, y, radius: 14, maxRadius: 1100, alpha: 1.0, color: '254, 240, 138', width: 16 });
        this.shockwaves.push({ x: x - 22, y, radius: 30, maxRadius: 920, alpha: 0.95, color: '249, 115, 22', width: 12 });
        this.shockwaves.push({ x: x - 44, y, radius: 48, maxRadius: 760, alpha: 0.9, color: '220, 38, 38', width: 9 });
        this.spawnDebris(x, y, '#facc15', 18);
        this.spawnDebris(x, y, '#f97316', 18);
    }

    update(dt) {
        if (!this.active || this.paused) return;

        // Post-Run Coast-to-Halt State: Game keeps running while character slows down to Idle!
        if (this.finishing) {
            this.isDiving = false;
            this.isDashing = false;

            if (this.worldX + 4500 > this.nextSpawnX) {
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

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 900 * dt;
                p.rot += p.vRot * dt;
                p.life -= dt * 1.4;
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

        // Story Mode 3-2-1-GO Launch Sequence
        if (this.countdownTimer > 0) {
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

            this.rig.animState = 'idle';
            this.rig.update(dt);
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

        const stats = this.getUpgradeStats();
        const prevVx = this.vx;

        if (this.worldX + 4500 > this.nextSpawnX) {
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

        // Hyper-Dash Capacitor (Sandbox mode gives rapid recharge for limitless testing)
        const canDash = !this.isExhausted && !this.isDiving && this.isDashing && this.dashCharge > 3 && this.adrenaline > 6;
        if (canDash) {
            const drainScale = this.raceMode === 'sandbox' ? 0.25 : 1.0;
            this.dashCharge = Math.max(0, this.dashCharge - 46 * drainScale * dt);
            this.adrenaline = Math.max(0, this.adrenaline - 16.5 * stats.energyEfficiency * drainScale * dt);

            if (this.grounded) {
                this.vx += stats.dashThrust * dt;
            }

            this.afterimageTimer = (this.afterimageTimer || 0) - dt;
            if (this.afterimageTimer <= 0) {
                this.afterimageTimer = 0.038;
                if (this.afterimages.length >= 7) this.afterimages.shift();
                this.afterimages.push({ x: this.worldX, y: this.y, alpha: 0.65 });
            }
        } else {
            const rechargeMult = this.raceMode === 'sandbox' ? 3.5 : 1.0;
            this.dashCharge = Math.min(100, this.dashCharge + stats.dashRechargeRate * rechargeMult * dt);
        }

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
                    this.spawnDebris(this.worldX, this.y, '#38bdf8', 12);
                } else if (slope < -0.12 && this.isDiving) {
                    this.vx *= 0.52;
                }
                this.vy = slope * this.vx;
            }
        }

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
                } else {
                    this.stopTimer -= dt;
                    if (this.stopTimer <= 0) {
                        this.stopTimer = 0;
                        this.vx = 0;
                        this.updateHUD();
                        this.triggerRunEnd('stopped');
                        return;
                    }
                }
            } else if (this.vx > 25) {
                this.stopTimer = 0;
            }
        }

        const currentSpeedMs = Math.round(this.vx / 10);
        if (currentSpeedMs > this.peakSpeedMs) {
            this.peakSpeedMs = currentSpeedMs;
        }

        // Threshold Triggers: 501 m/s (Tier 3), 650 m/s (Sonic Cone), 1500 m/s (Fire Cone), 1800 m/s (Hypersonic Tier 4)
        if (this.vx >= TIER_4_VX && prevVx < TIER_4_VX) {
            this.triggerFireCone(this.worldX, this.y - 60);
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
                }
            }
        }

        if (this.raceMode === 'endless' && this.paceRecoveryTimer > 0) {
            if (this.vx > this.targetPaceVx + 10) {
                this.paceRecoveryTimer = 0;
                this.targetPaceVx = 0;
                this.preDrainPaceVx = this.vx;
            } else {
                this.paceRecoveryTimer -= dt;
                if (this.paceRecoveryTimer <= 0) {
                    this.paceRecoveryTimer = 0;
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
                    this.spawnDebris(item.x, item.y, '#38bdf8', 8);
                } else if (item.type === 'scrap') {
                    const scrapGain = 12;
                    this.runScrap += scrapGain;
                    this.dataManager.addScrap(scrapGain);
                    this.spawnDebris(item.x, item.y, '#c084fc', 8);
                } else if (item.type === 'module') {
                    const wasBelowTier3 = this.vx < TIER_3_VX;
                    const wasBelowCone = this.vx < SONIC_CONE_VX;
                    const wasBelowFire = this.vx < FIRE_CONE_VX;
                    const wasBelowTier4 = this.vx < TIER_4_VX;
                    this.vx += 460;
                    if ((wasBelowTier4 && this.vx >= TIER_4_VX) || (wasBelowFire && this.vx >= FIRE_CONE_VX)) {
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
                this.shakeIntensity = Math.max(this.shakeIntensity, 5);
            }
            for (const prop of this.props) {
                if (!prop.shattered && Math.abs(prop.x - this.worldX) < 200) {
                    prop.shattered = true;
                    this.spawnDebris(prop.x, prop.y - prop.h / 2, prop.neon, 16);
                    this.spawnDebris(prop.x, prop.y - prop.h / 2, prop.color, 10);
                }
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 900 * dt;
            p.rot += p.vRot * dt;
            p.life -= dt * 1.4;
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

        const speedAboveBase = Math.max(0, this.vx - 500);
        const targetZoom = Math.max(0.58, 1.0 - Math.min(0.42, (speedAboveBase / 7500) * 0.42));
        this.cameraZoom += (targetZoom - this.cameraZoom) * Math.min(1, dt * 4.2);

        if (this.soundManager) {
            this.soundManager.updateRunnerAudio(dt, this.vx, this.grounded, this.isDiving, this.active && !this.paused);
        }

        this.items = this.items.filter(i => i.x > this.worldX - 1400 && !i.collected);
        this.props = this.props.filter(p => p.x > this.worldX - 1400);

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
            this.alertTitleEl.textContent = `${curMs} / ${targetMs} m/s!`;
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
        this.scrapEl.textContent = `⚙️${this.dataManager.state.scrap} + ${this.runScrap}`;
        this.fuelFillEl.style.width = `${(this.adrenaline / this.maxEnergy) * 100}%`;
        this.dashFillEl.style.width = `${this.dashCharge}%`;
        this.dashStatusEl.textContent = !this.grounded
            ? 'AIRBORNE'
            : (this.dashCharge > 20 ? 'READY' : 'RECHARGING...');

        const isHypersonic = this.vx >= TIER_4_VX;
        const isSupersonic = this.vx >= SONIC_CONE_VX && !isHypersonic;
        this.tierBadgeEl.classList.toggle('hypersonic-fire', isHypersonic);
        this.tierBadgeEl.classList.toggle('supersonic-fire', isSupersonic);

        if (this.speedTier === 4) {
            this.tierBadgeEl.textContent = 'HYPERSONIC';
            this.tierBadgeEl.style.background = '';
        } else if (this.speedTier === 3) {
            this.tierBadgeEl.textContent = isSupersonic ? 'SUPERSONIC' : 'SUB-SONIC';
            this.tierBadgeEl.style.background = isSupersonic ? '' : '#e11d48';
        } else if (this.speedTier === 2) {
            this.tierBadgeEl.textContent = 'SPRINT';
            this.tierBadgeEl.style.background = '#eab308';
        } else {
            this.tierBadgeEl.textContent = 'WARMUP';
            this.tierBadgeEl.style.background = '#0284c7';
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
        const distanceMeters = Math.floor(this.worldX / PIXELS_PER_METER);
        let score = 0;

        if (reason === 'story_win') {
            const reward = this.currentRivalSpec.rewardScrap;
            this.dataManager.addScrap(reward);
            this.dataManager.markRivalCleared(this.currentRivalSpec.id);
            this.gameOverTitleEl.textContent = '🏆 Victory! Husser Defeated';
            this.gameOverTitleEl.style.color = '#4ade80';
            this.finalStatsEl.textContent = `You out-hussed ${this.currentRivalSpec.name} on the ${this.currentRivalSpec.distanceMeters}m strip and won ⚙️${reward}.`;
            score = await this.dataManager.recordRunScore(distanceMeters, this.peakSpeedMs);
        } else if (reason === 'story_loss') {
            this.gameOverTitleEl.textContent = '❌ Defeat! Rival Crossed First';
            this.gameOverTitleEl.style.color = '#ef4444';
            this.finalStatsEl.textContent = `${this.currentRivalSpec.name} beat you to the finish line (${Math.round(this.currentRivalSpec.baseSpeed / 10)}+ m/s).`;
        } else if (reason === 'stopped') {
            score = await this.dataManager.recordRunScore(distanceMeters, this.peakSpeedMs);
            this.gameOverTitleEl.textContent = 'Game Over';
            this.gameOverTitleEl.style.color = '#f97316';
            this.finalStatsEl.textContent = `You had no forward motion for 3.0 seconds! Release Lean on inclines or use Boost to keep moving.`;
        } else if (reason === 'pace_failed') {
            const targetMs = Math.round(this.targetPaceVx / 10) + 1;
            const finalMs = Math.round(this.vx / 10);
            score = await this.dataManager.recordRunScore(distanceMeters, this.peakSpeedMs);
            this.gameOverTitleEl.textContent = 'Game Over';
            this.gameOverTitleEl.style.color = '#ef4444';
            this.finalStatsEl.textContent = `After draining your stamina, you had 10.0s to surpass your speed of ${targetMs} m/s (reached ${finalMs} m/s).`;
        } else {
            score = await this.dataManager.recordRunScore(distanceMeters, this.peakSpeedMs);
            this.gameOverTitleEl.textContent = '⚡ RUN COMPLETE';
            this.gameOverTitleEl.style.color = '#ef4444';
            this.finalStatsEl.textContent = `Your score, distance, and peak speed have been recorded to the Top Hussers Leaderboard.`;
        }

        this.breakdownEl.innerHTML = `
            <div class="stat-tile"><span>TOP SCORE</span><strong>${score.toLocaleString()} pts</strong></div>
            <div class="stat-tile"><span>DISTANCE</span><strong>${distanceMeters.toLocaleString()} m</strong></div>
            <div class="stat-tile"><span>PEAK SPEED</span><strong>${this.peakSpeedMs} m/s</strong></div>
        `;
        this.gameOverEl.style.display = 'flex';
    }

    lerpColor(c1, c2, t) {
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }

    getSpeedStretch() {
        const STRETCH_START_VX = 3750;
        const STRETCH_CAP_VX = 7500;

        if (this.vx <= STRETCH_START_VX) {
            return { stretchX: 1, stretchY: 1 };
        }

        const clampedVx = Math.min(this.vx, STRETCH_CAP_VX);
        const excessMs = (clampedVx - STRETCH_START_VX) / 10;
        const stretchX = 1 + Math.pow(excessMs / 320, 1.08);
        const stretchY = Math.max(0.55, 1 / Math.pow(stretchX, 0.25));
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

        // 2A. 1500+ m/s Surging Orange-Hot Meteorite Fire Cone (Superior version of Sound Barrier Cone)
        const FIRE_SPAWN_VX = 14500; // Begins igniting at 1450 m/s, full Fire Cone at 1500 m/s
        if (this.vx >= FIRE_SPAWN_VX) {
            const now = performance.now();
            const fireBlend = Math.min(1, (this.vx - FIRE_SPAWN_VX) / (FIRE_CONE_VX - FIRE_SPAWN_VX));
            const fireProgress = Math.min(1, Math.max(0, (this.vx - FIRE_CONE_VX) / 8000));
            const pulse = Math.sin(now * 0.032) * 14;
            const flutter = Math.cos(now * 0.048) * 10;

            const apexX = 96 * stretchX;
            const coneLen = 490 + fireProgress * 150 + pulse;
            const spreadY = 128 - fireProgress * 22 + flutter * 0.45;
            const tailX = apexX - coneLen;
            const baseAlpha = 0.35 + fireBlend * 0.38;

            ctx.save();
            ctx.translate(0, -72);

            // Outer scorching meteorite plasma wake
            const outerGrad = ctx.createLinearGradient(apexX + 18, 0, tailX - 60, 0);
            outerGrad.addColorStop(0, `rgba(255, 255, 255, ${baseAlpha * 1.15})`);
            outerGrad.addColorStop(0.14, `rgba(254, 240, 138, ${baseAlpha * 1.05})`);
            outerGrad.addColorStop(0.42, `rgba(249, 115, 22, ${baseAlpha * 0.92})`);
            outerGrad.addColorStop(0.76, `rgba(220, 38, 38, ${baseAlpha * 0.58})`);
            outerGrad.addColorStop(1, 'rgba(124, 45, 18, 0)');

            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.moveTo(apexX + 18, 0);
            ctx.quadraticCurveTo(apexX - coneLen * 0.25, -spreadY * 0.92, tailX, -spreadY * 1.22);
            ctx.quadraticCurveTo(apexX - coneLen * 0.58, 0, tailX, spreadY * 1.22);
            ctx.quadraticCurveTo(apexX - coneLen * 0.25, spreadY * 0.92, apexX + 18, 0);
            ctx.closePath();
            ctx.fill();

            // Inner white-hot / solar-orange core cone
            const coreGrad = ctx.createLinearGradient(apexX + 10, 0, tailX * 0.78, 0);
            coreGrad.addColorStop(0, `rgba(255, 255, 255, ${baseAlpha * 1.2})`);
            coreGrad.addColorStop(0.3, `rgba(253, 224, 71, ${baseAlpha * 0.95})`);
            coreGrad.addColorStop(0.7, `rgba(249, 115, 22, ${baseAlpha * 0.6})`);
            coreGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');

            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.moveTo(apexX + 10, 0);
            ctx.lineTo(tailX * 0.78, -spreadY * 0.62);
            ctx.quadraticCurveTo(apexX - coneLen * 0.42, 0, tailX * 0.78, spreadY * 0.62);
            ctx.closePath();
            ctx.fill();

            // Surging fiery shockwave boundary ribs
            ctx.strokeStyle = `rgba(254, 240, 138, ${baseAlpha * 1.15})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(apexX + 14, 0);
            ctx.quadraticCurveTo(apexX - coneLen * 0.35, -spreadY * 0.78 + flutter, tailX - 20, -spreadY * 1.12);
            ctx.moveTo(apexX + 14, 0);
            ctx.quadraticCurveTo(apexX - coneLen * 0.35, spreadY * 0.78 - flutter, tailX - 20, spreadY * 1.12);
            ctx.stroke();

            // Incandescent plasma compression rings pulsing backward through the fire cone
            for (let i = 0; i < 3; i++) {
                const cycle = ((now * 0.0028 + i * 0.33) % 1);
                const ringX = apexX - cycle * coneLen * 0.85;
                const ringSpread = spreadY * (0.25 + cycle * 0.78);
                ctx.strokeStyle = i % 2 === 0
                    ? `rgba(253, 224, 71, ${(1 - cycle) * baseAlpha * 1.1})`
                    : `rgba(249, 115, 22, ${(1 - cycle) * baseAlpha * 1.1})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(ringX, 0, 12 + cycle * 24, ringSpread, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
            return;
        }

        // 2B. Regular 620 - 1449 m/s Sound Barrier Cone
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
    }

    draw(ctx, canvasW, canvasH) {
        ctx.save();

        const sky = ctx.createLinearGradient(0, 0, 0, canvasH);
        const t12Top = [
            2 + (30 - 2) * this.tier2SkyBlend,
            132 + (27 - 132) * this.tier2SkyBlend,
            199 + (75 - 199) * this.tier2SkyBlend
        ];
        const t12Bot = [
            224 + (15 - 224) * this.tier2SkyBlend,
            242 + (23 - 242) * this.tier2SkyBlend,
            254 + (42 - 254) * this.tier2SkyBlend
        ];
        const t123Top = [
            t12Top[0] + (76 - t12Top[0]) * this.tier3SkyBlend,
            t12Top[1] + (5 - t12Top[1]) * this.tier3SkyBlend,
            t12Top[2] + (25 - t12Top[2]) * this.tier3SkyBlend
        ];
        const t123Bot = [
            t12Bot[0] + (9 - t12Bot[0]) * this.tier3SkyBlend,
            t12Bot[1] + (13 - t12Bot[1]) * this.tier3SkyBlend,
            t12Bot[2] + (22 - t12Bot[2]) * this.tier3SkyBlend
        ];
        // Smoothly transitions from Tier 3 Red ([76, 5, 25]) to Tier 4 Hypersonic Amber ([217, 119, 6] -> [69, 26, 3])
        const topColor = this.lerpColor(t123Top, [217, 119, 6], this.tier4SkyBlend);
        const botColor = this.lerpColor(t123Bot, [69, 26, 3], this.tier4SkyBlend);
        sky.addColorStop(0, topColor);
        sky.addColorStop(1, botColor);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvasW, canvasH);

        const zoom = this.cameraZoom || 1.0;
        const viewW = canvasW / zoom;
        const viewH = canvasH / zoom;

        ctx.scale(zoom, zoom);

        const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
        const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
        const camX = this.worldX - viewW * 0.25 + shakeX;
        const camY = this.y - viewH * 0.64 + shakeY;

        ctx.translate(-camX, -camY);

        for (const prop of this.props) {
            if (prop.shattered) continue;
            if (prop.x < camX - 250 || prop.x > camX + viewW + 250) continue;
            ctx.fillStyle = prop.color;
            ctx.fillRect(prop.x - prop.w / 2, prop.y - prop.h, prop.w, prop.h + 120);
            ctx.strokeStyle = prop.neon;
            ctx.lineWidth = 3;
            ctx.strokeRect(prop.x - prop.w / 2, prop.y - prop.h, prop.w, prop.h);
        }

        ctx.beginPath();
        const startX = Math.floor(camX / 20) * 20 - 60;
        const endX = camX + viewW + 120;
        ctx.moveTo(startX, camY + viewH + 800);
        for (let x = startX; x <= endX; x += 20) {
            ctx.lineTo(x, this.getTerrainY(x));
        }
        ctx.lineTo(endX, camY + viewH + 800);
        ctx.closePath();

        const groundGrad = ctx.createLinearGradient(0, camY, 0, camY + viewH);
        groundGrad.addColorStop(0, '#1e293b');
        groundGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = groundGrad;
        ctx.fill();

        const activeSeg = this.getSegmentAt(this.worldX);
        const is10kStraight = activeSeg && activeSeg.type === 'proving_straight_10k';
        ctx.beginPath();
        for (let x = startX; x <= endX; x += 15) {
            const ty = this.getTerrainY(x);
            if (x === startX) ctx.moveTo(x, ty);
            else ctx.lineTo(x, ty);
        }
        ctx.strokeStyle = this.speedTier === 3
            ? '#f43f5e'
            : (is10kStraight ? '#fde047' : (this.isFlatSection(this.worldX) ? '#facc15' : '#38bdf8'));
        ctx.lineWidth = is10kStraight ? 11 : 8;
        ctx.stroke();

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

        for (let i = 0; i < this.afterimages.length; i++) {
            const ai = this.afterimages[i];
            const tintHex = isRainbow
                ? rainbowPalette[(Math.floor(performance.now() / 60) + i) % rainbowPalette.length]
                : trailColor;

            ctx.save();
            ctx.translate(ai.x, ai.y);
            ctx.scale(stretchX, stretchY);
            ctx.globalAlpha = Math.max(0, ai.alpha * 0.58);
            this.rig.draw(ctx, 0, -85, 0.58, tintHex);
            ctx.restore();
        }

        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
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

        const slopeAngle = Math.atan(this.getTerrainSlope(this.worldX));
        const airAngle = Math.max(-0.55, Math.min(0.65, Math.atan2(this.vy, this.vx) * 0.6));
        ctx.save();
        ctx.translate(this.worldX, this.y);
        ctx.rotate(this.grounded ? slopeAngle * 0.65 : airAngle);

        ctx.save();
        ctx.scale(stretchX, stretchY);
        this.rig.draw(ctx, 0, -85, 0.58);
        ctx.restore();

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