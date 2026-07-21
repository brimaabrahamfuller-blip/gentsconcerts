// admin.js
export function renderAdminDashboard(targetContainer = document.body) {
  // Clear existing content in the container
  targetContainer.innerHTML = '';

  // 1. Inject Styles
  const styleId = 'admin-dashboard-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      :root {
        --admin-bg: #0f172a;
        --panel-bg: #1e293b;
        --border-color: #334155;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --accent-gold: #f59e0b;
        --accent-blue: #3b82f6;
        --accent-red: #ef4444;
      }
      body {
        margin: 0; padding: 0; display: flex;
        background-color: var(--admin-bg); color: var(--text-main);
        font-family: system-ui, -apple-system, sans-serif; min-height: 100vh;
      }
      .sidebar { width: 250px; background: var(--panel-bg); border-right: 1px solid var(--border-color); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; }
      .brand h2 { font-size: 1.3rem; margin: 0; color: #fff; }
      .brand h2 span { color: var(--accent-gold); }
      .nav-menu { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 2rem; }
      .nav-item { color: var(--text-muted); padding: 0.8rem 1rem; border-radius: 8px; cursor: pointer; }
      .nav-item.active, .nav-item:hover { background: rgba(245, 158, 11, 0.15); color: var(--accent-gold); }
      .main-content { flex: 1; padding: 2rem; overflow-y: auto; }
      .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
      .kpi-card { background: var(--panel-bg); border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 10px; }
      .kpi-card h3 { margin: 0; font-size: 0.85rem; color: var(--text-muted); }
      .kpi-card p { margin: 0.5rem 0 0; font-size: 1.5rem; font-weight: bold; }
      .table-container { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem; overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; text-align: left; }
      th, td { padding: 0.85rem; border-bottom: 1px solid var(--border-color); }
      th { color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; }
      .btn-primary { background: var(--accent-gold); color: #000; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: bold; cursor: pointer; }
      .btn-danger { background: var(--accent-red); color: #fff; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; cursor: pointer; }
      .btn-edit { background: var(--accent-blue); color: #fff; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; cursor: pointer; margin-right: 0.5rem; }
      .tab-section { display: none; }
      .tab-section.active { display: block; }
      .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); justify-content: center; align-items: center; z-index: 1000; }
      .modal.open { display: flex; }
      .modal-content { background: var(--panel-bg); padding: 2rem; border-radius: 12px; width: 100%; max-width: 480px; border: 1px solid var(--border-color); }
      .form-group { margin-bottom: 1rem; display: flex; flex-direction: column; }
      input, select { background: var(--admin-bg); border: 1px solid var(--border-color); color: #fff; padding: 0.6rem; border-radius: 6px; margin-top: 0.3rem; }
    `;
    document.head.appendChild(style);
  }

  // 2. Build Dashboard Layout
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.width = '100%';
  wrapper.style.minHeight = '100vh';

  wrapper.innerHTML = `
    <aside class="sidebar">
      <div>
        <div class="brand"><h2>Gents<span>Concerts</span></h2></div>
        <nav class="nav-menu">
          <div class="nav-item active" data-tab="dashboard">Dashboard</div>
          <div class="nav-item" data-tab="events">Events</div>
          <div class="nav-item" data-tab="tickets">Tickets</div>
          <div class="nav-item" data-tab="messages">Messages</div>
        </nav>
      </div>
    </aside>

    <main class="main-content">
      <header style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
        <h1 id="admin-page-title" style="margin:0;">Host Dashboard</h1>
      </header>

      <!-- TAB: DASHBOARD -->
      <section id="tab-dashboard" class="tab-section active">
        <div class="kpi-grid">
          <div class="kpi-card"><h3>Total Revenue</h3><p id="stat-revenue">$0.00</p></div>
          <div class="kpi-card"><h3>Tickets Sold</h3><p id="stat-tickets">0</p></div>
          <div class="kpi-card"><h3>Active Events</h3><p id="stat-events">0</p></div>
          <div class="kpi-card"><h3>Inquiries</h3><p id="stat-messages">0</p></div>
        </div>
      </section>

      <!-- TAB: EVENTS -->
      <section id="tab-events" class="tab-section">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h2>Manage Concerts</h2>
          <button id="btn-create-ev" class="btn-primary">+ Create Event</button>
        </div>
        <div class="table-container">
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Date</th><th>Venue</th><th>Price</th><th>Actions</th></tr></thead>
            <tbody id="tbl-events-body"></tbody>
          </table>
        </div>
      </section>

      <!-- TAB: TICKETS -->
      <section id="tab-tickets" class="tab-section">
        <h2>Ticket Sales</h2>
        <div class="table-container">
          <table>
            <thead><tr><th>Ticket ID</th><th>Event</th><th>Date</th><th>Type</th><th>Qty</th><th>Total</th></tr></thead>
            <tbody id="tbl-tickets-body"></tbody>
          </table>
        </div>
      </section>

      <!-- TAB: MESSAGES -->
      <section id="tab-messages" class="tab-section">
        <h2>Messages</h2>
        <div class="table-container">
          <table>
            <thead><tr><th>Date</th><th>Sender</th><th>Email</th><th>Subject</th><th>Message</th></tr></thead>
            <tbody id="tbl-messages-body"></tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- MODAL -->
    <div id="modal-ev" class="modal">
      <div class="modal-content">
        <h3 id="modal-ev-title">Event Form</h3>
        <form id="form-ev">
          <input type="hidden" id="ev-id" />
          <div class="form-group"><label>Name</label><input type="text" id="ev-name" required /></div>
          <div class="form-group"><label>Category</label><input type="text" id="ev-cat" required /></div>
          <div class="form-group"><label>Date</label><input type="date" id="ev-date" required /></div>
          <div class="form-group"><label>Time</label><input type="time" id="ev-time" required /></div>
          <div class="form-group"><label>Venue</label><input type="text" id="ev-venue" required /></div>
          <div class="form-group"><label>Price ($)</label><input type="number" step="0.01" id="ev-price" required /></div>
          <div class="form-group"><label>Max Capacity</label><input type="number" id="ev-max" required /></div>
          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
            <button type="button" id="btn-ev-close" class="btn-primary" style="background:#475569; color:#fff;">Cancel</button>
            <button type="submit" class="btn-primary">Save Event</button>
          </div>
        </form>
      </div>
    </div>
  `;

  targetContainer.appendChild(wrapper);

  // 3. Attach Logic & REST API Connections
  initAdminEvents();
}

function initAdminEvents() {
  const API_BASE = '/api';
  const modal = document.getElementById('modal-ev');
  const form = document.getElementById('form-ev');

  // Tab switching
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active'));
      item.classList.add('active');
      const tab = item.getAttribute('data-tab');
      document.getElementById(`tab-${tab}`).classList.add('active');
      document.getElementById('admin-page-title').textContent = item.textContent;
    });
  });

  // Modal open/close
  document.getElementById('btn-create-ev').addEventListener('click', () => {
    form.reset();
    document.getElementById('ev-id').value = '';
    document.getElementById('modal-ev-title').textContent = 'Create Event';
    modal.classList.add('open');
  });

  document.getElementById('btn-ev-close').addEventListener('click', () => modal.classList.remove('open'));

  // Form submit (POST or PUT)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('ev-id').value;
    const payload = {
      name: document.getElementById('ev-name').value,
      category: document.getElementById('ev-cat').value,
      date: document.getElementById('ev-date').value,
      time: document.getElementById('ev-time').value,
      venue: document.getElementById('ev-venue').value,
      price: document.getElementById('ev-price').value,
      maxAttendees: document.getElementById('ev-max').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/events/${id}` : `${API_BASE}/events`;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    modal.classList.remove('open');
    loadData();
  });

  async function loadData() {
    try {
      const [eventsRes, ticketsRes, contactsRes] = await Promise.all([
        fetch(`${API_BASE}/events`),
        fetch(`${API_BASE}/tickets`),
        fetch(`${API_BASE}/contact`)
      ]);

      const events = await eventsRes.json();
      const tickets = await ticketsRes.json();
      const contacts = await contactsRes.json();

      // KPIs
      const rev = tickets.reduce((acc, t) => acc + Number(t.total || 0), 0);
      const tixCount = tickets.reduce((acc, t) => acc + Number(t.quantity || 1), 0);
      document.getElementById('stat-revenue').textContent = `$${rev.toFixed(2)}`;
      document.getElementById('stat-tickets').textContent = tixCount;
      document.getElementById('stat-events').textContent = events.length;
      document.getElementById('stat-messages').textContent = contacts.length;

      // Render Tables
      document.getElementById('tbl-events-body').innerHTML = events.map(e => `
        <tr>
          <td><strong>${e.name}</strong></td>
          <td>${e.category}</td>
          <td>${e.date} ${e.time}</td>
          <td>${e.venue}</td>
          <td>$${Number(e.price).toFixed(2)}</td>
          <td>
            <button class="btn-edit" onclick="window.editAdminEvent(${e.id})">Edit</button>
            <button class="btn-danger" onclick="window.deleteAdminEvent(${e.id})">Delete</button>
          </td>
        </tr>
      `).join('');

      document.getElementById('tbl-tickets-body').innerHTML = tickets.map(t => `
        <tr>
          <td>#${t.id}</td><td>${t.event}</td><td>${t.date}</td><td>${t.type || 'Standard'}</td>
          <td>${t.quantity || 1}</td><td>$${Number(t.total || 0).toFixed(2)}</td>
        </tr>
      `).join('');

      document.getElementById('tbl-messages-body').innerHTML = contacts.map(c => `
        <tr>
          <td>${new Date(c.date).toLocaleDateString()}</td><td>${c.name}</td>
          <td>${c.email}</td><td>${c.subject}</td><td>${c.message}</td>
        </tr>
      `).join('');

      window.deleteAdminEvent = async (id) => {
        if (confirm('Delete event?')) {
          await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
          loadData();
        }
      };

      window.editAdminEvent = (id) => {
        const item = events.find(e => e.id === id);
        if (item) {
          document.getElementById('ev-id').value = item.id;
          document.getElementById('ev-name').value = item.name;
          document.getElementById('ev-cat').value = item.category;
          document.getElementById('ev-date').value = item.date;
          document.getElementById('ev-time').value = item.time;
          document.getElementById('ev-venue').value = item.venue;
          document.getElementById('ev-price').value = item.price;
          document.getElementById('ev-max').value = item.maxAttendees;
          document.getElementById('modal-ev-title').textContent = 'Edit Event';
          modal.classList.add('open');
        }
      };
    } catch (err) {
      console.error(err);
    }
  }

  loadData();
}
