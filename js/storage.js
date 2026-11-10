// Default Google OAuth Client ID (Can also be set directly in the UI modal and saved)
const DEFAULT_GOOGLE_CLIENT_ID = localStorage.getItem('hussr_google_client_id') || '';

// Story Mode Rivals — Includes Pre-Race Story Cutscene Dialogue for Every Mission!
export const STORY_RIVALS = [
    {
        id: 'rival_1',
        name: 'Ace "Flash" Mendoza (Classmate)',
        stageName: 'Mission 1: Campus Track 100m Sprint',
        distanceMeters: 100,
        baseSpeed: 780,      // 78 m/s cruising velocity
        dashThrust: 540,
        dashFreq: 0.45,
        rewardScrap: 100,
        backdrop: 'day',
        colors: { primary: '#f43f5e', secondary: '#0f172a', visor: '#38bdf8' },
        desc: '100m School Track Challenge • Your classmate claims to be the fastest person on campus.',
        dialogue: [
            { speaker: 'Ace "Flash" Mendoza', side: 'right', text: 'Yo! Heard you drew yourself a custom Husser rig before homeroom. Pretty bold showing up to my track.' },
            { speaker: 'You (Husser)', side: 'left', text: 'You keep telling the whole school nobody can touch your 100-meter dash. Put your speed where your mouth is.' },
            { speaker: 'Ace "Flash" Mendoza', side: 'right', text: 'Ha! 100 meters, straight down the school courtyard. Blink at the starting blocks and you\'ll only see my dust!' }
        ]
    },
    {
        id: 'rival_2',
        name: 'Vektor-01 (Regional Scout)',
        stageName: 'Mission 2: Neo-Cebu 450m Proving Strip',
        distanceMeters: 450,
        baseSpeed: 1220,     // 122 m/s
        dashThrust: 760,
        dashFreq: 0.62,
        rewardScrap: 190,
        backdrop: 'sunset',
        colors: { primary: '#eab308', secondary: '#1e1b4b', visor: '#f43f5e' },
        desc: '450m Expressway • Vektor-01 uses downhill slope tucking to surge past amateur sprinters.',
        dialogue: [
            { speaker: 'Vektor-01', side: 'right', text: 'Telemetry confirmed. Your schoolyard sprint spiked a kinetic anomaly across the Neo-Cebu grid.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Who are you? That track was barely a warm-up.' },
            { speaker: 'Vektor-01', side: 'right', text: 'I am Vektor-01, qualifier unit for the Multiversal Sprint Circuit. Let us see if your hand-drawn frame survives 450 meters of real elevation!' }
        ]
    },
    {
        id: 'rival_3',
        name: 'Kestrel-IX (Aero Stalker)',
        stageName: 'Mission 3: Horizon Canyon 750m',
        distanceMeters: 750,
        baseSpeed: 1780,     // 178 m/s
        dashThrust: 1080,
        dashFreq: 0.76,
        rewardScrap: 360,
        backdrop: 'sunset',
        colors: { primary: '#a855f7', secondary: '#090d16', visor: '#4ade80' },
        desc: '750m Steep Canyon Drop • Master midair fast-falling so air resistance doesn\'t bleed your speed!',
        dialogue: [
            { speaker: 'Kestrel-IX', side: 'right', text: 'Most ground runners panic the moment a ramp launches them airborne. Air drag rips their momentum to shreds.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Then I\'ll tuck my limbs midair, dive into the downslopes, and pump double the velocity at the bottom.' },
            { speaker: 'Kestrel-IX', side: 'right', text: 'Talk is cheap in thin air. Race you to the canyon floor!' }
        ]
    },
    {
        id: 'rival_4',
        name: 'Siren-V (Sonic Valkyrie)',
        stageName: 'Mission 4: Mach Barrier Corridor 1200m',
        distanceMeters: 1200,
        baseSpeed: 2650,     // 265 m/s
        dashThrust: 1580,
        dashFreq: 0.88,
        rewardScrap: 700,
        backdrop: 'night',
        colors: { primary: '#06b6d4', secondary: '#0f172a', visor: '#fde047' },
        desc: '1200m Supersonic Conduit • Siren-V regularly breaks the 343 m/s Sound Barrier on flat planes.',
        dialogue: [
            { speaker: 'Siren-V', side: 'right', text: 'Do you hear that silence ahead? At 343 meters per second, you outrun your own footsteps and shatter the sound barrier.' },
            { speaker: 'You (Husser)', side: 'left', text: 'My engine and traction upgrades are dialed in. I\'m ready to go supersonic.' },
            { speaker: 'Siren-V', side: 'right', text: 'Draft in my slipstream if you can keep up—or get blown off the track by my Mach cone!' }
        ]
    },
    {
        id: 'rival_5',
        name: 'OMEGA-HUSS (Multiversal Apex)',
        stageName: 'Mission 5: Multiversal Apex 1800m',
        distanceMeters: 1800,
        baseSpeed: 3500,     // 350 m/s (Mach 1.02+ cruising!)
        dashThrust: 2150,
        dashFreq: 0.96,
        rewardScrap: 1600,
        backdrop: 'night',
        colors: { primary: '#ec4899', secondary: '#ffffff', visor: '#38bdf8' },
        desc: '1800m Championship Strip • The fastest Husser in the multiverse cruises above Mach 1!',
        dialogue: [
            { speaker: 'OMEGA-HUSS', side: 'right', text: 'Across ten thousand timelines, every challenger has faltered before the Apex Gate. Yet a student from Earth stands at my starting line.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Started with a 100-meter race at school. Now I\'m taking the title of Fastest Husser in the Multiverse.' },
            { speaker: 'OMEGA-HUSS', side: 'right', text: 'Ignite your core! Show the multiverse what supersonic perfection looks like!' }
        ]
    }
];

