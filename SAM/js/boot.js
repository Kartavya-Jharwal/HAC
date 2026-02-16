/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  BOOT SEQUENCE - Standalone Splash Screen                               │
 * │  Ported from eDEX-UI / SAM Dashboard                                    │
 * │                                                                         │
 * │  A plug-and-play boot/splash sequence for tech projects.                │
 * │  Drop this folder into your project and configure BOOT_CONFIG below.   │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * USAGE:
 *   1. Copy boot-standalone/ folder into your project
 *   2. Edit BOOT_CONFIG below to customize
 *   3. Link to index.html or embed in your page
 *   4. Set onComplete callback for post-boot behavior
 * 
 * URL PARAMETERS:
 *   ?skip     - Skip the boot sequence entirely
 *   ?fast     - Run boot sequence at 2x speed
 *   ?silent   - Disable audio
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION - Edit this section to customize your boot sequence
// ═══════════════════════════════════════════════════════════════════════════
const BOOT_CONFIG = {
    // Project name displayed in title screen
    appName: 'SAM',
    
    // Version shown in kernel boot message
    version: '2.2.8',
    
    // Audio settings
    audio: {
        enabled: true,
        volume: 0.4,
        basePath: './assets/audio/'
    },
    
    // Skip intro (also controllable via ?skip URL param)
    skipIntro: false,
    
    // Theme colors (RGB values)
    // Tron default: r:170, g:207, b:209 (cyan)
    // Alternative presets:
    //   Red: r:255, g:60, b:60
    //   Green: r:0, g:255, b:136
    //   Amber: r:255, g:176, b:0
    colors: {
        r: 170,
        g: 207,
        b: 209
    },
    
    // Final screen behavior:
    //   'ready'    - Show "SYSTEM READY" message
    //   'fade'     - Fade out boot screen
    //   'remove'   - Remove boot screen element
    //   'redirect' - Redirect to another page (set redirectUrl)
    //   'callback' - Execute custom callback function
    completionMode: 'ready',
    
    // URL to redirect to (when completionMode is 'redirect')
    redirectUrl: '/main.html',
    
    // Custom callback function (when completionMode is 'callback')
    // Override this in your own script before boot.js loads
    onComplete: null,
    
    // Custom boot log (array of strings, or null to load from file)
    customBootLog: null,
    
    // Path to boot log file (if customBootLog is null)
    bootLogPath: './assets/boot_log.txt'
};

// Allow external config override
if (typeof window.BOOT_CONFIG_OVERRIDE !== 'undefined') {
    Object.assign(BOOT_CONFIG, window.BOOT_CONFIG_OVERRIDE);
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOT SEQUENCE ENGINE - Do not edit below unless customizing behavior
// ═══════════════════════════════════════════════════════════════════════════

// Utility: Promise-based delay with optional cancellation
const _delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: RAF-based smooth delay for animations
const _rafDelay = (ms) => new Promise(resolve => {
    const start = performance.now();
    const tick = (now) => {
        if (now - start >= ms) resolve();
        else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
});

// State
let audioManager;
let lineIndex = 0;
let bootLog = [];
let speedMultiplier = 1;
let isBooting = true;

/**
 * Apply theme colors to CSS custom properties
 */
function applyThemeColors() {
    const root = document.documentElement;
    const { r, g, b } = BOOT_CONFIG.colors;
    
    root.style.setProperty('--color_r', r);
    root.style.setProperty('--color_g', g);
    root.style.setProperty('--color_b', b);
    root.style.setProperty('--app_name', `"${BOOT_CONFIG.appName}"`);
    
    // Set meta theme color for mobile browsers
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
    }
    metaTheme.content = `rgb(${r}, ${g}, ${b})`;
}

/**
 * Auto-scroll boot screen to bottom
 */
function scrollToBottom(element) {
    requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
    });
}

/**
 * Display boot log lines with timing
 * Timing matches original eDEX-UI _renderer.js displayLine()
 */
