/**
 * ══════════════════════════════════════════════════════════════════════════
 * AudioManager - Web Audio Handler for Boot Sequence
 * ══════════════════════════════════════════════════════════════════════════
 * A lightweight audio manager using vanilla Web Audio API.
 * Handles sound effects with caching, volume control, and graceful fallbacks.
 */

class AudioManager {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.volume = Math.max(0, Math.min(1, options.volume || 0.4));
        this.basePath = options.basePath || './assets/audio/';
        
        // Audio element cache
        this._cache = new Map();
        
        // Track if user has interacted (needed for autoplay policies)
        this._userInteracted = false;
        this._pendingPlays = [];
        
        // Setup interaction listener for autoplay policy
        this._setupInteractionListener();
    }
    
    /**
     * Setup listener for first user interaction
     * Required by modern browsers for audio playback
     */
    _setupInteractionListener() {
        const unlockAudio = () => {
            this._userInteracted = true;
            
            // Play any pending sounds
            while (this._pendingPlays.length > 0) {
                const play = this._pendingPlays.shift();
                play();
            }
            
            // Remove listeners after first interaction
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
        
        document.addEventListener('click', unlockAudio, { once: true, passive: true });
        document.addEventListener('keydown', unlockAudio, { once: true, passive: true });
        document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    }

    /**
     * Create a sound object with play method
     */
    _createSound(filename) {
        const self = this;
        
        return {
            play: () => {
                if (!self.enabled) return Promise.resolve();
                
                const doPlay = () => {
                    try {
                        // Check cache first
                        let audio = self._cache.get(filename);
                        
                        if (audio) {
                            // Clone for overlapping sounds
                            const clone = audio.cloneNode();
                            clone.volume = self.volume;
                            return clone.play().catch(() => {});
                        }
                        
                        // Create and cache new audio element
                        audio = new Audio(self.basePath + filename);
                        audio.volume = self.volume;
                        audio.preload = 'auto';
                        
                        // Cache after loading
                        audio.addEventListener('canplaythrough', () => {
                            self._cache.set(filename, audio);
                        }, { once: true });
                        
                        return audio.play().catch(() => {});
                    } catch (e) {
                        // Silently fail - audio is non-critical
                        return Promise.resolve();
                    }
                };
                
                // If user hasn't interacted yet, queue the play
                if (!self._userInteracted) {
                    self._pendingPlays.push(doPlay);
                    return Promise.resolve();
                }
                
                return doPlay();
            },
            
            // Preload audio file
            preload: () => {
                if (!self.enabled || self._cache.has(filename)) return;
                
                const audio = new Audio(self.basePath + filename);
                audio.preload = 'auto';
                audio.volume = 0;
                
                audio.addEventListener('canplaythrough', () => {
                    self._cache.set(filename, audio);
                }, { once: true });
            }
        };
    }
    
    /**
     * Set master volume
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
    
    /**
     * Enable/disable audio
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Clear audio cache
     */
    clearCache() {
        this._cache.clear();
    }

    // Sound getters - lazy loading
    get stdout() { return this._createSound('stdout.wav'); }
    get stdin() { return this._createSound('stdin.wav'); }
    get granted() { return this._createSound('granted.wav'); }
    get denied() { return this._createSound('denied.wav'); }
    get theme() { return this._createSound('theme.wav'); }
    get expand() { return this._createSound('expand.wav'); }
    get folder() { return this._createSound('folder.wav'); }
    get info() { return this._createSound('info.wav'); }
    get error() { return this._createSound('error.wav'); }
    get keyboard() { return this._createSound('keyboard.wav'); }
    get alarm() { return this._createSound('alarm.wav'); }
    get scan() { return this._createSound('scan.wav'); }
    get panels() { return this._createSound('panels.wav'); }
}

// Export for use
window.AudioManager = AudioManager;
