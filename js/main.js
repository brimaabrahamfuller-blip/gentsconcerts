/* ========================================
   GentsConcerts - Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    initializeNavbarScroll();
    initializeSmoothScroll();
    initializeGenericSearch();
    initializeAuthTabs();
    initializeContactSubmission();
    initializeTicketCalculator();
    initializeCopyLink();
    initializeHamburgerMenu();
    initializeFAQ();
    initializeCountdown();
});

function initializeNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    const updateNavbarShadow = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
    updateNavbarShadow();
    window.addEventListener('scroll', updateNavbarShadow);
}

function initializeSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                event.preventDefault();
                const target = document.querySelector(href);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initializeGenericSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const term = this.value.toLowerCase().trim();
            const grid = document.querySelector('.events-grid');
            if (!grid) return;
            const cards = grid.querySelectorAll('.event-card');
            let visible = 0;
            cards.forEach(card => {
                const name = card.querySelector('.event-name').textContent.toLowerCase();
                const match = name.includes(term) || term === '';
                card.style.display = match ? 'flex' : 'none';
                if (match) visible++;
            });
            const noResults = document.getElementById('noResults');
            if (noResults) noResults.style.display = (visible === 0 && term !== '') ? 'block' : 'none';
        });
    });
}

function initializeAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    if (!tabs.length) return;
    const loginWrapper = document.getElementById('loginForm');
    const signupWrapper = document.getElementById('signupForm');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            if (target === 'login') {
                loginWrapper.style.display = 'block';
                signupWrapper.style.display = 'none';
            } else {
                loginWrapper.style.display = 'none';
                signupWrapper.style.display = 'block';
            }
        });
    });

    const loginForm = document.getElementById('loginFormElement');
    const signupForm = document.getElementById('signupFormElement');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleRegister);
}

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const data = {
        email: form.email.value,
        password: form.password.value,
    };
    try {
        const response = await window.gentsApi.login(data);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Login failed');
        
        alert('Login successful!');
        window.location.href = 'profile.html';
    } catch (error) {
        alert(error.message);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const roleElement = form.querySelector('input[name="role"]:checked');
    const data = {
        fullName: form.fullName.value,
        email: form.email.value,
        phone: form.phone.value,
        password: form.password.value,
        confirmPassword: form.confirmPassword.value,
        role: roleElement ? roleElement.value : 'attendee'
    };
    if (data.password !== data.confirmPassword) {
        alert('Passwords do not match.');
        return;
    }
    try {
        const response = await window.gentsApi.register(data);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Sign up failed');
        alert('Sign up successful! Please check your email for verification.');
        form.reset();
    } catch (error) {
        alert(error.message);
    }
}

function initializeContactSubmission() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    contactForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
    });
}

function initializeTicketCalculator() {
    const type = document.getElementById('ticketType');
    const qty = document.getElementById('ticketQty');
    const total = document.getElementById('totalPrice');
    if (!type || !qty || !total) return;
    function updateTotal() {
        total.textContent = (parseFloat(type.value) * parseInt(qty.value, 10) || 0).toFixed(2);
    }
    type.addEventListener('change', updateTotal);
    qty.addEventListener('change', updateTotal);
    updateTotal();
}

function initializeCopyLink() {
    const copyBtn = document.getElementById('copyLink');
    if (!copyBtn) return;
    copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy Link'; }, 1500);
        });
    });
}

function initializeHamburgerMenu() {
    const hamburger = document.getElementById('hamburgerMenu');
    const navList = document.getElementById('navList');
    if (!hamburger || !navList) return;

    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        hamburger.classList.toggle('active');
        navList.classList.toggle('active');
    });

    document.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navList.classList.remove('active');
    });
}

function initializeFAQ() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            item.classList.toggle('active');
        });
    });
}

function initializeCountdown() {
    const timer = document.getElementById('launchTimer');
    if (!timer) return;
    
    const launchDate = new Date('2026-08-01T00:00:00').getTime();
    
    const updateTimer = () => {
        const now = new Date().getTime();
        const diff = launchDate - now;
        
        if (diff < 0) {
            timer.innerHTML = 'OFFICIALLY LAUNCHED!';
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    };
    
    setInterval(updateTimer, 1000);
    updateTimer();
}
