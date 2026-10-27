---
doc: prd-phase-1
title: Product Requirements Document (PRD) — BeautyAI Phase 1 (MVP Launch)
status: stable
precedence: 3
owner: BA / Product Owner
last_reviewed: 2026-10-26
---

# PRODUCT REQUIREMENTS DOCUMENT (PRD) — BEAUTYAI PHASE 1 (MVP)

> **Mục tiêu:** Bản đặc tả yêu cầu sản phẩm chi tiết toàn diện (Full Comprehensive PRD) cho **Phase 1 MVP (30 ngày)**, phục vụ triển khai thực chiến cho **Solo Developer** kết hợp AI Coding Agent, đảm bảo hệ thống vận hành trơn tru ở cấp độ Production và bảo vệ đồ án tốt nghiệp xuất sắc.
> **Phạm vi tài liệu:** Bao quát toàn bộ 14 module nghiệp vụ cốt lõi, từng User Story, điều kiện chấp nhận (Acceptance Criteria theo định dạng Given/When/Then), trạng thái giao diện và các quy tắc nghiệp vụ bất biến.

---

# 1. TỔNG QUAN SẢN PHẨM & TẦM NHÌN CHIẾN LƯỢC

## 1.1. Bối cảnh & Vấn đề thị trường (Problem Statement)
Thị trường thương mại điện tử mỹ phẩm hiện nay đang tồn tại sự bất đối xứng thông tin nghiêm trọng:
1. **Thiếu hiểu biết về thành phần khoa học:** Khách hàng chủ yếu mua hàng theo quảng cáo hoặc người nổi tiếng (KOLs), không nắm được bảng thành phần hóa học (INCI) của sản phẩm có phù hợp với cơ địa của mình hay không.
2. **Nguy cơ dị ứng và bùng phát kích ứng:** Người có làn da nhạy cảm hoặc có tiền sử dị ứng với một số hoạt chất (ví dụ: cồn khô, hương liệu, paraben, sulfate) gặp nhiều khó khăn khi phải tự đọc và kiểm tra thủ công bảng thành phần in bằng chữ li ti trên bao bì.
3. **Xung đột hoạt chất nguy hại (Ingredient Conflicts):** Người tiêu dùng theo đuổi xu hướng dưỡng da khoa học (Treatment) thường tự ý kết hợp nhiều sản phẩm đặc trị mạnh (Retinol, BHA, AHA, Vitamin C, Benzoyl Peroxide) trong cùng một chu trình dẫn đến kích ứng, bỏng rát, làm tổn thương hàng rào bảo vệ da.
4. **Đánh giá thiếu tính cá nhân hóa:** Các hệ thống đánh giá sản phẩm hiện nay chỉ hiển thị sao chung chung, không cho biết người viết đánh giá có loại da tương đồng với người đọc hay không, dẫn đến việc sản phẩm được khen bởi người da khô nhưng lại gây bít tắc cho người da dầu.

## 1.2. Giải pháp của BeautyAI Phase 1 (Value Proposition)
BeautyAI là nền tảng thương mại điện tử mỹ phẩm kết hợp **Hệ sinh thái Trí tuệ Da liễu Thông minh**:
- **Định danh hồ sơ da số (Digital Skin ID):** Lưu trữ chính xác loại da, vấn đề da và **Allergy Blacklist** (danh sách đen các chất dị ứng của từng cá nhân).
- **Hệ thống cảnh báo dị ứng xuyên suốt (Allergy Cross-Alert):** Tự động phát hiện và cảnh báo viền đỏ trên mọi giao diện (Catalog, PDP, Giỏ hàng, AI Chatbot).
- **Phát hiện xung đột hoạt chất thông minh (Smart Conflict Detector):** Tự động quét giỏ hàng và chu trình routine, phát hiện các cặp hoạt chất kỵ nhau và đưa ra giải pháp chia lịch sử dụng luân phiên.
- **Khai thác dữ liệu lớn 1 triệu reviews:** Phân loại và ưu tiên hiển thị các đánh giá từ những người dùng có cùng loại da.
- **Trợ lý AI Gemini:** Tư vấn chăm sóc da dựa trên hồ sơ da cá nhân hóa và grounding sản phẩm thực tế của sàn.

---

# 2. CHÂN DUNG NGƯỜI DÙNG & VAI TRÒ HỆ THỐNG (ACTORS)

| Vai trò (Actor) | Mã vai trò | Mô tả & Trách nhiệm chính |
|---|---|---|
| **Khách vãng lai** | `GUEST` | Khách chưa đăng nhập; có thể duyệt danh mục, tìm kiếm, xem chi tiết sản phẩm, sử dụng công cụ phân tích INCI tự do và thiết lập nhanh hồ sơ Digital Skin ID tạm thời. |
| **Khách hàng** | `CUSTOMER` | Người dùng đã đăng ký tài khoản; sở hữu Digital Skin ID, quản lý Allergy Blacklist, nhận cảnh báo dị ứng cá nhân hóa, quản lý giỏ hàng, đặt hàng COD và lưu chu trình Routine. |
| **Quản trị viên sàn** | `ADMIN` | Quản lý danh mục, thương hiệu, CRUD sản phẩm & nhập liệu bảng thành phần INCI, cập nhật trạng thái đơn hàng và theo dõi chỉ số KPI kinh doanh. |

---

# 3. MA TRẬN PHẠM VI (IN-SCOPE PHASE 1 VS OUT-OF-SCOPE PHASE 2)

