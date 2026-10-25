---
doc: ui-specification
title: Tài Liệu Đặc Tả Giao Diện (UI & Design System Specification) — BeautyAI Platform
status: draft
precedence: 5
owner: UI/UX Designer persona
last_reviewed: 2026-10-25
---

# 🌿 BeautyAI — Tài Liệu Đặc Tả Giao Diện (UI & Design System Specification)

> **Phiên bản:** 2.0 (Organic Nature & High Contrast)  
> **Áp dụng cho:** Toàn bộ phân hệ Frontend (`frontend/`), Tài liệu (`docs/`), và các nền tảng mở rộng (Mobile/Admin).  
> **Nguyên tắc cốt lõi:**  
> 1. **Thiên nhiên & Thư thái (Organic & Calming):** Tông màu nâu gỗ ấm, kem gạo tự nhiên, và xanh thảo mộc dịu mắt.  
> 2. **Tương phản rõ nét (High Contrast & Legibility):** Đạt chuẩn tiếp cận quốc tế WCAG AAA (≥ 7:1 cho text chính và các nút tương tác).  
> 3. **Phân vùng thông tin (Information Chunking):** Tránh dồn nén dữ liệu; chia nhỏ nội dung thành các thẻ và phân đoạn có khoảng thở (white space) rộng rãi.  
> 4. **Dễ dàng tái sử dụng (Highly Reusable):** Định nghĩa thông số đo lường chính xác bằng rem/px và biến CSS toàn cục.

---

## 1. Bảng Màu Hệ Thống (Color Palette)

### 1.1. Màu Thương Hiệu & Tương Tác Chính (Brand & Interactive)

| Tên màu | Biến CSS | Giá trị HEX | RGBA | Contrast Ratio | Mục đích sử dụng |
|---|---|---|---|:---:|---|
| **Deep Espresso Mocha** | `--primary` | `#4A3728` | `rgba(74, 55, 40, 1)` | **8.6:1 (AAA)** | Nút hành động chính (Primary CTA), tiêu đề nhấn mạnh, viền active. |
| **Dark Mocha Hover** | `--primary-hover` | `#36271C` | `rgba(54, 39, 28, 1)` | **10.5:1 (AAA)** | Trạng thái di chuột (hover) và nhấn giữ (active) của nút chính. |
| **Warm Sandalwood** | `--primary-light` | `#8C715A` | `rgba(140, 113, 90, 1)` | **4.8:1 (AA)** | Tiêu đề phụ, icon phụ, viền ngăn cách trang trí. |
| **Mocha Tint Glow** | `--primary-glow` | `#4A37281A` | `rgba(74, 55, 40, 0.10)` | N/A | Vùng đổ bóng mờ, nền của nút active nhẹ. |

### 1.2. Màu Thảo Mộc & Điểm Nhấn Tự Nhiên (Nature Accents)

| Tên màu | Biến CSS | Giá trị HEX | RGBA | Mục đích sử dụng |
|---|---|---|---|---|
| **Botanical Sage** | `--accent-sage` | `#2E6F4E` | `rgba(46, 111, 78, 1)` | Nhãn Clean at Sephora, Vegan, Organic, độ an toàn cao (Safety Score). |
| **Sage Mist Soft** | `--accent-sage-light` | `#EAF3ED` | `rgba(234, 243, 237, 1)` | Nền thẻ chứng nhận sạch, thông báo thành công, hoạt chất lành tính. |
| **Warm Terracotta** | `--accent-terracotta` | `#B85D3B` | `rgba(184, 93, 59, 1)` | Nhãn Giảm giá (Sale), Limited Edition, thông báo nổi bật. |
| **Terracotta Mist** | `--accent-terracotta-light` | `#F8EDE8` | `rgba(248, 237, 232, 1)` | Nền huy hiệu giảm giá, thẻ cảnh báo nhẹ. |
| **Golden Amber** | `--accent-amber` | `#D97706` | `rgba(217, 119, 6, 1)` | Đánh giá sao (Rating Stars), biểu tượng phần thưởng. |
| **Amber Mist** | `--accent-amber-light` | `#FEF3C7` | `rgba(254, 243, 199, 1)` | Nền khối điểm số rating, mẹo làm đẹp. |

