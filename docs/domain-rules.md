---
doc: domain-rules
title: Quy Tắc Miền Nghiệp Vụ (Domain Rules) — BeautyAI Platform
status: draft
precedence: 4
owner: BA / Domain Expert
last_reviewed: 2026-10-25
---

# 7. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

> Quy tắc nghiệp vụ là **sự thật nghiệp vụ không phụ thuộc công nghệ**. Mọi FR ở §8 phải tuân theo các quy tắc này. Khi một quy tắc thay đổi, mọi FR trích dẫn nó phải được rà soát lại (xem §15).

## 7.1. Nhóm Tiền tệ & Giá (`BR-PRICE`)

| Mã | Quy tắc | Lý do |
|---|---|---|
| **BR-PRICE-01** | **USD là đơn vị tiền tệ gốc (base currency)** của mọi dữ liệu giá. Mọi giá trị VND đều là *dẫn xuất* được tính ra khi hiển thị hoặc khi chốt đơn. Không lưu giá VND như dữ liệu gốc của sản phẩm. | Nguồn dữ liệu là USD; tránh hai nguồn chân lý về giá (`core-principles §3.1`: lưu dữ liệu gốc, dẫn xuất khi đọc) |
| **BR-PRICE-02** | Công thức quy đổi: `giá_VND = LÀM_TRÒN_LÊN_NGHÌN( giá_USD × tỷ_giá_hiện_hành )`. Làm tròn tới **nghìn đồng gần nhất trở lên** (ceiling theo bội số 1.000). | Tránh hiển thị giá lẻ phi thực tế (vd 274.320₫) |
| **BR-PRICE-03** | **Tỷ giá hiện hành** là một giá trị cấu hình duy nhất toàn sàn do Admin đặt, có hiệu lực ngay khi lưu. Hệ thống phải lưu lịch sử thay đổi tỷ giá (ai, khi nào, từ giá trị nào sang giá trị nào). | Phục vụ đối soát & kiểm toán |
| **BR-PRICE-04** | Tại thời điểm **chốt đơn (checkout)**, hệ thống phải "đóng băng" và lưu cùng đơn hàng: `tỷ_giá_áp_dụng`, `tổng_USD`, `tổng_VND`. Thay đổi tỷ giá sau đó **không** làm thay đổi đơn đã tạo. | Đảm bảo giá trị giao dịch không bị trôi |
| **BR-PRICE-05** | Giá hiển thị cho khách = `giá_khuyến_mãi` nếu có và còn hiệu lực, ngược lại = `giá_gốc`. Khi có khuyến mãi phải hiển thị cả giá gốc bị gạch ngang và % giảm. | Minh bạch giá |
| **BR-PRICE-06** | Lựa chọn tiền tệ của khách được lưu theo phiên/trình duyệt và áp dụng đồng nhất trên **toàn bộ** giao diện (danh mục, PDP, giỏ, checkout, email). Không được có hai loại tiền trên cùng một màn hình, trừ ở PDP nơi được phép hiển thị "giá USD gốc" như thông tin phụ. | Tránh nhầm lẫn khi thanh toán |
| **BR-PRICE-07** | Giao dịch qua cổng thanh toán VNPay **luôn** được gửi bằng **VND**, bất kể khách đang xem ở USD. Số tiền gửi cổng = `tổng_VND` đã đóng băng. | Cổng chỉ nhận VND |
| **BR-PRICE-08** | Khi tỷ giá chưa được cấu hình hoặc bằng 0, hệ thống **phải** chặn checkout và hiển thị lỗi vận hành, không được tự dùng giá trị mặc định ngầm. | Tránh tạo đơn với giá trị sai |

## 7.2. Nhóm Giỏ hàng & Khuyến mãi (`BR-CART`)

| Mã | Quy tắc |
|---|---|
| **BR-CART-01** | Mỗi người dùng đã đăng nhập có **đúng một** giỏ hàng đang hoạt động. Một sản phẩm xuất hiện **tối đa một dòng** trong giỏ, với số lượng ≥ 1. |
| **BR-CART-02** | Giỏ của khách **chưa đăng nhập** được lưu tạm ở trình duyệt. Khi khách đăng nhập, giỏ tạm được **hợp nhất** vào giỏ server: cùng sản phẩm thì **lấy số lượng lớn hơn** (không cộng dồn), khác sản phẩm thì thêm mới. Phải thông báo cho khách kết quả hợp nhất. |
| **BR-CART-03** | Số lượng mỗi dòng: tối thiểu 1, tối đa `min(10, tồn_kho_hiện_có)`. Giảm xuống 0 = xóa dòng. |
| **BR-CART-04** | Không cho thêm vào giỏ sản phẩm có `tồn_kho = 0` hoặc trạng thái `ngừng bán`. Nếu sản phẩm đã có trong giỏ rồi mới hết hàng, dòng đó bị **đánh dấu không khả dụng** và bị loại khỏi tính tiền, nhưng **không tự động xóa** — khách tự quyết định. |
| **BR-CART-05** | **Voucher đa tầng:** một đơn hàng được áp **tối đa 3 mã**, mỗi loại tối đa 1 mã: một mã `BRAND` (thương hiệu), một mã `PLATFORM` (sàn), một mã `FREESHIP` (phí vận chuyển). |
| **BR-CART-06** | **Thứ tự áp dụng giảm giá (bắt buộc, không đổi):** ① tính `tạm_tính` = Σ(giá × SL) → ② áp `BRAND` (chỉ lên phần tiền của các sản phẩm thuộc thương hiệu đó) → ③ áp `PLATFORM` (lên số còn lại sau bước ②) → ④ tính phí vận chuyển → ⑤ áp `FREESHIP` (chỉ lên phí vận chuyển, không lên tiền hàng) → ⑥ `tổng_thanh_toán`. |
| **BR-CART-07** | Tổng tiền hàng sau giảm giá **không bao giờ âm**: nếu mức giảm vượt giá trị áp dụng được thì chặn ở 0. |
| **BR-CART-08** | Điều kiện áp mã phải thỏa **đồng thời**: mã đang `active`, trong khoảng `valid_from`–`valid_to` theo giờ máy chủ, `tạm_tính ≥ min_order`, và (nếu là mã `BRAND`) giỏ có ít nhất một sản phẩm thuộc thương hiệu đó. Nếu không thỏa, hiển thị lý do cụ thể — **không** chỉ nói "mã không hợp lệ". |
| **BR-CART-09** | Khi giỏ thay đổi, mọi mã đã áp phải được **đánh giá lại**. Mã không còn thỏa điều kiện sẽ bị bỏ áp kèm thông báo rõ nguyên nhân. |
| **BR-CART-10** | **Phí vận chuyển (mô phỏng):** 30.000₫ cho đơn có `tạm_tính` quy đổi < 500.000₫; miễn phí từ 500.000₫ trở lên. Quy tắc này là dữ liệu cấu hình, Admin sửa được. |
| **BR-CART-11** | **Combo routine:** khi khách thêm **toàn bộ** routine do AI đề xuất (≥ 3 sản phẩm, trong một hành động), được giảm thêm `combo_discount` (mặc định 5%) lên phần tiền của các sản phẩm thuộc routine đó. Ưu đãi này độc lập với 3 tầng voucher ở `BR-CART-05`, và áp **trước** bước ② của `BR-CART-06`. |