| Module / Tính năng | Phạm vi Phase 1 (MVP — 30 Ngày) | Phạm vi Phase 2 (Mở rộng — 6 Tháng) |
|---|---|---|
| **Ngôn ngữ & Tiền tệ** | **English & USD ($)** nguyên bản theo Sephora US dataset (8.495 SP, 1.09M Reviews). | Bản địa hóa Tiếng Việt (i18n), Chuyển đổi song tệ (VND/USD). |
| **Xác thực & Tài khoản** | Đăng ký, Đăng nhập Email/Password chuẩn, JWT an toàn, Đổi mật khẩu, Cập nhật Profile. | Đăng nhập Google/Facebook OAuth, Quên mật khẩu qua email token SMTP. |
| **Hồ sơ da & Dị ứng** | Digital Skin ID (Loại da, nhạy cảm, 5 vấn đề da), Allergy Blacklist cá nhân hóa, Cảnh báo dị ứng đỏ. | Lịch sử biến đổi da theo thời gian, Đánh giá mức độ nhạy cảm qua camera phân tích ảnh. |
| **Danh mục & Tìm kiếm** | Danh mục 2 cấp, Tìm kiếm từ khóa/hoạt chất, Lọc loại da/giá, Sắp xếp, Công tắc *"An toàn cho da tôi"*. | Lọc theo chứng nhận Vegan/Cruelty-Free, Tìm kiếm bằng giọng nói / hình ảnh. |
| **Trang chi tiết (PDP)** | Bảng INCI phân màu, Match Score %, Biểu đồ công năng, Cảnh báo dị ứng đỏ, Lọc 1M reviews theo loại da. | Modal phân tích trọng số thuật toán chi tiết, Gợi ý sản phẩm mua kèm bằng thuật toán Apriori. |
| **Phân tích INCI** | Dán bảng thành phần thô bất kỳ, bóc tách dấu phẩy, tra cứu từ điển CSDL, đối chiếu dị ứng. | Chụp ảnh bao bì OCR tự động nhận diện chữ, Bách khoa toàn thư thành phần Wikipedia. |
| **Xung đột hoạt chất** | Quét giỏ hàng tự động, phát hiện 12 cặp kỵ nhau, cảnh báo viền cam kèm hướng dẫn chia lịch Sáng/Tối. | Admin UI tự tạo quy tắc xung đột mới, Quét sản phẩm khách đang dùng ở nhà. |
| **Digital Skin ID & Routine** | Thiết lập Hồ sơ Digital Skin ID 1 chạm (Loại da ➔ Dị ứng ➔ Vấn đề & Mục tiêu), Tự động sinh Routine AM/PM, Nút **Chat-to-Cart** thêm cả bộ vào giỏ. | **Skin Quiz trắc nghiệm chẩn đoán loại da nâng cao**, Xuất Routine ra file PDF, Chia sẻ chu trình lên mạng xã hội. |
| **So sánh & Wishlist** | Khay so sánh Drawer, Bảng so sánh 2-4 sản phẩm (thông số, hoạt chất, Match Score), Quản lý Wishlist. | Tự động gợi ý sản phẩm đối trọng để so sánh, Thông báo đẩy khi Wishlist giảm giá. |
| **Giỏ hàng & Đơn hàng** | Quản lý giỏ hàng, Áp dụng voucher cơ bản (`BEAUTYAI10`, `FREESHIP`), Checkout COD, Lịch sử đơn hàng. | Cart drawer trượt ngang, Voucher đa tầng (sàn + shop), Khách tự hủy đơn / Mua lại đơn cũ. |
| **Trợ lý AI** | Gemini API Flash, Grounding sản phẩm sàn, Cá nhân hóa Skin ID, Guardrail an toàn y tế. | Chuyển giao hội thoại sang Zalo OA tư vấn viên, Lưu trữ và phân tích tâm lý khách hàng nhiều phiên. |
| **Đánh giá cộng đồng** | Danh sách reviews từ dataset 1M, Tab lọc theo loại da (Da dầu, Da khô...), Gửi đánh giá mới. | Bình chọn đánh giá hữu ích (Upvote), Kiểm duyệt tự động bằng mô hình AI NLP. |
| **Quản trị Admin** | Dashboard thẻ KPI (Doanh thu, Đơn hàng, SP), CRUD Sản phẩm & INCI, Đổi trạng thái đơn COD. | Xuất báo cáo Excel, Cấu hình tỷ giá đa tiền tệ, Nhật ký kiểm toán thao tác hệ thống (Audit log). |

---

# 4. ĐẶC TẢ CHI TIẾT YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

---

## 4.1. Module 01 — Tài Khoản & Xác Thực (M01: Authentication & Access Control)

### FR-AUTH-01 [Must-Have] Đăng ký tài khoản người dùng
- **Mô tả:** Với vai trò `GUEST`, tôi muốn tạo tài khoản mới bằng email, mật khẩu và họ tên để sử dụng các tiện ích lưu trữ hồ sơ da và mua sắm.
- **Tiền điều kiện:** Chưa đăng nhập vào hệ thống.
- **Quy tắc nghiệp vụ:** `BR-AUTH-01`, `BR-AUTH-02`.
- **Điều kiện chấp nhận (Acceptance Criteria):**
  - `AC-01.1` **Given** tôi nhập email hợp lệ chưa từng tồn tại, mật khẩu hợp lệ (≥ 8 ký tự, có ít nhất 1 chữ số) và họ tên, **When** tôi bấm *"Đăng ký"*, **Then** tài khoản được tạo thành công với vai trò `CUSTOMER` và hệ thống tự động đăng nhập đưa tôi về trang trước đó.
  - `AC-01.2` **Given** tôi nhập email đã tồn tại trong CSDL (không phân biệt chữ hoa/thường), **When** tôi bấm gửi biểu mẫu, **Then** hệ thống từ chối và hiển thị thông báo lỗi rõ ràng: *"Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác."*
  - `AC-01.3` **Given** mật khẩu dưới 8 ký tự hoặc không có chữ số, **When** tôi rời khỏi ô nhập hoặc bấm đăng ký, **Then** hệ thống hiển thị thông báo lỗi ngay dưới trường mật khẩu: *"Mật khẩu phải có tối thiểu 8 ký tự và chứa ít nhất một chữ số."*
  - `AC-01.4` **Given** tài khoản được tạo thành công, **When** kiểm tra CSDL, **Then** mật khẩu phải được băm an toàn bằng thuật toán PBKDF2 (600,000 rounds) kèm muối (salt), tuyệt đối không lưu văn bản thuần.

### FR-AUTH-02 [Must-Have] Đăng nhập hệ thống
- **Mô tả:** Với vai trò người dùng đã có tài khoản, tôi muốn đăng nhập bằng email và mật khẩu để truy cập dữ liệu cá nhân.
- **Quy tắc nghiệp vụ:** `BR-AUTH-03`, `BR-SEC-01`.
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** email và mật khẩu chính xác, **When** tôi bấm *"Đăng nhập"*, **Then** hệ thống cấp phiên làm việc (JWT Token lưu trong cookie an toàn hoặc LocalStorage), Navbar chuyển sang hiển thị tên và avatar của tôi.
  - `AC-02.2` **Given** mật khẩu không chính xác hoặc email không tồn tại, **When** tôi bấm đăng nhập, **Then** hệ thống hiển thị thông báo chung: *"Email hoặc mật khẩu không chính xác."* (Không được tiết lộ email có tồn tại trong hệ thống hay không để chống brute-force enumeration).
  - `AC-02.3` **Given** tài khoản có vai trò `ADMIN`, **When** đăng nhập thành công, **Then** trên thanh điều hướng xuất hiện nút liên kết truy cập *"Quản trị hệ thống (Admin Console)"*; tài khoản `CUSTOMER` tuyệt đối không nhìn thấy nút này.

### FR-AUTH-03 [Must-Have] Đăng xuất tài khoản
- **Điều kiện chấp nhận:**
  - `AC-03.1` **Given** tôi đang trong trạng thái đăng nhập, **When** tôi bấm *"Đăng xuất"*, **Then** token phiên làm việc bị xóa bỏ, giỏ hàng trên server vẫn được bảo lưu cho lần đăng nhập sau, và giao diện quay trở lại trạng thái `GUEST`.

