import { HusserRig } from './rig.js';
import { LimbStudio } from './studio.js';
import { EndlessRunner } from './runner.js';
import { DataManager, STORY_RIVALS, WORKSHOP_SPECS } from './storage.js';
import { SoundManager } from './audio.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const isMobile = window.matchMedia('(pointer: coarse), (max-width: 960px)').matches;
    const invBrowserZoom = (!isMobile && window.outerWidth > 100 && window.innerWidth > window.outerWidth * 1.03)
        ? Math.max(1, Math.min(5, window.innerWidth / window.outerWidth))
        : 1;

    const uiOverlays = document.querySelectorAll('#hud-overlay, .modal-overlay, #story-screen, #main-menu-overlay');
    uiOverlays.forEach((el) => {
        if (invBrowserZoom > 1.03) {
            el.style.transformOrigin = 'top left';
            el.style.transform = `scale(${invBrowserZoom})`;
            el.style.width = `${100 / invBrowserZoom}vw`;
            el.style.height = `${100 / invBrowserZoom}dvh`;
            el.style.right = 'auto';
            el.style.bottom = 'auto';
        } else {
            el.style.transformOrigin = '';
            el.style.transform = '';
            el.style.width = '';
            el.style.height = '';
            el.style.right = '';
            el.style.bottom = '';
        }
    });

    document.querySelectorAll('.modal-card, .story-screen-container').forEach((card) => {
        card.style.maxHeight = invBrowserZoom > 1.03 ? '88%' : '';
    });
}
window.addEventListener('resize', resize);
window.visualViewport?.addEventListener('resize', resize);
resize();

const playerRig = new HusserRig();
const cutsceneRivalRig = new HusserRig();
const showcasePreviewRig = new HusserRig();
const bgDemoRivalRig = new HusserRig();
bgDemoRivalRig.generatePresetTextures(STORY_RIVALS[4].colors);

let currentBg = 'day';
let scrollOffset = 0;
let menuBgScroll = 0;
let mode = 'menu'; // 'menu', 'studio', 'cutscene', or 'runner'
let selectedStoryRival = STORY_RIVALS[0];

let lastActiveUserEmail = null;
let lastLimbsSignature = '';
const dataManager = new DataManager((state, user) => {
    updateTopBarUI(state, user);
    const curEmail = user?.email ? user.email.toLowerCase() : 'guest';
    const limbsSig = JSON.stringify(state?.limbs || {});
    if (typeof studio !== 'undefined' && (curEmail !== lastActiveUserEmail || limbsSig !== lastLimbsSignature)) {
        lastActiveUserEmail = curEmail;
        lastLimbsSignature = limbsSig;
        studio.restoreSavedLimbsToHistory();
    }
});

const soundManager = new SoundManager(dataManager);

// Global UI button click sound
document.addEventListener('click', (e) => {
    if (e.target.closest('button')) {
        soundManager.playSfx('ui_click', 1.0, 0.75);
    }
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
    () => openSettingsModal(),
    soundManager
);

// Navigation State Transitions
function openMainMenu() {
    runner.stop();
    closeAllModals();
    mode = 'menu';
    menuVaultLoaded = false;
    playerRig.animState = 'sonic';
    bgDemoRivalRig.animState = 'run';
    soundManager.setMusicMode('menu');
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
    playerRig.animState = 'run';
    soundManager.setMusicMode('menu');
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
    soundManager.setMusicMode('game');
    runner.startEndless();
}

function enterSandboxMode() {
    studio.saveAllLimbsToProfile();
    document.getElementById('main-menu-overlay').style.display = 'none';
    document.getElementById('studio-overlay').style.display = 'none';
    document.getElementById('scene-switcher').style.display = 'none';
    document.getElementById('top-hub-bar').style.display = 'none';
    closeAllModals();
    mode = 'runner';
    soundManager.setMusicMode('game');
    runner.startSandbox();
}

// Story Mode Pre-Race Cutscene System
let activeCutsceneRival = null;
let activeCutsceneIndex = 0;
let activeRivalAvatarUrl = '';

function startStoryCutscene(rivalSpec) {
    studio.saveAllLimbsToProfile();
    closeAllModals();
    document.getElementById('main-menu-overlay').style.display = 'none';
    document.getElementById('studio-overlay').style.display = 'none';
    document.getElementById('scene-switcher').style.display = 'none';
    document.getElementById('top-hub-bar').style.display = 'none';

    activeCutsceneRival = rivalSpec;
    activeCutsceneIndex = 0;
    activeRivalAvatarUrl = HusserRig.generateRivalAvatar(rivalSpec.colors);
    cutsceneRivalRig.generatePresetTextures(rivalSpec.colors);
    playerRig.animState = 'idle';
    cutsceneRivalRig.animState = 'idle';

    mode = 'cutscene';
    soundManager.setMusicMode('menu');
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
    const avatarEl = document.getElementById('cutscene-speaker-avatar');

    speakerEl.textContent = line.speaker;
    speakerEl.style.background = line.side === 'left' ? '#0284c7' : '#e11d48';

    if (avatarEl) {
        if (line.side === 'left') {
            const playerHead = dataManager.state.limbs?.head;
            avatarEl.src = playerHead || dataManager.currentUser?.picture || dataManager.generateFallbackAvatar('You');
        } else {
            avatarEl.src = activeRivalAvatarUrl;
        }
    }

    document.getElementById('cutscene-text').textContent = `"${line.text}"`;
    document.getElementById('cutscene-progress').textContent = `Dialogue ${activeCutsceneIndex + 1} / ${lines.length}`;
    document.getElementById('cutscene-next-btn').textContent =
        activeCutsceneIndex === lines.length - 1 ? 'Start Race' : 'Next';
}

function launchStoryRaceAfterCutscene() {
    const rival = activeCutsceneRival;
    document.getElementById('cutscene-overlay').style.display = 'none';
    activeCutsceneRival = null;
    mode = 'runner';
    soundManager.setMusicMode('game');
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

    if (activeCutsceneRival.backdrop === 'day') {
        const sky = cCtx.createLinearGradient(0, 0, 0, floorY);
        sky.addColorStop(0, '#38bdf8');
        sky.addColorStop(1, '#e0f2fe');
        cCtx.fillStyle = sky;
        cCtx.fillRect(0, 0, w, floorY);

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

    cCtx.save();
    cCtx.fillStyle = '#facc15';
    cCtx.font = '900 26px sans-serif';
    cCtx.textAlign = 'center';
    cCtx.fillText('VS', w / 2, floorY - 75);
    cCtx.restore();

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
    [
        'workshop-modal',
        'story-screen',
        'leaderboard-modal',
        'profile-modal',
        'auth-modal',
        'char-vault-modal',
        'settings-modal',
        'cutscene-overlay',
        'pdn-color-dock'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 'pdn-color-dock') el.classList.remove('open');
        else el.style.display = 'none';
    });
}