## 7.3. Nhóm Đơn hàng (`BR-ORDER`)

| Mã | Quy tắc |
|---|---|
| **BR-ORDER-01** | **Máy trạng thái đơn hàng** — chỉ các chuyển đổi sau là hợp lệ: <br>`CHỜ_XỬ_LÝ (pending)` → `ĐÃ_THANH_TOÁN (paid)` \| `ĐÃ_HỦY (cancelled)`<br>`ĐÃ_THANH_TOÁN` → `ĐANG_GIAO (shipping)` \| `ĐÃ_HỦY`<br>`ĐANG_GIAO` → `ĐÃ_GIAO (delivered)`<br>`ĐÃ_GIAO` → *(trạng thái cuối)*<br>`ĐÃ_HỦY` → *(trạng thái cuối)*<br>Mọi chuyển đổi khác bị từ chối và ghi log. |
| **BR-ORDER-02** | Khách **tự hủy được** đơn khi đơn đang ở `CHỜ_XỬ_LÝ`. Từ `ĐÃ_THANH_TOÁN` trở đi chỉ Admin hủy được, và phải nhập lý do. |
| **BR-ORDER-03** | Đơn COD được tạo ở trạng thái `CHỜ_XỬ_LÝ` với `payment_status = CHƯA_THANH_TOÁN`. Đơn VNPay chỉ chuyển sang `ĐÃ_THANH_TOÁN` khi nhận được xác nhận thành công **đã kiểm tra chữ ký** từ cổng. |
| **BR-ORDER-04** | **Tồn kho được trừ tại thời điểm tạo đơn thành công**, không phải khi thêm vào giỏ. Khi đơn bị hủy, tồn kho được hoàn lại. |
| **BR-ORDER-05** | Đơn hàng lưu **bản chụp (snapshot)** tại thời điểm đặt: tên sản phẩm, tên thương hiệu, đơn giá USD, tỷ giá. Việc sản phẩm sau đó đổi tên/đổi giá **không** làm thay đổi đơn cũ. |
| **BR-ORDER-06** | Đơn VNPay không nhận được xác nhận trong **15 phút** sẽ được đánh dấu `CHỜ_XỬ_LÝ` kèm cờ `thanh_toán_hết_hạn`; khách được mời chọn lại phương thức thanh toán. Không tự hủy đơn. |
| **BR-ORDER-07** | Một mã đơn hàng là **duy nhất, không tái sử dụng**, và có dạng dễ đọc cho khách: `BA-<YYYYMMDD>-<số thứ tự 4 chữ số>` (vd `BA-20261021-0042`). |
| **BR-ORDER-08** | Địa chỉ giao hàng là **bắt buộc** cho mọi đơn, gồm tối thiểu: họ tên người nhận, số điện thoại, tỉnh/thành, quận/huyện, địa chỉ chi tiết. Số điện thoại phải đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng `0`). |

## 7.4. Nhóm Thành phần & Minh bạch (`BR-ING`)

> ⚠️ **QUYẾT ĐỊNH QUAN TRỌNG — thay đổi so với PRD v2.0.** PRD v2.0 định nghĩa một **"Safety Score 1–10"** chấm mức độ *an toàn / nguy hiểm tuyệt đối* của thành phần, theo mô hình Yuka / EWG Skin Deep / Think Dirty. **Mô hình này đã bị loại bỏ khỏi BeautyAI V1.0.** Ba lý do, chi tiết tại §4.3:
> 1. **Sai về khoa học** — chấm hazard mà bỏ qua **nồng độ và mức phơi nhiễm** là lỗi phương pháp căn bản ("the dose makes the poison"). Các nhà hóa học mỹ phẩm phản bác công khai hệ thống của Yuka và EWG vì đúng lý do này.
> 2. **Rủi ro pháp lý** — tuyên bố sản phẩm của một thương hiệu khác là "nguy hiểm/điểm thấp" khi sản phẩm đó đã được công bố hợp pháp có thể dẫn tới tranh chấp.
> 3. **Rủi ro bảo vệ đồ án** — đây là điểm yếu dễ bị chất vấn nhất và không có câu trả lời thuyết phục.
>
> **Thay thế bằng ba thứ phòng thủ được:** ① **Điểm Phù Hợp (Suitability Score)** — phù hợp với *hồ sơ da của chính bạn*, không phải an toàn tuyệt đối; ② **Minh bạch thành phần** — giải thích thành phần *làm gì*, không chấm điểm nguy hiểm; ③ **Phát hiện xung đột có phân cấp bằng chứng** (§7.5) — có cơ sở khoa học thật.

