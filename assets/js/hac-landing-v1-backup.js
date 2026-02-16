/**
 * HAC Landing Page JavaScript
 * Handles smooth scrolling, navigation highlighting, and interactive elements
 */

(function() {
    'use strict';

    // ===================================
    // Smooth Scroll for Anchor Links
    // ===================================
    
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Don't prevent default if href is just "#"
            if (href === '#') return;
            
            e.preventDefault();
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ===================================
    // Navigation Background on Scroll
    // ===================================
    
    const nav = document.querySelector('.nav');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            nav.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // ===================================
    // Active Section Highlighting in Nav
    // ===================================
    
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    function highlightNav() {
        const scrollPosition = window.pageYOffset + 150;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.style.color = '';
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.style.color = 'var(--accent-coral)';
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNav);
    highlightNav(); // Initial call
    
    // ===================================
    // Intersection Observer for Animations
    // ===================================
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for fade-in animation
    const animatedElements = document.querySelectorAll('.build-card, .timeline-item, .for-column, .gallery-item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // ===================================
    // Mobile Menu Toggle (if needed in future)
    // ===================================
    
    // Placeholder for mobile menu functionality
    // Can be implemented when mobile hamburger menu is added
    
    // ===================================
    // Update Dynamic Year in Footer
    // ===================================
    
    const copyrightYear = document.querySelector('.footer-copyright');
    if (copyrightYear) {
        const currentYear = new Date().getFullYear();
        copyrightYear.innerHTML = copyrightYear.innerHTML.replace('2026', currentYear);
    }
    
    // ===================================
    // WhatsApp Link Validation
    // ===================================
    
    const whatsappLink = document.querySelector('a[href*="whatsapp"]');
    if (whatsappLink && whatsappLink.getAttribute('href') === 'https://chat.whatsapp.com/your-invite-link') {
        whatsappLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('WhatsApp community link will be added soon! Please check back or contact us directly.');
        });
    }
    
    // ===================================
    // Console Easter Egg
    // ===================================
    
    console.log('%cHAC - Hult AI Collective', 'font-size: 24px; font-weight: bold; color: #1e3a8a;');
    console.log('%cBuild. Automate. Ship.', 'font-size: 16px; color: #ff6b9d;');
    console.log('%cInterested in joining? Visit the page to learn more!', 'font-size: 14px; color: #64748b;');
    console.log('%c→ kartavya.tech', 'font-size: 12px; color: #14b8a6;');
    
})();