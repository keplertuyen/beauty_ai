---
doc: ui-prototype-readme
title: Prototype Giao Diện Tĩnh (HTML/CSS/JS) — BeautyAI Platform
status: stable
precedence: 5
owner: UI/UX Designer persona
last_reviewed: 2026-10-25
---

# BeautyAI — Prototype Giao Diện (bản cập nhật V1.0)

Thư mục này chứa toàn bộ các trang giao diện của **BeautyAI** dưới dạng HTML/CSS/JS độc lập,
mở trực tiếp được trong bất kỳ trình duyệt nào mà không cần Node.js hay máy chủ backend.

> **Vai trò trong dự án:** đây là **tài liệu thiết kế sống** (design artifact). Khi triển khai thật,
> prototype này được chuyển thành React theo **ADR-007** — **giữ nguyên toàn bộ hệ thống token màu,
> typography và component trong `css/style.css`**, không chuyển sang Tailwind hay UI kit.
> Trong repo dự án, thư mục này nằm ở `docs/_ui-ux_design/v1.0/`.

---

## 1. Cách mở & xem

### Cách 1 — Mở trực tiếp (nhanh nhất)
Nhấp đúp vào `index.html`.

### Cách 2 — Máy chủ tĩnh cục bộ (khuyên dùng)
```bash
python3 -m http.server 3000
```
Rồi mở `http://localhost:3000`.

---

## 2. Danh mục 17 trang

### Trang khách hàng (13)

| Tệp | Chức năng chính |
|---|---|
| `index.html` | Trang chủ: hero, danh mục nổi bật, sản phẩm tuyển chọn |
| `products.html` | Danh mục: Smart Filter (chứng nhận · loại trừ · hoạt chất), **công tắc "An toàn cho da tôi"**, liên kết công khai tiêu chí xếp hạng |
| `product-detail.html` | Chi tiết sản phẩm: bảng INCI giữ thứ tự · **Điểm Phù Hợp** · biểu đồ công năng · **bảng "Vì sao gợi ý sản phẩm này"** · **khối "Người có làn da giống bạn nói gì"** · combo mua kèm |
| `skin-quiz.html` | Chẩn đoán 4 tầng + Routine Builder Sáng/Tối + Chat-to-Cart |
| `ingredient-analyzer.html` | Dán bảng INCI bất kỳ → nhận diện hoạt chất, tỷ lệ phủ, đối chiếu hồ sơ da |
| `compare.html` | So sánh sản phẩm side-by-side |
| `cart.html` | Giỏ hàng: **Conflict Detector 3 mức có phân cấp bằng chứng** · bảng tổng kết 6 bước áp voucher |
| `checkout.html` | Thanh toán: địa chỉ, COD & VNPay Sandbox |
| `wishlist.html` | Danh sách yêu thích |
| `profile.html` | Digital Skin ID · Allergy Blacklist · **công tắc chia sẻ hồ sơ với AI (mặc định TẮT)** · **nút xóa hồ sơ da** · lịch sử đơn |
| `expert-consult.html` | **Trợ lý tư vấn sản phẩm Lumi**: định tuyến 3 tầng · **disclaimer cố định** · **chuyển tiếp Zalo có mã phiên** |
| `support.html` | Trung tâm hỗ trợ & FAQ |
| `admin.html` | Bảng điều khiển quản trị |

### Trang minh bạch & pháp lý (3) — **mới thêm**

| Tệp | Vì sao bắt buộc có |
|---|---|
| `methodology.html` | Công khai **cách tính Điểm Phù Hợp**, phân cấp bằng chứng A/B/C, và **giới hạn của phương pháp** |
| `ranking-criteria.html` | **Nghĩa vụ pháp lý** — công khai các tiêu chí chính của thuật toán ưu tiên hiển thị |
| `privacy-policy.html` | **Nghĩa vụ pháp lý** — nêu rõ thu thập gì, gửi cho bên thứ ba nào, lưu bao lâu, bạn kiểm soát được gì |

### Trang tiện ích (1)

| Tệp | Chức năng |
|---|---|
| `404.html` | Trang không tìm thấy, có hướng dẫn tiếp tục |

---

## 3. Những thay đổi quan trọng ở bản V1.0

> Dựa trên review của BA/SA/PM và nghiên cứu thị trường — chi tiết tại `BRD_BeautyAI_V1.0.md` §4.

### 3.1. ❌ Đã LOẠI BỎ "Safety Score"

Prototype trước hiển thị **"Safety Score (Nội Bộ) 1–10"** theo mô hình Yuka / EWG Skin Deep.
Mô hình này đã bị loại bỏ vì **ba lý do độc lập**:

1. **Sai về phương pháp khoa học** — chấm điểm nguy hại mà bỏ qua **nồng độ và mức phơi nhiễm**
   là lỗi căn bản (*liều lượng mới tạo nên độc tính*). Giới hóa học mỹ phẩm đã phản bác công khai
   hệ thống của Yuka đúng vì lý do này.
