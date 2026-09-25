// ============================================================
//  Podhigai College — Contact Form Backend API
//  Node.js + Express + MongoDB (Mongoose)
// ============================================================

require('dotenv').config();
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS Configuration ─────────────────────────────────────────
// Configurable via process.env.CORS_ORIGINS (comma-separated allowed origins)
// Supports local development (localhost:5500, 127.0.0.1:5500) and Firebase Hosting domains
const defaultAllowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];
const envAllowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, Cloud Run health probes)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.web.app') ||
      origin.endsWith('.firebaseapp.com')
    ) {
      return callback(null, true);
    }
    // Allow any localhost port in development
    if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rate-limit: max 10 contact submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Rate-limit: max 50 admin login attempts per 15 minutes per IP, skip successful logins
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many failed login attempts. Please try again in 15 minutes.' }
});

// ── MongoDB Connection & Auto-Seed ─────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || !MONGODB_URI.trim()) {
  console.error('\n❌  FATAL: MONGODB_URI is missing!');
  console.error('    → Please define MONGODB_URI in backend/.env');
  console.error('    → Example for MongoDB Atlas:');
  console.error('      MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/podhigai_contacts?retryWrites=true&w=majority\n');
  process.exit(1);
}

mongoose.connect(MONGODB_URI.trim())
  .then(async () => {
    const isAtlas = MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('.mongodb.net');
    console.log(`✅  MongoDB connected successfully (${isAtlas ? 'MongoDB Atlas Cloud' : 'Local MongoDB'})`);
    console.log(`    → Database : "${mongoose.connection.name}"`);
    console.log(`    → Host     : ${mongoose.connection.host}`);
    await seedDefaultEvents();
    await seedDefaultGallery();
  })
  .catch(err => {
    console.error('❌  MongoDB connection error:', err.message);
    console.error('    → Check MONGODB_URI in backend/.env');
    console.error('    → If using MongoDB Atlas, check your Database User credentials & Network Access (IP Whitelist).');
  });

mongoose.connection.on('error', (err) => {
  console.error('❌  MongoDB runtime connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected.');
});

// ── Contact Schema & Model ────────────────────────────────────
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
  phone: { type: String, trim: true, maxlength: 20, default: '' },
  subject: { type: String, trim: true, maxlength: 200, default: '' },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  isRead: { type: Boolean, default: false },
  ip: { type: String, default: '' },
}, { timestamps: true });

const Contact = mongoose.model('Contact', contactSchema);

// ── Event Schema & Model ──────────────────────────────────────
const eventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  date: { type: String, required: true, trim: true, maxlength: 100 },
  time: { type: String, trim: true, maxlength: 100, default: '' },
  venue: { type: String, trim: true, maxlength: 200, default: '' },
  category: { type: String, trim: true, maxlength: 100, default: 'General' },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  coverImage: { type: String, trim: true, default: 'images/event-technova-symposium.png' },
  gallery: [{ type: String, trim: true }]
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

