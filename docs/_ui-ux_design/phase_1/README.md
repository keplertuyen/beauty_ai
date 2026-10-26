# UI/UX Baseline Phase 1 — React Frontend

> Thư mục này chứa mã nguồn giao diện người dùng (UI/UX) cho Phase 1 MVP của dự án BeautyAI, được kế thừa và tinh chỉnh từ ứng dụng React + Vite sẵn có (`Final_Project/frontend`).

## 1. Cấu trúc trang (Pages)
- `Home.jsx` (`/`): Trang chủ với Hero banner, cam kết khoa học, USP Digital Skin ID, Routine Builder banner.
- `Products.jsx` (`/products`): Danh mục sản phẩm, bộ lọc theo loại da, khoảng giá, công tắc "An toàn cho da tôi".
- `ProductDetail.jsx` (`/products/:id`): Chi tiết sản phẩm, bảng thành phần INCI, biểu đồ công năng, cảnh báo dị ứng đỏ (Allergy Blacklist), phân loại review theo loại da.
- `Compare.jsx` (`/compare`): Bảng so sánh 2–4 sản phẩm side-by-side (thông số, hoạt chất, Match Score, cảnh báo dị ứng).
- `Wishlist.jsx` (`/wishlist`): Danh sách yêu thích, chuyển nhanh vào giỏ hàng.
- `IngredientAnalyzer.jsx` (`/ingredient-analyzer`): Công cụ dán văn bản thành phần tự do và phân tích an toàn.
- `SkinQuiz.jsx` (`/skin-quiz`): Chẩn đoán da 4–5 câu hỏi, hiển thị Routine AM/PM và nút "Chat-to-Cart" thêm cả bộ vào giỏ.
- `Cart.jsx` (`/cart`): Giỏ hàng có tích hợp Smart Conflict Detector (cảnh báo cặp hoạt chất kỵ nhau).
- `Checkout.jsx` (`/checkout`): Thanh toán COD, nhập địa chỉ nhận hàng, xác nhận đơn hàng.
- `Profile.jsx` (`/profile`): Thông tin cá nhân, Digital Skin ID, quản lý Allergy Blacklist, lịch sử đơn hàng.
- `ExpertConsult.jsx` (`/expert-consult`): Trợ lý AI Gemini tư vấn da liễu, grounding sản phẩm sàn, cá nhân hóa theo Skin ID.
- `AdminDashboard.jsx` (`/admin`): Quản trị sản phẩm (CRUD), quản trị đơn hàng và trạng thái vận chuyển.

## 2. Cách khởi chạy độc lập
```bash
cd docs/_ui-ux_design/phase_1
npm install
npm run dev
```
*(Lưu ý: Mã nguồn frontend chính thức đồng bộ API với .NET backend được đặt tại `src/frontend/`)*.