| Mã | Quy tắc |
|---|---|
| **BR-ING-01** | **BeautyAI KHÔNG chấm điểm "an toàn / nguy hiểm" cho thành phần hay sản phẩm.** Hệ thống không được hiển thị bất kỳ chỉ số nào ngụ ý mức độ độc hại tuyệt đối. Vi phạm quy tắc này là **lỗi chặn phát hành**. |
| **BR-ING-02** | **Điểm Phù Hợp (Suitability Score, 0–100)** là chỉ số đo **mức khớp giữa một sản phẩm và hồ sơ da của một người dùng cụ thể**. Nó **luôn** mang tính tương đối theo người dùng, **không** phải thuộc tính của sản phẩm. Không được hiển thị Điểm Phù Hợp cho khách chưa có hồ sơ da; thay vào đó mời họ tạo hồ sơ. Công thức tại §17.3. |
| **BR-ING-03** | **Nhãn minh bạch thành phần:** mỗi thành phần đã nhận diện được hiển thị với: tên INCI, tên tiếng Việt, **công năng** (làm gì), **trạng thái pháp lý theo CosIng EU** (được dùng tự do / có giới hạn nồng độ / thuộc danh mục hạn chế), và giải thích ngắn. **Không** có điểm nguy hiểm. |
| **BR-ING-04** | **Comedogenic Rating (0–5)** được giữ nhưng **hạ cấp xuống dữ liệu tham khảo cộng đồng**, không phải chỉ số chính. Mọi nơi hiển thị **phải** kèm ghi chú: *"Thang tham khảo cộng đồng, bắt nguồn từ thử nghiệm trên tai thỏ — giá trị dự đoán trên da người rất hạn chế."* Không được dùng Comedogenic để xếp hạng sản phẩm. |
| **BR-ING-04b** | Thành phần **chưa có trong từ điển** được hiển thị là `Chưa phân tích`, **không** được gán giá trị mặc định hay bị bỏ qua im lặng. Tỷ lệ phủ phải được hiển thị cho khách (vd *"Đã phân tích 38/52 thành phần (73%)"*). |
| **BR-ING-04c** | **Nguồn dữ liệu thành phần:** danh pháp INCI và trạng thái pháp lý lấy từ **CosIng (cơ sở dữ liệu chính thức của Ủy ban châu Âu)** — nguồn mở, rủi ro bản quyền thấp nhất. Phần diễn giải tiếng Việt do BeautyAI **tự biên soạn** cho **150–200 hoạt chất phổ biến nhất** (phủ > 90% nhu cầu thực tế). **TUYỆT ĐỐI KHÔNG** thu thập (crawl/scrape) nội dung từ INCIDecoder, EWG Skin Deep, hay CosDNA — điều khoản sử dụng của các nguồn này cấm rõ ràng việc thu thập và sử dụng thương mại. |
| **BR-ING-04d** | **Mọi chỉ số, điểm số, cảnh báo hiển thị cho khách đều phải có thể giải thích được:** khách bấm vào là thấy *cách tính* và *nguồn dữ liệu*. Chỉ số không giải thích được thì không được hiển thị. (Yêu cầu này đồng thời đáp ứng nghĩa vụ **công khai tiêu chí thuật toán ưu tiên hiển thị** theo Luật Thương mại điện tử — xem §13.5.) |
| **BR-ING-05** | **Phân loại công năng** của một thành phần thuộc một trong các nhóm: `Dưỡng ẩm`, `Làm dịu`, `Chống oxy hóa`, `Đặc trị/Hoạt chất`, `Làm sạch`, `Chống nắng`, `Tạo cấu trúc/Dung môi`, `Hương liệu & Chất bảo quản`. Một thành phần có **đúng một** công năng chính, có thể có nhiều công năng phụ. |
| **BR-ING-06** | Khi bóc tách `ingredients_text` thành danh sách thành phần, phải chuẩn hóa: cắt theo dấu phẩy, bỏ nội dung trong ngoặc mô tả, chuẩn hóa chữ hoa/thường, khớp theo tên INCI chuẩn **và** danh sách tên đồng nghĩa (vd `Tocopherol` ≡ `Vitamin E`). Dòng không khớp được lưu nguyên văn ở trạng thái `Chưa nhận diện`. |
| **BR-ING-07** | Thứ tự thành phần trong bảng INCI **phải được giữ nguyên** vì nó mang thông tin về nồng độ tương đối. |

## 7.5. Nhóm Xung đột hoạt chất (`BR-CONF`)

> ⚠️ **NGUYÊN TẮC TIẾT CHẾ (quan trọng nhất của module này).** Phần lớn "quy tắc kỵ nhau" lan truyền trên mạng xã hội **không có cơ sở khoa học**. Nếu BeautyAI cảnh báo đỏ 6 cặp hoạt chất, người dùng sẽ bỏ qua tất cả — và hệ thống trở thành một Yuka phiên bản Việt. **Sự tiết chế chính là tính năng.** Hiện tại, **chỉ có duy nhất MỘT cặp** đạt mức cảnh báo cao nhất.

| Mã | Quy tắc |
|---|---|
| **BR-CONF-01** | Một quy tắc xung đột **bắt buộc** có đủ 6 trường: nhóm hoạt chất A, nhóm hoạt chất B, **mức độ** (`CAO`/`LƯU_Ý`/`THÔNG_TIN`), **cơ chế** (`phân_hủy_hóa_học` / `cộng_gộp_kích_ứng` / `can_thiệp_pH`), **cấp bằng chứng** (`A`/`B`/`C`), **khuyến nghị xử lý**, và **URL nguồn gốc**. Thiếu bất kỳ trường nào ⇒ **không được** đưa vào hệ thống. |
| **BR-CONF-01b** | **Phân cấp bằng chứng (bắt buộc, quyết định mức hiển thị):**<br>• **Cấp A** — có nghiên cứu định lượng đã công bố (peer-reviewed). → được phép mức `CAO`.<br>• **Cấp B** — cơ chế sinh/hóa học vững nhưng thiếu nghiên cứu định lượng. → tối đa mức `LƯU_Ý`.<br>• **Cấp C** — hợp lý về lý thuyết, hoặc là **huyền thoại đang bị phản bác**. → chỉ được mức `THÔNG_TIN`.<br>**Không được** nâng mức hiển thị cao hơn cấp bằng chứng cho phép. |
| **BR-CONF-02** | **Ba mức độ hiển thị:** <br>• 🔴 `CAO` — nguy cơ đã được chứng minh định lượng (chỉ cấp A); cảnh báo đỏ; chặn hành động "thêm cả routine" cho tới khi khách xác nhận đã đọc.<br>• 🟡 `LƯU_Ý` — nguy cơ cộng gộp kích ứng; cảnh báo vàng; **không** chặn; nêu phương án tách buổi.<br>• ⚪ `THÔNG_TIN` — ghi chú giáo dục, **kể cả nội dung đính chính huyền thoại**; hiển thị xám, không phải cảnh báo. |
| **BR-CONF-02b** | **Hệ thống phải chủ động ĐÍNH CHÍNH các huyền thoại phổ biến**, không chỉ cảnh báo. Trường hợp điển hình: cặp **Vitamin C (L-Ascorbic Acid) + Niacinamide** bị nhiều nguồn cho là kỵ nhau; bằng chứng hóa học hiện tại **không ủng hộ** điều đó ở điều kiện sử dụng thực tế. Hệ thống **không** được cảnh báo cặp này, mà phải hiển thị ghi chú đính chính. Bảng đầy đủ tại §17.2. |
| **BR-CONF-02c** | **Cặp duy nhất hiện đạt mức `CAO` là: Retinoid (Tretinoin) + Benzoyl Peroxide**, với sắc thái bắt buộc phải nêu: **Adapalene bền hơn Tretinoin** khi dùng chung Benzoyl Peroxide, và mức phân hủy **phụ thuộc công thức**. Việc nêu được sắc thái này là điểm khác biệt chuyên môn so với mọi ứng dụng tương tự trên thị trường Việt Nam. |
| **BR-CONF-03** | Hệ thống phát hiện xung đột ở **hai ngữ cảnh**: (a) trong **giỏ hàng** — cảnh báo khả năng dùng chung; (b) trong **một routine cùng buổi** (AM hoặc PM) — cảnh báo mạnh hơn vì đã xác định dùng cùng lúc. |
| **BR-CONF-04** | Cảnh báo xung đột **không bao giờ** chặn việc mua hàng. Hệ thống **cảnh báo và đề xuất**, khách là người quyết định. Quyền quyết định của khách phải được ghi nhận (`đã_xem_cảnh_báo`). |
| **BR-CONF-05** | Mỗi cảnh báo **phải** đi kèm một **phương án hành động cụ thể**, ví dụ: *"Dùng BHA vào tối thứ 2–4–6, Retinol vào tối thứ 3–5–7"* hoặc *"Dùng Vitamin C buổi sáng, Retinol buổi tối"*. Cảnh báo không có phương án là cảnh báo không đạt. |
| **BR-CONF-06** | Khi Routine Builder tạo routine, nó **phải tự tránh** sinh ra xung đột mức `CAO` trong cùng buổi. Nếu không thể tránh (vd khách chọn danh mục buộc phải có cả hai), phải tách sang hai buổi khác nhau hoặc tách theo ngày và nêu rõ lý do. |