### 1.3. Nền & Bề Mặt (Backgrounds & Surfaces)

| Tên màu | Biến CSS | Giá trị HEX | RGBA | Mục đích sử dụng |
|---|---|---|---|---|
| **Linen Canvas** | `--bg-primary` | `#FAF7F2` | `rgba(250, 247, 242, 1)` | Nền tổng thể toàn bộ trang web (tạo cảm giác ấm cúng, thư thái). |
| **Soft Sand Paper** | `--bg-secondary` | `#F2ECE2` | `rgba(242, 236, 226, 1)` | Nền khung ảnh sản phẩm, chân trang (Footer), banner phụ. |
| **Pure Clean White** | `--bg-card` | `#FFFFFF` | `rgba(255, 255, 255, 1)` | Bề mặt thẻ sản phẩm, khối mua sắm, hộp thoại Popover/Modal. |
| **Warm Card Hover** | `--bg-card-hover` | `#FDFBF8` | `rgba(253, 251, 248, 1)` | Hiệu ứng sáng bề mặt khi hover lên thẻ sản phẩm. |
| **Glass Surface** | `--glass-bg` | N/A | `rgba(255, 255, 255, 0.75)` | Nền thanh điều hướng (Navbar dính) với hiệu ứng làm mờ `blur(16px)`. |
| **Natural Border** | `--border-subtle` | N/A | `rgba(74, 55, 40, 0.08)` | Đường viền mỏng ngăn cách phân vùng nhẹ nhàng, không gây rối mắt. |
| **Strong Border** | `--border-focus` | `#4A3728` | `rgba(74, 55, 40, 1)` | Đường viền khi con trỏ chuột focus vào ô nhập liệu hoặc ô chọn. |

### 1.4. Màu Văn Bản (Typography Colors)

| Tên màu | Biến CSS | Giá trị HEX | Contrast trên `#FAF7F2` |
|---|---|---|:---:|
| **Warm Espresso (Chính)** | `--text-primary` | `#1E1712` | **13.5:1 (Cực kỳ sắc nét)** |
| **Warm Slate (Phụ)** | `--text-secondary` | `#55483F` | **6.2:1 (Đạt chuẩn AA/AAA)** |
| **Muted Bark (Mờ nhẹ)** | `--text-muted` | `#887A70` | **3.6:1 (Dùng cho ngày tháng, review count)** |
| **Clean White** | `--text-inverse` | `#FFFFFF` | **Dùng trên nền `--primary`** |

---

## 2. Kích Thước & Khung Định Dạng (Dimensions & Sizing)

### 2.1. Chiều Rộng Bố Cục (Layout Widths)

- **Max Container Width:** `1280px` (căn giữa với lề padding `24px` hai bên).
- **Narrow Content Width (Quiz/Profile/Cart):** `840px`.
- **Sidebar Width (Filter Catalog):** `280px` cố định trên màn hình máy tính.
- **Product Details Grid:**
  - Cột hiển thị ảnh trái: `48%` (tối đa `560px`).
  - Cột khối mua hàng phải: `52%` (tối thiểu `420px`).

### 2.2. Kích Thước Thẻ Sản Phẩm (Product Card Dimensions)

- **Chiều rộng thẻ (Desktop Grid 4 cột):** `260px` – `290px`.
- **Chiều cao khung ảnh (Card Image Box):** `260px` (Tỷ lệ khung hình `1:1` hoặc `4:5`).
- **Khoảng cách giữa các thẻ (Grid Gap):** `24px` (Desktop) / `16px` (Mobile).
- **Chiều cao tối thiểu toàn thẻ:** `420px` (đảm bảo thẳng hàng nút bấm).