### FR-AUTH-04 [Should-Have] Đổi mật khẩu
- **Điều kiện chấp nhận:**
  - `AC-04.1` **Given** tôi đã đăng nhập và nhập đúng mật khẩu hiện tại cùng mật khẩu mới hợp lệ, **When** tôi bấm *"Cập nhật mật khẩu"*, **Then** mật khẩu mới được băm và lưu vào CSDL, hệ thống thông báo đổi thành công.
  - `AC-04.2` **Given** tôi nhập sai mật khẩu hiện tại, **When** tôi bấm cập nhật, **Then** hệ thống từ chối và giữ nguyên mật khẩu cũ.

### FR-AUTH-05 [Must-Have] Xem và cập nhật thông tin cá nhân (Profile)
- **Điều kiện chấp nhận:**
  - `AC-05.1` **Given** tôi đã đăng nhập và mở trang `/profile`, **When** trang tải xong, **Then** tôi xem được họ tên, email, số điện thoại, địa chỉ nhận hàng mặc định và khối tóm tắt hồ sơ da Digital Skin ID.
  - `AC-05.2` **Given** tôi chỉnh sửa họ tên, SĐT hoặc địa chỉ, **When** bấm *"Lưu thay đổi"*, **Then** thông tin được cập nhật vào CSDL và áp dụng tự động cho các lần thanh toán tiếp theo. Trường email là định danh duy nhất nên bị vô hiệu hóa (disabled) không cho phép chỉnh sửa.

### FR-AUTH-06 [Must-Have] Phân quyền và bảo vệ tài nguyên (RBAC Middleware)
- **Điều kiện chấp nhận:**
  - `AC-06.1` **Given** tôi là khách vãng lai `GUEST`, **When** tôi cố tình gõ URL `/admin`, `/profile` hoặc `/checkout`, **Then** hệ thống lập tức chặn lại và mở Modal đăng nhập yêu cầu xác thực.
  - `AC-06.2` **Given** tôi là người dùng `CUSTOMER`, **When** tôi cố tình gọi trực tiếp API Admin (ví dụ: `POST /api/v1/admin/products`), **Then** máy chủ backend trả về mã lỗi `403 Forbidden` và không thực hiện yêu cầu.

---

## 4.2. Module 02 — Danh Mục, Tìm Kiếm & Bộ Lọc Thông Minh (M02: Catalog & Smart Filter)

### FR-CAT-01 [Must-Have] Duyệt danh mục sản phẩm phân trang
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** tôi mở trang danh mục `/products`, **When** trang tải xong, **Then** hệ thống hiển thị lưới sản phẩm phân trang (mặc định 16 hoặc 24 sản phẩm/trang). Mỗi thẻ sản phẩm hiển thị: Ảnh đại diện, Tên thương hiệu, Tên sản phẩm, Giá bán niêm yết (USD $), Điểm đánh giá sao trung bình, Nút thả tim yêu thích và Nút thêm vào giỏ.
  - `AC-01.2` **Given** tôi bấm chuyển sang trang 2 hoặc đổi số lượng hiển thị, **When** danh sách tải mới, **Then** toàn bộ các bộ lọc đang chọn (loại da, khoảng giá) và từ khóa tìm kiếm vẫn được giữ nguyên vẹn trên URL.

### FR-CAT-02 [Must-Have] Tìm kiếm sản phẩm đa năng
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** tôi nhập từ khóa vào ô tìm kiếm, **When** tôi nhấn Enter, **Then** hệ thống trả về các sản phẩm có tên sản phẩm, tên thương hiệu hoặc chứa hoạt chất tương ứng trong bảng thành phần.
  - `AC-02.2` **Given** từ khóa tìm kiếm là tiếng Việt có dấu hoặc không dấu (ví dụ: *"duong am"* hoặc *"dưỡng ẩm"*), **When** tìm kiếm, **Then** hệ thống xử lý trả về kết quả đồng nhất không phân biệt dấu.
  - `AC-02.3` **Given** không tìm thấy sản phẩm nào khớp với từ khóa, **When** màn hình hiển thị, **Then** xuất hiện giao diện rỗng thân thiện (Empty State) gợi ý người dùng bỏ bớt bộ lọc hoặc xem danh sách các sản phẩm bán chạy nhất.

### FR-CAT-03 [Must-Have] Lọc theo Loại da & Khoảng giá
- **Điều kiện chấp nhận:**
  - `AC-03.1` **Given** thanh công cụ lọc bên trái, **When** tôi chọn Loại da (`Da dầu`, `Da khô`, `Da hỗn hợp`, `Da nhạy cảm`), **Then** danh sách sản phẩm lập tức làm mới chỉ hiển thị các sản phẩm được dán nhãn tương thích với loại da đó.
  - `AC-03.2` **Given** thanh trượt giá (Price Slider), **When** tôi kéo chọn khoảng giá từ 200.000₫ đến 500.000₫, **Then** các sản phẩm ngoài khoảng giá này sẽ bị ẩn đi.

### FR-CAT-04 [Must-Have] Sắp xếp sản phẩm
- **Điều kiện chấp nhận:**
  - `AC-04.1` **Given** dropdown sắp xếp, **When** tôi chọn *"Giá: Thấp đến cao"*, *"Giá: Cao đến thấp"*, *"Đánh giá cao nhất"*, **Then** danh sách sản phẩm được tái sắp xếp chính xác theo tiêu chí tương ứng.

