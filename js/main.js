import { HusserRig } from './rig.js';
import { LimbStudio } from './studio.js';
import { EndlessRunner } from './runner.js';
import { DataManager, STORY_RIVALS, WORKSHOP_SPECS } from './storage.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const playerRig = new HusserRig();
const cutsceneRivalRig = new HusserRig();
let currentBg = 'day';
let scrollOffset = 0;
let mode = 'menu'; // 'menu', 'studio', 'cutscene', or 'runner'

const dataManager = new DataManager((state, user) => {
    updateTopBarUI(state, user);
});

const studio = new LimbStudio(playerRig, dataManager, () => {
    enterEndlessMode();
});

const runner = new EndlessRunner(
    playerRig,
    dataManager,
    () => openCharacterEditor(),
    () => {
        openCharacterEditor();
        openWorkshopModal();
    },
    () => openMainMenu(),
    () => openSettingsModal()
);

// Navigation State Transitions
function openMainMenu() {
    runner.stop();
    closeAllModals();
    mode = 'menu';
    playerRig.animState = 'run';
    document.getElementById('main-menu-overlay').style.display = 'flex';
    document.getElementById('studio-overlay').style.display = 'none';
    document.getElementById('scene-switcher').style.display = 'none';
    document.getElementById('top-hub-bar').style.display = 'none';
    updateTopBarUI(dataManager.state, dataManager.currentUser);
}

function openCharacterEditor() {
    runner.stop();
    closeAllModals();
    mode = 'studio';
    document.getElementById('main-menu-overlay').style.display = 'none';
    document.getElementById('studio-overlay').style.display = 'block';
    document.getElementById('scene-switcher').style.display = 'flex';
    document.getElementById('top-hub-bar').style.display = 'flex';
    updateTopBarUI(dataManager.state, dataManager.currentUser);
}

function enterEndlessMode() {
    studio.saveAllLimbsToProfile();
    document.getElementById('main-menu-overlay').style.display = 'none';
    document.getElementById('studio-overlay').style.display = 'none';
    document.getElementById('scene-switcher').style.display = 'none';
    document.getElementById('top-hub-bar').style.display = 'none';
    closeAllModals();
    mode = 'runner';
    runner.startEndless();
}

// Story Mode Pre-Race Cutscene System
let activeCutsceneRival = null;
let activeCutsceneIndex = 0;

function startStoryCutscene(rivalSpec) {
    studio.saveAllLimbsToProfile();
    closeAllModals();
    document.getElementById('main-menu-overlay').style.display = 'none';
    document.getElementById('studio-overlay').style.display = 'none';
    document.getElementById('scene-switcher').style.display = 'none';
    document.getElementById('top-hub-bar').style.display = 'none';

    activeCutsceneRival = rivalSpec;
    activeCutsceneIndex = 0;
    cutsceneRivalRig.generatePresetTextures(rivalSpec.colors);
    playerRig.animState = 'idle';
    cutsceneRivalRig.animState = 'idle';

    mode = 'cutscene';
    document.getElementById('cutscene-overlay').style.display = 'flex';
    document.getElementById('cutscene-stage-badge').textContent = rivalSpec.stageName.toUpperCase();
    renderCutsceneLine();
}

function renderCutsceneLine() {
    if (!activeCutsceneRival) return;
    const lines = activeCutsceneRival.dialogue || [];
    if (activeCutsceneIndex >= lines.length) {
        launchStoryRaceAfterCutscene();
        return;
    }
    const line = lines[activeCutsceneIndex];
    const speakerEl = document.getElementById('cutscene-speaker');
    speakerEl.textContent = line.speaker;
    speakerEl.style.background = line.side === 'left' ? '#0284c7' : '#e11d48';
    document.getElementById('cutscene-text').textContent = `"${line.text}"`;
    document.getElementById('cutscene-progress').textContent = `Dialogue ${activeCutsceneIndex + 1} / ${lines.length}`;
    document.getElementById('cutscene-next-btn').textContent =
        activeCutsceneIndex === lines.length - 1 ? 'Start Race! 🏁' : 'Next ▸';
}

function launchStoryRaceAfterCutscene() {
    const rival = activeCutsceneRival;
    document.getElementById('cutscene-overlay').style.display = 'none';
    activeCutsceneRival = null;
    mode = 'runner';
    runner.startStoryRace(rival);
}

document.getElementById('cutscene-next-btn').addEventListener('click', () => {
    activeCutsceneIndex++;
    renderCutsceneLine();
});