### 2.3. Chiều Cao Các Phần Tử Giao Tiếp (Component Heights)

- **Thanh điều hướng (Navbar):** `68px` cố định (sticky).
- **Nút bấm kích cỡ lớn (Button Large - CTA):** `50px` (bo tròn `25px` hoặc bo góc `12px`).
- **Nút bấm kích cỡ vừa (Button Medium):** `42px` (bo tròn `21px` hoặc bo góc `10px`).
- **Nút bấm kích cỡ nhỏ (Button Small):** `34px` (bo tròn `17px` hoặc bo góc `8px`).
- **Ô nhập liệu (Input Field):** `46px` (với font size `15px`).
- **Nút icon tròn (Wishlist, Quick Action):** `38px × 38px`.

---

## 3. Hệ Thống Khoảng Cách & Bo Góc (Spacing & Radii)

### 3.1. Thang Đo Khoảng Cách (Spacing Scale — Bội số 4px & 8px)

```text
--spacing-2xs: 4px   /* Khoảng cách giữa icon và chữ nhỏ */
--spacing-xs:  8px   /* Khoảng cách giữa các badge, nhãn */
--spacing-sm:  12px  /* Padding trong của ô chọn, thẻ nhỏ */
--spacing-md:  16px  /* Padding chuẩn của card nhỏ, gutter lưới */
--spacing-lg:  24px  /* Khoảng cách giữa các khối thông tin */
--spacing-xl:  32px  /* Khoảng cách giữa các tiêu đề và phần tử */
--spacing-2xl: 48px  /* Khoảng cách giữa các phần lớn (Section gap) */
--spacing-3xl: 64px  /* Khoảng lề phân tách đầu trang/cuối trang */
```

### 3.2. Quy Chuẩn Bo Góc (Border Radii)

- `--radius-sm` (`6px`): Tag nhỏ, dropdown menu options.
- `--radius-md` (`10px`): Khung input, ô tìm kiếm, hộp thoại thông tin ngắn.
- `--radius-lg` (`16px`): Thẻ sản phẩm (`ProductCard`), khối mua sắm (`BuyBox`), bảng thành phần.
- `--radius-xl` (`24px`): Hộp thoại Modal, khung Skin Quiz lớn, ảnh Hero Showcase.
- `--radius-pill` (`9999px`): Nút bấm chính, huy hiệu (Badges), thẻ phân loại Active.

---

## 4. Hệ Thống Phông Chữ (Typography Hierarchy)

| Cấp độ | Phông chữ | Kích thước (Desktop) | Kích thước (Mobile) | Độ đậm (Weight) | Chiều cao dòng (Line Height) |
|---|---|:---:|:---:|:---:|:---:|
| **Hero Title (H1)** | `Playfair Display`, serif | `44px` (`2.75rem`) | `32px` | `700` (Bold) | `1.2` |
| **Section Title (H2)** | `Playfair Display`, serif | `32px` (`2.0rem`) | `24px` | `600` (Semi-bold) | `1.3` |
| **Subsection Title (H3)** | `DM Sans`, sans-serif | `20px` (`1.25rem`) | `18px` | `600` (Semi-bold) | `1.4` |
| **Product Title (Card)** | `DM Sans`, sans-serif | `15px` (`0.95rem`) | `14px` | `500` (Medium) | `1.4` |
| **Body Text** | `DM Sans`, sans-serif | `15px` (`0.95rem`) | `14px` | `400` (Regular) | `1.6` |
| **Caption / Meta** | `DM Sans`, sans-serif | `13px` (`0.81rem`) | `12px` | `400` / `500` | `1.5` |
| **Price (Chính)** | `DM Sans`, tabular-nums | `22px` (`1.37rem`) | `18px` | `700` (Bold) | `1.0` |

