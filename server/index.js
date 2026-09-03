require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const { ensureAdminFromEnv } = require('./auth');
require('./db');

ensureAdminFromEnv();

const auctionsRouter = require('./routes/auctions');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const rootDir = path.join(__dirname, '..');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-insecure-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use('/uploads', express.static(path.join(rootDir, 'uploads')));
app.use('/assets', express.static(path.join(rootDir, 'assets')));
app.use('/admin', express.static(path.join(rootDir, 'admin')));

app.use('/api/auctions', auctionsRouter);
app.use('/api/admin', adminRouter);

app.get('/', (_req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.use(express.static(rootDir, { index: false, extensions: ['html'] }));

app.use((err, _req, res, _next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Murphy Merchants running at http://localhost:${PORT}`);
  console.log(`Admin login: http://localhost:${PORT}/admin/login.html`);
});
