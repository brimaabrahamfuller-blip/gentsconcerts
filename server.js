const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

async function readDb() {
  const raw = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/* ==========================================================================
   EVENTS ENDPOINTS
   ========================================================================== */

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.events || []);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load events.' });
  }
});

// Create a new event
app.post('/api/events', async (req, res) => {
  try {
    const db = await readDb();
    const event = {
      id: Date.now(),
      name: req.body.name,
      category: req.body.category || 'music',
      date: req.body.date,
      time: req.body.time,
      venue: req.body.venue,
      city: req.body.city,
      description: req.body.description,
      price: Number(req.body.price || 0),
      maxAttendees: Number(req.body.maxAttendees || 0),
      organizer: req.body.organizer,
      contactEmail: req.body.contactEmail,
      image: req.body.image || 'assets/images/event1.jpg'
    };
    db.events = db.events || [];
    db.events.push(event);
    await writeDb(db);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create event.' });
  }
});

// Update an existing event (Admin/Host)
app.put('/api/events/:id', async (req, res) => {
  try {
    const db = await readDb();
    const index = (db.events || []).findIndex(e => e.id === Number(req.params.id));
    if (index === -1) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    
    db.events[index] = { 
      ...db.events[index], 
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : db.events[index].price,
      maxAttendees: req.body.maxAttendees !== undefined ? Number(req.body.maxAttendees) : db.events[index].maxAttendees
    };
    
    await writeDb(db);
    res.json(db.events[index]);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update event.' });
  }
});

// Delete an event (Admin/Host)
app.delete('/api/events/:id', async (req, res) => {
  try {
    const db = await readDb();
    db.events = (db.events || []).filter(e => e.id !== Number(req.params.id));
    await writeDb(db);
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete event.' });
  }
});

/* ==========================================================================
   TICKETS ENDPOINTS
   ========================================================================== */

// Book a ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const db = await readDb();
    const ticket = {
      id: Date.now(),
      event: req.body.event,
      date: req.body.date,
      venue: req.body.venue,
      type: req.body.type,
      quantity: Number(req.body.quantity || 1),
      total: req.body.total,
      image: req.body.image || 'assets/images/event1.jpg'
    };
    db.tickets = db.tickets || [];
    db.tickets.push(ticket);
    await writeDb(db);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Unable to book ticket.' });
  }
});

// Get all booked tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.tickets || []);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load tickets.' });
  }
});

/* ==========================================================================
   CONTACT / MESSAGES ENDPOINTS
   ========================================================================== */

// Submit a contact message
app.post('/api/contact', async (req, res) => {
  try {
    const db = await readDb();
    const message = {
      id: Date.now(),
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message,
      date: new Date().toISOString()
    };
    db.contacts = db.contacts || [];
    db.contacts.push(message);
    await writeDb(db);
    res.status(201).json({ message: 'Contact request received.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to submit contact request.' });
  }
});

// Get all contact messages (Admin View)
app.get('/api/contact', async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.contacts || []);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load contact messages.' });
  }
});

// Admin stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const db = await readDb();
    const stats = {
      totalRevenue: (db.tickets || []).reduce((acc, t) => acc + (t.total || 0), 0),
      ticketsSold: (db.tickets || []).reduce((acc, t) => acc + (t.quantity || 0), 0),
      activeEvents: (db.events || []).length,
      inquiries: (db.contacts || []).length
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load admin stats.' });
  }
});

/* ==========================================================================
   USER AUTHENTICATION ENDPOINTS
   ========================================================================== */

// Register user
app.post('/api/register', async (req, res) => {
  try {
    const db = await readDb();
    db.users = db.users || [];
    const existing = db.users.find(user => user.email === req.body.email);
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    const user = {
      id: Date.now(),
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password
    };
    db.users.push(user);
    await writeDb(db);
    res.status(201).json({ message: 'Registration successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to register user.' });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const db = await readDb();
    db.users = db.users || [];
    const user = db.users.find(u => u.email === req.body.email && u.password === req.body.password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    res.json({ message: 'Login successful.', user: { id: user.id, email: user.email, fullName: user.fullName } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to authenticate user.' });
  }
});

/* ==========================================================================
   WILDCARD CATCH-ALL ROUTE
   ========================================================================== */

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`GentsConcerts backend running on http://localhost:${PORT}`);
});
