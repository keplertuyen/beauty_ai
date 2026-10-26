---
doc: prd-beautyai-phase1
title: Product Requirements Document (PRD) — BeautyAI Phase 1 MVP (30-Day Solo Sprint)
status: stable
precedence: 3
owner: SA / BA Lead
last_reviewed: 2026-10-26
---

# BẢN ĐẶC TẢ YÊU CẦU SẢN PHẨM (PRD) — BEAUTYAI PHASE 1 (MVP)

> **Dành riêng cho Phase 1 (MVP Đồ án / Launch PROD):** Sprint 30 ngày (1 tháng), phát triển theo chế độ **Solo Developer**.
> **Nguồn gốc:** Tinh lọc từ `beautyai_prd.md`, `beautyai_brd.md` và khung đặc tả `CHUC_NANG_PHASE1_DO_AN.md`.
> **Nguyên tắc vàng:** Ưu tiên tối đa các tính năng tạo ra sự khác biệt cốt lõi (USP Da liễu & AI), khai thác tối đa tài nguyên có sẵn (Dataset 1 triệu review và Giao diện React sẵn có), cắt bỏ triệt để các tích hợp bên thứ ba phức tạp để đảm bảo chất lượng bàn giao hoàn hảo đúng hạn.

---

## 1. TỔNG QUAN SẢN PHẨM & TẦM NHÌN MVP

### 1.1. Bối cảnh & Vấn đề giải quyết
Thị trường thương mại điện tử mỹ phẩm hiện nay (Shopee, Lazada, Hasaki, Watsons) đang gặp phải các điểm nghẽn nghiêm trọng:
1. **Bất đối xứng thông tin thành phần:** Khách hàng đọc bảng thành phần (INCI) như "đọc mật mã", không hiểu chất nào có lợi và chất nào có hại cho tình trạng da của mình.
2. **Kích ứng và dị ứng mỹ phẩm tràn lan:** Người dùng có cơ địa dị ứng nhưng không có công cụ tự động cảnh báo, dẫn đến việc mua phải sản phẩm chứa hoạt chất kỵ cơ địa.
3. **Xung đột hoạt chất khi dùng phối hợp:** Xu hướng dùng nhiều bước skincare (Layering) khiến khách hàng kết hợp các chất triệt tiêu hoặc gây bỏng rát (ví dụ: Retinol dùng chung AHA/BHA hoặc Benzoyl Peroxide).
4. **Đánh giá thiếu tính cá nhân hóa:** 1 sản phẩm được chấm 5 sao bởi người "da khô" có thể là thảm họa đối với người "da dầu mụn".

### 1.2. Mục tiêu Phase 1 (MVP 30 Ngày)
- Xây dựng một **nền tảng E-commerce mỹ phẩm hoàn chỉnh, an toàn và thông minh** có thể chạy trực tiếp trên môi trường Production / Demo đồ án.
- Đóng gói đầy đủ **4 trụ cột USP độc quyền**:
  - **Trụ cột 1:** Digital Skin ID & Cảnh báo dị ứng cá nhân (Allergy Blacklist).
  - **Trụ cột 2:** Phân tích thành phần INCI, Biểu đồ công năng & Match Score (INV-01).
  - **Trụ cột 3:** Smart Conflict Detector & Routine Builder kèm tính năng Chat-to-Cart.
  - **Trụ cột 4:** Trợ lý Gemini AI tư vấn khoa học & Đánh giá phân loại theo loại da từ tập 1 triệu review.

---

## 2. NGUYÊN TẮC PHẠM VI (SCOPE BOUNDARY: PHASE 1 VS. PHASE 2)