## 7.6. Nhóm Hồ sơ da & Dị ứng (`BR-SKIN`)

| Mã | Quy tắc |
|---|---|
| **BR-SKIN-01** | **Loại da** là một trong: `Dầu (Oily)`, `Khô (Dry)`, `Hỗn hợp (Combination)`, `Thường (Normal)`, `Nhạy cảm (Sensitive)`. Khách chọn **đúng một** loại da chính; `Nhạy cảm` có thể được chọn **đồng thời** như một thuộc tính bổ sung. |
| **BR-SKIN-02** | **Vấn đề da (concerns)** là danh sách nhiều lựa chọn từ tập cố định: `Mụn`, `Mụn ẩn`, `Lỗ chân lông to`, `Thâm sau mụn`, `Nám/Tăng sắc tố`, `Lão hóa/Nếp nhăn`, `Da không đều màu`, `Khô/Bong tróc`, `Dầu nhờn`, `Đỏ/Kích ứng`, `Quầng mắt`. Tối đa 5 vấn đề để giữ chất lượng gợi ý. |
| **BR-SKIN-03** | **Allergy Blacklist** chỉ chứa thành phần **đã nhận diện được trong từ điển**. Khách có thể nhập tự do, hệ thống gợi ý khớp; chỉ lưu khi đã khớp hoặc khách xác nhận lưu dưới dạng ghi chú tự do (không dùng để so khớp tự động). |
| **BR-SKIN-04** | Khi khách xem một sản phẩm chứa bất kỳ thành phần trong Allergy Blacklist của mình, hệ thống **phải** hiển thị cảnh báo nổi bật viền đỏ ngay phần trên của trang, **nêu rõ tên thành phần nào** gây cảnh báo. Không được chỉ cảnh báo chung. |
| **BR-SKIN-05** | Cảnh báo dị ứng được áp dụng ở **mọi nơi sản phẩm xuất hiện**: PDP, thẻ sản phẩm trong danh mục, giỏ hàng, kết quả quiz, đề xuất của chatbot. Mức hiển thị có thể thu gọn (biểu tượng) ở danh sách nhưng không được bỏ. |
| **BR-SKIN-06** | Hồ sơ da là **dữ liệu cá nhân nhạy cảm**. Chỉ chính người dùng xem/sửa được. **Admin không có quyền xem hồ sơ da của khách** (`BR-SEC-03`). Mọi báo cáo thống kê theo loại da phải ở dạng tổng hợp, không truy ngược được về cá nhân. |
| **BR-SKIN-07** | Khách **xóa được** hồ sơ da của mình bất cứ lúc nào; xóa là **xóa thật**, không phải ẩn. Sau khi xóa, các cảnh báo cá nhân hóa ngừng hoạt động và hệ thống phải nói rõ điều đó. |

## 7.7. Nhóm Gợi ý & Quiz (`BR-REC`)

| Mã | Quy tắc |
|---|---|
| **BR-REC-01** | **Skin Quiz 4 tầng — thuật toán tính điểm (xác định, không ngẫu nhiên):**<br>**Tầng 1 — Lọc danh mục:** chỉ xét sản phẩm thuộc danh mục cấp 3 phù hợp với bước routine đang cần.<br>**Tầng 2 — Khớp loại da:** +3 điểm nếu mô tả/nhãn sản phẩm khớp loại da của khách.<br>**Tầng 3 — Khớp vấn đề da:** +2 điểm cho **mỗi** vấn đề da của khách được sản phẩm giải quyết.<br>**Tầng 4 — Lọc ngân sách & sắp xếp:** loại sản phẩm vượt ngân sách; sắp xếp theo `Điểm ↓` → `Rating ↓` → `Số lượt yêu thích ↓` → `product_id ↑` (tiêu chí cuối để kết quả **tất định**). |
| **BR-REC-02** | **Trừ điểm bắt buộc:** −1000 điểm (loại thực tế) nếu sản phẩm chứa thành phần trong Allergy Blacklist của khách. Đây là quy tắc ưu tiên cao nhất, đứng trên mọi điểm cộng. |
| **BR-REC-03** | **Match Score hiển thị cho khách** là điểm thô được chuẩn hóa về thang 0–100 trong tập ứng viên của cùng một bước routine. Hệ thống **không** được hiển thị match score cho sản phẩm có điểm thô ≤ 0. |
| **BR-REC-04** | **Thứ tự bước routine (bắt buộc, theo khoa học bôi thoa từ loãng tới đặc):**<br>**AM:** ① Làm sạch → ② Cân bằng/Toner → ③ Đặc trị (serum) → ④ Dưỡng ẩm → ⑤ **Chống nắng (bắt buộc)**<br>**PM:** ① Tẩy trang → ② Làm sạch → ③ Tẩy da chết hóa học *(không hằng ngày)* → ④ Đặc trị → ⑤ Dưỡng ẩm/Phục hồi |
| **BR-REC-05** | Routine AM **luôn phải** có bước chống nắng. Nếu không tìm được sản phẩm chống nắng phù hợp trong ngân sách, vẫn phải hiển thị bước đó với ghi chú *"bắt buộc có — hãy chọn một sản phẩm chống nắng"*. |
| **BR-REC-06** | Routine có **tối thiểu 3 bước, tối đa 5 bước** mỗi buổi. Với người mới bắt đầu (`PER-03`) mặc định 3 bước. |
| **BR-REC-07** | **"Sản phẩm tương tự"** dựa trên độ tương đồng nội dung (thành phần + danh mục + nhãn đặc tính), **loại trừ** chính sản phẩm đang xem và loại trừ sản phẩm hết hàng. Trả về tối đa 8 sản phẩm. |
| **BR-REC-08** | **"Thường được mua cùng"** dựa trên luật kết hợp khai phá offline, chỉ hiển thị luật có `support ≥ 0.5%` **và** `confidence ≥ 20%` **và** `lift > 1`. Luật không đạt ngưỡng không được hiển thị. |
| **BR-REC-09** | Mọi gợi ý phải **tất định**: cùng đầu vào (hồ sơ da + ngân sách + dữ liệu sản phẩm) phải cho cùng đầu ra. Không dùng yếu tố ngẫu nhiên trong xếp hạng. Đây là điều kiện để có golden test (§14.5). |
| **BR-REC-10** | Khách **chưa đăng nhập** làm quiz được và xem được kết quả, nhưng kết quả **không được lưu**; phải hiển thị lời mời đăng nhập để lưu routine. |

