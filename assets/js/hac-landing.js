/**
 * HAC Landing Page – JavaScript
 * Handles: smooth scroll, nav, mobile menu, fade-in animations, dynamic year, WhatsApp fallback
 */
(function () {
    'use strict';

    // ============================
    // DOM References
    // ============================
    const nav         = document.querySelector('.nav');
    const navToggle   = document.querySelector('.nav-toggle');
    const navLinks    = document.querySelector('.nav-links');
    const allNavLinks = document.querySelectorAll('.nav-links a');
    const sections    = document.querySelectorAll('section[id]');
    const fadeEls     = document.querySelectorAll('.fade-in');

    // ============================
    // Smooth Scroll
    // ============================
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            var target = document.getElementById(href.substring(1));
            if (!target) return;
            var offset = nav ? nav.offsetHeight : 0;
            window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
            // Close mobile menu if open
            if (navLinks && navLinks.classList.contains('is-open')) {
                closeMobileMenu();
            }
        });
    });

    // ============================
    // Nav Scroll Shadow
    // ============================
    function handleNavScroll() {
        if (!nav) return;
        if (window.scrollY > 80) {
            nav.classList.add('nav--scrolled');
        } else {
            nav.classList.remove('nav--scrolled');
        }
    }
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

    // ============================
    // Active Section Highlighting
    // ============================
    function highlightActiveSection() {
        var scrollPos = window.scrollY + 160;
        sections.forEach(function (section) {
            var top    = section.offsetTop;
            var height = section.offsetHeight;
            var id     = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + height) {
                allNavLinks.forEach(function (link) {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    window.addEventListener('scroll', highlightActiveSection, { passive: true });
    highlightActiveSection();

    // ============================
    // Mobile Menu Toggle
    // ============================
    function closeMobileMenu() {
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        if (navLinks)  navLinks.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function openMobileMenu() {
        if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
        if (navLinks)  navLinks.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    if (navToggle) {
        navToggle.addEventListener('click', function () {
            var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    // Close menu on link click
    allNavLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            closeMobileMenu();
        });
    });

    // Close menu on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMobileMenu();
    });

    // ============================
    // Intersection Observer – Fade-In
    // ============================
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // animate once
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px'
        });

        fadeEls.forEach(function (el) {
            observer.observe(el);
        });
    } else {
        // Fallback: show everything immediately
        fadeEls.forEach(function (el) {
            el.classList.add('is-visible');
        });
    }

    // ============================
    // Dynamic Year
    // ============================
    var yearEl = document.querySelector('.js-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // ============================
    // WhatsApp Link Validation
    // ============================
    var waLink = document.querySelector('a[href*="whatsapp.com/your-invite-link"]');
    if (waLink) {
        waLink.addEventListener('click', function (e) {
            e.preventDefault();
            alert('WhatsApp community link coming soon! Contact us at hultaicollective@gmail.com in the meantime.');
        });
    }

    // ============================
    // Console Branding
    // ============================
    console.log(
        '%cHAC %c- Hult AI Collective',
        'font-size:24px;font-weight:bold;color:#1A365D;',
        'font-size:16px;color:#2D3748;'
    );
    console.log(
        '%cBuild. Automate. Ship.',
        'font-size:14px;color:#FF6B6B;font-style:italic;'
    );
    console.log(
        '%c> kartavya.tech',
        'font-size:12px;color:#20C997;'
    );

})();