// ── Default Flagship Events ───────────────────────────────────
const DEFAULT_FLAGSHIP_EVENTS = [
  {
    id: 'evt_1',
    title: 'TechNova 2026: National Level Technical Symposium & Project Expo',
    date: 'October 15, 2026',
    time: '09:30 AM – 04:30 PM',
    venue: 'Main Academic Block & APJ Auditorium',
    category: 'Symposium',
    description: 'A prestigious inter-collegiate technical convergence featuring paper presentations, AI hackathons, robotics challenges, code-debugging showdowns, and cash awards for engineering innovators.',
    featured: true,
    published: true,
    coverImage: 'images/event-technova-symposium.png',
    gallery: ['images/event-technova-symposium.png', 'images/gallery-computing-lab.png', 'images/gallery-ai-research-lab.png', 'images/gallery-it-innovation-hub.png']
  },
  {
    id: 'evt_2',
    title: 'Annual Placement Day & Corporate Recruiters Felicitation 2026',
    date: 'November 04, 2026',
    time: '10:00 AM – 02:00 PM',
    venue: 'Central Seminar Hall',
    category: 'Placement',
    description: 'Honoring placed graduates across Tier-1 Tech Giants including TCS, Wipro, Infosys, Zoho, Cognizant, and HCL with corporate appointment orders.',
    featured: false,
    published: true,
    coverImage: 'images/event-placement-drive.png',
    gallery: ['images/event-placement-drive.png', 'images/hero-student-life.png', 'images/about-aerial-campus.png']
  },
  {
    id: 'evt_3',
    title: 'National Workshop on Edge Computing & Generative AI Systems',
    date: 'December 12, 2026',
    time: '09:00 AM – 04:00 PM',
    venue: 'Advanced Computing Lab (IT Block)',
    category: 'Workshop',
    description: 'Hands-on industrial masterclass on training large language models on edge devices, real-time IoT computer vision pipelines, and full-stack cloud AI deployment.',
    featured: false,
    published: true,
    coverImage: 'images/event-ai-cloud-workshop.png',
    gallery: ['images/event-ai-cloud-workshop.png', 'images/dept-it.png', 'images/dept-aids.png']
  },
  {
    id: 'evt_4',
    title: 'RoboQuest 2027: Autonomous Drone & Mobile Robotics Challenge',
    date: 'January 20, 2027',
    time: '10:00 AM – 05:00 PM',
    venue: 'Mechanical & Automation Workshop',
    category: 'Competition',
    description: 'Annual robotics arena featuring autonomous maze navigation, drone obstacle maneuvering, and pick-and-place industrial robotic arm simulations.',
    featured: false,
    published: true,
    coverImage: 'images/event-robowar-mech-expo.png',
    gallery: ['images/event-robowar-mech-expo.png', 'images/gallery-mech-workshop.png', 'images/dept-mech.png']
  },
  {
    id: 'evt_5',
    title: 'Podhigai Sangamam: Annual Cultural & Arts Grand Fest 2027',
    date: 'February 18, 2027',
    time: '04:00 PM – 09:30 PM',
    venue: 'Open Air Amphitheatre',
    category: 'Cultural Fest',
    description: 'Mega inter-college celebration of music, classical & western dance, theatrical drama, fine arts exhibitions, and celebrity guest performances.',
    featured: false,
    published: true,
    coverImage: 'images/event-cultural-fest.png',
    gallery: ['images/event-cultural-fest.png', 'images/hero-student-life.png', 'images/gallery-academic-complex.png']
  },
  {
    id: 'evt_6',
    title: 'Smart India 24-Hour Code Marathon & Hackathon 2026',
    date: 'March 05, 2027',
    time: '24 Hours Non-Stop',
    venue: 'Innovation & Incubation Hub',
    category: 'Hackathon',
    description: 'High-intensity 24-hour sprint developing smart city prototypes, fintech pipelines, assistive AI healthcare platforms, and cloud web apps.',
    featured: false,
    published: true,
    coverImage: 'images/event-hackathon.png',
    gallery: ['images/event-hackathon.png', 'images/gallery-it-innovation-hub.png', 'images/gallery-computing-lab.png']
  },
  {
    id: 'evt_7',
    title: 'Inter-Collegiate TNEA Engineering Athletic & Sports Championship',
    date: 'March 22, 2027',
    time: '08:00 AM – 06:00 PM',
    venue: 'University Sports Arena & Grounds',
    category: 'Sports Meet',
    description: 'State-level track & field tournaments, basketball, cricket championship cup, volleyball, and badminton trophies with university awards.',
    featured: false,
    published: true,
    coverImage: 'images/gallery-campus-landscape.png',
    gallery: ['images/gallery-campus-landscape.png', 'images/hero-student-life.png', 'images/about-aerial-campus.png']
  },
  {
    id: 'evt_8',
    title: 'International Conference on Sustainable Energy & Smart EV Systems',
    date: 'April 10, 2027',
    time: '09:30 AM – 05:00 PM',
    venue: 'APJ Abdul Kalam Conference Hall',
    category: 'Conference',
    description: 'Global researchers and Anna University professors delivering keynote addresses on smart power grids, EV battery tech, and green renewables.',
    featured: false,
    published: true,
    coverImage: 'images/dept-eee.png',
    gallery: ['images/dept-eee.png', 'images/gallery-ai-research-lab.png', 'images/dept-ece.png']
  }
];

