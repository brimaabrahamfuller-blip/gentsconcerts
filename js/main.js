/* ========================================
   GentsConcerts - Main JavaScript
   ======================================== */

const apiBase = '/api';

document.addEventListener('DOMContentLoaded', function() {
    initializeNavbarScroll();
    initializeSmoothScroll();
    initializeGenericSearch();
    initializeEventsPage();
    initializeTicketsPage();
    initializeAuthTabs();
    initializeHostSubmission();
    initializeContactSubmission();
    initializeTicketCalculator();
    initializeTicketPurchase();
    initializeCopyLink();
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

async function initializeEventsPage() {
    const grid = document.querySelector('.events-grid');
    if (!grid) return;
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('eventsSearch');
    const noResults = document.getElementById('noResults');

    async function loadEvents() {
        try {
            const response = await fetch(`${apiBase}/events`);
            const events = await response.json();
            renderEventCards(events);
        } catch (error) {
            console.error('Failed to load events', error);
        }
    }

    function renderEventCards(events) {
        grid.innerHTML = '';
        if (!events.length) {
            grid.innerHTML = '<p class="no-results">No events are available right now.</p>';
            return;
        }
        events.forEach(event => {
            const card = document.createElement('article');
            card.className = 'event-card';
            card.dataset.category = event.category;
            card.innerHTML = `
                <div class="event-image"><img src="${event.image}" alt="${event.name}"></div>
                <div class="event-info">
                    <h3 class="event-name">${event.name}</h3>
                    <p class="event-date">${event.date}</p>
                    <p class="event-venue">${event.venue}</p>
                    <a href="event-detail.html?id=${event.id}" class="ticket-button btn-gold-outline">View Details</a>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function filterCards(category) {
        const cards = grid.querySelectorAll('.event-card');
        cards.forEach(card => {
            const match = category === 'all' || card.dataset.category === category;
            card.style.display = match ? 'flex' : 'none';
        });
        if (noResults) {
            const visible = Array.from(cards).some(card => card.style.display !== 'none');
            noResults.style.display = visible ? 'none' : 'block';
        }
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterCards(this.dataset.category);
        });
    });

    searchInput?.addEventListener('input', function() {
        const term = this.value.toLowerCase().trim();
        const cards = grid.querySelectorAll('.event-card');
        let visible = 0;
        cards.forEach(card => {
            const name = card.querySelector('.event-name').textContent.toLowerCase();
            const match = name.includes(term) || term === '';
            card.style.display = match ? 'flex' : 'none';
            if (match) visible++;
        });
        if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
    });

    await loadEvents();
}

async function initializeTicketsPage() {
    const grid = document.querySelector('.events-grid');
    if (!grid) return;
    const noResults = document.getElementById('noResults');

    try {
        const response = await fetch(`${apiBase}/tickets`);
        const tickets = await response.json();
        grid.innerHTML = '';
        if (!tickets.length) {
            const message = document.createElement('p');
            message.className = 'no-results';
            message.innerHTML = 'You have no tickets yet. <a href="index.html">Explore Events →</a>';
            grid.appendChild(message);
            return;
        }
        tickets.forEach(ticket => {
            const card = document.createElement('article');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-image"><img src="${ticket.image}" alt="${ticket.event}"></div>
                <div class="event-info">
                    <h3 class="event-name">${ticket.event}</h3>
                    <p class="event-date">${ticket.date}</p>
                    <p class="event-venue">${ticket.venue}</p>
                    <p class="event-venue">Ticket Type: ${ticket.type}</p>
                    <div style="display:flex; gap:1rem; align-items:center; margin-top:1rem;">
                        <div class="qr-placeholder">SCAN</div>
                        <button class="btn-gold download-ticket">Download Ticket</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load tickets', error);
        grid.innerHTML = '<p class="no-results">Unable to fetch tickets at this time.</p>';
    }
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
        const response = await fetch(`${apiBase}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Login failed');
        alert('Login successful!');
    } catch (error) {
        alert(error.message);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const data = {
        fullName: form.fullName.value,
        email: form.email.value,
        phone: form.phone.value,
        password: form.password.value,
        confirmPassword: form.confirmPassword.value,
    };
    if (data.password !== data.confirmPassword) {
        alert('Passwords do not match.');
        return;
    }
    try {
        const response = await fetch(`${apiBase}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Sign up failed');
        alert('Sign up successful!');
        form.reset();
    } catch (error) {
        alert(error.message);
    }
}

function initializeHostSubmission() {
    const hostForm = document.getElementById('hostForm');
    if (!hostForm) return;
    hostForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
            name: form.eventName.value,
            date: form.eventDate.value,
            time: form.eventTime.value,
            venue: form.venue.value,
            city: form.city.value,
            description: form.description.value,
            price: form.ticketPrice.value,
            maxAttendees: form.maxAttendees.value,
            organizer: form.organizerName.value,
            contactEmail: form.contactEmail.value,
            category: 'music',
            image: 'assets/images/event1.jpg',
        };
        try {
            const response = await fetch(`${apiBase}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Event submission failed');
            alert('Event submitted successfully!');
            form.reset();
        } catch (error) {
            alert(error.message);
        }
    });
}

function initializeContactSubmission() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    contactForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
            name: form.name.value,
            email: form.email.value,
            subject: form.subject.value,
            message: form.message.value,
        };
        try {
            const response = await fetch(`${apiBase}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Message failed to send');
            alert('Message sent successfully!');
            form.reset();
        } catch (error) {
            alert(error.message);
        }
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

function initializeTicketPurchase() {
    const buyBtn = document.getElementById('buyBtn');
    if (!buyBtn) return;
    buyBtn.addEventListener('click', async function() {
        const type = document.getElementById('ticketType');
        const qty = document.getElementById('ticketQty');
        const total = document.getElementById('totalPrice');
        const data = {
            event: 'Afrobeats Night Live',
            date: 'June 15, 2026',
            venue: 'National Cultural Center',
            type: type.options[type.selectedIndex].text.split(' — ')[0],
            quantity: qty.value,
            total: total.textContent,
            image: 'assets/images/event1.jpg',
        };
        try {
            const response = await fetch(`${apiBase}/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Ticket booking failed');
            alert('Ticket booked successfully!');
        } catch (error) {
            alert(error.message);
        }
    });
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

function handleValidation(form) {
    let valid = true;
    form.querySelectorAll('input[required], textarea[required]').forEach(input => {
        input.classList.toggle('input-error', !input.value.trim());
        if (!input.value.trim()) valid = false;
    });
    return valid;
}