document.getElementById('cutscene-skip-btn').addEventListener('click', () => {
    launchStoryRaceAfterCutscene();
});

function drawCutsceneCanvas(dt) {
    const cCanvas = document.getElementById('cutscene-canvas');
    if (!cCanvas || !activeCutsceneRival) return;
    const cCtx = cCanvas.getContext('2d');
    const w = cCanvas.width;
    const h = cCanvas.height;
    const floorY = h - 48;

    playerRig.update(dt);
    cutsceneRivalRig.update(dt);

    cCtx.clearRect(0, 0, w, h);

    // Backdrop matches mission environment (School Track for Mission 1, etc.)
    if (activeCutsceneRival.backdrop === 'day') {
        const sky = cCtx.createLinearGradient(0, 0, 0, floorY);
        sky.addColorStop(0, '#38bdf8');
        sky.addColorStop(1, '#e0f2fe');
        cCtx.fillStyle = sky;
        cCtx.fillRect(0, 0, w, floorY);

        // School Building Silhouette & Courtyard Track
        cCtx.fillStyle = '#334155';
        cCtx.fillRect(40, floorY - 120, 260, 120);
        cCtx.fillStyle = '#94a3b8';
        for (let wx = 60; wx < 280; wx += 45) {
            cCtx.fillRect(wx, floorY - 95, 26, 32);
            cCtx.fillRect(wx, floorY - 50, 26, 32);
        }
        cCtx.fillStyle = '#e11d48';
        cCtx.fillRect(0, floorY, w, h - floorY);
    } else if (activeCutsceneRival.backdrop === 'sunset') {
        const sky = cCtx.createLinearGradient(0, 0, 0, floorY);
        sky.addColorStop(0, '#7c2d12');
        sky.addColorStop(0.6, '#f97316');
        sky.addColorStop(1, '#fef08a');
        cCtx.fillStyle = sky;
        cCtx.fillRect(0, 0, w, floorY);
        cCtx.fillStyle = '#1e1b4b';
        cCtx.fillRect(0, floorY, w, h - floorY);
    } else {
        cCtx.fillStyle = '#090d16';
        cCtx.fillRect(0, 0, w, h);
        cCtx.strokeStyle = '#38bdf8';
        cCtx.lineWidth = 3;
        cCtx.beginPath();
        cCtx.moveTo(0, floorY);
        cCtx.lineTo(w, floorY);
        cCtx.stroke();
    }

    const activeLine = (activeCutsceneRival.dialogue || [])[activeCutsceneIndex];
    const leftSpeaking = activeLine?.side === 'left';

    // Draw Player Rig on Left
    cCtx.save();
    cCtx.translate(190, floorY);
    if (leftSpeaking) {
        cCtx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        cCtx.beginPath();
        cCtx.ellipse(0, 0, 55, 14, 0, 0, Math.PI * 2);
        cCtx.fill();
    }
    playerRig.draw(cCtx, 0, -78, leftSpeaking ? 0.58 : 0.52);
    cCtx.restore();

    // VS Badge in Center
    cCtx.save();
    cCtx.fillStyle = '#facc15';
    cCtx.font = '900 28px sans-serif';
    cCtx.textAlign = 'center';
    cCtx.fillText('⚡ VS ⚡', w / 2, floorY - 75);
    cCtx.restore();

    // Draw Challenger Rig on Right (facing left)
    cCtx.save();
    cCtx.translate(w - 190, floorY);
    if (!leftSpeaking) {
        cCtx.fillStyle = 'rgba(244, 63, 94, 0.25)';
        cCtx.beginPath();
        cCtx.ellipse(0, 0, 55, 14, 0, 0, Math.PI * 2);
        cCtx.fill();
    }
    cCtx.scale(-1, 1);
    cutsceneRivalRig.draw(cCtx, 0, -78, !leftSpeaking ? 0.58 : 0.52);
    cCtx.restore();
}

