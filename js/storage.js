// Locked Google OAuth Client ID for localhost & dcism.org
localStorage.removeItem('hussr_google_client_id');
const DEFAULT_GOOGLE_CLIENT_ID = '121807512209-tbbim304g4agfm3lan9g6eobjupo8s94.apps.googleusercontent.com';

// Expanded 8-Mission Story Campaign with Richer Cutscene Dialogues & Distinct Rival Archetypes
export const STORY_RIVALS = [
    {
        id: 'rival_1',
        name: 'Ace "Flash" Mendoza',
        title: 'Campus Track Captain',
        stageName: 'Mission 1: Campus Courtyard 100m',
        distanceMeters: 100,
        baseSpeed: 760,
        dashThrust: 520,
        dashFreq: 0.45,
        rewardScrap: 100,
        backdrop: 'day',
        colors: { primary: '#f43f5e', secondary: '#0f172a', visor: '#38bdf8', style: 'aero' },
        desc: '100m School Track Challenge • Ace holds the varsity 100m record and doubts a hand-drawn rig can hold together at full sprint.',
        dialogue: [
            { speaker: 'Ace "Flash" Mendoza', side: 'right', text: 'Wait—you actually built your own Husser rig from scratch? Most freshmen just buy a stock frame.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Stock frames have speed limiters. Mine doesn\'t. Ready to put your campus record on the line?' },
            { speaker: 'Ace "Flash" Mendoza', side: 'right', text: '100 meters down the main quad. Don\'t blame me when my slipstream blows your custom paint off!' }
        ]
    },
    {
        id: 'rival_2',
        name: 'Vektor-01',
        title: 'Regional Grid Scout',
        stageName: 'Mission 2: Neo-Cebu Coastal 450m',
        distanceMeters: 450,
        baseSpeed: 1180,
        dashThrust: 740,
        dashFreq: 0.6,
        rewardScrap: 190,
        backdrop: 'sunset',
        colors: { primary: '#eab308', secondary: '#1e1b4b', visor: '#f43f5e', style: 'aero' },
        desc: '450m Coastal Highway • Vektor-01 uses downhill slope tucking to surge past uncalibrated street runners.',
        dialogue: [
            { speaker: 'Vektor-01', side: 'right', text: 'Kinetic signature locked. Your campus sprint triggered our orbital speed sensors across Cebu.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Then you know 100 meters was barely enough room to warm up my engine.' },
            { speaker: 'Vektor-01', side: 'right', text: 'This coastal strip has real elevation drops. Lean into the downhills or get left behind!' }
        ]
    },
    {
        id: 'rival_3',
        name: 'Kestrel-IX',
        title: 'Aero Canyon Stalker',
        stageName: 'Mission 3: Horizon Canyon 750m',
        distanceMeters: 750,
        baseSpeed: 1680,
        dashThrust: 1020,
        dashFreq: 0.72,
        rewardScrap: 340,
        backdrop: 'sunset',
        colors: { primary: '#a855f7', secondary: '#090d16', visor: '#4ade80', style: 'valkyrie' },
        desc: '750m Steep Canyon Drop • High-speed ski ramps will launch you airborne—hold Lean in midair to dive back to the track!',
        dialogue: [
            { speaker: 'Kestrel-IX', side: 'right', text: 'Rookies love launching off canyon ramps until quadratic air drag bleeds all their velocity.' },
            { speaker: 'You (Husser)', side: 'left', text: 'I know how to fast-fall. Catching the downslope at the bottom doubles the pump.' },
            { speaker: 'Kestrel-IX', side: 'right', text: 'Let\'s see if your nerve holds when the ground drops out at 180 meters per second!' }
        ]
    },
    {
        id: 'rival_4',
        name: 'Volt-Raider Kai',
        title: 'Maglev Conduit Runner',
        stageName: 'Mission 4: Maglev Viaduct 1000m',
        distanceMeters: 1000,
        baseSpeed: 2150,
        dashThrust: 1320,
        dashFreq: 0.8,
        rewardScrap: 520,
        backdrop: 'day',
        colors: { primary: '#22c55e', secondary: '#0f172a', visor: '#facc15', style: 'aero' },
        desc: '1000m Elevated Maglev Line • Kai chains rapid Boost surges on every flat section of the viaduct.',
        dialogue: [
            { speaker: 'Volt-Raider Kai', side: 'right', text: 'The Maglev Viaduct is pure rhythm. Waste your Boost while airborne and you\'re toast.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Save Boost for the flat rails, lean the drops, and draft your wake. Got it.' },
            { speaker: 'Volt-Raider Kai', side: 'right', text: 'Bold words! First one to the 1,000-meter pylon takes the scrap bounty!' }
        ]
    },
    {
        id: 'rival_5',
        name: 'Siren-V',
        title: 'Sonic Valkyrie',
        stageName: 'Mission 5: Sound Barrier Corridor 1350m',
        distanceMeters: 1350,
        baseSpeed: 2700,
        dashThrust: 1620,
        dashFreq: 0.86,
        rewardScrap: 780,
        backdrop: 'night',
        colors: { primary: '#06b6d4', secondary: '#0f172a', visor: '#fde047', style: 'valkyrie' },
        desc: '1350m Supersonic Conduit • Siren-V pushes into Tier 3 speeds where buildings shatter from shockwaves.',
        dialogue: [
            { speaker: 'Siren-V', side: 'right', text: 'Past 250 meters per second, the sky darkens and the air turns into a physical wall.' },
            { speaker: 'You (Husser)', side: 'left', text: 'That wall is just waiting to be broken. My Workshop upgrades are ready for Tier 3.' },
            { speaker: 'Siren-V', side: 'right', text: 'Stay in my slipstream if you can survive the turbulence!' }
        ]
    },
    {
        id: 'rival_6',
        name: 'Chronos-Zero',
        title: 'Temporal Horizon Unit',
        stageName: 'Mission 6: Stratosphere Drop 1750m',
        distanceMeters: 1750,
        baseSpeed: 3350,
        dashThrust: 1950,
        dashFreq: 0.9,
        rewardScrap: 1150,
        backdrop: 'night',
        colors: { primary: '#38bdf8', secondary: '#1e1b4b', visor: '#f43f5e', style: 'crown' },
        desc: '1750m High-Altitude Array • Extreme downhill drops capable of pushing upgraded rigs past 500+ m/s.',
        dialogue: [
            { speaker: 'Chronos-Zero', side: 'right', text: 'At 501 meters per second, your frame enters Tier 3 Hypersonic Overdrive. Time itself feels compressed.' },
            { speaker: 'You (Husser)', side: 'left', text: 'I didn\'t climb all the way to the Stratosphere Array to slow down now.' },
            { speaker: 'Chronos-Zero', side: 'right', text: 'Show me a velocity spike worthy of the Multiversal finals!' }
        ]
    },
    {
        id: 'rival_7',
        name: 'Nova- Specter',
        title: 'Quantum Slipstream Phantom',
        stageName: 'Mission 7: Quantum Causeway 2200m',
        distanceMeters: 2200,
        baseSpeed: 4100,
        dashThrust: 2350,
        dashFreq: 0.93,
        rewardScrap: 1650,
        backdrop: 'night',
        colors: { primary: '#c084fc', secondary: '#090d16', visor: '#38bdf8', style: 'valkyrie' },
        desc: '2200m Quantum Causeway • Nova-Specter cruises inside Tier 3 and punishes any stamina exhaustion.',
        dialogue: [
            { speaker: 'Nova-Specter', side: 'right', text: 'Only two sprinters have ever crossed 650 meters per second to form a true Prandtl-Glauert vapor cone.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Make that three. Watch my vapor cone light up this causeway.' },
            { speaker: 'Nova-Specter', side: 'right', text: '2,200 meters. Zero margin for error. Run!' }
        ]
    },
    {
        id: 'rival_8',
        name: 'OMEGA-HUSS',
        title: 'Multiversal Grandmaster',
        stageName: 'Mission 8: Multiversal Apex 3000m',
        distanceMeters: 3000,
        baseSpeed: 5100,
        dashThrust: 2900,
        dashFreq: 0.97,
        rewardScrap: 2800,
        backdrop: 'night',
        colors: { primary: '#ec4899', secondary: '#ffffff', visor: '#38bdf8', style: 'crown' },
        desc: '3000m Championship Finale • The reigning Multiversal Apex sprints at Tier 3+ hypersonic velocity!',
        dialogue: [
            { speaker: 'OMEGA-HUSS', side: 'right', text: 'Across ten thousand timelines, every challenger has faltered before the Apex Gate. Yet a student from Earth stands at my starting line.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Started with a 100-meter race at school. Now I\'m taking the title of Fastest Husser in the Multiverse.' },
            { speaker: 'OMEGA-HUSS', side: 'right', text: 'Ignite your core! Show the multiverse what supersonic perfection looks like!' }
        ]
    }
];

