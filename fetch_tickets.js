const fetch = require('node-fetch');

const API_BASE = 'https://gentsconcerts-backend.onrender.com/api';

async function run() {
    try {
        console.log('Logging in...');
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'gentsconcerts@gmail.com',
                password: 'DanteJoyce2026'
            })
        });
        const loginData = await loginRes.json();
        
        if (!loginRes.ok) {
            console.error('Login failed:', loginData);
            return;
        }

        const token = loginData.token;
        console.log('Login successful. Fetching all tickets (admin)...');

        // As an admin, we should be able to fetch all tickets
        const ticketsRes = await fetch(`${API_BASE}/admin/tickets`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const ticketsData = await ticketsRes.json();

        if (!ticketsRes.ok) {
            console.error('Failed to fetch tickets:', ticketsData);
            return;
        }

        const confirmedTickets = (ticketsData.data || []).filter(t => t.paymentStatus === 'confirmed');
        console.log(JSON.stringify(confirmedTickets, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

run();
