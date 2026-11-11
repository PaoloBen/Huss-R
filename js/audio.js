export class SoundManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.ctx = null;
        this.unlocked = false;

        // Playlist state
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.bgmAudio = new Audio();
        this.bgmAudio.preload = 'auto';
        this.bgmAudio.addEventListener('ended', () => this.playNextTrack());
        this.bgmAudio.addEventListener('error', () => {
            if (this.playlist.length > 1) this.playNextTrack();
        });

        // Preloaded SFX file cache
        this.sfxFiles = {
            ui_click: 'sfx/ui_click.mp3',
            boost: 'sfx/boost.mp3',
            lean: 'sfx/lean.mp3',
            footstep: 'sfx/footstep.mp3',
            wind: 'sfx/wind.mp3',
            sonic_boom: 'sfx/sonic_boom.mp3',
            pickup: 'sfx/pickup.mp3'
        };
        this.sfxPool = {};
        this.sfxMissing = {};

        // Continuous wind loop state
        this.windAudio = null;
        this.footstepTimer = 0;

        this.initUnlockListeners();
        this.loadPlaylist();
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
            if (this.unlocked) return;
            this.unlocked = true;
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx && !this.ctx) {
                this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            this.applyMusicVolume();
            if (this.playlist.length > 0 && this.bgmAudio.paused && this.settings.musicVol > 0) {
                this.playNextTrack();
            }
        };

        window.addEventListener('pointerdown', unlock, { passive: true });
        window.addEventListener('keydown', unlock, { passive: true });
        window.addEventListener('touchstart', unlock, { passive: true });
    }

    async loadPlaylist() {
        // 1. Try scanning music/ directory via api.php
        try {
            const res = await fetch('api.php?action=list_music');
            if (res.ok) {
                const text = await res.text();
                if (!text.trim().startsWith('<?php')) {
                    const data = JSON.parse(text);
                    if (data && Array.isArray(data.tracks) && data.tracks.length > 0) {
                        this.playlist = this.shuffleArray(data.tracks);
                        return;
                    }
                }
            }
        } catch {}

        // 2. Fallback for static localhost: check music/playlist.json
        try {
            const res = await fetch('music/playlist.json');
            if (res.ok) {
                const list = await res.json();
                if (Array.isArray(list) && list.length > 0) {
                    this.playlist = this.shuffleArray(list.map(f => f.startsWith('music/') ? f : `music/${f}`));
                }
            }
        } catch {}
    }

    shuffleArray(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    playNextTrack() {
        if (this.playlist.length === 0 || this.settings.musicVol <= 0) return;
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        if (this.currentTrackIndex === 0 && this.playlist.length > 1) {
            this.playlist = this.shuffleArray(this.playlist);
        }
        this.bgmAudio.src = this.playlist[this.currentTrackIndex];
        this.applyMusicVolume();
        this.bgmAudio.play().catch(() => {});
    }

    applyMusicVolume() {
        const vol = Math.max(0, Math.min(1, this.settings.musicVol));
        this.bgmAudio.volume = vol;
        if (vol <= 0 && !this.bgmAudio.paused) {
            this.bgmAudio.pause();
        } else if (vol > 0 && this.bgmAudio.paused && this.unlocked && this.playlist.length > 0) {
            if (!this.bgmAudio.src) this.playNextTrack();
            else this.bgmAudio.play().catch(() => {});
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

    // Clean Web Audio synth fallback if an sfx/*.mp3 file hasn't been uploaded yet
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
            gain.gain.setValueAtTime(vol * 0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
            osc.start(now);
            osc.stop(now + 0.05);
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
        } else if (name === 'sonic_boom') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(95, now);
            osc.frequency.exponentialRampToValueAtTime(28, now + 0.45);
            gain.gain.setValueAtTime(vol * 0.38, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
            osc.start(now);
            osc.stop(now + 0.5);
        }
    }

    updateRunnerAudio(dt, vx, grounded, isDiving, active) {
        const sfxVol = this.settings.sfxVol;
        if (!active || sfxVol <= 0) {
            if (this.windAudio && !this.windAudio.paused) this.windAudio.pause();
            return;
        }

        // Footstep cadence when running on ground
        if (grounded && !isDiving && vx > 80) {
            const stepInterval = Math.max(0.085, 0.34 - (vx / 6000) * 0.22);
            this.footstepTimer -= dt;
            if (this.footstepTimer <= 0) {
                this.footstepTimer = stepInterval;
                const pitch = Math.min(1.6, 0.9 + vx / 4500);
                this.playSfx('footstep', pitch, 0.45);
            }
        }

        // Dynamic Wind Loop from sfx/wind.mp3
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