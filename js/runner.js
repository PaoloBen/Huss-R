import { HusserRig } from './rig.js';

export class EndlessRunner {
    constructor(rig, dataManager, onReturnToHub, onOpenWorkshop) {
        this.rig = rig;
        this.dataManager = dataManager;
        this.onReturnToHub = onReturnToHub;
        this.onOpenWorkshop = onOpenWorkshop;

        this.active = false;
        this.raceMode = 'endless'; // 'endless' or 'story'
        this.currentRivalSpec = null;
        this.rivalRig = new HusserRig();

        this.isDiving = false;
        this.isDashing = false;

        // UI Elements
        this.hudEl = document.getElementById('hud-overlay');
        this.gameOverEl = document.getElementById('gameover-overlay');
        this.gameOverTitleEl = document.getElementById('gameover-title');
        this.speedEl = document.getElementById('hud-speed');
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

        // Story Race Progress UI
        this.raceProgressWrapEl = document.getElementById('hud-race-progress');
        this.raceStageLabelEl = document.getElementById('race-stage-label');
        this.raceRivalLabelEl = document.getElementById('race-rival-label');
        this.racePlayerDotEl = document.getElementById('race-player-dot');
        this.raceRivalDotEl = document.getElementById('race-rival-dot');

        this.bindInputs();
        this.reset();
    }