function closeAllModals() {
    ['workshop-modal', 'story-modal', 'leaderboard-modal', 'auth-modal', 'char-vault-modal', 'settings-modal', 'cutscene-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function updateTopBarUI(state, user) {
    document.getElementById('hub-scrap-bank').textContent = `⚙️ ${state.scrap} Scrap`;
    document.getElementById('menu-scrap-status').textContent = `⚙️ ${state.scrap} Nano-Scrap`;

    const loginBtn = document.getElementById('google-login-btn');
    const userPill = document.getElementById('auth-user-pill');
    const userNameEl = document.getElementById('auth-user-name');
    const menuAccountStatus = document.getElementById('menu-account-status');

    if (user) {
        loginBtn.style.display = 'none';
        userPill.style.display = 'flex';
        userNameEl.textContent = `🟢 ${user.name}`;
        menuAccountStatus.textContent = `🟢 Signed in as ${user.name}`;
    } else {
        loginBtn.style.display = 'flex';
        userPill.style.display = 'none';
        menuAccountStatus.textContent = 'Playing as Guest Husser';
    }
}

// Workshop Modal
function openWorkshopModal() {
    closeAllModals();
    const modal = document.getElementById('workshop-modal');
    const grid = document.getElementById('workshop-items-grid');
    document.getElementById('workshop-scrap-count').textContent = `⚙️ ${dataManager.state.scrap}`;
    grid.innerHTML = '';

    Object.entries(WORKSHOP_SPECS).forEach(([key, spec]) => {
        const lvl = dataManager.state.upgrades[key] || 1;
        const cost = dataManager.getUpgradeCost(key);

        const tierCycle = ((lvl - 1) % 10) + 1;
        let pipsHtml = '';
        for (let i = 1; i <= 10; i++) {
            pipsHtml += `<div class="pip ${i <= tierCycle ? 'filled' : ''}"></div>`;
        }

        const card = document.createElement('div');
        card.className = 'workshop-card';
        card.innerHTML = `
            <div>
                <h3>${spec.name}</h3>
                <p style="margin: 6px 0;">${spec.desc}</p>
            </div>
            <div>
                <div style="font-size: 0.82rem; color: #38bdf8; margin-bottom: 4px; font-weight: 700;">
                    Level ${lvl} (Tier ${Math.floor((lvl - 1) / 10) + 1} • Limitless ∞)
                </div>
                <div class="level-pips">${pipsHtml}</div>
            </div>
            <button type="button" class="primary-btn" ${dataManager.state.scrap < cost ? 'disabled' : ''}>
                Upgrade to Lv.${lvl + 1} (⚙️ ${cost.toLocaleString()})
            </button>
        `;

        card.querySelector('button').addEventListener('click', () => {
            if (dataManager.buyUpgrade(key)) {
                openWorkshopModal();
            }
        });
        grid.appendChild(card);
    });

    modal.style.display = 'flex';
}

// Story Mode Selector (Launches Cutscene before Race!)
function openStoryModal() {
    closeAllModals();
    const modal = document.getElementById('story-modal');
    const list = document.getElementById('story-rivals-list');
    list.innerHTML = '';

    STORY_RIVALS.forEach((rival) => {
        const isCleared = dataManager.state.clearedRivals.includes(rival.id);
        const card = document.createElement('div');
        card.className = `story-card ${isCleared ? 'cleared' : ''}`;
        card.innerHTML = `
            <div class="story-info">
                <h3>${rival.stageName} — <span style="color: #38bdf8;">${rival.name}</span> ${isCleared ? '✅' : ''}</h3>
                <p>${rival.desc}</p>
                <p style="color: #c084fc; font-weight: 700;">Bounty: ⚙️ +${rival.rewardScrap} Nano-Scrap • Challenger Speed: ~${Math.round(rival.baseSpeed / 10)} m/s</p>
            </div>
            <button type="button" class="primary-btn">🎬 Play Mission (${rival.distanceMeters}m)</button>
        `;
        card.querySelector('button').addEventListener('click', () => startStoryCutscene(rival));
        list.appendChild(card);
    });

    modal.style.display = 'flex';
}

// "Top Hussers" Leaderboard Modal (Includes Top Score, Distance, and Peak Speed Achieved)
async function openLeaderboardModal() {
    closeAllModals();
    const modal = document.getElementById('leaderboard-modal');
    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = '<tr><td colspan="5">Loading Top Hussers from database...</td></tr>';
    modal.style.display = 'flex';

    const board = await dataManager.getLeaderboard();
    tbody.innerHTML = '';

    if (!board || board.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #94a3b8; padding: 18px;">
                    No Top Hussers recorded yet! Complete an Endless Sprint or Story Mission to claim #1.
                </td>
            </tr>
        `;
        return;
    }

    board.forEach((entry, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${idx + 1}</strong></td>
            <td>${entry.name}</td>
            <td><strong style="color: #38bdf8;">${Number(entry.score).toLocaleString()} pts</strong></td>
            <td>${Number(entry.distance).toLocaleString()} m</td>
            <td><strong style="color: #facc15;">${entry.speed} m/s</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function syncTrailInputsUI() {
    const s = dataManager.state.settings || {};
    const color = s.trailColor || '#38bdf8';
    const rainbow = Boolean(s.trailRainbow);
    const setCol = document.getElementById('setting-trail-color');
    const setRain = document.getElementById('setting-trail-rainbow');
    const stuCol = document.getElementById('studio-trail-color');
    const stuRain = document.getElementById('studio-trail-rainbow');
    if (setCol) setCol.value = color;
    if (setRain) setRain.checked = rainbow;
    if (stuCol) stuCol.value = color;
    if (stuRain) stuRain.checked = rainbow;
}

// Settings Modal
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const s = dataManager.state.settings || {
        screenShake: true,
        particles: true,
        alertOpacity: 92,
        trailColor: '#38bdf8',
        trailRainbow: false
    };
    document.getElementById('setting-shake').checked = s.screenShake !== false;
    document.getElementById('setting-particles').checked = s.particles !== false;
    document.getElementById('setting-alert-opacity').value = s.alertOpacity ?? 92;
    syncTrailInputsUI();
    modal.style.display = 'flex';
}

document.getElementById('setting-shake').addEventListener('change', (e) => {
    dataManager.state.settings.screenShake = e.target.checked;
    dataManager.saveToStorage();
});
document.getElementById('setting-particles').addEventListener('change', (e) => {
    dataManager.state.settings.particles = e.target.checked;
    dataManager.saveToStorage();
});
document.getElementById('setting-alert-opacity').addEventListener('input', (e) => {
    dataManager.state.settings.alertOpacity = Number(e.target.value);
    dataManager.saveToStorage();
});
document.getElementById('setting-trail-color').addEventListener('input', (e) => {
    dataManager.state.settings.trailColor = e.target.value;
    syncTrailInputsUI();
    dataManager.saveToStorage();
});
document.getElementById('setting-trail-rainbow').addEventListener('change', (e) => {
    dataManager.state.settings.trailRainbow = e.target.checked;
    syncTrailInputsUI();
    dataManager.saveToStorage();
});
document.getElementById('studio-trail-color').addEventListener('input', (e) => {
    dataManager.state.settings.trailColor = e.target.value;
    syncTrailInputsUI();
    dataManager.saveToStorage();
});
document.getElementById('studio-trail-rainbow').addEventListener('change', (e) => {
    dataManager.state.settings.trailRainbow = e.target.checked;
    syncTrailInputsUI();
    dataManager.saveToStorage();
});
syncTrailInputsUI();

// Character Vault Modal
async function openCharVaultModal() {
    closeAllModals();
    const modal = document.getElementById('char-vault-modal');
    const list = document.getElementById('vault-slots-list');
    list.innerHTML = '<div style="color: #94a3b8; font-size: 0.85rem;">Loading saved Hussers from database...</div>';
    modal.style.display = 'flex';

    const slots = await dataManager.getVaultCharacters();
    list.innerHTML = '';

    if (!slots || slots.length === 0) {
        list.innerHTML = `
            <div style="color: #94a3b8; font-size: 0.85rem; padding: 12px; background: #1e293b; border-radius: 8px;">
                No saved characters in your Vault yet. Type a name above and click <strong>"💾 Save Current to Vault"</strong>!
            </div>
        `;
        return;
    }

    slots.forEach((slot) => {
        const card = document.createElement('div');
        card.className = 'story-card';
        const dateStr = new Date((slot.updated_at > 1e11 ? slot.updated_at : slot.updated_at * 1000)).toLocaleString();
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${slot.limbs?.head || ''}" alt="Head" style="width: 44px; height: 44px; background: #fff; border-radius: 6px; border: 1px solid #38bdf8; object-fit: contain;">
                <div class="story-info">
                    <h3>${slot.char_name}</h3>
                    <p>Owner: ${slot.owner_email} • Saved: ${dateStr}</p>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="primary-btn load-slot-btn">📂 Load</button>
                <button type="button" class="delete-slot-btn" style="background: #ef4444; border-color: #ef4444;">🗑️</button>
            </div>
        `;

        card.querySelector('.load-slot-btn').addEventListener('click', () => {
            if (slot.limbs) {
                dataManager.state.limbs = { ...slot.limbs };
                dataManager.saveToStorage();
                studio.restoreSavedLimbsToHistory();
                closeAllModals();
            }
        });

        card.querySelector('.delete-slot-btn').addEventListener('click', async () => {
            await dataManager.deleteVaultCharacter(slot.id);
            openCharVaultModal();
        });

        list.appendChild(card);
    });
}