// Limitless Upgrades with Steeply Scaling Costs
export const WORKSHOP_SPECS = {
    engine: {
        name: '🚀 Top Speed Engine (∞)',
        desc: 'Limitless upgrade! Boosts ground acceleration, passive drive, and Hyper-Dash thrust with no speed ceiling.',
        baseCost: 120,
        scaleFactor: 1.62,
        linearStep: 90
    },
    fuel: {
        name: '🔋 Fuel Tank Capacity (∞)',
        desc: 'Limitless upgrade! Expands Max Stamina/Energy capacity and slows high-speed & curl energy burn.',
        baseCost: 95,
        scaleFactor: 1.58,
        linearStep: 75
    },
    traction: {
        name: '⚡ Kinetic Traction (∞)',
        desc: 'Limitless upgrade! Multiplies downhill slope-pump velocity, ground grip, and Dash Capacitor recharge.',
        baseCost: 95,
        scaleFactor: 1.58,
        linearStep: 75
    }
};

// Real Relational IndexedDB + PHP/SQLite Database Engine (Zero Fake Data)
class HussRDatabase {
    constructor() {
        this.dbName = 'HussR_Database_v4';
        this.dbPromise = this.initIndexedDB();
        this.apiAvailable = true;
    }

    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.dbName, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'email' });
                }
                if (!db.objectStoreNames.contains('characters')) {
                    const charStore = db.createObjectStore('characters', { keyPath: 'id' });
                    charStore.createIndex('owner_email', 'owner_email', { unique: false });
                }
                if (!db.objectStoreNames.contains('leaderboard')) {
                    const lbStore = db.createObjectStore('leaderboard', { keyPath: 'id', autoIncrement: true });
                    lbStore.createIndex('score', 'score', { unique: false });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async apiCall(action, method = 'GET', body = null) {
        if (!this.apiAvailable) return null;
        try {
            const opts = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) opts.body = JSON.stringify(body);
            const res = await fetch(`api.php?action=${action}`, opts);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const text = await res.text();
            if (text.trim().startsWith('<?php')) {
                this.apiAvailable = false;
                return null;
            }
            return JSON.parse(text);
        } catch {
            this.apiAvailable = false;
            return null;
        }
    }

    async hashPassword(password) {
        const msgBuffer = new TextEncoder().encode(password + '_hussr_salt_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async registerUser(email, name, password, initialState) {
        const cleanEmail = email.trim().toLowerCase();
        const passwordHash = await this.hashPassword(password);

        const apiRes = await this.apiCall('register', 'POST', {
            email: cleanEmail, name, passwordHash, state: initialState
        });
        if (apiRes && !apiRes.ok) throw new Error(apiRes.error);

        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('users', 'readwrite');
            const store = tx.objectStore('users');
            const getReq = store.get(cleanEmail);
            getReq.onsuccess = () => {
                if (getReq.result && !apiRes) {
                    reject(new Error('Email is already registered in database. Please switch to Login.'));
                    return;
                }
                const record = {
                    email: cleanEmail,
                    name: name.trim(),
                    passwordHash,
                    state: apiRes?.state || initialState,
                    updatedAt: Date.now()
                };
                store.put(record);
                resolve({ user: { email: record.email, name: record.name }, state: record.state });
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }

    async loginUser(email, password, isOAuth = false, oauthName = 'Google Sprinter', fallbackState = null) {
        const cleanEmail = email.trim().toLowerCase();
        const passwordHash = isOAuth ? '' : await this.hashPassword(password);

        const apiRes = await this.apiCall('login', 'POST', {
            email: cleanEmail, passwordHash, isOAuth, name: oauthName, state: fallbackState
        });
        if (apiRes && !apiRes.ok) throw new Error(apiRes.error);

        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('users', 'readwrite');
            const store = tx.objectStore('users');
            const getReq = store.get(cleanEmail);
            getReq.onsuccess = () => {
                const existing = getReq.result;
                if (apiRes && apiRes.ok) {
                    store.put({
                        email: cleanEmail,
                        name: apiRes.user.name,
                        passwordHash: existing?.passwordHash || passwordHash,
                        state: apiRes.state,
                        updatedAt: Date.now()
                    });
                    resolve({ user: apiRes.user, state: apiRes.state });
                    return;
                }

                if (!existing) {
                    if (isOAuth) {
                        const newRecord = {
                            email: cleanEmail,
                            name: oauthName,
                            passwordHash: '',
                            state: fallbackState,
                            updatedAt: Date.now()
                        };
                        store.put(newRecord);
                        resolve({ user: { email: cleanEmail, name: oauthName }, state: fallbackState });
                        return;
                    }
                    reject(new Error('No account found for this email. Click "Sign Up" to create one!'));
                    return;
                }

                if (!isOAuth && existing.passwordHash !== passwordHash) {
                    reject(new Error('Incorrect password. Please try again.'));
                    return;
                }

                resolve({ user: { email: existing.email, name: existing.name }, state: existing.state });
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }

    async syncUserState(email, state) {
        if (!email) return;
        const cleanEmail = email.trim().toLowerCase();
        await this.apiCall('sync_state', 'POST', { email: cleanEmail, state });

        const db = await this.dbPromise;
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        const getReq = store.get(cleanEmail);
        getReq.onsuccess = () => {
            if (getReq.result) {
                getReq.result.state = state;
                getReq.result.updatedAt = Date.now();
                store.put(getReq.result);
            }
        };
    }

    async saveCharacterSlot(email, charName, limbs, existingId = null) {
        const id = existingId || ('char_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
        const owner = (email || 'guest').toLowerCase();
        await this.apiCall('save_character', 'POST', { id, email: owner, charName, limbs });

        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('characters', 'readwrite');
            tx.objectStore('characters').put({
                id,
                owner_email: owner,
                char_name: charName,
                limbs: { ...limbs },
                updated_at: Date.now()
            });
            tx.oncomplete = () => resolve(id);
        });
    }

    async listCharacterSlots(email) {
        const owner = (email || 'guest').toLowerCase();
        const apiRes = await this.apiCall(`list_characters&email=${encodeURIComponent(owner)}`, 'GET');
        if (apiRes && apiRes.ok) return apiRes.characters;

        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('characters', 'readonly');
            const req = tx.objectStore('characters').getAll();
            req.onsuccess = () => {
                const all = req.result || [];
                const filtered = all
                    .filter(c => c.owner_email === owner || c.owner_email === 'guest')
                    .sort((a, b) => b.updated_at - a.updated_at);
                resolve(filtered);
            };
        });
    }

    async deleteCharacterSlot(id) {
        await this.apiCall('delete_character', 'POST', { id });
        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('characters', 'readwrite');
            tx.objectStore('characters').delete(id);
            tx.oncomplete = () => resolve(true);
        });
    }

    async postScore(email, name, speed, distance, score) {
        await this.apiCall('post_score', 'POST', { email, name, speed, distance, score });
        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('leaderboard', 'readwrite');
            tx.objectStore('leaderboard').add({
                email: (email || 'guest@local').toLowerCase(),
                name,
                speed,
                distance,
                score,
                created_at: Date.now()
            });
            tx.oncomplete = () => resolve(true);
        });
    }

    async getLeaderboard() {
        const apiRes = await this.apiCall('leaderboard', 'GET');
        if (apiRes && apiRes.ok) return apiRes.leaderboard;

        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('leaderboard', 'readonly');
            const req = tx.objectStore('leaderboard').getAll();
            req.onsuccess = () => {
                const rows = req.result || [];
                const bestByPlayer = new Map();
                for (const r of rows) {
                    const key = `${r.email}_${r.name}`;
                    if (!bestByPlayer.has(key)) {
                        bestByPlayer.set(key, { ...r });
                    } else {
                        const prev = bestByPlayer.get(key);
                        prev.score = Math.max(prev.score, r.score);
                        prev.distance = Math.max(prev.distance, r.distance);
                        prev.speed = Math.max(prev.speed, r.speed);
                    }
                }
                const sorted = Array.from(bestByPlayer.values()).sort((a, b) => b.score - a.score).slice(0, 25);
                resolve(sorted);
            };
        });
    }
}

