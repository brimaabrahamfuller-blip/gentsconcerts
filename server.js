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

app.get('/api/events', async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.events || []);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load events.' });
  }
});

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

app.get('/api/tickets', async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.tickets || []);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load tickets.' });
  }
});

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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`GentsConcerts backend running on http://localhost:${PORT}`);
});
