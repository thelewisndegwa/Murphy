const express = require('express');
const { db, mapAuction } = require('../db');

const router = express.Router();

const STATUSES = new Set(['open', 'reserved', 'sold']);

router.get('/', (req, res) => {
  const { status } = req.query;
  let rows;
  if (status === 'sold') {
    return res.json([]);
  }
  if (status && STATUSES.has(String(status)) && status !== 'sold') {
    rows = db
      .prepare('SELECT * FROM auctions WHERE status = ? ORDER BY datetime(created_at) DESC, id DESC')
      .all(status);
  } else {
    rows = db
      .prepare(
        `SELECT * FROM auctions
         WHERE status != 'sold'
         ORDER BY datetime(created_at) DESC, id DESC`
      )
      .all();
  }
  res.json(rows.map(mapAuction));
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const row = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ error: 'Auction not found' });
  }
  res.json(mapAuction(row));
});

router.post('/:id/bids', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
  if (!auction) {
    return res.status(404).json({ error: 'Auction not found' });
  }
  if (auction.status !== 'open') {
    return res.status(400).json({ error: 'This auction is not open for bidding' });
  }

  const bidderName = String(req.body.name || req.body.bidderName || '').trim();
  const bidderPhone = String(req.body.phone || req.body.bidderPhone || '').trim();
  const amount = Math.round(Number(String(req.body.amount || '').replace(/,/g, '')));

  if (!bidderName || !bidderPhone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }
  if (!Number.isFinite(amount) || amount < 1) {
    return res.status(400).json({ error: 'Invalid bid amount' });
  }
  if (amount <= auction.current_bid) {
    return res.status(400).json({
      error: 'Bid must be higher than the current bid of KES ' + auction.current_bid.toLocaleString('en-KE')
    });
  }

  const placeBid = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO bids (auction_id, bidder_name, bidder_phone, amount)
         VALUES (?, ?, ?, ?)`
      )
      .run(id, bidderName, bidderPhone, amount);

    db.prepare(
      `UPDATE auctions
       SET current_bid = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(amount, id);

    return result.lastInsertRowid;
  });

  const bidId = placeBid();
  const bid = db.prepare('SELECT * FROM bids WHERE id = ?').get(bidId);
  const updated = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);

  res.status(201).json({
    ok: true,
    bid: {
      id: bid.id,
      auctionId: bid.auction_id,
      bidderName: bid.bidder_name,
      bidderPhone: bid.bidder_phone,
      amount: bid.amount,
      createdAt: bid.created_at
    },
    auction: mapAuction(updated)
  });
});

module.exports = router;