## 7.8. Nhóm Trợ lý AI (`BR-AI`)

| Mã | Quy tắc |
|---|---|
| **BR-AI-01** | **Định tuyến 3 tầng, theo thứ tự:**<br>**Tầng 1 — Rules:** nếu câu hỏi khớp một ý định (intent) đã định nghĩa (tra cứu sản phẩm, tra thành phần, chính sách vận chuyển/đổi trả, trạng thái đơn, hướng dẫn dùng sản phẩm…), trả lời bằng **dữ liệu hệ thống**, không gọi LLM.<br>**Tầng 2 — Gemini:** câu hỏi mở về chăm sóc da, nằm trong phạm vi cho phép → gọi Gemini **có grounding** bằng dữ liệu sản phẩm/thành phần của BeautyAI.<br>**Tầng 3 — Chuyển tiếp Zalo:** câu hỏi chuyên sâu, phức tạp, hoặc thuộc vùng chặn (xem `BR-AI-03`) → đề nghị chuyển tiếp chuyên viên người thật qua Zalo. |
| **BR-AI-02** | **Grounding bắt buộc:** Gemini **chỉ** được phép khẳng định về sản phẩm/thành phần dựa trên dữ liệu được cấp trong ngữ cảnh. Nếu dữ liệu không có, bắt buộc trả lời *"tôi chưa có dữ liệu về điều này"* và đề nghị chuyển tiếp — **không** được suy đoán. Tên sản phẩm, giá, mã sản phẩm do AI nêu ra phải được hệ thống **đối chiếu lại với database trước khi hiển thị**; sản phẩm không tồn tại bị loại bỏ khỏi câu trả lời. |
| **BR-AI-03** | **Vùng chặn (bắt buộc chuyển tiếp người thật, không để AI trả lời):**<br>• Chẩn đoán bệnh da liễu (vảy nến, viêm da, chàm, nấm, u/nốt bất thường…)<br>• Thuốc kê đơn, Isotretinoin, corticoid, kháng sinh<br>• Thai kỳ & cho con bú (an toàn hoạt chất)<br>• Trẻ dưới 12 tuổi<br>• Thủ thuật xâm lấn (laser, peel sâu, tiêm)<br>• Phản ứng cấp đang diễn ra (sưng, phù, khó thở, bong da diện rộng) — ngoài việc chuyển tiếp, phải khuyên **đi khám bác sĩ ngay**<br>• Câu hỏi về tình trạng y tế của người khác |
| **BR-AI-04** | **Disclaimer bắt buộc:** mọi câu trả lời của trợ lý về chăm sóc da phải kèm ghi chú: *"Thông tin mang tính tham khảo, không thay thế chẩn đoán hoặc chỉ định của bác sĩ da liễu."* Thiếu disclaimer = lỗi chặn phát hành (`BO-06`). |
| **BR-AI-05** | **Suy giảm có kiểm soát (graceful degradation):** khi Gemini lỗi, hết quota, hoặc vượt thời gian chờ, hệ thống **không** được hiển thị lỗi kỹ thuật. Phải: ① thử trả lời bằng Tầng 1 → ② nếu không được, hiển thị thông báo thân thiện + đề nghị chuyển tiếp Zalo. Trải nghiệm không bao giờ "chết". |
| **BR-AI-06** | **Giới hạn chống lạm dụng:** khách chưa đăng nhập: tối đa 10 lượt gọi LLM/phiên và 20 lượt/ngày theo địa chỉ IP. Khách đã đăng nhập: 50 lượt/ngày. Vượt hạn mức thì chuyển sang chỉ dùng Tầng 1 + đề nghị Zalo. |
| **BR-AI-07** | **Ranh giới dữ liệu gửi cho LLM:** **được** gửi — câu hỏi của khách, loại da & vấn đề da (nếu khách bật chia sẻ hồ sơ), dữ liệu sản phẩm/thành phần công khai. **TUYỆT ĐỐI KHÔNG** gửi — họ tên, email, số điện thoại, địa chỉ, mật khẩu, mã đơn hàng gắn danh tính, Allergy Blacklist gắn danh tính (chỉ gửi danh sách tên thành phần cần tránh, không gửi kèm nhận dạng người dùng). |
| **BR-AI-08** | **Chống prompt injection:** mọi nội dung do người dùng nhập và mọi dữ liệu lấy từ bên ngoài được coi là **không đáng tin**. Nội dung đó không bao giờ được phép thay đổi vai trò hệ thống, nâng quyền, hay kích hoạt hành động có tác dụng phụ (tạo đơn, đổi giá, gửi email). Trợ lý **không có quyền thực hiện giao dịch**; nó chỉ đề xuất, khách tự xác nhận. |
| **BR-AI-09** | **Nhật ký hội thoại:** lưu để đánh giá chất lượng, với dữ liệu cá nhân đã được che. Thời gian lưu tối đa **90 ngày**, sau đó xóa tự động. Khách có quyền yêu cầu xóa nhật ký của mình. |
| **BR-AI-10** | **Đầu ra AI không phải nguồn chân lý:** mọi con số (giá, điểm an toàn, tồn kho) hiển thị cho khách phải lấy từ database, **không** lấy từ văn bản do LLM sinh ra. |
| **BR-AI-11** | **Bàn giao ca (handoff payload)** gửi sang chuyên viên phải gồm: mã phiên hội thoại, tóm tắt 3–5 dòng, loại da & vấn đề da (nếu khách đồng ý), danh sách thành phần cần tránh, các sản phẩm khách đang xem/đang có trong giỏ, lý do chuyển tiếp. **Phải có sự đồng ý rõ ràng của khách** trước khi gửi bất kỳ dữ liệu hồ sơ nào. |
| **BR-AI-12** | **Ngoài giờ làm việc** (mặc định 08:00–21:00 giờ Việt Nam, Admin cấu hình được), khi khách yêu cầu chuyển tiếp: thông báo rõ thời gian phản hồi dự kiến, vẫn tạo yêu cầu vào hàng đợi, và cung cấp đường dẫn Zalo OA để khách nhắn trước. |
| **BR-AI-13** | **Bộ lọc tuân thủ quảng cáo mỹ phẩm (bắt buộc, áp dụng ở ĐẦU RA — không chỉ ở prompt).** Mọi văn bản do AI sinh ra phải đi qua một bộ lọc chặn các cụm từ gây hiểu nhầm mỹ phẩm là thuốc: *điều trị, chữa, chữa khỏi, trị (mụn/nám/viêm), đặc trị, khỏi hẳn, dứt điểm, hiệu quả 100%, tốt nhất, số 1*. Khi phát hiện, văn bản bị **thay thế** bằng diễn đạt hợp lệ (*hỗ trợ cải thiện, giúp làm dịu, phù hợp với…*) hoặc câu trả lời bị chặn. **Lý do bắt buộc ở đầu ra:** chỉ thị trong prompt là *khuyến nghị*, LLM vẫn vi phạm — chỉ bộ lọc đầu ra mới là kiểm soát thật. Áp dụng cho **cả** nội dung mô tả sản phẩm nhập từ dataset (`BR-DATA-05`). |
| **BR-AI-14** | **Nhân dạng (persona) của trợ lý:** trợ lý tự giới thiệu là **"trợ lý tư vấn sản phẩm"**, **TUYỆT ĐỐI KHÔNG** tự nhận hay được đặt tên là *bác sĩ, dược sĩ, chuyên gia da liễu, chuyên gia y tế*; **không** dùng hình ảnh áo blouse trắng, biểu tượng y tế, ống nghe, hay bất kỳ dấu hiệu nghề y nào. Căn cứ: pháp luật quảng cáo mỹ phẩm Việt Nam cấm sử dụng hình ảnh/tên/trang phục của cơ sở y tế, bác sĩ, dược sĩ, nhân viên y tế để quảng cáo mỹ phẩm (§13.2); đồng thời chính sách sử dụng AI của nhà cung cấp cấm *tuyên bố chuyên môn gây hiểu nhầm* trong lĩnh vực sức khỏe. |
| **BR-AI-15** | **Ép truy vấn danh mục thật (chống bịa sản phẩm):** khi trả lời câu hỏi liên quan tới sản phẩm, trợ lý **buộc phải** gọi hàm tra cứu danh mục của BeautyAI để lấy danh sách ứng viên; nó **không được phép** sinh tên sản phẩm từ tri thức nội tại của model. Đây là biện pháp chống "bịa sản phẩm" hiệu quả nhất và là điều kiện để `BR-AI-02` thực sự có hiệu lực. |
| **BR-AI-16** | **Ẩn danh hóa trước khi gửi ra ngoài biên giới (bắt buộc).** Việc gọi dịch vụ LLM đặt ở nước ngoài được xem là **chuyển dữ liệu cá nhân xuyên biên giới**. Vì hồ sơ da thuộc nhóm **dữ liệu cá nhân nhạy cảm** (tình trạng sức khỏe) theo pháp luật Việt Nam hiện hành (§13.3), dữ liệu gửi đi **chỉ** được chứa các giá trị đã phân nhóm, không gắn danh tính — ví dụ `{loại_da: "hỗn hợp", vấn đề: ["mụn_ẩn","lỗ_chân_lông"], nhóm_tuổi: "25-34", cần_tránh: ["Fragrance"]}`. **Không** gửi: họ tên, email, số điện thoại, địa chỉ, mã người dùng, mã đơn hàng, ảnh. Việc ghép lại với danh tính chỉ diễn ra **phía máy chủ BeautyAI**. |