2. **Rủi ro pháp lý** — nói sản phẩm hợp pháp của thương hiệu khác là "nguy hiểm/điểm thấp"
   có thể dẫn tới tranh chấp.
3. **Rủi ro khi bảo vệ đồ án** — đây là điểm dễ bị chất vấn nhất và không có câu trả lời thuyết phục.

**Thay bằng ba thứ phòng thủ được:**

| Thay vì | Làm |
|---|---|
| "Sản phẩm này an toàn 7/10" | **"Phù hợp 96/100 với hồ sơ da CỦA BẠN"** — tương đối theo người, không phải thuộc tính sản phẩm |
| "Thành phần này nguy hiểm" | **"Thành phần này làm gì + trạng thái pháp lý theo CosIng (EU)"** |
| Cảnh báo đỏ 6 cặp hoạt chất | **Phát hiện xung đột có phân cấp bằng chứng — chỉ 1 cảnh báo đỏ duy nhất** |

### 3.2. ✅ Conflict Detector có phân cấp bằng chứng (`cart.html`)

Dải cảnh báo cũ được thay bằng bảng 3 mức, mỗi mức gắn **cấp bằng chứng**:

| Mức | Cấp bằng chứng | Nghĩa |
|---|---|---|
| 🔴 **CAO** | **A** — có nghiên cứu định lượng đã bình duyệt | Chỉ **một cặp** đạt mức này: **Retinoid + Benzoyl Peroxide** |
| 🟡 **LƯU Ý** | **B** — cơ chế vững, thiếu dữ liệu định lượng | Cộng gộp kích ứng (vd Retinol + AHA/BHA) |
| ⚪ **THÔNG TIN** | **C** — lý thuyết hợp lý, hoặc huyền thoại đang bị phản bác | Ghi chú, **không** trình bày như cảnh báo |

**⭐ Điểm khác biệt quan trọng nhất:** hệ thống **chủ động đính chính huyền thoại**.
Cặp **Vitamin C + Niacinamide** bị nhiều nguồn cho là kỵ nhau — **bằng chứng hóa học không ủng hộ điều đó**
ở điều kiện sử dụng thực tế. Hệ thống **không cảnh báo** cặp này, mà hiển thị nội dung đính chính
trong khối *"Những cặp chúng tôi KHÔNG cảnh báo — và vì sao"*.

Và với cặp Retinoid + Benzoyl Peroxide, cảnh báo nêu được **sắc thái chuyên môn**:
**Adapalene bền hơn Tretinoin** khi dùng chung Benzoyl Peroxide — sắc thái mà không ứng dụng
tương tự nào trên thị trường Việt Nam có.

### 3.3. ✅ Đổi nhân dạng trợ lý AI (`expert-consult.html`)

| Trước | Sau | Lý do |
|---|---|---|
| "Trợ Lý Làn Da AI Lumi" / "Chuyên Gia Da Liễu Ảo" | **"Lumi — Trợ Lý Tư Vấn Sản Phẩm"** | Pháp luật quảng cáo mỹ phẩm **cấm sử dụng hình ảnh/tên/trang phục của bác sĩ, dược sĩ, nhân viên y tế** để quảng cáo mỹ phẩm |
| "AI BEAUTY CONSULTANT" | "TRỢ LÝ TƯ VẤN SẢN PHẨM" | nt. |
| Disclaimer không có | **Disclaimer CỐ ĐỊNH trong khung chat, luôn nhìn thấy** | Hiện một lần rồi mất là không đủ |

Bổ sung: lời chào nêu rõ **làm được gì / KHÔNG làm được gì** · nhãn tầng xử lý cho từng câu trả lời ·
tình huống vùng chặn y tế · **bản xem trước dữ liệu sẽ gửi cho chuyên viên (khách tự tích chọn)** ·
thẻ mã phiên Zalo.

### 3.4. ✅ Bộ lọc tuân thủ nội dung (toàn bộ 17 trang)

Đã rà soát và thay thế các cụm từ gây hiểu nhầm mỹ phẩm là thuốc:

| Trước | Sau |
|---|---|
| "kháng viêm mụn", "trị mụn" | "hỗ trợ làm dịu da", "hỗ trợ giảm mụn" |
| "Đặc trị" (nhãn bước routine) | "Tinh chất chuyên biệt" |
| "chuẩn y khoa" | *(bỏ)* |
| "đạt chuẩn EWG xanh" | "được phép dùng theo quy định EU với giới hạn nồng độ" |
| "mờ thâm mụn" | "hỗ trợ làm mờ vùng thâm sau mụn" |

> Mã nội bộ (enum `DAC_TRI`) **không đổi** — chỉ đổi nhãn hiển thị cho người dùng.

### 3.5. ✅ Quyền riêng tư hồ sơ da (`profile.html`)