function updateTopBarUI(state, user) {
    const hubScrapEl = document.getElementById('hub-scrap-bank');
    if (hubScrapEl) hubScrapEl.textContent = `⚙️ ${state.scrap} Scrap`;
    document.getElementById('menu-scrap-status').textContent = `⚙️ ${state.scrap} Nano-Scrap`;
    const storyScrapEl = document.getElementById('story-scrap-Banner');
    if (storyScrapEl) storyScrapEl.textContent = `⚙️ ${state.scrap} Scrap`;

    const loginBtn = document.getElementById('google-login-btn');
    const userPill = document.getElementById('auth-user-pill');
    const userNameEl = document.getElementById('auth-user-name');
    const menuAccountStatus = document.getElementById('menu-account-status');

    if (user) {
        const pfpUrl = user.picture || dataManager.generateFallbackAvatar(user.name);
        if (loginBtn) loginBtn.style.display = 'none';
        if (userPill) userPill.style.display = 'flex';
        if (userNameEl) userNameEl.innerHTML = `<img src="${pfpUrl}" class="hub-pfp" referrerpolicy="no-referrer" alt="PFP" style="vertical-align: middle; margin-right: 6px;">${user.name}`;
        menuAccountStatus.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 6px;"><img src="${pfpUrl}" class="hub-pfp" referrerpolicy="no-referrer" alt="PFP"> Signed in as <strong>${user.name}</strong></span>`;
    } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (userPill) userPill.style.display = 'none';
        menuAccountStatus.textContent = 'Playing as Guest Husser';
    }
}