## 7.9. Nhóm Xác thực & Bảo mật (`BR-AUTH`, `BR-SEC`)

| Mã | Quy tắc |
|---|---|
| **BR-AUTH-01** | Định danh đăng nhập là **email** (dùng làm username), **duy nhất**, không phân biệt chữ hoa/thường, được chuẩn hóa về chữ thường trước khi lưu & so khớp. |
| **BR-AUTH-02** | **Mật khẩu KHÔNG BAO GIỜ được lưu dạng rõ, mã hóa hai chiều, hay băm không muối.** Phải dùng hàm băm mật khẩu hiện đại có muối và có hệ số làm chậm. *Ràng buộc `CON-04` ("xác thực đơn giản") nói về **không dùng OAuth/SSO**, không có nghĩa là được phép lưu mật khẩu không an toàn.* Đây là quy tắc không thương lượng. |
| **BR-AUTH-03** | **Chính sách mật khẩu:** tối thiểu 8 ký tự, có ít nhất một chữ cái và một chữ số. Từ chối 100 mật khẩu phổ biến nhất. Không yêu cầu đổi mật khẩu định kỳ (theo khuyến nghị hiện đại). |
| **BR-AUTH-04** | **Chống dò mật khẩu:** sau 5 lần đăng nhập sai liên tiếp cho cùng một email, khóa tạm 15 phút. Thông báo lỗi đăng nhập **không** được tiết lộ email có tồn tại hay không (chỉ nói "email hoặc mật khẩu không đúng"). |
| **BR-AUTH-05** | Phiên làm việc hết hiệu lực sau **7 ngày** không hoạt động. Đổi mật khẩu làm **vô hiệu tất cả** phiên đang mở khác. |
| **BR-AUTH-06** | **Không có chức năng "Quên mật khẩu" tự động trong V1.0** (vì chưa có hạ tầng email tin cậy — xem `OQ-02`). Thay vào đó: khách liên hệ hỗ trợ, Admin đặt lại mật khẩu tạm và buộc đổi ở lần đăng nhập kế tiếp. Điều này phải được nêu rõ trên giao diện. |
| **BR-SEC-01** | Mọi lệnh gọi tới chức năng yêu cầu đăng nhập đều phải kiểm tra quyền **ở phía máy chủ**. Việc ẩn nút trên giao diện **không** được coi là kiểm soát quyền. |
| **BR-SEC-02** | Người dùng chỉ truy cập được dữ liệu của **chính mình** (đơn hàng, giỏ, hồ sơ da, wishlist, hội thoại). Mọi truy vấn theo mã do người dùng cung cấp phải kiểm tra chủ sở hữu. |
| **BR-SEC-03** | **Admin không có quyền xem hồ sơ da, Allergy Blacklist và nội dung hội thoại gắn danh tính của khách hàng.** Admin chỉ xem được dữ liệu vận hành (đơn hàng, sản phẩm, doanh thu) và dữ liệu tổng hợp đã ẩn danh. |
| **BR-SEC-04** | Mọi thông tin bí mật (khóa API Gemini, khóa VNPay, token Zalo, chuỗi kết nối DB) nằm ở biến môi trường/kho bí mật. **Không bao giờ** đưa vào mã nguồn, log, thông báo lỗi, hay tài liệu. Bí mật bị lộ ⇒ xử lý như đã bị xâm phạm, phải thu hồi và cấp lại. |
| **BR-SEC-05** | Mọi hành động làm thay đổi dữ liệu của Admin phải được ghi **nhật ký kiểm toán**: ai, lúc nào, đối tượng nào, giá trị trước và sau. |

