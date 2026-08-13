# POS + Inventory System — Setup Guide

A single-folder full-stack system built with **Laravel 12 + Inertia.js + React 19 + MUI + Tailwind 4 + MySQL**.
Frontend and backend live in **one project** (no separate API repo) — Inertia connects React directly to Laravel controllers.

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 12 (PHP 8.2) |
| Bridge | Inertia.js (Laravel adapter) |
| Frontend | React 19 (JSX) |
| UI | MUI (Material UI) + Emotion, Tailwind CSS 4 |
| Alerts | SweetAlert2 |
| Icons | @mui/icons-material, react-icons |
| Auth | Laravel Breeze (session-based) |
| Build tool | Vite 7 |
| Database | MySQL 8 |
| Local server | Laragon |

---

## 2. Prerequisites

Make sure these are installed (all come with Laragon on Windows):

```bash
php -v          # PHP 8.2+
composer -V     # Composer 2.x
node -v         # Node 18+ (we use 22)
npm -v          # npm 9+
mysql --version # MySQL 8
```

---

## 3. Installation Commands (from scratch)

These are the exact steps used to build this project.

### Step 1 — Create the Laravel project

```bash
cd C:\laragon\www
composer create-project laravel/laravel pos-inventory
cd pos-inventory
```

### Step 2 — Configure the database (`.env`)

Edit `.env` and set:

```env
APP_NAME="POS Inventory"

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pos_inventory
DB_USERNAME=root
DB_PASSWORD=
```

### Step 3 — Create the MySQL database

```bash
mysql -u root -e "CREATE DATABASE pos_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> On Laragon you can also just open **Laragon → Database** and create `pos_inventory` in the GUI.

### Step 3.5 — Link storage for product images

Product images are stored in `storage/app/public` and served via a symlink. Run once:

```bash
php artisan storage:link
```

> On a fresh clone or new server this must be re-run, or uploaded images will 404.

### Step 4 — Install authentication + React/Inertia scaffolding (Breeze)

```bash
composer require laravel/breeze --dev
php artisan breeze:install react
```

This installs: Inertia.js, React, Tailwind CSS, Vite config, and ready-made
login / register / profile pages.

### Step 5 — Add the UI libraries (MUI stack)

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-icons sweetalert2
```

### Step 6 — Run migrations

```bash
php artisan migrate
```

### Step 7 — Install JS dependencies (if not already) & build

```bash
npm install
npm run build
```

---

## 4. Running the App (day-to-day)

You need **two processes** running at the same time.

**Terminal 1 — Laravel backend:**
```bash
php artisan serve
```
> Or with Laragon, just visit `http://pos-inventory.test` (auto virtual host).

**Terminal 2 — Vite frontend (hot reload):**
```bash
npm run dev
```

Then open the app and register your first account at `/register`.

---

## 5. Useful Commands

| Purpose | Command |
|---------|---------|
| Start backend | `php artisan serve` |
| Start frontend (dev) | `npm run dev` |
| Build frontend (prod) | `npm run build` |
| Run migrations | `php artisan migrate` |
| Reset DB + reseed | `php artisan migrate:fresh --seed` |
| Create a migration | `php artisan make:migration create_products_table` |
| Create model + migration + controller | `php artisan make:model Product -mc` |
| Create a controller | `php artisan make:controller ProductController` |
| Create a seeder | `php artisan make:seeder ProductSeeder` |
| Open Tinker (DB console) | `php artisan tinker` |
| List all routes | `php artisan route:list` |
| Clear caches | `php artisan optimize:clear` |

---

## 6. Project Structure (key folders)

```
pos-inventory/
├── app/
│   ├── Http/Controllers/     # Backend logic (POS, Products, Sales...)
│   └── Models/               # Eloquent models
├── database/
│   ├── migrations/           # Table definitions
│   └── seeders/              # Sample data
├── resources/
│   └── js/
│       ├── Pages/            # React pages (Inertia renders these)
│       ├── Components/       # Reusable React components
│       └── Layouts/          # App layouts
├── routes/
│   └── web.php               # All routes (Inertia + backend)
└── .env                      # Config (DB, app name, etc.)
```

---

## 7. Seeded Login Accounts

