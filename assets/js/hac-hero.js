/**
 * HAC Hero  –  Splash → Image Cycle → Pan → Landing
 * + ScrollTrigger reveals + Magnetic cursor + Refined timing
 * Depends on GSAP 3.13+ & ScrollTrigger
 */
document.addEventListener('DOMContentLoaded', () => {
    // Guard: if GSAP failed to load from CDN, release the hero overlay gracefully
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.classList.add('is--landed');
            hero.style.position = 'relative';
            hero.style.zIndex = '1';
        }
        const content = document.querySelector('.hero-content');
        if (content) { content.style.visibility = 'visible'; content.style.opacity = '1'; }
        const nav = document.querySelector('.nav');
        if (nav) { nav.style.opacity = '1'; }
        document.body.style.cursor = 'auto';
        console.warn('HAC: GSAP not loaded — hero animation skipped.');
        return;
    }

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.registerPlugin(ScrollTrigger);
    initHacSplash(prefersReducedMotion);
    initCursor(prefersReducedMotion);
});

/* ===================================================================
   SPLASH  →  HERO ANIMATION
   =================================================================== */
function initHacSplash(reducedMotion) {
    const hero       = document.querySelector('.hero');
    if (!hero) return;

    const container  = document.querySelector('.hac-scale-container');
    const box        = document.querySelector('.hac-image-box');
    const images     = document.querySelectorAll('.hac-img');
    const chars      = document.querySelectorAll('.hac-char-inner');
    const content    = document.querySelector('.hero-content');
    const lockup     = document.querySelector('.hero-lockup');
    const title      = document.querySelector('.hero-title');
    const ctas       = document.querySelector('.hero-ctas');
    const nav        = document.querySelector('.nav');

    /* ---------- Initial state ---------- */
    gsap.set(container, { scale: 1, xPercent: -50, yPercent: -50 });
    gsap.set(chars,     { yPercent: 120 });
    gsap.set(box,       { width: 0 });
    gsap.set(images,    { autoAlpha: 0 });
    gsap.set(content,   { autoAlpha: 0, y: 48 });
    if (lockup) gsap.set(lockup, { autoAlpha: 0, y: 24, scale: 0.97 });
    if (title)  gsap.set(title,  { autoAlpha: 0, y: 24 });
    if (ctas)   gsap.set(ctas,   { autoAlpha: 0, y: 24 });
    if (nav)    gsap.set(nav,    { autoAlpha: 0, y: -24 });

    /* ---------- Skip splash for reduced-motion users ---------- */
    if (reducedMotion) {
        hero.classList.add('is--landed');
        if (container) container.style.display = 'none';
        gsap.set(content, { autoAlpha: 1, y: 0 });
        if (lockup) gsap.set(lockup, { autoAlpha: 0.95, y: 0, scale: 1 });
        if (title)  gsap.set(title,  { autoAlpha: 1, y: 0 });
        if (ctas)   gsap.set(ctas,   { autoAlpha: 1, y: 0 });
        if (nav)    gsap.set(nav,    { autoAlpha: 1, y: 0 });
        hero.offsetHeight; // force reflow before reveals
        initScrollReveals();
        return;
    }

    /* ---------- Timeline ---------- */
    const tl = gsap.timeline({
        defaults: { ease: 'expo.inOut' },
        onComplete: initScrollReveals,
    });

    // — 1. Reveal H and AC  (letters slide up with stagger)
    tl.to(chars, {
        yPercent: 0,
        duration: 1.0,
        stagger: 0.06,
        ease: 'expo.out',
    }, 0.3);

    // — 2. Expand the image box (big 80%-height circle blob)
    tl.to(box, {
        width: '0.75em',
        duration: 1.3,
        ease: 'power4.inOut',
    }, '-=0.5');

    // — 3. Cycle images (fast cuts — rhythmic)
    if (images.length) {
        tl.set(images[0], { autoAlpha: 1 }, '<0.3');

        for (let i = 1; i < images.length; i++) {
            tl.set(images[i - 1], { autoAlpha: 0 }, `+=${0.35}`);
            tl.set(images[i],     { autoAlpha: 1 });
        }

        // Brief hold on last image
        tl.to({}, { duration: 0.5 });
    }

    // — 4. Transition to hero landing
    tl.addLabel('land');

    // Scale container down to final compact size
    tl.to(container, {
        scale: 0.35,
        autoAlpha: 0,
        xPercent: -50,
        yPercent: -50,
        duration: 1.4,
        ease: 'power4.inOut',
    }, 'land');

    // Collapse the image box
    tl.to(box, {
        width: 0,
        duration: 1.0,
        ease: 'power3.inOut',
    }, 'land+=0.15');

    // Fade letters
    tl.to(chars, {
        autoAlpha: 0,
        duration: 0.5,
        ease: 'power2.in',
    }, 'land+=0.3');

    // Switch hero from fixed → relative
    tl.call(() => {
        hero.classList.add('is--landed');
        // Collapse splash elements out of layout flow
        container.style.display = 'none';
        // Trigger reflow for smooth transition
        hero.offsetHeight;
    }, null, 'land+=0.9');

    // — 5. Reveal hero content
    tl.addLabel('reveal', 'land+=0.9');

    // Content wrapper
    tl.to(content, {
        autoAlpha: 1,
        y: 0,
        duration: 0.01,
    }, 'reveal-=0.05');

    if (lockup) {
        tl.to(lockup, {
            autoAlpha: 0.95,
            y: 0,
            scale: 1,
            duration: 1.0,
            ease: 'power3.out',
        }, 'reveal');
    }

    if (title) {
        tl.to(title, {
            autoAlpha: 1,
            y: 0,
            duration: 1.0,
            ease: 'power3.out',
        }, 'reveal+=0.12');
    }

    if (ctas) {
        tl.to(ctas, {
            autoAlpha: 1,
            y: 0,
            duration: 1.0,
            ease: 'power3.out',
        }, 'reveal+=0.24');
    }

    // — 6. Show nav
    if (nav) {
        tl.to(nav, {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
        }, 'reveal+=0.1');
    }
}

