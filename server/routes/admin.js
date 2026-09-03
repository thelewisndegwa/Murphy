const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  requireAdmin,
  findAdminByUsername,
  verifyPassword
} = require('../auth');
const { db, mapAuction, mapBid, mapSaleRecord, uploadsDir } = require('../db');

const router = express.Router();

const STATUSES = new Set(['open', 'reserved', 'sold']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  }
});

function photoUrl(filename) {
  return `/uploads/auctions/${filename}`;
}

function deletePhotoFile(photoPath) {
  if (!photoPath || !photoPath.startsWith('/uploads/auctions/')) return;
  const full = path.join(__dirname, '..', '..', photoPath.replace(/^\//, ''));
  if (fs.existsSync(full)) {
    try {
      fs.unlinkSync(full);
    } catch (_) {
      /* ignore */
    }
  }
}

function parseBid(value) {
  const n = Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function normalizeStatus(value) {
  const s = String(value || 'open').toLowerCase();
  return STATUSES.has(s) ? s : null;
}

function parsePartyName(value) {
  return String(value || '').trim();
}

function parsePartyPhone(value) {
  return String(value || '').trim();
}

function parseClosureDetails(body) {
  const partyName = parsePartyName(body.partyName || body.party_name);
  const partyPhone = parsePartyPhone(body.partyPhone || body.party_phone);
  const price = parseBid(body.price ?? body.closedPrice ?? body.closed_price);
  if (!partyName || !partyPhone) {
    return { error: 'Name and phone number are required' };
  }
  if (price === null) {
    return { error: 'A valid price is required' };
  }
  return { partyName, partyPhone, price };
}

function insertSaleRecord(auction, kind, details) {
  db.prepare(
    `INSERT INTO sale_records (auction_id, auction_title, kind, party_name, party_phone, price)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(auction.id, auction.title, kind, details.partyName, details.partyPhone, details.price);
}

function uploadMiddleware(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    next();
  });
}

router.post('/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const admin = findAdminByUsername(username);
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.adminId = admin.id;
  req.session.adminUsername = admin.username;
  res.json({ ok: true, username: admin.username });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ id: req.session.adminId, username: req.session.adminUsername });
});

router.use(requireAdmin);

router.get('/auctions', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT a.*,
        (SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.id) AS bid_count
       FROM auctions a
       ORDER BY datetime(a.created_at) DESC, a.id DESC`
    )
    .all();
  res.json(rows.map(mapAuction));
});

router.get('/records', (req, res) => {
  const kind = String(req.query.kind || '').toLowerCase();
  let rows;
  if (kind === 'sold' || kind === 'reserved') {
    rows = db
      .prepare(
        `SELECT r.*, a.photo_path
         FROM sale_records r
         LEFT JOIN auctions a ON a.id = r.auction_id
         WHERE r.kind = ?
         ORDER BY datetime(r.created_at) DESC, r.id DESC`
      )
      .all(kind);
  } else {
    rows = db
      .prepare(
        `SELECT r.*, a.photo_path
         FROM sale_records r
         LEFT JOIN auctions a ON a.id = r.auction_id
         ORDER BY datetime(r.created_at) DESC, r.id DESC`
      )
      .all();
  }
  res.json(rows.map(mapSaleRecord));
});

router.get('/bids', (req, res) => {
  const auctionId = req.query.auctionId ? Number(req.query.auctionId) : null;
  let rows;
  if (auctionId && Number.isInteger(auctionId) && auctionId > 0) {
    rows = db
      .prepare(
        `SELECT b.*, a.title AS auction_title
         FROM bids b
         JOIN auctions a ON a.id = b.auction_id
         WHERE b.auction_id = ?
         ORDER BY b.amount DESC, datetime(b.created_at) DESC`
      )
      .all(auctionId);
  } else {
    rows = db
      .prepare(
        `SELECT b.*, a.title AS auction_title
         FROM bids b
         JOIN auctions a ON a.id = b.auction_id
         ORDER BY datetime(b.created_at) DESC, b.id DESC`
      )
      .all();
  }
  res.json(rows.map(mapBid));
});

router.get('/auctions/:id/bids', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const auction = db.prepare('SELECT id, title FROM auctions WHERE id = ?').get(id);
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }
  const rows = db
    .prepare(
      `SELECT b.*, a.title AS auction_title
       FROM bids b
       JOIN auctions a ON a.id = b.auction_id
       WHERE b.auction_id = ?
       ORDER BY b.amount DESC, datetime(b.created_at) DESC`
    )
    .all(id);
  res.json({
    auction: { id: auction.id, title: auction.title },
    bids: rows.map(mapBid)
  });
});