| Tiêu chí | 🟢 Phase 1 (MVP — 30 Ngày Solo) | 🔴 Phase 2 (Mở rộng — 6 Tháng tiếp theo) |
|---|---|---|
| **Mục tiêu chính** | Launch sản phẩm chạy thật, lõi nghiệp vụ trọn vẹn, thuyết trình đồ án xuất sắc | Quy mô hóa doanh nghiệp, mở rộng kênh bán và tự động hóa vận hành |
| **Tiền tệ & Ngôn ngữ** | Chuẩn 1 loại tiền tệ: **VND (₫)**; Ngôn ngữ: **Tiếng Việt** | Đa tiền tệ (USD/VND tỷ giá động), Đa ngôn ngữ (VI/EN) |
| **Xác thực (Auth)** | Email/Password, JWT an toàn, RBAC Customer / Admin | Social Login (Google, Facebook OAuth), Đăng nhập Zalo |
| **Thanh toán** | **COD (Thanh toán khi nhận hàng)** làm cốt lõi (VNPay Sandbox là stretch goal) | Đa cổng: VNPay, MoMo, ZaloPay, Thẻ tín dụng quốc tế (Stripe) |
| **Vận chuyển & Thông báo** | Quản lý trạng thái đơn hàng nội bộ (`Chờ xử lý` -> `Đang giao` -> `Đã giao`) | Tích hợp API đối tác GHN / GHTK, Webhook cập nhật vị trí shipper |
| **Tích hợp Zalo** | Không làm (đã thống nhất cắt bỏ) | Tích hợp Zalo Mini App, Zalo ZNS / Notification Service |
| **Trợ lý AI** | Gemini API trực tiếp (Backend Gateway), grounding sản phẩm sàn, prompt guardrails | Hệ thống AI Agent đa tầng, lưu trữ phiên dài hạn, fine-tuning mô hình |
| **Dữ liệu Review** | Khai thác Dataset 1 triệu review, lọc review theo Loại da người đánh giá | Hệ thống upvote/downvote review, kiểm duyệt ảnh review bằng Vision AI |
| **UI Frontend** | Tận dụng và hoàn thiện mã nguồn React sẵn có trong `docs/_ui-ux_design/phase_1/` | Thiết kế Mobile App React Native, PWA Offline Service Worker |

---

## 3. ĐẶC TẢ CHI TIẾT 12 MODULE CHỨC NĂNG PHASE 1

### M01: Tài khoản, Phân quyền & Profile
- **FR-AUTH-01 (Đăng ký tài khoản):** Cho phép người dùng đăng ký bằng Email, Họ tên, Mật khẩu (tối thiểu 8 ký tự). Kiểm tra email không được trùng lặp.
- **FR-AUTH-02 (Đăng nhập & Lưu phiên):** Đăng nhập bằng Email/Mật khẩu. Cấp mã thông báo xác thực an toàn (JWT/HttpOnly Cookie).
- **FR-AUTH-03 (Đăng xuất):** Hủy phiên làm việc và xóa token tại client.
- **FR-AUTH-04 (Đổi mật khẩu):** Người dùng đã đăng nhập có thể đổi mật khẩu mới (yêu cầu nhập đúng mật khẩu cũ).
- **FR-AUTH-05 (Cập nhật Profile):** Xem và chỉnh sửa thông tin cá nhân: Họ tên, Số điện thoại, Ngày sinh, Địa chỉ nhận hàng mặc định. (Email là định danh cố định không thể chỉnh sửa).
- **FR-AUTH-06 (Phân quyền RBAC):** 
  - `CUSTOMER`: Mua hàng, tạo Skin ID, đánh giá, chat AI, xem đơn hàng của mình.
  - `ADMIN`: Toàn quyền truy cập bảng quản trị `/admin`, quản lý sản phẩm, danh mục, đơn hàng. Middleware backend và frontend chặn truy cập trái phép.

---