/* ===================================================================
   SCROLL REVEALS  –  ScrollTrigger-driven section entrances
   =================================================================== */
function initScrollReveals() {
    const reveals = document.querySelectorAll('[data-reveal]');
    if (!reveals.length) return;

    reveals.forEach((el, i) => {
        // Determine stagger offset for sibling reveals
        const siblings = el.parentElement ? el.parentElement.querySelectorAll('[data-reveal]') : [];
        const siblingIndex = Array.from(siblings).indexOf(el);

        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                end: 'top 50%',
                toggleActions: 'play none none none',
            },
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: siblingIndex * 0.08,
            ease: 'power3.out',
        });
    });

    // Parallax on the hero lockup (subtle depth)
    const heroLockup = document.querySelector('.hero-lockup');
    if (heroLockup) {
        gsap.to(heroLockup, {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
            },
            yPercent: -8,
            scale: 0.96,
            ease: 'none',
        });
    }

    // Parallax on hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        gsap.to(heroTitle, {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
            },
            yPercent: 12,
            opacity: 0.4,
            ease: 'none',
        });
    }

    // Line draw on the laws borders
    document.querySelectorAll('.law').forEach((law) => {
        gsap.from(law, {
            scrollTrigger: {
                trigger: law,
                start: 'top 90%',
                toggleActions: 'play none none none',
            },
            clipPath: 'inset(0 100% 0 0)',
            duration: 1.2,
            ease: 'power4.inOut',
        });
    });

    ScrollTrigger.refresh();
}

/* ===================================================================
   GRADIENT CURSOR FILL  –  Raw WebGL liquid gradient
   Extracted from CodePen interactive-liquid-gradient.
   Zero dependencies — renders animated shader into a <canvas>
   inside the .cursor element.
   =================================================================== */