function displayLine() {
    const bootScreen = document.getElementById('boot_screen');
    if (!bootScreen || !isBooting) return;
    
    if (typeof bootLog[lineIndex] === 'undefined') {
        setTimeout(displayTitleScreen, 300 / speedMultiplier);
        return;
    }

    const line = bootLog[lineIndex];
    
    // Play appropriate sound
    if (line === 'Boot Complete') {
        audioManager.granted.play();
    } else {
        audioManager.stdout.play();
    }
    
    // Create line element for potential animation
    const lineText = document.createTextNode(line);
    bootScreen.appendChild(lineText);
    bootScreen.appendChild(document.createElement('br'));
    
    // Auto-scroll
    scrollToBottom(bootScreen);
    
    lineIndex++;

    // Timing logic (preserved from original SAM/_renderer.js)
    switch (true) {
        case lineIndex === 2:
            // Inject kernel version line after second line
            const kernelLine = `${BOOT_CONFIG.appName} Kernel version ${BOOT_CONFIG.version} boot at ${Date().toString()}; root:xnu-1699.22.73~1/RELEASE_X86_64`;
            bootScreen.appendChild(document.createTextNode(kernelLine));
            bootScreen.appendChild(document.createElement('br'));
            scrollToBottom(bootScreen);
            // Fall through to next case
        case lineIndex === 4:
            setTimeout(displayLine, 500 / speedMultiplier);
            break;
        case lineIndex > 4 && lineIndex < 25:
            setTimeout(displayLine, 30 / speedMultiplier);
            break;
        case lineIndex === 25:
            setTimeout(displayLine, 400 / speedMultiplier);
            break;
        case lineIndex === 42:
            setTimeout(displayLine, 300 / speedMultiplier);
            break;
        case lineIndex > 42 && lineIndex < 82:
            setTimeout(displayLine, 25 / speedMultiplier);
            break;
        case lineIndex >= bootLog.length - 2 && lineIndex < bootLog.length:
            setTimeout(displayLine, 300 / speedMultiplier);
            break;
        default:
            // Exponential decay timing for natural scrolling feel
            const delay = Math.max(10, Math.pow(1 - (lineIndex / 1000), 3) * 25);
            setTimeout(displayLine, delay / speedMultiplier);
    }
}

/**
 * Display the title screen with glitch animation
 * Matches original eDEX-UI displayTitleScreen() timing and effects
 */
async function displayTitleScreen() {
    let bootScreen = document.getElementById('boot_screen');
    
    // Handle case where boot screen was removed
    if (bootScreen === null) {
        bootScreen = document.createElement('section');
        bootScreen.id = 'boot_screen';
        bootScreen.style.zIndex = '9999999';
        document.body.appendChild(bootScreen);
    }
    
    // Clear and play theme audio
    bootScreen.innerHTML = '';
    audioManager.theme.play();

    await _rafDelay(400 / speedMultiplier);

    // Show grid background
    document.body.classList.remove('solidBackground');
    bootScreen.classList.add('center');
    
    const { r, g, b } = BOOT_CONFIG.colors;
    
    // Create title element
    const title = document.createElement('h1');
    title.textContent = BOOT_CONFIG.appName;
    bootScreen.appendChild(title);

    await _rafDelay(200 / speedMultiplier);

    // Flash to solid background
    document.body.classList.add('solidBackground');

    await _rafDelay(100 / speedMultiplier);

    // Title fills with color (highlight effect)
    title.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    title.style.borderBottom = `5px solid rgb(${r}, ${g}, ${b})`;
    title.style.color = 'var(--color_black)';
    title.classList.add('glow-active');

    await _rafDelay(300 / speedMultiplier);

    // Title becomes outlined (normal state)
    title.style.backgroundColor = 'transparent';
    title.style.color = '';
    title.style.border = `5px solid rgb(${r}, ${g}, ${b})`;
    title.classList.remove('glow-active');

    await _rafDelay(100 / speedMultiplier);

    // Glitch effect
    title.style.cssText = '';
    title.classList.add('glitch');

    await _rafDelay(500 / speedMultiplier);

    // Return to grid background, stable title with glow
    document.body.classList.remove('solidBackground');
    title.classList.remove('glitch');
    title.style.border = `5px solid rgb(${r}, ${g}, ${b})`;
    title.classList.add('glow-active');

    await _rafDelay(1000 / speedMultiplier);

    // Boot complete
    onBootComplete();
}

/**
 * Called when boot sequence finishes
 */
function onBootComplete() {
    isBooting = false;
    const bootScreen = document.getElementById('boot_screen');
    const { r, g, b } = BOOT_CONFIG.colors;
    
    // Execute custom callback if provided
    if (typeof BOOT_CONFIG.onComplete === 'function') {
        try {
            BOOT_CONFIG.onComplete(bootScreen);
        } catch (e) {
            console.error('Boot onComplete callback error:', e);
        }
        return;
    }
    
    switch (BOOT_CONFIG.completionMode) {
        case 'ready':
            // Show "SYSTEM READY" message with pulse animation
            if (bootScreen) {
                bootScreen.innerHTML = '';
                bootScreen.classList.add('center');
                const readyTitle = document.createElement('h1');
                readyTitle.textContent = 'SYSTEM READY';
                readyTitle.style.border = `5px solid rgb(${r}, ${g}, ${b})`;
                readyTitle.classList.add('ready', 'glow-active');
                bootScreen.appendChild(readyTitle);
            }
            break;
            
        case 'fade':
            // Fade out the boot screen with CSS animation
            if (bootScreen) {
                bootScreen.classList.add('fade-out');
                bootScreen.addEventListener('animationend', () => {
                    bootScreen.remove();
                }, { once: true });
            }
            break;
            
        case 'remove':
            // Remove boot screen immediately
            if (bootScreen) bootScreen.remove();
            break;
            
        case 'redirect':
            // Redirect to another page with slight delay for UX
            setTimeout(() => {
                window.location.href = BOOT_CONFIG.redirectUrl;
            }, 100);
            break;
            
        case 'callback':
        default:
            // Keep showing the title
            break;
    }
    
    // Dispatch custom event for external listeners
    window.dispatchEvent(new CustomEvent('bootComplete', { 
        detail: { 
            config: BOOT_CONFIG,
            timestamp: Date.now()
        },
        bubbles: true
    }));
    
    // Styled console output
    console.log(
        '%c✓ Boot sequence complete',
        `color: rgb(${r}, ${g}, ${b}); font-weight: bold; font-size: 12px;`
    );
}

