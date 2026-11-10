export class EndlessRunner {
    constructor(rig, onEditHusser) {
        this.rig = rig;
        this.onEditHusser = onEditHusser;

        this.active = false;
        this.isDiving = false;
        this.totalScrap = 0;

        // UI Elements
        this.hudEl = document.getElementById('hud-overlay');
        this.gameOverEl = document.getElementById('gameover-overlay');
        this.speedEl = document.getElementById('hud-speed');
        this.tierBadgeEl = document.getElementById('hud-tier-badge');
        this.fuelFillEl = document.getElementById('hud-fuel-fill');
        this.stallWarnEl = document.getElementById('stall-warning');
        this.distEl = document.getElementById('hud-distance');
        this.scrapEl = document.getElementById('hud-scrap');
        this.finalStatsEl = document.getElementById('final-stats-text');

        this.bindInputs();
        this.reset();
    }

    bindInputs() {
        const setDive = (state) => {
            if (!this.active) return;
            this.isDiving = state;
        };

        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowDown', 'KeyS'].includes(e.code)) {
                setDive(true);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (['Space', 'ArrowDown', 'KeyS'].includes(e.code)) {
                setDive(false);
            }
        });

        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('pointerdown', () => setDive(true));
        window.addEventListener('pointerup', () => setDive(false));

        document.getElementById('retry-btn').addEventListener('click', () => {
            this.gameOverEl.style.display = 'none';
            this.start();
        });

        document.getElementById('back-studio-btn').addEventListener('click', () => {
            this.stop();
            this.onEditHusser();
        });
    }

    start() {
        this.reset();
        this.active = true;
        this.hudEl.style.display = 'flex';
        this.gameOverEl.style.display = 'none';
    }

    stop() {
        this.active = false;
        this.hudEl.style.display = 'none';
        this.gameOverEl.style.display = 'none';
    }

    reset() {
        this.worldX = 0;
        this.y = this.getTerrainY(0);
        this.vx = 420; // Starting sprint velocity
        this.vy = 0;
        this.grounded = true;

        this.adrenaline = 100;
        this.runScrap = 0;
        this.speedTier = 1;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        this.items = [];
        this.props = [];
        this.particles = [];
        this.shockwaves = [];
        this.nextSpawnX = 600;
    }

    // Procedural Zero-Obstacle Spline Track (layered harmonics for loops/half-pipes/drops)
    getTerrainY(x) {
        const base = 420;
        const hill1 = Math.sin(x * 0.0022) * 150;
        const hill2 = Math.sin(x * 0.0051 + 1.4) * 85;
        const steepDrop = Math.cos(x * 0.0011) * 190;
        return base + hill1 + hill2 + steepDrop;
    }

    getTerrainSlope(x) {
        return (this.getTerrainY(x + 2) - this.getTerrainY(x - 2)) / 4;
    }

    spawnWorldChunk(startX, endX) {
        for (let x = startX; x < endX; x += 220) {
            const ty = this.getTerrainY(x);
            const roll = Math.random();

            // Collectibles: Huss Cells (Fuel), Speed Modules, and Nano-Scrap
            if (roll < 0.55) {
                this.items.push({ x, y: ty - 45, type: 'cell', collected: false });
            } else if (roll < 0.8) {
                this.items.push({ x, y: ty - 55, type: 'scrap', collected: false });
            } else {
                this.items.push({ x, y: ty - 65, type: 'module', collected: false });
            }

            // Destructible Background Scenery Props (Buildings / Neon Pylons / Fences)
            if (Math.random() < 0.75) {
                const h = 90 + Math.random() * 160;
                const w = 45 + Math.random() * 50;
                this.props.push({
                    x: x + (Math.random() * 80 - 40),
                    y: ty,
                    w,
                    h,
                    color: Math.random() > 0.5 ? '#1e293b' : '#334155',
                    neon: Math.random() > 0.5 ? '#38bdf8' : '#f43f5e',
                    shattered: false
                });
            }
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

        // Spawn ahead of player
        if (this.worldX + 2200 > this.nextSpawnX) {
            this.spawnWorldChunk(this.nextSpawnX, this.nextSpawnX + 2200);
            this.nextSpawnX += 2200;
        }

        const slope = this.getTerrainSlope(this.worldX);
        const gravity = this.isDiving ? 2600 : 880;

        if (this.grounded) {
            // Slope momentum physics
            if (slope > 0) {
                // Downhill: Diving rockets velocity
                const diveMultiplier = this.isDiving ? 1450 : 520;
                this.vx += slope * diveMultiplier * dt;
            } else {
                // Uphill: Holding dive kills momentum; releasing lets you carry speed
                const uphillDrag = this.isDiving ? 1350 : 360;
                this.vx += slope * uphillDrag * dt;
            }

            // Passive base drive so player doesn't get permanently stuck in a valley
            if (this.vx < 240) {
                this.vx += 180 * dt;
            }

            // Natural aerodynamic drag at extreme speeds
            this.vx -= this.vx * 0.12 * dt;

            // Move horizontally and check if cresting a hill launches us airborne
            this.worldX += this.vx * dt;
            const nextTerrainY = this.getTerrainY(this.worldX);
            const expectedVy = slope * this.vx;

            if ( !this.isDiving && slope < -0.15 && this.vx > 650 && this.getTerrainSlope(this.worldX + 35) > slope + 0.18 ) {
                // Launch off steep crest!
                this.grounded = false;
                this.vy = expectedVy * 0.85;
            } else {
                this.y = nextTerrainY;
                this.vy = expectedVy;
            }
        } else {
            // Airborne trajectory
            this.vy += gravity * dt;
            this.worldX += this.vx * dt;
            this.y += this.vy * dt;

            const groundY = this.getTerrainY(this.worldX);
            if (this.y >= groundY) {
                this.y = groundY;
                this.grounded = true;

                // Landing on a downhill slope gives a clean "Slope Pump" boost!
                if (slope > 0.12) {
                    const pumpBonus = this.isDiving ? 220 : 110;
                    this.vx += pumpBonus;
                    this.spawnDebris(this.worldX, this.y, '#38bdf8', 10);
                } else if (slope < -0.2 && this.isDiving) {
                    // Slammed into an uphill while diving
                    this.vx *= 0.68;
                }
            }
        }

        this.vx = Math.max(120, Math.min(1850, this.vx));

        // Determine Speed Tier & Animation State
        const prevTier = this.speedTier;
        if (this.vx >= 1100) {
            this.speedTier = 3; // SONIC BOOM TIER
        } else if (this.vx >= 750) {
            this.speedTier = 2; // MACH TIER
        } else {
            this.speedTier = 1; // SPRINT TIER
        }

        if (this.speedTier === 3 && prevTier < 3) {
            // Sonic Boom Transition Shockwave!
            this.shakeTimer = 0.45;
            this.shakeIntensity = 14;
            this.shockwaves.push({ x: this.worldX, y: this.y - 45, radius: 15, alpha: 1 });
        }

        // Sync Husser Rig Animation
        if (this.isDiving) {
            this.rig.animState = 'curl';
        } else if (this.speedTier >= 2) {
            this.rig.animState = 'sonic';
        } else {
            this.rig.animState = 'run';
        }
        this.rig.update(dt * (this.vx / 380));

        // Adrenaline Burn (Fuel Management)
        const isStalling = this.vx < 350;
        const drainRate = isStalling ? 14.5 : 5.2;
        this.adrenaline = Math.max(0, this.adrenaline - drainRate * dt);
        this.stallWarnEl.style.display = isStalling ? 'inline' : 'none';

        if (this.adrenaline <= 0) {
            this.triggerGameOver();
            return;
        }

        // Collectibles Collision
        for (const item of this.items) {
            if (!item.collected && Math.hypot(item.x - this.worldX, item.y - (this.y - 45)) < 85) {
                item.collected = true;
                if (item.type === 'cell') {
                    this.adrenaline = Math.min(100, this.adrenaline + 22);
                    this.spawnDebris(item.x, item.y, '#38bdf8', 8);
                } else if (item.type === 'scrap') {
                    this.runScrap += 5;
                    this.totalScrap += 5;
                    this.spawnDebris(item.x, item.y, '#c084fc', 8);
                } else if (item.type === 'module') {
                    this.vx = Math.min(1850, this.vx + 320);
                    this.adrenaline = Math.min(100, this.adrenaline + 10);
                    this.shakeTimer = 0.3;
                    this.shakeIntensity = 10;
                    this.shockwaves.push({ x: this.worldX, y: this.y - 45, radius: 10, alpha: 1 });
                    this.spawnDebris(item.x, item.y, '#facc15', 14);
                }
            }
        }

        // Visual Destruction Tiers: Shatter nearby buildings at Tier 3 (Sonic Boom)
        if (this.speedTier === 3) {
            this.shakeTimer = Math.max(this.shakeTimer, 0.1);
            this.shakeIntensity = 6;
            for (const prop of this.props) {
                if (!prop.shattered && Math.abs(prop.x - this.worldX) < 160) {
                    prop.shattered = true;
                    this.spawnDebris(prop.x, prop.y - prop.h / 2, prop.neon, 18);
                    this.spawnDebris(prop.x, prop.y - prop.h / 2, prop.color, 12);
                }
            }
        }

        // Update Particles & Shockwaves
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 900 * dt;
            p.rot += p.vRot * dt;
            p.life -= dt * 1.4;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += 950 * dt;
            sw.alpha -= dt * 1.8;
            if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
        }

        if (this.shakeTimer > 0) this.shakeTimer -= dt;

        // Clean up old off-screen objects
        this.items = this.items.filter(i => i.x > this.worldX - 600 && !i.collected);
        this.props = this.props.filter(p => p.x > this.worldX - 600);

        this.updateHUD();
    }

    updateHUD() {
        const displaySpeed = Math.round(this.vx / 10);
        const distanceMeters = Math.floor(this.worldX / 25);

        this.speedEl.textContent = `${displaySpeed} m/s`;
        this.distEl.textContent = `${distanceMeters} m`;
        this.scrapEl.textContent = `⚙️ ${this.runScrap} Nano-Scrap`;
        this.fuelFillEl.style.width = `${this.adrenaline}%`;

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
    }

    triggerGameOver() {
        this.active = false;
        const distanceMeters = Math.floor(this.worldX / 25);
        this.finalStatsEl.textContent = `You sprinted ${distanceMeters}m and scavenged ${this.runScrap} Nano-Scrap! (Total Banked: ${this.totalScrap})`;
        this.gameOverEl.style.display = 'block';
    }

    draw(ctx, canvasW, canvasH) {
        ctx.save();

        // Dynamic Sky Background shifts with Speed Tier
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

        // Camera Transform + Sonic Screen Shake
        const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
        const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
        const camX = this.worldX - canvasW * 0.28 + shakeX;
        const camY = this.y - canvasH * 0.62 + shakeY;

        ctx.translate(-camX, -camY);

        // 1. Draw Destructible Background Buildings & Fences
        for (const prop of this.props) {
            if (prop.shattered) continue;
            ctx.fillStyle = prop.color;
            ctx.fillRect(prop.x - prop.w / 2, prop.y - prop.h, prop.w, prop.h + 120);
            ctx.strokeStyle = prop.neon;
            ctx.lineWidth = 3;
            ctx.strokeRect(prop.x - prop.w / 2, prop.y - prop.h, prop.w, prop.h);
        }

        // 2. Draw Spline Terrain Polygon
        ctx.beginPath();
        const startX = Math.floor(camX / 20) * 20 - 40;
        const endX = camX + canvasW + 80;
        ctx.moveTo(startX, camY + canvasH + 400);
        for (let x = startX; x <= endX; x += 20) {
            ctx.lineTo(x, this.getTerrainY(x));
        }
        ctx.lineTo(endX, camY + canvasH + 400);
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
        ctx.strokeStyle = this.speedTier === 3 ? '#f43f5e' : '#38bdf8';
        ctx.lineWidth = 8;
        ctx.stroke();

        // 3. Draw Collectibles (Huss Cells, Speed Modules, Nano-Scrap)
        for (const item of this.items) {
            if (item.collected) continue;
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

        // 4. Draw Shattered Scenery Debris Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }

        // 5. Draw Sonic Boom Shockwaves
        for (const sw of this.shockwaves) {
            ctx.save();
            ctx.strokeStyle = `rgba(244, 63, 94, ${sw.alpha})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 6. Draw the Player's Custom Husser Rig aligned to the slope
        const slopeAngle = Math.atan(this.getTerrainSlope(this.worldX));
        ctx.save();
        ctx.translate(this.worldX, this.y);
        ctx.rotate(this.grounded ? slopeAngle * 0.65 : 0.15);
        this.rig.draw(ctx, 0, -85, 0.58);
        ctx.restore();

        ctx.restore();
    }
}