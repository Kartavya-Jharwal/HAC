/**
 * HAC Landing – JS
 * Smooth scroll · Floating nav · Mobile menu · Scroll-driven polish
 */
(function () {
    'use strict';

    // ============================
    // DOM
    // ============================
    const cursor    = document.querySelector('.cursor');
    const nav       = document.querySelector('.nav');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks  = document.querySelector('.nav-links');

    // ============================
    // Touch Detection
    // ============================
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    if (isTouch) {
        document.body.classList.add('no-custom-cursor');
    }

    // Cursor is handled by hac-hero.js

    // ============================
    // Smooth Scroll  (with eased offset)
    // ============================
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            var target = document.getElementById(href.substring(1));
            if (!target) return;

            var offset = 80; // floating nav clearance
            window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
            closeMobileMenu();
        });
    });

    // ============================
    // Nav – Scroll-aware hide/show (rAF throttled)
    // ============================
    if (nav) {
        var lastScroll = 0;
        var navHidden = false;
        var cachedIsMobile = window.innerWidth <= 768;
        var scrollTicking = false;

        window.addEventListener('resize', function () {
            cachedIsMobile = window.innerWidth <= 768;
        }, { passive: true });

        window.addEventListener('scroll', function () {
            if (!scrollTicking) {
                scrollTicking = true;
                requestAnimationFrame(function () {
                    var currentScroll = window.scrollY;

                    if (currentScroll > lastScroll && currentScroll > 400 && !navHidden) {
                        if (cachedIsMobile) {
                            nav.style.transform = 'translateY(-120%)';
                        } else {
                            nav.style.transform = 'translateX(-50%) translateY(-120%)';
                        }
                        nav.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
                        navHidden = true;
                    } else if (currentScroll < lastScroll && navHidden) {
                        if (cachedIsMobile) {
                            nav.style.transform = 'translateY(0)';
                        } else {
                            nav.style.transform = 'translateX(-50%) translateY(0)';
                        }
                        navHidden = false;
                    }

                    lastScroll = currentScroll;
                    scrollTicking = false;
                });
            }
        }, { passive: true });
    }

    // ============================
    // Mobile Menu
    // ============================
    function closeMobileMenu() {
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        if (navLinks) navLinks.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function openMobileMenu() {
        if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
        if (navLinks) navLinks.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    if (navToggle) {
        navToggle.addEventListener('click', function () {
            var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
            isOpen ? closeMobileMenu() : openMobileMenu();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMobileMenu();
    });

    // ============================
    // Dynamic Year
    // ============================
    var yearEl = document.querySelector('.js-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // ============================
    // WhatsApp Placeholder
    // ============================
    document.querySelectorAll('.js-whatsapp').forEach(function (el) {
        if (el.href && el.href.indexOf('your-invite-link') !== -1) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                alert('WhatsApp community link coming soon! Contact hultaicollective@gmail.com in the meantime.');
            });
        }
    });

    // ============================
    // Console
    // ============================
    console.log(
        '%cHAC %c· Hult AI Collective',
        'font-size:20px;font-weight:bold;color:#E54B2A;',
        'font-size:14px;color:#6B6B6B;'
    );

})();
