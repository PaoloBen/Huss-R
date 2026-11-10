export class HusserRig {
    constructor() {
        this.textures = { head: null, torso: null, arm: null, leg: null };
        this.animState = 'run';
        this.time = 0;

        // Pivot coordinates inside the 240x240 drawing canvas
        this.pivots = {
            head:  { x: 120, y: 200 }, // Bottom-center (neck)
            torso: { x: 120, y: 120 }, // Center core
            arm:   { x: 120, y: 40 },  // Top-center (shoulder)
            leg:   { x: 120, y: 40 }   // Top-center (hip)
        };
    }

    setLimbTexture(part, dataUrl, onLoadCallback = null) {
        if (!dataUrl) {
            this.textures[part] = null;
            return;
        }
        const img = new Image();
        if (onLoadCallback) {
            img.onload = () => onLoadCallback(part, img);
        }
        img.src = dataUrl;
        this.textures[part] = img;
    }

    loadFromLimbMap(limbsObj, onEachLoaded = null) {
        if (!limbsObj) return;
        ['head', 'arm', 'torso', 'leg'].forEach(part => {
            if (limbsObj[part]) {
                this.setLimbTexture(part, limbsObj[part], onEachLoaded);
            }
        });
    }

    // Generates a clean cyber-sprinter preset for NPC Rivals or the "Cyber Preset" button
    generatePresetTextures(colors = { primary: '#38bdf8', secondary: '#0f172a', visor: '#f43f5e' }) {
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
                // Aerodynamic sprint helmet
                ctx.fillStyle = colors.secondary;
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.ellipse(125, 145, 52, 46, -0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                //Glowing Visor
                ctx.fillStyle = colors.visor;
                ctx.beginPath();
                ctx.roundRect(130, 128, 44, 20, 8);
                ctx.fill();
            } else if (part === 'torso') {
                ctx.fillStyle = colors.secondary;
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.roundRect(88, 52, 64, 132, 18);
                ctx.fill();
                ctx.stroke();

                // Core energy reactor stripe
                ctx.fillStyle = colors.visor;
                ctx.beginPath();
                ctx.arc(120, 115, 14, 0, Math.PI * 2);
                ctx.fill();
            } else if (part === 'arm') {
                ctx.fillStyle = colors.secondary;
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.roundRect(102, 28, 36, 128, 16);
                ctx.fill();
                ctx.stroke();
            } else if (part === 'leg') {
                ctx.fillStyle = colors.secondary;
                ctx.strokeStyle = colors.primary;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.roundRect(100, 28, 40, 138, 16);
                ctx.fill();
                ctx.stroke();

                // Sprint boot flare
                ctx.fillStyle = colors.visor;
                ctx.fillRect(100, 150, 48, 18);
            }

            const url = c.toDataURL('image/webp', 0.9);
            result[part] = url;
            this.setLimbTexture(part, url);
        });

        return result;
    }

    update(dt) {
        this.time += dt;
    }

    getPose() {
        const t = this.time;
        switch (this.animState) {
            case 'idle':
                return {
                    torsoY: Math.sin(t * 3) * 4,
                    torsoRot: 0.05,
                    headRot: Math.sin(t * 3 - 0.5) * 0.06,
                    armSwing: Math.sin(t * 3) * 0.15,
                    legSwing: 0,
                    curlScale: 1
                };
            case 'air': // Midair soar/leap pose (no leg pedaling)
                return {
                    torsoY: -18 + Math.sin(t * 4) * 5,
                    torsoRot: -0.18 + Math.sin(t * 3) * 0.05,
                    headRot: 0.15,
                    armSwing: -0.85 + Math.sin(t * 5) * 0.12, // Arms swept up/back in the wind
                    legSwing: 0.72 + Math.cos(t * 4) * 0.08,  // Wide airborne split stride
                    curlScale: 1
                };
            case 'curl': // Downhill tuck/slide
                return {
                    torsoY: 35,
                    torsoRot: 1.1,
                    headRot: -0.5,
                    armSwing: 1.4,
                    legSwing: -1.3,
                    curlScale: 0.9
                };
            case 'sonic': // Full horizontal torso lean + hyper-speed limbs
                return {
                    torsoY: Math.sin(t * 28) * 6,
                    torsoRot: 0.65,
                    headRot: -0.45,
                    armSwing: 1.35 + Math.sin(t * 35) * 0.15,
                    legSwing: Math.sin(t * 28) * 1.4,
                    curlScale: 1
                };
            case 'run':
            default:
                return {
                    torsoY: Math.abs(Math.sin(t * 12)) * -14,
                    torsoRot: 0.25,
                    headRot: Math.sin(t * 12) * 0.08,
                    armSwing: Math.sin(t * 12) * 0.95,
                    legSwing: Math.sin(t * 12) * 1.05,
                    curlScale: 1
                };
        }
    }

    draw(ctx, x, y, scale = 0.65) {
        const pose = this.getPose();

        ctx.save();
        ctx.translate(x, y + pose.torsoY);
        ctx.scale(scale, scale * pose.curlScale);
        ctx.rotate(pose.torsoRot);

        // 1. Back Arm & Back Leg (darkened for depth)
        ctx.save();
        ctx.filter = 'brightness(0.65)';
        this.drawBone(ctx, 'leg', 0, 55, -pose.legSwing);
        this.drawBone(ctx, 'arm', 0, -50, -pose.armSwing);
        ctx.restore();

        // 2. Torso (Root Bone)
        this.drawBone(ctx, 'torso', 0, 0, 0);

        // 3. Head
        this.drawBone(ctx, 'head', 0, -65, pose.headRot);

        // 4. Front Leg & Front Arm
        const frontLegAngle = this.animState === 'air' ? -pose.legSwing * 0.45 : pose.legSwing;
        this.drawBone(ctx, 'leg', 0, 55, frontLegAngle);
        const frontArmAngle = (this.animState === 'sonic' || this.animState === 'air')
            ? pose.armSwing - 0.25
            : pose.armSwing;
        this.drawBone(ctx, 'arm', 0, -50, frontArmAngle);

        ctx.restore();
    }

    drawBone(ctx, part, attachX, attachY, angle) {
        const img = this.textures[part];
        const pivot = this.pivots[part];

        ctx.save();
        ctx.translate(attachX, attachY);
        ctx.rotate(angle);

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, -pivot.x, -pivot.y);
        } else {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 4;
            ctx.strokeRect(-30, -30, 60, 90);
        }
        ctx.restore();
    }
}