// Workshop Modal
function openWorkshopModal() {
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

// Full-Screen Story Campaign Screen (`#story-screen`)
function selectStoryMissionBriefing(rival, idx) {
    selectedStoryRival = rival;
    const avatarUrl = HusserRig.generateRivalAvatar(rival.colors);
    document.getElementById('briefing-avatar').src = avatarUrl;
    document.getElementById('briefing-stage').textContent = `MISSION ${idx + 1}`;
    document.getElementById('briefing-name').textContent = rival.name;
    document.getElementById('briefing-specs').textContent = rival.title || rival.stageName;
    document.getElementById('briefing-desc').textContent = rival.desc;
    document.getElementById('briefing-dist').textContent = `${rival.distanceMeters} m`;
    document.getElementById('briefing-speed').textContent = `~${Math.round(rival.baseSpeed / 10)} m/s`;
    document.getElementById('briefing-reward').textContent = `⚙️ +${rival.rewardScrap}`;
}

function openStoryModal() {
    closeAllModals();
    const screen = document.getElementById('story-screen');
    const list = document.getElementById('story-rivals-list');
    document.getElementById('story-scrap-Banner').textContent = `⚙️ ${dataManager.state.scrap} Scrap`;
    list.innerHTML = '';

    STORY_RIVALS.forEach((rival, idx) => {
        const isCleared = dataManager.state.clearedRivals.includes(rival.id);
        const avatarUrl = HusserRig.generateRivalAvatar(rival.colors);
        const card = document.createElement('div');
        card.className = `story-node-card ${isCleared ? 'cleared' : ''} ${selectedStoryRival?.id === rival.id ? 'selected' : ''}`;
        card.innerHTML = `
            <img src="${avatarUrl}" alt="${rival.name}" class="node-avatar">
            <div class="story-info" style="flex: 1;">
                <h3>${rival.stageName} ${isCleared ? '✓' : ''}</h3>
                <p style="color: #38bdf8; font-weight: 700;">${rival.name} — ${rival.title || 'Challenger'}</p>
                <p>Speed: ~${Math.round(rival.baseSpeed / 10)} m/s • Bounty: ⚙️ +${rival.rewardScrap}</p>
            </div>
        `;
        card.addEventListener('click', () => {
            document.querySelectorAll('.story-node-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectStoryMissionBriefing(rival, idx);
        });
        list.appendChild(card);
    });

    const initialIdx = Math.max(0, STORY_RIVALS.findIndex(r => r.id === selectedStoryRival?.id));
    selectStoryMissionBriefing(STORY_RIVALS[initialIdx], initialIdx);
    screen.style.display = 'flex';
}

document.getElementById('briefing-launch-btn').addEventListener('click', () => {
    if (selectedStoryRival) startStoryCutscene(selectedStoryRival);
});
document.getElementById('story-open-workshop-btn').addEventListener('click', openWorkshopModal);
document.getElementById('story-back-menu-btn').addEventListener('click', () => {
    document.getElementById('story-screen').style.display = 'none';
});

// Top Hussers Leaderboard Modal (Click Any Row to Inspect Profile & UGC)
async function openLeaderboardModal() {
    closeAllModals();
    const modal = document.getElementById('leaderboard-modal');
    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = '<tr><td colspan="6">Loading Top Hussers from database...</td></tr>';
    modal.style.display = 'flex';

    const board = await dataManager.getLeaderboard();
    tbody.innerHTML = '';

    if (!board || board.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 18px;">
                    No Top Hussers recorded yet! Complete an Endless Sprint or Story Mission to claim #1.
                </td>
            </tr>
        `;
        return;
    }

    board.forEach((entry, idx) => {
        const cleanName = (entry.name || 'Guest Husser').replace(/\s*\([^)]*@[^)]*\)\s*$/, '').trim();
        const fallbackAvatar = dataManager.generateFallbackAvatar(cleanName);
        const avatarSrc = entry.picture || fallbackAvatar;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${idx + 1}</strong></td>
            <td>
                <div class="lb-husser-cell">
                    <img src="${avatarSrc}" alt="" class="lb-pfp" referrerpolicy="no-referrer">
                    <span class="lb-name-text"></span>
                </div>
            </td>
            <td><strong style="color: #38bdf8;">${Number(entry.score).toLocaleString()} pts</strong></td>
            <td>${Number(entry.distance).toLocaleString()} m</td>
            <td><strong style="color: #facc15;">${entry.speed} m/s</strong></td>
            <td><button type="button" class="view-prof-btn">View Profile</button></td>
        `;
        tr.querySelector('.lb-name-text').textContent = cleanName;
        const imgEl = tr.querySelector('.lb-pfp');
        imgEl.addEventListener('error', () => { imgEl.src = fallbackAvatar; }, { once: true });

        tr.addEventListener('click', () => openProfileModal(cleanName));
        tbody.appendChild(tr);
    });
}

// Player Profile & Community UGC Showcase Modal
async function openProfileModal(targetPlayerName = null) {
    closeAllModals();
    const modal = document.getElementById('profile-modal');
    const ugcGrid = document.getElementById('showcase-ugc-grid');
    ugcGrid.innerHTML = '<div style="color: #94a3b8; font-size: 0.85rem;">Loading Showcase Characters...</div>';
    modal.style.display = 'flex';

    let profileData = null;
    if (targetPlayerName) {
        profileData = await dataManager.getPlayerPublicProfile(targetPlayerName);
    }

    if (!profileData) {
        const u = dataManager.currentUser;
        const s = dataManager.state;
        const dispName = targetPlayerName || (u ? u.name : 'Guest Husser');
        profileData = {
            name: dispName,
            picture: u?.picture || dataManager.generateFallbackAvatar(dispName),
            bestScore: s.bestScore || 0,
            bestSpeed: s.bestSpeed || 0,
            bestDistance: s.bestDistance || 0,
            scrap: s.scrap || 0,
            upgrades: s.upgrades || { engine: 1, fuel: 1, traction: 1 },
            clearedRivalsCount: (s.clearedRivals || []).length,
            limbs: s.limbs
        };
    }

    const fallbackPic = dataManager.generateFallbackAvatar(profileData.name);
    const pfpEl = document.getElementById('showcase-profile-pfp');
    pfpEl.src = profileData.picture || fallbackPic;
    pfpEl.onerror = () => { pfpEl.src = fallbackPic; };

    document.getElementById('showcase-profile-name').textContent = profileData.name;
    const u = profileData.upgrades || { engine: 1, fuel: 1, traction: 1 };
    document.getElementById('showcase-profile-sub').textContent =
        `Engine Lv.${u.engine} • Stamina Lv.${u.fuel} • Traction Lv.${u.traction} • ${profileData.clearedRivalsCount || 0}/8 Rivals Defeated`;

    document.getElementById('showcase-career-stats').innerHTML = `
        <div class="stat-tile"><span>BEST SCORE</span><strong>${Number(profileData.bestScore || 0).toLocaleString()}</strong></div>
        <div class="stat-tile"><span>PEAK SPEED</span><strong>${profileData.bestSpeed || 0} m/s</strong></div>
        <div class="stat-tile"><span>BEST DISTANCE</span><strong>${Number(profileData.bestDistance || 0).toLocaleString()} m</strong></div>
        <div class="stat-tile"><span>NANO-SCRAP</span><strong>⚙️ ${Number(profileData.scrap || 0).toLocaleString()}</strong></div>
    `;

    // Render Player's Husser Rig Preview
    if (profileData.limbs && Object.values(profileData.limbs).some(Boolean)) {
        showcasePreviewRig.loadFromLimbMap(profileData.limbs, () => renderShowcaseRigCanvas());
    } else {
        showcasePreviewRig.generatePresetTextures();
        renderShowcaseRigCanvas();
    }

    const isOwnProfile = !targetPlayerName ||
        (dataManager.currentUser && dataManager.currentUser.name.toLowerCase() === profileData.name.toLowerCase());

    const publishBtn = document.getElementById('showcase-publish-current-btn');
    if (publishBtn) {
        publishBtn.style.display = isOwnProfile ? 'inline-block' : 'none';
    }

    let showcasedChars = profileData.characters || [];
    if (isOwnProfile && (!targetPlayerName || showcasedChars.length === 0)) {
        const myVault = await dataManager.getVaultCharacters();
        const myName = (dataManager.currentUser?.name || 'Guest Husser').toLowerCase();
        showcasedChars = (myVault || []).filter(c =>
            Boolean(c.is_public) &&
            (!dataManager.currentUser || !c.owner_name || c.owner_name.toLowerCase() === myName)
        );
    }

    ugcGrid.innerHTML = '';
    if (showcasedChars.length === 0) {
        ugcGrid.innerHTML = `
            <div style="grid-column: 1 / -1; color: #94a3b8; font-size: 0.85rem; padding: 14px; background: #1e293b; border-radius: 8px;">
                ${isOwnProfile
            ? 'No characters selected for your Showcase yet. Click <strong>"Publish Current Husser to Showcase"</strong> above or toggle <strong>"Showcase"</strong> on any character inside your Character Vault!'
            : `${profileData.name} hasn't selected any characters to display on their public Showcase yet.`}
            </div>
        `;
        return;
    }

    showcasedChars.forEach((slot) => {
        const card = document.createElement('div');
        card.className = 'ugc-card';
        card.innerHTML = `
            <div class="ugc-card-top">
                <img src="${slot.limbs?.head || ''}" alt="Head" class="ugc-preview-box">
                <div style="overflow: hidden; flex: 1;">
                    <h4 style="color: #f8fafc; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${slot.char_name}</h4>
                    <p style="color: #94a3b8; font-size: 0.74rem;">By ${slot.owner_name || profileData.name}</p>
                </div>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 4px;">
                <button type="button" class="primary-btn ugc-equip-btn" style="flex: 1; padding: 5px 8px; font-size: 0.75rem;">Equip</button>
                <button type="button" class="ugc-dl-btn" style="padding: 5px 8px; font-size: 0.75rem;">.json</button>
                ${isOwnProfile ? '<button type="button" class="ugc-hide-btn" style="padding: 5px 8px; font-size: 0.75rem; background: #334155;">Hide</button>' : ''}
            </div>
        `;

        card.querySelector('.ugc-equip-btn').addEventListener('click', () => {
            if (slot.limbs) {
                dataManager.state.limbs = { ...slot.limbs };
                dataManager.saveToStorage();
                studio.restoreSavedLimbsToHistory();
                closeAllModals();
            }
        });

        card.querySelector('.ugc-dl-btn').addEventListener('click', () => {
            const safeName = (slot.char_name || 'husser').replace(/[^a-z0-9_-]/gi, '_');
            const payload = JSON.stringify({
                name: slot.char_name,
                creator: slot.owner_name || profileData.name,
                exportedAt: new Date().toISOString(),
                limbs: slot.limbs
            }, null, 2);
            const blob = new Blob([payload], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeName}.hussr.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        card.querySelector('.ugc-hide-btn')?.addEventListener('click', async () => {
            await dataManager.toggleCharacterShowcase(slot.id, false);
            openProfileModal(targetPlayerName);
        });

        ugcGrid.appendChild(card);
    });
}

function renderShowcaseRigCanvas() {
    const c = document.getElementById('showcase-rig-canvas');
    if (!c) return;
    const cctx = c.getContext('2d');
    cctx.clearRect(0, 0, c.width, c.height);
    showcasePreviewRig.animState = 'run';
    showcasePreviewRig.draw(cctx, 65, 72, 0.42);
}

document.getElementById('showcase-publish-current-btn').addEventListener('click', async () => {
    studio.saveAllLimbsToProfile();
    const u = dataManager.currentUser;
    const defaultName = u ? `${u.name}'s Husser` : `Husser-${Math.floor(Math.random() * 900 + 100)}`;
    const customName = prompt('Name your Husser for the Public Showcase:', defaultName);
    if (!customName) return;
    await dataManager.saveCharacterToVault(customName.trim(), true);
    openProfileModal(u ? u.name : null);
});

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
    const s = dataManager.state.settings || {};
    document.getElementById('setting-music-vol').value = s.musicVolume ?? 60;
    document.getElementById('setting-sfx-vol').value = s.sfxVolume ?? 80;
    document.getElementById('setting-shake').checked = s.screenShake !== false;
    document.getElementById('setting-particles').checked = s.particles !== false;
    const vaporEl = document.getElementById('setting-vapor');
    if (vaporEl) vaporEl.checked = s.vaporEffects !== false;
    const obsBreakEl = document.getElementById('setting-obstacle-break');
    if (obsBreakEl) obsBreakEl.checked = s.obstacleBreak !== false;
    const stretchEl = document.getElementById('setting-char-stretch');
    if (stretchEl) {
        stretchEl.value = s.charStretch === false ? 0 : (typeof s.charStretch === 'number' ? s.charStretch : 100);
    }
    const skyEl = document.getElementById('setting-tier-sky');
    if (skyEl) skyEl.checked = s.tierSkyColor !== false;
    document.getElementById('setting-alert-opacity').value = s.alertOpacity ?? 92;
    syncTrailInputsUI();
    modal.style.display = 'flex';
}