### M02: Digital Skin ID & Allergy Blacklist (USP Cốt lõi)
- **FR-SKIN-01 (Tạo & Cập nhật Hồ sơ da):**
  - Loại da chính (Bắt buộc chọn 1 trong 4): `Dầu (Oily)`, `Khô (Dry)`, `Hỗn hợp (Combination)`, `Thường (Normal)`.
  - Mức độ nhạy cảm (Công tắc Toggle): `Da nhạy cảm (Sensitive Skin)` (True/False).
  - Vấn đề da quan tâm (Chọn tối đa 5): `Mụn (Acne)`, `Thâm nám (Pigmentation)`, `Lỗ chân lông to (Enlarged Pores)`, `Lão hóa (Anti-aging)`, `Khô bong tróc (Dryness)`, `Dầu thừa (Oiliness)`.
- **FR-SKIN-02 (Quản lý Allergy Blacklist):**
  - Ô tìm kiếm hỗ trợ tra cứu thành phần từ DB (auto-suggest khi gõ tên tiếng Việt hoặc tên quốc tế INCI, ví dụ: "Cồn", "Alcohol", "Hương liệu", "Fragrance", "Paraben", "Niacinamide").
  - Thêm hoạt chất dị ứng vào danh sách cá nhân dưới dạng các chip/tag có nút xóa `x`.
  - Không giới hạn số lượng chất đưa vào blacklist.
- **FR-SKIN-03 (Cảnh báo dị ứng cá nhân hóa đa điểm):**
  - Hệ thống tự động đối chiếu thành phần sản phẩm với Allergy Blacklist của người dùng hiện tại:
    - **Tại Product Card (Catalog/Search):** Huy hiệu cảnh báo đỏ *"Có thành phần dị ứng"*.
    - **Tại PDP:** Banner đỏ viền đậm *"Cảnh báo: Sản phẩm chứa [Tên hoạt chất] nằm trong Danh sách dị ứng của bạn"*.
    - **Tại Giỏ hàng (Cart):** Hiển thị nhãn cảnh báo đỏ ngay dưới tên sản phẩm.
    - **Tại Skin Quiz & Routine:** Tự động loại trừ hoặc đánh dấu đỏ cảnh báo.

---

### M03: Danh mục, Tìm kiếm & Smart Filter
- **FR-CAT-01 (Cây danh mục 2 cấp):**
  - Danh mục cha: *Chăm sóc da mặt*, *Làm sạch*, *Đặc trị*, *Chống nắng*, *Dưỡng ẩm*.
  - Danh mục con: *Sữa rửa mặt*, *Tẩy trang*, *Toner*, *Serum*, *Kem dưỡng*, *Kem chống nắng*.
- **FR-CAT-02 (Tìm kiếm thông minh):** Tìm kiếm theo tên sản phẩm, thương hiệu (Brand) hoặc theo tên hoạt chất (ví dụ gõ "BHA", "Niacinamide", "Centella").
- **FR-CAT-03 (Bộ lọc đa chiều):**
  - Lọc theo Loại da phù hợp: Da dầu, da khô, da nhạy cảm...
  - Lọc theo Khoảng giá bán (VND) bằng slider hoặc các mức giá định sẵn.
  - Sắp xếp: Giá tăng dần, Giá giảm dần, Đánh giá cao nhất, Mới nhất.
- **FR-CAT-04 (Công tắc USP: "An toàn cho da tôi"):**
  - Dành cho khách hàng đã đăng nhập và đã thiết lập Digital Skin ID.
  - Khi bật công tắc: Hệ thống loại bỏ hoàn toàn khỏi danh sách kết quả tất cả các sản phẩm có chứa bất kỳ thành phần nào trong Allergy Blacklist của họ.

---

