---
change_id: CHANGE-ADMIN-CONSOLE-V2
doc: design-and-tasks
status: approved
title: CHANGE-ADMIN-CONSOLE-V2 — design
precedence: 5
---

# Design & Tasks — CHANGE-ADMIN-CONSOLE-V2

## 1. Database Schema Additions (Idempotent Startup DDL + EF Core)
1. **New table `support_tickets`**:
   - `id` SERIAL PK
   - `ticket_code` VARCHAR(32) UNIQUE NOT NULL (e.g. `SP-7F3K`)
   - `user_id` INT NULL FK → `users(id)` ON DELETE SET NULL
   - `name` VARCHAR(255) NOT NULL
   - `email` VARCHAR(255) NOT NULL
   - `subject` VARCHAR(255) NOT NULL
   - `message` TEXT NOT NULL
   - `status` VARCHAR(32) NOT NULL DEFAULT `'New'` (`New` | `InProgress` | `Resolved`)
   - `admin_reply` TEXT NULL
   - `created_at` TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `updated_at` TIMESTAMPTZ NULL
2. **Table `orders` columns**:
   - `tracking_number` VARCHAR(100) NULL
   - `admin_notes` TEXT NULL
3. **Table `reviews` columns**:
   - `is_hidden` BOOLEAN NOT NULL DEFAULT FALSE
   - `moderation_reason` VARCHAR(500) NULL

## 2. Backend API Endpoints
- **Public Support**:
  - `GET /api/v1/consultation/faq` — FAQ list (so `SupportCenter.jsx` works cleanly)
  - `POST /api/v1/consultation/contact` — Create `SupportTicket`, return `ticket_code`
- **Admin Upload**:
  - `POST /api/v1/admin/upload/product-image` — Multipart file upload (`.jpg`, `.jpeg`, `.png`, `.webp`, max 5 MB), saves to `wwwroot/uploads/products/{guid}{ext}`, returns `{ url: "/uploads/products/..." }`
- **Admin Dashboard**:
  - `GET /api/v1/admin/dashboard` — Enriched KPIs: `total_products`, `low_stock_products`, `total_orders`, `total_revenue_usd`, `active_users`, `total_users`, `pending_orders`, `open_tickets`, `total_reviews` + recent pending orders & recent support tickets.
- **Admin Orders**:
  - `GET /api/v1/admin/orders?q=&status=&limit=` — Filterable list with `tracking_number`, `admin_notes`, `items`
  - `PATCH /api/v1/admin/orders/{id}/status` — Update `status`, optional `tracking_number`, `admin_notes`
- **Admin Reviews**:
  - `GET /api/v1/admin/reviews?q=&rating=&status=&productId=&page=&per_page=`
  - `PATCH /api/v1/admin/reviews/{id}/visibility` — Toggle `is_hidden` + optional `moderation_reason` & recalculate product `avg_rating` and `reviews_count`
  - `DELETE /api/v1/admin/reviews/{id}` — Delete spam review & recalculate product `avg_rating` and `reviews_count`
- **Admin Users** (Strictly excludes `SkinProfile` & `UserAllergy` per `NFR-PRIV-08`):
  - `GET /api/v1/admin/users?q=&role=&isActive=&page=&per_page=`
  - `PATCH /api/v1/admin/users/{id}/status` — Toggle `is_active` (blocks self-deactivation)
  - `PATCH /api/v1/admin/users/{id}/role` — Switch `Customer` / `Admin` (blocks self-demotion)
- **Admin Support Tickets**:
  - `GET /api/v1/admin/support?q=&status=&page=&per_page=`
  - `PATCH /api/v1/admin/support/{id}` — Update `status` & `admin_reply`
- **Admin Ingredients & Conflict Rules**:
  - `GET /api/v1/admin/ingredients?q=&group=&activeOnly=&page=&per_page=`
  - `POST /api/v1/admin/ingredients`, `PUT /api/v1/admin/ingredients/{id}`, `DELETE /api/v1/admin/ingredients/{id}`
  - `GET /api/v1/admin/conflicts?q=&severity=`
  - `POST /api/v1/admin/conflicts`, `PUT /api/v1/admin/conflicts/{id}`, `DELETE /api/v1/admin/conflicts/{id}`

## 3. Frontend Architecture (`src/frontend/src/components/admin/`)
- `AdminDashboard.jsx` + `AdminDashboard.css`: Left Sidebar App Shell (collapsible mobile drawer, grouped navigation, live unread/pending badges, top utility bar, Overview Dashboard with KPIs + Action Needed cards + Recharts).
- `AdminProductSection.jsx` + `ProductFormModal.jsx`: Live image preview + file upload button + URL input.
- `AdminOrderSection.jsx`: Search/filter bar + Order Table + Slide-over Detail Drawer (items, shipping address, tracking number, admin notes, status workflow).
- `AdminReviewSection.jsx`: Star/product/status filters + Review moderation table (hide/show/delete with live rating sync).
- `AdminUserSection.jsx`: User search/filters + Order stats + Active toggle + Role switch (privacy-compliant).
- `AdminSupportSection.jsx`: Support Inbox with status filters, ticket detail drawer, reply/note editor, status actions.
- `AdminIntelligenceSection.jsx`: Tabbed view for INCI Ingredients Dictionary CRUD & Active Conflict Rules CRUD.