export class DataManager {
    constructor(onProfileChange) {
        this.onProfileChange = onProfileChange;
        this.storageKey = 'hussr_save_v4';
        this.db = new HussRDatabase();
        this.currentUser = null;
        this.googleTokenClient = null;

        localStorage.removeItem('hussr_leaderboard_v3');

        this.state = this.getDefaultState();
        this.loadFromStorage();
        this.initGoogleAuth();
    }

    getDefaultState() {
        return {
            scrap: 60,
            upgrades: { engine: 1, fuel: 1, traction: 1 },
            clearedRivals: [],
            limbs: { head: null, arm: null, torso: null, leg: null },
            settings: {
                screenShake: true,
                particles: true,
                alertOpacity: 92,
                trailColor: '#38bdf8',
                trailRainbow: false
            },
            bestSpeed: 0,
            bestDistance: 0,
            bestScore: 0
        };
    }

    getActiveStorageKey() {
        if (this.currentUser && this.currentUser.email) {
            return `${this.storageKey}_${this.currentUser.email.toLowerCase()}`;
        }
        return `${this.storageKey}_guest`;
    }

    loadFromStorage() {
        try {
            const savedUser = localStorage.getItem('hussr_active_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
            const raw = localStorage.getItem(this.getActiveStorageKey());
            if (raw) {
                const parsed = JSON.parse(raw);
                this.state = {
                    ...this.getDefaultState(),
                    ...parsed,
                    upgrades: { ...this.getDefaultState().upgrades, ...(parsed.upgrades || {}) },
                    limbs: { ...this.getDefaultState().limbs, ...(parsed.limbs || {}) },
                    settings: { ...this.getDefaultState().settings, ...(parsed.settings || {}) }
                };
            } else {
                this.state = this.getDefaultState();
            }
        } catch (err) {
            console.warn('Storage load fallback:', err);
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.getActiveStorageKey(), JSON.stringify(this.state));
            if (this.currentUser && this.currentUser.email) {
                this.db.syncUserState(this.currentUser.email, this.state);
            }
            const badge = document.getElementById('save-status-badge');
            if (badge) {
                badge.textContent = this.currentUser ? `✓ DB Synced (${this.currentUser.name})` : '✓ Saved Locally';
            }
            if (this.onProfileChange) this.onProfileChange(this.state, this.currentUser);
        } catch (err) {
            console.warn('Quota or storage warning:', err);
        }
    }

