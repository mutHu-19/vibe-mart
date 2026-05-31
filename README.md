# ShopLK v3 — AliExpress-Style E-Commerce + POS

## What's New in v3

### 🛍️ Shop Frontend (AliExpress Style)
- **Full AliExpress-inspired UI** — red navbar, category strip, product grid with hover effects
- **Mobile-first responsive design** — 2-column grid on mobile, proper touch targets, bottom sheet modals
- **Top bar** with delivery info and seller center link
- **Flash sale strip** with live countdown timer
- **Infinite scroll / Load More** for products
- **Product modal** — bottom sheet on mobile, slides up smoothly; thumbnail strip, colour swatches, size buttons, stock indicator
- **Cart drawer** — slides in from right with quantity controls
- **Checkout** — mobile-friendly bottom sheet payment selection

### 📊 Admin Panel (Enhanced)
- **Mobile responsive sidebar** — hamburger menu on mobile, drawer with overlay
- **Profit & Loss Dashboard** — Net profit/loss card, expense breakdown, margin per product
- **Stock deduction on order confirm** — stock is NOT deducted at order placement; only when admin confirms the order
- **Stock restoration on cancel** — if a confirmed order is cancelled, stock is restored automatically
- **Cost price field** — add buying cost per product to calculate margins
- **Enhanced Reports** — P&L statement, expense breakdown chart, revenue share bars

### 🔧 Key Logic Changes
- Stock deduction: `pending → confirmed` deducts stock
- Stock restoration: `confirmed/processing/shipped → cancelled` restores stock
- `cost_price` column added to products for margin calculations

---

## Setup

### 1. Database
```sql
mysql -u root -p < database.sql
```

If upgrading from v2, run the migration:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted TINYINT(1) DEFAULT 0;
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and WhatsApp number
npm install
npm start
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

---

## Admin Login
- **URL**: http://localhost:3000/admin
- **Email**: admin@shoplk.com
- **Password**: admin123

---

## Stock Flow

| Event | Stock Change |
|-------|-------------|
| Customer places order | ❌ No change |
| Admin confirms order | ✅ Stock deducted |
| Admin cancels confirmed order | ✅ Stock restored |
| Admin cancels pending order | ❌ No change |

---

## P&L Calculation

```
Gross Revenue = Sum of all non-cancelled order totals
Total Expenses = Sum of expenses entered in Expenses page
Net Profit = Gross Revenue - Total Expenses
Profit Margin = Net Profit / Gross Revenue × 100
Product Margin = (Sell Price - Cost Price) / Sell Price × 100
```