async function seedDefaultEvents() {
  try {
    const count = await Event.countDocuments();
    if (count === 0) {
      console.log('🌱  Seeding default flagship college events...');
      await Event.insertMany(DEFAULT_FLAGSHIP_EVENTS);
      console.log('✅  Default events seeded into MongoDB.');
    }
  } catch (err) {
    console.error('Event seeding notice:', err.message);
  }
}

// ── Campus Gallery Photo Schema & Model ───────────────────────
const galleryPhotoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  caption: { type: String, trim: true, maxlength: 500, default: '' },
  imageUrl: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true, maxlength: 100, default: 'campus' },
  size: { type: String, trim: true, default: 'normal' }, // 'normal' | 'large'
  order: { type: Number, default: 0 }
}, { timestamps: true });

const GalleryPhoto = mongoose.model('GalleryPhoto', galleryPhotoSchema);

// ── Default Flagship Campus Photos ───────────────────────────
const DEFAULT_GALLERY_PHOTOS = [
  {
    id: 'photo_1',
    title: 'Main Academic Complex',
    caption: 'Smart Lecture Halls & Central Quadrangle',
    category: 'campus',
    imageUrl: 'images/gallery-academic-complex.png',
    size: 'large',
    order: 1
  },
  {
    id: 'photo_2',
    title: 'Computing Center',
    caption: 'High-Speed AI & Software Workstations',
    category: 'labs',
    imageUrl: 'images/gallery-computing-lab.png',
    size: 'normal',
    order: 2
  },
  {
    id: 'photo_3',
    title: 'AI Research Lab',
    caption: 'GPU Accelerated Deep Learning Cluster',
    category: 'labs',
    imageUrl: 'images/gallery-ai-research-lab.png',
    size: 'normal',
    order: 3
  },
  {
    id: 'photo_4',
    title: 'Campus Aerial View',
    caption: 'Scenic Landscape along Salem Main Road',
    category: 'campus',
    imageUrl: 'images/gallery-campus-landscape.png',
    size: 'normal',
    order: 4
  },
  {
    id: 'photo_5',
    title: 'IT Innovation Hub',
    caption: 'Cloud Computing & Hackathon Workspace',
    category: 'life',
    imageUrl: 'images/gallery-it-innovation-hub.png',
    size: 'normal',
    order: 5
  },
  {
    id: 'photo_6',
    title: 'Mechanical Workshops',
    caption: 'CNC Machines, CAD/CAM & Robotics Arenas',
    category: 'labs',
    imageUrl: 'images/gallery-mech-workshop.png',
    size: 'normal',
    order: 6
  },
  {
    id: 'photo_7',
    title: 'TechNova National Symposium',
    caption: 'Inter-Collegiate Technical Convergence & Paper Presentations',
    category: 'events',
    imageUrl: 'images/event-technova-symposium.png',
    size: 'large',
    order: 7
  },
  {
    id: 'photo_8',
    title: 'Podhigai Sangamam Cultural Fest',
    caption: 'Annual Cultural Celebration of Fine Arts, Music & Dance',
    category: 'life',
    imageUrl: 'images/event-cultural-fest.png',
    size: 'normal',
    order: 8
  },
  {
    id: 'photo_9',
    title: '24-Hour Code Marathon Arena',
    caption: 'Students Competing in High-Intensity Hackathon Sprints',
    category: 'events',
    imageUrl: 'images/event-hackathon.png',
    size: 'normal',
    order: 9
  },
  {
    id: 'photo_10',
    title: 'RoboQuest Drone & Robotics Expo',
    caption: 'Autonomous Mobile Robotics Obstacle Arena',
    category: 'events',
    imageUrl: 'images/event-robowar-mech-expo.png',
    size: 'normal',
    order: 10
  },
  {
    id: 'photo_11',
    title: 'B.Tech IT Engineering Suite',
    caption: 'Modern Full-Stack Development & Enterprise Cloud Lab',
    category: 'programs',
    imageUrl: 'images/dept-it.png',
    size: 'normal',
    order: 11
  },
  {
    id: 'photo_12',
    title: 'AI & Data Science Labs',
    caption: 'Python Data Analytics & Neural Network Modeling Workstations',
    category: 'programs',
    imageUrl: 'images/dept-aids.png',
    size: 'normal',
    order: 12
  },
  {
    id: 'photo_13',
    title: 'Electronics & Communication VLSI Lab',
    caption: 'Embedded Microcontroller & Circuit Fabrication Benches',
    category: 'programs',
    imageUrl: 'images/dept-ece.png',
    size: 'normal',
    order: 13
  },
  {
    id: 'photo_14',
    title: 'Electrical & EV Systems Lab',
    caption: 'Power Grid Simulators & Electric Vehicle Research Testbeds',
    category: 'programs',
    imageUrl: 'images/dept-eee.png',
    size: 'normal',
    order: 14
  },
  {
    id: 'photo_15',
    title: 'Mechanical Automation & Robotics',
    caption: 'Thermal Engineering & Advanced CAD/CAM SolidWorks Suite',
    category: 'programs',
    imageUrl: 'images/dept-mech.png',
    size: 'normal',
    order: 15
  },
  {
    id: 'photo_16',
    title: 'Annual Placement & Corporate Convocation',
    caption: 'Honoring Graduates Receiving Top Corporate Appointment Orders',
    category: 'graduation',
    imageUrl: 'images/event-placement-drive.png',
    size: 'large',
    order: 16
  },
  {
    id: 'photo_17',
    title: 'Graduation Day Roll of Honor',
    caption: 'Celebrating Academic Achievers and University Rank Holders',
    category: 'graduation',
    imageUrl: 'images/hero-student-life.png',
    size: 'normal',
    order: 17
  }
];