### M04: Trang chi tiết sản phẩm (PDP) & Phân tích INCI
- **FR-PDP-01 (Thông tin sản phẩm tiêu chuẩn):** Tên sản phẩm, thương hiệu, hình ảnh sắc nét, giá bán VND, dung tích/trọng lượng, tình trạng tồn kho, mô tả công dụng.
- **FR-PDP-02 (Bảng thành phần INCI bóc tách):** Danh sách thành phần chuẩn hóa theo thứ tự nồng độ giảm dần, hiển thị kèm nhãn công năng (Dưỡng ẩm, Làm dịu, Chống lão hóa, Tẩy tế bào chết, Làm sáng da...).
- **FR-PDP-03 (Biểu đồ phân bổ công năng):** Biểu đồ thanh tiến trình hoặc donut chart trực quan hóa tỷ lệ các nhóm công dụng (Ví dụ: 45% Dưỡng ẩm & Phục hồi, 25% Chống oxy hóa, 15% Làm dịu, 15% Khác).
- **FR-PDP-04 (Chấm điểm phù hợp — Suitability Score / Match Score):**
  - Tính toán độ tương thích (0–100%) giữa sản phẩm và Digital Skin ID của người dùng (dựa trên loại da, công năng giải quyết vấn đề da và loại trừ dị ứng).
  - *Tuân thủ bất biến INV-01: Tuyệt đối không dùng tên `SafetyScore` hay `HazardScore`*.
- **FR-PDP-05 (Hướng dẫn sử dụng & Routine Placement):** Khuyến nghị rõ ràng thời điểm sử dụng: Buổi sáng (AM) hay Buổi tối (PM), thứ tự bước trước/sau trong chu trình dưỡng da.
- **FR-PDP-06 (Sản phẩm tương tự):** Đề xuất 4–6 sản phẩm cùng danh mục/công năng để khách hàng có thêm lựa chọn.

---

### M05: Skin Quiz & Routine Builder (Chat-to-Cart)
- **FR-QUIZ-01 (Bộ trắc nghiệm chẩn đoán da 4–5 bước):**
  - Bước 1: Phản ứng của da sau khi rửa mặt 30 phút? (Xác định da dầu / khô / hỗn hợp / thường).
  - Bước 2: Mức độ nhạy cảm của da? (Có dễ bị ửng đỏ, châm chích khi đổi thời tiết/mỹ phẩm không?).
  - Bước 3: Vấn đề da lớn nhất bạn muốn giải quyết trong 30 ngày tới? (Mụn, Thâm sạm, Lão hóa, Lỗ chân lông...).
  - Bước 4: Mức ngân sách dự kiến cho chu trình skincare (Dưới 500k, 500k–1.5tr, Trên 1.5tr).
- **FR-QUIZ-02 (Routine Builder AM/PM trực quan):**
  - **Chu trình Buổi sáng (AM):** Sữa rửa mặt -> Cân bằng / Toner -> Serum đặc trị nhẹ -> Kem dưỡng ẩm -> **Kem chống nắng (Bắt buộc)**.
  - **Chu trình Buổi tối (PM):** Tẩy trang -> Sữa rửa mặt -> Serum đặc trị chuyên sâu -> Kem dưỡng phục hồi khóa ẩm.
- **FR-QUIZ-03 (Kiểm tra xung đột trong routine):** Hệ thống tự động rà soát chéo giữa các sản phẩm được đề xuất trong cùng buổi để đảm bảo không có cặp hoạt chất kỵ nhau.
- **FR-QUIZ-04 (Tính năng Chat-to-Cart):** Nút bấm *"Thêm toàn bộ Routine vào giỏ"* — tự động đưa toàn bộ 4–6 món mỹ phẩm được gợi ý vào giỏ hàng chỉ với 1 click chuột.
- **FR-QUIZ-05 (Lưu kết quả Quiz):** Tự động đồng bộ kết quả vào Digital Skin ID và lưu lại routine để người dùng xem lại trong trang cá nhân.

---