/**
 * Generate a minimal boot log if loading fails
 */
function generateFallbackBootLog() {
    const name = BOOT_CONFIG.appName;
    return [
        `Welcome to ${name}!`,
        `${name} Core Initializing...`,
        'vm_page_bootstrap: 512000 free pages',
        'Loading kernel modules...',
        'zone leak detection enabled',
        'standard timeslicing quantum is 10000 us',
        `${name}ACPI: ProcessorId=1 Enabled`,
        `${name}ACPI: ProcessorId=2 Enabled`,
        'Security policy loaded: Sandbox',
        'HN_ Framework initialized',
        'PCI configuration complete',
        'Pthread support enabled',
        'Starting network services...',
        'Boot Complete'
    ];
}

/**
 * Preload critical audio files
 */
async function preloadAudio() {
    if (!BOOT_CONFIG.audio.enabled) return;
    
    const criticalSounds = ['stdout.wav', 'granted.wav', 'theme.wav'];
    const preloads = criticalSounds.map(file => {
        return new Promise(resolve => {
            const audio = new Audio(BOOT_CONFIG.audio.basePath + file);
            audio.preload = 'auto';
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', resolve, { once: true }); // Don't block on errors
        });
    });
    
    // Timeout after 2 seconds to not block boot
    await Promise.race([
        Promise.all(preloads),
        _delay(2000)
    ]);
}

/**
 * Initialize and start boot sequence
 */
async function init() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Apply theme colors early
    applyThemeColors();
    
    // Handle skip parameter
    if (urlParams.has('skip') || BOOT_CONFIG.skipIntro) {
        const bootScreen = document.getElementById('boot_screen');
        if (bootScreen) bootScreen.remove();
        document.body.classList.remove('solidBackground');
        
        console.log(
            '%c⏭ Boot sequence skipped',
            'color: #ff0; font-weight: bold;'
        );
        
        window.dispatchEvent(new CustomEvent('bootComplete', { 
            detail: { config: BOOT_CONFIG, skipped: true },
            bubbles: true
        }));
        return;
    }
    
    // Handle fast mode
    if (urlParams.has('fast')) {
        speedMultiplier = 2;
    }
    
    // Handle ultra-fast mode (for development)
    if (urlParams.has('ultrafast')) {
        speedMultiplier = 5;
    }
    
    // Handle silent mode
    let audioEnabled = BOOT_CONFIG.audio.enabled;
    if (urlParams.has('silent') || urlParams.has('mute')) {
        audioEnabled = false;
    }
    
    // Initialize audio manager
    audioManager = new AudioManager({
        enabled: audioEnabled,
        volume: BOOT_CONFIG.audio.volume,
        basePath: BOOT_CONFIG.audio.basePath
    });
    
    // Preload audio while loading boot log
    const audioPreload = preloadAudio();

    // Load boot log
    if (BOOT_CONFIG.customBootLog && Array.isArray(BOOT_CONFIG.customBootLog)) {
        bootLog = [...BOOT_CONFIG.customBootLog]; // Clone to prevent mutation
    } else {
        try {
            const response = await fetch(BOOT_CONFIG.bootLogPath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            bootLog = text.split('\n').filter(line => line.trim() !== '');
        } catch (e) {
            console.warn('Boot log fetch failed, using fallback:', e.message);
            bootLog = generateFallbackBootLog();
        }
    }
    
    // Wait for audio preload (with timeout)
    await audioPreload;

    // Start boot sequence
    displayLine();
}

// ═══════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════

// Handle visibility change (pause/resume boot)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isBooting) {
        // Optionally pause boot when tab is hidden
        // Currently we let it continue in background
    }
});

// Handle errors gracefully
window.addEventListener('error', (e) => {
    console.error('Boot error:', e.error);
    // Continue boot sequence on non-critical errors
});

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
