// Locked Google OAuth Client ID for localhost & dcism.org
localStorage.removeItem('hussr_google_client_id');
const DEFAULT_GOOGLE_CLIENT_ID = '121807512209-tbbim304g4agfm3lan9g6eobjupo8s94.apps.googleusercontent.com';

// Expanded 20-Mission Story Campaign with Aggressive Rivals, Longer Strips & Progressive Speed Tiers
export const STORY_RIVALS = [
    {
        id: 'rival_1',
        name: 'Ace "Flash" Mendoza',
        title: 'Campus Track Captain',
        stageName: 'Mission 1: Campus Expressway 1,200m',
        distanceMeters: 1200,
        baseSpeed: 2100,
        dashThrust: 1250,
        dashFreq: 0.58,
        rewardScrap: 120,
        backdrop: 'day',
        colors: { primary: '#f43f5e', secondary: '#0f172a', visor: '#38bdf8', style: 'aero' },
        desc: '1,200m Campus Expressway • Ace chains downhill leans and boost surges right out of the blocks. Use Lean on every slope to keep pace!',
        dialogue: [
            { speaker: 'Ace "Flash" Mendoza', side: 'right', text: 'You actually built your own Husser rig from scratch? Most rookies just buy a stock frame.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Stock frames have speed limiters. Mine doesn\'t. Ready to put your record on the line?' },
            { speaker: 'Ace "Flash" Mendoza', side: 'right', text: '1,200 meters down the expressway. Don\'t blink or my boost wake will leave you in the dust!' }
        ]
    },
    {
        id: 'rival_2',
        name: 'Vektor-01',
        title: 'Regional Grid Scout',
        stageName: 'Mission 2: Neo-Cebu Coastal 1,800m',
        distanceMeters: 1800,
        baseSpeed: 2850,
        dashThrust: 1500,
        dashFreq: 0.64,
        rewardScrap: 200,
        backdrop: 'sunset',
        colors: { primary: '#eab308', secondary: '#1e1b4b', visor: '#f43f5e', style: 'visor_x' },
        desc: '1,800m Coastal Highway • Vektor-01 dives aggressively into every downhill and sprints inside Tier 2.',
        dialogue: [
            { speaker: 'Vektor-01', side: 'right', text: 'Kinetic signature locked. Your campus sprint triggered our orbital speed sensors across Cebu.' },
            { speaker: 'You (Husser)', side: 'left', text: '1,200 meters was barely enough room to warm up my engine.' },
            { speaker: 'Vektor-01', side: 'right', text: 'This coastal strip has real elevation drops. Lean into the downhills or get left behind!' }
        ]
    },
    {
        id: 'rival_3',
        name: 'Kestrel-IX',
        title: 'Aero Canyon Stalker',
        stageName: 'Mission 3: Horizon Canyon 2,500m',
        distanceMeters: 2500,
        baseSpeed: 3600,
        dashThrust: 1750,
        dashFreq: 0.68,
        rewardScrap: 300,
        backdrop: 'sunset',
        colors: { primary: '#a855f7', secondary: '#090d16', visor: '#4ade80', style: 'valkyrie' },
        desc: '2,500m Canyon Drop • Kestrel-IX launches off ski ramps and nose-dives in midair to convert altitude into raw speed.',
        dialogue: [
            { speaker: 'Kestrel-IX', side: 'right', text: 'Rookies love launching off canyon ramps until they float too long and miss the downslope.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Hold Lean in midair to dive straight into the slope and double the pump. I know the drill.' },
            { speaker: 'Kestrel-IX', side: 'right', text: 'Let\'s see if your nerve holds at 360 meters per second!' }
        ]
    },
    {
        id: 'rival_4',
        name: 'Volt-Raider Kai',
        title: 'Maglev Conduit Runner',
        stageName: 'Mission 4: Maglev Viaduct 3,200m',
        distanceMeters: 3200,
        baseSpeed: 4400,
        dashThrust: 2050,
        dashFreq: 0.72,
        rewardScrap: 420,
        backdrop: 'day',
        colors: { primary: '#22c55e', secondary: '#0f172a', visor: '#facc15', style: 'aero' },
        desc: '3,200m Maglev Line • Kai chains rapid capacitor boosts across every flat and uphill section.',
        dialogue: [
            { speaker: 'Volt-Raider Kai', side: 'right', text: 'The Maglev Viaduct is pure rhythm. Waste your Boost in midair and you\'re toast.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Boost the flats, dive the drops, and draft your slipstream. Got it.' },
            { speaker: 'Volt-Raider Kai', side: 'right', text: 'First one to the 3,200-meter pylon takes the scrap bounty!' }
        ]
    },
    {
        id: 'rival_5',
        name: 'Siren-V',
        title: 'Sonic Valkyrie',
        stageName: 'Mission 5: Sound Barrier Corridor 4,000m',
        distanceMeters: 4000,
        baseSpeed: 5300,
        dashThrust: 2350,
        dashFreq: 0.76,
        rewardScrap: 560,
        backdrop: 'night',
        colors: { primary: '#06b6d4', secondary: '#0f172a', visor: '#fde047', style: 'valkyrie' },
        desc: '4,000m Sub-Sonic Corridor • Siren-V breaks 501 m/s into Tier 3, shattering obstacles in her wake.',
        dialogue: [
            { speaker: 'Siren-V', side: 'right', text: 'Past 501 meters per second, the sky turns crimson and obstacles shatter on impact.' },
            { speaker: 'You (Husser)', side: 'left', text: 'My frame is built for Tier 3 overdrive. Let\'s make some noise.' },
            { speaker: 'Siren-V', side: 'right', text: 'Try to survive my shockwave wake!' }
        ]
    },
    {
        id: 'rival_6',
        name: 'Blaze-Hound Rex',
        title: 'Dune Afterburner',
        stageName: 'Mission 6: Scorched Basin 4,800m',
        distanceMeters: 4800,
        baseSpeed: 6200,
        dashThrust: 2650,
        dashFreq: 0.78,
        rewardScrap: 720,
        backdrop: 'sunset',
        colors: { primary: '#f97316', secondary: '#1c1917', visor: '#fef08a', style: 'oni' },
        desc: '4,800m Desert Basin • Rex uses massive sand dune bowls to sling himself toward the sound barrier.',
        dialogue: [
            { speaker: 'Blaze-Hound Rex', side: 'right', text: 'These desert bowls will launch you into the stratosphere if you don\'t lean the crests!' },
            { speaker: 'You (Husser)', side: 'left', text: 'Or I can launch off the crest and dive-bomb the next dune for even more speed.' },
            { speaker: 'Blaze-Hound Rex', side: 'right', text: 'Hah! Eat my sand plume!' }
        ]
    },
    {
        id: 'rival_7',
        name: 'Chronos-Zero',
        title: 'Temporal Horizon Unit',
        stageName: 'Mission 7: Supersonic Array 5,600m',
        distanceMeters: 5600,
        baseSpeed: 7200,
        dashThrust: 2950,
        dashFreq: 0.80,
        rewardScrap: 900,
        backdrop: 'night',
        colors: { primary: '#38bdf8', secondary: '#1e1b4b', visor: '#f43f5e', style: 'crown' },
        desc: '5,600m Supersonic Array • Chronos-Zero cruises past 650 m/s wrapped in a full Prandtl-Glauert Mach vapor cone.',
        dialogue: [
            { speaker: 'Chronos-Zero', side: 'right', text: 'At 650 meters per second, a supersonic Mach cone locks around your chassis.' },
            { speaker: 'You (Husser)', side: 'left', text: 'I\'ve been waiting to see our twin sonic booms light up the night sky.' },
            { speaker: 'Chronos-Zero', side: 'right', text: ' synchronization complete. Engage!' }
        ]
    },
    {
        id: 'rival_8',
        name: 'Frost-Viper Lyra',
        title: 'Glacier Apex Drifter',
        stageName: 'Mission 8: Boreal Ridge 6,500m',
        distanceMeters: 6500,
        baseSpeed: 8300,
        dashThrust: 3300,
        dashFreq: 0.82,
        rewardScrap: 1100,
        backdrop: 'day',
        colors: { primary: '#67e8f9', secondary: '#0f172a', visor: '#f43f5e', style: 'halo' },
        desc: '6,500m Alpine Ridge • Lyra carves down steep mountain drops at over 800 m/s.',
        dialogue: [
            { speaker: 'Frost-Viper Lyra', side: 'right', text: 'Mountain inclines will kill your momentum if you hold Lean on the way up.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Release on the climb, slam Lean on the peak, and ride the avalanche down.' },
            { speaker: 'Frost-Viper Lyra', side: 'right', text: ' Let\'s see if you can outrun an avalanche!' }
        ]
    },
    {
        id: 'rival_9',
        name: 'Nova-Specter',
        title: 'Quantum Slipstream Phantom',
        stageName: 'Mission 9: Quantum Causeway 7,500m',
        distanceMeters: 7500,
        baseSpeed: 9500,
        dashThrust: 3650,
        dashFreq: 0.84,
        rewardScrap: 1350,
        backdrop: 'night',
        colors: { primary: '#c084fc', secondary: '#090d16', visor: '#38bdf8', style: 'valkyrie' },
        desc: '7,500m Quantum Causeway • Nova-Specter pushes nearly 1,000 m/s with relentless afterimage bursts.',
        dialogue: [
            { speaker: 'Nova-Specter', side: 'right', text: 'My afterimages aren\'t holograms—they\'re phase-shifted snapshots left in my wake.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Then I\'ll just have to stay ahead of the real you.' },
            { speaker: 'Nova-Specter', side: 'right', text: '7,500 meters. Zero margin for error!' }
        ]
    },
    {
        id: 'rival_10',
        name: 'Titan-Goliath',
        title: 'Heavy Siege Juggernaut',
        stageName: 'Mission 10: Ironworks Autobahn 8,500m',
        distanceMeters: 8500,
        baseSpeed: 10800,
        dashThrust: 4050,
        dashFreq: 0.86,
        rewardScrap: 1650,
        backdrop: 'sunset',
        colors: { primary: '#f59e0b', secondary: '#18181b', visor: '#ef4444', style: 'oni' },
        desc: '8,500m Industrial Autobahn • Goliath\'s heavy chassis generates terrifying downhill momentum past 1,080 m/s.',
        dialogue: [
            { speaker: 'Titan-Goliath', side: 'right', text: 'Mass times gravity! Once my heavy frame tips downhill, nothing stops me!' },
            { speaker: 'You (Husser)', side: 'left', text: 'Good thing my traction upgrades pump twice as hard on the landings.' },
            { speaker: 'Titan-Goliath', side: 'right', text: 'Clear the lane, little Husser!' }
        ]
    },
    {
        id: 'rival_11',
        name: 'Zephyr-Prime',
        title: 'Stratosphere Jetstream',
        stageName: 'Mission 11: Cloudbreak Spire 9,600m',
        distanceMeters: 9600,
        baseSpeed: 12200,
        dashThrust: 4450,
        dashFreq: 0.88,
        rewardScrap: 2000,
        backdrop: 'day',
        colors: { primary: '#38bdf8', secondary: '#f8fafc', visor: '#0284c7', style: 'halo' },
        desc: '9,600m Skyway • Zephyr-Prime crosses 1,200 m/s, igniting a scorching meteorite Fire Cone.',
        dialogue: [
            { speaker: 'Zephyr-Prime', side: 'right', text: 'At 1,200 meters per second, atmospheric compression ignites the air into a plasma fire cone.' },
            { speaker: 'You (Husser)', side: 'left', text: 'So that\'s the orange streak I saw across the clouds.' },
            { speaker: 'Zephyr-Prime', side: 'right', text: 'Ignite your atmospheric shield and follow me up!' }
        ]
    },
    {
        id: 'rival_12',
        name: 'Crimson-Ronin',
        title: 'Cyber Blade Interceptor',
        stageName: 'Mission 12: Neon Shogunate 10,800m',
        distanceMeters: 10800,
        baseSpeed: 13800,
        dashThrust: 4900,
        dashFreq: 0.89,
        rewardScrap: 2400,
        backdrop: 'night',
        colors: { primary: '#ef4444', secondary: '#090d16', visor: '#fde047', style: 'oni' },
        desc: '10,800m Hypersonic Strip • Ronin sprints inside Tier 4 Hypersonic velocity (1,380+ m/s) where the sky burns amber.',
        dialogue: [
            { speaker: 'Crimson-Ronin', side: 'right', text: '10,000 meters is where amateurs fade. True Hypersonic combat begins at 1,250 m/s.' },
            { speaker: 'You (Husser)', side: 'left', text: 'The 10,000m Proving Straight is my favorite part of the track.' },
            { speaker: 'Crimson-Ronin', side: 'right', text: 'Draw your speed! Let the fastest blade win!' }
        ]
    },
    {
        id: 'rival_13',
        name: 'Mirage-X',
        title: 'Solar Flare Illusionist',
        stageName: 'Mission 13: Sunburst Mirage 12,000m',
        distanceMeters: 12000,
        baseSpeed: 15500,
        dashThrust: 5350,
        dashFreq: 0.90,
        rewardScrap: 2850,
        backdrop: 'sunset',
        colors: { primary: '#fde047', secondary: '#451a03', visor: '#38bdf8', style: 'visor_x' },
        desc: '12,000m Solar Corridor • Mirage-X sustains 1,550 m/s with relentless midair dive-pumps.',
        dialogue: [
            { speaker: 'Mirage-X', side: 'right', text: 'In the heat haze at 1,550 meters per second, you won\'t know if you\'re chasing me or my afterimage.' },
            { speaker: 'You (Husser)', side: 'left', text: 'I\'ll just pass all of them to be sure.' },
            { speaker: 'Mirage-X', side: 'right', text: 'Catch the sun if you can!' }
        ]
    },
    {
        id: 'rival_14',
        name: 'Aegis-Valkyrie',
        title: 'Orbital Defense Enforcer',
        stageName: 'Mission 14: Orbital Tether 13,500m',
        distanceMeters: 13500,
        baseSpeed: 17400,
        dashThrust: 5850,
        dashFreq: 0.91,
        rewardScrap: 3350,
        backdrop: 'day',
        colors: { primary: '#60a5fa', secondary: '#1e293b', visor: '#4ade80', style: 'valkyrie' },
        desc: '13,500m Orbital Causeway • High-altitude jumps launch runners toward the dark edge of space.',
        dialogue: [
            { speaker: 'Aegis-Valkyrie', side: 'right', text: 'Launch too high off these ramps without leaning and you\'ll literally enter low-Earth orbit.' },
            { speaker: 'You (Husser)', side: 'left', text: 'And dive-leaning from space gives the biggest speed boost in the world.' },
            { speaker: 'Aegis-Valkyrie', side: 'right', text: 'Cleared for Mach 5 takeoff!' }
        ]
    },
    {
        id: 'rival_15',
        name: 'Void-Reaper',
        title: 'Dark Matter Anomaly',
        stageName: 'Mission 15: Abyssal Rift 15,000m',
        distanceMeters: 15000,
        baseSpeed: 19500,
        dashThrust: 6400,
        dashFreq: 0.92,
        rewardScrap: 3900,
        backdrop: 'night',
        colors: { primary: '#a855f7', secondary: '#030712', visor: '#ec4899', style: 'crown' },
        desc: '15,000m Abyssal Rift • Void-Reaper hovers right on the verge of 2,000 m/s solar overdrive.',
        dialogue: [
            { speaker: 'Void-Reaper', side: 'right', text: 'Fifteen kilometers at nearly two kilometers per second. Most cores melt before the halfway mark.' },
            { speaker: 'You (Husser)', side: 'left', text: 'My stamina and engine upgrades were forged for this distance.' },
            { speaker: 'Void-Reaper', side: 'right', text: 'Step into the void!' }
        ]
    },
    {
        id: 'rival_16',
        name: 'Helios-Overdrive',
        title: 'Solar Core Sprinter',
        stageName: 'Mission 16: Corona Highway 16,800m',
        distanceMeters: 16800,
        baseSpeed: 21800,
        dashThrust: 7000,
        dashFreq: 0.93,
        rewardScrap: 4500,
        backdrop: 'sunset',
        colors: { primary: '#facc15', secondary: '#7c2d12', visor: '#ffffff', style: 'halo' },
        desc: '16,800m Corona Highway • Past 2,000 m/s, Helios-Overdrive radiates a blinding golden solar aura.',
        dialogue: [
            { speaker: 'Helios-Overdrive', side: 'right', text: 'Cross 2,000 meters per second and your entire rig ignites with a golden overdrive aura!' },
            { speaker: 'You (Husser)', side: 'left', text: 'Then let\'s turn this highway into a twin star.' },
            { speaker: 'Helios-Overdrive', side: 'right', text: 'Full solar output—GO!' }
        ]
    },
    {
        id: 'rival_17',
        name: 'Nebula-Empress',
        title: 'Starlight Tachyon Runner',
        stageName: 'Mission 17: Astral Beltway 18,600m',
        distanceMeters: 18600,
        baseSpeed: 24200,
        dashThrust: 7600,
        dashFreq: 0.94,
        rewardScrap: 5200,
        backdrop: 'night',
        colors: { primary: '#ec4899', secondary: '#1e1b4b', visor: '#67e8f9', style: 'crown' },
        desc: '18,600m Astral Beltway • Empress sprints at 2,420 m/s on the threshold of blue-plasma ignition.',
        dialogue: [
            { speaker: 'Nebula-Empress', side: 'right', text: 'You\'ve defeated sixteen champions, Earth runner. But can you sustain Mach 7 across 18.6 kilometers?' },
            { speaker: 'You (Husser)', side: 'left', text: 'Every 10,000m speed test zone only makes me faster.' },
            { speaker: 'Nebula-Empress', side: 'right', text: 'Dazzle me with your velocity!' }
        ]
    },
    {
        id: 'rival_18',
        name: 'Hyperion-Mk9',
        title: 'Blue-Plasma Dreadnought',
        stageName: 'Mission 18: Cherenkov Conduit 20,500m',
        distanceMeters: 20500,
        baseSpeed: 27000,
        dashThrust: 8300,
        dashFreq: 0.95,
        rewardScrap: 6000,
        backdrop: 'night',
        colors: { primary: '#38bdf8', secondary: '#090d16', visor: '#fde047', style: 'visor_x' },
        desc: '20,500m Cherenkov Conduit • Past 2,500 m/s, Hyperion\'s fire cone superheats into electric blue plasma!',
        dialogue: [
            { speaker: 'Hyperion-Mk9', side: 'right', text: 'At 2,500 meters per second, orange fire is too cold. Our wakes burn pure electric blue!' },
            { speaker: 'You (Husser)', side: 'left', text: 'Two Proving Straights in one race—time to unleash blue plasma.' },
            { speaker: 'Hyperion-Mk9', side: 'right', text: 'Maximum thruster output engaged!' }
        ]
    },
    {
        id: 'rival_19',
        name: 'Singularity-Zero',
        title: 'Event Horizon Warden',
        stageName: 'Mission 19: Event Horizon 22,500m',
        distanceMeters: 22500,
        baseSpeed: 30000,
        dashThrust: 9100,
        dashFreq: 0.96,
        rewardScrap: 7000,
        backdrop: 'night',
        colors: { primary: '#818cf8', secondary: '#020617', visor: '#f43f5e', style: 'oni' },
        desc: '22,500m Event Horizon • Singularity-Zero warps across the track at 3,000 m/s.',
        dialogue: [
            { speaker: 'Singularity-Zero', side: 'right', text: 'Three thousand meters per second. Only OMEGA-HUSS stands beyond my gate.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Then excuse me while I warp right through your gate.' },
            { speaker: 'Singularity-Zero', side: 'right', text: 'Prove yourescape velocity!' }
        ]
    },
    {
        id: 'rival_20',
        name: 'OMEGA-HUSS',
        title: 'Multiversal Grandmaster',
        stageName: 'Mission 20: Multiversal Apex 25,000m',
        distanceMeters: 25000,
        baseSpeed: 34000,
        dashThrust: 10200,
        dashFreq: 0.98,
        rewardScrap: 10000,
        backdrop: 'night',
        colors: { primary: '#ec4899', secondary: '#ffffff', visor: '#38bdf8', style: 'crown' },
        desc: '25,000m Grand Finale • The reigning Multiversal Grandmaster commands blue-plasma hypersonic speeds past 3,400 m/s!',
        dialogue: [
            { speaker: 'OMEGA-HUSS', side: 'right', text: 'Across ten thousand timelines, nineteen wardens tried to halt your ascent. Yet here you stand at the 25-kilometer Apex Gate.' },
            { speaker: 'You (Husser)', side: 'left', text: 'Started on the campus track. Now I\'m taking the title of Fastest Thing Alive.' },
            { speaker: 'OMEGA-HUSS', side: 'right', text: 'Ignite your core! Show the multiverse what true hypersonic perfection looks like!' }
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

        this.adminUnlockAll = false;
        this.systemModels = {};
        try {
            const cachedModels = localStorage.getItem('hussr_system_models_v1');
            if (cachedModels) this.systemModels = JSON.parse(cachedModels) || {};
        } catch {}

        this.bootSyncDone = false;
        this.state = this.getDefaultState();
        this.loadFromStorage();
        if (!this.currentUser) this.bootSyncDone = true;
        this.initGoogleAuth();
        this.pullCloudStateOnBoot();
        this.pullSystemModelsOnBoot();
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
            if (this.currentUser && this.currentUser.email && this.bootSyncDone) {
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

    async pullSystemModelsOnBoot() {
        const res = await this.db.apiCall('get_system_models', 'GET');
        if (res && res.ok && res.models) {
            this.systemModels = res.models;
            try {
                localStorage.setItem('hussr_system_models_v1', JSON.stringify(this.systemModels));
            } catch {}
            if (this.onProfileChange) this.onProfileChange(this.state, this.currentUser);
        }
    }

    getSystemModel(modelKey) {
        return this.systemModels?.[modelKey] || null;
    }

    getDefaultTemplateLimbs() {
        return this.systemModels?.['default_template']?.limbs || null;
    }

    getRivalCustomLimbs(rivalId) {
        return this.systemModels?.[rivalId]?.limbs || null;
    }

    applyRivalModelToRig(rig, rivalSpec) {
        if (!rig || !rivalSpec) return;
        const customLimbs = this.getRivalCustomLimbs(rivalSpec.id);
        if (customLimbs && Object.values(customLimbs).some(Boolean)) {
            rig.generatePresetTextures(rivalSpec.colors);
            rig.loadFromLimbMap(customLimbs);
        } else {
            rig.generatePresetTextures(rivalSpec.colors);
        }
    }

    async adminSaveSystemModel(modelKey, limbs, trailColor = '#38bdf8') {
        if (!this.isAdmin()) throw new Error('Admin privileges required.');
        this.systemModels[modelKey] = { limbs: { ...limbs }, trailColor, updated_at: Date.now() };
        try {
            localStorage.setItem('hussr_system_models_v1', JSON.stringify(this.systemModels));
        } catch {}
        const res = await this.db.apiCall('admin_save_system_model', 'POST', {
            adminEmail: this.currentUser.email,
            modelKey,
            limbs,
            trailColor
        });
        if (!res || !res.ok) throw new Error(res?.error || 'Failed to save system model.');
        return res;
    }

    async adminResetSystemModel(modelKey) {
        if (!this.isAdmin()) throw new Error('Admin privileges required.');
        delete this.systemModels[modelKey];
        try {
            localStorage.setItem('hussr_system_models_v1', JSON.stringify(this.systemModels));
        } catch {}
        const res = await this.db.apiCall('admin_reset_system_model', 'POST', {
            adminEmail: this.currentUser.email,
            modelKey
        });
        if (!res || !res.ok) throw new Error(res?.error || 'Failed to reset system model.');
        return res;
    }

    async pullCloudStateOnBoot() {
        if (!this.currentUser || !this.currentUser.email) {
            this.bootSyncDone = true;
            return;
        }
        const apiRes = await this.db.apiCall(`get_state&email=${encodeURIComponent(this.currentUser.email)}`, 'GET');
        this.bootSyncDone = true;
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

        this.bootSyncDone = true;
        const adminEdited = (incoming.adminEditedAt || 0) > (g.lastCloudSyncAt || 0);
        const mergedUpgrades = adminEdited ? {
            engine: incoming.upgrades?.engine || 1,
            fuel: incoming.upgrades?.fuel || 1,
            traction: incoming.upgrades?.traction || 1
        } : {
            engine: Math.max(incoming.upgrades?.engine || 1, g.upgrades?.engine || 1),
            fuel: Math.max(incoming.upgrades?.fuel || 1, g.upgrades?.fuel || 1),
            traction: Math.max(incoming.upgrades?.traction || 1, g.upgrades?.traction || 1)
        };

        const mergedRivals = adminEdited
            ? [...(incoming.clearedRivals || [])]
            : Array.from(new Set([...(incoming.clearedRivals || []), ...(g.clearedRivals || [])]));

        const hasDbLimbs = Object.values(incoming.limbs || {}).some(Boolean);
        const mergedLimbs = hasDbLimbs ? { ...base.limbs, ...incoming.limbs } : { ...base.limbs, ...(g.limbs || {}) };

        this.state = {
            ...base,
            ...incoming,
            scrap: adminEdited ? (incoming.scrap ?? 60) : Math.max(incoming.scrap ?? 60, wasGuest ? (g.scrap ?? 60) : 0),
            upgrades: mergedUpgrades,
            clearedRivals: mergedRivals,
            limbs: mergedLimbs,
            settings: { ...base.settings, ...(incoming.settings || g.settings || {}) },
            bestSpeed: Math.max(incoming.bestSpeed || 0, g.bestSpeed || 0),
            bestDistance: Math.max(incoming.bestDistance || 0, g.bestDistance || 0),
            bestScore: Math.max(incoming.bestScore || 0, g.bestScore || 0),
            lastCloudSyncAt: Date.now()
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