Run `php artisan migrate:fresh --seed` to reset the DB with sample data.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gmail.com` | `1234567890` |
| Cashier | `cashier@gmail.com` | `password` |

Seed data also includes 5 categories, 2 suppliers, and 13 sample products
(two intentionally low-stock for testing alerts).

---

## 8. Database Schema (Step 1 — DONE)

| Table | Purpose |
|-------|---------|
| `users` | + `role` (admin/cashier), `is_active` |
| `categories` | Product groups |
| `suppliers` | Vendor records |
| `products` | SKU, barcode, cost/selling price, stock, reorder level |
| `stock_movements` | Stock in/out/adjustment audit trail |
| `sales` | POS transactions (invoice, totals, payment) |
| `sale_items` | Line items per sale |

---

## 9. Next Build Steps (POS + Inventory features)

- [x] **Step 1 — Database schema** — migrations, models, relationships, seeders ✅
- [x] **Step 2 — Inventory pages** — Products/Categories/Suppliers CRUD, MUI sidebar, low-stock badges ✅
- [x] **Step 3 — Stock management** — stock in/out/adjustment, audit trail, low-stock alerts ✅
- [x] **Step 4 — POS / Cashier** — product search/scan → cart → payment → receipt ✅
- [x] **Step 5 — Dashboard & Reports** — KPIs, revenue chart, top products, sales history ✅

### Step 5 details
- `DashboardController`: today's revenue / transactions, this-month revenue, low-stock count,
  a **7-day revenue bar chart** (`@mui/x-charts`), top-5 products (30 days), recent sales, low-stock widget
- `SalesController`: paginated sales history with **date-range + invoice filters**, summary
  totals, and a per-invoice **detail modal** (fetched via `/sales/{sale}` JSON)
- `SalesDemoSeeder` populates ~7 days of sample sales so the dashboard has data:
  `php artisan db:seed --class=SalesDemoSeeder` (skips once >10 sales exist, preserving real data)

---

### Post-launch improvements
- Root `/` redirects to dashboard (logged in) or login (guest); Laravel Welcome page removed.
- **Login & Forgot Password** redesigned with a branded split-screen `AuthShell` + POSify logo.
- Fixed a focus-ring clash: `@tailwindcss/forms` was drawing a square box-shadow ring inside
  MUI's rounded inputs — suppressed via `.MuiInputBase-input { box-shadow: none }` in `app.css`.
- **Public registration removed.** Admins now create accounts on the **User Management** page
  (`/users`, admin-only): `UserController` with role assignment, activation toggle, and guards
  (can't delete/deactivate/demote yourself). Deactivated users are blocked at login.
- **Flash notifications** use a theme-aware **MUI Snackbar** (top-right, below the app bar,
  z-index above it) instead of the old SweetAlert toast that hid under the navbar and stayed
  white in dark mode. SweetAlert confirm dialogs (delete/clear) are dark-styled via `app.css`.
- **Light/Dark mode toggle** — `ColorModeProvider` (mounted once at the Inertia root in `app.jsx`)
  holds the theme via a light/dark `getTheme(mode)` factory and persists the choice in
  `localStorage` (falls back to the OS preference on first visit). A `ThemeToggle` sun/moon button
  appears on the auth pages (`AuthShell`, top-right) and in the app top bar (`AppLayout`), so it
  works on **login, forgot-password, and every page for both admin and cashier**.

## 🎉 System complete

All modules are built, and `php artisan test` is green (31 tests). To run a fresh demo:

```bash
php artisan migrate:fresh --seed                    # base data + accounts
php artisan storage:link                            # link product images (once)
php artisan db:seed --class=ProductImageSeeder      # generate placeholder product images
php artisan db:seed --class=SalesDemoSeeder         # sample sales for the dashboard
composer run dev   # (or: php artisan serve + npm run dev)
```

### Step 4 details
- `PosController@store` runs the whole checkout in **one DB transaction with `lockForUpdate`**:
  prices are read from the DB (never trusted from the client), stock is re-checked, the sale +
  line items are created, stock is deducted, and an `out` movement is logged per product.
- Guards: can't oversell stock; cash tendered must cover the total. Card/GCash treated as exact.
- POS screen: barcode/name search (Enter-to-add), category chips, product grid, live cart with
  qty steppers, discount, payment method, quick-cash chips, change calc, and a **printable receipt**.
- Accessible to **both cashier and admin** roles.

## 10. Testing

A dedicated test database keeps tests isolated from your dev data.

```bash
# one-time: create the test DB
mysql -u root -e "CREATE DATABASE pos_inventory_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

php artisan test                       # run everything (28 tests)
php artisan test --filter=PosCheckout  # just the POS checkout tests
```

`phpunit.xml` points the suite at `pos_inventory_test` (MySQL), since this environment
has no SQLite driver. Tests use `RefreshDatabase`, so they never touch `pos_inventory`.

### Step 3 details
- `StockController` records every change to `stock_movements` (type, signed qty, stock_before → stock_after, reason, reference, user)
- Updates run inside a **DB transaction with `lockForUpdate`** to prevent race conditions
- Guards: `in`/`out` require qty ≥ 1; stock can never go negative
- `adjustment` type sets an exact new count (delta computed automatically)
- Stock page (`/stock`): stat cards, low-stock alert cards with one-click **Restock**, filterable movement history

### Step 2 details
- MUI sidebar layout (`resources/js/Layouts/AppLayout.jsx`) with role-based nav
- Admin-only routes protected by `admin` middleware (`EnsureUserIsAdmin`)
- Server-side search + pagination; SweetAlert2 delete confirmations & flash toasts
- Products page has stat cards (total / active / low-stock) + category & low-stock filters
- **Note:** MUI installed is **v9** — use the new Grid API `<Grid size={{ xs: 12 }}>` (no `item`/`xs` props)

---

*Built with Laravel 12 + Inertia + React + MUI. Single-folder monolith.*