    saveLimb(part, dataUrl) {
        this.state.limbs[part] = dataUrl;
        this.saveToStorage();
    }

    async saveCharacterToVault(charName) {
        const email = this.currentUser ? this.currentUser.email : 'guest';
        return await this.db.saveCharacterSlot(email, charName || 'Custom Husser', this.state.limbs);
    }

    async getVaultCharacters() {
        const email = this.currentUser ? this.currentUser.email : 'guest';
        return await this.db.listCharacterSlots(email);
    }

    async deleteVaultCharacter(id) {
        return await this.db.deleteCharacterSlot(id);
    }

    getUpgradeCost(key) {
        const spec = WORKSHOP_SPECS[key];
        const lvl = this.state.upgrades[key] || 1;
        return Math.round(spec.baseCost * Math.pow(spec.scaleFactor, lvl - 1) + (lvl - 1) * spec.linearStep);
    }

    buyUpgrade(key) {
        const lvl = this.state.upgrades[key] || 1;
        const cost = this.getUpgradeCost(key);
        if (this.state.scrap < cost) return false;

        this.state.scrap -= cost;
        this.state.upgrades[key] = lvl + 1;
        this.saveToStorage();
        return true;
    }

    addScrap(amount) {
        this.state.scrap += Math.max(0, Math.round(amount));
        this.saveToStorage();
    }

    markRivalCleared(rivalId) {
        if (!this.state.clearedRivals.includes(rivalId)) {
            this.state.clearedRivals.push(rivalId);
            this.saveToStorage();
        }
    }