- **Công tắc "Cho phép trợ lý AI dùng hồ sơ da của tôi" — mặc định TẮT**
- Khi bật, hiển thị **chính xác dữ liệu sẽ gửi đi** (đã ẩn danh hóa) và danh sách **KHÔNG BAO GIỜ gửi**
- **Nút xóa hồ sơ da**, có hộp thoại nêu rõ hậu quả — xóa là **xóa thật**, không phải ẩn
- Nêu rõ: **Quản trị viên BeautyAI không có quyền xem hồ sơ da của bạn**

### 3.6. ✅ Tỷ giá không còn viết cứng (`js/main.js`)

Tỷ giá `25.400` đã được chuyển vào đối tượng `BEAUTYAI_CONFIG` kèm ghi chú rõ:
trong hệ thống thật, tỷ giá là **cấu hình do Quản trị viên đặt** (`app_settings.exchange_rate_usd_vnd`),
và API trả về **đồng thời cả `priceUsd` và `priceVnd`** — frontend **không tự quy đổi**.
Việc làm tròn cũng được sửa thành **làm tròn LÊN bội số 1.000** theo đúng quy tắc nghiệp vụ.

### 3.7. ✅ Tuyên bố minh bạch về nguồn dữ liệu (footer toàn bộ trang)

Footer nêu rõ: danh mục 8.494 sản phẩm là **dữ liệu tham khảo từ nguồn Sephora (người dùng quốc tế),
phục vụ mục đích học thuật, phi thương mại**; phần lớn sản phẩm **chưa có số công bố mỹ phẩm tại Việt Nam
và không được bán tại Việt Nam**. Đây là xử lý trung thực cho vấn đề xuất xứ danh mục —
nêu rõ là điểm cộng, che đi là điểm trừ.

---

## 4. Tính năng tương tác có sẵn

- **Đổi tiền tệ tức thì (VND ↔ USD)** — bấm `₫ VND` / `$ USD` trên navbar
- **Ngăn kéo giỏ hàng** — bấm 🛍️, đóng được bằng nút X, bấm ra ngoài
- **Modal đăng nhập / đăng ký** — bấm 👤
- **Chuyển tab** — trang chi tiết sản phẩm và Skin Quiz
- **Trợ lý Lumi mô phỏng định tuyến 3 tầng** — gõ câu hỏi và xem nhãn tầng xử lý thay đổi:
  - *"Chính sách đổi trả thế nào?"* → trả lời từ dữ liệu hệ thống (**không dùng AI**)
  - *"Vitamin C và Niacinamide có kỵ nhau không?"* → **đính chính huyền thoại**
  - *"BHA có dùng chung Retinol được không?"* → cảnh báo mức LƯU Ý kèm phương án tách buổi
  - *"Mình đang bị vảy nến..."* → **vùng chặn y tế**, đề nghị chuyển tiếp chuyên viên
  - *"Mặt tôi đang sưng phù"* → **khuyên đi khám bác sĩ ngay**, không gợi ý sản phẩm
- **Conflict Detector** — mở `cart.html`, xem 3 mức cảnh báo và khối đính chính huyền thoại;
  phải tích ô xác nhận mới bật được nút thanh toán
- **Công tắc "An toàn cho da tôi"** — `products.html`, cột bộ lọc bên trái
- **Quyền riêng tư hồ sơ da** — `profile.html`, bật/tắt công tắc chia sẻ với AI

---

## 5. Trang còn thiếu so với đặc tả đầy đủ

Các trang sau nằm trong `BRD_BeautyAI_V1.0.md` §10.3 nhưng **chưa dựng trong prototype**
(sẽ làm trực tiếp ở giai đoạn React tương ứng):

| Trang | Phase triển khai |
|---|---|
| Đăng nhập / Đăng ký / Đổi mật khẩu (trang độc lập) | P2 |
| Chi tiết thành phần | P5 |
| Kết quả đặt hàng · Chi tiết đơn hàng | P6 |
| 11 trang con của Admin Console | P8 |

---

## 6. Sao lưu

Bản prototype trước khi cập nhật được giữ trong `_backup_truoc_cap_nhat/`.

---

## 7. Tài liệu liên quan

| Tài liệu | Nội dung |
|---|---|
| `../BRD_BeautyAI_V1.0.md` | Đặc tả yêu cầu — 126 FR có điều kiện chấp nhận, 70+ quy tắc nghiệp vụ, nghiên cứu thị trường, tuân thủ pháp lý |
| `../Technical_Design_BeautyAI_V1.0.md` | Thiết kế kỹ thuật — 12 ADR, mô hình ORM 35 thực thể, lược đồ DB, hợp đồng API, thiết kế trợ lý AI 7 chặng |
| `../Plan_BeautyAI_V1.0.md` | Kế hoạch triển khai — 9 phase, 38 work group, 552 giờ, thang cắt phạm vi |
