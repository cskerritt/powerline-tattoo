require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Where tattoo request + booking submissions are emailed.
const MAIL_TO = process.env.MAIL_TO || 'info@powerlinetattoo.com';
const PHONE = '401-369-7771';

// Behind Railway's proxy, trust one hop so rate-limiting sees the real client IP.
app.set('trust proxy', 1);

// Security headers. CSP / COEP are left off on purpose: the site uses inline
// scripts and styles, Google Fonts, an embedded Google Map, and Google-hosted
// review avatars, and a strict policy would block them. The other helmet
// defaults (nosniff, frameguard, referrer-policy, HSTS) are safe and useful.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Middleware (bounded so oversized JSON/urlencoded bodies are rejected).
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    // Short cache for images so updates are picked up quickly
    if (filePath.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// --- Spam / abuse protection: limit how often a single IP can email us. ---
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: `Too many requests from this device. Please try again in a little while, or call us at ${PHONE}.` }
});

// --- File upload config for reference images (memory -> email attachment). ---
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
function badRequest(message) {
  return Object.assign(new Error(message), { status: 400, userMessage: message });
}
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 8,                   // hard cap on attachments per request
    fields: 40,                 // bound the number of text fields
    fieldSize: 100 * 1024,      // 100KB per text field
    fieldNameSize: 200,
    parts: 60
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(badRequest('Unsupported image type. Please upload a JPG, PNG, WEBP, HEIC, or GIF.'));
  }
});

// --- Email transporter: built once, reused, and verified at boot. ---
let transporter = null;
const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  transporter.verify()
    .then(() => console.log(`SMTP ready — form submissions will be sent to ${MAIL_TO}`))
    .catch(err => console.error('SMTP verification FAILED — check SMTP_* env vars:', err.message));
} else {
  console.warn('WARNING: SMTP_HOST/SMTP_USER/SMTP_PASS are not set. Contact and booking forms will return a 503 until they are configured.');
}

// --- Input validation helpers. ---
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_MAX = {
  name: 120, email: 254, phone: 40, subject: 200, description: 5000,
  artist: 160, colorOrBw: 40, skinTone: 40, bodyArea: 200,
  areaConflicts: 2000, designSpecifics: 2000, processSpecifics: 2000,
  scheduleFlexibility: 2000, hearAboutOther: 200, spamAck: 120,
  idea: 5000, size: 120, placement: 200
};
function overLongField(b) {
  for (const k of Object.keys(FIELD_MAX)) {
    if (b[k] != null && String(b[k]).length > FIELD_MAX[k]) return k;
  }
  return null;
}

// POST /api/contact — Tattoo request form (multipart: up to 3 placement + 5 reference photos)
const contactUpload = upload.fields([
  { name: 'placementPhotos', maxCount: 3 },
  { name: 'referenceImages', maxCount: 5 }
]);