document.getElementById('setting-music-vol').addEventListener('input', (e) => {
    dataManager.state.settings.musicVolume = Number(e.target.value);
    soundManager.applyMusicVolume();
    dataManager.saveToStorage();
});
document.getElementById('setting-sfx-vol').addEventListener('input', (e) => {
    dataManager.state.settings.sfxVolume = Number(e.target.value);
    dataManager.saveToStorage();
});
document.getElementById('setting-shake').addEventListener('change', (e) => {
    dataManager.state.settings.screenShake = e.target.checked;
    dataManager.saveToStorage();
});
document.getElementById('setting-particles').addEventListener('change', (e) => {
    dataManager.state.settings.particles = e.target.checked;
    dataManager.saveToStorage();
});
document.getElementById('setting-vapor')?.addEventListener('change', (e) => {
    dataManager.state.settings.vaporEffects = e.target.checked;
    dataManager.saveToStorage();
});
document.getElementById('setting-obstacle-break')?.addEventListener('change', (e) => {
    dataManager.state.settings.obstacleBreak = e.target.checked;
    dataManager.saveToStorage();
});
document.getElementById('setting-char-stretch')?.addEventListener('input', (e) => {
    dataManager.state.settings.charStretch = Number(e.target.value);
    dataManager.saveToStorage();
});
document.getElementById('setting-tier-sky')?.addEventListener('change', (e) => {
    dataManager.state.settings.tierSkyColor = e.target.checked;
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
document.getElementById('reset-settings-btn')?.addEventListener('click', () => {
    dataManager.state.settings = { ...dataManager.getDefaultState().settings };
    soundManager.applyMusicVolume();
    syncTrailInputsUI();
    dataManager.saveToStorage();
    openSettingsModal();
});
syncTrailInputsUI();

// 1200x630 Open Graph Thumbnail Generator for dcism.org Showcase
document.getElementById('export-thumbnail-btn').addEventListener('click', () => {
    const renderAndDownloadThumbnail = (iconImg = null) => {
        const tc = document.createElement('canvas');
        tc.width = 1200;
        tc.height = 630;
        const tctx = tc.getContext('2d');

        const sky = tctx.createLinearGradient(0, 0, 1200, 630);
        sky.addColorStop(0, '#090d16');
        sky.addColorStop(0.55, '#1e1b4b');
        sky.addColorStop(1, '#4c0519');
        tctx.fillStyle = sky;
        tctx.fillRect(0, 0, 1200, 630);

        // Speed lines
        tctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        tctx.lineWidth = 4;
        for (let i = 0; i < 18; i++) {
            const y = 60 + (i * 31) % 440;
            const x = (i * 173) % 900;
            tctx.beginPath();
            tctx.moveTo(x, y);
            tctx.lineTo(x + 220, y);
            tctx.stroke();
        }

        // Track floor
        tctx.fillStyle = '#0f172a';
        tctx.fillRect(0, 490, 1200, 140);
        tctx.strokeStyle = '#f43f5e';
        tctx.lineWidth = 10;
        tctx.beginPath();
        tctx.moveTo(0, 490);
        tctx.lineTo(1200, 490);
        tctx.stroke();

        // Draw Player Rig + Afterimages
        const prevState = playerRig.animState;
        playerRig.animState = 'sonic';
        const rainbow = ['#38bdf8', '#a855f7', '#f43f5e'];
        for (let i = 3; i >= 1; i--) {
            tctx.save();
            tctx.globalAlpha = (4 - i) * 0.22;
            playerRig.draw(tctx, 860 - i * 65, 365, 0.95, rainbow[i - 1]);
            tctx.restore();
        }
        playerRig.draw(tctx, 860, 365, 0.95);
        playerRig.animState = prevState;

        // Draw icon.png in the exact position from the layout (x: 494, y: 114, 208x208)
        if (iconImg && iconImg.complete && iconImg.naturalWidth > 0) {
            tctx.save();
            tctx.imageSmoothingEnabled = false;
            tctx.drawImage(iconImg, 494, 114, 208, 208);
            tctx.restore();
        }

        // Title Branding
        tctx.fillStyle = '#38bdf8';
        tctx.font = '800 22px system-ui, sans-serif';
        tctx.fillText('WEB EDITION', 72, 195);

        tctx.fillStyle = '#f8fafc';
        tctx.font = '900 112px system-ui, sans-serif';
        tctx.fillText('Huss-R', 68, 310);

        tctx.fillStyle = '#cbd5e1';
        tctx.font = '600 30px system-ui, sans-serif';
        tctx.fillText('Break the barriers of Speed with your own husser.', 72, 368);

        const url = tc.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'thumb.png';
        a.click();
    };

    const iconImg = new Image();
    iconImg.onload = () => renderAndDownloadThumbnail(iconImg);
    iconImg.onerror = () => renderAndDownloadThumbnail(null);
    iconImg.src = 'icon.png';
});

// If dcism.org's headless screenshot bot visits the page (or ?thumb=1 is in the URL), display thumb.png full-screen!
if (
    navigator.webdriver ||
    /HeadlessChrome|PhantomJS|Screenshot|bot|crawler|spider/i.test(navigator.userAgent) ||
    new URLSearchParams(window.location.search).has('thumb')
) {
    const thumbOverlay = document.createElement('img');
    thumbOverlay.src = 'thumb.png';
    thumbOverlay.alt = 'Huss-R Thumbnail';
    thumbOverlay.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;object-fit:cover;z-index:999999;background:#090d16;pointer-events:none;';
    thumbOverlay.onerror = () => thumbOverlay.remove();
    document.body.appendChild(thumbOverlay);
}

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
                No saved characters in your Vault yet. Type a name above and click <strong>"Save Current to Vault"</strong>!
            </div>
        `;
        return;
    }

    slots.forEach((slot) => {
        const isPublic = Boolean(slot.is_public);
        const card = document.createElement('div');
        card.className = 'story-card';
        const dateStr = new Date((slot.updated_at > 1e11 ? slot.updated_at : slot.updated_at * 1000)).toLocaleString();
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${slot.limbs?.head || ''}" alt="Head" style="width: 44px; height: 44px; background: #fff; border-radius: 6px; border: 1px solid #38bdf8; object-fit: contain;">
                <div class="story-info">
                    <h3>${slot.char_name}</h3>
                    <p>Creator: ${slot.owner_name || 'Husser'} • ${isPublic ? '<span style="color:#4ade80;">Showcased on Profile</span>' : '<span style="color:#94a3b8;">Private in Vault</span>'} • ${dateStr}</p>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="toggle-showcase-btn" style="background: ${isPublic ? '#059669' : '#334155'}; border-color: ${isPublic ? '#22c55e' : '#475569'};">
                    ${isPublic ? 'Showcased' : 'Private'}
                </button>
                <button type="button" class="primary-btn load-slot-btn">Load</button>
                <button type="button" class="delete-slot-btn" style="background: #ef4444; border-color: #ef4444;">Delete</button>
            </div>
        `;

        card.querySelector('.toggle-showcase-btn').addEventListener('click', async () => {
            await dataManager.toggleCharacterShowcase(slot.id, !isPublic);
            openCharVaultModal();
        });

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

// Account Modal
function openAccountModal() {
    closeAllModals();
    const modal = document.getElementById('auth-modal');
    const loggedInView = document.getElementById('auth-logged-in-view');
    const loggedOutView = document.getElementById('auth-logged-out-view');
    const syncMsg = document.getElementById('profile-sync-msg');
    if (syncMsg) syncMsg.style.display = 'none';

    if (dataManager.currentUser) {
        loggedInView.style.display = 'block';
        loggedOutView.style.display = 'none';
        const u = dataManager.currentUser;
        const s = dataManager.state;
        document.getElementById('profile-modal-pfp').src = u.picture || dataManager.generateFallbackAvatar(u.name);
        document.getElementById('profile-modal-name').textContent = u.name;
        document.getElementById('profile-nickname-input').value = u.name || '';
        document.getElementById('profile-modal-stats').innerHTML = `
            <div class="stat-tile"><span>NANO-SCRAP</span><strong>⚙️ ${s.scrap.toLocaleString()}</strong></div>
            <div class="stat-tile"><span>WORKSHOP LVLS</span><strong>E:${s.upgrades.engine} • S:${s.upgrades.fuel} • T:${s.upgrades.traction}</strong></div>
            <div class="stat-tile"><span>BEST SCORE</span><strong>${(s.bestScore || 0).toLocaleString()}</strong></div>
        `;
    } else {
        loggedInView.style.display = 'none';
        loggedOutView.style.display = 'block';
        document.getElementById('auth-error-msg').style.display = 'none';
    }
    modal.style.display = 'flex';
}

// Main Menu & Hub Bar Button Bindings
document.getElementById('menu-story-btn').addEventListener('click', openStoryModal);
document.getElementById('menu-endless-btn').addEventListener('click', enterEndlessMode);
document.getElementById('menu-sandbox-btn').addEventListener('click', enterSandboxMode);
document.getElementById('menu-editor-btn').addEventListener('click', openCharacterEditor);
document.getElementById('menu-workshop-btn').addEventListener('click', openWorkshopModal);
document.getElementById('menu-leaderboard-btn').addEventListener('click', openLeaderboardModal);
document.getElementById('menu-profile-btn').addEventListener('click', () => openProfileModal(null));
document.getElementById('menu-settings-btn').addEventListener('click', openSettingsModal);
document.getElementById('menu-account-btn').addEventListener('click', openAccountModal);
document.getElementById('google-login-btn')?.addEventListener('click', openAccountModal);

document.getElementById('hub-main-menu-btn').addEventListener('click', openMainMenu);
document.getElementById('open-workshop-btn')?.addEventListener('click', openWorkshopModal);
document.getElementById('open-story-btn')?.addEventListener('click', openStoryModal);
document.getElementById('open-sandbox-btn')?.addEventListener('click', enterSandboxMode);
document.getElementById('open-leaderboard-btn')?.addEventListener('click', openLeaderboardModal);
document.getElementById('open-profile-btn')?.addEventListener('click', () => openProfileModal(null));
document.getElementById('open-settings-btn')?.addEventListener('click', openSettingsModal);
document.getElementById('start-endless-btn')?.addEventListener('click', enterEndlessMode);

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
        authSubmitBtn.textContent = 'Create Account & Save Progress';
    } else {
        authLoginTab.classList.add('primary-btn');
        authSignupTab.classList.remove('primary-btn');
        authNameWrap.style.display = 'none';
        authSubmitBtn.textContent = 'Sign In';
    }
}

