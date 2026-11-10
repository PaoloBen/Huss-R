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

    setLimbTexture(part, dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        this.textures[part] = img;
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
                    armSwing: 1.35 + Math.sin(t * 35) * 0.15, // Anime/aerodynamic arms back
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
        this.drawBone(ctx, 'leg', 0, 55, pose.legSwing);
        // In Sonic mode, keep both arms swept back
        const frontArmAngle = this.animState === 'sonic' ? pose.armSwing - 0.2 : pose.armSwing;
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
            // Placeholder skeleton bone before the player draws it
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 4;
            ctx.strokeRect(-30, -30, 60, 90);
        }
        ctx.restore();
    }
}