## 7.10. Nhóm Dữ liệu & Nội dung (`BR-DATA`)

| Mã | Quy tắc |
|---|---|
| **BR-DATA-01** | `product_id` giữ **nguyên dạng chuỗi gốc** của nguồn dữ liệu (vd `P473671`) để đảm bảo khớp với dữ liệu gợi ý tính offline. Không chuyển thành số tự tăng. |
| **BR-DATA-02** | Mọi mốc thời gian lưu ở **UTC, chuẩn ISO-8601**; hiển thị theo múi giờ Việt Nam (UTC+7). |
| **BR-DATA-03** | Toàn bộ dữ liệu văn bản dùng **UTF-8**. |
| **BR-DATA-04** | **Lấy mẫu review:** chỉ nạp review có ngôn ngữ nhận dạng được, độ dài ≥ 20 ký tự, và ưu tiên review có nhãn loại da hợp lệ. Mục tiêu ~50.000 review phân bố đều theo loại da và theo sản phẩm. |
| **BR-DATA-05** | Nội dung mô tả sản phẩm **không được chứa tuyên bố điều trị bệnh** (vd "chữa khỏi mụn", "trị nám dứt điểm", "thay thế thuốc"). Nội dung gốc từ dataset phải được rà soát; cụm từ vi phạm bị thay bằng diễn đạt về tác dụng chăm sóc (xem §13.2). |
| **BR-DATA-06** | Dữ liệu gợi ý tính offline (độ tương đồng, luật mua kèm) phải ghi **phiên bản & thời điểm tính**. Giao diện phải cho biết dữ liệu gợi ý được cập nhật lần cuối khi nào. |
| **BR-DATA-07** | Mỗi sản phẩm hiển thị trên sàn phải có tối thiểu: tên, thương hiệu, danh mục, giá USD, ảnh (hoặc ảnh placeholder). Sản phẩm thiếu dữ liệu bắt buộc bị đánh dấu `nháp (draft)` và **không** xuất hiện ở danh mục khách hàng. |

---


---

# 12 QUY TẮC XUNG ĐỘT HOẠT CHẤT (KHỞI TẠO BẰNG CHỨNG)
> Nguồn: BRD §17.2 và Phân loại Bằng chứng Da liễu 2026. Bất biến INV-03: Cấp B/C không bao giờ gắn nhãn Mức độ Cao.

## 17.2. Bảng quy tắc xung đột hoạt chất (dữ liệu khởi tạo)

> ⚠️ **Nguyên tắc tiết chế (`BR-CONF-01b`):** mức hiển thị **không được** vượt quá cấp bằng chứng cho phép. Bảng này là **dữ liệu khởi tạo bắt buộc** cho hệ thống (§9.6 mục 8).
>
> **Chỉ MỘT cặp duy nhất đạt mức `CAO`.** Đây là điểm khác biệt khoa học của BeautyAI so với các ứng dụng chấm điểm thành phần trên thị trường.

