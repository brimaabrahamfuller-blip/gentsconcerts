/* ========================================
   GentsConcerts - Profile JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    initializeProfile();
});

async function initializeProfile() {
    const loginGate = document.getElementById('loginGate');
    const profileContent = document.getElementById('profileContent');
    const loadingState = document.getElementById('loadingState');
    const logoutBtn = document.getElementById('logoutBtn');

    // Get token from localStorage
    const token = localStorage.getItem('gentsToken');

    if (!token) {
        showLoginGate();
        return;
    }

    try {
        const response = await window.gentsApi.getProfile(token);
        
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('gentsToken');
            showLoginGate();
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const user = await response.json();
        renderProfile(user);
    } catch (error) {
        console.error('Profile Error:', error);
        alert('Could not load profile. Please try logging in again.');
        showLoginGate();
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('gentsToken');
            window.location.href = 'login.html';
        });
    }
}

function showLoginGate() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('loginGate').style.display = 'block';
    document.getElementById('profileContent').style.display = 'none';
}

function renderProfile(user) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('loginGate').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';

    document.getElementById('profileName').textContent = user.fullName || user.name || 'User';
    document.getElementById('profileEmail').textContent = user.email || '';
    document.getElementById('profilePhone').textContent = user.phone || 'Not provided';
    document.getElementById('profileRole').textContent = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'User';
    
    if (user.createdAt) {
        const date = new Date(user.createdAt);
        document.getElementById('profileJoined').textContent = date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    }
}