router.post('/auctions', uploadMiddleware, (req, res) => {
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const currentBid = parseBid(req.body.currentBid ?? req.body.current_bid ?? 0);
  const endsAt = req.body.endsAt || req.body.ends_at || null;
  const status = normalizeStatus(req.body.status);

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (currentBid === null) {
    return res.status(400).json({ error: 'Invalid current bid' });
  }
  if (!status) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Photo is required' });
  }

  let closure = null;
  if (status === 'reserved' || status === 'sold') {
    closure = parseClosureDetails(req.body);
    if (closure.error) {
      return res.status(400).json({ error: closure.error });
    }
  }

  const photoPath = photoUrl(req.file.filename);
  const result = db
    .prepare(
      `INSERT INTO auctions (title, description, photo_path, current_bid, ends_at, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(title, description, photoPath, currentBid, endsAt || null, status);

  const row = db.prepare('SELECT * FROM auctions WHERE id = ?').get(result.lastInsertRowid);
  if (closure) {
    insertSaleRecord(row, status, closure);
  }
  res.status(201).json(mapAuction(row));
});

router.put('/auctions/:id', uploadMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const existing = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Auction not found' });
  }

  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const currentBid = parseBid(req.body.currentBid ?? req.body.current_bid ?? existing.current_bid);
  const endsAt =
    req.body.endsAt !== undefined || req.body.ends_at !== undefined
      ? req.body.endsAt || req.body.ends_at || null
      : existing.ends_at;
  const status = normalizeStatus(req.body.status ?? existing.status);

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (currentBid === null) {
    return res.status(400).json({ error: 'Invalid current bid' });
  }
  if (!status) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const statusChanged = existing.status !== status;
  let closure = null;
  if (statusChanged && (status === 'reserved' || status === 'sold')) {
    closure = parseClosureDetails(req.body);
    if (closure.error) {
      return res.status(400).json({ error: closure.error });
    }
  }

  let photoPath = existing.photo_path;
  if (req.file) {
    photoPath = photoUrl(req.file.filename);
    deletePhotoFile(existing.photo_path);
  }

  db.prepare(
    `UPDATE auctions
     SET title = ?, description = ?, photo_path = ?, current_bid = ?, ends_at = ?, status = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, description, photoPath, currentBid, endsAt || null, status, id);

  const row = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
  if (closure) {
    insertSaleRecord(row, status, closure);
  }
  res.json(mapAuction(row));
});

router.patch('/auctions/:id/status', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const status = normalizeStatus(req.body.status);
  if (!status) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const existing = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Auction not found' });
  }

  let closure = null;
  if (status !== existing.status && (status === 'reserved' || status === 'sold')) {
    closure = parseClosureDetails(req.body);
    if (closure.error) {
      return res.status(400).json({ error: closure.error });
    }
  }

  db.prepare(
    `UPDATE auctions SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(status, id);

  const row = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
  if (closure) {
    insertSaleRecord(row, status, closure);
  }
  res.json(mapAuction(row));
});

router.delete('/auctions/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const existing = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Auction not found' });
  }

  db.prepare('DELETE FROM auctions WHERE id = ?').run(id);
  deletePhotoFile(existing.photo_path);
  res.json({ ok: true });
});

module.exports = router;