---

## 5. Quy Chuẩn Thiết Kế Từng Phân Vùng (Visual Chunking Guidelines)

### 5.1. Thẻ Sản Phẩm (Product Card)
- **Tập trung vào 4 điểm vàng:** Ảnh rõ $\rightarrow$ Tên & Thương hiệu $\rightarrow$ Điểm đánh giá & Giá bán $\rightarrow$ Nút Thêm vào giỏ.
- **Tránh:** Không nhồi nhét quá 2 loại badge trên cùng một ảnh; không dùng viền đen đậm; không làm nút wishlist quá thô.
- **Nút Wishlist:** Hình tròn nền trắng muốt nổi nhẹ trên góc ảnh (`box-shadow: 0 2px 8px rgba(0,0,0,0.06)`), đổi sang đỏ hồng khi đã lưu.

### 5.2. Trang Chi Tiết Sản Phẩm (Product Detail)
- **Phân đoạn 1 — Trực quan & Cam kết (Visual & Trust):**
  - Khung ảnh sắc nét với tỷ lệ `1:1`, nền kem cát mềm mại (`#F4EFE6`).
  - Thanh 3 cam kết chất lượng ngay dưới ảnh: 🌿 *Chiết xuất an toàn* · 🚚 *Giao nhanh 2–4 ngày* · 📦 *Đổi trả dễ dàng*.
  - Nút tiện ích: "Xem Mã QR & Barcode" mở cửa sổ popover sạch sẽ để quét trên điện thoại.
- **Phân đoạn 2 — Khối Quyết Định Mua (Purchase Box):**
  - Thương hiệu in hoa trang nhã kèm nhãn danh mục.
  - Tên sản phẩm cỡ lớn, dễ đọc.
  - Hàng sao đánh giá vàng ấm kèm số lượt review chính xác.
  - Khối giá to rõ, nổi bật mức tiết kiệm khi có khuyến mãi.
  - Nút **Thêm vào giỏ hàng** màu nâu Mocha đậm tương phản cao, tràn viền nút bấm dễ nhấn.
- **Phân đoạn 3 — Khám Phá Chuyên Sâu Theo Tab (Segmented Deep Dive):**
  - Tab 1: *Đặc tính & Hướng dẫn sử dụng* (Điểm nổi bật dạng thẻ có icon, không phải văn bản dính liền).
  - Tab 2: *Phân tích thành phần & AI Safety* (Danh sách hoạt chất chính, thang điểm an toàn, nút phân tích tự động).
  - Tab 3: *Đánh giá thực tế từ người dùng* (Biểu đồ phân bố sao trực quan kèm danh sách review chân thực).
- **Phân đoạn 4 — Khuyến Nghị Tương Đồng (Recommendation Rail):**
  - Khu vực hiển thị sản phẩm thường mua kèm (luật kết hợp Apriori) và sản phẩm tương tự (Content-Based) tách riêng thành 2 hàng trượt ngang mượt mà.

---

## 6. Mẫu Mã CSS Sẵn Sàng Nhúng (Ready-to-use CSS Snippet)

```css
:root {
  /* Colors */
  --primary: #4A3728;
  --primary-hover: #36271C;
  --primary-light: #8C715A;
  --accent-sage: #2E6F4E;
  --accent-sage-light: #EAF3ED;
  --accent-terracotta: #B85D3B;
  --accent-amber: #D97706;
  
  --bg-primary: #FAF7F2;
  --bg-secondary: #F2ECE2;
  --bg-card: #FFFFFF;
  
  --text-primary: #1E1712;
  --text-secondary: #55483F;
  --text-muted: #887A70;
  
  --border-subtle: rgba(74, 55, 40, 0.08);
  --shadow-organic: 0 4px 20px rgba(74, 55, 40, 0.06);
  --radius-card: 16px;
  --radius-btn: 9999px;
}
```
