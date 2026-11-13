export class HusserRig {
    constructor() {
        this.textures = { head: null, torso: null, arm: null, leg: null };
        this.darkTextures = { head: null, torso: null, arm: null, leg: null };
        this.tintCache = {};
        this.animState = 'run';
        this.time = 0;

        this.pivots = {
            head:  { x: 120, y: 200 },
            torso: { x: 120, y: 120 },
            arm:   { x: 120, y: 40 },
            leg:   { x: 120, y: 40 }
        };
    }

    setLimbTexture(part, dataUrl, onLoadCallback = null) {
        this.tintCache = {};
        if (!dataUrl) {
            this.textures[part] = null;
            this.darkTextures[part] = null;
            return;
        }
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = 240;
            c.height = 240;
            const cctx = c.getContext('2d');
            cctx.drawImage(img, 0, 0);
            cctx.globalCompositeOperation = 'source-atop';
            cctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
            cctx.fillRect(0, 0, 240, 240);
            this.darkTextures[part] = c;

            if (onLoadCallback) onLoadCallback(part, img);
        };
        img.src = dataUrl;
        this.textures[part] = img;
    }

    getTintedTexture(part, colorHex) {
        const src = this.textures[part];
        if (!src || !src.complete || src.naturalWidth === 0) return null;
        const key = `${part}_${colorHex}`;
        if (this.tintCache[key]) return this.tintCache[key];

        if (Object.keys(this.tintCache).length > 48) {
            this.tintCache = {};
        }

        const c = document.createElement('canvas');
        c.width = 240;
        c.height = 240;
        const cctx = c.getContext('2d');
        cctx.drawImage(src, 0, 0);
        cctx.globalCompositeOperation = 'source-atop';
        cctx.fillStyle = colorHex;
        cctx.fillRect(0, 0, 240, 240);
        this.tintCache[key] = c;
        return c;
    }

    loadFromLimbMap(limbsObj, onEachLoaded = null) {
        if (!limbsObj) return;
        ['head', 'arm', 'torso', 'leg'].forEach(part => {
            if (limbsObj[part]) {
                this.setLimbTexture(part, limbsObj[part], onEachLoaded);
            }
        });
    }

    // Generates a crisp Rival NPC / Template Avatar icon (uses custom uploaded head if available!)
    static generateRivalAvatar(colors = { primary: '#38bdf8', secondary: '#0f172a', visor: '#f43f5e', style: 'aero' }, customLimbs = null) {
        if (customLimbs && customLimbs.head) {
            return customLimbs.head;
        }

        const c = document.createElement('canvas');
        c.width = 140;
        c.height = 140;
        const ctx = c.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1. Deep cyber backdrop + radial aura glow
        const bgGrad = ctx.createRadialGradient(70, 68, 8, 70, 68, 68);
        bgGrad.addColorStop(0, colors.primary + '66');
        bgGrad.addColorStop(0.55, colors.secondary || '#0f172a');
        bgGrad.addColorStop(1, '#050811');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 140, 140);

        // Diagonal speed streaks in background
        ctx.strokeStyle = colors.primary + '38';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            const y = 26 + i * 28;
            ctx.beginPath();
            ctx.moveTo(12, y + 10);
            ctx.lineTo(128, y - 10);
            ctx.stroke();
        }

        // 2. Neck & armored shoulder silhouette
        ctx.fillStyle = colors.secondary;
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(34, 140);
        ctx.quadraticCurveTo(46, 102, 72, 102);
        ctx.quadraticCurveTo(98, 102, 110, 140);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Collar core glow
        ctx.fillStyle = colors.visor;
        ctx.beginPath();
        ctx.arc(76, 118, 7, 0, Math.PI * 2);
        ctx.fill();

        // 3. Rear Aerodynamic Crest / Horns / Halo
        ctx.fillStyle = colors.primary;
        if (colors.style === 'crown') {
            ctx.beginPath();
            ctx.moveTo(52, 42);
            ctx.lineTo(18, 16);
            ctx.lineTo(38, 48);
            ctx.lineTo(12, 36);
            ctx.lineTo(48, 62);
            ctx.closePath();
            ctx.fill();
        } else if (colors.style === 'valkyrie') {
            ctx.beginPath();
            ctx.moveTo(54, 46);
            ctx.lineTo(10, 22);
            ctx.lineTo(30, 54);
            ctx.lineTo(14, 52);
            ctx.lineTo(50, 68);
            ctx.closePath();
            ctx.fill();
        } else if (colors.style === 'oni') {
            ctx.beginPath();
            ctx.moveTo(78, 38);
            ctx.quadraticCurveTo(92, 12, 112, 14);
            ctx.quadraticCurveTo(100, 34, 90, 44);
            ctx.moveTo(58, 40);
            ctx.quadraticCurveTo(42, 16, 24, 20);
            ctx.quadraticCurveTo(38, 38, 48, 48);
            ctx.fill();
        } else if (colors.style === 'halo') {
            ctx.strokeStyle = colors.visor;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.ellipse(68, 24, 34, 8, -0.12, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(46, 46);
            ctx.lineTo(14, 34);
            ctx.lineTo(32, 64);
            ctx.closePath();
            ctx.fill();
        }

        // 4. Sculpted Helmet Shell
        ctx.fillStyle = colors.secondary;
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.ellipse(72, 68, 38, 33, -0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 5. Glowing Visor + Specular Shine
        ctx.fillStyle = colors.visor;
        ctx.beginPath();
        if (colors.style === 'visor_x') {
            ctx.moveTo(68, 52);
            ctx.lineTo(112, 46);
            ctx.lineTo(104, 68);
            ctx.lineTo(68, 72);
            ctx.closePath();
        } else {
            ctx.roundRect(70, 52, 40, 19, 7);
        }
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.fillRect(76, 56, 20, 4);

        // 6. Earcomm node & jaw trim
        ctx.fillStyle = colors.primary;
        ctx.beginPath();
        ctx.arc(56, 72, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colors.visor;
        ctx.beginPath();
        ctx.arc(56, 72, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Outer badge border
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 136, 136);

        return c.toDataURL('image/webp', 0.92);
    }

    // Improved Detailed Cyber-Sprinter Template & Rival NPC Generator
    generatePresetTextures(colors = { primary: '#38bdf8', secondary: '#0f172a', visor: '#f43f5e', style: 'aero' }) {
        const result = {};
        const parts = ['head', 'arm', 'torso', 'leg'];

        parts.forEach(part => {
            const c = document.createElement('canvas');
            c.width = 240;
            c.height = 240;
            const ctx = c.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (part === 'head') {
                // Rear aero fin
                ctx.fillStyle = colors.primary;
                ctx.beginPath();
                ctx.moveTo(95, 115);
                ctx.lineTo(48, 96);
                ctx.lineTo(82, 148);
                ctx.closePath();
                ctx.fill();

                // Main helmet dome
                ctx.fillStyle = colors.secondary;
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.ellipse(126, 145, 52, 45, -0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Chin guard & ear node
                ctx.fillStyle = colors.primary;
                ctx.beginPath();
                ctx.arc(110, 152, 10, 0, Math.PI * 2);
                ctx.fill();

                // Glowing Visor + Specular Highlight
                ctx.fillStyle = colors.visor;
                ctx.beginPath();
                ctx.roundRect(132, 126, 46, 22, 8);
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillRect(140, 130, 24, 5);
            } else if (part === 'torso') {
                // Armored chest chassis
                ctx.fillStyle = colors.secondary;
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.roundRect(86, 50, 68, 134, 20);
                ctx.fill();
                ctx.stroke();

                // Diagonal speed vents
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(98, 78);
                ctx.lineTo(142, 92);
                ctx.moveTo(98, 152);
                ctx.lineTo(142, 140);
                ctx.stroke();

                // Glowing Energy Core Reactor
                ctx.fillStyle = colors.visor;
                ctx.beginPath();
                ctx.arc(120, 116, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(120, 116, 7, 0, Math.PI * 2);
                ctx.fill();
            } else if (part === 'arm') {
                // Upper & lower gauntlet segments
                ctx.fillStyle = colors.secondary;
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 5.5;
                ctx.beginPath();
                ctx.roundRect(102, 26, 36, 128, 16);
                ctx.fill();
                ctx.stroke();

                // Shoulder & forearm thruster trim
                ctx.fillStyle = colors.visor;
                ctx.beginPath();
                ctx.roundRect(106, 36, 28, 16, 6);
                ctx.roundRect(106, 112, 28, 26, 6);
                ctx.fill();
            } else if (part === 'leg') {
                // Sculpted sprint leg + knee guard
                ctx.fillStyle = colors.secondary;
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.roundRect(98, 26, 42, 138, 16);
                ctx.fill();
                ctx.stroke();

                // Knee joint accent
                ctx.fillStyle = colors.primary;
                ctx.beginPath();
                ctx.arc(120, 96, 11, 0, Math.PI * 2);
                ctx.fill();

                // Aerodynamic sprint boot + heel fin
                ctx.fillStyle = colors.visor;
                ctx.beginPath();
                ctx.roundRect(96, 146, 54, 22, 8);
                ctx.fill();
            }

            const url = c.toDataURL('image/webp', 0.92);
            result[part] = url;
            this.setLimbTexture(part, url);
        });

        return result;
    }

    update(dt) {
        this.time += dt;
        this.lastUpdateTime = this.time;

        // Real-time delta so pose crossfades always take a smooth ~0.14s regardless of speed multiplier
        const now = performance.now();
        const realDt = this.lastRealNow ? Math.min(0.05, Math.max(0.001, (now - this.lastRealNow) / 1000)) : 0.016;
        this.lastRealNow = now;

        const targetFreq = this.animState === 'sonic' ? 24 : (this.animState === 'curl' ? 22 : 13);
        this.currentFreq = (this.currentFreq ?? targetFreq) + (targetFreq - (this.currentFreq ?? targetFreq)) * Math.min(1, realDt * 10);
        this.stridePhase = (this.stridePhase || 0) + dt * this.currentFreq;

        const states = ['idle', 'run', 'sonic', 'curl', 'air', 'air_curl', 'charge'];
        if (!this.stateWeights) {
            this.stateWeights = { idle: 0, run: 0, sonic: 0, curl: 0, air: 0, air_curl: 0, charge: 0 };
            this.stateWeights[this.animState] = 1;
        }

        const blendStep = 1 - Math.exp(-16 * realDt);
        let weightSum = 0;
        for (let i = 0; i < states.length; i++) {
            const st = states[i];
            if (this.stateWeights[st] === undefined) this.stateWeights[st] = 0;
            const targetW = st === this.animState ? 1 : 0;
            this.stateWeights[st] += (targetW - this.stateWeights[st]) * blendStep;
            if (this.stateWeights[st] < 0.001) this.stateWeights[st] = 0;
            weightSum += this.stateWeights[st];
        }
        if (weightSum > 0) {
            for (let i = 0; i < states.length; i++) {
                this.stateWeights[states[i]] /= weightSum;
            }
        } else {
            this.stateWeights[this.animState] = 1;
        }
    }

    getStatePose(state, t, strideP) {
        switch (state) {
            case 'charge': {
                // Coiled sprinter block-start stance with subtle high-energy tremor
                const tremor = Math.sin(t * 38) * 1.4;
                return {
                    torsoY: 26 + tremor,
                    torsoRot: 0.88 + Math.sin(t * 28) * 0.025,
                    headRot: -0.56,
                    frontArm: 1.18 + Math.sin(t * 34) * 0.04,
                    backArm: -0.92 - Math.sin(t * 34) * 0.04,
                    frontLeg: -0.86,
                    backLeg: 1.08,
                    curlScale: 0.94
                };
            }
            case 'idle':
                return {
                    torsoY: Math.sin(t * 3.2) * 4.5,
                    torsoRot: 0.04 + Math.sin(t * 1.6) * 0.02,
                    headRot: Math.sin(t * 3.2 - 0.5) * 0.05,
                    frontArm: Math.sin(t * 3.2) * 0.14 + 0.08,
                    backArm: -Math.sin(t * 3.2) * 0.14 - 0.08,
                    frontLeg: 0.08,
                    backLeg: -0.08,
                    curlScale: 1
                };
            case 'air':
                return {
                    torsoY: -18 + Math.sin(t * 4.5) * 5,
                    torsoRot: -0.16 + Math.sin(t * 3.5) * 0.05,
                    headRot: 0.14,
                    frontArm: -1.05 + Math.sin(t * 5) * 0.12,
                    backArm: 0.65 - Math.sin(t * 5) * 0.12,
                    frontLeg: -0.42 + Math.cos(t * 4) * 0.08,
                    backLeg: 0.78 - Math.cos(t * 4) * 0.08,
                    curlScale: 1
                };
            case 'air_curl':
                return {
                    torsoY: -6 + Math.sin(t * 6) * 4,
                    torsoRot: 0.54 + Math.sin(t * 5) * 0.04,
                    headRot: 0.22,
                    frontArm: -1.25 + Math.sin(t * 7) * 0.12,
                    backArm: 0.95 - Math.sin(t * 7) * 0.12,
                    frontLeg: 0.25 + Math.cos(t * 6) * 0.08,
                    backLeg: -0.82 - Math.cos(t * 6) * 0.08,
                    curlScale: 1
                };
            case 'curl': {
                const cyc = strideP;
                return {
                    torsoY: 34 + Math.abs(Math.sin(cyc)) * -6,
                    torsoRot: 1.08,
                    headRot: -0.48 + Math.sin(cyc) * 0.06,
                    frontArm: 1.32 + Math.sin(cyc) * 0.18,
                    backArm: 1.48 - Math.sin(cyc) * 0.18,
                    frontLeg: Math.sin(cyc) * 1.12,
                    backLeg: -Math.sin(cyc) * 1.12,
                    curlScale: 0.9
                };
            }
            case 'sonic': {
                const p = strideP;
                const legF = Math.sin(p) * 1.38 - Math.cos(p * 2) * 0.22;
                const legB = Math.sin(p + Math.PI) * 1.38 - Math.cos((p + Math.PI) * 2) * 0.22;
                const armF = Math.sin(p + Math.PI) * 1.28 + 0.32;
                const armB = Math.sin(p) * 1.28 + 0.32;
                return {
                    torsoY: -Math.abs(Math.sin(p)) * 13 + 4,
                    torsoRot: 0.62 + Math.cos(p * 2) * 0.05,
                    headRot: -0.42 - Math.cos(p * 2) * 0.04,
                    frontArm: armF,
                    backArm: armB,
                    frontLeg: legF,
                    backLeg: legB,
                    curlScale: 1
                };
            }
            case 'run':
            default: {
                const p = strideP;
                const legF = Math.sin(p) * 1.08 - Math.cos(p * 2) * 0.18;
                const legB = Math.sin(p + Math.PI) * 1.08 - Math.cos((p + Math.PI) * 2) * 0.18;
                const armF = Math.sin(p + Math.PI) * 0.96 + 0.08;
                const armB = Math.sin(p) * 0.96 + 0.08;
                return {
                    torsoY: -Math.abs(Math.sin(p)) * 15,
                    torsoRot: 0.26 + Math.cos(p * 2) * 0.04,
                    headRot: -0.08 + Math.sin(p) * 0.06,
                    frontArm: armF,
                    backArm: armB,
                    frontLeg: legF,
                    backLeg: legB,
                    curlScale: 1
                };
            }
        }
    }

    // Smoothly Crossfaded Multi-Harmonic Pose
    getPose() {
        const t = this.time;
        const timeOffset = t - (this.lastUpdateTime ?? t);
        const freq = this.currentFreq ?? (this.animState === 'sonic' ? 24 : 13);
        const strideP = (this.stridePhase ?? (t * freq)) + timeOffset * freq;

        // If rendering a historical afterimage snapshot or before first update, evaluate directly
        if (!this.stateWeights || Math.abs(timeOffset) > 0.0001) {
            return this.getStatePose(this.animState, t, strideP);
        }

        const blended = {
            torsoY: 0,
            torsoRot: 0,
            headRot: 0,
            frontArm: 0,
            backArm: 0,
            frontLeg: 0,
            backLeg: 0,
            curlScale: 0
        };

        for (const [st, w] of Object.entries(this.stateWeights)) {
            if (w <= 0.001) continue;
            const p = this.getStatePose(st, t, strideP);
            blended.torsoY += p.torsoY * w;
            blended.torsoRot += p.torsoRot * w;
            blended.headRot += p.headRot * w;
            blended.frontArm += p.frontArm * w;
            blended.backArm += p.backArm * w;
            blended.frontLeg += p.frontLeg * w;
            blended.backLeg += p.backLeg * w;
            blended.curlScale += p.curlScale * w;
        }
        return blended;
    }

    draw(ctx, x, y, scale = 0.65, tintColor = null) {
        const pose = this.getPose();

        ctx.save();
        ctx.translate(x, y + pose.torsoY);
        ctx.scale(scale, scale * pose.curlScale);
        ctx.rotate(pose.torsoRot);

        // 1. Back Leg & Back Arm
        this.drawBone(ctx, 'leg', 0, 55, pose.backLeg, true, tintColor);
        this.drawBone(ctx, 'arm', 0, -50, pose.backArm, true, tintColor);

        // 2. Torso
        this.drawBone(ctx, 'torso', 0, 0, 0, false, tintColor);

        // 3. Head
        this.drawBone(ctx, 'head', 0, -65, pose.headRot, false, tintColor);

        // 4. Front Leg & Front Arm
        this.drawBone(ctx, 'leg', 0, 55, pose.frontLeg, false, tintColor);
        this.drawBone(ctx, 'arm', 0, -50, pose.frontArm, false, tintColor);

        ctx.restore();
    }

    drawBone(ctx, part, attachX, attachY, angle, isBackLimb = false, tintColor = null) {
        const pivot = this.pivots[part];
        let drawable = null;

        if (tintColor) {
            drawable = this.getTintedTexture(part, tintColor);
        } else if (isBackLimb && this.darkTextures[part]) {
            drawable = this.darkTextures[part];
        } else {
            const img = this.textures[part];
            if (img && img.complete && img.naturalWidth > 0) drawable = img;
        }

        ctx.save();
        ctx.translate(attachX, attachY);
        ctx.rotate(angle);

        if (drawable) {
            ctx.drawImage(drawable, -pivot.x, -pivot.y);
        } else {
            ctx.strokeStyle = tintColor || 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 4;
            ctx.strokeRect(-30, -30, 60, 90);
        }
        ctx.restore();
    }
}