---
doc: ui-ux-phase-1
title: UI/UX Design Specification & Screen Catalog — BeautyAI Phase 1 (MVP)
status: stable
precedence: 5
owner: UI/UX Designer / Frontend Lead
last_reviewed: 2026-10-26
---

# UI/UX DESIGN SPECIFICATION & SCREEN CATALOG — PHASE 1 (MVP)

> **Mục tiêu:** Định nghĩa danh mục màn hình, luồng người dùng (User Flows) và hệ thống thành phần giao diện phục vụ triển khai Phase 1 MVP trong 30 ngày.
> Tận dụng mã nguồn giao diện có sẵn tại `docs/_ui-ux_design/phase_1/frontend/` (React + Vite + CSS).

---

## 1. Danh Mục Màn Hình Cốt Lõi Phase 1 (12 Màn hình)

| STT | Màn hình | Tệp Component | Vai trò & Tính năng chính trong Phase 1 MVP |
|---|---|---|---|
| **01** | **Trang chủ (Home)** | `pages/Home.jsx` | Hero banner, USP giới thiệu AI da liễu, sản phẩm nổi bật, CTA Skin Quiz. |
| **02** | **Danh mục & Lọc (Catalog)** | `pages/Products.jsx` | Lọc theo loại da, mức giá, sắp xếp, công tắc toggle *"An toàn cho da tôi"* (Allergy filter). |
| **03** | **Chi tiết sản phẩm (PDP)** | `pages/ProductDetail.jsx` | Bảng INCI, biểu đồ công năng, Match Score %, cảnh báo dị ứng đỏ, lọc reviews 1M theo loại da. |
| **04** | **Skin Quiz & Routine** | `pages/SkinQuiz.jsx` | Quiz chẩn đoán da 4 câu ➔ Routine AM/PM ➔ Nút Chat-to-Cart thêm trọn bộ vào giỏ. |
| **05** | **Phân tích INCI tự do** | `pages/IngredientAnalyzer.jsx` | Ô dán bảng thành phần ➔ Bóc tách & phân tích lành tính / kích ứng / đối chiếu Allergy Blacklist. |
| **06** | **So sánh sản phẩm** | `pages/Compare.jsx` | Bảng so sánh song song 2-4 sản phẩm về thông số, hoạt chất, Match Score và cảnh báo dị ứng. |
| **07** | **Danh sách yêu thích** | `pages/Wishlist.jsx` | Quản lý sản phẩm đã lưu tim, chuyển nhanh vào giỏ hàng. |
| **08** | **Giỏ hàng (Cart)** | `pages/Cart.jsx` | Quản lý số lượng, **Smart Conflict Detector** (cảnh báo viền cam các cặp hoạt chất kỵ nhau). |
| **09** | **Thanh toán (Checkout)** | `pages/Checkout.jsx` | Form nhận hàng, thanh toán COD (Thanh toán khi nhận hàng), mã giảm giá cơ bản. |
| **10** | **Hồ sơ cá nhân & Skin ID** | `pages/Profile.jsx` | Quản lý thông tin, loại da, vấn đề da, quản lý **Allergy Blacklist**, lịch sử đơn hàng. |
| **11** | **Trợ lý AI (Chatbot)** | `pages/ExpertConsult.jsx` | Widget tư vấn mỹ phẩm tích hợp Google Gemini API, cá nhân hóa theo hồ sơ da, grounding sản phẩm. |
| **12** | **Quản trị sàn (Admin)** | `pages/AdminDashboard.jsx` | Quản lý sản phẩm (CRUD), quản lý trạng thái đơn hàng (`Chờ xử lý` ➔ `Đang giao` ➔ `Hoàn thành`). |

---

## 2. Hệ Thống Design System & Bảng Màu Da Liễu

- **Primary Brand (Hồng Đào & San Hô):** Nhấn mạnh sự chăm sóc sắc đẹp cao cấp, dịu dàng.
- **Y khoa & Khoa học (Xanh Y Tế & Xanh Lá):** Đại diện cho thành phần lành tính, an toàn, đã kiểm nghiệm.
- **Cảnh báo xung đột & Dị ứng:**
  - 🔴 **Đỏ (#EF4444):** Cảnh báo dị ứng cá nhân nghiêm trọng (`Allergy Blacklist` match).
  - 🟠 **Cam / Vàng (#F59E0B):** Cảnh báo hoạt chất tương xung trong cùng chu trình/giỏ hàng (`Smart Conflict Detector`).

---

## 3. Cấu Trúc Mã Nguồn Frontend Sẵn Có

```text
docs/_ui-ux_design/phase_1/frontend/
├── src/
│   ├── components/       # Navbar, Footer, ProductCard, CartDrawer, AuthModal
│   ├── context/          # AppContext (giỏ hàng, skin profile, state toàn cục)
│   ├── pages/            # 12 màn hình giao diện React hoàn chỉnh
│   ├── services/         # api.js kết nối REST API backend
│   └── utils/            # Thư viện dịch thuật, xử lý ảnh và nhãn thành phần
├── index.html
├── package.json
└── vite.config.js
```
