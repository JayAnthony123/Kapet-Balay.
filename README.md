# Kape't Balay – Customer Ordering

Customers create an account, order from the menu (pick up or reservation) and track the order status.
Express + MySQL backend, plain HTML/CSS/JS frontend.

## Fastest way to try the page (no setup)

Open `frontend/customer/html/index.html`:

- double-click it, **or**
- in VS Code: right-click it → **Open with Live Server**.

With no server running, the page switches to **demo mode** (yellow note at the bottom-left).
Accounts and orders are saved in your browser only, and an order moves on by itself
(Pending → Preparing → Ready → Completed) so you can see the tracker work.

## Run the real thing (Express + MySQL)

1. Install **Node.js 18+** and start **MySQL** (XAMPP → MySQL → Start).
2. In phpMyAdmin → create a database named `kapet_balay_db`, then **Import**, in this order:
   1. `database/kapet_balay_db.sql`
   2. `database/002_customer_ordering.sql` (adds the `customers` table and extra order columns)
3. Check `.env` (defaults match XAMPP: user `root`, empty password). `.env.example` shows every setting.
4. In the VS Code terminal, inside this folder:
   ```
   npm install
   npm start
   ```
5. Open **http://localhost:3000**

If MySQL is not reachable, the server stops and tells you what to check.

## Order status

There is no admin screen in this version. To move an order along, change the `status` column of the
`orders` table in phpMyAdmin (`Pending`, `Preparing`, `Ready`, `Completed`) – the customer's
"My orders" page refreshes itself every few seconds.

## Folders

```
app.js                      starts the server (npm start)
backend/
  config/                   env.js (.env loader), db.js (MySQL connection)
  routes/                   URL -> controller   (/api/menu, /api/auth/..., /api/orders)
  controllers/              reads the request, sends the response
  services/                 the rules (validation, prices, sessions)
  models/                   SQL queries
  middleware/               login check, error handler, rate limit
database/                   SQL files for phpMyAdmin
frontend/
  customer/                 the ordering page (html, css, js, CustomerImages)
  admin/js/                 your kitchen script (not connected to anything yet)
test/                       npm test  (uses a fake in-memory database)
uploads/                    empty for now
```

## Tests

```
npm test
```

Runs 17 checks (login, validation, prices, order numbers, rollback, security) against a fake database,
so no MySQL is needed for them.

## Notes

- Cafe photo for the login screen: save it as `frontend/customer/CustomerImages/cafe.jpg`.
- Menu items and prices come from the `menu_items` table (`availability = 'Available'`).
- Prices are always taken from the database, never from the browser.
- Passwords are hashed (scrypt). Login is kept in a signed, HttpOnly cookie – set `SESSION_SECRET` in `.env`.
- Not used from the old layout on purpose: `create-admin.js`, `NETCOREPAY_SETUP.md`, `update-service-images.js`
  (admin / payment / service images are not part of this customer-only app).
