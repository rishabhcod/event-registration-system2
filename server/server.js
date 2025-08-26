// server/server.js
// Must be CommonJS (require) since this file uses require()
require('dotenv').config(); // <-- MUST be first

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// --- Environment vars
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// --- Mongoose models (inline for simplicity)
// Event model: holds registrations as subdocuments
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: Date,
  location: String,
  totalSeats: { type: Number, default: 0 },
  availableSeats: { type: Number, default: 0 },
  registrations: [
    {
      name: String,
      email: String,
      phone: String,
      ticketId: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

// --- Connect to MongoDB
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set in .env');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected');
  seedEventsIfNeeded().catch(err => console.error('Seed error', err));
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message || err);
  process.exit(1);
});

// --- Seed some events if DB empty (dev convenience)
async function seedEventsIfNeeded() {
  const count = await Event.countDocuments();
  if (count === 0) {
    await Event.create([
      {
        title: 'Tech Meetup 2025',
        description: 'A casual meetup to learn, network, and build projects together.',
        date: new Date('2025-09-01T18:00:00Z'),
        location: 'VIT-AP Auditorium',
        totalSeats: 100,
        availableSeats: 100
      },
      {
        title: 'Frontend Workshop',
        description: 'Hands-on workshop: React basics, components and state.',
        date: new Date('2025-09-15T14:00:00Z'),
        location: 'Room 12B',
        totalSeats: 30,
        availableSeats: 30
      }
    ]);
    console.log('🔧 Seeded sample events');
  }
}

// --- Middleware: admin auth
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// --- Routes

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// GET /api/events - list all events
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }).lean();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// POST /api/events - create new event (admin only)
app.post('/api/events', adminAuth, async (req, res) => {
  try {
    const { title, description, date, location, totalSeats } = req.body;
    const evt = new Event({
      title,
      description,
      date,
      location,
      totalSeats: totalSeats || 0,
      availableSeats: totalSeats || 0
    });
    await evt.save();
    res.json({ message: 'Event created', event: evt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// POST /api/events/:id/register - register user (atomic seat decrement + push reg)
app.post('/api/events/:id/register', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { name, email, phone } = req.body;

    if (!name || !email) return res.status(400).json({ message: 'name and email required' });

    // Generate simple ticket id
    const ticketId = crypto.randomBytes(4).toString('hex');

    // Atomic update: decrement availableSeats only if >0 and push registration
    const updated = await Event.findOneAndUpdate(
      { _id: eventId, availableSeats: { $gt: 0 } },
      {
        $inc: { availableSeats: -1 },
        $push: { registrations: { name, email, phone, ticketId, createdAt: new Date() } }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ message: 'Event not found or no seats available' });
    }

    // Find the registration we just pushed
    const reg = updated.registrations.find(r => r.ticketId === ticketId);

    return res.json({
      message: 'Registered',
      ticketId,
      event: {
        id: updated._id,
        title: updated.title,
        date: updated.date,
        location: updated.location
      },
      registration: reg || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Admin login: POST /api/admin/login { username, password } => token
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username & password required' });

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({ token });
    }

    return res.status(401).json({ message: 'Invalid admin credentials' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Admin: get all registrations (across events)
app.get('/api/admin/registrations', adminAuth, async (req, res) => {
  try {
    const events = await Event.find().lean();
    // build flattened list
    const regs = [];
    for (const e of events) {
      for (const r of e.registrations || []) {
        regs.push({
          eventId: e._id,
          eventTitle: e.title,
          name: r.name,
          email: r.email,
          phone: r.phone,
          ticketId: r.ticketId,
          createdAt: r.createdAt
        });
      }
    }
    res.json(regs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
});

// Admin: delete a registration by ticketId (and restore seat)
app.delete('/api/admin/registrations/:ticketId', adminAuth, async (req, res) => {
  try {
    const { ticketId } = req.params;
    // Find the event containing the registration
    const ev = await Event.findOne({ 'registrations.ticketId': ticketId });
    if (!ev) return res.status(404).json({ message: 'Registration not found' });

    // Remove the registration and increment availableSeats
    await Event.updateOne(
      { _id: ev._id },
      {
        $pull: { registrations: { ticketId } },
        $inc: { availableSeats: 1 }
      }
    );

    res.json({ message: 'Deleted registration and restored seat' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete registration' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
});
