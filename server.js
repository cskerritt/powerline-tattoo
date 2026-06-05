require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    // Short cache for images so updates are picked up quickly
    if (filePath.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// File upload config for booking form reference images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Nodemailer transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// POST /api/contact — Tattoo request form (multipart: up to 3 placement + 5 reference photos)
const contactUpload = upload.fields([
  { name: 'placementPhotos', maxCount: 3 },
  { name: 'referenceImages', maxCount: 5 }
]);

app.post('/api/contact', contactUpload, async (req, res) => {
  const b = req.body;

  // Normalize the "How did you hear about us?" checkbox group to an array
  let hearAbout = b.hearAbout || [];
  if (!Array.isArray(hearAbout)) hearAbout = [hearAbout];

  const required = ['name', 'email', 'phone', 'subject', 'description', 'artist', 'colorOrBw', 'spamAck'];
  const missing = required.filter(k => !b[k] || !String(b[k]).trim());
  if (hearAbout.length === 0) missing.push('hearAbout');
  if (missing.length) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  try {
    const transporter = createTransporter();
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
      to: 'powerlinetattoo@gmail.com',
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
app.post('/api/book', upload.single('reference'), async (req, res) => {
  const { name, email, phone, artist, idea, size, placement } = req.body;
  if (!name || !email || !idea) {
    return res.status(400).json({ error: 'Name, email, and tattoo idea are required.' });
  }

  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Powerline Tattoo Website" <${process.env.SMTP_USER}>`,
      to: 'powerlinetattoo@gmail.com',
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

app.listen(PORT, () => {
  console.log(`Powerline Tattoo running on port ${PORT}`);
});
