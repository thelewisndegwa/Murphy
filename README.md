# Murphy Merchants Auctioneers

Website for Murphy Merchants Auctioneers — trusted auctioneering services in Mombasa since 2004.

## Quick start

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
npm run seed           # demo lots + creates admin from .env
npm start
```

Open [http://localhost:3000](http://localhost:3000). Admin: [http://localhost:3000/admin/login.html](http://localhost:3000/admin/login.html).

Default local credentials (change in `.env`):

- Username: `admin`
- Password: `changeme`

## Pages

| Path | Description |
|------|-------------|
| `/` (`index.html`) | Live auctions (site home) |
| `/about.html` | Company story, team, mission & values |
| `/company-profile.html` | Services, clients, and referees |
| `/contact.html` | Contact details, map, hours, form |
| `/auction-item.html?id=` | Single lot detail and bid form |
| `/admin/login.html` | Admin sign-in |
| `/admin/index.html` | Manage lots and statuses |
| `/admin/edit.html` | Create / edit a lot |

## Auction statuses

Each lot has one of: **open**, **reserved**, **sold**. Admins can change status anytime from the admin list (dropdown) or the edit form. Public bid form shows only when status is `open`.

Placed bids are stored and visible to admin under **Bids** (per lot or all bids). A new bid must exceed the current bid and updates the lot’s current bid.

## Structure

```text
murphy/
  index.html … contact.html, auction-item.html
  admin/                 # admin UI
  assets/css|js|images
  server/                # Express + SQLite API
  data/murphy.db         # created at runtime (gitignored)
  uploads/auctions/      # uploaded photos (gitignored)
  .env                   # secrets (gitignored)
```

## Environment

See `.env.example`:

- `PORT` — server port (default 3000)
- `SESSION_SECRET` — long random string for sessions
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — used to create the admin user on first boot if missing

## API (summary)

- `GET /api/auctions` — list lots (`?status=open` optional)
- `GET /api/auctions/:id` — one lot
- `POST /api/admin/login` | `logout` | `GET /me`
- Admin CRUD under `/api/admin/auctions` (session required)

This project uses **Node.js + SQLite**, not PHP.
