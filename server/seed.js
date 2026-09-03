require('dotenv').config();

const { db } = require('./db');
const { ensureAdminFromEnv } = require('./auth');

ensureAdminFromEnv();

const demoLots = [
  {
    title: 'Office Furniture Lot',
    description:
      'Quality office desks, chairs, and filing cabinets from a closed business. All items in good condition. Viewing by appointment.',
    photo_path:
      'https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=800',
    current_bid: 45000,
    ends_at: '2026-02-25T17:00:00',
    status: 'open'
  },
  {
    title: 'Commercial Property – Mombasa',
    description:
      'Prime commercial space suitable for retail or office use. Located on Meru Road. Full details and viewing by arrangement.',
    photo_path:
      'https://images.pexels.com/photos/395537/pexels-photo-395537.jpeg?auto=compress&cs=tinysrgb&w=800',
    current_bid: 2500000,
    ends_at: '2026-02-28T17:00:00',
    status: 'open'
  },
  {
    title: 'Vehicle – Toyota Hilux',
    description:
      'Toyota Hilux double cab, well maintained. Full service history available. Inspection welcome.',
    photo_path:
      'https://images.pexels.com/photos/5661743/pexels-photo-5661743.jpeg?auto=compress&cs=tinysrgb&w=800',
    current_bid: 1200000,
    ends_at: '2026-02-20T17:00:00',
    status: 'reserved'
  },
  {
    title: 'Laptops & Electronics Lot',
    description:
      'Laptops, monitors, and office electronics from a business closure. Tested and in working order. Viewing by appointment.',
    photo_path:
      'https://images.pexels.com/photos/343239/pexels-photo-343239.jpeg?auto=compress&cs=tinysrgb&w=800',
    current_bid: 85000,
    ends_at: '2026-02-22T17:00:00',
    status: 'open'
  },
  {
    title: 'Land Plot – Nyali',
    description:
      'Residential plot in Nyali, clear title. Suitable for single or multi-unit development. Site visit by arrangement.',
    photo_path:
      'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=800',
    current_bid: 3800000,
    ends_at: '2026-03-01T17:00:00',
    status: 'open'
  },
  {
    title: 'Executive Office Desk Set',
    description:
      'Premium desk, ergonomic chair, and side cabinet. Ideal for home office or executive suite. Collection only.',
    photo_path:
      'https://images.pexels.com/photos/18495294/pexels-photo-18495294.jpeg?auto=compress&cs=tinysrgb&w=800',
    current_bid: 62000,
    ends_at: '2026-02-24T17:00:00',
    status: 'sold'
  }
];

const count = db.prepare('SELECT COUNT(*) AS c FROM auctions').get().c;
if (count > 0) {
  console.log(`Database already has ${count} auction(s). Skipping seed.`);
  process.exit(0);
}

const insert = db.prepare(`
  INSERT INTO auctions (title, description, photo_path, current_bid, ends_at, status)
  VALUES (@title, @description, @photo_path, @current_bid, @ends_at, @status)
`);

const insertMany = db.transaction((lots) => {
  for (const lot of lots) insert.run(lot);
});

insertMany(demoLots);
console.log(`Seeded ${demoLots.length} demo auctions.`);