### FR-CAT-05 [Must-Have] Quản lý Chip bộ lọc
- **Điều kiện chấp nhận:**
  - `AC-05.1` **Given** tôi đang áp dụng 3 điều kiện lọc (Da dầu, Dưới 500k, Thương hiệu Paula's Choice), **When** danh sách hiển thị, **Then** phía trên lưới sản phẩm xuất hiện 3 thẻ Chip tương ứng. Bấm icon `x` trên từng chip sẽ xóa điều kiện đó; bấm *"Xóa tất cả"* sẽ reset toàn bộ bộ lọc về mặc định.

### FR-CAT-06 [Must-Have — USP] Bộ lọc độc quyền "An toàn cho da tôi" (Allergy Filter Toggle)
- **Mô tả:** Công tắc lọc cá nhân hóa tối thượng giúp loại bỏ hoàn toàn các sản phẩm chứa thành phần dị ứng của khách hàng.
- **Tiền điều kiện:** Người dùng đã đăng nhập và đã cấu hình ít nhất 1 chất trong `Allergy Blacklist`.
- **Điều kiện chấp nhận:**
  - `AC-06.1` **Given** tôi là khách vãng lai hoặc chưa có chất dị ứng nào trong Blacklist, **When** tôi xem trang Catalog, **Then** công tắc *"An toàn cho da tôi"* bị làm mờ (disabled) kèm tooltip giải thích: *"Vui lòng đăng nhập và thiết lập danh sách dị ứng trong Skin ID để dùng tính năng này."*
  - `AC-06.2` **Given** tôi đã đăng nhập và có dị ứng với `Alcohol Denat` (Cồn khô), **When** tôi bật công tắc *"An toàn cho da tôi"*, **Then** hệ thống ngay lập tức lọc bỏ toàn bộ sản phẩm có chứa `Alcohol Denat` ra khỏi danh sách hiển thị, đảm bảo 100% sản phẩm còn lại an toàn tuyệt đối với tôi.

---

## 4.3. Module 03 — Trang Chi Tiết Sản Phẩm & Phân Tích INCI (M03: PDP & INCI Intelligence)

### FR-PDP-01 [Must-Have] Hiển thị thông tin tổng quan sản phẩm
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** tôi mở trang `/products/{slug}`, **When** trang tải xong, **Then** hiển thị đầy đủ: Ảnh sản phẩm chất lượng cao (có chức năng zoom/xem ảnh phóng to), Tên thương hiệu, Tên sản phẩm, Dung tích (ml/g), Giá bán chuẩn USD ($), Tình trạng còn hàng/hết hàng, Nút số lượng và Nút *"Thêm vào giỏ hàng"*.

### FR-PDP-02 [Must-Have] Bảng thành phần INCI chuẩn hóa có nhãn tiếng Việt
- **Mô tả:** Toàn bộ bảng thành phần hóa học được bóc tách và giải nghĩa khoa học rõ ràng.
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** sản phẩm có bảng thành phần in trên vỏ hộp, **When** xem mục Bảng thành phần, **Then** các thành phần được liệt kê chính xác theo thứ tự nồng độ giảm dần (theo chuẩn công bố mỹ phẩm quốc tế).
  - `AC-02.2` **Given** mỗi thành phần trong danh sách, **When** hiển thị, **Then** đi kèm nhãn tiếng Việt giải nghĩa công dụng chính (ví dụ: *Glycerin - Dưỡng ẩm sâu*, *Niacinamide - Làm sáng da & Thu nhỏ lỗ chân lông*, *Salicylic Acid - Tẩy tế bào chết & Trị mụn*).
  - `AC-02.3` **Given** thành phần được phân loại theo màu sắc an toàn:
    - 🟢 **Màu xanh lá:** Thành phần lành tính, dưỡng ẩm, phục hồi, làm dịu da.
    - 🟡 **Màu vàng / cam:** Hoạt chất điều trị nồng độ cao (Treatment) cần lưu ý cách dùng.
    - 🔴 **Màu đỏ:** Thành phần có nguy cơ gây kích ứng cao, hương liệu, cồn khô.

### FR-PDP-03 [Must-Have — USP] Điểm tương thích da (Suitability Match Score)
- **Quy tắc nghiệp vụ:** `BR-ALGO-01`, `ADR-011`.
- **Điều kiện chấp nhận:**
  - `AC-03.1` **Given** tôi đã đăng nhập và có Digital Skin ID (ví dụ: Da dầu, Có mụn), **When** xem trang PDP, **Then** hệ thống tính toán và hiển thị thanh đo **Match Score** theo phần trăm (ví dụ: *"92% Phù hợp với làn da của bạn"*).
  - `AC-03.2` **Given** tôi là khách vãng lai chưa có Skin ID, **When** xem trang PDP, **Then** vị trí Match Score hiển thị lời mời: *"Thiết lập Digital Skin ID ngay để xem độ phù hợp của sản phẩm với làn da bạn"*.

### FR-PDP-04 [Must-Have — USP] Banner đỏ cảnh báo dị ứng cá nhân trên PDP
- **Mô tả:** Cảnh báo nổi bật tức thì để bảo vệ người dùng không mua nhầm sản phẩm chứa chất mình dị ứng.
- **Điều kiện chấp nhận:**
  - `AC-04.1` **Given** sản phẩm chứa thành phần `Paraben` và trong `Allergy Blacklist` của tôi có `Paraben`, **When** tôi truy cập trang chi tiết sản phẩm này, **Then** ngay phía trên nút Mua hàng xuất hiện một **Banner đỏ rực rỡ có icon nguy hiểm**:
    > *"⚠️ CẢNH BÁO DỊ ỨNG: Sản phẩm này chứa **Paraben**, hoạt chất nằm trong Danh sách dị ứng của bạn. Chúng tôi khuyến nghị không nên sử dụng."*
  - `AC-04.2` **Given** banner cảnh báo xuất hiện, **Then** có thêm một nút liên kết: *"Tìm sản phẩm thay thế an toàn"* trỏ sang danh mục các sản phẩm cùng công dụng nhưng không chứa Paraben.

### FR-PDP-05 [Must-Have] Biểu đồ phân bổ công năng thành phần
- **Điều kiện chấp nhận:**
  - `AC-05.1` **Given** bảng thành phần của sản phẩm, **When** trang PDP hiển thị, **Then** có biểu đồ phân bổ tỷ lệ công năng trực quan (ví dụ: 45% Dưỡng ẩm, 25% Chống oxy hóa, 15% Làm dịu, 15% Khác) giúp khách hàng hiểu ngay cấu trúc công thức sản phẩm.

### FR-PDP-06 [Must-Have] Hướng dẫn vị trí sử dụng trong chu trình (Routine Slot)
- **Điều kiện chấp nhận:**
  - `AC-06.1` **Given** sản phẩm là Kem chống nắng, **When** xem mục Hướng dẫn sử dụng, **Then** hệ thống hiển thị huy hiệu: *"Dùng buổi SÁNG (AM)"* và chỉ rõ vị trí: *"Bước cuối cùng trong chu trình dưỡng da buổi sáng, trước khi trang điểm"*.

### FR-PDP-07 [Must-Have] Thêm vào Wishlist & So sánh từ PDP
- **Điều kiện chấp nhận:**
  - `AC-07.1` **Given** trang PDP, **When** tôi bấm icon Trái tim, **Then** sản phẩm được lưu vào Wishlist; bấm nút *"So sánh"*, **Then** sản phẩm được đưa vào khay so sánh đáy màn hình.

---

## 4.4. Module 04 — Digital Skin ID & Quản Lý Dị Ứng (M04: Digital Skin ID & Allergy Blacklist) (Core USP)

### FR-SKIN-01 [Must-Have] Thiết lập và cập nhật hồ sơ da (Digital Skin ID)
- **Mô tả:** Cho phép người dùng số hóa các đặc tính sinh học của làn da mình.
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** tôi vào trang cá nhân `/profile` tab Hồ sơ da, **When** tôi thiết lập, **Then** tôi có thể chọn:
    1. Loại da chính (1 trong 4 loại): `Da dầu (Oily)`, `Da khô (Dry)`, `Da hỗn hợp (Combination)`, `Da thường (Normal)`.
    2. Độ nhạy cảm da: Công tắc bật/tắt `Da nhạy cảm (Sensitive Skin)`.
    3. Mối quan tâm về da (chọn tối đa 5): `Mụn ẩn / Mụn viêm`, `Thâm nám / Tàn nhang`, `Lỗ chân lông to`, `Lão hóa / Nếp nhăn`, `Khô ráp / Bong tróc`, `Đỏ rát / Dễ kích ứng`.
  - `AC-01.2` **Given** tôi bấm *"Lưu hồ sơ da"*, **Then** dữ liệu được cập nhật tức thời vào CSDL và áp dụng ngay lập tức cho các thuật toán tính Match Score và AI tư vấn.

### FR-SKIN-02 [Must-Have — USP] Quản lý danh sách đen dị ứng (Allergy Blacklist)
- **Mô tả:** Nơi người dùng ghi nhận tất cả các thành phần hóa học họ không thể sử dụng.
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** ô tìm kiếm hoạt chất dị ứng, **When** tôi gõ từ 2 ký tự (ví dụ: *"alc"* hoặc *"cồn"*), **Then** hệ thống hiển thị danh sách gợi ý tự động (auto-suggest) từ bảng từ điển `ingredients` (ví dụ: *Alcohol Denat, Benzyl Alcohol, Isopropyl Alcohol*).
  - `AC-02.2` **Given** tôi chọn một hoạt chất, **When** bấm *"Thêm vào danh sách dị ứng"*, **Then** hoạt chất xuất hiện dưới dạng một thẻ Chip màu đỏ có icon xóa.
  - `AC-02.3` **Given** tôi không còn dị ứng hoặc bấm nhầm, **When** bấm icon `x` trên thẻ chip, **Then** chất đó lập tức bị xóa khỏi `Allergy Blacklist` của tôi và CSDL được đồng bộ.

### FR-SKIN-03 [Must-Have] Cảnh báo dị ứng đồng bộ xuyên suốt hệ thống
- **Điều kiện chấp nhận:**
  - `AC-03.1` **Given** tài khoản của tôi có chất dị ứng $X$, **When** tôi duyệt web ở bất kỳ đâu (Thẻ sản phẩm ngoài Catalog, PDP, Giỏ hàng, Kết quả Routine hay Khung chat AI), **Then** bất kỳ sản phẩm nào chứa chất $X$ đều phải hiển thị biểu tượng/cảnh báo dị ứng rõ ràng, không bỏ sót bất kỳ vị trí nào.

---

## 4.5. Module 05 — Thiết Lập Hồ Sơ Digital Skin ID Thống Nhất & Routine Builder (Chat-to-Cart) (M05: Skin Profile & Routine) (Core USP)

### FR-SKIN-01 [Must-Have] Thiết lập hồ sơ Digital Skin ID trực tiếp 1 chạm (Direct Setup)
- **Mô tả:** Người dùng tự khai báo nhanh hồ sơ da của mình chỉ trong 30 giây theo luồng logic y khoa: Cơ địa ➔ Vùng cấm kỵ an toàn (Dị ứng) ➔ Nhu cầu cải thiện.
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** tôi vào trang thiết lập hồ sơ da `/skin-profile`, **When** màn hình hiển thị, **Then** hiển thị form 1 trang duy nhất với đúng 3 bước theo thứ tự y khoa:
    - **Bước 1 (Cơ địa nền tảng — Loại da):** 5 thẻ lựa chọn trực quan: `Oily` (Da dầu), `Dry` (Da khô), `Combination` (Hỗn hợp), `Normal` (Da thường), `Sensitive` (Da nhạy cảm).
    - **Bước 2 (Vùng cấm kỵ an toàn — Blacklist Dị ứng):** Khung quản lý hoạt chất dị ứng cá nhân, cho phép nhập tên hoặc chọn nhanh các chất kích ứng phổ biến (`Alcohol Denat` / Cồn khô, `Fragrance/Parfum` / Hương liệu, `Paraben`, `BHA`, `Sulfate`...) kèm ô ghi chú triệu chứng (VD: *"gây mẩn đỏ châm chích"*).
    - **Bước 3 (Nhu cầu cải thiện — Vấn đề da & Mục tiêu):** Chọn các vấn đề da ưu tiên (`Acne`, `Aging`, `DarkSpots`, `Pores`, `Sensitivity`, `Dehydration`), Mục tiêu chăm sóc (`Primary Goal`: Giảm mụn, Chống lão hóa, Cấp ẩm...) và Mức ngân sách dự kiến (`Low`: < 500k, `Medium`: 500k-1.5tr, `High`: > 1.5tr).
  - `AC-01.2` **Given** tôi bấm *"Lưu hồ sơ Digital Skin ID"*, **Then** toàn bộ dữ liệu (Loại da, Blacklist dị ứng, Vấn đề da, Mục tiêu) được lưu đồng thời vào CSDL trong một transaction duy nhất, và hệ thống tự động cập nhật lại Match Score % của toàn bộ sản phẩm trên sàn.

### FR-ROUTINE-02 [Must-Have] Tự động sinh chu trình Routine chuẩn AM/PM
- **Quy tắc nghiệp vụ:** Bắt buộc có Kem chống nắng vào buổi sáng (`BR-ROUTINE-01`).
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** hồ sơ Digital Skin ID đã lưu, **When** màn hình gợi ý Routine hiển thị, **Then** chia làm 2 tab rõ ràng:
    - **Chu trình Buổi Sáng (AM Routine):** 1. Sữa rửa mặt dịu nhẹ ➔ 2. Serum/Dưỡng ẩm ➔ **3. Kem chống nắng phổ rộng (BẮT BUỘC)**.
    - **Chu trình Buổi Tối (PM Routine):** 1. Nước tẩy trang ➔ 2. Sữa rửa mặt ➔ 3. Serum đặc trị vấn đề da ➔ 4. Kem dưỡng khóa ẩm phục hồi.
  - `AC-02.2` **Given** các sản phẩm được thuật toán đề xuất trong Routine, **Then** 100% sản phẩm này phải:
    1. Tuyệt đối không chứa chất nằm trong Allergy Blacklist của người dùng.
    2. Không xung đột hoạt chất với nhau giữa các bước trong cùng một buổi.
    3. Nằm trong khoảng ngân sách mà người dùng đã chọn ở Bước 3.

### FR-ROUTINE-03 [Must-Have — USP] Tính năng "Chat-to-Cart" (Thêm trọn bộ Routine vào giỏ)
- **Mô tả:** Tính năng chuyển đổi mua sắm tức thì chỉ với một cú nhấp chuột.
- **Điều kiện chấp nhận:**
  - `AC-03.1` **Given** màn hình kết quả Routine đang hiển thị danh sách sản phẩm gợi ý, **When** tôi bấm nút lớn: *"🛒 Thêm toàn bộ chu trình vào giỏ hàng"*, **Then** toàn bộ các sản phẩm lập tức được thêm vào giỏ hàng cùng một lúc, hệ thống hiện thông báo thành công và chuyển hướng đến giỏ hàng để kiểm tra.

### FR-ROUTINE-04 [Should-Have] Lưu chu trình vào hồ sơ cá nhân
- **Điều kiện chấp nhận:**
  - `AC-04.1` **Given** chu trình Routine được gợi ý, **When** tôi bấm *"Lưu chu trình này"*, **Then** chu trình được lưu vào CSDL bảng `saved_routines` để tôi có thể xem lại bất kỳ lúc nào trong trang cá nhân mà không cần thiết lập lại.

---

## 4.6. Module 06 — Công Cụ Phân Tích Thành Phần Tự Do (M06: INCI Analyzer Tool)

### FR-INCI-01 [Must-Have] Nhập và dán danh sách thành phần bất kỳ
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** tôi vào trang `/ingredient-analyzer`, **When** tôi copy-paste toàn bộ đoạn văn bản thành phần in trên bao bì của một sản phẩm bất kỳ ngoài thị trường vào khung Textarea và bấm *"Phân tích ngay"*, **Then** hệ thống tự động bóc tách các chất theo dấu phẩy, loại bỏ khoảng trắng thừa và tra cứu đối chiếu với CSDL từ điển INCI.

### FR-INCI-02 [Must-Have] Kết quả phân tích độ an toàn & bít tắc lỗ chân lông
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** danh sách thành phần đã bóc tách, **When** màn hình kết quả hiển thị, **Then** liệt kê chi tiết từng hoạt chất kèm nhãn phân loại màu (Xanh/Vàng/Đỏ), công năng tóm tắt, chỉ số kích ứng (0-5) và chỉ số gây bít tắc lỗ chân lông sinh mụn (Comedogenic Rating 0-5).

### FR-INCI-03 [Must-Have — USP] Đối chiếu tự động với Allergy Blacklist
- **Điều kiện chấp nhận:**
  - `AC-03.1` **Given** tôi dán một bảng thành phần có chứa chất `Fragrance` mà tôi đang bị dị ứng, **When** phân tích xong, **Then** hệ thống hiển thị cảnh báo đỏ trên đầu trang:
    > *"Cảnh báo: Bảng thành phần này có chứa **Fragrance**, hoạt chất nằm trong danh sách dị ứng của bạn!"*

---

## 4.7. Module 07 — Phát Hiện Xung Đột Hoạt Chất (M07: Smart Conflict Detector) (Core USP)

### FR-CONF-01 [Must-Have — USP] Tự động quét và phát hiện xung đột trong Giỏ hàng
- **Mô tả:** Tính năng độc quyền ngăn chặn khách hàng kết hợp các hoạt chất triệt tiêu hoặc gây bỏng rát da.
- **Tiền điều kiện:** Giỏ hàng có từ 2 sản phẩm trở lên.
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** trong giỏ hàng của tôi đồng thời có:
    - Sản phẩm 1: Chứa `Retinol` (hoặc phái sinh Retinoid).
    - Sản phẩm 2: Chứa `Salicylic Acid` (BHA) hoặc `Glycolic Acid` (AHA).
  - **When** tôi mở trang giỏ hàng `/cart`, **Then** hệ thống tự động quét và kích hoạt **Khối cảnh báo xung đột viền cam nổi bật** ngay trên đầu danh sách sản phẩm.
  - `AC-01.2` **Given** cảnh báo xung đột xuất hiện, **Then** nội dung cảnh báo nêu rõ:
    1. **Tên 2 sản phẩm và 2 hoạt chất xung đột:** *"Sản phẩm [A] chứa Retinol và Sản phẩm [B] chứa Salicylic Acid (BHA)"*.
    2. **Giải thích nguyên lý y khoa:** *"Việc sử dụng đồng thời Retinol và BHA trong cùng một thời điểm có thể làm tổn thương nghiêm trọng hàng rào bảo vệ da, gây bong tróc, đỏ rát và kích ứng mạnh."*
    3. **Phương án chia lịch sử dụng an toàn:** *"Khuyên dùng: Bạn không nên thoa cùng lúc. Hãy dùng BHA vào buổi tối thứ 2-4-6, và dùng Retinol vào buổi tối thứ 3-5-7; hoặc thoa cách nhau ít nhất 30 phút."*

### FR-CONF-02 [Must-Have] Không chặn quyền mua hàng của người dùng
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** giỏ hàng có cảnh báo xung đột, **When** khách hàng vẫn muốn mua cả 2 sản phẩm để dùng luân phiên, **Then** hệ thống cung cấp checkbox xác nhận: *"☑ Tôi đã đọc và hiểu rõ khuyến cáo sử dụng luân phiên các hoạt chất này"*.
  - `AC-02.2` **Given** khách hàng đã tick chọn xác nhận, **When** bấm *"Tiến hành thanh toán"*, **Then** hệ thống cho phép tiếp tục chuyển sang bước Checkout bình thường.

---

## 4.8. Module 08 — So Sánh Sản Phẩm (M08: Product Comparison)

### FR-COMP-01 [Must-Have] Khay so sánh ghim đáy màn hình (Compare Drawer)
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** tôi đang duyệt sản phẩm ngoài Catalog hoặc PDP, **When** tôi bấm nút *"So sánh"* trên tối đa 3-4 sản phẩm cùng danh mục, **Then** ở đáy màn hình xuất hiện một thanh Drawer hiển thị ảnh thu nhỏ của các sản phẩm đã chọn kèm nút *"So sánh ngay (3)"* và nút xóa từng món.

### FR-COMP-02 [Must-Have] Bảng so sánh thông số, thành phần & Match Score
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** tôi bấm *"So sánh ngay"*, **When** trang `/compare` hiển thị, **Then** xuất hiện bảng so sánh song song đa cột (Side-by-side Table):
    - Dòng 1: Hình ảnh, tên, giá bán USD ($), dung tích, xuất xứ thương hiệu.
    - Dòng 2: **Điểm tương thích Match Score** theo hồ sơ da của người xem (ví dụ: SP A đạt 88%, SP B đạt 70%).
    - Dòng 3: Danh sách các hoạt chất chính và điểm khác biệt về công năng.
    - Dòng 4: Cảnh báo dị ứng: Đánh dấu đỏ trực tiếp lên cột sản phẩm nào có chứa chất dị ứng của người xem.
    - Dòng 5: Nút *"Thêm vào giỏ"* ngay dưới chân mỗi cột sản phẩm.

---

## 4.9. Module 09 — Danh Sách Yêu Thích (M09: Wishlist)

### FR-WISH-01 [Must-Have] Thao tác lưu và quản lý Wishlist
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** tôi bấm icon Trái tim trên bất kỳ sản phẩm nào, **When** bấm, **Then** icon chuyển sang màu đỏ rực và sản phẩm được lưu vào danh sách yêu thích.
  - `AC-01.2` **Given** tôi mở trang `/wishlist`, **When** trang tải xong, **Then** hiển thị toàn bộ các sản phẩm tôi đã lưu kèm giá bán hiện tại và trạng thái còn hàng.
  - `AC-01.3` **Given** mỗi sản phẩm trong Wishlist, **When** tôi bấm nút *"Thêm vào giỏ"*, **Then** sản phẩm được đưa thẳng vào giỏ hàng mà không cần phải mở lại trang chi tiết.

---

## 4.10. Module 10 — Giỏ Hàng & Mã Giảm Giá (M10: Cart & Coupons)

### FR-CART-01 [Must-Have] Quản lý sản phẩm trong giỏ hàng
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** trang giỏ hàng `/cart`, **When** tôi thay đổi số lượng bằng nút `+` hoặc `-`, **Then** số lượng được cập nhật tức thì, tổng tiền tạm tính tự động tính lại.
  - `AC-01.2` **Given** tôi bấm icon Thùng rác bên cạnh một sản phẩm, **When** xác nhận, **Then** sản phẩm bị xóa khỏi giỏ hàng. Nếu giỏ trống, hiển thị màn hình rỗng kèm nút *"Tiếp tục mua sắm"*.

### FR-CART-02 [Must-Have] Áp dụng mã giảm giá cơ bản
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** ô nhập mã giảm giá trong giỏ hàng, **When** tôi nhập `BEAUTYAI10` và bấm *"Áp dụng"*, **Then** hệ thống giảm 10% trên tổng tiền đơn hàng và hiển thị dòng giảm giá rõ ràng.
  - `AC-02.2` **Given** tôi nhập mã không tồn tại hoặc hết hạn, **When** bấm áp dụng, **Then** hệ thống thông báo: *"Mã giảm giá không hợp lệ."* và giữ nguyên tổng tiền ban đầu.

---

## 4.11. Module 11 — Thanh Toán COD & Quản Lý Đơn Hàng (M11: Checkout & Orders)

### FR-ORD-01 [Must-Have] Form đặt hàng thanh toán COD
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** trang `/checkout`, **When** tôi mở trang, **Then** form yêu cầu nhập: Họ và tên người nhận, Số điện thoại (bắt buộc đúng định dạng 10 chữ số), Địa chỉ giao hàng chi tiết, Ghi chú đơn hàng.
  - `AC-01.2` **Given** phương thức thanh toán, **Then** chọn mặc định là **"Thanh toán khi nhận hàng (COD)"** — khách hàng thanh toán tiền mặt trực tiếp cho bưu tá khi nhận kiện hàng.

### FR-ORD-02 [Must-Have] Tạo đơn hàng & Trang cảm ơn (Thank You Page)
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** tôi đã điền đầy đủ thông tin giao hàng, **When** tôi bấm *"Xác nhận đặt hàng"*, **Then** hệ thống sinh mã đơn hàng duy nhất dạng `BA-YYYYMMDD-XXXX`, lưu đơn vào CSDL với trạng thái `Pending` (Chờ xử lý), làm rỗng giỏ hàng và chuyển hướng sang trang cảm ơn hiển thị tóm tắt mã đơn, tổng tiền và thời gian giao dự kiến.

### FR-ORD-03 [Must-Have] Lịch sử đơn hàng của tôi
- **Điều kiện chấp nhận:**
  - `AC-03.1` **Given** tôi vào trang `/profile` tab Đơn hàng của tôi, **When** trang tải, **Then** liệt kê toàn bộ các đơn tôi đã đặt theo thứ tự mới nhất, hiển thị mã đơn, ngày đặt, danh sách sản phẩm, tổng tiền và trạng thái hiện tại (`Chờ xử lý`, `Đang giao hàng`, `Hoàn thành`).

---

## 4.12. Module 12 — Trợ Lý Da Liễu AI Gemini (M12: AI Skincare Assistant) (Core USP)

### FR-AI-01 [Must-Have — USP] Khung chat tư vấn làm đẹp thông minh
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** giao diện chat `/chat` hoặc widget nổi ở góc màn hình, **When** tôi gửi câu hỏi (ví dụ: *"Da tôi dạo này bị đổ nhiều dầu ở vùng chữ T và có mụn đầu đen thì nên dùng gì?"*), **Then** trợ lý AI phản hồi trong vòng dưới 3 giây với văn phong chuyên nghiệp, ân cần của chuyên gia da liễu.

### FR-AI-02 [Must-Have — USP] Grounding danh mục sản phẩm sàn
- **Quy tắc nghiệp vụ:** AI chỉ đề xuất sản phẩm đang có bán (`BR-AI-02`).
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** AI tư vấn chu trình dưỡng da, **When** AI gợi ý sản phẩm, **Then** 100% các sản phẩm được đề xuất phải là **sản phẩm có thật trong CSDL của BeautyAI**, đi kèm tên chính xác, hình ảnh thu nhỏ, giá bán và đường link bấm mở trực tiếp trang PDP.

### FR-AI-03 [Must-Have — USP] Cá nhân hóa theo Digital Skin ID & Tránh dị ứng
- **Điều kiện chấp nhận:**
  - `AC-03.1` **Given** tôi đã đăng nhập và hồ sơ da ghi nhận dị ứng `Hương liệu (Fragrance)`, **When** AI tư vấn, **Then** AI tự động loại bỏ toàn bộ các sản phẩm có chứa Fragrance và chủ động giải thích: *"Em đã chọn lọc các sản phẩm hoàn toàn không chứa hương liệu để an toàn cho làn da của chị."*

### FR-AI-04 [Must-Have — Guardrail] Rào chắn an toàn y tế (Medical Safety Guardrail)
- **Quy tắc nghiệp vụ:** Bất biến nghiêm cấm chẩn đoán bệnh da liễu nặng.
- **Điều kiện chấp nhận:**
  - `AC-04.1` **Given** người dùng gửi câu hỏi có dấu hiệu bệnh lý da liễu nặng (như chàm bội nhiễm, vảy nến, viêm da tiếp xúc mưng mủ), **When** AI nhận diện từ khóa, **Then** AI tuyệt đối không kê đơn thuốc hay kết luận bệnh, mà bắt buộc đưa ra khuyến cáo chuẩn:
    > *"Dấu hiệu bạn mô tả có thể là bệnh lý da liễu chuyên khoa. Mỹ phẩm thông thường không thể điều trị được tình trạng này. Bạn vui lòng đến bệnh viện hoặc phòng khám chuyên khoa da liễu để được bác sĩ thăm khám trực tiếp nhé!"*

---

## 4.13. Module 13 — Đánh Giá & Khai Thác Dataset 1 Triệu Reviews (M13: Reviews Intelligence)

### FR-REV-01 [Must-Have] Hiển thị đánh giá từ tập dữ liệu lớn
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** trang PDP, **When** cuộn xuống mục Đánh giá, **Then** hiển thị điểm sao trung bình, biểu đồ tỷ lệ sao (5 sao, 4 sao...) và danh sách các bài đánh giá thực tế từ tập dữ liệu mẫu 1 triệu records. Mỗi review hiển thị: Tên người đánh giá, số sao, ngày viết, loại da của người viết (`Da dầu`, `Da khô`...) và nội dung nhận xét chi tiết.

### FR-REV-02 [Must-Have — USP] Lọc đánh giá theo loại da của người đánh giá
- **Mô tả:** Tính năng cực kỳ giá trị giúp người mua chỉ đọc trải nghiệm của những người có cùng cơ địa da với mình.
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** danh sách đánh giá trên PDP, **When** tôi bấm vào tab lọc *"Chỉ xem đánh giá từ người có DA DẦU"*, **Then** danh sách lập tức lọc lại và chỉ hiển thị các bài nhận xét của người dùng có thuộc tính `skin_type = 'Oily'`.
  - `AC-02.2` **Given** tôi đã đăng nhập và có Skin ID là `Da nhạy cảm`, **When** tôi mở trang PDP, **Then** hệ thống tự động ưu tiên đẩy các review từ những người có `Da nhạy cảm` lên vị trí đầu tiên của danh sách.

### FR-REV-03 [Should-Have] Gửi đánh giá cho sản phẩm
- **Điều kiện chấp nhận:**
  - `AC-03.1` **Given** tôi đã đăng nhập, **When** tôi viết nhận xét, chọn số sao (1-5 sao), chọn loại da của mình và bấm *"Gửi đánh giá"*, **Then** đánh giá được lưu vào CSDL và xuất hiện ngay trong danh sách đánh giá sản phẩm.

---

## 4.14. Module 14 — Quản Trị Sàn Tinh Gọn (M14: Admin Console)

### FR-ADM-01 [Must-Have] Bảng điều khiển KPI kinh doanh (Dashboard)
- **Điều kiện chấp nhận:**
  - `AC-01.1` **Given** tài khoản `ADMIN` truy cập `/admin`, **When** trang tải xong, **Then** hiển thị 4 thẻ số liệu thống kê trực quan: Tổng số sản phẩm đang bán, Tổng số đơn hàng phát sinh, Tổng doanh thu lũy kế (USD $), và Tổng số tài khoản khách hàng.

### FR-ADM-02 [Must-Have] Quản lý sản phẩm & Nhập chuỗi thành phần INCI (CRUD)
- **Điều kiện chấp nhận:**
  - `AC-02.1` **Given** trang Quản lý sản phẩm, **When** Admin bấm *"Thêm sản phẩm mới"*, **Then** Admin có thể nhập: Tên sản phẩm, Thương hiệu, Danh mục, Giá bán USD ($), Dung tích, Tồn kho, Link ảnh và đặc biệt là **Ô dán chuỗi thành phần INCI thô**.
  - `AC-02.2` **Given** Admin dán chuỗi INCI thô và bấm lưu, **Then** hệ thống tự động bóc tách và tạo liên kết trong bảng `product_ingredients`.
  - `AC-02.3` **Given** sản phẩm đã có, **When** Admin chỉnh sửa giá hoặc tồn kho, **Then** thông tin được cập nhật tức thì trên trang Catalog ngoài website.

### FR-ADM-03 [Must-Have] Quản lý và đổi trạng thái đơn hàng COD
- **Điều kiện chấp nhận:**
  - `AC-03.1` **Given** danh sách đơn hàng tại `/admin/orders`, **When** có đơn hàng mới với trạng thái `Pending` (Chờ xử lý), **Then** Admin có dropdown cho phép đổi trạng thái sang `Delivering` (Đang giao hàng) hoặc `Completed` (Đã giao thành công) hoặc `Cancelled` (Đã hủy). Trạng thái đơn của khách hàng ngoài trang cá nhân lập tức được đồng bộ.

---

# 5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS — NFRS)

1. **Hiệu năng (Performance - NFR-PERF):**
   - Tốc độ tải trang Catalog và PDP trên môi trường local/test dưới **1.5 giây**.
   - Tốc độ truy vấn lọc trong tập 1 triệu reviews nhờ đánh chỉ mục B-Tree kép `(product_id, skin_type)` bắt buộc dưới **50ms**.
   - Thời gian phản hồi của Trợ lý AI Gemini dưới **3 giây**.
2. **Bảo mật (Security - NFR-SEC):**
   - Mật khẩu người dùng băm an toàn bằng PBKDF2 (600,000 rounds).
   - Tuyệt đối không để lộ chuỗi kết nối CSDL, API Key Gemini trong mã nguồn frontend hoặc commit git (sử dụng biến môi trường `.env`).
   - Ngăn chặn SQL Injection thông qua việc sử dụng 100% Parameterized Queries trong EF Core và Dapper.
3. **Bất biến kiến trúc & nghiệp vụ (Invariants - NFR-INV):**
   - **INV-01 (Bất biến tối cao):** Hệ thống **tuyệt đối không** chứa bất kỳ thuộc tính hay chỉ số nào mang tên `SafetyScore`, `HazardScore`, `DangerLevel`. Mọi chỉ số đánh giá đều là `SuitabilityScore` (Điểm tương thích cá nhân hóa).
   - **INV-02:** Toàn bộ hệ thống chạy chuẩn duy nhất một loại tiền tệ là **USD ($)** trong Phase 1 (đồng bộ 100% với Sephora dataset); tính năng chuyển đổi song tệ (VND/USD) và bản địa hóa Tiếng Việt (i18n) thuộc Phase 2.
4. **Tính khả dụng & Trải nghiệm (Usability - NFR-UI):**
   - Giao diện web chuẩn Responsive mượt mà trên cả máy tính bàn (Desktop) và điện thoại di động (Mobile).
   - Bảng so sánh sản phẩm hỗ trợ cuộn ngang mượt mà khi xem trên màn hình nhỏ.

---

# 6. TIÊU CHUẨN ĐỊNH NGHĨA HOÀN THÀNH (DEFINITION OF DONE — DOD)

Mỗi tính năng của Phase 1 chỉ được đánh dấu là **HOÀN THÀNH (DONE)** khi thỏa mãn đầy đủ 5 tiêu chí:
1. Giao diện frontend hoạt động chính xác theo đúng mô tả Given/When/Then, không phát sinh lỗi console.
2. API backend C# .NET 10 xử lý chuẩn, có validation dữ liệu đầu vào và xử lý ngoại lệ toàn cục.
3. Bộ kiểm thử kiến trúc `BeautyAI.ArchitectureTests` chạy XANH 100% (không vi phạm bất biến INV-01 và Clean Architecture).
4. Kiểm tra chất lượng `./syntheprise gate` đạt trạng thái **Clean** (0 lỗi, 0 cảnh báo).
5. Kịch bản chạy thử nghiệm xuyên suốt (Happy Path Demo) hoạt động hoàn hảo phục vụ bảo vệ đồ án tốt nghiệp.