### M06: Công cụ dán & phân tích INCI tự do (Ingredient Analyzer)
- **FR-INCI-01 (Nhập liệu tự do):** Một ô Textarea cho phép người dùng copy paste toàn bộ chuỗi thành phần in trên bao bì của bất kỳ sản phẩm nào họ đang dùng ở nhà.
- **FR-INCI-02 (Bộ phân tích & Tra cứu từ điển):** Thuật toán tự động chuẩn hóa dấu phân cách (dấu phẩy, chấm phẩy, gạch đầu dòng), bóc tách từng tên chất và tra cứu trong CSDL từ điển INCI.
- **FR-INCI-03 (Hiển thị kết quả an toàn bằng mã màu):**
  - Màu xanh lá: Hoạt chất lành tính, dưỡng ẩm, phục hồi, chống lão hóa.
  - Màu vàng/cam: Hoạt chất mạnh (AHA, BHA, Retinol, Vitamin C nồng độ cao) cần lưu ý liều lượng.
  - Màu đỏ: Thành phần tiềm ẩn nguy cơ kích ứng cao, cồn khô, hương liệu nhân tạo, paraben.
- **FR-INCI-04 (Đối chiếu Skin Profile):** Bật cảnh báo ngay nếu chuỗi thành phần vừa dán có chứa chất nằm trong Allergy Blacklist của người dùng.

---

### M07: Smart Conflict Detector (Phát hiện xung đột hoạt chất)
- **FR-CONF-01 (Quét xung đột trong giỏ hàng):** Tự động quét toàn bộ sản phẩm đang có trong giỏ hàng (`/cart`).
- **FR-CONF-02 (Cảnh báo cặp hoạt chất kỵ nhau):**
  - Áp dụng bộ 10–15 quy tắc xung đột da liễu phổ biến nhất:
    - *Retinol / Tretinoin* kỵ *AHA / BHA* (Nguy cơ quá tải tẩy da chết, đỏ rát, bong tróc).
    - *Benzoyl Peroxide* kỵ *Retinoid* (Oxy hóa triệt tiêu hoạt tính của nhau, gây kích ứng mạnh).
    - *Vitamin C (L-Ascorbic Acid)* kỵ *Niacinamide* (nếu dùng nồng độ cao cùng lúc dễ gây đỏ mặt do hình thành phức hợp).
    - *AHA/BHA* kỵ *Vitamin C liều cao* (Độ pH quá thấp làm rát da).
- **FR-CONF-03 (Hướng dẫn phân bổ khoa học):** Hộp cảnh báo viền vàng/cam hiển thị lời khuyên: *"Khuyên dùng: Chia buổi Sáng dùng Vitamin C, Tối dùng Retinol"* hoặc *"Dùng xen kẽ cách ngày (thứ 2-4-6 và thứ 3-5-7)"*.
- **FR-CONF-04 (Quyền quyết định thuộc về khách hàng):** Cảnh báo mang tính tư vấn bảo vệ sức khỏe, không chặn nút đặt hàng. Khách hàng có thể tick chọn *"Tôi đã hiểu cảnh báo"* để tiếp tục thanh toán.

---

### M08: So sánh sản phẩm (Compare) & Danh sách yêu thích (Wishlist)
*(Tận dụng tối đa giao diện React hoàn thiện có sẵn trong thư mục `docs/_ui-ux_design/phase_1/`)*:
- **FR-COMP-01 (Thêm vào khay so sánh):** Cho phép chọn tối đa 3–4 sản phẩm cùng danh mục từ Catalog hoặc PDP.
- **FR-COMP-02 (Thanh Compare Drawer ghim đáy màn hình):** Hiển thị các sản phẩm đang chọn, nút xóa từng món và nút "So sánh ngay".
- **FR-COMP-03 (Bảng so sánh chi tiết Side-by-side):**
  - So sánh thông số: Giá bán, dung tích, thương hiệu, rating sao.
  - So sánh công năng & loại da phù hợp.
  - So sánh thành phần: Bảng liệt kê hoạt chất giống nhau và khác nhau.
  - So sánh Match Score cá nhân hóa theo Skin ID của khách.
  - Đánh dấu cảnh báo đỏ trên cột sản phẩm chứa chất dị ứng của người xem.
