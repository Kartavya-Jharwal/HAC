/* ═══════════════════════════════════════════════════════════════════════════════
 * HAC ACCESS - Main Orchestration Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * FLOW:
 *   1. Click to start → enables audio
 *   2. Boot log → terminal scrolling (opening sequence)
 *   3. HAC title → glitch animation (title card)
 *   4. Greeter → name + password (enter protagonist name)
 *   5. Identity card → view mode (printed) or edit mode (first-time setup)
 *      - Optional EDIT toggle, EXPORT download, ENTER to proceed
 *   6. ENTER → zoom-out → redirect to dashboard
 */

(() => {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        appName: 'HAC',
        version: '2.0.0',
        redirectUrl: './dashboard.html',
        audio: { enabled: true, volume: 0.4, basePath: './assets/audio/' },
        colors: { r: 0, g: 212, b: 212 },
        bootLogPath: './assets/boot_log.txt'
    };

    const EASING = {
        inOutCirc: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
        outQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',
        inExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        outExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
        inSine: 'cubic-bezier(0.47, 0, 0.745, 0.715)',
        outCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
        inCubic: 'cubic-bezier(0.32, 0, 0.67, 0)',
        inQuart: 'cubic-bezier(0.5, 0, 0.75, 0)',
        inCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE MACHINE
    // ═══════════════════════════════════════════════════════════════════════════
    const State = {
        BOOT: 0,          // Boot log scrolling
        BOOT_TITLE: 1,    // HAC logo with glitch
        SPLASH: 2,        // Progress bar animation
        STARTUP: 3,       // Form slides in
        IDLE: 4,          // Waiting for name + password
        LOADING: 5,       // Fake verification
        IDENTITY: 6,      // Identity card (view or edit mode)
        EXIT: 7,          // Exit animation
        REDIRECT: 8       // Redirect to dashboard
    };

    let currentState = State.BOOT;
    let passwordValue = '';
    let nameValue = '';
    let emailValue = '';
    let cardMode = 'view'; // 'view' or 'edit'
    let terminalQueue = [];
    let terminalLineCount = 0;
    const MAX_TERMINAL_LINES = 10;

    // Boot state
    let bootLog = [];
    let lineIndex = 0;
    let isBooting = true;
    let audioManager = null;

    // ═══════════════════════════════════════════════════════════════════════════
    // DOM REFS
    // ═══════════════════════════════════════════════════════════════════════════
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);
    const dom = {};

    function cacheDom() {
        dom.bootScreen = $('#boot_screen');
        dom.hacAccess = $('#hac-access');
        dom.blackout = $('#blackout');
        dom.bar = $('#bar');
        dom.time = $('#time');
        dom.timeInfo = $('#time-info');
        dom.clock = $('#clock');
        dom.date = $('#date');
        dom.asciiClock = $('#ascii-clock');
        dom.status = $('#status');
        dom.splashContainer = $('#splash-container');
        dom.splash = $('#splash');
        dom.splashBar = $('#splash-bar');
        dom.splashCt = $('#splash-ct');
        dom.splashOs = $('#splash-os');
        dom.splashFinalBar = $('#splash-final-bar');
        dom.fieldGroup = $('#field-group');
        dom.nameInput = $('#name-input');
        dom.emailInput = $('#email-input');
        dom.passwordWrapper = $('#password-wrapper');
        dom.passwordInput = $('#password-input');
        dom.passwordDisplay = $('#password-display');
        dom.loginBtn = $('#login-btn');
        dom.spinner = $('#spinner');
        dom.spinnerCells = $$('.spinner__cell:not(.spinner__cell--center)');
        dom.typewriter = $('#typewriter');
        dom.typewriterText = $('#typewriter-text');
        dom.disclaimer = $('#disclaimer');
        dom.disclaimerTextBlock = $('#disclaimer-text');
        dom.terminal = $('#terminal');
        dom.terminalLog = $('#terminal-log');
        dom.deviceId = $('#device-id');

        // Identity card
        dom.identityCard = $('#identity-card');
        dom.avatarImg = $('#avatar-img');
        dom.avatarPlaceholder = $('#avatar-placeholder');
        dom.uploadAvatarBtn = $('#upload-avatar-btn');
        dom.avatarInput = $('#avatar-input');
        dom.cardNameInput = $('#card-name-input');
        dom.cardEmailInput = $('#card-email-input');
        dom.cardClearanceInput = $('#card-clearance-input');
        dom.cardDesignationInput = $('#card-designation-input');
        dom.cardStudentIdInput = $('#card-studentid-input');
        dom.cardNameValue = $('#card-name-value');
        dom.cardEmailValue = $('#card-email-value');
        dom.cardClearanceValue = $('#card-clearance-value');
        dom.cardDesignationValue = $('#card-designation-value');
        dom.cardStudentIdValue = $('#card-studentid-value');
        dom.cardId = $('#card-id');
        dom.qrCanvas = $('#qr-canvas');
        dom.cardConfirmBtn = $('#card-confirm-btn');
        dom.cardEditBtn = $('#card-edit-btn');
        dom.cardDownloadBtn = $('#card-download-btn');
        dom.cardShareBtn = $('#card-share-btn');
        dom.cardExportCanvas = $('#card-export-canvas');

        // Panels
        dom.panelLeft = $('#panel-left');
        dom.panelRight = $('#panel-right');
        dom.panelLatency = $('#panel-latency');
        dom.panelCpu = $('#panel-cpu');
        dom.panelMem = $('#panel-mem');

        dom.toast = $('#toast');

        // Widgets
        dom.widgetSession = $('#widget-session');
        dom.widgetSpectrum = $('#widget-spectrum');
        dom.widgetUptime = $('#widget-uptime');
        dom.widgetSignals = $('#widget-signals');
        dom.widgetBars = $('#widget-bars');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOCAL STORAGE
    // ═══════════════════════════════════════════════════════════════════════════
    const STORAGE_KEY = 'hac_profile';

    function loadProfile() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) { return null; }
    }

    function saveProfile(profile) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch (e) { console.warn('Failed to save profile:', e); }
    }

    function generateMemberId() {
        const year = new Date().getFullYear();
        const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
        return `HAC-${year}-${num}`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PANEL UPDATES
    // ═══════════════════════════════════════════════════════════════════════════
    let panelUpdateInterval = null;

    function startPanelUpdates() {
        updatePanelData();
        panelUpdateInterval = setInterval(updatePanelData, 2500);
    }

    function stopPanelUpdates() {
        if (panelUpdateInterval) { clearInterval(panelUpdateInterval); panelUpdateInterval = null; }
    }

    function updatePanelData() {
        if (dom.panelLatency) dom.panelLatency.textContent = (Math.floor(Math.random() * 40) + 10) + 'ms';
        if (dom.panelCpu) dom.panelCpu.textContent = (Math.floor(Math.random() * 30) + 15) + '%';
        if (dom.panelMem) dom.panelMem.textContent = (Math.floor(Math.random() * 30) + 40) + '%';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WIDGET UPDATES
    // ═══════════════════════════════════════════════════════════════════════════
    let widgetInterval = null;
    let widgetStartTime = null;
    let signalCount = 0;

    function startWidgetUpdates() {
        widgetStartTime = Date.now();
        signalCount = 0;
        updateWidgets();
        widgetInterval = setInterval(updateWidgets, 1000);
    }

    function stopWidgetUpdates() {
        if (widgetInterval) { clearInterval(widgetInterval); widgetInterval = null; }
    }

    function updateWidgets() {
        // Session uptime
        if (dom.widgetUptime && widgetStartTime) {
            const elapsed = Math.floor((Date.now() - widgetStartTime) / 1000);
            const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const ss = String(elapsed % 60).padStart(2, '0');
            dom.widgetUptime.textContent = `${mm}:${ss}`;
        }

        // Signal count (random increment)
        if (dom.widgetSignals) {
            signalCount += Math.floor(Math.random() * 3);
            dom.widgetSignals.textContent = signalCount;
        }

        // Audio spectrum bars (random animation)
        if (dom.widgetBars) {
            const bars = '\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588';
            let spectrum = '';
            for (let i = 0; i < 14; i++) {
                spectrum += bars[Math.floor(Math.random() * bars.length)];
            }
            dom.widgetBars.textContent = spectrum;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════
    function randomHex(len = 8) {
        let hex = '';
        for (let i = 0; i < len; i++) hex += Math.floor(Math.random() * 16).toString(16);
        return hex.toUpperCase();
    }

    function randomUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        }).toUpperCase();
    }

    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    function _rafDelay(ms) {
        return new Promise(resolve => {
            const start = performance.now();
            const tick = (now) => { if (now - start >= ms) resolve(); else requestAnimationFrame(tick); };
            requestAnimationFrame(tick);
        });
    }

    function animate(el, keyframes, options) {
        return new Promise(resolve => {
            const anim = el.animate(keyframes, options);
            anim.onfinish = () => {
                if (options.fill !== 'none') {
                    const last = keyframes[keyframes.length - 1];
                    for (const [k, v] of Object.entries(last)) el.style[k] = v;
                }
                resolve();
            };
        });
    }

    function randomDelay(min = 200, max = 500) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VIEWPORT & LAYOUT
    // ═══════════════════════════════════════════════════════════════════════════
    function computeVh() {
        const vh = window.innerHeight / 1080;
        document.documentElement.style.setProperty('--vh', vh);
        return vh;
    }

    function layoutPositions() {
        const H = window.innerHeight;
        const REM_PW = Math.max(12, H / 60);
        document.documentElement.style.setProperty('--rem-pw', REM_PW + 'px');

        const splashW = 21.2 * REM_PW;
        const splashH = 3.7 * REM_PW;
        dom.splashContainer.style.width = splashW + 'px';
        dom.splashContainer.style.height = splashH + 'px';
        dom.fieldGroup.style.width = splashW + 'px';
    }

    function positionFieldGroup() {
        const splashRect = dom.splashContainer.getBoundingClientRect();
        dom.fieldGroup.style.top = (splashRect.bottom + 24) + 'px';
    }

    function positionDisclaimer() {
        const splashRect = dom.splashContainer.getBoundingClientRect();
        const fieldRect = dom.fieldGroup.getBoundingClientRect();
        dom.disclaimer.style.left = splashRect.left + 'px';
        dom.disclaimer.style.top = (fieldRect.bottom + 20) + 'px';
    }

    function positionTypewriter() {
        const splashRect = dom.splashContainer.getBoundingClientRect();
        dom.typewriter.style.top = (splashRect.top - 40) + 'px';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLOCK
    // ═══════════════════════════════════════════════════════════════════════════
    function updateClock() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        dom.clock.textContent = `${hh}:${mm}:${ss}`;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        dom.date.textContent = `${days[now.getDay()]} ${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]}`;
        if (dom.asciiClock) dom.asciiClock.textContent = renderAsciiClock(now);
    }

    function renderAsciiClock(date) {
        const h = date.getHours() % 12;
        const m = date.getMinutes();
        const s = date.getSeconds();
        const R = 8; // radius in chars
        const W = R * 2 + 1;
        const H = R * 2 + 1;
        const grid = Array.from({ length: H }, () => Array(W).fill(' '));

        // Draw circle
        for (let a = 0; a < 360; a += 6) {
            const rad = a * Math.PI / 180;
            const x = Math.round(R + R * Math.sin(rad) * 1.0);
            const y = Math.round(R - R * Math.cos(rad) * 0.5);
            if (y >= 0 && y < H && x >= 0 && x < W) {
                // Hour markers at 30° intervals
                grid[y][x] = (a % 30 === 0) ? '\u25CF' : '\u00B7';
            }
        }

        // Draw hands (hour, minute, second)
        const drawHand = (angle, len, ch) => {
            const rad = angle * Math.PI / 180;
            for (let i = 1; i <= len; i++) {
                const x = Math.round(R + i * Math.sin(rad) * 1.0);
                const y = Math.round(R - i * Math.cos(rad) * 0.5);
                if (y >= 0 && y < H && x >= 0 && x < W) grid[y][x] = ch;
            }
        };

        const hAngle = (h + m / 60) * 30;
        const mAngle = (m + s / 60) * 6;
        const sAngle = s * 6;

        drawHand(hAngle, 4, '\u2588');
        drawHand(mAngle, 6, '\u2593');
        drawHand(sAngle, 7, '\u00B7');

        // Center dot
        grid[R][R] = '\u25C9';

        return grid.map(row => row.join('')).join('\n');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GREETER TERMINAL (bottom-left log)
    // ═══════════════════════════════════════════════════════════════════════════
    function terminalPush(msg) { terminalQueue.push(msg); }

    async function terminalProcess() {
        while (terminalQueue.length > 0) {
            const msg = terminalQueue.shift();
            addTerminalLine(msg);
            await sleep(randomDelay(150, 400));
        }
    }

    function addTerminalLine(text) {
        const li = document.createElement('div');
        li.className = 'terminal__line';
        if (/^---.*---$/.test(text)) {
            li.classList.add('terminal__line--separator');
            li.textContent = `——— ${text.replace(/^-+/, '').replace(/-+$/, '')} ———`;
        } else {
            li.textContent = `» ${text}`;
        }
        dom.terminalLog.appendChild(li);
        terminalLineCount++;
        void li.offsetWidth;
        li.classList.add('visible');
        while (dom.terminalLog.children.length > MAX_TERMINAL_LINES) {
            dom.terminalLog.removeChild(dom.terminalLog.firstChild);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PASSWORD & FORM FIELDS
    // ═══════════════════════════════════════════════════════════════════════════
    function renderPassword() {
        const blocks = passwordValue.split('').map(() => '█').join('');
        dom.passwordDisplay.innerHTML = blocks + '<span class="password-cursor">▁</span>';
    }

    function setupFormInputs() {
        // Name input - just track value, minimal audio
        dom.nameInput.addEventListener('input', (e) => { nameValue = e.target.value; });
        dom.nameInput.addEventListener('focus', () => { if (audioManager) audioManager.expand.play(); });

        // Email input
        dom.emailInput.addEventListener('input', (e) => { emailValue = e.target.value; });

        // Password wrapper click → focus hidden input
        dom.passwordWrapper.addEventListener('click', () => {
            if (currentState === State.IDLE) dom.passwordInput.focus();
        });

        dom.passwordInput.addEventListener('input', (e) => {
            if (currentState !== State.IDLE) return;
            passwordValue = e.target.value;
            renderPassword();
        });

        // Enter key handling
        dom.passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (currentState === State.IDLE && passwordValue.length > 0 && nameValue.trim().length > 0) {
                    handleLogin();
                }
            }
        });

        // Global Enter for identity card confirmation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && currentState === State.IDENTITY) {
                handleCardConfirm();
            }
        });

        dom.loginBtn.addEventListener('click', () => {
            if (currentState === State.IDLE && passwordValue.length > 0 && nameValue.trim().length > 0) {
                handleLogin();
            }
        });

        // Avatar upload
        if (dom.uploadAvatarBtn && dom.avatarInput) {
            dom.uploadAvatarBtn.addEventListener('click', () => {
                dom.avatarInput.click();
                if (audioManager) audioManager.folder.play();
            });
            dom.avatarInput.addEventListener('change', handleAvatarUpload);
        }

        // Card confirm button (ENTER)
        if (dom.cardConfirmBtn) {
            dom.cardConfirmBtn.addEventListener('click', handleCardConfirm);
        }

        // Card EDIT toggle button
        if (dom.cardEditBtn) {
            dom.cardEditBtn.addEventListener('click', () => {
                if (audioManager) audioManager.expand.play();
                if (cardMode === 'view') {
                    setCardMode('edit');
                } else {
                    // Save edits, persist to localStorage, switch to view
                    syncCardDisplayFromInputs();
                    const profile = loadProfile() || {};
                    profile.name = dom.cardNameInput.value || 'HAC MEMBER';
                    profile.email = dom.cardEmailInput.value || 'member@hac.edu';
                    profile.clearance = dom.cardClearanceInput.value || 'BUILDER';
                    profile.designation = dom.cardDesignationInput.value || 'AI COLLECTIVE MEMBER';
                    profile.studentId = dom.cardStudentIdInput?.value || '';
                    if (dom.avatarImg && dom.avatarImg.src && dom.avatarImg.classList.contains('visible')) {
                        profile.avatar = dom.avatarImg.src;
                    }
                    profile.qrData = buildQRPayload();
                    profile.profileSetupComplete = true;
                    saveProfile(profile);
                    refreshQR();
                    setCardMode('view');
                    showToast('◈ Profile saved');
                }
            });
        }

        // Card DOWNLOAD/EXPORT button
        if (dom.cardDownloadBtn) {
            dom.cardDownloadBtn.addEventListener('click', () => {
                if (audioManager) audioManager.scan.play();
                exportCardAsImage();
            });
        }

        // Card SHARE button
        if (dom.cardShareBtn) {
            dom.cardShareBtn.addEventListener('click', () => {
                if (audioManager) audioManager.scan.play();
                shareCardAsImage();
            });
        }

        // Sync input → display values on every keystroke (for live preview)
        [dom.cardNameInput, dom.cardEmailInput, dom.cardDesignationInput, dom.cardStudentIdInput].forEach(inp => {
            if (inp) inp.addEventListener('input', syncCardDisplayFromInputs);
        });
        if (dom.cardClearanceInput) {
            dom.cardClearanceInput.addEventListener('change', syncCardDisplayFromInputs);
        }
    }

    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            if (dom.avatarImg) {
                dom.avatarImg.src = dataUrl;
                dom.avatarImg.classList.add('visible');
            }
            if (audioManager) audioManager.scan.play();
        };
        reader.readAsDataURL(file);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IDENTITY CARD MODE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    function setCardMode(mode) {
        cardMode = mode;
        dom.identityCard.classList.remove('identity-card--view', 'identity-card--edit');
        dom.identityCard.classList.add(`identity-card--${mode}`);

        if (dom.cardEditBtn) {
            const icon = dom.cardEditBtn.querySelector('.identity-card__action-icon');
            if (mode === 'edit') {
                if (icon) icon.textContent = '✓';
                dom.cardEditBtn.lastChild.textContent = ' SAVE';
                dom.cardConfirmBtn.textContent = 'SAVE & ENTER';
            } else {
                if (icon) icon.textContent = '✎';
                dom.cardEditBtn.lastChild.textContent = ' EDIT';
                dom.cardConfirmBtn.textContent = 'ENTER';
            }
        }

        terminalPush(mode === 'edit' ? 'CARD_EDIT_MODE' : 'CARD_VIEW_MODE');
    }

    function syncCardDisplayFromInputs() {
        if (dom.cardNameValue && dom.cardNameInput) dom.cardNameValue.textContent = dom.cardNameInput.value || 'HAC MEMBER';
        if (dom.cardEmailValue && dom.cardEmailInput) dom.cardEmailValue.textContent = dom.cardEmailInput.value || 'member@hac.edu';
        if (dom.cardClearanceValue && dom.cardClearanceInput) dom.cardClearanceValue.textContent = dom.cardClearanceInput.value || 'BUILDER';
        if (dom.cardDesignationValue && dom.cardDesignationInput) dom.cardDesignationValue.textContent = dom.cardDesignationInput.value || 'AI COLLECTIVE MEMBER';
        if (dom.cardStudentIdValue && dom.cardStudentIdInput) dom.cardStudentIdValue.textContent = dom.cardStudentIdInput.value || '\u2014';
    }

    function syncCardInputsFromProfile(profile) {
        if (!profile) return;
        if (dom.cardNameInput) dom.cardNameInput.value = profile.name || 'HAC MEMBER';
        if (dom.cardEmailInput) dom.cardEmailInput.value = profile.email || 'member@hac.edu';
        if (dom.cardClearanceInput) dom.cardClearanceInput.value = profile.clearance || 'BUILDER';
        if (dom.cardDesignationInput) dom.cardDesignationInput.value = profile.designation || 'AI COLLECTIVE MEMBER';
        if (dom.cardStudentIdInput) dom.cardStudentIdInput.value = profile.studentId || '';
        syncCardDisplayFromInputs();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QR CODE GENERATION (client-side, styled cyan on transparent)
    // ═══════════════════════════════════════════════════════════════════════════
    function generateQRCode(text, canvasEl, size) {
        if (!canvasEl || !text || typeof qrcode === 'undefined') return;
        size = size || canvasEl.width;

        const qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();

        const modules = qr.getModuleCount();
        canvasEl.width = size;
        canvasEl.height = size;
        const ctx = canvasEl.getContext('2d');
        ctx.clearRect(0, 0, size, size);

        const cellSize = size / modules;
        const r = CONFIG.colors.r, g = CONFIG.colors.g, b = CONFIG.colors.b;

        for (let row = 0; row < modules; row++) {
            for (let col = 0; col < modules; col++) {
                if (qr.isDark(row, col)) {
                    // Slight radial gradient: brighter at center, dimmer at edges
                    const dx = (col + 0.5) / modules - 0.5;
                    const dy = (row + 0.5) / modules - 0.5;
                    const dist = Math.sqrt(dx * dx + dy * dy) * 2;
                    const alpha = 1 - dist * 0.3; // 0.7–1.0 range
                    ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0.7, alpha).toFixed(2)})`;
                    ctx.fillRect(
                        Math.floor(col * cellSize),
                        Math.floor(row * cellSize),
                        Math.ceil(cellSize),
                        Math.ceil(cellSize)
                    );
                }
            }
        }
    }

    function buildQRPayload() {
        const memberId = dom.cardId?.textContent || 'HAC-2025-0001';
        const studentId = dom.cardStudentIdInput?.value || '';
        const name = dom.cardNameInput?.value || 'HAC MEMBER';
        // Plain text format: pipe-delimited for Salesforce scanner compat
        return `HAC|${memberId}|${studentId}|${name}`;
    }

    function refreshQR() {
        const payload = buildQRPayload();
        generateQRCode(payload, dom.qrCanvas, 160); // 160px @2x for crisp render
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CARD EXPORT (canvas-based PNG download — physical namecard proportions)
    // ═══════════════════════════════════════════════════════════════════════════
    function exportCardAsImage() {
        const canvas = dom.cardExportCanvas;
        if (!canvas) return;

        const DPR = 2; // High-res export
        // Standard business card: 3.5" × 2" at 300dpi = 1050 × 600
        const W = 1050 * DPR;
        const H = 600 * DPR;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.scale(DPR, DPR);

        const w = 1050, h = 600;
        const accent = `rgb(${CONFIG.colors.r}, ${CONFIG.colors.g}, ${CONFIG.colors.b})`;
        const bg = '#0E0E0E';
        const darkPanel = '#111111';
        const textPrimary = '#E8E8E8';
        const textSecondary = '#888888';
        const textDim = '#555555';

        // ── Full background
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // ── Subtle grid pattern
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

        // ── Top accent stripe
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, w, 5);

        // ── Header area (compact)
        const headerY = 16;
        ctx.font = 'bold 40px "Bai Jamjuree", sans-serif';
        ctx.fillStyle = accent;
        ctx.fillText('HAC', 36, headerY + 36);

        ctx.font = '300 14px "Bai Jamjuree", sans-serif';
        ctx.fillStyle = textSecondary;
        ctx.fillText('HULT AI COLLECTIVE', 120, headerY + 24);

        ctx.font = '500 11px "Bai Jamjuree", sans-serif';
        ctx.fillStyle = textDim;
        ctx.fillText('MEMBER IDENTIFICATION', 120, headerY + 40);

        // ── Right-aligned member ID badge
        const memberId = dom.cardId?.textContent || 'HAC-2025-0001';
        ctx.font = '500 12px "Fira Mono", "JetBrains Mono", monospace';
        ctx.fillStyle = textDim;
        ctx.textAlign = 'right';
        ctx.fillText(memberId, w - 36, headerY + 18);

        // ── Issue date
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
        ctx.font = '400 10px "Fira Mono", monospace';
        ctx.fillStyle = textDim;
        ctx.fillText(`ISSUED ${dateStr}`, w - 36, headerY + 36);
        ctx.textAlign = 'left';

        // ── Separator line
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(36, 68, w - 72, 1);

        // ── Left column: QR code above avatar
        const colX = 36, colW = 190;

        // QR code (rendered fresh onto export canvas)
        const qrSize = 130;
        const qrX = colX + Math.floor((colW - qrSize) / 2);
        const qrY = 84;

        // Draw QR container
        ctx.fillStyle = darkPanel;
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.strokeStyle = 'rgba(0,212,212,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(qrX, qrY, qrSize, qrSize);

        // Generate QR modules directly onto export canvas
        if (typeof qrcode !== 'undefined') {
            const payload = buildQRPayload();
            const qr = qrcode(0, 'M');
            qr.addData(payload);
            qr.make();
            const modules = qr.getModuleCount();
            const pad = 6;
            const cellSize = (qrSize - pad * 2) / modules;
            const { r: qr_r, g: qr_g, b: qr_b } = CONFIG.colors;
            for (let row = 0; row < modules; row++) {
                for (let col = 0; col < modules; col++) {
                    if (qr.isDark(row, col)) {
                        const dx = (col + 0.5) / modules - 0.5;
                        const dy = (row + 0.5) / modules - 0.5;
                        const dist = Math.sqrt(dx * dx + dy * dy) * 2;
                        const alpha = Math.max(0.7, 1 - dist * 0.3);
                        ctx.fillStyle = `rgba(${qr_r},${qr_g},${qr_b},${alpha.toFixed(2)})`;
                        ctx.fillRect(
                            qrX + pad + Math.floor(col * cellSize),
                            qrY + pad + Math.floor(row * cellSize),
                            Math.ceil(cellSize),
                            Math.ceil(cellSize)
                        );
                    }
                }
            }
        }

        // "SCAN ID" label
        ctx.font = '500 8px "Bai Jamjuree", sans-serif';
        ctx.fillStyle = textDim;
        ctx.textAlign = 'center';
        ctx.fillText('SCAN ID', colX + colW / 2, qrY + qrSize + 14);
        ctx.textAlign = 'left';

        // ── Avatar area (below QR)
        const avatarX = colX, avatarY = qrY + qrSize + 26, avatarW = colW, avatarH = 186;
        // Avatar container with subtle border
        ctx.fillStyle = darkPanel;
        ctx.fillRect(avatarX, avatarY, avatarW, avatarH);
        ctx.strokeStyle = 'rgba(0,212,212,0.3)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(avatarX, avatarY, avatarW, avatarH);

        // Draw avatar
        if (dom.avatarImg && dom.avatarImg.classList.contains('visible') && dom.avatarImg.naturalWidth > 0) {
            try {
                ctx.drawImage(dom.avatarImg, avatarX, avatarY, avatarW, avatarH);
            } catch (e) {
                drawAvatarPlaceholder(ctx, avatarX, avatarY, avatarW, avatarH, accent);
            }
        } else {
            drawAvatarPlaceholder(ctx, avatarX, avatarY, avatarW, avatarH, accent);
        }

        // Small accent bar under avatar
        ctx.fillStyle = accent;
        ctx.fillRect(avatarX, avatarY + avatarH, avatarW, 3);

        // ── "PHOTO ID" label under avatar
        ctx.font = '500 9px "Bai Jamjuree", sans-serif';
        ctx.fillStyle = textDim;
        ctx.textAlign = 'center';
        ctx.fillText('PHOTO ID', avatarX + avatarW / 2, avatarY + avatarH + 18);
        ctx.textAlign = 'left';

        // ── Field data (right side)
        const fields = [
            { label: 'NAME', value: dom.cardNameValue?.textContent || 'HAC MEMBER' },
            { label: 'EMAIL', value: dom.cardEmailValue?.textContent || 'member@hac.edu' },
            { label: 'CLEARANCE', value: dom.cardClearanceValue?.textContent || 'BUILDER' },
            { label: 'DESIGNATION', value: dom.cardDesignationValue?.textContent || 'AI COLLECTIVE MEMBER' },
            { label: 'STUDENT ID', value: dom.cardStudentIdValue?.textContent || '\u2014' }
        ];

        const fieldX = avatarX + avatarW + 32;
        let fieldY = 94;
        const fieldSpacing = 50;
        fields.forEach((f, i) => {
            // Label
            ctx.font = '600 10px "Bai Jamjuree", sans-serif';
            ctx.fillStyle = accent;
            ctx.globalAlpha = 0.7;
            ctx.fillText(f.label, fieldX, fieldY);
            ctx.globalAlpha = 1;

            // Value
            ctx.font = '500 20px "Bai Jamjuree", sans-serif';
            ctx.fillStyle = textPrimary;
            // Truncate if too long
            let val = f.value;
            while (ctx.measureText(val).width > (w - fieldX - 48) && val.length > 3) {
                val = val.slice(0, -1);
            }
            if (val !== f.value) val += '…';
            ctx.fillText(val, fieldX, fieldY + 22);

            // Subtle underline
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(fieldX, fieldY + 30, w - fieldX - 48, 1);

            fieldY += fieldSpacing;
        });

        // ── Bottom panel / footer
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(0, h - 62, w, 62);

        // Footer top border
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(0, h - 62, w, 1);

        // Left: barcode-style decoration
        ctx.font = '20px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillText('▌▐▌▌▐▐▌▐▌▐▌▌▐▐▌▐▌▐▌▌▐▐▌', 36, h - 26);

        // Right: branding
        ctx.font = '600 12px "Bai Jamjuree", sans-serif';
        ctx.fillStyle = accent;
        ctx.textAlign = 'right';
        ctx.fillText('HULT AI COLLECTIVE', w - 36, h - 38);
        ctx.font = '400 10px "Fira Mono", monospace';
        ctx.fillStyle = textDim;
        ctx.fillText('hultaicollective.com', w - 36, h - 22);
        ctx.textAlign = 'left';

        // ── Outer border
        ctx.strokeStyle = 'rgba(0,212,212,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, w - 2, h - 2);

        // ── Corner accents (top-left, top-right, bottom-left, bottom-right)
        const cornerLen = 18;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        // TL
        ctx.beginPath(); ctx.moveTo(0, cornerLen); ctx.lineTo(0, 0); ctx.lineTo(cornerLen, 0); ctx.stroke();
        // TR
        ctx.beginPath(); ctx.moveTo(w - cornerLen, 0); ctx.lineTo(w, 0); ctx.lineTo(w, cornerLen); ctx.stroke();
        // BL
        ctx.beginPath(); ctx.moveTo(0, h - cornerLen); ctx.lineTo(0, h); ctx.lineTo(cornerLen, h); ctx.stroke();
        // BR
        ctx.beginPath(); ctx.moveTo(w - cornerLen, h); ctx.lineTo(w, h); ctx.lineTo(w, h - cornerLen); ctx.stroke();

        // Download
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const name = (dom.cardNameValue?.textContent || 'HAC_MEMBER').replace(/\s+/g, '_').toUpperCase();
            a.download = `HAC_NAMECARD_${name}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('◈ Namecard exported — print at 3.5" × 2"');
        }, 'image/png');
    }

    // Share card via Web Share API / fallback
    async function shareCardAsImage() {
        const canvas = dom.cardExportCanvas;
        if (!canvas || canvas.width === 0) {
            // Generate the card first
            exportCardAsImage();
            await sleep(500);
        }

        const memberName = (dom.cardNameValue?.textContent || 'HAC Member').trim();

        // Try Web Share API (native Android/iOS share sheet)
        if (navigator.share && navigator.canShare) {
            try {
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const file = new File([blob], `HAC_NAMECARD_${memberName.replace(/\s+/g, '_')}.png`, { type: 'image/png' });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'HAC Member Card',
                        text: `I'm ${memberName} — member of the Hult AI Collective ◈`,
                        files: [file]
                    });
                    showToast('◈ Shared successfully');
                    return;
                }
            } catch (e) {
                if (e.name === 'AbortError') return; // User cancelled
                console.warn('Web Share file sharing failed:', e);
            }
        }

        // Fallback: try text-only share
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'HAC Member Card',
                    text: `I'm ${memberName} — member of the Hult AI Collective ◈\nhttps://hultaicollective.com`,
                    url: window.location.origin
                });
                showToast('◈ Shared successfully');
                return;
            } catch (e) {
                if (e.name === 'AbortError') return;
            }
        }

        // Final fallback: copy link to clipboard
        try {
            await navigator.clipboard.writeText(`I'm ${memberName} — member of the Hult AI Collective ◈ ${window.location.origin}`);
            showToast('◈ Link copied to clipboard');
        } catch (e) {
            showToast('◈ Share not supported on this browser');
        }
    }

    function drawAvatarPlaceholder(ctx, x, y, w, h, color) {
        ctx.fillStyle = 'rgba(14,14,14,0.8)';
        ctx.fillRect(x, y, w, h);
        // Draw a person silhouette that scales with the box
        const cx = x + w / 2;
        const cy = y + h * 0.38;
        const headR = Math.min(w, h) * 0.16;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
        // Head
        ctx.beginPath();
        ctx.arc(cx, cy, headR, 0, Math.PI * 2);
        ctx.fill();
        // Shoulders/body
        ctx.beginPath();
        ctx.ellipse(cx, cy + headR * 2.5, headR * 1.6, headR * 1.2, 0, Math.PI, 0);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function showToast(message) {
        if (!dom.toast) return;
        dom.toast.textContent = message;
        dom.toast.classList.add('visible');
        setTimeout(() => { dom.toast.classList.remove('visible'); }, 3000);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SURFACE ANIMATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    async function animateSurface(surfaceEl) {
        const barLeft = surfaceEl.querySelector('.surface__bar-left');
        const barRight = surfaceEl.querySelector('.surface__bar-right');
        const content = surfaceEl.querySelector('.surface__content');

        await Promise.all([
            animate(barLeft, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 320, easing: EASING.outCubic, fill: 'forwards' }),
            animate(barRight, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 320, easing: EASING.outCubic, fill: 'forwards' })
        ]);
        await animate(content, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 400, easing: EASING.outQuint, fill: 'forwards' });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TYPEWRITER
    // ═══════════════════════════════════════════════════════════════════════════
    function setTypewriterText(text) { dom.typewriterText.textContent = text; }

    async function typewriterOverwrite(newText) {
        const oldText = dom.typewriterText.textContent;
        const maxLen = Math.max(oldText.length, newText.length);
        const padOld = oldText.padEnd(maxLen);
        const padNew = newText.padEnd(maxLen);
        for (let i = 0; i < maxLen; i++) {
            dom.typewriterText.textContent = padNew.substring(0, i + 1) + padOld.substring(i + 1);
            await sleep(50);
        }
        dom.typewriterText.textContent = newText;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SPINNER
    // ═══════════════════════════════════════════════════════════════════════════
    let spinnerRAF = null;
    let spinnerIndex = 0;
    const SPINNER_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];

    function startSpinner() {
        dom.spinner.classList.add('active');
        spinnerIndex = 0;
        spinnerRAF = requestAnimationFrame(spinnerTick);
    }

    function spinnerTick() {
        dom.spinnerCells.forEach((c) => c.classList.remove('lit'));
        dom.spinnerCells[SPINNER_ORDER[spinnerIndex % SPINNER_ORDER.length]].classList.add('lit');
        spinnerIndex++;
        spinnerRAF = requestAnimationFrame(() => setTimeout(spinnerTick, 80));
    }

    function stopSpinner() {
        if (spinnerRAF) cancelAnimationFrame(spinnerRAF);
        dom.spinner.classList.remove('active');
        dom.spinnerCells.forEach(c => c.classList.remove('lit'));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SAM BOOT SEQUENCE
    // ═══════════════════════════════════════════════════════════════════════════
    function scrollToBottom(element) {
        requestAnimationFrame(() => { element.scrollTop = element.scrollHeight; });
    }

    function displayBootLine() {
        if (!dom.bootScreen || !isBooting) return;

        if (typeof bootLog[lineIndex] === 'undefined') {
            setTimeout(displayTitleScreen, 300);
            return;
        }

        const line = bootLog[lineIndex];

        // Audio during boot - important lines get distinct sounds
        if (line === 'Boot Complete') {
            if (audioManager) audioManager.granted.play();
        } else if (line.includes('ERROR') || line.includes('WARN')) {
            if (audioManager) audioManager.error.play();
        } else if (line.includes('Initializing') || line.includes('Starting')) {
            if (audioManager) audioManager.expand.play();
        } else if (line.includes('loaded') || line.includes('started') || line.includes('PASS')) {
            if (audioManager) audioManager.info.play();
        } else if (lineIndex % 15 === 0) {
            if (audioManager) audioManager.stdout.play();
        }

        const lineText = document.createTextNode(line);
        dom.bootScreen.appendChild(lineText);
        dom.bootScreen.appendChild(document.createElement('br'));
        scrollToBottom(dom.bootScreen);

        lineIndex++;

        // Timing
        switch (true) {
            case lineIndex === 2:
                const kernelLine = `${CONFIG.appName} Kernel version ${CONFIG.version} boot at ${Date().toString()}; root:xnu-1699.22.73~1/RELEASE_X86_64`;
                dom.bootScreen.appendChild(document.createTextNode(kernelLine));
                dom.bootScreen.appendChild(document.createElement('br'));
                scrollToBottom(dom.bootScreen);
            case lineIndex === 4:
                setTimeout(displayBootLine, 500);
                break;
            case lineIndex > 4 && lineIndex < 25:
                setTimeout(displayBootLine, 30);
                break;
            case lineIndex === 25:
                setTimeout(displayBootLine, 400);
                break;
            case lineIndex === 42:
                setTimeout(displayBootLine, 300);
                break;
            case lineIndex > 42 && lineIndex < 82:
                setTimeout(displayBootLine, 25);
                break;
            case lineIndex >= 82 && lineIndex < 100:
                setTimeout(displayBootLine, 20);
                break;
            case lineIndex >= bootLog.length - 2 && lineIndex < bootLog.length:
                setTimeout(displayBootLine, 400);
                break;
            default:
                const delay = Math.max(10, Math.pow(1 - (lineIndex / 1000), 3) * 25);
                setTimeout(displayBootLine, delay);
        }
    }

    async function displayTitleScreen() {
        currentState = State.BOOT_TITLE;

        if (!dom.bootScreen) {
            dom.bootScreen = document.createElement('section');
            dom.bootScreen.id = 'boot_screen';
            dom.bootScreen.style.zIndex = '9999999';
            document.body.appendChild(dom.bootScreen);
        }

        dom.bootScreen.innerHTML = '';
        if (audioManager) audioManager.theme.play();

        await _rafDelay(400);
        document.body.classList.remove('solidBackground');
        dom.bootScreen.classList.add('center');

        const { r, g, b } = CONFIG.colors;
        const title = document.createElement('h1');
        title.textContent = CONFIG.appName;
        dom.bootScreen.appendChild(title);

        await _rafDelay(200);
        document.body.classList.add('solidBackground');
        await _rafDelay(100);

        title.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        title.style.borderBottom = `5px solid rgb(${r}, ${g}, ${b})`;
        title.style.color = 'var(--color_black)';
        title.classList.add('glow-active');
        await _rafDelay(300);

        title.style.backgroundColor = 'transparent';
        title.style.color = '';
        title.style.border = `5px solid rgb(${r}, ${g}, ${b})`;
        title.classList.remove('glow-active');
        await _rafDelay(100);

        title.style.cssText = '';
        title.classList.add('glitch');
        await _rafDelay(500);

        document.body.classList.remove('solidBackground');
        title.classList.remove('glitch');
        title.style.border = `5px solid rgb(${r}, ${g}, ${b})`;
        title.classList.add('glow-active');
        await _rafDelay(1000);

        onBootComplete();
    }

    function onBootComplete() {
        isBooting = false;

        if (dom.bootScreen) {
            dom.bootScreen.classList.add('fade-out');
            dom.bootScreen.addEventListener('animationend', () => {
                dom.bootScreen.remove();
                dom.bootScreen = null;
            }, { once: true });
        }

        document.body.classList.add('greeterMode');
        setTimeout(() => phaseSplash(), 300);

        console.log(
            `%c✓ ${CONFIG.appName} Boot sequence complete`,
            `color: rgb(${CONFIG.colors.r}, ${CONFIG.colors.g}, ${CONFIG.colors.b}); font-weight: bold;`
        );
    }

    function generateFallbackBootLog() {
        return [
            `Welcome to ${CONFIG.appName}!`,
            `${CONFIG.appName} Core Initializing...`,
            'vm_page_bootstrap: 512000 free pages',
            'Loading kernel modules...',
            'zone leak detection enabled',
            'standard timeslicing quantum is 10000 us',
            'Security policy loaded: Sandbox',
            'HN_ Framework initialized',
            'PCI configuration complete',
            'Pthread support enabled',
            'Starting network services...',
            'Boot Complete'
        ];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GREETER PHASES
    // ═══════════════════════════════════════════════════════════════════════════

    async function phaseSplash() {
        currentState = State.SPLASH;
        dom.hacAccess.classList.add('initialized');

        // Show terminal
        dom.terminal.style.opacity = '1';
        if (audioManager) audioManager.expand.play();

        terminalPush('REGION_LINK_ESTABLISHED : HULT-EU-LONDON');
        terminalPush(`LOG_STREAM_CONNECTED // ${randomUUID()}`);
        terminalPush(`AUTH_MODULE_LOADED: HAC-v${CONFIG.version}`);
        terminalPush('---GREETER_UI_INITIALIZING---');
        terminalProcess();

        // Show panels
        setTimeout(() => {
            if (dom.panelLeft) { dom.panelLeft.classList.add('visible'); if (audioManager) audioManager.panels.play(); }
        }, 300);
        setTimeout(() => {
            if (dom.panelRight) { dom.panelRight.classList.add('visible'); }
        }, 500);
        setTimeout(() => {
            if (dom.widgetSession) dom.widgetSession.classList.add('visible');
            if (dom.widgetSpectrum) dom.widgetSpectrum.classList.add('visible');
        }, 700);

        startPanelUpdates();
        startWidgetUpdates();

        // Progress bar animation
        const bar = dom.splashBar;
        if (audioManager) audioManager.info.play();

        await animate(bar, [{ width: '0%' }, { width: '40%' }], { duration: 700, easing: EASING.inSine, fill: 'forwards' });

        triggerMidwayReveal();

        await animate(bar, [{ width: '40%' }, { width: '100%' }], { duration: 300, easing: EASING.inSine, fill: 'forwards' });

        bar.style.width = '100%';
        bar.style.transformOrigin = 'center center';
        await animate(bar, [{ transform: 'scaleY(0.04)' }, { transform: 'scaleY(1)' }], { duration: 350, easing: EASING.inSine, fill: 'forwards' });

        dom.splashOs.style.opacity = '1';
        await animate(dom.splashOs, [{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'forwards' });

        await animate(bar, [{ width: '100%' }, { width: '73%' }], { duration: 300, easing: EASING.outCubic, fill: 'forwards' });

        dom.splashCt.style.opacity = '1';
        await animate(dom.splashCt, [{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'forwards' });

        // Glitch the wordmark SVG briefly
        const wordmarkEl = dom.splashCt.querySelector('.splash__ct-svg');
        if (wordmarkEl) {
            wordmarkEl.classList.add('svg-glitch');
            await sleep(400);
            wordmarkEl.classList.remove('svg-glitch');
        }

        // Brief lockup reveal (show full "HULT AI COLLECTIVE")
        dom.splashCt.classList.add('show-lockup');
        await sleep(1200);
        dom.splashCt.classList.remove('show-lockup');

        await sleep(100);
        phaseStartup();
    }

    function triggerMidwayReveal() {
        // Time
        dom.time.style.opacity = '1';
        setTimeout(() => {
            dom.timeInfo.animate([
                { opacity: 0, transform: 'translateY(12px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 300, easing: EASING.inExpo, fill: 'forwards' });
            dom.timeInfo.style.opacity = '1';
        }, 200);

        // Device ID
        setTimeout(() => {
            dom.deviceId.style.opacity = '1';
            const barcode = dom.deviceId.querySelector('.device-id__barcode');
            const text = dom.deviceId.querySelector('.device-id__text');
            const rule = dom.deviceId.querySelector('.device-id__rule');
            if (barcode) { barcode.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' }); barcode.style.opacity = '1'; }
            if (rule) { rule.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' }); rule.style.opacity = '1'; }
            if (text) {
                setTimeout(() => {
                    text.animate([{ opacity: 0, transform: 'translateX(20px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 300, fill: 'forwards' });
                    text.style.opacity = '1';
                }, 150);
            }
        }, 100);

        // Status
        setTimeout(() => {
            dom.status.style.opacity = '1';
            animateSurface(dom.status.querySelector('.surface'));
        }, 200);
    }

    async function phaseStartup() {
        currentState = State.STARTUP;

        await animate(dom.splashContainer, [
            { top: '50%' }, { top: '33%' }
        ], { duration: 800, easing: EASING.outQuint, fill: 'forwards' });

        positionFieldGroup();

        dom.fieldGroup.style.display = 'flex';
        dom.fieldGroup.style.opacity = '1';

        // Position disclaimer after field group is visible
        await sleep(50);
        positionDisclaimer();
        dom.disclaimer.style.opacity = '1';

        await sleep(200);
        phaseIdle();
    }

    function phaseIdle() {
        currentState = State.IDLE;
        dom.nameInput.focus();
        terminalPush('AWAITING_CREDENTIALS');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOGIN
    // ═══════════════════════════════════════════════════════════════════════════
    async function handleLogin() {
        currentState = State.LOADING;

        // Validation
        if (!nameValue || nameValue.trim() === '') {
            if (audioManager) audioManager.error.play();
            dom.nameInput.style.borderColor = 'var(--error)';
            setTimeout(() => { dom.nameInput.style.borderColor = ''; }, 1000);
            currentState = State.IDLE;
            return;
        }

        dom.passwordWrapper.classList.add('state-loading');
        dom.loginBtn.classList.add('loading');
        startSpinner();
        if (audioManager) audioManager.alarm.play();

        terminalPush('AUTH_ATTEMPT_INITIATED');
        terminalPush(`VERIFYING_HASH: ${randomHex(32)}`);

        await sleep(1500 + Math.random() * 1000);
        stopSpinner();

        // Always succeed
        phaseSuccess();
    }

    async function phaseSuccess() {
        terminalPush('---AUTH_SUCCESS---');
        terminalPush(`SESSION_ID: ${randomUUID()}`);

        dom.passwordWrapper.classList.remove('state-loading');
        dom.passwordWrapper.classList.add('state-success');
        dom.loginBtn.classList.remove('loading');

        if (audioManager) audioManager.granted.play();
        await sleep(600);

        // Hide login form
        await animate(dom.fieldGroup, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
        dom.fieldGroup.style.display = 'none';

        // Hide disclaimer
        await animate(dom.disclaimer, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });

        // Determine if first-time or returning user
        const savedProfile = loadProfile();
        const isFirstTime = !savedProfile || !savedProfile.profileSetupComplete;

        // Show typewriter
        positionTypewriter();
        dom.typewriter.style.opacity = '1';
        setTypewriterText(isFirstTime ? 'IDENTITY SETUP' : 'MEMBER CARD');

        await sleep(400);

        // Transition to identity card
        phaseIdentity();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IDENTITY CARD (view mode = printed / edit mode = character creation)
    // ═══════════════════════════════════════════════════════════════════════════
    async function phaseIdentity() {
        currentState = State.IDENTITY;
        if (audioManager) audioManager.scan.play();

        // Load saved profile to determine mode
        const profile = loadProfile() || {};
        const isFirstTime = !profile.profileSetupComplete;
        const memberId = profile.memberId || generateMemberId();

        // Pre-fill identity card with login data + saved profile
        dom.cardNameInput.value = nameValue.trim() || profile.name || 'HAC MEMBER';
        dom.cardEmailInput.value = emailValue.trim() || profile.email || 'member@hac.edu';
        if (profile.clearance) dom.cardClearanceInput.value = profile.clearance;
        if (profile.designation) dom.cardDesignationInput.value = profile.designation;
        if (profile.studentId && dom.cardStudentIdInput) dom.cardStudentIdInput.value = profile.studentId;
        dom.cardId.textContent = memberId;

        // Sync display values from inputs
        syncCardDisplayFromInputs();

        // Load avatar if saved
        if (profile.avatar && dom.avatarImg) {
            dom.avatarImg.src = profile.avatar;
            dom.avatarImg.classList.add('visible');
        }

        // Generate QR code
        refreshQR();

        // Set card mode: first time = edit, returning = view
        if (isFirstTime) {
            setCardMode('edit');
            terminalPush('FIRST_TIME_SETUP: EDIT_MODE');
        } else {
            setCardMode('view');
            terminalPush('PROFILE_LOADED: VIEW_MODE');
        }

        // Show identity card
        dom.identityCard.classList.add('visible');

        // Reveal fields with stagger
        const fields = dom.identityCard.querySelectorAll('.identity-card__field');
        for (let i = 0; i < fields.length; i++) {
            await sleep(120);
            fields[i].classList.add('visible');
            if (i === 0 && audioManager) audioManager.stdin.play();
        }

        await sleep(200);
        if (audioManager) audioManager.info.play();

        terminalPush('IDENTITY_CARD_ACTIVE');
        terminalPush(isFirstTime ? 'AWAITING_PROFILE_SETUP' : 'AWAITING_CONFIRMATION');
    }

    async function handleCardConfirm() {
        if (currentState !== State.IDENTITY) return;
        currentState = State.EXIT;

        if (audioManager) audioManager.granted.play();

        // Always save the latest values (whether from view or edit mode)
        syncCardDisplayFromInputs();

        const profile = loadProfile() || {};
        profile.name = dom.cardNameInput.value || 'HAC MEMBER';
        profile.email = dom.cardEmailInput.value || 'member@hac.edu';
        profile.clearance = dom.cardClearanceInput.value || 'BUILDER';
        profile.designation = dom.cardDesignationInput.value || 'AI COLLECTIVE MEMBER';
        profile.studentId = dom.cardStudentIdInput?.value || '';
        profile.memberId = dom.cardId.textContent;
        profile.lastLogin = new Date().toISOString();
        profile.qrData = buildQRPayload();
        profile.profileSetupComplete = true;

        // Save avatar if uploaded
        if (dom.avatarImg && dom.avatarImg.src && dom.avatarImg.classList.contains('visible')) {
            profile.avatar = dom.avatarImg.src;
        }

        saveProfile(profile);

        terminalPush('---IDENTITY_CONFIRMED---');
        terminalPush('PROFILE_SAVED_TO_LOCAL');

        // Hide identity card
        dom.identityCard.classList.remove('visible');
        await sleep(400);

        // Typewriter
        await typewriterOverwrite('WELCOME TO HAC');
        await sleep(500);

        // Hide typewriter
        await animate(dom.typewriter, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });

        // Final splash bar
        dom.splashCt.style.opacity = '0';
        dom.splashOs.style.opacity = '0';
        if (audioManager) audioManager.scan.play();

        await animate(dom.splashFinalBar, [{ width: '0%' }, { width: '100%' }], { duration: 1000, easing: EASING.inCirc, fill: 'forwards' });
        await sleep(200);

        stopPanelUpdates();
        stopWidgetUpdates();
        phaseRedirect();
    }

    async function phaseRedirect() {
        currentState = State.REDIRECT;
        if (audioManager) audioManager.theme.play();

        // Hide panels
        if (dom.panelLeft) dom.panelLeft.classList.remove('visible');
        if (dom.panelRight) dom.panelRight.classList.remove('visible');
        if (dom.widgetSession) dom.widgetSession.classList.remove('visible');
        if (dom.widgetSpectrum) dom.widgetSpectrum.classList.remove('visible');

        // Zoom out
        dom.hacAccess.classList.add('zoom-out');
        await sleep(800);

        dom.blackout.classList.add('active');
        await sleep(600);

        window.location.href = CONFIG.redirectUrl;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    let clickToStartEl = null;

    async function init() {
        const root = document.documentElement;
        const { r, g, b } = CONFIG.colors;
        root.style.setProperty('--color_r', r);
        root.style.setProperty('--color_g', g);
        root.style.setProperty('--color_b', b);
        root.style.setProperty('--app_name', `"${CONFIG.appName}"`);

        // Initialize audio
        if (typeof AudioManager !== 'undefined') {
            audioManager = new AudioManager({
                enabled: CONFIG.audio.enabled,
                volume: CONFIG.audio.volume,
                basePath: CONFIG.audio.basePath
            });
        }

        cacheDom();
        clickToStartEl = document.getElementById('click-to-start');

        // Load boot log
        try {
            const response = await fetch(CONFIG.bootLogPath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            bootLog = text.split('\n').filter(line => line.trim() !== '');
        } catch (e) {
            console.warn('Boot log fetch failed, using fallback:', e.message);
            bootLog = generateFallbackBootLog();
        }

        // Setup
        computeVh();
        layoutPositions();
        updateClock();
        setupFormInputs();
        setInterval(updateClock, 1000);

        window.addEventListener('resize', () => {
            computeVh();
            layoutPositions();
            if (currentState >= State.STARTUP && currentState <= State.LOADING) {
                positionFieldGroup();
                positionDisclaimer();
            }
            if (dom.typewriter.style.opacity === '1') {
                positionTypewriter();
            }
        });

        // Load saved profile
        const savedProfile = loadProfile();
        if (savedProfile) {
            if (savedProfile.name && dom.nameInput) { dom.nameInput.value = savedProfile.name; nameValue = savedProfile.name; }
            if (savedProfile.email && dom.emailInput) { dom.emailInput.value = savedProfile.email; emailValue = savedProfile.email; }
        }

        // Click to start
        if (clickToStartEl) await waitForClickToStart();

        currentState = State.BOOT;
        displayBootLine();
    }

    function waitForClickToStart() {
        return new Promise(resolve => {
            if (!clickToStartEl) { resolve(); return; }
            const handleClick = () => {
                if (audioManager) audioManager.expand.play();
                clickToStartEl.classList.add('hidden');
                clickToStartEl.removeEventListener('click', handleClick);
                setTimeout(resolve, 300);
            };
            clickToStartEl.addEventListener('click', handleClick);
        });
    }

    // Start
    if (document.fonts) {
        document.fonts.ready.then(init);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