function initGradientFill(cursorEl) {
    const SIZE = 64;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    canvas.className = 'cursor-gradient';
    cursorEl.appendChild(canvas);

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) { canvas.remove(); return null; }

    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }

    const vs = compile(gl.VERTEX_SHADER, `
        attribute vec2 a_pos;
        varying vec2 vUv;
        void main() {
            vUv = a_pos * 0.5 + 0.5;
            gl_Position = vec4(a_pos, 0.0, 1.0);
        }
    `);

    // Fragment shader — liquid gradient logic extracted from CodePen
    // Colours mapped to HAC palette: accent, accent-light, accent-deep
    const fs = compile(gl.FRAGMENT_SHADER, `
        precision mediump float;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            float t = uTime;

            // HAC palette
            vec3 accent   = vec3(0.898, 0.294, 0.165);  // #E54B2A
            vec3 light    = vec3(0.957, 0.627, 0.553);  // #F4A08D
            vec3 deep     = vec3(0.698, 0.165, 0.063);  // #B22A10

            // 6 animated gradient centres (CodePen pattern)
            vec2 c1 = vec2(0.5 + sin(t*0.4)*0.4,  0.5 + cos(t*0.5)*0.4);
            vec2 c2 = vec2(0.5 + cos(t*0.6)*0.5,  0.5 + sin(t*0.45)*0.5);
            vec2 c3 = vec2(0.5 + sin(t*0.35)*0.45, 0.5 + cos(t*0.55)*0.45);
            vec2 c4 = vec2(0.5 + cos(t*0.5)*0.4,  0.5 + sin(t*0.4)*0.4);
            vec2 c5 = vec2(0.5 + sin(t*0.7)*0.35,  0.5 + cos(t*0.6)*0.35);
            vec2 c6 = vec2(0.5 + cos(t*0.45)*0.5,  0.5 + sin(t*0.65)*0.5);

            float i1 = 1.0 - smoothstep(0.0, 0.45, length(uv - c1));
            float i2 = 1.0 - smoothstep(0.0, 0.45, length(uv - c2));
            float i3 = 1.0 - smoothstep(0.0, 0.45, length(uv - c3));
            float i4 = 1.0 - smoothstep(0.0, 0.45, length(uv - c4));
            float i5 = 1.0 - smoothstep(0.0, 0.45, length(uv - c5));
            float i6 = 1.0 - smoothstep(0.0, 0.45, length(uv - c6));

            // Blend with time-varying intensity
            vec3 col = vec3(0.0);
            col += accent * i1 * (0.55 + 0.45 * sin(t));
            col += light  * i2 * (0.55 + 0.45 * cos(t * 1.2));
            col += deep   * i3 * (0.55 + 0.45 * sin(t * 0.8));
            col += accent * i4 * (0.55 + 0.45 * cos(t * 1.3));
            col += light  * i5 * (0.55 + 0.45 * sin(t * 1.1));
            col += deep   * i6 * (0.55 + 0.45 * cos(t * 0.9));

            // Rotating radial overlay for depth
            vec2 rot = uv - 0.5;
            float a = t * 0.15;
            rot = vec2(rot.x*cos(a) - rot.y*sin(a), rot.x*sin(a) + rot.y*cos(a));
            float rad = 1.0 - smoothstep(0.0, 0.7, length(rot));
            col += mix(accent, deep, rad) * 0.35;

            col = clamp(col * 1.8, 0.0, 1.0);

            // Saturation boost
            float lum = dot(col, vec3(0.299, 0.587, 0.114));
            col = mix(vec3(lum), col, 1.35);
            col = pow(col, vec3(0.92));

            // Soft circular mask
            float mask = 1.0 - smoothstep(0.42, 0.5, length(uv - 0.5));

            gl_FragColor = vec4(col, mask);
        }
    `);

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(prog, 'uTime');
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.viewport(0, 0, SIZE, SIZE);

    let time = 0;
    let lastT = performance.now();

    // Returns render callback for the cursor tick loop
    return function renderGradient() {
        const now = performance.now();
        time += (now - lastT) / 1000;
        lastT = now;
        gl.uniform1f(uTimeLoc, time);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
}

/* ===================================================================
   CURSOR  –  Liquid gradient + Magnetic buttons + Hover states
   =================================================================== */
function initCursor(reducedMotion) {
    const cursor = document.querySelector('.cursor');
    if (!cursor) return;
    if (reducedMotion) { cursor.style.display = 'none'; return; }

    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (isTouch) {
        document.body.classList.add('no-custom-cursor');
        return;
    }

    // Enable custom cursor — only now do we hide the default one
    document.body.classList.add('has-custom-cursor');

    /* --- Gradient fill (WebGL) --- */
    const renderGradient = initGradientFill(cursor);
    if (renderGradient) cursor.classList.add('has-gradient');

    let mouseX = -100, mouseY = -100;
    let curX   = -100, curY   = -100;
    const ease = 0.14;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!cursor.classList.contains('is-visible')) cursor.classList.add('is-visible');
    });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
    document.addEventListener('mouseenter', () => cursor.classList.add('is-visible'));

    // Pause WebGL when tab is hidden
    let tabVisible = true;
    document.addEventListener('visibilitychange', () => { tabVisible = !document.hidden; });

    (function tick() {
        if (tabVisible) {
            curX += (mouseX - curX) * ease;
            curY += (mouseY - curY) * ease;
            cursor.style.left = curX + 'px';
            cursor.style.top  = curY + 'px';
            if (renderGradient) renderGradient();
        }
        requestAnimationFrame(tick);
    })();

    /* --- Interactive hover states (event delegation — single listener) --- */
    const INTERACTIVE_SELECTORS = 'a, button, .btn, .build-item, .step';
    const TEXT_SELECTORS = 'p, h1, h2, h3, h4, li, blockquote, .hero-desc';

    document.addEventListener('mouseover', (e) => {
        const interactive = e.target.closest(INTERACTIVE_SELECTORS);
        const text = e.target.closest(TEXT_SELECTORS);
        if (interactive) {
            cursor.classList.add('is-hover');
            cursor.classList.remove('is-text');
        } else if (text && !text.closest(INTERACTIVE_SELECTORS)) {
            cursor.classList.add('is-text');
        }
    });
    document.addEventListener('mouseout', (e) => {
        const interactive = e.target.closest(INTERACTIVE_SELECTORS);
        const text = e.target.closest(TEXT_SELECTORS);
        if (interactive) cursor.classList.remove('is-hover');
        if (text) cursor.classList.remove('is-text');
    });

    /* --- Magnetic buttons (gsap.quickTo for perf) --- */
    const magneticBtns = document.querySelectorAll('.btn-magnetic');

    magneticBtns.forEach((btn) => {
        const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });

        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
                xTo(dx * 0.3);
                yTo(dy * 0.3);
                cursor.classList.add('is-magnetic');
            }
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
            cursor.classList.remove('is-magnetic');
        });
    });
}