    bindInputs() {
        const setDive = (state) => {
            if (!this.active) return;
            this.isDiving = state;
        };
        const setDash = (state) => {
            if (!this.active) return;
            this.isDashing = state;
        };

        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowDown', 'KeyS'].includes(e.code)) setDive(true);
            if (['ShiftLeft', 'ShiftRight', 'KeyD', 'ArrowRight'].includes(e.code)) setDash(true);
        });

        window.addEventListener('keyup', (e) => {
            if (['Space', 'ArrowDown', 'KeyS'].includes(e.code)) setDive(false);
            if (['ShiftLeft', 'ShiftRight', 'KeyD', 'ArrowRight'].includes(e.code)) setDash(false);
        });

        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('pointerdown', (e) => {
            if (e.button === 2) setDash(true);
            else setDive(true);
        });
        window.addEventListener('pointerup', (e) => {
            if (e.button === 2) setDash(false);
            else setDive(false);
        });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        document.getElementById('retry-btn').addEventListener('click', () => {
            this.gameOverEl.style.display = 'none';
            if (this.raceMode === 'story' && this.currentRivalSpec) {
                this.startStoryRace(this.currentRivalSpec);
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
            this.onReturnToHub();
        });

        document.getElementById('hud-abort-btn').addEventListener('click', () => {
            this.stop();
            this.onReturnToHub();
        });
    }

    // Limitless Upgrade Scaling — No Top Speed Cap!
    getUpgradeStats() {
        const u = this.dataManager.state.upgrades;
        return {
            baseDrive: 480 + (u.engine - 1) * 95,
            runAccel: 380 + (u.engine - 1) * 75,
            dashThrust: 1350 + (u.engine - 1) * 240,
            groundDragCoeff: Math.max(0.006, 0.042 / (1 + (u.engine - 1) * 0.15)),
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
        this.hudEl.style.display = 'flex';
        this.raceProgressWrapEl.style.display = 'none';
        this.countdownEl.style.display = 'none';
        this.gameOverEl.style.display = 'none';
        this.modeLabelEl.textContent = 'ENDLESS SPRINT';
    }

    startStoryRace(rivalSpec) {
        this.raceMode = 'story';
        this.currentRivalSpec = rivalSpec;
        this.rivalRig.generatePresetTextures(rivalSpec.colors);
        this.reset();
        this.active = true;
        this.countdownTimer = 2.4;
        this.hudEl.style.display = 'flex';
        this.raceProgressWrapEl.style.display = 'block';
        this.raceStageLabelEl.textContent = rivalSpec.stageName.toUpperCase();
        this.raceRivalLabelEl.textContent = `VS ${rivalSpec.name.toUpperCase()}`;
        this.gameOverEl.style.display = 'none';
        this.modeLabelEl.textContent = `1v1 DRAG (${rivalSpec.distanceMeters}m)`;
    }

    stop() {
        this.active = false;
        this.isDiving = false;
        this.isDashing = false;
        this.hudEl.style.display = 'none';
        this.gameOverEl.style.display = 'none';
    }

    reset() {
        const stats = this.getUpgradeStats();

        // Initialize Infinite Non-Repeating Biome Segments
        this.segments = [
            { startX: -1000, endX: 1800, startY: 440, endY: 440, type: 'flat_highway', amp: 0, freq: 1 }
        ];
        this.ensureTerrainSegments(18000);

        this.worldX = 0;
        this.y = this.getTerrainY(0);
        this.vx = this.raceMode === 'story' ? 0 : 460;
        this.vy = 0;
        this.grounded = true;

        this.maxEnergy = stats.maxEnergy;
        this.adrenaline = this.maxEnergy;
        this.dashCharge = 100;
        this.runScrap = 0;
        this.peakSpeedMs = 0;
        this.speedTier = 1;
        this.isDrafting = false;
        this.countdownTimer = 0;

        // Stamina Exhaustion & Endless 5s Pace Challenge State
        this.isExhausted = false;
        this.preDrainPaceVx = this.raceMode === 'story' ? 460 : this.vx;
        this.targetPaceVx = 0;
        this.paceRecoveryTimer = 0;

        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        if (this.raceMode === 'story' && this.currentRivalSpec) {
            this.finishWorldX = this.currentRivalSpec.distanceMeters * 25;
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

    // Infinite Procedural Segment Generator: Chains 6 distinct biome types with smooth C1 splines
    ensureTerrainSegments(targetX) {
        const archetypes = ['flat_highway', 'mega_drop', 'ski_ramp', 'rolling_sine', 'canyon_bowl', 'uphill_climb'];
        let lastSeg = this.segments[this.segments.length - 1];

        while (lastSeg.endX < targetX) {
            const prevType = lastSeg.type;
            let type;
            if (prevType !== 'flat_highway' && Math.random() < 0.42) {
                type = 'flat_highway';
            } else {
                const choices = archetypes.filter(a => a !== prevType);
                type = choices[Math.floor(Math.random() * choices.length)];
            }

            let length = 2600 + Math.random() * 3800; // Expansive 2,600px - 6,400px biome segments
            let deltaY = 0;
            let amp = 0;
            let freq = 1;

            if (type === 'flat_highway') {
                length = 3400 + Math.random() * 3800;
                deltaY = 0;
            } else if (type === 'mega_drop') {
                length = 2800 + Math.random() * 2400;
                deltaY = 340 + Math.random() * 440; // Deep downhill drop (+Y is downward)
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
                deltaY = -(220 + Math.random() * 260); // Climb upward
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

    getTerrainY(x) {
        if (x <= this.segments[0].startX) return this.segments[0].startY;
        const last = this.segments[this.segments.length - 1];
        if (x >= last.endX) {
            this.ensureTerrainSegments(x + 15000);
        }

        let seg = this.segments[0];
        for (let i = 0; i < this.segments.length; i++) {
            const s = this.segments[i];
            if (x >= s.startX && x <= s.endX) {
                seg = s;
                break;
            }
        }

        const t = (x - seg.startX) / (seg.endX - seg.startX);
        // C1 smoothstep interpolation between startY and endY (zero derivative at boundaries)
        const smoothT = t * t * (3 - 2 * t);
        const baseLine = seg.startY + (seg.endY - seg.startY) * smoothT;
        const windowEnv = Math.sin(t * Math.PI); // 0 at ends, 1 in middle
        const c1Window = windowEnv * windowEnv;  // Smooth zero-slope entry and exit

        if (seg.type === 'flat_highway') {
            return baseLine;
        } else if (seg.type === 'mega_drop') {
            return baseLine + Math.sin(t * Math.PI * 2) * seg.amp * c1Window;
        } else if (seg.type === 'ski_ramp') {
            // Steep dive into a sharp upward lip at the exit to launch fast runners into the air!
            const scoop = Math.sin(t * Math.PI * 1.65) * seg.amp * c1Window;
            return baseLine + scoop;
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

    // Spread-out item generation (900px to 1,550px apart) so Energy management actually matters!
    spawnWorldChunk(startX, endX) {
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

        // Background Scenery Props
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
        for (let i = 0; i < count; i++) {
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

    update(dt) {
        if (!this.active) return;

        // Story Mode 3-2-1-GO Launch Countdown
        if (this.countdownTimer > 0) {
            this.countdownTimer -= dt;
            this.countdownEl.style.display = 'block';
            const sec = Math.ceil(this.countdownTimer);
            this.countdownEl.textContent = sec > 0 ? sec : 'GO! ⚡';
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

        // Spawn ahead of player
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

        // Hyper-Dash Capacitor: Disabled while curled or exhausted, and only accelerates on the ground!
        const canDash = !this.isExhausted && !this.isDiving && this.isDashing && this.dashCharge > 3 && this.adrenaline > 6;
        if (canDash) {
            this.dashCharge = Math.max(0, this.dashCharge - 46 * dt);
            this.adrenaline = Math.max(0, this.adrenaline - 16.5 * stats.energyEfficiency * dt);

            if (this.grounded) {
                this.vx += stats.dashThrust * dt;
            }

            if (Math.random() < 0.65) {
                this.afterimages.push({ x: this.worldX, y: this.y, alpha: 0.55 });
            }
        } else {
            this.dashCharge = Math.min(100, this.dashCharge + stats.dashRechargeRate * dt);
        }

        const slope = this.getTerrainSlope(this.worldX);
        const gravity = this.isDiving ? 3250 : 900;
        this.currentAirDragMs2 = 0;

        // Determine if stamina drain is currently causing a speed decline
        const isLowStaminaDrain = !this.isDiving && (this.isExhausted || (this.adrenaline / this.maxEnergy < 0.12));

        if (this.grounded) {
            if (slope > 0.02) {
                // DOWNHILL: Curling tucks you into a frictionless roll that builds massive speed for 0 stamina!
                const diveMultiplier = (this.isDiving ? 1880 : (this.isExhausted ? 320 : 560)) * stats.pumpMultiplier;
                this.vx += slope * diveMultiplier * dt;
            } else if (slope < -0.02) {
                // UPHILL INCLINE: Curling on an incline kills your speed rapidly and can bring you to a full stop!
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
                // FLAT SPRINT PLANE: Curling on flat ground saves stamina, but slide friction slows you down!
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

            // Exhausted Slow-Jog Penalty vs Healthy Base Drive
            if (this.isExhausted) {
                // Running slowly to regenerate stamina (unless tucked on a downhill slope)
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
                // Low-stamina overdrive cutout (< 12% energy)
                if (!this.isDiving && this.adrenaline / this.maxEnergy < 0.12 && this.vx > 750) {
                    this.vx -= 700 * dt;
                }
            }

            // Ground aerodynamic & rolling resistance
            const dragFactor = this.isDrafting ? stats.groundDragCoeff * 0.55 : stats.groundDragCoeff;
            this.vx -= this.vx * dragFactor * dt;

            // Advance position and check for ballistic slope launch
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
            // AIRBORNE BALLISTIC PHYSICS (Mutual Speed <-> Air Resistance Coupling)
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

        // Track Pre-Stamina-Drain Peak Pace (distinguishes environmental slowdown from stamina-drain slowdown!)
        if (!isLowStaminaDrain && this.paceRecoveryTimer <= 0) {
            const envSlowing = !this.grounded || slope < -0.02 || (this.isDiving && slope <= 0.02);
            if (this.vx >= this.preDrainPaceVx || envSlowing) {
                this.preDrainPaceVx = Math.max(460, this.vx);
            }
        }

        // Check if improper curling or uphill stalling brought the runner to a complete stop!
        if (this.vx <= 15) {
            this.vx = 0;
            this.updateHUD();
            this.triggerRunEnd('stopped');
            return;
        }

        const currentSpeedMs = Math.round(this.vx / 10);
        if (currentSpeedMs > this.peakSpeedMs) {
            this.peakSpeedMs = currentSpeedMs;
        }

        // Determine Speed Tier
        const prevTier = this.speedTier;
        if (this.vx >= 1500) {
            this.speedTier = 3; // SONIC BOOM TIER (150+ m/s)
        } else if (this.vx >= 950) {
            this.speedTier = 2; // MACH SURGE TIER (95+ m/s)
        } else {
            this.speedTier = 1; // SPRINT TIER
        }

        if (this.speedTier === 3 && prevTier < 3) {
            this.shakeTimer = 0.45;
            this.shakeIntensity = 14;
            this.shockwaves.push({ x: this.worldX, y: this.y - 45, radius: 15, alpha: 1 });
        }

        // Sync Husser Rig Animation
        if (this.isDiving) {
            this.rig.animState = 'curl';
        } else if (!this.grounded) {
            this.rig.animState = 'air';
        } else if (this.speedTier >= 2 || canDash) {
            this.rig.animState = 'sonic';
        } else {
            this.rig.animState = 'run';
        }
        const animSpeedScale = (!this.grounded || this.isDiving) ? 1.0 : (this.vx / 380);
        this.rig.update(dt * animSpeedScale);

        // Energy (Stamina) Burn & Exhaustion Regeneration Logic:
        const isStalling = !this.isDiving && !this.isExhausted && this.vx < 340;

        if (this.isExhausted) {
            // Running slowly regenerates stamina rapidly so you can get back into the sprint!
            const regenRate = this.maxEnergy * 0.32;
            this.adrenaline = Math.min(this.maxEnergy, this.adrenaline + regenRate * dt);
            if (this.adrenaline >= this.maxEnergy * 0.35) {
                this.isExhausted = false;
            }
        } else {
            let energyDrain = 0;
            if (!this.isDiving) {
                const highSpeedBurn = this.vx > 850 ? Math.pow((this.vx - 850) / 100, 1.25) * 2.1 * stats.energyEfficiency : 0;
                const baseDrain = isStalling ? 16.5 : (5.8 * stats.energyEfficiency + highSpeedBurn);
                const draftRelief = this.isDrafting ? 0.68 : 1.0;
                energyDrain = baseDrain * draftRelief;
            }
            this.adrenaline = Math.max(0, this.adrenaline - energyDrain * dt);

            // Hitting 0 Stamina triggers Exhaustion Slow-Regen instead of ending the run immediately!
            if (this.adrenaline <= 0) {
                this.adrenaline = 0;
                this.isExhausted = true;
                this.isDashing = false;

                // In Endless Mode, start the 5-second challenge to outpace your pre-drain peak pace!
                if (this.raceMode === 'endless' && this.paceRecoveryTimer <= 0) {
                    this.targetPaceVx = Math.max(480, this.preDrainPaceVx);
                    this.paceRecoveryTimer = 5.0;
                }
            }
        }

        // Endless Mode 5-Second Pace Recovery Challenge Evaluation
        if (this.raceMode === 'endless' && this.paceRecoveryTimer > 0) {
            // Check if player has outpaced their previous pre-drain peak pace!
            if (this.vx > this.targetPaceVx + 10) {
                this.paceRecoveryTimer = 0;
                this.targetPaceVx = 0;
                this.preDrainPaceVx = this.vx;
            } else if (!this.isExhausted) {
                // Count down the full 5.0 seconds once stamina has recovered enough to sprint!
                this.paceRecoveryTimer -= dt;
                if (this.paceRecoveryTimer <= 0) {
                    this.paceRecoveryTimer = 0;
                    this.updateHUD();
                    this.triggerRunEnd('pace_failed');
                    return;
                }
            }
        }

        // Dynamic HUD status feedback
        this.stallWarnEl.style.display = 'inline';
        if (this.raceMode === 'endless' && this.paceRecoveryTimer > 0) {
            const targetMs = Math.round(this.targetPaceVx / 10) + 1;
            if (this.isExhausted) {
                this.stallWarnEl.style.color = '#f97316';
                this.stallWarnEl.textContent = `😮‍💨 CATCHING BREATH (REGENERATING STAMINA) • BEAT ${targetMs} m/s NEXT (${this.paceRecoveryTimer.toFixed(1)}s)!`;
            } else {
                this.stallWarnEl.style.color = '#ef4444';
                this.stallWarnEl.textContent = `⏱️ OUTPACE PREVIOUS PEAK (${targetMs} m/s) IN ${this.paceRecoveryTimer.toFixed(1)}s OR RUN ENDS!`;
            }
        } else if (this.isExhausted) {
            this.stallWarnEl.style.color = '#f97316';
            this.stallWarnEl.textContent = '😮‍💨 STAMINA EXHAUSTED! RUNNING SLOWLY TO REGENERATE STAMINA...';
        } else if (this.isDiving) {
            if (!this.grounded) {
                this.stallWarnEl.style.color = '#38bdf8';
                this.stallWarnEl.textContent = `☄️ FAST-FALL TUCK (0 STAMINA BURN • AIR DRAG: -${this.currentAirDragMs2} m/s²)`;
            } else if (slope > 0.02) {
                this.stallWarnEl.style.color = '#4ade80';
                this.stallWarnEl.textContent = '🟢 DOWNHILL CURL BOOST! (0 STAMINA USED)';
            } else {
                this.stallWarnEl.style.color = '#ef4444';
                this.stallWarnEl.textContent = '⚠️ CURLING ON FLAT/INCLINE! RAPID SPEED LOSS (RELEASE TO RUN!)';
            }
        } else if (!this.grounded) {
            this.stallWarnEl.style.color = '#facc15';
            this.stallWarnEl.textContent = `🌬️ MIDAIR DRAG: -${this.currentAirDragMs2} m/s² (HOLD CURL TO FAST-FALL!)`;
        } else if (isStalling) {
            this.stallWarnEl.style.color = '#ef4444';
            this.stallWarnEl.textContent = '⚠️ LOW SPEED STALL DRAIN!';
        } else if (canDash) {
            this.stallWarnEl.style.color = '#facc15';
            this.stallWarnEl.textContent = '🔥 HYPER-DASH BURNING ENERGY!';
        } else if (this.speedTier === 3) {
            this.stallWarnEl.style.color = '#f43f5e';
            this.stallWarnEl.textContent = '⚡ SONIC OVERDRIVE BURN!';
        } else {
            this.stallWarnEl.style.display = 'none';
        }

        // Update NPC Rival in Story Mode
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

        // Collectibles Collision (Picking up Cells/Modules helps recover from exhaustion immediately!)
        for (const item of this.items) {
            if (!item.collected && Math.hypot(item.x - this.worldX, item.y - (this.y - 45)) < 92) {
                item.collected = true;
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
                    this.vx += 420; // Uncapped speed burst!
                    this.adrenaline = Math.min(this.maxEnergy, this.adrenaline + 20);
                    this.isExhausted = false;
                    this.dashCharge = 100;
                    this.shakeTimer = 0.3;
                    this.shakeIntensity = 10;
                    this.shockwaves.push({ x: this.worldX, y: this.y - 45, radius: 10, alpha: 1 });
                    this.spawnDebris(item.x, item.y, '#facc15', 14);
                }
            }
        }

        // Visual Destruction at Tier 3 (Sonic Boom)
        if (this.speedTier === 3) {
            this.shakeTimer = Math.max(this.shakeTimer, 0.1);
            this.shakeIntensity = 6;
            for (const prop of this.props) {
                if (!prop.shattered && Math.abs(prop.x - this.worldX) < 180) {
                    prop.shattered = true;
                    this.spawnDebris(prop.x, prop.y - prop.h / 2, prop.neon, 16);
                    this.spawnDebris(prop.x, prop.y - prop.h / 2, prop.color, 10);
                }
            }
        }

        // Update Particles, Afterimages & Shockwaves
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
            sw.radius += 950 * dt;
            sw.alpha -= dt * 1.8;
            if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
        }

        if (this.shakeTimer > 0) this.shakeTimer -= dt;

        this.items = this.items.filter(i => i.x > this.worldX - 800 && !i.collected);
        this.props = this.props.filter(p => p.x > this.worldX - 800);

        this.updateHUD();
    }

    // Competitive Story Mode CPU with Aggressive Slope Diving & Flat-Plane Hyper-Dashing
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

        // If player is ahead, Rival pushes harder to draft & overtake
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
        const distanceMeters = Math.floor(this.worldX / 25);

        this.speedEl.textContent = `${displaySpeed} m/s`;
        this.distEl.textContent = this.raceMode === 'story'
            ? `${distanceMeters} / ${this.currentRivalSpec.distanceMeters} m`
            : `${distanceMeters} m`;
        this.scrapEl.textContent = `⚙️ ${this.runScrap} (+${this.dataManager.state.scrap} Bank)`;
        this.fuelFillEl.style.width = `${(this.adrenaline / this.maxEnergy) * 100}%`;
        this.dashFillEl.style.width = `${this.dashCharge}%`;
        this.dashStatusEl.textContent = !this.grounded
            ? 'AIRBORNE (NO TRACTION)'
            : (this.dashCharge > 20 ? 'READY' : 'RECHARGING...');

        if (this.speedTier === 3) {
            this.tierBadgeEl.textContent = '💥 TIER 3: SONIC BOOM';
            this.tierBadgeEl.style.background = '#e11d48';
        } else if (this.speedTier === 2) {
            this.tierBadgeEl.textContent = '⚡ TIER 2: MACH SURGE';
            this.tierBadgeEl.style.background = '#eab308';
        } else {
            this.tierBadgeEl.textContent = '🏃 TIER 1: SPRINT';
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
        this.active = false;
        this.isDiving = false;
        this.isDashing = false;
        const distanceMeters = Math.floor(this.worldX / 25);
        let score = 0;

        if (reason === 'story_win') {
            const reward = this.currentRivalSpec.rewardScrap;
            this.dataManager.addScrap(reward);
            this.dataManager.markRivalCleared(this.currentRivalSpec.id);
            this.gameOverTitleEl.textContent = '🏆 VICTORY! RIVAL DEFEATED';
            this.gameOverTitleEl.style.color = '#4ade80';
            this.finalStatsEl.textContent = `You out-sprinted ${this.currentRivalSpec.name} on the ${this.currentRivalSpec.distanceMeters}m Drag Strip and won +${reward} Nano-Scrap!`;
            score = await this.dataManager.recordRunScore(distanceMeters, this.peakSpeedMs);
        } else if (reason === 'story_loss') {
            this.gameOverTitleEl.textContent = '❌ DEFEAT! RIVAL CROSSED FIRST';
            this.gameOverTitleEl.style.color = '#ef4444';
            this.finalStatsEl.textContent = `${this.currentRivalSpec.name} beat you to the finish gate (${Math.round(this.currentRivalSpec.baseSpeed / 10)}+ m/s). Upgrade your Engine & Traction in the Workshop!`;
        } else if (reason === 'stopped') {
            score = await this.dataManager.recordRunScore(distanceMeters, this.peakSpeedMs);
            this.gameOverTitleEl.textContent = '🛑 MOMENTUM LOST (CAME TO A STOP)';
            this.gameOverTitleEl.style.color = '#f97316';
            this.finalStatsEl.textContent = `You curled on an incline/flat for too long and lost all forward speed! Only curl on downhills or to fast-fall from the air.`;
        } else if (reason === 'pace_failed') {
            const targetMs = Math.round(this.targetPaceVx / 10) + 1;
            const finalMs = Math.round(this.vx / 10);
            score = await this.dataManager.recordRunScore(distanceMeters, this.peakSpeedMs);
            this.gameOverTitleEl.textContent = '⏱️ FAILED TO OUTPACE PREVIOUS PEAK';
            this.gameOverTitleEl.style.color = '#ef4444';
            this.finalStatsEl.textContent = `After exhausting your stamina, you had 5.0s to beat your pre-drain pace of ${targetMs} m/s (reached ${finalMs} m/s). Conserve stamina by curling on downhills!`;
        } else {
            score = await this.dataManager.recordRunScore(distanceMeters, this.peakSpeedMs);
            this.gameOverTitleEl.textContent = '⚡ ENERGY DEPLETED';
            this.gameOverTitleEl.style.color = '#ef4444';
            this.finalStatsEl.textContent = `Run complete! Your score has been saved to the Database Leaderboard.`;
        }

        this.breakdownEl.innerHTML = `
            <div class="stat-tile"><span>DISTANCE</span><strong>${distanceMeters} m</strong></div>
            <div class="stat-tile"><span>PEAK SPEED</span><strong>${this.peakSpeedMs} m/s</strong></div>
            <div class="stat-tile"><span>RUN SCORE</span><strong>${score} pts</strong></div>
        `;
        this.gameOverEl.style.display = 'flex';
    }

    draw(ctx, canvasW, canvasH) {
        ctx.save();

        const sky = ctx.createLinearGradient(0, 0, 0, canvasH);
        if (this.speedTier === 3) {
            sky.addColorStop(0, '#4c0519');
            sky.addColorStop(1, '#0f172a');
        } else if (this.speedTier === 2) {
            sky.addColorStop(0, '#1e1b4b');
            sky.addColorStop(1, '#0f172a');
        } else {
            sky.addColorStop(0, '#0284c7');
            sky.addColorStop(1, '#e0f2fe');
        }
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvasW, canvasH);

        const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
        const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
        const camX = this.worldX - canvasW * 0.28 + shakeX;
        const camY = this.y - canvasH * 0.62 + shakeY;

        ctx.translate(-camX, -camY);

        // 1. Destructible Background Buildings
        for (const prop of this.props) {
            if (prop.shattered) continue;
            if (prop.x < camX - 200 || prop.x > camX + canvasW + 200) continue;
            ctx.fillStyle = prop.color;
            ctx.fillRect(prop.x - prop.w / 2, prop.y - prop.h, prop.w, prop.h + 120);
            ctx.strokeStyle = prop.neon;
            ctx.lineWidth = 3;
            ctx.strokeRect(prop.x - prop.w / 2, prop.y - prop.h, prop.w, prop.h);
        }

        // 2. Spline Terrain Polygon
        ctx.beginPath();
        const startX = Math.floor(camX / 20) * 20 - 40;
        const endX = camX + canvasW + 80;
        ctx.moveTo(startX, camY + canvasH + 600);
        for (let x = startX; x <= endX; x += 20) {
            ctx.lineTo(x, this.getTerrainY(x));
        }
        ctx.lineTo(endX, camY + canvasH + 600);
        ctx.closePath();

        const groundGrad = ctx.createLinearGradient(0, camY, 0, camY + canvasH);
        groundGrad.addColorStop(0, '#1e293b');
        groundGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = groundGrad;
        ctx.fill();

        // Neon Track Surface Line
        ctx.beginPath();
        for (let x = startX; x <= endX; x += 15) {
            const ty = this.getTerrainY(x);
            if (x === startX) ctx.moveTo(x, ty);
            else ctx.lineTo(x, ty);
        }
        ctx.strokeStyle = this.speedTier === 3
            ? '#f43f5e'
            : (this.isFlatSection(this.worldX) ? '#facc15' : '#38bdf8');
        ctx.lineWidth = 8;
        ctx.stroke();

        // Story Mode Finish Gate Arch
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

        // 3. Collectibles
        for (const item of this.items) {
            if (item.collected) continue;
            if (item.x < camX - 100 || item.x > camX + canvasW + 100) continue;
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

        // 4. Slipstream Wind Lines
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

        // 5. Draw NPC Rival Rig (Story Mode)
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

        // 6. Hyper-Dash Afterimages
        for (const ai of this.afterimages) {
            ctx.save();
            ctx.translate(ai.x, ai.y);
            ctx.globalAlpha = Math.max(0, ai.alpha * 0.45);
            ctx.filter = 'hue-rotate(180deg) brightness(1.6)';
            this.rig.draw(ctx, 0, -85, 0.58);
            ctx.restore();
        }

        // 7. Debris Particles & Sonic Shockwaves
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
            ctx.strokeStyle = `rgba(244, 63, 94, ${sw.alpha})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 8. Draw Player's Custom Husser Rig (rotates with velocity vector in mid-air!)
        const slopeAngle = Math.atan(this.getTerrainSlope(this.worldX));
        const airAngle = Math.max(-0.55, Math.min(0.65, Math.atan2(this.vy, this.vx) * 0.6));
        ctx.save();
        ctx.translate(this.worldX, this.y);
        ctx.rotate(this.grounded ? slopeAngle * 0.65 : airAngle);
        this.rig.draw(ctx, 0, -85, 0.58);
        ctx.restore();

        ctx.restore();
    }
}