authLoginTab.addEventListener('click', () => setAuthMode('login'));
authSignupTab.addEventListener('click', () => setAuthMode('signup'));

document.getElementById('real-google-oauth-btn').addEventListener('click', () => {
    const launched = dataManager.triggerGoogleOAuthPopup();
    if (!launched) {
        authErrorEl.textContent = 'Google popup is still initializing—click the blue "Sign in with Google" button right above or use the form below.';
        authErrorEl.style.display = 'block';
    }
});

document.getElementById('save-nickname-btn').addEventListener('click', async () => {
    const syncMsg = document.getElementById('profile-sync-msg');
    const rawName = document.getElementById('profile-nickname-input').value;
    try {
        const updated = await dataManager.updateNickname(rawName);
        document.getElementById('profile-modal-name').textContent = updated;
        document.getElementById('profile-modal-pfp').src = dataManager.currentUser.picture;
        syncMsg.style.color = '#4ade80';
        syncMsg.textContent = `Nickname updated to "${updated}" and synced to Leaderboard.`;
        syncMsg.style.display = 'block';
    } catch (err) {
        syncMsg.style.color = '#ef4444';
        syncMsg.textContent = err.message || 'Could not update nickname.';
        syncMsg.style.display = 'block';
    }
});

document.getElementById('auth-upload-cloud-btn').addEventListener('click', async () => {
    const syncMsg = document.getElementById('profile-sync-msg');
    try {
        studio.saveAllLimbsToProfile();
        await dataManager.uploadToCloud();
        syncMsg.style.color = '#4ade80';
        syncMsg.textContent = 'Uploaded local progress, Workshop levels, and Husser limbs to Cloud.';
        syncMsg.style.display = 'block';
    } catch (err) {
        syncMsg.style.color = '#ef4444';
        syncMsg.textContent = err.message || 'Cloud upload failed.';
        syncMsg.style.display = 'block';
    }
});