    async recordRunScore(distanceMeters, peakSpeedMs) {
        const score = Math.round(distanceMeters * 1.8 + peakSpeedMs * 22);
        this.state.bestDistance = Math.max(this.state.bestDistance, distanceMeters);
        this.state.bestSpeed = Math.max(this.state.bestSpeed, peakSpeedMs);
        this.state.bestScore = Math.max(this.state.bestScore, score);
        this.saveToStorage();

        const runnerName = this.currentUser
            ? `${this.currentUser.name} (${this.currentUser.email})`
            : 'Guest Husser';
        const email = this.currentUser ? this.currentUser.email : 'guest@local';

        await this.db.postScore(email, runnerName, peakSpeedMs, distanceMeters, score);
        return score;
    }

    async getLeaderboard() {
        return await this.db.getLeaderboard();
    }

    initGoogleAuth() {
        const clientId = localStorage.getItem('hussr_google_client_id') || DEFAULT_GOOGLE_CLIENT_ID;
        const inputEl = document.getElementById('google-client-id-input');
        if (inputEl && clientId) inputEl.value = clientId;

        const tryInitGSI = () => {
            if (!clientId || !window.google || !window.google.accounts) return;
            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (response) => this.handleGoogleJwt(response.credential)
                });
                const container = document.getElementById('g_id_onload_container');
                if (container) {
                    container.innerHTML = '';
                    window.google.accounts.id.renderButton(container, {
                        theme: 'filled_blue',
                        size: 'large'
                    });
                }
                if (window.google.accounts.oauth2) {
                    this.googleTokenClient = window.google.accounts.oauth2.initTokenClient({
                        client_id: clientId,
                        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                        callback: async (tokenResponse) => {
                            if (tokenResponse && tokenResponse.access_token) {
                                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                                });
                                const profile = await res.json();
                                if (profile && profile.email) {
                                    await this.loginWithOAuthProfile(profile.email, profile.name || profile.given_name || 'Google Sprinter');
                                    document.getElementById('auth-modal').style.display = 'none';
                                }
                            }
                        }
                    });
                }
            } catch (e) {
                console.warn('GSI init warning:', e);
            }
        };

        if (document.readyState === 'complete') tryInitGSI();
        else window.addEventListener('load', tryInitGSI);
    }

    triggerGoogleOAuthPopup() {
        if (this.googleTokenClient) {
            this.googleTokenClient.requestAccessToken();
            return true;
        }
        return false;
    }

    async handleGoogleJwt(jwt) {
        try {
            const payload = JSON.parse(atob(jwt.split('.')[1]));
            await this.loginWithOAuthProfile(payload.email, payload.name || payload.given_name);
            document.getElementById('auth-modal').style.display = 'none';
        } catch (e) {
            console.error('Failed to decode Google JWT', e);
        }
    }

    async loginWithOAuthProfile(email, name) {
        const guestLimbs = { ...this.state.limbs };
        const result = await this.db.loginUser(email, '', true, name, this.state);
        this.applyAuthenticatedSession(result.user, result.state, guestLimbs);
    }

    async registerDatabaseAccount(email, name, password) {
        const guestLimbs = { ...this.state.limbs };
        const result = await this.db.registerUser(email, name, password, this.state);
        this.applyAuthenticatedSession(result.user, result.state, guestLimbs);
    }

    async loginDatabaseAccount(email, password) {
        const guestLimbs = { ...this.state.limbs };
        const result = await this.db.loginUser(email, password, false);
        this.applyAuthenticatedSession(result.user, result.state, guestLimbs);
    }

    applyAuthenticatedSession(user, dbState, guestLimbs) {
        this.currentUser = user;
        localStorage.setItem('hussr_active_user', JSON.stringify(this.currentUser));
        if (dbState) {
            this.state = {
                ...this.getDefaultState(),
                ...dbState,
                upgrades: { ...this.getDefaultState().upgrades, ...(dbState.upgrades || {}) },
                limbs: { ...this.getDefaultState().limbs, ...(dbState.limbs || {}) },
                settings: { ...this.getDefaultState().settings, ...(dbState.settings || {}) }
            };
        }
        const hasExistingLimbs = Object.values(this.state.limbs).some(Boolean);
        if (!hasExistingLimbs && Object.values(guestLimbs).some(Boolean)) {
            this.state.limbs = guestLimbs;
        }
        this.saveToStorage();
    }

    signOut() {
        this.currentUser = null;
        localStorage.removeItem('hussr_active_user');
        this.loadFromStorage();
        if (this.onProfileChange) this.onProfileChange(this.state, null);
    }
}