| # | Nhóm A | Nhóm B | Cơ chế | Cấp bằng chứng | **Mức hiển thị** | Khuyến nghị cho người dùng | Ghi chú chuyên môn |
|---|---|---|---|---|---|---|---|
| **1** | **Retinoid** (Tretinoin) | **Benzoyl Peroxide** | `PHAN_HUY_HOA_HOC` | **A** — có nghiên cứu định lượng đã bình duyệt: trộn Tretinoin với Benzoyl Peroxide dưới ánh sáng gây suy giảm >50% trong ~2 giờ và ~95% trong 24 giờ | 🔴 **CAO** | *"Dùng cách buổi: Benzoyl Peroxide buổi sáng, Retinoid buổi tối."* | ⭐ **Sắc thái bắt buộc nêu:** **Adapalene bền hơn Tretinoin** khi dùng chung Benzoyl Peroxide. Ngoài ra, mức phân hủy **phụ thuộc công thức** — một số công thức Tretinoin gel dạng nước đã tối ưu cho thấy **không suy giảm đáng kể**. Việc nêu được sắc thái này là điểm mạnh chuyên môn |
| **2** | **Retinol / Retinoid** | **AHA** (Glycolic, Lactic, Mandelic…) | `CONG_GOP_KICH_UNG` | **B** — cơ chế vững (cộng gộp kích ứng, phá vỡ hàng rào da) nhưng thiếu nghiên cứu định lượng | 🟡 **LƯU_Ý** | *"Dùng xen kẽ các buổi tối (skin cycling): Retinoid tối 1, AHA tối 2, phục hồi tối 3."* | ⚠️ **KHÔNG** được nói "triệt tiêu tác dụng" — đây **không** phải bất hoạt hóa học. Retinol **không** phụ thuộc pH thấp như L-Ascorbic Acid, nên lập luận *"AHA hạ pH phá hủy Retinol"* là **sai** |
| **3** | **Retinol / Retinoid** | **BHA** (Salicylic Acid) | `CONG_GOP_KICH_UNG` | **B** | 🟡 **LƯU_Ý** | *"Dùng cách buổi hoặc cách ngày; nếu da châm rát thì giảm tần suất BHA."* | Cùng cơ chế với #2 |
| **4** | **Vitamin C** (L-Ascorbic Acid) | **AHA / BHA** | `CONG_GOP_KICH_UNG` | **B** | 🟡 **LƯU_Ý** (nhẹ) | *"Có thể dùng chung nhưng nên thử dần; nếu châm rát thì tách Vitamin C sang buổi sáng."* | ⚠️ **KHÔNG gọi là "kỵ nhau".** L-Ascorbic Acid cần pH < 3,5 nên **tương thích về pH** với AHA/BHA. Vấn đề duy nhất là cộng gộp kích ứng |
| **5** | **Vitamin C** (L-Ascorbic Acid) | **Niacinamide** | — | **C** — ⭐ **HUYỀN THOẠI ĐANG BỊ PHẢN BÁC** | ⚪ **THÔNG_TIN** (**KHÔNG cảnh báo**) | *"Cặp này thường bị cho là kỵ nhau — bằng chứng hóa học hiện tại không ủng hộ điều đó ở điều kiện sử dụng thực tế. Một số người da nhạy cảm vẫn thấy châm/đỏ; nếu vậy hãy dùng cách buổi."* | ⭐⭐ **Nguồn gốc huyền thoại:** các nghiên cứu thập niên 1960–70 về niacinamide thủy phân thành niacin (gây đỏ mặt). Điều kiện để phản ứng xảy ra đáng kể là **pH 2 và 90°C, cần >75 giờ** để chuyển hóa một nửa; ở nhiệt độ thường mất **hàng tuần đến hàng tháng**. Phức ascorbic acid–niacinamide là **thuận nghịch và không đáng kể ở pH sinh lý**. **Việc chủ động đính chính huyền thoại này xây uy tín mạnh hơn việc thêm một cảnh báo** |
| **6** | **Niacinamide** | **AHA** | `CAN_THIEP_PH` | **C** — hợp lý về lý thuyết, thiếu dữ liệu định lượng công khai | ⚪ **THÔNG_TIN** | *"Nếu dùng chung, cân nhắc tách buổi để AHA phát huy tốt nhất."* | Niacinamide (pH ~6) có thể **nâng pH** của sản phẩm AHA, giảm tỷ lệ acid tự do → giảm hiệu lực. Mức độ phụ thuộc hệ đệm của công thức |
| **7** | **Retinoid** | **Vitamin C** | — | **C** | ⚪ **THÔNG_TIN** | *"Thói quen phổ biến: Vitamin C buổi sáng, Retinoid buổi tối."* | Không có cơ chế bất hoạt thuyết phục. Việc tách sáng/tối chủ yếu vì kích ứng và vì L-Ascorbic Acid cần pH thấp |
| **8** | **AHA** | **BHA** | `CONG_GOP_KICH_UNG` | **B** | 🟡 **LƯU_Ý** | *"Không nên dùng hai loại tẩy da chết hóa học trong cùng một buổi."* | Cộng gộp kích ứng; nguy cơ tổn thương hàng rào da |
| **9** | **Benzoyl Peroxide** | **AHA / BHA** | `CONG_GOP_KICH_UNG` | **B** | 🟡 **LƯU_Ý** | *"Tách buổi hoặc tách ngày; theo dõi dấu hiệu khô/bong."* | Cộng gộp kích ứng |
| **10** | **Retinoid** nồng độ cao | **Tẩy da chết vật lý** (hạt scrub) | `CONG_GOP_KICH_UNG` | **B** | 🟡 **LƯU_Ý** | *"Tránh chà xát cơ học khi đang dùng Retinoid."* | — |
| **11** | **Nhiều sản phẩm chứa cồn khô** (Alcohol Denat.) | **Da nhạy cảm đã khai** | `CONG_GOP_KICH_UNG` | **B** | 🟡 **LƯU_Ý** | *"Hồ sơ của bạn ghi da nhạy cảm; routine này có nhiều sản phẩm chứa cồn khô."* | Đây là quy tắc **theo hồ sơ da**, không phải xung đột giữa hai hoạt chất |
| **12** | **Tổng cộng > 2 hoạt chất mạnh trong cùng buổi** | — | `CONG_GOP_KICH_UNG` | **B** | 🟡 **LƯU_Ý** | *"Routine buổi này có N hoạt chất mạnh — nên giảm còn tối đa 2 và theo dõi phản ứng da."* | Quy tắc tổng hợp, áp cho người mới (`PER-03`) |

**Nhóm hoạt chất cần định nghĩa (§9.6 mục 7):**

| Nhóm | Thành phần thuộc nhóm (ví dụ) |
|---|---|
| `RETINOID` | Retinol, Retinal/Retinaldehyde, Retinyl Palmitate, Tretinoin, Adapalene, Hydroxypinacolone Retinoate |
| `AHA` | Glycolic Acid, Lactic Acid, Mandelic Acid, Malic Acid, Tartaric Acid, Citric Acid (ở nồng độ tẩy da chết) |
| `BHA` | Salicylic Acid, Betaine Salicylate |
| `PHA` | Gluconolactone, Lactobionic Acid |
| `VITAMIN_C_THUAN` | L-Ascorbic Acid |
| `VITAMIN_C_DAN_XUAT` | Sodium Ascorbyl Phosphate, Magnesium Ascorbyl Phosphate, Ascorbyl Glucoside, Tetrahexyldecyl Ascorbate, 3-O-Ethyl Ascorbic Acid |
| `NIACINAMIDE` | Niacinamide, Nicotinamide |
| `BENZOYL_PEROXIDE` | Benzoyl Peroxide |
| `CON_KHO` | Alcohol Denat., Ethanol, Isopropyl Alcohol, SD Alcohol |
| `HUONG_LIEU` | Fragrance, Parfum, Linalool, Limonene, Citronellol, Geraniol |
| `AZELAIC` | Azelaic Acid |
| `PEPTIDE_DONG` | Copper Peptides (GHK-Cu) |
| `CHONG_NANG_HOA_HOC` | Avobenzone, Octinoxate, Oxybenzone, Octocrylene |
| `CHONG_NANG_VAT_LY` | Zinc Oxide, Titanium Dioxide |
| `HOAT_CHAT_MANH` | Hợp của `RETINOID` ∪ `AHA` ∪ `BHA` ∪ `VITAMIN_C_THUAN` ∪ `BENZOYL_PEROXIDE` ∪ `AZELAIC` |

> ⚠️ **Lưu ý triển khai:** phân biệt `VITAMIN_C_THUAN` và `VITAMIN_C_DAN_XUAT` là **bắt buộc** — các dẫn xuất ổn định ở pH trung tính và **không** có cùng các lưu ý như L-Ascorbic Acid. Gộp chung hai nhóm này là lỗi phổ biến của các ứng dụng tương tự.


