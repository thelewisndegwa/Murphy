const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
const uploadsDir = path.join(__dirname, '..', 'uploads', 'auctions');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, 'murphy.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    photo_path TEXT NOT NULL DEFAULT '',
    current_bid INTEGER NOT NULL DEFAULT 0,
    ends_at TEXT,
    status TEXT NOT NULL DEFAULT 'open'
      CHECK (status IN ('open', 'reserved', 'sold')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER NOT NULL,
    bidder_name TEXT NOT NULL,
    bidder_phone TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);

  CREATE TABLE IF NOT EXISTS sale_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER,
    auction_title TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('reserved', 'sold')),
    party_name TEXT NOT NULL,
    party_phone TEXT NOT NULL,
    price INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sale_records_created_at ON sale_records(created_at);
`);

function mapAuction(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    photoPath: row.photo_path,
    currentBid: row.current_bid,
    endsAt: row.ends_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    bidCount: row.bid_count != null ? row.bid_count : undefined
  };
}

function mapBid(row) {
  if (!row) return null;
  return {
    id: row.id,
    auctionId: row.auction_id,
    auctionTitle: row.auction_title,
    bidderName: row.bidder_name,
    bidderPhone: row.bidder_phone,
    amount: row.amount,
    createdAt: row.created_at
  };
}

function mapSaleRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    auctionId: row.auction_id,
    auctionTitle: row.auction_title,
    photoPath: row.photo_path || '',
    kind: row.kind,
    partyName: row.party_name,
    partyPhone: row.party_phone,
    price: row.price,
    createdAt: row.created_at
  };
}

module.exports = { db, mapAuction, mapBid, mapSaleRecord, uploadsDir };