async function seedDefaultGallery() {
  try {
    const count = await GalleryPhoto.countDocuments();
    if (count === 0) {
      console.log('🌱  Seeding default campus life gallery photos...');
      await GalleryPhoto.insertMany(DEFAULT_GALLERY_PHOTOS);
      console.log('✅  Default gallery photos seeded into MongoDB.');
    }
  } catch (err) {
    console.error('Gallery seeding notice:', err.message);
  }
}

// ── Helper: Secure Token Auth ─────────────────────────────────
function generateToken(username, password) {
  const secret = process.env.JWT_SECRET || 'podhigai_secure_auth_token_key_2026';
  const payload = `${username}:${password}:${secret}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifyToken(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return false;
  const expected = generateToken(
    process.env.ADMIN_USERNAME || 'Admin123',
    process.env.ADMIN_PASSWORD || 'Admin@2719'
  );
  return token === expected;
}

// ════════════════════════════════════════════════════════════════
//  ROUTES
// ════════════════════════════════════════════════════════════════

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Podhigai Contact API is running',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ── POST /api/contact — Submit contact form ───────────────────
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Basic validation
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required.' });
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'Email is required.' });
    if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'Message is required.' });

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });

    // Duplicate submission prevention: check within last 60s
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const existing = await Contact.findOne({
      email: email.trim().toLowerCase(),
      message: message.trim(),
      createdAt: { $gte: oneMinuteAgo }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Thank you! Your enquiry has been received. Our admissions team will reach out soon.'
      });
    }

    // Save to MongoDB
    const contact = new Contact({
      name: name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      subject: (subject || '').trim(),
      message: message.trim(),
      ip: req.ip || req.connection?.remoteAddress || ''
    });

    await contact.save();

    console.log(`📩  New contact from: ${name} <${email}>`);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received. We will get back to you soon.'
    });

  } catch (err) {
    console.error('Contact save error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// ── POST /api/admin/login — Admin authentication ──────────────
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !username.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  const expectedUsername = (process.env.ADMIN_USERNAME || 'Admin123').trim();
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'Admin@2719').trim();

  const userMatch = username.trim().toLowerCase() === expectedUsername.toLowerCase();
  const passMatch = password === expectedPassword;

  if (!userMatch || !passMatch) {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }

  const token = generateToken(expectedUsername, expectedPassword);
  res.json({ success: true, token, username: expectedUsername });
});

// ── GET /api/admin/messages — Get messages with filtering ─────
app.get('/api/admin/messages', async (req, res) => {
  if (!verifyToken(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }

  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    const filter = {};

    if (status === 'unread') filter.isRead = false;
    if (status === 'read') filter.isRead = true;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    const [messages, total, unread] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(filter),
      Contact.countDocuments({ isRead: false })
    ]);

    res.json({ success: true, messages, total, unread, page, limit });

  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── PATCH /api/admin/messages/:id/read — Mark as read ────────
app.patch('/api/admin/messages/:id/read', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  try {
    await Contact.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── DELETE /api/admin/messages/:id — Delete a message ─────────
app.delete('/api/admin/messages/:id', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Message not found.' });
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════
//  REVIEWS — Schema & Model (defined here so it is available to
//  all routes below, including /api/admin/stats)
// ════════════════════════════════════════════════════════════════

// ── Review Schema ─────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, maxlength: 80 },
  role:    { type: String, trim: true, maxlength: 100, default: '' },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  title:   { type: String, required: true, trim: true, maxlength: 100 },
  comment: { type: String, required: true, trim: true, maxlength: 700 },
  category:{ type: String, trim: true, maxlength: 50, default: 'academic' },
  approved:{ type: Boolean, default: true },
  ip:      { type: String, default: '' },
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

// Rate-limit: max 30 review submissions per 30 minutes per IP
const reviewLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many review submissions. Please try again later.' }
});

// ── GET /api/admin/stats — Dashboard statistics ───────────────
app.get('/api/admin/stats', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, unread, todayCount, reviewCount, eventCount] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ isRead: false }),
      Contact.countDocuments({ createdAt: { $gte: today } }),
      Review.countDocuments(),
      Event.countDocuments()
    ]);

    res.json({ success: true, stats: { total, unread, today: todayCount, reviews: reviewCount, events: eventCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════
//  EVENTS — Public & Admin Endpoints (MongoDB backed)
// ════════════════════════════════════════════════════════════════

// ── GET /api/events — Public: fetch published events ──────────
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({ published: true }).sort({ featured: -1, createdAt: -1 }).lean();
    res.json({ success: true, events, total: events.length });
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching events.' });
  }
});

// ── GET /api/admin/events — Admin: fetch all events ───────────
app.get('/api/admin/events', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const search = req.query.search || '';
    const filter = search
      ? {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { venue: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
      : {};

    const events = await Event.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, events, total: events.length });
  } catch (err) {
    console.error('Fetch admin events error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── POST /api/admin/events — Admin: create new event ──────────
app.post('/api/admin/events', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const { title, date, time, venue, category, description, featured, published, coverImage, gallery } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Event title is required.' });
    if (!date || !date.trim()) return res.status(400).json({ success: false, message: 'Event date is required.' });

    const existing = await Event.findOne({ title: { $regex: `^${title.trim()}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An event with this title already exists.' });
    }

    if (featured) {
      await Event.updateMany({}, { featured: false });
    }

    const eventId = 'evt_' + Date.now();
    const event = new Event({
      id: eventId,
      title: title.trim(),
      date: date.trim(),
      time: (time || '').trim(),
      venue: (venue || '').trim(),
      category: (category || 'General').trim(),
      description: (description || '').trim(),
      featured: Boolean(featured),
      published: published !== false,
      coverImage: (coverImage || 'images/event-technova-symposium.png').trim(),
      gallery: Array.isArray(gallery) && gallery.length ? gallery : [(coverImage || 'images/event-technova-symposium.png').trim()]
    });

    await event.save();
    console.log(`🎉 New event created: "${title}" [${eventId}]`);
    res.status(201).json({ success: true, message: 'Event created successfully.', event });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ success: false, message: 'Server error creating event.' });
  }
});