- **FR-WISH-01 (Quản lý Wishlist):** Thêm/bỏ yêu thích bằng icon trái tim. Trang `/wishlist` hiển thị toàn bộ sản phẩm đã lưu kèm nút "Thêm nhanh vào giỏ hàng".

---

### M09: Giỏ hàng & Thanh toán COD (Cart & Checkout)
- **FR-CART-01 (Trang giỏ hàng):** Hiển thị danh sách sản phẩm, hình ảnh, đơn giá VND, ô điều chỉnh số lượng (1–99), tổng tiền tạm tính.
- **FR-CART-02 (Mã giảm giá đơn giản):** Ô nhập coupon code áp dụng mã giảm giá cố định (demo mã `BEAUTYAI10` giảm 10%, `FREESHIP` giảm 30k tiền ship).
- **FR-CHECK-01 (Form Checkout tinh gọn):**
  - Thông tin người nhận: Họ tên, Số điện thoại (kiểm tra định dạng 10 số), Địa chỉ nhận hàng chi tiết (Tỉnh/Thành, Quận/Huyện, Số nhà/Đường), Ghi chú giao hàng.
  - Tự động điền thông tin từ Profile nếu người dùng đã lưu trước đó.
- **FR-CHECK-02 (Phương thức thanh toán COD):** Mặc định hỗ trợ phương thức **COD (Thanh toán khi nhận hàng)**. Khách hàng bấm "Xác nhận đặt hàng" -> Lưu đơn hàng vào DB với trạng thái `PENDING`.
- **FR-CHECK-03 (Trang kết quả đặt hàng - Thank You):** Hiển thị mã đơn hàng dạng `ORD-YYYYMMDD-XXXX`, tóm tắt thông tin người nhận, danh sách món và thông báo giao hàng dự kiến (2–4 ngày).
- **FR-ORDER-01 (Lịch sử đơn hàng cá nhân):** Người dùng xem lại các đơn hàng đã đặt trong trang `/profile`, theo dõi trạng thái đơn hàng (`Chờ xử lý`, `Đang giao hàng`, `Đã giao`, `Đã hủy`).

---

### M10: Trợ lý AI Skincare (Google Gemini API)
- **FR-AI-01 (Widget Chatbot AI):** Khung chat widget nổi ở góc dưới bên phải màn hình hoặc trang tư vấn chuyên sâu `/expert-consult`.
- **FR-AI-02 (Kết nối mô hình Gemini):** Kết nối backend với Google Gemini API (model `gemini-2.5-flash` hoặc `gemini-1.5-flash`) cho tốc độ phản hồi dưới 2 giây và chi phí tối ưu.
- **FR-AI-03 (Grounding dữ liệu sản phẩm sàn):** AI được nạp thông tin danh mục sản phẩm của BeautyAI. Khi tư vấn, AI sẽ trích dẫn và gợi ý trực tiếp các sản phẩm đang có bán trên web kèm giá và link sản phẩm.
- **FR-AI-04 (Cá nhân hóa theo Digital Skin ID):** Hệ thống tự động đính kèm thông tin hồ sơ da và Allergy Blacklist của người dùng vào context của phiên chat. AI tự động nhắc nhở né các chất dị ứng khi trò chuyện.
- **FR-AI-05 (Prompt Safety Guardrails):**
  - Đóng vai trò chuyên gia tư vấn chăm sóc sắc đẹp khoa học.
  - **Quy tắc an toàn y khoa:** Tuyệt đối không chẩn đoán bệnh lý da liễu nặng (viêm da tiếp xúc cấp tính, vảy nến, chàm lở loét). Khi phát hiện các dấu hiệu nhiễm trùng/bệnh lý, AI phải khuyên khách hàng đến bệnh viện da liễu thăm khám chuyên khoa.
  - Ngăn chặn câu hỏi ngoài luồng (chính trị, lập trình, nội dung phản cảm).

---

