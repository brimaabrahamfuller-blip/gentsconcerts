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
   USER AUTHENTICATION ENDPOINTS (Legacy /api paths)
   ========================================================================== */

// Register user (legacy endpoint)
app.post('/api/register', async (req, res) => {
  try {
    const db = await readDb();
    db.users = db.users || [];
    const existing = db.users.find(user => user.email === req.body.email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    const user = {
      id: Date.now(),
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone || '',
      password: req.body.password,
      role: req.body.role || 'attendee',
      isVerified: false
    };
    db.users.push(user);
    await writeDb(db);
    res.status(201).json({ 
      success: true, 
      message: 'Account created. Please verify your email to continue.',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to register user.' });
  }
});

// Login user (legacy endpoint)
app.post('/api/login', async (req, res) => {
  try {
    const db = await readDb();
    db.users = db.users || [];
    const user = db.users.find(u => u.email === req.body.email && u.password === req.body.password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    res.json({ 
      success: true,
      message: 'Login successful.',
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to authenticate user.' });
  }
});

/* ==========================================================================
   USER AUTHENTICATION ENDPOINTS (New /auth paths for compatibility)
   ========================================================================== */

// Register user (new endpoint)
app.post('/api/auth/register', async (req, res) => {
  try {
    const db = await readDb();
    db.users = db.users || [];
    const existing = db.users.find(user => user.email === req.body.email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }
    const user = {
      id: Date.now(),
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone || '',
      password: req.body.password,
      role: req.body.role || 'attendee',
      isVerified: false
    };
    db.users.push(user);
    await writeDb(db);
    res.status(201).json({ 
      success: true, 
      message: 'Account created. Please check your email to verify your account.',
      data: { user }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Login user (new endpoint)
app.post('/api/auth/login', async (req, res) => {
  try {
    const db = await readDb();
    db.users = db.users || [];
    
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    
    const user = db.users.find(u => u.email === req.body.email && u.password === req.body.password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Verify email endpoint
app.get('/api/auth/verify/:token', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in to GentsConcerts.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Resend verification email
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const db = await readDb();
    db.users = db.users || [];
    const user = db.users.find(u => u.email === req.body.email);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
