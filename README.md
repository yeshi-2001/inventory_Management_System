# 📦 Smart Inventory & Warehouse Management System

A full-stack inventory management system built with **PostgreSQL + Prisma + Node.js + React + Python Flask**.

---

## 🗂 Project Structure

```
Management/
├── backend/          # Node.js + Express + Prisma API
├── frontend/         # React + Tailwind CSS UI
├── analytics/        # Python Flask analytics microservice
└── firestore.rules   # (legacy, no longer used)
```

---

## ⚙️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Database   | PostgreSQL (Supabase or local)      |
| ORM        | Prisma                              |
| Backend    | Node.js, Express, Nodemailer        |
| Frontend   | React, Tailwind CSS, Recharts       |
| Analytics  | Python, Flask                       |
| Auth       | JWT (users table ready)             |

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/yeshi-2001/inventory_Management_System.git
cd inventory_Management_System
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file (see `.env.example`):
```
PORT=5000
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/inventory_db
FRONTEND_URL=http://localhost:3000
PYTHON_SERVICE_URL=http://localhost:8000
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
OWNER_EMAIL=your@gmail.com
```

Run migrations and seed:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

Start the server:
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm start
```

### 4. Analytics service setup
```bash
cd analytics
pip install -r requirements.txt
python app.py
```

---

## 📡 API Endpoints

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get all items |
| POST | `/api/inventory` | Create item |
| PUT | `/api/inventory/:id` | Update item |
| DELETE | `/api/inventory/:id` | Delete item |
| GET | `/api/inventory/low-stock` | Low stock items |
| GET | `/api/inventory/dead-stock` | Dead stock items |
| GET | `/api/inventory/fast-movers` | Fast moving items |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/stock-report` | Full stock analysis |
| GET | `/api/analytics/summary` | Dashboard summary |
| GET | `/api/analytics/chart-data/:id` | Chart data per item |
| GET | `/api/analytics/export?format=csv\|pdf` | Export report |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Unresolved alerts |
| POST | `/api/alerts/resolve/:id` | Resolve alert |
| POST | `/api/alerts/send-vendor-email` | Trigger vendor emails |

### Vendors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendors` | All vendors |
| GET | `/api/vendors/:id` | Single vendor |

---

## 🗄 Database Schema

- `vendors` — supplier details with lead time
- `inventory` — stock items linked to vendors
- `daily_sales` — per-day sales records
- `transactions` — IN/OUT stock movements
- `alerts` — low stock / dead stock alerts
- `users` — system users with roles

---

## 💰 Currency

All prices are displayed in **Sri Lankan Rupees (Rs.)**.

---

## 🧪 Running Tests

```bash
# Node.js tests
cd backend
npm test

# Python tests
cd analytics
pytest tests/
```

---

## 📧 Email Alerts

The system sends automated emails via Gmail SMTP:
- **Owner alert** when stock drops below minimum
- **Vendor reorder request** with suggested quantity
- **Daily cron job** at 9am checks all low-stock items

---

## 📤 Export

Reports can be exported as:
- **CSV** — all items with status and reorder recommendations
- **PDF** — formatted report with color-coded status and summary