// ── PUT /api/admin/events/:id — Admin: update event ───────────
app.put('/api/admin/events/:id', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const eventId = req.params.id;
    const { title, date, time, venue, category, description, featured, published, coverImage, gallery } = req.body;

    if (featured) {
      await Event.updateMany({ id: { $ne: eventId } }, { featured: false });
    }

    const updated = await Event.findOneAndUpdate(
      { $or: [{ id: eventId }, { _id: mongoose.isValidObjectId(eventId) ? eventId : null }] },
      {
        ...(title ? { title: title.trim() } : {}),
        ...(date ? { date: date.trim() } : {}),
        time: time !== undefined ? time.trim() : '',
        venue: venue !== undefined ? venue.trim() : '',
        category: category !== undefined ? category.trim() : 'General',
        description: description !== undefined ? description.trim() : '',
        ...(featured !== undefined ? { featured: Boolean(featured) } : {}),
        ...(published !== undefined ? { published: Boolean(published) } : {}),
        ...(coverImage ? { coverImage: coverImage.trim() } : {}),
        ...(gallery ? { gallery } : {})
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, message: 'Event updated successfully.', event: updated });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ success: false, message: 'Server error updating event.' });
  }
});

// ── DELETE /api/admin/events/:id — Admin: delete event ────────
app.delete('/api/admin/events/:id', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const eventId = req.params.id;
    const deleted = await Event.findOneAndDelete({
      $or: [{ id: eventId }, { _id: mongoose.isValidObjectId(eventId) ? eventId : null }]
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting event.' });
  }
});