// Bind Character Vault Buttons
document.getElementById('load-char-btn').addEventListener('click', openCharVaultModal);

document.getElementById('vault-save-slot-btn').addEventListener('click', async () => {
    studio.saveAllLimbsToProfile();
    const nameInput = document.getElementById('vault-char-name');
    const charName = nameInput.value.trim() || `Husser-${Math.floor(Math.random() * 900 + 100)}`;
    await dataManager.saveCharacterToVault(charName);
    nameInput.value = '';
    openCharVaultModal();
});

document.getElementById('vault-export-file-btn').addEventListener('click', () => {
    studio.saveAllLimbsToProfile();
    const nameInput = document.getElementById('vault-char-name');
    const charName = (nameInput.value.trim() || 'custom_husser').replace(/[^a-z0-9_-]/gi, '_');
    const payload = JSON.stringify({
        name: charName,
        exportedAt: new Date().toISOString(),
        limbs: dataManager.state.limbs
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${charName}.hussr.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('vault-import-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const parsed = JSON.parse(ev.target.result);
            if (parsed && parsed.limbs) {
                dataManager.state.limbs = { ...parsed.limbs };
                dataManager.saveToStorage();
                studio.restoreSavedLimbsToHistory();
                await dataManager.saveCharacterToVault(parsed.name || 'Imported Husser');
                openCharVaultModal();
            }
        } catch {
            alert('Invalid .hussr.json character file.');
        }
    };
    reader.readAsText(file);
});

// Main Menu & Hub Bar Button Bindings
document.getElementById('menu-story-btn').addEventListener('click', openStoryModal);
document.getElementById('menu-endless-btn').addEventListener('click', enterEndlessMode);
document.getElementById('menu-editor-btn').addEventListener('click', openCharacterEditor);
document.getElementById('menu-workshop-btn').addEventListener('click', openWorkshopModal);
document.getElementById('menu-leaderboard-btn').addEventListener('click', openLeaderboardModal);
document.getElementById('menu-settings-btn').addEventListener('click', openSettingsModal);
document.getElementById('menu-account-btn').addEventListener('click', () => {
    closeAllModals();
    document.getElementById('auth-modal').style.display = 'flex';
});

document.getElementById('hub-main-menu-btn').addEventListener('click', openMainMenu);
document.getElementById('open-workshop-btn').addEventListener('click', openWorkshopModal);
document.getElementById('open-story-btn').addEventListener('click', openStoryModal);
document.getElementById('open-leaderboard-btn').addEventListener('click', openLeaderboardModal);
document.getElementById('open-settings-btn').addEventListener('click', openSettingsModal);
document.getElementById('start-endless-btn').addEventListener('click', enterEndlessMode);

// Auth Modal Bindings
let authMode = 'login';
const authLoginTab = document.getElementById('auth-mode-login');
const authSignupTab = document.getElementById('auth-mode-signup');
const authNameWrap = document.getElementById('auth-name-wrap');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authErrorEl = document.getElementById('auth-error-msg');

function setAuthMode(newMode) {
    authMode = newMode;
    authErrorEl.style.display = 'none';
    if (authMode === 'signup') {
        authSignupTab.classList.add('primary-btn');
        authLoginTab.classList.remove('primary-btn');
        authNameWrap.style.display = 'flex';
        authSubmitBtn.textContent = 'Create Database Account';
    } else {
        authLoginTab.classList.add('primary-btn');
        authSignupTab.classList.remove('primary-btn');
        authNameWrap.style.display = 'none';
        authSubmitBtn.textContent = 'Sign In to Database';
    }
}

authLoginTab.addEventListener('click', () => setAuthMode('login'));
authSignupTab.addEventListener('click', () => setAuthMode('signup'));

document.getElementById('google-login-btn').addEventListener('click', () => {
    closeAllModals();
    authErrorEl.style.display = 'none';
    document.getElementById('auth-modal').style.display = 'flex';
});

document.getElementById('real-google-oauth-btn').addEventListener('click', () => {
    const launched = dataManager.triggerGoogleOAuthPopup();
    if (!launched) {
        authErrorEl.textContent = 'To use the live Google OAuth popup, paste a Google OAuth Client ID below, or use the Database Sign Up / Login form right below!';
        authErrorEl.style.display = 'block';
    }
});

document.getElementById('save-client-id-btn').addEventListener('click', () => {
    const cid = document.getElementById('google-client-id-input').value.trim();
    localStorage.setItem('hussr_google_client_id', cid);
    dataManager.initGoogleAuth();
    authErrorEl.style.color = '#4ade80';
    authErrorEl.textContent = '✓ Google OAuth Client ID saved!';
    authErrorEl.style.display = 'block';
});

document.getElementById('google-logout-btn').addEventListener('click', () => {
    dataManager.signOut();
    studio.restoreSavedLimbsToHistory();
});

document.getElementById('google-auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    authErrorEl.style.display = 'none';
    const email = document.getElementById('auth-email-input').value.trim();
    const name = document.getElementById('auth-name-input').value.trim() || email.split('@')[0];
    const password = document.getElementById('auth-password-input').value;

    try {
        if (authMode === 'signup') {
            await dataManager.registerDatabaseAccount(email, name, password);
        } else {
            await dataManager.loginDatabaseAccount(email, password);
        }
        studio.restoreSavedLimbsToHistory();
        closeAllModals();
    } catch (err) {
        authErrorEl.style.color = '#ef4444';
        authErrorEl.textContent = err.message || 'Authentication failed.';
        authErrorEl.style.display = 'block';
    }
});

