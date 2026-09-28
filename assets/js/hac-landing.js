/**
 * HAC Landing - JS
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
    // Nav - Scroll-aware hide/show (rAF throttled)
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
    // AY26-27 Survival Modal
    // Layered above hero; does not replace hac-hero splash
    // ============================
    (function initSurviveModal() {
        var END = new Date('2026-10-01T14:30:00+01:00').getTime();
        var STORAGE_KEY = 'hac_survive_modal_dismissed';
        var root = document.getElementById('conditional-open-modal');
        if (!root) return;

        if (Date.now() >= END || sessionStorage.getItem(STORAGE_KEY) === '1') {
            root.hidden = true;
            return;
        }

        var countdownEl = root.querySelector('[data-survive-countdown]');
        var tickId = null;
        var opened = false;

        function pad(n) {
            return n < 10 ? '0' + n : String(n);
        }

        function formatRemaining(ms) {
            if (ms <= 0) return '00:00:00';
            var totalSec = Math.floor(ms / 1000);
            var h = Math.floor(totalSec / 3600);
            var m = Math.floor((totalSec % 3600) / 60);
            var s = totalSec % 60;
            return pad(h) + ':' + pad(m) + ':' + pad(s);
        }

        function updateCountdown() {
            var remaining = END - Date.now();
            if (countdownEl) countdownEl.textContent = formatRemaining(remaining);
            if (remaining <= 0) {
                closeModal(false);
            }
        }

        function openModal() {
            if (opened) return;
            if (Date.now() >= END || sessionStorage.getItem(STORAGE_KEY) === '1') return;
            opened = true;
            root.hidden = false;
            root.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(function () {
                root.classList.add('is-open');
            });
            document.body.classList.add('survive-modal-open');
            updateCountdown();
            tickId = setInterval(updateCountdown, 1000);
            var firstBtn = root.querySelector('.survive-modal__ctas a, .survive-modal__dismiss');
            if (firstBtn) firstBtn.focus();
        }

        function closeModal(persist) {
            if (persist) sessionStorage.setItem(STORAGE_KEY, '1');
            root.classList.remove('is-open');
            root.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('survive-modal-open');
            if (tickId) {
                clearInterval(tickId);
                tickId = null;
            }
            setTimeout(function () {
                root.hidden = true;
            }, 350);
        }

        root.querySelectorAll('[data-survive-dismiss]').forEach(function (el) {
            el.addEventListener('click', function () {
                closeModal(true);
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && root.classList.contains('is-open')) {
                closeModal(true);
            }
        });

        // Wait for existing hero splash to land before showing modal
        var hero = document.querySelector('.hero');
        var FALLBACK_MS = 5600;

        function scheduleOpen() {
            openModal();
        }

        if (hero && hero.classList.contains('is--landed')) {
            setTimeout(scheduleOpen, 400);
        } else if (hero) {
            var observer = new MutationObserver(function () {
                if (hero.classList.contains('is--landed')) {
                    observer.disconnect();
                    setTimeout(scheduleOpen, 500);
                }
            });
            observer.observe(hero, { attributes: true, attributeFilter: ['class'] });
            setTimeout(function () {
                observer.disconnect();
                scheduleOpen();
            }, FALLBACK_MS);
        } else {
            setTimeout(scheduleOpen, 600);
        }
    })();

    // ============================
    // Console
    // ============================
    console.log(
        '%cHAC %c· Hult AI Collective',
        'font-size:20px;font-weight:bold;color:#E54B2A;',
        'font-size:14px;color:#6B6B6B;'
    );

})();