// ── PATCH /api/admin/events/:id/toggle — Admin: toggle status ──
app.patch('/api/admin/events/:id/toggle', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const eventId = req.params.id;
    const { field } = req.body;
    const event = await Event.findOne({
      $or: [{ id: eventId }, { _id: mongoose.isValidObjectId(eventId) ? eventId : null }]
    });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (field === 'featured') {
      const willBeFeatured = !event.featured;
      if (willBeFeatured) {
        await Event.updateMany({}, { featured: false });
      }
      event.featured = willBeFeatured;
    } else {
      event.published = !event.published;
    }

    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    console.error('Toggle event error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════════════════════════════════════════════════════════════
//  CAMPUS LIFE GALLERY — Public & Admin Routes
// ════════════════════════════════════════════════════════════════

// ── GET /api/gallery — Public: fetch campus photos ─────────────
app.get('/api/gallery', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category.trim().toLowerCase();
    }
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { caption: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    const photos = await GalleryPhoto.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    res.json({ success: true, photos, totalCount: photos.length });
  } catch (err) {
    console.error('Public gallery fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching gallery.' });
  }
});

// ── GET /api/admin/gallery — Admin: fetch all campus photos ───
app.get('/api/admin/gallery', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category.trim().toLowerCase();
    }
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { caption: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    const photos = await GalleryPhoto.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    const total = await GalleryPhoto.countDocuments();
    res.json({ success: true, photos, totalCount: total });
  } catch (err) {
    console.error('Admin gallery fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching gallery.' });
  }
});