document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.close).style.display = 'none';
    });
});

document.querySelectorAll('.anim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.anim-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playerRig.animState = btn.dataset.anim;
    });
});

document.querySelectorAll('.bg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentBg = btn.dataset.bg;
    });
});

// Ensure first-time players see a cool preset on the Main Menu if they haven't drawn yet
if (!Object.values(dataManager.state.limbs || {}).some(Boolean)) {
    const generated = playerRig.generatePresetTextures();
    Object.entries(generated).forEach(([part, url]) => dataManager.saveLimb(part, url));
    studio.restoreSavedLimbsToHistory();
}

updateTopBarUI(dataManager.state, dataManager.currentUser);

function drawPreviewStage(ctx, centerX, floorY, dt) {
    const stageW = Math.min(680, canvas.width - 480);
    const stageH = 460;
    const stageX = centerX - stageW / 2;
    const stageY = floorY - 310;

    const speeds = { idle: 0, run: 260, air: 420, curl: 440, sonic: 950 };
    const speed = speeds[playerRig.animState] ?? 260;
    scrollOffset = (scrollOffset + speed * dt) % 120;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(stageX, stageY, stageW, stageH, 18);
    ctx.clip();

    if (currentBg === 'day') {
        const sky = ctx.createLinearGradient(0, stageY, 0, floorY);
        sky.addColorStop(0, '#38bdf8');
        sky.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = sky;
        ctx.fillRect(stageX, stageY, stageW, floorY - stageY);

        ctx.fillStyle = '#4ade80';
        ctx.fillRect(stageX, floorY - 22, stageW, 22);

        ctx.fillStyle = '#e11d48';
        ctx.fillRect(stageX, floorY, stageW, stageY + stageH - floorY);

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

        ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
        ctx.beginPath();
        ctx.arc(centerX, floorY - 90, 65, 0, Math.PI * 2);
        ctx.fill();

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

    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(centerX, floorY + 6, 48, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Live Dash Trail Afterimage Preview inside the Character Editor!
    if (playerRig.animState !== 'idle') {
        const s = dataManager.state.settings || {};
        const trailColor = s.trailColor || '#38bdf8';
        const isRainbow = Boolean(s.trailRainbow);
        const rainbowPalette = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#a855f7', '#ec4899'];
        for (let i = 3; i >= 1; i--) {
            const tintHex = isRainbow
                ? rainbowPalette[(Math.floor(performance.now() / 70) + i) % rainbowPalette.length]
                : trailColor;
            ctx.save();
            ctx.globalAlpha = (4 - i) * 0.14;
            playerRig.draw(ctx, centerX - i * 28, floorY - 95, 0.65, tintHex);
            ctx.restore();
        }
    }

    playerRig.draw(ctx, centerX, floorY - 95);
    ctx.restore();

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

    if (mode === 'menu' || mode === 'studio') {
        const previewX = Math.max(660, canvas.width * 0.66);
        const floorY = canvas.height * 0.64;
        playerRig.update(dt);
        drawPreviewStage(ctx, previewX, floorY, dt);
    } else if (mode === 'cutscene') {
        drawCutsceneCanvas(dt);
    } else {
        runner.update(dt);
        runner.draw(ctx, canvas.width, canvas.height);
    }

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);