app.post('/api/contact', formLimiter, contactUpload, async (req, res) => {
  const b = req.body;

  // Honeypot: real users never fill this hidden field. Pretend success and drop.
  if (b.website && String(b.website).trim()) return res.json({ success: true });

  // Normalize the "How did you hear about us?" checkbox group to an array
  let hearAbout = b.hearAbout || [];
  if (!Array.isArray(hearAbout)) hearAbout = [hearAbout];

  const required = ['name', 'email', 'phone', 'subject', 'description', 'artist', 'colorOrBw', 'spamAck'];
  const missing = required.filter(k => !b[k] || !String(b[k]).trim());
  if (hearAbout.length === 0) missing.push('hearAbout');
  if (missing.length) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }
  if (!EMAIL_RE.test(String(b.email).trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  const longField = overLongField(b);
  if (longField) {
    return res.status(400).json({ error: 'One of your answers is too long. Please shorten it and try again.' });
  }

  if (!transporter) {
    return res.status(503).json({ error: `Our form is temporarily unavailable. Please call us at ${PHONE}.` });
  }

  try {
    const files = req.files || {};
    const attachments = [...(files.placementPhotos || []), ...(files.referenceImages || [])]
      .map(f => ({ filename: f.originalname, content: f.buffer }));

    let heardLine = hearAbout.join(', ');
    if (b.hearAboutOther && b.hearAboutOther.trim()) heardLine += ` — ${b.hearAboutOther.trim()}`;

    const text = [
      `Name: ${b.name}`,
      `Email: ${b.email}`,
      `Phone: ${b.phone}`,
      `Subject: ${b.subject}`,
      `Preferred Artist: ${b.artist}`,
      `Color or Black & Grey: ${b.colorOrBw}`,
      `Skin Tone: ${b.skinTone || 'Not provided'}`,
      `Body Area: ${b.bodyArea || 'Not provided'}`,
      '',
      'Tattoo Description:',
      b.description,
      '',
      `Conflicts in area: ${b.areaConflicts || 'None provided'}`,
      `Other design specifics: ${b.designSpecifics || 'None provided'}`,
      `Process / health specifics: ${b.processSpecifics || 'None provided'}`,
      `Schedule flexibility: ${b.scheduleFlexibility || 'None provided'}`,
      `How did you hear about us: ${heardLine}`,
      `Spam-folder acknowledgment: ${b.spamAck}`,
      `Attachments: ${attachments.length}`
    ].join('\n');

    await transporter.sendMail({
      from: `"Powerline Tattoo Website" <${process.env.SMTP_USER}>`,
      to: MAIL_TO,
      replyTo: b.email,
      subject: `Tattoo Request: ${b.name} — ${b.subject}`,
      text,
      attachments
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// POST /api/book — Booking fallback form
app.post('/api/book', formLimiter, upload.single('reference'), async (req, res) => {
  const { name, email, phone, artist, idea, size, placement, website } = req.body;

  // Honeypot
  if (website && String(website).trim()) return res.json({ success: true });

  if (!name || !email || !idea) {
    return res.status(400).json({ error: 'Name, email, and tattoo idea are required.' });
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  const longField = overLongField(req.body);
  if (longField) {
    return res.status(400).json({ error: 'One of your answers is too long. Please shorten it and try again.' });
  }

  if (!transporter) {
    return res.status(503).json({ error: `Our form is temporarily unavailable. Please call us at ${PHONE}.` });
  }

  try {
    const mailOptions = {
      from: `"Powerline Tattoo Website" <${process.env.SMTP_USER}>`,
      to: MAIL_TO,
      replyTo: email,
      subject: `Booking Request: ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || 'Not provided'}`,
        `Preferred Artist: ${artist || 'No preference'}`,
        `Size: ${size || 'Not specified'}`,
        `Placement: ${placement || 'Not specified'}`,
        `\nTattoo Idea:\n${idea}`
      ].join('\n'),
      attachments: req.file ? [{
        filename: req.file.originalname,
        content: req.file.buffer
      }] : []
    };
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error('Booking form error:', err);
    res.status(500).json({ error: 'Failed to send booking request. Please try again.' });
  }
});

// GET /api/reviews — real Google reviews (5-star only), cached in memory
let reviewsCache = { data: null, ts: 0 };
const REVIEWS_TTL = 6 * 60 * 60 * 1000; // 6 hours

app.get('/api/reviews', async (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) {
    return res.status(503).json({ error: 'Reviews not configured', reviews: [] });
  }

  // Serve from cache when fresh
  if (reviewsCache.data && (Date.now() - reviewsCache.ts) < REVIEWS_TTL) {
    return res.json(reviewsCache.data);
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const resp = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,googleMapsUri,reviews'
      }
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error('Places API error:', resp.status, body);
      // Serve stale cache if we have it, else error
      if (reviewsCache.data) return res.json(reviewsCache.data);
      return res.status(502).json({ error: 'Failed to fetch reviews', reviews: [] });
    }

    const data = await resp.json();
    const fiveStar = (data.reviews || [])
      .filter(r => r.rating === 5)
      .map(r => ({
        author: (r.authorAttribution && r.authorAttribution.displayName) || 'Google user',
        photo: (r.authorAttribution && r.authorAttribution.photoUri) || '',
        profileUrl: (r.authorAttribution && r.authorAttribution.uri) || '',
        text: ((r.originalText && r.originalText.text) || (r.text && r.text.text) || '').trim(),
        time: r.relativePublishTimeDescription || ''
      }))
      .filter(r => r.text);

    const payload = {
      rating: data.rating || null,
      total: data.userRatingCount || null,
      mapsUri: data.googleMapsUri || '',
      reviews: fiveStar
    };
    reviewsCache = { data: payload, ts: Date.now() };
    res.json(payload);
  } catch (err) {
    console.error('Reviews fetch error:', err);
    if (reviewsCache.data) return res.json(reviewsCache.data);
    res.status(500).json({ error: 'Failed to fetch reviews', reviews: [] });
  }
});

// SPA-style routing: serve HTML pages without .html extension
const pages = ['artists', 'gallery', 'book', 'info', 'about', 'contact'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', `${page}.html`));
  });
});

// Individual artist gallery pages
const artists = ['evan-olin', 'mikey-romasco', 'andy-large', 'andrey-vasilyev', 'dj-lebeau', 'dana-morse', 'jake-meo', 'chris-valencia'];
artists.forEach(artist => {
  app.get(`/artists/${artist}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'artists', `${artist}.html`));
  });
});

// --- Error handler: always return JSON for upload/validation failures so the
//     client never falls into its generic "Failed to send" catch. ---
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let msg = 'There was a problem with your upload. Please try again.';
    if (err.code === 'LIMIT_FILE_SIZE') msg = 'One of your images is over 10MB. Please upload a smaller photo.';
    else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_PART_COUNT') msg = 'Too many files attached. Please reduce the number of photos and try again.';
    else if (err.code === 'LIMIT_FIELD_VALUE') msg = 'One of your answers is too long. Please shorten it and try again.';
    return res.status(400).json({ error: msg });
  }
  if (err && err.status === 400) {
    return res.status(400).json({ error: err.userMessage || 'Invalid submission.' });
  }
  if (err) {
    console.error('Unhandled error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Powerline Tattoo running on port ${PORT}`);
});