// ── POST /api/admin/gallery — Admin: create campus photo ──────
app.post('/api/admin/gallery', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const { title, caption, imageUrl, category, size, order } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Photo title is required.' });
    }
    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Photo image URL or upload is required.' });
    }

    const photoId = 'photo_' + Date.now();
    const photo = new GalleryPhoto({
      id: photoId,
      title: title.trim(),
      caption: (caption || '').trim(),
      imageUrl: imageUrl.trim(),
      category: (category || 'campus').trim().toLowerCase(),
      size: (size === 'large') ? 'large' : 'normal',
      order: Number(order) || 0
    });

    await photo.save();
    console.log(`📸 New campus photo added: "${title}" [${photoId}] in category [${category}]`);
    res.status(201).json({ success: true, message: 'Photo added successfully.', photo });
  } catch (err) {
    console.error('Create gallery photo error:', err);
    res.status(500).json({ success: false, message: 'Server error adding photo.' });
  }
});

// ── PUT /api/admin/gallery/reorder — Admin: update photo display orders ────
app.put('/api/admin/gallery/reorder', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: 'Orders array is required.' });
    }
    const bulkOps = orders.map(item => ({
      updateOne: {
        filter: { $or: [{ id: item.id }, { _id: mongoose.isValidObjectId(item.id) ? item.id : null }] },
        update: { $set: { order: Number(item.order) || 0 } }
      }
    }));
    if (bulkOps.length) {
      await GalleryPhoto.bulkWrite(bulkOps);
    }
    console.log(`📸 Bulk reordered ${orders.length} campus photos`);
    res.json({ success: true, message: 'Photo display orders updated successfully.' });
  } catch (err) {
    console.error('Reorder gallery photos error:', err);
    res.status(500).json({ success: false, message: 'Server error updating photo orders.' });
  }
});

// ── PUT /api/admin/gallery/:id — Admin: update photo ──────────
app.put('/api/admin/gallery/:id', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const photoId = req.params.id;
    const { title, caption, imageUrl, category, size, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Photo title is required.' });
    }

    const updated = await GalleryPhoto.findOneAndUpdate(
      { $or: [{ id: photoId }, { _id: mongoose.isValidObjectId(photoId) ? photoId : null }] },
      {
        title: title.trim(),
        ...(caption !== undefined ? { caption: caption.trim() } : {}),
        ...(imageUrl ? { imageUrl: imageUrl.trim() } : {}),
        ...(category ? { category: category.trim().toLowerCase() } : {}),
        ...(size !== undefined ? { size: size === 'large' ? 'large' : 'normal' } : {}),
        ...(order !== undefined ? { order: Number(order) } : {})
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Photo not found.' });
    console.log(`📸 Campus photo updated: "${title}" [${photoId}]`);
    res.json({ success: true, message: 'Photo updated successfully.', photo: updated });
  } catch (err) {
    console.error('Update gallery photo error:', err);
    res.status(500).json({ success: false, message: 'Server error updating photo.' });
  }
});

// ── DELETE /api/admin/gallery/:id — Admin: delete photo ───────
app.delete('/api/admin/gallery/:id', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const photoId = req.params.id;
    const deleted = await GalleryPhoto.findOneAndDelete({
      $or: [{ id: photoId }, { _id: mongoose.isValidObjectId(photoId) ? photoId : null }]
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Photo not found.' });
    console.log(`🗑️ Campus photo deleted: [${photoId}]`);
    res.json({ success: true, message: 'Photo deleted successfully.' });
  } catch (err) {
    console.error('Delete gallery photo error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting photo.' });
  }
});

// ════════════════════════════════════════════════════════════════
//  REVIEWS — Public & Admin Routes
// ════════════════════════════════════════════════════════════════

