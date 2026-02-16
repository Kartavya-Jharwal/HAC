/* ═══════════════════════════════════════════════════════════════
   ctOS Web — Main Orchestration Engine
   Recreates the full QML animation state machine in vanilla JS
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ─── CONSTANTS ───────────────────────────────────────────────
  const EASING = {
    inOutCirc:  'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
    outQuint:   'cubic-bezier(0.22, 1, 0.36, 1)',
    inExpo:     'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
    outExpo:    'cubic-bezier(0.19, 1, 0.22, 1)',
    inSine:     'cubic-bezier(0.47, 0, 0.745, 0.715)',
    outCubic:   'cubic-bezier(0.33, 1, 0.68, 1)',
    inCubic:    'cubic-bezier(0.32, 0, 0.67, 0)',
    inQuart:    'cubic-bezier(0.5, 0, 0.75, 0)',
    inCirc:     'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
  };

  // ─── STATE ───────────────────────────────────────────────────
  const State = {
    BOOT: 0,
    SPLASH: 1,
    STARTUP: 2,
    IDLE: 3,
    LOADING: 4,
    SUCCESS: 5,
    CONFIRM_WAIT: 6,
    EXIT: 7,
    BLACKOUT: 8,
  };

  let currentState = State.BOOT;
  let passwordValue = '';
  let terminalPaused = false;
  let terminalQueue = [];
  let terminalLineCount = 0;
  const MAX_TERMINAL_LINES = 10;

  // ─── DOM REFS ────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {};

  function cacheDom() {
    dom.ctos = $('#ctos');
    dom.blackout = $('#blackout');
    dom.bar = $('#bar');
    dom.time = $('#time');
    dom.timeInfo = $('#time-info');
    dom.clock = $('#clock');
    dom.date = $('#date');
    dom.status = $('#status');
    dom.splashContainer = $('#splash-container');
    dom.splash = $('#splash');
    dom.splashBar = $('#splash-bar');
    dom.splashCt = $('#splash-ct');
    dom.splashOs = $('#splash-os');
    dom.splashFinalBar = $('#splash-final-bar');
    dom.fieldGroup = $('#field-group');
    dom.passwordWrapper = $('#password-wrapper');
    dom.passwordInput = $('#password-input');
    dom.passwordDisplay = $('#password-display');
    dom.loginBtn = $('#login-btn');
    dom.spinner = $('#spinner');
    dom.spinnerCells = $$('.spinner__cell:not(.spinner__cell--center)');
    dom.username = $('#username');
    dom.typewriter = $('#typewriter');
    dom.typewriterText = $('#typewriter-text');
    dom.confirmation = $('#confirmation');
    dom.confirmEnter = $('#confirm-enter');
    dom.disclaimer = $('#disclaimer');
    dom.disclaimerIcon = $('.disclaimer__icon');
    dom.disclaimerTextBlock = $('#disclaimer-text');
    dom.terminal = $('#terminal');
    dom.terminalLog = $('#terminal-log');
    dom.deviceId = $('#device-id');
    dom.identityCard = $('#identity-card');
    dom.toast = $('#toast');
  }

  // ─── UTILITIES ───────────────────────────────────────────────
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

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function animate(el, keyframes, options) {
    return new Promise(resolve => {
      const anim = el.animate(keyframes, options);
      anim.onfinish = () => {
        // Apply final state
        if (options.fill !== 'none') {
          const last = keyframes[keyframes.length - 1];
          for (const [k, v] of Object.entries(last)) {
            el.style[k] = v;
          }
        }
        resolve();
      };
    });
  }

  function randomDelay(min = 200, max = 500) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // ─── VIEWPORT UNITS ─────────────────────────────────────────
  function computeVh() {
    const vh = window.innerHeight / 1080;
    document.documentElement.style.setProperty('--vh', vh);
    return vh;
  }

  // ─── CLOCK ───────────────────────────────────────────────────
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    dom.clock.textContent = `${h}:${m}`;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const day = days[now.getDay()];
    const date = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    dom.date.textContent = `${day} ${date} ${month}`;
  }

  // ─── TERMINAL ────────────────────────────────────────────────
  function terminalPush(msg, pauseMarker = '') {
    terminalQueue.push({ msg, pauseMarker });
  }

  async function terminalProcess() {
    while (terminalQueue.length > 0) {
      if (terminalPaused) {
        await sleep(100);
        continue;
      }

      const item = terminalQueue.shift();
      addTerminalLine(item.msg);

      if (item.pauseMarker) {
        terminalPaused = true;
        onTerminalPause(item.pauseMarker);
        continue;
      }

      await sleep(randomDelay());
    }
  }

  function addTerminalLine(text) {
    const li = document.createElement('div');
    li.className = 'terminal__line';

    // Check for separator pattern: ---TEXT---
    if (/^---.*---$/.test(text)) {
      const inner = text.replace(/^-+/, '').replace(/-+$/, '');
      li.classList.add('terminal__line--separator');
      li.textContent = `——— ${inner} ———`;
    } else {
      li.textContent = `» ${text}`;
    }

    dom.terminalLog.appendChild(li);
    terminalLineCount++;

    // Force reflow then show
    void li.offsetWidth;
    li.classList.add('visible');

    // Remove old lines
    while (dom.terminalLog.children.length > MAX_TERMINAL_LINES) {
      dom.terminalLog.removeChild(dom.terminalLog.firstChild);
    }
  }

  function terminalUnpause() {
    terminalPaused = false;
  }

  // ─── SPINNER ─────────────────────────────────────────────────
  let spinnerInterval = null;

  //
  function initSpinner() {
    // Map the non-center cells to clockwise order
    // Grid layout: [0][1][2] / [3][center][5] / [6][7][8]
    // Non-center cells in DOM order: 0,1,2,3,5,6,7,8 (index 4 is center)
    // Clockwise: TL(0), T(1), TR(2), R(5), BR(8), B(7), BL(6), L(3)
    const clockwise = [0, 1, 2, 5, 8, 7, 6, 3]; // data-index values
    let step = 0;

    function tick() {
      $$('.spinner__cell:not(.spinner__cell--center)').forEach(c => {
        c.style.background = 'var(--background)';
      });
      const targetDataIdx = clockwise[step % clockwise.length];
      const cell = dom.spinner.querySelector(`[data-index="${targetDataIdx}"]`);
      if (cell) cell.style.background = 'var(--text-secondary)';
      step++;
    }

    return { tick, reset: () => { step = 0; } };
  }

  let spinnerController = null;

  function activateSpinner() {
    dom.spinner.classList.add('active');
    dom.loginBtn.classList.add('loading');
    if (!spinnerController) spinnerController = initSpinner();
    spinnerController.reset();
    spinnerInterval = setInterval(() => spinnerController.tick(), 100);
  }

  function deactivateSpinner() {
    clearInterval(spinnerInterval);
    dom.spinner.classList.remove('active');
    dom.loginBtn.classList.remove('loading');
  }

  // ─── PASSWORD FIELD ──────────────────────────────────────────
  function renderPassword() {
    const blocks = passwordValue.split('').map(() => '█').join('');
    dom.passwordDisplay.innerHTML = blocks +
      '<span class="password-cursor">▁</span>';
  }

  function setupPasswordInput() {
    // Click on wrapper focuses hidden input
    dom.passwordWrapper.addEventListener('click', () => {
      if (currentState === State.IDLE) {
        dom.passwordInput.focus();
      }
    });

    dom.passwordInput.addEventListener('input', (e) => {
      if (currentState !== State.IDLE) return;
      passwordValue = e.target.value;
      renderPassword();
    });

    dom.passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (currentState === State.IDLE && passwordValue.length > 0) {
          handleLogin();
        } else if (currentState === State.CONFIRM_WAIT) {
          handleConfirm();
        }
      }
    });

    // Global keydown for confirm
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && currentState === State.CONFIRM_WAIT) {
        handleConfirm();
      }
    });
  }

  // ─── ACCENTS ANIMATION ──────────────────────────────────────
  function animateAccents(container, duration = 100) {
    const marks = container.querySelectorAll('.accents__mark');
    marks.forEach((mark, i) => {
      mark.style.opacity = '0';
      setTimeout(() => {
        mark.animate([
          { opacity: 0 },
          { opacity: 1 }
        ], { duration: 50, fill: 'forwards' });
        mark.style.opacity = '1';
      }, i * 30);
    });
  }

  // ─── SURFACE ANIMATION ──────────────────────────────────────
  async function animateSurface(surfaceEl) {
    const barLeft = surfaceEl.querySelector('.surface__bar-left');
    const barRight = surfaceEl.querySelector('.surface__bar-right');
    const content = surfaceEl.querySelector('.surface__content');

    // Phase 1: bars scaleY
    await Promise.all([
      animate(barLeft, [
        { transform: 'scaleY(0)' },
        { transform: 'scaleY(1)' }
      ], { duration: 320, easing: EASING.outCubic, fill: 'forwards' }),
      animate(barRight, [
        { transform: 'scaleY(0)' },
        { transform: 'scaleY(1)' }
      ], { duration: 320, easing: EASING.outCubic, fill: 'forwards' })
    ]);

    // Phase 2: content expands
    await animate(content, [
      { transform: 'scaleX(0)' },
      { transform: 'scaleX(1)' }
    ], { duration: 400, easing: EASING.outQuint, fill: 'forwards' });
  }

  // ─── TYPEWRITER ──────────────────────────────────────────────
  function setTypewriterText(text) {
    dom.typewriterText.textContent = text;
  }

  async function typewriterOverwrite(newText) {
    const oldText = dom.typewriterText.textContent;
    const maxLen = Math.max(oldText.length, newText.length);
    const padOld = oldText.padEnd(maxLen);
    const padNew = newText.padEnd(maxLen);

    for (let i = 0; i < maxLen; i++) {
      const before = padNew.substring(0, i + 1);
      const after = padOld.substring(i + 1);
      dom.typewriterText.textContent = before + after;
      await sleep(60);
    }
    dom.typewriterText.textContent = newText;
  }

  // ─── DISCLAIMER EXIT ────────────────────────────────────────
  async function disclaimerExit() {
    const lines = dom.disclaimerTextBlock.querySelectorAll('.disclaimer__line');
    // Erase characters right-to-left
    for (const line of lines) {
      const text = line.textContent;
      for (let i = text.length; i >= 0; i--) {
        line.textContent = text.substring(0, i);
        await sleep(300 / text.length);
      }
    }
    // Fade icon
    await animate(dom.disclaimerIcon, [
      { opacity: 1 },
      { opacity: 0 }
    ], { duration: 200, fill: 'forwards' });
  }

  // ─── TOAST ───────────────────────────────────────────────────
  function showToast() {
    dom.toast.classList.add('visible');
    setTimeout(() => {
      dom.toast.classList.remove('visible');
    }, 3000);
  }

  // ─── IDENTITY CARD REVEAL ───────────────────────────────────
  async function revealIdentityCard() {
    dom.identityCard.style.opacity = '1';
    dom.identityCard.style.pointerEvents = 'auto';

    const fields = dom.identityCard.querySelectorAll('.identity-card__field');
    for (let i = 0; i < fields.length; i++) {
      await sleep(150);
      fields[i].classList.add('visible');
    }

    // Show barcode
    await sleep(150);
    const barcode = dom.identityCard.querySelector('.identity-card__barcode');
    if (barcode) barcode.classList.add('visible');
  }

  // ─── LAYOUT CALCULATION ──────────────────────────────────────
  const REM_PW = 16; // base character-width rem for password field sizing

  function layoutPositions() {
    const vh = computeVh();
    const h = window.innerHeight;

    // Splash size (mirrors QML: 21.2 * rem × 3.7 * rem)
    const splashW = 21.2 * REM_PW;
    const splashH = 3.7 * REM_PW;
    dom.splashContainer.style.width = splashW + 'px';
    dom.splashContainer.style.height = splashH + 'px';

    // Field group & disclaimer width matches splash
    dom.fieldGroup.style.width = splashW + 'px';
    dom.disclaimer.style.width = splashW + 'px';

    // Password wrapper height (3.10 * rem)
    dom.passwordWrapper.style.height = (3.10 * REM_PW) + 'px';
  }

  function getVh() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--vh')) || 1;
  }

  function positionFieldGroup() {
    const splashRect = dom.splashContainer.getBoundingClientRect();
    const margin = 50 * getVh();
    dom.fieldGroup.style.top = (splashRect.bottom + margin) + 'px';
  }

  function positionTypewriter() {
    const splashRect = dom.splashContainer.getBoundingClientRect();
    dom.typewriter.style.top = (splashRect.top - 44) + 'px';
  }

  function positionConfirmation() {
    const splashRect = dom.splashContainer.getBoundingClientRect();
    dom.confirmation.style.top = (splashRect.bottom + 30) + 'px';
  }

  function positionDisclaimer() {
    const fieldRect = dom.fieldGroup.getBoundingClientRect();
    const loginRect = dom.loginBtn.getBoundingClientRect();
    dom.disclaimer.style.top = (loginRect.bottom + 15 * getVh()) + 'px';
  }

  // ═══════════════════════════════════════════════════════════════
  //  PHASE ORCHESTRATION
  // ═══════════════════════════════════════════════════════════════

  // ── Phase 0: BOOT ──────────────────────────────────────────
  async function phaseBoot() {
    currentState = State.BOOT;

    // Show terminal immediately
    dom.terminal.style.opacity = '1';

    // Queue initial messages
    terminalPush('REGION_LINK_ESTABLISHED : AU-SOUTH-EAST-2');
    terminalPush(`LOG_STREAM_CONNECTED // ${randomUUID()}`);
    terminalPush(`WL_OUTPUT_FOUND: eDP-1 <-> ADDR_PTR: 0x${randomHex()}`);
    terminalPush('---GREETER_UI_INITIALIZING---', 'UI_INIT');

    // Start processing
    terminalProcess();
  }

  function onTerminalPause(marker) {
    if (marker === 'UI_INIT') {
      phaseSplash();
    }
  }

  // ── Phase 1: SPLASH REVEAL ─────────────────────────────────
  async function phaseSplash() {
    currentState = State.SPLASH;

    const bar = dom.splashBar;

    // Animate accents on splash
    animateAccents(dom.splashContainer.querySelector('.accents'));

    // Phase 1a: Progress 0 → 40% (700ms)
    await animate(bar, [
      { width: '0%' },
      { width: '40%' }
    ], { duration: 700, easing: EASING.inSine, fill: 'forwards' });

    // ── MIDWAY SIGNAL → trigger Time, DeviceId, Status
    triggerMidwayReveal();

    // Phase 1b: Progress 40% → 100% (300ms)
    await animate(bar, [
      { width: '40%' },
      { width: '100%' }
    ], { duration: 300, easing: EASING.inSine, fill: 'forwards' });

    // Phase 1c: bar briefly thins then expands to full height (350ms)
    bar.style.width = '100%';
    bar.style.transformOrigin = 'center center';
    await animate(bar, [
      { transform: 'scaleY(0.04)' },
      { transform: 'scaleY(1)' }
    ], { duration: 350, easing: EASING.inSine, fill: 'forwards' });

    // Show "OS" text
    dom.splashOs.style.opacity = '1';
    await animate(dom.splashOs, [
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 150, fill: 'forwards' });

    // Retract bar to 73% to reveal "CT" on the left
    await animate(bar, [
      { width: '100%' },
      { width: '73%' }
    ], { duration: 300, easing: EASING.outCubic, fill: 'forwards' });

    // Reveal "CT" text
    dom.splashCt.style.opacity = '1';
    await animate(dom.splashCt, [
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 150, fill: 'forwards' });

    // Small pause for visual weight
    await sleep(100);

    // Splash reveal finished → trigger startup
    phaseStartup();
  }

  // ── Midway Reveal (Time, DeviceId, Status) ────────────────
  function triggerMidwayReveal() {
    // Time reveal
    dom.time.style.opacity = '1';
    animateAccents(dom.time.querySelector('.accents'));
    setTimeout(() => {
      dom.timeInfo.animate([
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 300, easing: EASING.inExpo, fill: 'forwards' });
      dom.timeInfo.style.opacity = '1';
    }, 200);

    // Device ID reveal
    setTimeout(() => {
      dom.deviceId.style.opacity = '1';
      const barcode = dom.deviceId.querySelector('.device-id__barcode');
      const tesseract = dom.deviceId.querySelector('.device-id__tesseract');
      const text = dom.deviceId.querySelector('.device-id__text');
      const rule = dom.deviceId.querySelector('.device-id__rule');

      barcode.animate([
        { opacity: 0 },
        { opacity: 1 }
      ], { duration: 300, easing: EASING.inExpo, fill: 'forwards' });
      barcode.style.opacity = '1';

      rule.animate([
        { opacity: 0 },
        { opacity: 1 }
      ], { duration: 300, easing: EASING.inExpo, fill: 'forwards' });
      rule.style.opacity = '1';

      setTimeout(() => {
        tesseract.animate([
          { opacity: 0, transform: 'translateX(20px)' },
          { opacity: 1, transform: 'translateX(0)' }
        ], { duration: 300, easing: EASING.inExpo, fill: 'forwards' });
        tesseract.style.opacity = '1';

        text.animate([
          { opacity: 0, transform: 'translateX(20px)' },
          { opacity: 1, transform: 'translateX(0)' }
        ], { duration: 300, easing: EASING.inExpo, fill: 'forwards' });
        text.style.opacity = '1';
      }, 150);
    }, 100);

    // Status reveal
    setTimeout(() => {
      dom.status.style.opacity = '1';
      animateSurface(dom.status.querySelector('.surface'));
    }, 200);
  }

  // ── Phase 2: STARTUP ───────────────────────────────────────
  async function phaseStartup() {
    currentState = State.STARTUP;

    // Splash slides from center (50%) to 40.6%
    await animate(dom.splashContainer, [
      { top: '50%' },
      { top: '40.6%' }
    ], { duration: 500, easing: EASING.inOutCirc, fill: 'forwards' });

    // Calculate positions after splash move
    positionFieldGroup();
    positionDisclaimer();

    // Disclaimer fades in
    dom.disclaimer.style.opacity = '1';
    dom.disclaimerIcon.style.opacity = '1';

    // Field group fades in after 300ms delay
    await sleep(300);

    dom.fieldGroup.style.opacity = '1';
    dom.fieldGroup.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 200, easing: EASING.outExpo, fill: 'forwards' });

    // Unpause terminal
    terminalUnpause();

    // Add remaining terminal messages
    terminalPush(`◈ [BLUME_IDP] Protocol::CTOS_GREETD`);
    terminalPush(`[SENTINEL ] CIPHER_NEGOTIATED <-> bnet://0x8D2A4F1B:1443`);
    terminalPush(`[BLUME_IDP] Opened session for user(${dom.username.textContent})`);

    phaseIdle();
  }

  // ── Phase 3: IDLE ──────────────────────────────────────────
  function phaseIdle() {
    currentState = State.IDLE;

    // Focus password input
    dom.passwordInput.focus();
    renderPassword();

    // Login button click handler
    dom.loginBtn.addEventListener('click', () => {
      if (currentState === State.IDLE && passwordValue.length > 0) {
        handleLogin();
      }
    });
  }

  // ── Phase 4: LOGIN ─────────────────────────────────────────
  async function handleLogin() {
    currentState = State.LOADING;

    // Show toast
    showToast();

    // Visual loading state
    dom.passwordWrapper.classList.add('state-loading');
    activateSpinner();

    // Fake loading delay (1.5s)
    await sleep(1500);

    // Always succeed (dummy login)
    phaseSuccess();
  }

  // ── Phase 5: SUCCESS ───────────────────────────────────────
  async function phaseSuccess() {
    currentState = State.SUCCESS;

    deactivateSpinner();
    dom.passwordWrapper.classList.remove('state-loading');
    dom.passwordWrapper.classList.add('state-success');

    // Terminal messages
    terminalPush(`[BLUME_IDP] IDENTITY_VERIFIED // WELCOME BACK`);
    terminalPush(`[BLUME_IDP] Session closed for user(${dom.username.textContent})`);

    // Disclaimer exit (non-blocking)
    disclaimerExit();

    await sleep(200);

    // Slide splash back to center, fade out field group
    const splashSlide = animate(dom.splashContainer, [
      { top: dom.splashContainer.style.top || '40.6%' },
      { top: '50%' }
    ], { duration: 500, easing: EASING.inOutCirc, fill: 'forwards' });

    const fieldFade = animate(dom.fieldGroup, [
      { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
      { opacity: 0, transform: 'translateX(-50%) translateY(-30px)' }
    ], { duration: 200, fill: 'forwards' });

    await Promise.all([splashSlide, fieldFade]);

    dom.fieldGroup.style.display = 'none';

    // Morph splash into card frame (490 × 260)
    const cardW = 490;
    const cardH = 260;
    await Promise.all([
      animate(dom.splashContainer, [
        { width: dom.splashContainer.style.width },
        { width: cardW + 'px' }
      ], { duration: 300, fill: 'forwards' }),
      animate(dom.splashContainer, [
        { height: dom.splashContainer.style.height },
        { height: cardH + 'px' }
      ], { duration: 300, fill: 'forwards' })
    ]);

    // Show identity card
    await revealIdentityCard();

    // Show typewriter
    positionTypewriter();
    setTypewriterText('IDENTITY VERIFIED');
    dom.typewriter.style.opacity = '1';
    dom.typewriter.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 200, fill: 'forwards' });

    // Show confirmation
    positionConfirmation();
    dom.confirmation.style.opacity = '1';
    dom.confirmation.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 200, fill: 'forwards' });
    dom.confirmation.classList.add('breathing');

    currentState = State.CONFIRM_WAIT;
  }

  // ── Phase 6: CONFIRM ───────────────────────────────────────
  async function handleConfirm() {
    if (currentState !== State.CONFIRM_WAIT) return;
    currentState = State.EXIT;

    // Highlight ENTER in green
    dom.confirmEnter.style.color = 'var(--success)';

    // Typewriter overwrite
    await typewriterOverwrite('ENTERING SYSTEM');

    // Fade confirmation
    dom.confirmation.classList.remove('breathing');
    await animate(dom.confirmation, [
      { opacity: 1 },
      { opacity: 0 }
    ], { duration: 200, easing: EASING.inExpo, fill: 'forwards' });

    // Fade identity card
    await animate(dom.identityCard, [
      { opacity: 1 },
      { opacity: 0 }
    ], { duration: 200, fill: 'forwards' });

    // Shrink splash to thin line
    await Promise.all([
      animate(dom.splashContainer, [
        { width: dom.splashContainer.offsetWidth + 'px' },
        { width: dom.typewriter.offsetWidth + 'px' }
      ], { duration: 300, fill: 'forwards' }),
      animate(dom.splashContainer, [
        { height: dom.splashContainer.offsetHeight + 'px' },
        { height: '5px' }
      ], { duration: 300, fill: 'forwards' })
    ]);

    // Hide text in splash
    dom.splashCt.style.opacity = '0';
    dom.splashOs.style.opacity = '0';

    // Final progress bar
    await animate(dom.splashFinalBar, [
      { width: '0%' },
      { width: '100%' }
    ], { duration: 1000, easing: EASING.inCirc, fill: 'forwards' });

    await sleep(200);

    // Fade typewriter
    await animate(dom.typewriter, [
      { opacity: 1 },
      { opacity: 0 }
    ], { duration: 300, fill: 'forwards' });

    // Blackout
    phaseBlackout();
  }

  // ── Phase 7: BLACKOUT → LOOP ───────────────────────────────
  async function phaseBlackout() {
    currentState = State.BLACKOUT;

    dom.blackout.classList.add('active');
    await sleep(2000);

    // Reset everything and loop
    resetAll();
    dom.blackout.classList.remove('active');
    await sleep(500);

    phaseBoot();
  }

  // ─── RESET ───────────────────────────────────────────────────
  function resetAll() {
    passwordValue = '';
    terminalQueue = [];
    terminalLineCount = 0;
    terminalPaused = false;

    // Clear terminal
    dom.terminalLog.innerHTML = '';

    // Reset splash
    dom.splashContainer.style.top = '50%';
    dom.splashContainer.style.width = '';
    dom.splashContainer.style.height = '';
    dom.splashBar.style.width = '0%';
    dom.splashBar.style.transform = '';
    dom.splashCt.style.opacity = '0';
    dom.splashOs.style.opacity = '0';
    dom.splashFinalBar.style.width = '0%';

    // Reset accents
    $$('.accents__mark').forEach(m => m.style.opacity = '0');

    // Reset field group
    dom.fieldGroup.style.display = 'flex';
    dom.fieldGroup.style.opacity = '0';
    dom.fieldGroup.style.transform = 'translateX(-50%)';

    // Reset password
    dom.passwordWrapper.classList.remove('state-loading', 'state-success', 'state-failed');
    dom.passwordInput.value = '';
    renderPassword();

    // Reset components
    dom.time.style.opacity = '0';
    dom.timeInfo.style.opacity = '0';
    dom.status.style.opacity = '0';
    dom.deviceId.style.opacity = '0';
    dom.terminal.style.opacity = '0';
    dom.typewriter.style.opacity = '0';
    dom.confirmation.style.opacity = '0';
    dom.confirmation.classList.remove('breathing');
    dom.confirmEnter.style.color = 'var(--ctos-gray)';
    dom.disclaimer.style.opacity = '0';
    dom.disclaimerIcon.style.opacity = '0';
    dom.identityCard.style.opacity = '0';
    dom.identityCard.style.pointerEvents = 'none';

    // Reset surface bars
    dom.status.querySelectorAll('.surface__bar-left, .surface__bar-right').forEach(b => {
      b.style.transform = 'scaleY(0)';
    });
    dom.status.querySelector('.surface__content').style.transform = 'scaleX(0)';

    // Reset device ID inner elements
    dom.deviceId.querySelectorAll('.device-id__tesseract, .device-id__text, .device-id__rule, .device-id__barcode').forEach(el => {
      el.style.opacity = '0';
    });

    // Reset identity card fields
    dom.identityCard.querySelectorAll('.identity-card__field').forEach(f => {
      f.classList.remove('visible');
    });
    const idBarcode = dom.identityCard.querySelector('.identity-card__barcode');
    if (idBarcode) idBarcode.classList.remove('visible');

    // Reset disclaimer text
    const disclaimerLines = dom.disclaimerTextBlock.querySelectorAll('.disclaimer__line');
    disclaimerLines[0].textContent = 'Property of Blume Corp. All usage is';
    disclaimerLines[1].textContent = 'subject to Sentinel Active Monitoring.';

    // Reset typewriter
    dom.typewriterText.textContent = '';

    // Recalculate layout
    layoutPositions();
  }

  // ═══════════════════════════════════════════════════════════════
  //  INITIALIZATION
  // ═══════════════════════════════════════════════════════════════
  function init() {
    cacheDom();
    computeVh();
    layoutPositions();
    updateClock();
    setupPasswordInput();

    // Update clock every second
    setInterval(updateClock, 1000);

    // Recalculate on resize
    window.addEventListener('resize', () => {
      computeVh();
      layoutPositions();
      if (currentState >= State.IDLE) {
        positionFieldGroup();
        positionDisclaimer();
      }
      if (currentState === State.CONFIRM_WAIT) {
        positionTypewriter();
        positionConfirmation();
      }
    });

    // Show the page
    dom.ctos.classList.add('initialized');

    // Begin
    phaseBoot();
  }

  // Wait for DOM + fonts
  if (document.fonts) {
    document.fonts.ready.then(init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