export const WORKSHOP_SPECS = {
    engine: {
        name: '🚀 Huss Engine',
        desc: 'Boosts ground acceleration, passive sprint, and Boost thrust with no speed ceiling.',
        baseCost: 120,
        scaleFactor: 1.62,
        linearStep: 90
    },
    fuel: {
        name: '🔋 Stamina Capacity',
        desc: 'Expands Max Stamina capacity and slows energy burn.',
        baseCost: 95,
        scaleFactor: 1.58,
        linearStep: 75
    },
    traction: {
        name: '⚡ Traction',
        desc: 'Multiplies downhill slope-pump velocity, ground grip, and Boost recharge.',
        baseCost: 95,
        scaleFactor: 1.58,
        linearStep: 75
    }
};

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
            if (!res.ok) return null;
            const text = await res.text();
            if (text.trim().startsWith('<?php')) {
                this.apiAvailable = false;
                return null;
            }
            return JSON.parse(text);
        } catch {
            return null;
        }
    }

    async hashPassword(password) {
        const msgBuffer = new TextEncoder().encode(password + '_hussr_salt_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async registerUser(email, name, password, initialState, picture = '') {
        const cleanEmail = email.trim().toLowerCase();
        const passwordHash = await this.hashPassword(password);

        const apiRes = await this.apiCall('register', 'POST', {
            email: cleanEmail, name, passwordHash, picture, state: initialState
        });
        if (apiRes && !apiRes.ok) throw new Error(apiRes.error);

        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('users', 'readwrite');
            const store = tx.objectStore('users');
            const getReq = store.get(cleanEmail);
            getReq.onsuccess = () => {
                if (getReq.result && !apiRes) {
                    reject(new Error('Email already registered. Please switch to Login.'));
                    return;
                }
                const record = {
                    email: cleanEmail,
                    name: name.trim(),
                    picture: apiRes?.user?.picture || picture || '',
                    passwordHash,
                    state: apiRes?.state || initialState,
                    updatedAt: Date.now()
                };
                store.put(record);
                resolve({ user: { email: record.email, name: record.name, picture: record.picture }, state: record.state });
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }

    async loginUser(email, password, isOAuth = false, oauthName = 'Google Sprinter', fallbackState = null, oauthPicture = '') {
        const cleanEmail = email.trim().toLowerCase();
        const passwordHash = isOAuth ? '' : await this.hashPassword(password);

        const apiRes = await this.apiCall('login', 'POST', {
            email: cleanEmail, passwordHash, isOAuth, name: oauthName, picture: oauthPicture, state: fallbackState
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
                    const pic = oauthPicture || apiRes.user.picture || existing?.picture || '';
                    store.put({
                        email: cleanEmail,
                        name: apiRes.user.name,
                        picture: pic,
                        passwordHash: existing?.passwordHash || passwordHash,
                        state: apiRes.state,
                        updatedAt: Date.now()
                    });
                    resolve({ user: { ...apiRes.user, picture: pic }, state: apiRes.state });
                    return;
                }

                if (!existing) {
                    if (isOAuth) {
                        const newRecord = {
                            email: cleanEmail,
                            name: oauthName,
                            picture: oauthPicture || '',
                            passwordHash: '',
                            state: fallbackState,
                            updatedAt: Date.now()
                        };
                        store.put(newRecord);
                        resolve({ user: { email: cleanEmail, name: oauthName, picture: newRecord.picture }, state: fallbackState });
                        return;
                    }
                    reject(new Error('No account found for this email. Click "Sign Up" to create one!'));
                    return;
                }

                if (!isOAuth && existing.passwordHash !== passwordHash) {
                    reject(new Error('Incorrect password. Please try again.'));
                    return;
                }

                if (oauthPicture && existing.picture !== oauthPicture) {
                    existing.picture = oauthPicture;
                    store.put(existing);
                }

                resolve({
                    user: { email: existing.email, name: existing.name, picture: existing.picture || '' },
                    state: existing.state
                });
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

    async saveCharacterSlot(email, ownerName, charName, limbs, existingId = null, isPublic = 0) {
        const id = existingId || ('char_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
        const owner = (email || 'guest').toLowerCase();
        const pubFlag = isPublic ? 1 : 0;
        await this.apiCall('save_character', 'POST', { id, email: owner, ownerName, charName, limbs, isPublic: pubFlag });

        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('characters', 'readwrite');
            tx.objectStore('characters').put({
                id,
                owner_email: owner,
                owner_name: ownerName || 'Husser',
                char_name: charName,
                limbs: { ...limbs },
                is_public: pubFlag,
                updated_at: Date.now()
            });
            tx.oncomplete = () => resolve(id);
        });
    }

    async toggleCharacterPublic(id, isPublic) {
        const pubFlag = isPublic ? 1 : 0;
        await this.apiCall('toggle_character_public', 'POST', { id, isPublic: pubFlag });

        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('characters', 'readwrite');
            const store = tx.objectStore('characters');
            const req = store.get(id);
            req.onsuccess = () => {
                if (req.result) {
                    req.result.is_public = pubFlag;
                    req.result.updated_at = Date.now();
                    store.put(req.result);
                }
            };
            tx.oncomplete = () => resolve(pubFlag);
        });
    }

    async listCharacterSlots(email) {
        const owner = (email || 'guest').toLowerCase();
        if (owner !== 'guest') {
            const apiRes = await this.apiCall(`list_characters&email=${encodeURIComponent(owner)}`, 'GET');
            if (apiRes && apiRes.ok) return apiRes.characters;
        }

        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('characters', 'readonly');
            const req = tx.objectStore('characters').getAll();
            req.onsuccess = () => {
                const all = req.result || [];
                const filtered = all
                    .filter(c => c.owner_email === owner)
                    .sort((a, b) => b.updated_at - a.updated_at);
                resolve(filtered);
            };
        });
    }

    async claimLocalGuestCharacters(newEmail, newOwnerName) {
        const cleanEmail = (newEmail || '').trim().toLowerCase();
        if (!cleanEmail || cleanEmail === 'guest') return;
        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('characters', 'readwrite');
            const store = tx.objectStore('characters');
            const req = store.getAll();
            const toSync = [];
            req.onsuccess = () => {
                for (const c of (req.result || [])) {
                    if (c.owner_email === 'guest') {
                        c.owner_email = cleanEmail;
                        c.owner_name = newOwnerName || 'Husser';
                        c.updated_at = Date.now();
                        store.put(c);
                        toSync.push(c);
                    }
                }
            };
            tx.oncomplete = async () => {
                for (const c of toSync) {
                    await this.apiCall('save_character', 'POST', {
                        id: c.id,
                        email: cleanEmail,
                        ownerName: c.owner_name,
                        charName: c.char_name,
                        limbs: c.limbs,
                        isPublic: c.is_public ? 1 : 0
                    });
                }
                resolve();
            };
        });
    }

    async listPublicUGC() {
        const apiRes = await this.apiCall('list_public_ugc', 'GET');
        if (apiRes && apiRes.ok) return apiRes.characters;

        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('characters', 'readonly');
            const req = tx.objectStore('characters').getAll();
            req.onsuccess = () => {
                const all = (req.result || [])
                    .filter(c => Boolean(c.is_public))
                    .sort((a, b) => b.updated_at - a.updated_at)
                    .slice(0, 24);
                resolve(all);
            };
        });
    }

    async getPublicProfile(playerName) {
        const apiRes = await this.apiCall(`get_public_profile&name=${encodeURIComponent(playerName)}`, 'GET');
        if (apiRes && apiRes.ok && apiRes.profile) return apiRes.profile;

        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction(['users', 'characters', 'leaderboard'], 'readonly');
            const uReq = tx.objectStore('users').getAll();
            const cReq = tx.objectStore('characters').getAll();
            const lReq = tx.objectStore('leaderboard').getAll();

            tx.oncomplete = () => {
                const users = uReq.result || [];
                const chars = cReq.result || [];
                const lbs = lReq.result || [];
                const cleanTarget = (playerName || '').toLowerCase();

                const matchedUser = users.find(u => (u.name || '').toLowerCase() === cleanTarget);
                if (matchedUser) {
                    const st = matchedUser.state || {};
                    const userChars = chars.filter(c => c.owner_email === matchedUser.email && Boolean(c.is_public));
                    resolve({
                        name: matchedUser.name,
                        picture: matchedUser.picture || '',
                        bestScore: st.bestScore || 0,
                        bestSpeed: st.bestSpeed || 0,
                        bestDistance: st.bestDistance || 0,
                        scrap: st.scrap || 0,
                        upgrades: st.upgrades || { engine: 1, fuel: 1, traction: 1 },
                        clearedRivalsCount: (st.clearedRivals || []).length,
                        limbs: st.limbs || null,
                        characters: userChars
                    });
                    return;
                }

                const matchedLb = lbs.filter(l => (l.name || '').toLowerCase() === cleanTarget);
                if (matchedLb.length > 0) {
                    const best = matchedLb.reduce((a, b) => (b.score > a.score ? b : a), matchedLb[0]);
                    resolve({
                        name: best.name,
                        picture: best.picture || '',
                        bestScore: best.score || 0,
                        bestSpeed: best.speed || 0,
                        bestDistance: best.distance || 0,
                        scrap: 0,
                        upgrades: { engine: 1, fuel: 1, traction: 1 },
                        clearedRivalsCount: 0,
                        limbs: null,
                        characters: chars.filter(c => (c.owner_name || '').toLowerCase() === cleanTarget)
                    });
                    return;
                }
                resolve(null);
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

    async postScore(email, name, picture, speed, distance, score) {
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanName = (name || '').replace(/\s*\([^)]*@[^)]*\)\s*$/, '').trim();
        if (!cleanEmail || cleanEmail === 'guest@local' || cleanEmail === 'guest' || !cleanName || cleanName.toLowerCase() === 'guest husser' || cleanName.toLowerCase() === 'guest runner') {
            return false;
        }
        await this.apiCall('post_score', 'POST', { email: cleanEmail, name: cleanName, picture: picture || '', speed, distance, score });
        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('leaderboard', 'readwrite');
            tx.objectStore('leaderboard').add({
                email: cleanEmail,
                name: cleanName,
                picture: picture || '',
                speed,
                distance,
                score,
                created_at: Date.now()
            });
            tx.oncomplete = () => resolve(true);
        });
    }

    async getLeaderboard(sortBy = 'score') {
        const isNotGuest = (r) => {
            const em = (r.email || '').trim().toLowerCase();
            const nm = (r.name || '').replace(/\s*\([^)]*@[^)]*\)\s*$/, '').trim().toLowerCase();
            if (em === 'guest@local' || em === 'guest') return false;
            if (!nm || nm === 'guest husser' || nm === 'guest runner') return false;
            return true;
        };

        const sortFn = (a, b) => {
            if (sortBy === 'distance') return (b.distance - a.distance) || (b.score - a.score);
            if (sortBy === 'speed') return (b.speed - a.speed) || (b.score - a.score);
            return (b.score - a.score) || (b.speed - a.speed);
        };

        const sanitizeRows = (rows) => rows.filter(isNotGuest).map(r => ({
            name: r.name.replace(/\s*\([^)]*@[^)]*\)\s*$/, '').trim(),
            picture: r.picture || '',
            speed: Number(r.speed) || 0,
            distance: Number(r.distance) || 0,
            score: Number(r.score) || 0
        })).sort(sortFn);

        const apiRes = await this.apiCall(`leaderboard&sort=${encodeURIComponent(sortBy)}`, 'GET');
        if (apiRes && apiRes.ok) return sanitizeRows(apiRes.leaderboard);

        const db = await this.dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction('leaderboard', 'readonly');
            const req = tx.objectStore('leaderboard').getAll();
            req.onsuccess = () => {
                const rows = (req.result || []).filter(isNotGuest);
                const bestByPlayer = new Map();
                for (const r of rows) {
                    const cleanName = r.name.replace(/\s*\([^)]*@[^)]*\)\s*$/, '').trim();
                    const key = (r.email || cleanName).toLowerCase();
                    if (!bestByPlayer.has(key)) {
                        bestByPlayer.set(key, { ...r, name: cleanName, picture: r.picture || '' });
                    } else {
                        const prev = bestByPlayer.get(key);
                        prev.name = cleanName;
                        if (r.picture) prev.picture = r.picture;
                        prev.score = Math.max(prev.score, r.score);
                        prev.distance = Math.max(prev.distance, r.distance);
                        prev.speed = Math.max(prev.speed, r.speed);
                    }
                }
                const sorted = Array.from(bestByPlayer.values()).sort(sortFn).slice(0, 50);
                resolve(sanitizeRows(sorted));
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
        this.pullCloudStateOnBoot();
    }

    getDefaultState() {
        return {
            scrap: 60,
            upgrades: { engine: 1, fuel: 1, traction: 1 },
            clearedRivals: [],
            limbs: { head: null, arm: null, torso: null, leg: null },
            settings: {
                musicVolume: 60,
                sfxVolume: 80,
                screenShake: true,
                particles: true,
                vaporEffects: true,
                obstacleBreak: true,
                charStretch: 100,
                tierSkyColor: true,
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
                badge.textContent = this.currentUser ? `✓ Synced (${this.currentUser.name})` : '✓ Saved';
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

    async saveCharacterToVault(charName, isPublic = false) {
        const email = this.currentUser ? this.currentUser.email : 'guest';
        const ownerName = this.currentUser ? this.currentUser.name : 'Guest Husser';
        return await this.db.saveCharacterSlot(email, ownerName, charName || 'Custom Husser', this.state.limbs, null, isPublic ? 1 : 0);
    }

    async toggleCharacterShowcase(id, isPublic) {
        return await this.db.toggleCharacterPublic(id, isPublic);
    }

    async getVaultCharacters() {
        const email = this.currentUser ? this.currentUser.email : 'guest';
        return await this.db.listCharacterSlots(email);
    }

    async getPublicUGCCharacters() {
        return await this.db.listPublicUGC();
    }

    async getPlayerPublicProfile(playerName) {
        return await this.db.getPublicProfile(playerName);
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

    generateFallbackAvatar(name = 'H') {
        const initial = (name.trim()[0] || 'H').toUpperCase();
        const colors = ['#0284c7', '#e11d48', '#7c3aed', '#059669', '#d97706', '#2563eb'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        const bg = colors[Math.abs(hash) % colors.length];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" rx="32" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="30" font-weight="800">${initial}</text></svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    async recordRunScore(distanceMeters, peakSpeedMs) {
        const score = Math.round(distanceMeters * 1.8 + peakSpeedMs * 22);
        this.state.bestDistance = Math.max(this.state.bestDistance, distanceMeters);
        this.state.bestSpeed = Math.max(this.state.bestSpeed, peakSpeedMs);
        this.state.bestScore = Math.max(this.state.bestScore, score);
        this.saveToStorage();

        // Only post to the global leaderboard if the player is signed in to an account
        if (this.currentUser && this.currentUser.email) {
            const runnerName = this.currentUser.name || 'Husser';
            const email = this.currentUser.email;
            const picture = this.currentUser.picture || this.generateFallbackAvatar(runnerName);
            await this.db.postScore(email, runnerName, picture, peakSpeedMs, distanceMeters, score);
        }
        return score;
    }

    async getLeaderboard(sortBy = 'score') {
        return await this.db.getLeaderboard(sortBy);
    }

    isAdmin() {
        if (!this.currentUser) return false;
        return Boolean(this.currentUser.is_admin) || (this.currentUser.name || '').trim().toLowerCase() === 'benndevs';
    }

    async adminGetOverview() {
        if (!this.isAdmin()) throw new Error('Admin privileges required.');
        const res = await this.db.apiCall(`admin_overview&adminEmail=${encodeURIComponent(this.currentUser.email)}`, 'GET');
        if (!res || !res.ok) throw new Error(res?.error || 'Failed to load Admin overview.');
        return res;
    }

    async adminUpdateUser(payload) {
        if (!this.isAdmin()) throw new Error('Admin privileges required.');
        const res = await this.db.apiCall('admin_update_user', 'POST', {
            adminEmail: this.currentUser.email,
            ...payload
        });
        if (!res || !res.ok) throw new Error(res?.error || 'Failed to update user.');
        if (payload.targetEmail && payload.targetEmail.toLowerCase() === this.currentUser.email.toLowerCase()) {
            await this.downloadFromCloud();
        }
        return res;
    }

    async adminDeleteUser(targetEmail) {
        if (!this.isAdmin()) throw new Error('Admin privileges required.');
        const res = await this.db.apiCall('admin_delete_user', 'POST', {
            adminEmail: this.currentUser.email,
            targetEmail
        });
        if (!res || !res.ok) throw new Error(res?.error || 'Failed to delete user.');
        return res;
    }

    async adminDeleteCharacter(id) {
        if (!this.isAdmin()) throw new Error('Admin privileges required.');
        const res = await this.db.apiCall('admin_delete_character', 'POST', {
            adminEmail: this.currentUser.email,
            id
        });
        if (!res || !res.ok) throw new Error(res?.error || 'Failed to delete character.');
        return res;
    }

    async pullCloudStateOnBoot() {
        if (!this.currentUser || !this.currentUser.email) return;
        const apiRes = await this.db.apiCall(`get_state&email=${encodeURIComponent(this.currentUser.email)}`, 'GET');
        if (apiRes && apiRes.ok && apiRes.state) {
            this.applyAuthenticatedSession(apiRes.user || this.currentUser, apiRes.state, this.state);
        }
    }

    async uploadToCloud() {
        this.saveToStorage();
        if (!this.currentUser || !this.currentUser.email) {
            throw new Error('Sign in to an account first to upload to cloud.');
        }
        await this.db.syncUserState(this.currentUser.email, this.state);
        return true;
    }

    async downloadFromCloud() {
        if (!this.currentUser || !this.currentUser.email) {
            throw new Error('Sign in to an account first to download from cloud.');
        }
        const email = this.currentUser.email.trim().toLowerCase();
        const apiRes = await this.db.apiCall(`get_state&email=${encodeURIComponent(email)}`, 'GET');
        if (apiRes && apiRes.ok && apiRes.state) {
            this.state = {
                ...this.getDefaultState(),
                ...apiRes.state,
                upgrades: { ...this.getDefaultState().upgrades, ...(apiRes.state.upgrades || {}) },
                limbs: { ...this.getDefaultState().limbs, ...(apiRes.state.limbs || {}) },
                settings: { ...this.getDefaultState().settings, ...(apiRes.state.settings || {}) }
            };
            if (apiRes.user) {
                this.currentUser = { ...this.currentUser, ...apiRes.user };
                localStorage.setItem('hussr_active_user', JSON.stringify(this.currentUser));
            }
            this.saveToStorage();
            return true;
        }

        const db = await this.db.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('users', 'readonly');
            const req = tx.objectStore('users').get(email);
            req.onsuccess = () => {
                if (req.result && req.result.state) {
                    this.state = {
                        ...this.getDefaultState(),
                        ...req.result.state,
                        upgrades: { ...this.getDefaultState().upgrades, ...(req.result.state.upgrades || {}) },
                        limbs: { ...this.getDefaultState().limbs, ...(req.result.state.limbs || {}) },
                        settings: { ...this.getDefaultState().settings, ...(req.result.state.settings || {}) }
                    };
                    this.saveToStorage();
                    resolve(true);
                } else {
                    reject(new Error('No cloud save found for this account yet.'));
                }
            };
            req.onerror = () => reject(req.error);
        });
    }

    async updateNickname(newNickname) {
        const clean = (newNickname || '').replace(/\s*\([^)]*@[^)]*\)\s*$/, '').trim();
        if (!clean) throw new Error('Please enter a valid nickname.');

        if (this.currentUser) {
            this.currentUser.name = clean;
            if (!this.currentUser.picture || this.currentUser.picture.startsWith('data:image/svg+xml')) {
                this.currentUser.picture = this.generateFallbackAvatar(clean);
            }
            localStorage.setItem('hussr_active_user', JSON.stringify(this.currentUser));

            const email = this.currentUser.email.toLowerCase();
            await this.db.apiCall('update_nickname', 'POST', { email, name: clean });

            const db = await this.db.dbPromise;
            const tx = db.transaction(['users', 'leaderboard', 'characters'], 'readwrite');
            const userStore = tx.objectStore('users');
            const uReq = userStore.get(email);
            uReq.onsuccess = () => {
                if (uReq.result) {
                    uReq.result.name = clean;
                    userStore.put(uReq.result);
                }
            };
            const lbStore = tx.objectStore('leaderboard');
            const lbReq = lbStore.getAll();
            lbReq.onsuccess = () => {
                for (const row of (lbReq.result || [])) {
                    if (row.email === email) {
                        row.name = clean;
                        lbStore.put(row);
                    }
                }
            };
            const charStore = tx.objectStore('characters');
            const cReq = charStore.getAll();
            cReq.onsuccess = () => {
                for (const row of (cReq.result || [])) {
                    if (row.owner_email === email) {
                        row.owner_name = clean;
                        charStore.put(row);
                    }
                }
            };
        }
        this.saveToStorage();
        return clean;
    }

    initGoogleAuth() {
        const clientId = DEFAULT_GOOGLE_CLIENT_ID;

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
                        size: 'large',
                        shape: 'pill',
                        width: 320
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
                                    await this.loginWithOAuthProfile(
                                        profile.email,
                                        profile.name || profile.given_name || 'Google Husser',
                                        profile.picture || ''
                                    );
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
            const base64Url = jwt.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')));
            await this.loginWithOAuthProfile(
                payload.email,
                payload.name || payload.given_name || 'Google Husser',
                payload.picture || ''
            );
            document.getElementById('auth-modal').style.display = 'none';
        } catch (e) {
            console.error('Failed to decode Google JWT', e);
        }
    }

    async loginWithOAuthProfile(email, name, picture = '') {
        const preLoginState = JSON.parse(JSON.stringify(this.state));
        const finalPic = picture || this.generateFallbackAvatar(name);
        const result = await this.db.loginUser(email, '', true, name, preLoginState, finalPic);
        this.applyAuthenticatedSession(result.user, result.state, preLoginState);
    }

    async registerDatabaseAccount(email, name, password) {
        const preLoginState = JSON.parse(JSON.stringify(this.state));
        const fallbackPic = this.generateFallbackAvatar(name);
        const result = await this.db.registerUser(email, name, password, preLoginState, fallbackPic);
        this.applyAuthenticatedSession(result.user, result.state, preLoginState);
    }

    async loginDatabaseAccount(email, password) {
        const preLoginState = JSON.parse(JSON.stringify(this.state));
        const result = await this.db.loginUser(email, password, false);
        if (result.user && !result.user.picture) {
            result.user.picture = this.generateFallbackAvatar(result.user.name);
        }
        this.applyAuthenticatedSession(result.user, result.state, preLoginState);
    }

    applyAuthenticatedSession(user, dbState, guestState = null) {
        if (user && !user.picture) {
            user.picture = this.generateFallbackAvatar(user.name || 'H');
        }
        const wasGuest = !this.currentUser;
        this.currentUser = user;
        localStorage.setItem('hussr_active_user', JSON.stringify(this.currentUser));

        const base = this.getDefaultState();
        const incoming = dbState || {};
        const g = guestState || base;

        const mergedUpgrades = {
            engine: Math.max(incoming.upgrades?.engine || 1, wasGuest ? (g.upgrades?.engine || 1) : 1),
            fuel: Math.max(incoming.upgrades?.fuel || 1, wasGuest ? (g.upgrades?.fuel || 1) : 1),
            traction: Math.max(incoming.upgrades?.traction || 1, wasGuest ? (g.upgrades?.traction || 1) : 1)
        };

        const mergedRivals = Array.from(new Set([
            ...(incoming.clearedRivals || []),
            ...(wasGuest ? (g.clearedRivals || []) : [])
        ]));

        const hasDbLimbs = Object.values(incoming.limbs || {}).some(Boolean);
        const mergedLimbs = hasDbLimbs ? { ...base.limbs, ...incoming.limbs } : { ...base.limbs, ...(g.limbs || {}) };

        this.state = {
            ...base,
            ...incoming,
            scrap: Math.max(incoming.scrap ?? 60, wasGuest ? (g.scrap ?? 60) : 0),
            upgrades: mergedUpgrades,
            clearedRivals: mergedRivals,
            limbs: mergedLimbs,
            settings: { ...base.settings, ...(incoming.settings || g.settings || {}) },
            bestSpeed: Math.max(incoming.bestSpeed || 0, g.bestSpeed || 0),
            bestDistance: Math.max(incoming.bestDistance || 0, g.bestDistance || 0),
            bestScore: Math.max(incoming.bestScore || 0, g.bestScore || 0)
        };

        if (this.currentUser?.email && (this.state.bestScore > (incoming.bestScore || 0) || this.state.bestSpeed > (incoming.bestSpeed || 0))) {
            const pic = this.currentUser.picture || this.generateFallbackAvatar(this.currentUser.name || 'H');
            this.db.postScore(this.currentUser.email, this.currentUser.name || 'Husser', pic, this.state.bestSpeed, this.state.bestDistance, this.state.bestScore);
        }

        if (wasGuest && this.currentUser?.email) {
            this.db.claimLocalGuestCharacters(this.currentUser.email, this.currentUser.name);
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