// ── GET /api/reviews — Public: fetch approved reviews ─────────
app.get('/api/reviews', async (req, res) => {
  try {
    const rating = parseInt(req.query.rating);
    const filter = { approved: true };
    if (rating >= 1 && rating <= 5) filter.rating = rating;

    const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();

    // Build breakdown & average
    const allForStats = await Review.find({ approved: true }).lean();
    const total = allForStats.length;
    const avg = total > 0
      ? (allForStats.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
      : '0.0';
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allForStats.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

    res.json({ success: true, reviews, totalCount: total, averageRating: avg, breakdown });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── POST /api/reviews — Public: submit a review ───────────────
app.post('/api/reviews', reviewLimiter, async (req, res) => {
  try {
    const { name, role, rating, title, comment, category } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required.' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be 1–5.' });
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Title is required.' });
    if (!comment || !comment.trim()) return res.status(400).json({ success: false, message: 'Comment is required.' });

    const review = new Review({
      name: name.trim(),
      role: (role || '').trim(),
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
      category: (category || 'academic').trim(),
      approved: true,
      ip: req.ip || req.connection?.remoteAddress || ''
    });
    await review.save();
    console.log(`⭐ New review from: ${name} (${rating} stars - ${title})`);
    res.status(201).json({ success: true, message: 'Review submitted successfully.', review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/admin/reviews — Admin: get all reviews ───────────
app.get('/api/admin/reviews', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const rating = parseInt(req.query.rating);
    const search = req.query.search || '';
    const filter = {};
    if (rating >= 1 && rating <= 5) filter.rating = rating;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
      ];
    }
    const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();
    const total = await Review.countDocuments();
    res.json({ success: true, reviews, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── DELETE /api/admin/reviews/:id — Admin: delete a review ────
app.delete('/api/admin/reviews/:id', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── PATCH /api/admin/reviews/:id/approve — Toggle approval ────
app.patch('/api/admin/reviews/:id/approve', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    review.approved = !review.approved;
    await review.save();
    res.json({ success: true, approved: review.approved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── Chairman Schema & Model ───────────────────────────────────
const chairmanSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'main_chairman' },
  name: { type: String, default: 'KC Ezhilarasan' },
  role: { type: String, default: 'College Chairman' },
  image: { type: String, default: 'images/chairman.png' }
}, { timestamps: true });

const Chairman = mongoose.models.Chairman || mongoose.model('Chairman', chairmanSchema);

let memChairman = {
  name: 'KC Ezhilarasan',
  role: 'College Chairman',
  image: 'images/chairman.png'
};

// ── GET /api/chairman — Public: get Chairman settings ─────────
app.get('/api/chairman', async (req, res) => {
  try {
    let chairman = await Chairman.findOne({ key: 'main_chairman' }).lean();
    if (!chairman) {
      chairman = memChairman;
    }
    res.json({ success: true, chairman });
  } catch (err) {
    res.json({ success: true, chairman: memChairman });
  }
});

// ── POST /api/admin/chairman — Admin: update Chairman settings ─
app.post('/api/admin/chairman', async (req, res) => {
  if (!verifyToken(req)) return res.status(401).json({ success: false, message: 'Unauthorized.' });
  try {
    const { name, role, image } = req.body;
    memChairman = {
      name: name || 'KC Ezhilarasan',
      role: role || 'College Chairman',
      image: image || 'images/chairman.png'
    };
    try {
      const updated = await Chairman.findOneAndUpdate(
        { key: 'main_chairman' },
        { name: memChairman.name, role: memChairman.role, image: memChairman.image },
        { upsert: true, new: true }
      ).lean();
      return res.json({ success: true, chairman: updated });
    } catch (dbErr) {
      return res.json({ success: true, chairman: memChairman });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saving chairman settings.' });
  }
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀  Podhigai Contact API`);
  console.log(`    → Port     : ${PORT}`);
  console.log(`    → Health   : http://0.0.0.0:${PORT}/api/health`);
  console.log(`    → Admin    : open admin.html in browser\n`);
});

