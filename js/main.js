import { HusserRig } from './rig.js';
import { LimbStudio } from './studio.js';
import { EndlessRunner } from './runner.js';


const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const playerRig = new HusserRig();
let currentBg = 'day';
let scrollOffset = 0;

let mode = 'studio'; // 'studio' or 'runner'

const runner = new EndlessRunner(playerRig, () => {
    mode = 'studio';
    document.getElementById('studio-overlay').style.display = 'block';
    document.getElementById('scene-switcher').style.display = 'flex';
});

new LimbStudio(playerRig, () => {
    document.getElementById('studio-overlay').style.display = 'none';
    document.getElementById('scene-switcher').style.display = 'none';
    mode = 'runner';
    runner.start();
});

// Animation preview buttons
document.querySelectorAll('.anim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.anim-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playerRig.animState = btn.dataset.anim;
    });
});

// Backdrop scene switcher buttons
document.querySelectorAll('.bg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentBg = btn.dataset.bg;
    });
});

function drawPreviewStage(ctx, centerX, floorY, dt) {
    const stageW = Math.min(680, canvas.width - 480);
    const stageH = 460;
    const stageX = centerX - stageW / 2;
    const stageY = floorY - 330;

    // Scroll speed reacts to the selected preview animation
    const speeds = { idle: 0, run: 260, curl: 440, sonic: 950 };
    const speed = speeds[playerRig.animState] ?? 260;
    scrollOffset = (scrollOffset + speed * dt) % 120;

    ctx.save();

    // Rounded Skindex-style stage card
    ctx.beginPath();
    ctx.roundRect(stageX, stageY, stageW, stageH, 18);
    ctx.clip();

    if (currentBg === 'day') {
        // Bright School Track Sky (Clouds removed)
        const sky = ctx.createLinearGradient(0, stageY, 0, floorY);
        sky.addColorStop(0, '#38bdf8');
        sky.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = sky;
        ctx.fillRect(stageX, stageY, stageW, floorY - stageY);

        // Distant Hills / Grass
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(stageX, floorY - 22, stageW, 22);

        // Red School Sprint Track
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(stageX, floorY, stageW, stageY + stageH - floorY);

        // Scrolling White Track Lane Markings
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        for (let x = stageX - scrollOffset; x < stageX + stageW; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, floorY + 28);
            ctx.lineTo(x + 32, floorY + 28);
            ctx.stroke();
        }
    } else if (currentBg === 'sunset') {
        const sky = ctx.createLinearGradient(0, stageY, 0, floorY);
        sky.addColorStop(0, '#7c2d12');
        sky.addColorStop(0.5, '#f97316');
        sky.addColorStop(1, '#fef08a');
        ctx.fillStyle = sky;
        ctx.fillRect(stageX, stageY, stageW, floorY - stageY);

        // Sun Disc
        ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
        ctx.beginPath();
        ctx.arc(centerX, floorY - 90, 65, 0, Math.PI * 2);
        ctx.fill();

        // Rooftop Floor
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(stageX, floorY, stageW, stageY + stageH - floorY);

        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 4;
        for (let x = stageX - scrollOffset; x < stageX + stageW; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, floorY + 24);
            ctx.lineTo(x + 30, floorY + 24);
            ctx.stroke();
        }
    } else if (currentBg === 'grid') {
        // High-contrast light checkerboard for testing both black & white outlines
        const size = 24;
        for (let y = stageY; y < stageY + stageH; y += size) {
            for (let x = stageX; x < stageX + stageW; x += size) {
                const isEven = (Math.floor((x - stageX) / size) + Math.floor((y - stageY) / size)) % 2 === 0;
                ctx.fillStyle = isEven ? '#f8fafc' : '#cbd5e1';
                ctx.fillRect(x, y, size, size);
            }
        }
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(stageX, floorY);
        ctx.lineTo(stageX + stageW, floorY);
        ctx.stroke();
    } else {
        // Neon Night
        ctx.fillStyle = '#090d16';
        ctx.fillRect(stageX, stageY, stageW, stageH);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        for (let x = stageX - (scrollOffset % 40); x < stageX + stageW; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, stageY);
            ctx.lineTo(x, stageY + stageH);
            ctx.stroke();
        }

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(stageX, floorY);
        ctx.lineTo(stageX + stageW, floorY);
        ctx.stroke();
    }

    // Sonic Tier Speed Lines Overlay
    if (playerRig.animState === 'sonic') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const ly = stageY + 40 + ((i * 47) % (stageH - 80));
            const lx = stageX + ((i * 190 - scrollOffset * 3.5) % stageW + stageW) % stageW;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + 75, ly);
            ctx.stroke();
        }
    }

    // Ground Contact Shadow under the Husser
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(centerX, floorY + 6, 48, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render the Character Rig inside the Stage
    playerRig.draw(ctx, centerX, floorY - 95);

    ctx.restore();

    // Outer Stage Border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(stageX, stageY, stageW, stageH, 18);
    ctx.stroke();
}

let lastTime = performance.now();
function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mode === 'studio') {
        const previewX = Math.max(660, canvas.width * 0.64);
        const floorY = canvas.height * 0.62;
        playerRig.update(dt);
        drawPreviewStage(ctx, previewX, floorY, dt);
    } else {
        runner.update(dt);
        runner.draw(ctx, canvas.width, canvas.height);
    }

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);