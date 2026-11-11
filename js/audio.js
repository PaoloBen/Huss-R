export class SoundManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.ctx = null;
        this.unlocked = false;

        // Separate Playlists: menu_music/ for Menus, music/ for In-Game Runs
        this.gamePlaylist = [];
        this.menuPlaylist = [];
        this.currentMode = 'menu'; // 'menu' or 'game'

        this.bgmAudio = new Audio();
        this.bgmAudio.preload = 'auto';
        this.bgmAudio.addEventListener('ended', () => this.playNextTrack());
        this.bgmAudio.addEventListener('error', () => this.playNextTrack());

        // Preloaded SFX file paths (including distinct tier3 vs sonic_boom & countdown sounds)
        this.sfxFiles = {
            ui_click: 'sfx/ui_click.mp3',
            boost: 'sfx/boost.mp3',
            lean: 'sfx/lean.mp3',
            footstep: 'sfx/footstep.mp3',
            wind: 'sfx/wind.mp3',
            tier3: 'sfx/tier3.mp3',
            sonic_boom: 'sfx/sonic_boom.mp3',
            pickup: 'sfx/pickup.mp3',
            countdown_tick: 'sfx/countdown_tick.mp3',
            countdown_go: 'sfx/countdown_go.mp3'
        };
        this.sfxMissing = {};

        this.windAudio = null;
        this.footstepTimer = 0;

        this.initUnlockListeners();
        this.loadPlaylists();
    }

    get settings() {
        const s = this.dataManager?.state?.settings || {};
        return {
            musicVol: (s.musicVolume ?? 60) / 100,
            sfxVol: (s.sfxVolume ?? 80) / 100
        };
    }

    initUnlockListeners() {
        const unlock = () => {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx && !this.ctx) {
                this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            if (this.bgmAudio.paused && this.settings.musicVol > 0) {
                if (!this.bgmAudio.src) {
                    this.playNextTrack();
                } else {
                    this.bgmAudio.play().then(() => {
                        this.unlocked = true;
                    }).catch(() => {});
                }
            } else if (!this.bgmAudio.paused) {
                this.unlocked = true;
            }
        };

        ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel', 'click'].forEach(evt => {
            window.addEventListener(evt, unlock, { passive: true });
        });
    }

    async fetchTrackList(apiAction, fallbackJsonPath, folderPrefix) {
        try {
            const res = await fetch(`api.php?action=${apiAction}`);
            if (res.ok) {
                const text = await res.text();
                if (!text.trim().startsWith('<?php')) {
                    const data = JSON.parse(text);
                    if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
                        return data.tracks;
                    }
                }
            }
        } catch {}

        try {
            const res = await fetch(fallbackJsonPath);
            if (res.ok) {
                const list = await res.json();
                if (Array.isArray(list) && list.length > 0) {
                    return list.map(f => f.startsWith(`${folderPrefix}/`) ? f : `${folderPrefix}/${f}`);
                }
            }
        } catch {}
        return [];
    }

    async loadPlaylists() {
        this.gamePlaylist = await this.fetchTrackList('list_music', 'music/playlist.json', 'music');
        this.menuPlaylist = await this.fetchTrackList('list_menu_music', 'menu_music/playlist.json', 'menu_music');
        // Immediately attempt to play menu music on page load!
        if (this.bgmAudio.paused && this.settings.musicVol > 0) {
            this.playNextTrack();
        }
    }

    // Switches between 'menu' (menu_music/ folder) and 'game' (music/ folder)
    setMusicMode(mode) {
        const target = mode === 'game' ? 'game' : 'menu';
        if (this.currentMode === target && !this.bgmAudio.paused) return;
        this.currentMode = target;
        if (this.settings.musicVol > 0) {
            this.playNextTrack();
        }
    }

    playNextTrack() {
        if (this.settings.musicVol <= 0) return;
        const activeList = this.currentMode === 'game' ? this.gamePlaylist : this.menuPlaylist;

        if (!activeList || activeList.length === 0) {
            this.bgmAudio.pause();
            return;
        }

        let nextSrc = activeList[Math.floor(Math.random() * activeList.length)];
        if (activeList.length > 1 && this.bgmAudio.src && this.bgmAudio.src.endsWith(nextSrc)) {
            const alternatives = activeList.filter(t => !this.bgmAudio.src.endsWith(t));
            nextSrc = alternatives[Math.floor(Math.random() * alternatives.length)];
        }

        this.bgmAudio.src = nextSrc;
        this.bgmAudio.volume = Math.max(0, Math.min(1, this.settings.musicVol));
        this.bgmAudio.play().then(() => {
            this.unlocked = true;
        }).catch(() => {});
    }

    applyMusicVolume() {
        const vol = Math.max(0, Math.min(1, this.settings.musicVol));
        this.bgmAudio.volume = vol;
        if (vol <= 0 && !this.bgmAudio.paused) {
            this.bgmAudio.pause();
        } else if (vol > 0 && this.bgmAudio.paused && this.unlocked) {
            const activeList = this.currentMode === 'game' ? this.gamePlaylist : this.menuPlaylist;
            if (activeList && activeList.length > 0) {
                if (!this.bgmAudio.src) this.playNextTrack();
                else this.bgmAudio.play().catch(() => {});
            }
        }
    }

    playSfx(name, playbackRate = 1.0, volumeScale = 1.0) {
        const vol = Math.max(0, Math.min(1, this.settings.sfxVol * volumeScale));
        if (vol <= 0) return;

        const src = this.sfxFiles[name];
        if (src && !this.sfxMissing[name]) {
            const audio = new Audio(src);
            audio.volume = vol;
            audio.playbackRate = Math.max(0.5, Math.min(2.5, playbackRate));
            audio.play().catch(() => {
                this.sfxMissing[name] = true;
                this.playProceduralFallback(name, vol);
            });
            return;
        }

        this.playProceduralFallback(name, vol);
    }

    playProceduralFallback(name, vol) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (name === 'ui_click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);
            gain.gain.setValueAtTime(vol * 0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (name === 'countdown_tick') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            gain.gain.setValueAtTime(vol * 0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (name === 'countdown_go') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.22);
            gain.gain.setValueAtTime(vol * 0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (name === 'pickup') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(580, now);
            osc.frequency.exponentialRampToValueAtTime(1120, now + 0.11);
            gain.gain.setValueAtTime(vol * 0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (name === 'boost') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);
            gain.gain.setValueAtTime(vol * 0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (name === 'lean') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(130, now + 0.09);
            gain.gain.setValueAtTime(vol * 0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (name === 'footstep') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(115, now);
            osc.frequency.exponentialRampToValueAtTime(48, now + 0.04);
            gain.gain.setValueAtTime(vol * 0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (name === 'tier3') {
            // Distinct rising turbine overdrive chord for Tier 3 (501 m/s)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(660, now + 0.32);
            gain.gain.setValueAtTime(vol * 0.26, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.36);
        } else if (name === 'sonic_boom') {
            // Heavy shockwave detonation for 650+ m/s Sonic Boom Cone
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(22, now + 0.55);
            gain.gain.setValueAtTime(vol * 0.42, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
            osc.start(now);
            osc.stop(now + 0.6);
        }
    }

    updateRunnerAudio(dt, vx, grounded, isDiving, active) {
        const sfxVol = this.settings.sfxVol;
        if (!active || sfxVol <= 0) {
            if (this.windAudio && !this.windAudio.paused) this.windAudio.pause();
            return;
        }

        if (grounded && !isDiving && vx > 80) {
            const stepInterval = Math.max(0.085, 0.34 - (vx / 6000) * 0.22);
            this.footstepTimer -= dt;
            if (this.footstepTimer <= 0) {
                this.footstepTimer = stepInterval;
                const pitch = Math.min(1.6, 0.9 + vx / 4500);
                this.playSfx('footstep', pitch, 0.45);
            }
        }

        if (!this.sfxMissing.wind) {
            if (!this.windAudio) {
                this.windAudio = new Audio(this.sfxFiles.wind);
                this.windAudio.loop = true;
                this.windAudio.addEventListener('error', () => {
                    this.sfxMissing.wind = true;
                });
            }
            const windIntensity = Math.max(0, Math.min(1, (vx - 1200) / 5500));
            if (windIntensity > 0.02 && this.unlocked) {
                this.windAudio.volume = windIntensity * sfxVol * 0.65;
                if (this.windAudio.paused) this.windAudio.play().catch(() => {});
            } else if (!this.windAudio.paused) {
                this.windAudio.pause();
            }
        }
    }
}