### M11: Đánh giá & Cộng đồng theo da (Khai thác 1M Review Dataset)
- **FR-REV-01 (Hiển thị đánh giá trên PDP):** Điểm đánh giá trung bình (1.0 đến 5.0 sao), tổng số lượt đánh giá, biểu đồ cột phân bổ tỷ lệ các mức sao (5 sao, 4 sao, 3 sao, 2 sao, 1 sao).
- **FR-REV-02 (Lọc review theo Loại da của người đánh giá - USP):**
  - Khai thác tập dữ liệu 1 triệu review mỹ phẩm thực tế: Mỗi review gắn liền với thuộc tính `skin_type` của người đánh giá.
  - Bộ lọc cho phép khách hàng chọn: *"Chỉ hiển thị đánh giá từ người có Da dầu"* hoặc *"Da nhạy cảm"*.
- **FR-REV-03 (Ưu tiên review có làn da tương đồng):** Nếu người dùng đã đăng nhập và có Skin ID, hệ thống tự động đẩy các review có cùng loại da lên đầu danh sách để nâng cao giá trị tham khảo.
- **FR-REV-04 (Viết đánh giá cho sản phẩm đã mua):** Form gửi đánh giá gồm chọn số sao, viết nhận xét và chọn loại da của mình lúc đánh giá.

---

### M12: Quản trị sàn tinh gọn (Admin Dashboard)
- **FR-ADM-01 (Dashboard KPI tổng quan):** 4 thẻ chỉ số quan trọng nhất: Tổng sản phẩm đang bán, Tổng đơn hàng phát sinh, Tổng doanh thu lũy kế (VND), Tổng số tài khoản khách hàng.
- **FR-ADM-02 (Quản lý sản phẩm - Product CRUD):**
  - Xem danh sách sản phẩm dạng bảng phân trang, tìm kiếm sản phẩm.
  - Thêm mới / Chỉnh sửa sản phẩm: Tên, slug, thương hiệu, danh mục, giá bán VND, dung tích, hình ảnh URL, mô tả, và ô nhập chuỗi thành phần INCI (tự động phân tích khi lưu).
  - Bật/Tắt trạng thái kinh doanh (`is_active`).
- **FR-ADM-03 (Quản lý đơn hàng):**
  - Xem danh sách đơn hàng mới nhất, xem chi tiết sản phẩm trong đơn, địa chỉ giao hàng và số điện thoại người nhận.
  - Cập nhật trạng thái đơn hàng theo luồng: `PENDING` (Chờ xử lý) -> `SHIPPING` (Đang giao) -> `DELIVERED` (Đã giao) hoặc `CANCELLED` (Hủy đơn).
- **FR-ADM-04 (Quản lý danh mục & thương hiệu):** Danh sách và thêm/sửa danh mục sản phẩm cấp 1, cấp 2 và thương hiệu mỹ phẩm.

---

## 4. BẢNG MA TRẬN TRUY XUẤT YÊU CẦU PHASE 1 (TRACEABILITY MATRIX)