document.getElementById('auth-download-cloud-btn').addEventListener('click', async () => {
    const syncMsg = document.getElementById('profile-sync-msg');
    try {
        await dataManager.downloadFromCloud();
        studio.restoreSavedLimbsToHistory();
        syncTrailInputsUI();
        openAccountModal();
        syncMsg.style.color = '#38bdf8';
        syncMsg.textContent = 'Downloaded latest save data from Cloud.';
        syncMsg.style.display = 'block';
    } catch (err) {
        syncMsg.style.color = '#ef4444';
        syncMsg.textContent = err.message || 'Cloud download failed.';
        syncMsg.style.display = 'block';
    }
});

const handleSignOut = () => {
    dataManager.signOut();
    studio.restoreSavedLimbsToHistory();
    closeAllModals();
};
document.getElementById('google-logout-btn')?.addEventListener('click', handleSignOut);
document.getElementById('auth-modal-logout-btn')?.addEventListener('click', handleSignOut);

document.getElementById('google-auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    authErrorEl.style.display = 'none';
    const email = document.getElementById('auth-email-input').value.trim();
    const name = document.getElementById('auth-name-input').value.trim() || email.split('@')[0];
    const password = document.getElementById('auth-password-input').value;

    try {
        if (authMode === 'signup') {
            studio.saveAllLimbsToProfile();
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
    if (!btn.dataset.close) return;
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

// Ensure first-time players see the upgraded Cyber Template on the Main Menu if they haven't drawn yet
if (!Object.values(dataManager.state.limbs || {}).some(Boolean)) {
    const generated = playerRig.generatePresetTextures();
    Object.entries(generated).forEach(([part, url]) => dataManager.saveLimb(part, url));
    studio.restoreSavedLimbsToHistory();
}

updateTopBarUI(dataManager.state, dataManager.currentUser);

// Pool of Main Menu Background Flyby Runners (Loads User's Created Vault Characters!)
const menuFlybyRunners = [];
let menuVaultLoaded = false;

function spawnOrResetFlyby(flyer, canvasW, initialSpread = false) {
    // Speed tiers: slow jog (220-380), fast sprint (600-980), or supersonic Tier 3+ with cone (1350-1950)
    const roll = Math.random();
    if (roll < 0.32) {
        flyer.speed = 220 + Math.random() * 160;
        flyer.tier = 'jog';
        flyer.rig.animState = 'run';
    } else if (roll < 0.66) {
        flyer.speed = 620 + Math.random() * 360;
        flyer.tier = 'sprint';
        flyer.rig.animState = 'sonic';
    } else {
        flyer.speed = 1380 + Math.random() * 580;
        flyer.tier = 'supersonic';
        flyer.rig.animState = 'sonic';
    }
    flyer.x = initialSpread
        ? Math.random() * canvasW
        : -180 - Math.random() * 450;
    const palette = ['#38bdf8', '#f43f5e', '#a855f7', '#22c55e', '#facc15', '#ec4899'];
    flyer.trailColor = palette[Math.floor(Math.random() * palette.length)];
}

async function refreshMenuFlybyCast() {
    const slots = await dataManager.getVaultCharacters();
    menuFlybyRunners.length = 0;

    // 1. Always include the player's currently equipped character
    const mainFlyer = { rig: playerRig, x: 0, speed: 900, tier: 'sprint', trailColor: '#38bdf8' };
    spawnOrResetFlyby(mainFlyer, canvas.width, true);
    menuFlybyRunners.push(mainFlyer);

    // 2. Include all saved characters from the player's Character Vault
    if (slots && slots.length > 0) {
        slots.slice(0, 6).forEach((slot) => {
            if (slot && slot.limbs) {
                const r = new HusserRig();
                r.loadFromLimbMap(slot.limbs);
                const flyer = { rig: r, x: 0, speed: 600, tier: 'sprint', trailColor: '#38bdf8' };
                spawnOrResetFlyby(flyer, canvas.width, true);
                menuFlybyRunners.push(flyer);
            }
        });
    }

    // 3. Fill up to at least 4 flyers so the background track always has varied flybys
    let rivalIdx = 0;
    while (menuFlybyRunners.length < 4) {
        const r = new HusserRig();
        r.generatePresetTextures(STORY_RIVALS[rivalIdx % STORY_RIVALS.length].colors);
        rivalIdx++;
        const flyer = { rig: r, x: 0, speed: 800, tier: 'supersonic', trailColor: '#f43f5e' };
        spawnOrResetFlyby(flyer, canvas.width, true);
        menuFlybyRunners.push(flyer);
    }
}

function drawMenuSupersonicCone(ctx, x, y, stretchX) {
    const apexX = x + 78 * stretchX;
    const coneLen = 280;
    const spreadY = 135;
    const tailX = apexX - coneLen;

    ctx.save();
    ctx.translate(0, y - 72);

    const machGrad = ctx.createLinearGradient(apexX, 0, tailX, 0);
    machGrad.addColorStop(0, 'rgba(255, 255, 255, 0.44)');
    machGrad.addColorStop(0.35, 'rgba(186, 230, 253, 0.30)');
    machGrad.addColorStop(0.75, 'rgba(244, 63, 94, 0.16)');
    machGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

    ctx.fillStyle = machGrad;
    ctx.beginPath();
    ctx.moveTo(apexX, 0);
    ctx.lineTo(tailX, -spreadY);
    ctx.quadraticCurveTo(apexX - coneLen * 0.65, 0, tailX, spreadY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(apexX, 0);
    ctx.lineTo(tailX, -spreadY);
    ctx.moveTo(apexX, 0);
    ctx.lineTo(tailX, spreadY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(apexX - coneLen * 0.55, 0, 18, spreadY * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

// Geometry Dash Style Live Background Runner on Main Menu
function drawMenuLiveBackground(ctx, w, h, dt) {
    if (!menuVaultLoaded) {
        menuVaultLoaded = true;
        refreshMenuFlybyCast();
    }

    // Uncapped continuous scroll so buildings never jump or pop
    menuBgScroll += 520 * dt;
    const floorY = h * 0.78;

    const sky = ctx.createLinearGradient(0, 0, 0, floorY);
    sky.addColorStop(0, '#090d16');
    sky.addColorStop(0.55, '#1e1b4b');
    sky.addColorStop(1, '#0f172a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Seamless Infinite Parallax Cyber Skyline (exact multiple of spacing = zero popping!)
    const spacing = 220;
    const numBuildings = Math.ceil((w + 440) / spacing) + 1;
    const totalSpan = numBuildings * spacing;
    const scrollPx = menuBgScroll * 0.45;

    for (let i = 0; i < numBuildings; i++) {
        const worldIdx = Math.floor((scrollPx + i * spacing) / totalSpan) * numBuildings + i;
        const bx = ((i * spacing - (scrollPx % totalSpan)) + totalSpan) % totalSpan - 220;
        const hash = Math.abs(Math.sin(worldIdx * 12.9898) * 43758.5453);
        const bh = 100 + Math.floor((hash % 1) * 190);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx, floorY - bh, 82, bh);
        ctx.strokeStyle = worldIdx % 2 === 0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(244, 63, 94, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, floorY - bh, 82, bh);
    }

    // Track Surface
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, floorY, w, h - floorY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();

    // Scrolling Track Lane Dashes
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 4;
    for (let x = -(menuBgScroll % 90); x < w; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, floorY + 28);
        ctx.lineTo(x + 42, floorY + 28);
        ctx.stroke();
    }

    // Update & Draw Flyby Characters (from slow jogs to supersonic Mach cones!)
    for (const flyer of menuFlybyRunners) {
        flyer.x += flyer.speed * dt;
        flyer.rig.update(dt * (flyer.speed / 360));

        if (flyer.x > w + 380) {
            spawnOrResetFlyby(flyer, w, false);
        }

        const isSupersonic = flyer.tier === 'supersonic';
        const stretchX = isSupersonic ? 1.28 : 1.0;
        const stretchY = isSupersonic ? 0.90 : 1.0;

        if (flyer.tier !== 'jog') {
            for (let i = 3; i >= 1; i--) {
                ctx.save();
                ctx.translate(flyer.x - i * (isSupersonic ? 44 : 26), floorY);
                ctx.scale(stretchX, stretchY);
                ctx.globalAlpha = (4 - i) * 0.14;
                flyer.rig.draw(ctx, 0, -82, 0.58, flyer.trailColor);
                ctx.restore();
            }
        }

        ctx.save();
        ctx.translate(flyer.x, floorY);
        ctx.scale(stretchX, stretchY);
        flyer.rig.draw(ctx, 0, -82, 0.58);
        ctx.restore();

        if (isSupersonic) {
            drawMenuSupersonicCone(ctx, flyer.x, floorY, stretchX);
        }
    }
}

function drawPreviewStage(ctx, centerX, floorY, dt) {
    const stageW = Math.min(680, Math.max(320, canvas.width - 480));
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

    if (mode === 'menu') {
        drawMenuLiveBackground(ctx, canvas.width, canvas.height, dt);
    } else if (mode === 'studio') {
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