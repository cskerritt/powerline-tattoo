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

// POST /api/contact — Contact form
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Powerline Tattoo Website" <${process.env.SMTP_USER}>`,
      to: 'powerlinetattoo@gmail.com',
      replyTo: email,
      subject: `Contact Form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`
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
const artists = ['evan-olin', 'mike-ledoux', 'mikey-romasco', 'andy-large', 'andrey-vasilyev', 'dj-lebeau', 'dana-morse', 'jake-meo', 'chris-valencia'];
artists.forEach(artist => {
  app.get(`/artists/${artist}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'artists', `${artist}.html`));
  });
});

app.listen(PORT, () => {
  console.log(`Powerline Tattoo running on port ${PORT}`);
});