| Module | Mã FR | Tên chức năng | Độ ưu tiên MVP | Kiểm thử nghiệm thu |
|---|---|---|---|---|
| M01 | `FR-AUTH-01..06` | Auth JWT, RBAC & Profile | **P0 (Bắt buộc)** | Đăng ký, đăng nhập thành công, bảo vệ route admin |
| M02 | `FR-SKIN-01..03` | Digital Skin ID & Allergy Blacklist | **P0 (Bắt buộc)** | Chọn da, thêm chất dị ứng, hiện cờ đỏ PDP/Cart |
| M03 | `FR-CAT-01..04` | Catalog, Search, Filter "An toàn cho da" | **P0 (Bắt buộc)** | Tìm theo tên/hoạt chất, bật switch loại bỏ đồ dị ứng |
| M04 | `FR-PDP-01..06` | PDP, Bảng INCI, Biểu đồ & Match Score | **P0 (Bắt buộc)** | Hiển thị INCI, tính Match Score 0-100%, cờ đỏ dị ứng |
| M05 | `FR-QUIZ-01..05` | Skin Quiz & Routine Builder (Chat-to-Cart) | **P0 (Bắt buộc)** | Quiz 4 câu -> sinh routine AM/PM -> nút bấm thêm cả bộ |
| M06 | `FR-INCI-01..04` | Công cụ dán & phân tích INCI tự do | **P1 (Quan trọng)** | Dán chuỗi INCI -> bóc tách nhãn xanh/vàng/đỏ |
| M07 | `FR-CONF-01..04` | Smart Conflict Detector trong giỏ hàng | **P0 (Bắt buộc)** | Thêm Retinol + BHA vào giỏ -> hộp cảnh báo kỵ nhau |
| M08 | `FR-COMP-01..03` | So sánh sản phẩm (Compare) & Wishlist | **P1 (Quan trọng)** | Chọn 3 món so sánh side-by-side, thêm/bỏ wishlist |
| M09 | `FR-CART-01..03` | Giỏ hàng, Checkout COD & Lịch sử đơn | **P0 (Bắt buộc)** | Thay đổi giỏ hàng, điền form checkout COD, tạo đơn |
| M10 | `FR-AI-01..05` | Trợ lý AI Gemini Skincare Assistant | **P0 (Bắt buộc)** | Chat AI trả lời chuẩn, gợi ý đồ sàn, né chất dị ứng |
| M11 | `FR-REV-01..04` | Khai thác 1M Review lọc theo Loại da | **P1 (Quan trọng)** | Lọc review theo da dầu/khô, ưu tiên review cùng da |
| M12 | `FR-ADM-01..04` | Admin Dashboard tinh gọn (Product & Order) | **P1 (Quan trọng)** | CRUD sản phẩm, chuyển trạng thái đơn hàng |

---

## 5. ĐIỀU KIỆN HOÀN THÀNH PHASE 1 (DEFINITION OF DONE - MVP)
Hệ thống Phase 1 được nghiệm thu đạt chuẩn khi thỏa mãn các điều kiện sau:
1. **Toàn bộ 12 Module chức năng ở trên hoạt động thông suốt từ Backend C# (.NET 10) đến Frontend React 19.**
2. **Kịch bản Demo "Happy Path" chạy mượt mà trong 15 phút:**
   - Khách đăng ký tài khoản -> Thiết lập Skin ID da dầu mụn + Dị ứng Alcohol.
   - Tìm kiếm "Sữa rửa mặt" -> Bật "An toàn cho da tôi" -> Danh sách tự loại bỏ sản phẩm chứa cồn.
   - Bấm vào PDP -> Xem bảng INCI phân tích công năng -> Thấy cờ đỏ nếu cố tình chọn sản phẩm có cồn.
   - Làm Skin Quiz -> Nhận Routine AM/PM -> Bấm "Chat-to-Cart" đưa cả bộ vào giỏ.
   - Vào Giỏ hàng -> Thử thêm 1 sản phẩm Retinol và 1 sản phẩm BHA -> Thấy Smart Conflict Detector cảnh báo kỵ nhau và hướng dẫn chia buổi.
   - Tiến hành Checkout COD -> Nhận mã đơn hàng thành công.
   - Mở Chatbot Gemini AI -> Hỏi "Da tôi nhiều mụn ẩn nên dùng gì?" -> AI trả lời thông minh và gợi ý sản phẩm của sàn.
   - Đăng nhập Admin -> Xem đơn hàng vừa đặt, duyệt chuyển sang `SHIPPING`, sửa nhanh 1 sản phẩm.
3. **Độ ổn định:** Không có lỗi crash ứng dụng (HTTP 500 không kiểm soát); giao diện hiển thị đẹp, rõ ràng trên trình duyệt Chrome/Safari.
