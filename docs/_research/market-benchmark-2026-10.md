---
doc: research-market-benchmark-2026-10
title: Nghiên Cứu Thị Trường & Benchmark Đối Thủ — BeautyAI Platform
status: draft
precedence: 6
owner: BA / PM
last_reviewed: 2026-10-25
---

# 3. NGHIÊN CỨU THỊ TRƯỜNG & BENCHMARK ĐỐI THỦ

> Phần này là kết quả khảo sát 18 nền tảng quốc tế và 8 nền tảng Việt Nam/khu vực, cùng rà soát khung pháp lý và trạng thái công nghệ tại thời điểm 10/2026. Mục đích: **chốt phạm vi dựa trên bằng chứng, không dựa trên cảm tính**. Nguồn tham khảo đầy đủ tại §17.6.

## 3.1. Bức tranh thị trường (số liệu nền)

| Chỉ số | Giá trị 2025 | Hệ quả cho BeautyAI |
|---|---|---|
| Doanh thu ngành làm đẹp trên 3 sàn lớn tại Việt Nam | **~74.400 tỷ VNĐ (~3 tỷ USD)**, tăng ~30% so với năm trước | Thị trường đủ lớn, đang tăng trưởng mạnh |
| Thị phần làm đẹp quý 4/2025 | TikTok Shop ~50% · Shopee ~48% · Lazada ~4% | **Social commerce đã dẫn dắt ngành làm đẹp.** Cạnh tranh trực diện ở trục *mua bốc đồng* là tự sát |
| Doanh thu từ **gian hàng chính hãng** | **64%** tổng doanh thu ngành | **Niềm tin là trục cạnh tranh chính, không phải giá** |
| Giá bán trung bình | **tăng 13%** so với năm trước; phần lớn giao dịch **200.000–500.000₫** | Phân khúc giá trị cao hơn đang mở rộng — đây đúng là nhóm **cần tư vấn** |
| Số shop làm đẹp đang hoạt động | **giảm 13%** so với năm trước | Thị trường đang hợp nhất về phía nhà bán chính hãng, có năng lực |

**Ba suy luận chiến lược:**

1. **Giá trung bình tăng + số shop giảm** = thị trường đang hợp nhất về phía sản phẩm giá trị cao hơn. Người mua một lọ serum 400.000₫ **cần** tư vấn; người mua sữa rửa mặt 80.000₫ thì không. BeautyAI nhắm đúng phân khúc có nhu cầu tư vấn.
2. **TikTok Shop vượt Shopee ở ngành làm đẹp trước khi vượt ở toàn sàn** → làm đẹp là ngành dẫn dắt social commerce. BeautyAI **không** cạnh tranh ở trục *mua bốc đồng theo livestream*, mà ở trục **mua có cân nhắc (considered purchase)**.
3. **64% doanh thu từ gian hàng chính hãng** → trust đổi được thành tiền. Minh bạch thành phần là một dạng trust có thể xây bằng phần mềm, không cần vốn lớn.

## 3.2. Benchmark nền tảng quốc tế — phân theo 4 nhóm mô hình

> Gộp chung 18 nền tảng sẽ dẫn tới kết luận sai, vì chúng thuộc **bốn mô hình kinh doanh khác nhau hẳn**.

### Nhóm 1 — Động cơ thị giác máy tính bán cho thương hiệu (B2B SaaS)

| Nền tảng | Năng lực cốt lõi | Nền tảng công nghệ | Bài học áp dụng được |
|---|---|---|---|
| **Perfect Corp** (YouCam AI Skin Analysis) | **28 chẩn đoán trên 16 nhóm vấn đề da** (lỗ chân lông theo vùng, nếp nhăn 7 vùng, độ ẩm, đốm nâu, quầng thâm, đỏ da…), mỗi chỉ số **0–100**, cộng "AI skin score" tổng và **"tuổi da"** | Có báo cáo đối chiếu với đánh giá bác sĩ (độ tin cậy test-retest ICC > 0,90), **nhưng không công bố cỡ mẫu và không qua bình duyệt** | ⭐ **Chấm điểm 0–100 theo từng vấn đề là mô hình trải nghiệm đã được chứng minh** — và **tái tạo được từ bộ câu hỏi, không cần ảnh**. "Tuổi da" là mồi tâm lý rất mạnh, chi phí gần như bằng 0 |
| **Haut.AI** | 20+ chỉ số; **Skin.Chat** (trợ lý AI tư vấn routine + thêm vào giỏ); **SkinGPT** (mô phỏng trước–sau); tích hợp Shopify/WooCommerce | Huấn luyện trên **> 3 triệu ảnh da do bác sĩ gán nhãn**; có **LIQA** — công nghệ hướng dẫn chụp ảnh đúng: **87% ảnh dùng được khi có LIQA, so với 32% khi chỉ hướng dẫn bằng chữ** | ⭐⭐ **Con số 87% vs 32% là dữ liệu quan trọng nhất của toàn bộ nghiên cứu này.** Nó chứng minh **chất lượng ảnh đầu vào là điểm thất bại lớn nhất** của phân tích da bằng ảnh. Đồng thời: Skin.Chat chứng minh mô hình *"trợ lý LLM + danh mục + thêm vào giỏ"* là hợp lệ về thương mại — đúng kiến trúc BeautyAI |
| **L'Oréal ModiFace + Beauty Genius** | Trợ lý làm đẹp kết hợp AR + thị giác máy tính + AI sinh sinh; chẩn đoán, gợi ý routine, hỏi đáp | **Nền tri thức là các nghiên cứu lâm sàng độc quyền của L'Oréal** | ⭐⭐⭐ **Grounding là lợi thế cạnh tranh, không phải chi tiết kỹ thuật.** BeautyAI có 1,1 triệu đánh giá thật — đó là tài sản grounding tương đương. Chiến lược: AI **không "biết" về da**; AI **tổng hợp bằng chứng từ đánh giá của người có hồ sơ da tương tự** |

### Nhóm 2 — Bán trực tiếp (DTC) với công thức cá nhân hóa

| Nền tảng | Cách cá nhân hóa | Trạng thái | Bài học |
|---|---|---|---|
| **Curology** | Bộ câu hỏi + ảnh → **bác sĩ/điều dưỡng có giấy phép** kê công thức → giao theo thuê bao. **AI chỉ là lớp tiếp nhận; quyết định y khoa do người thật** | Đang hoạt động | ⭐⭐⭐ **Mô hình "human-in-the-loop" là mô hình an toàn nhất.** Đây chính là lý do tính năng **chuyển tiếp chuyên viên qua Zalo không phải "có thì tốt" mà là CƠ CHẾ MIỄN TRỪ TRÁCH NHIỆM.** AI cung cấp thông tin; người thật đưa khuyến nghị |
| **Proven Skincare** | Học máy trên cơ sở dữ liệu tổng hợp từ nghiên cứu + đánh giá; bộ câu hỏi ~3 phút → 3 sản phẩm pha riêng. **Có 2 bằng sáng chế** | Đang hoạt động | ⭐⭐ **Bộ câu hỏi + cơ sở dữ liệu đã đủ để được cấp bằng sáng chế** — không cần ảnh. Chứng minh questionnaire-based profiling là con đường chính thống, không phải giải pháp hạng hai |
| **Function of Beauty** | Bộ câu hỏi → pha chế theo đơn | Đang hoạt động | Bộ câu hỏi 10–20 câu là đủ để tạo cảm nhận cá nhân hóa thuyết phục |
| **Atolla** | Bộ kit đo da hàng tháng (pH, dầu, ẩm) → serum điều chỉnh theo thời gian | **Đã bị mua lại và dừng thương hiệu (2021)** | ⚠️ **Thất bại vì kinh tế đơn vị của phần cứng/kit, không vì AI sai.** Mọi thứ cần logistics vật lý riêng là cạm bẫy chết người cho dự án 1 người |

### Nhóm 3 — Công cụ chẩn đoán của nhà bán lẻ

| Nền tảng | Tình trạng | Bài học |
|---|---|---|
| **Sephora Color IQ / Skincare IQ** | **Đã ngưng** (xác nhận qua nhiều khiếu nại của khách trên diễn đàn chính thức) | Phụ thuộc thiết bị + nhân viên cửa hàng → không bền |
| **Neutrogena Skin360** | Cần **gắn thiết bị đo vào điện thoại** | Phụ thuộc phần cứng → thu hẹp |
| **Olay Skin Advisor** | Ảnh selfie → "tuổi da" + 5 vùng vấn đề → **chỉ gợi ý sản phẩm Olay** | ⭐ **Công cụ gợi ý một thương hiệu có xung đột lợi ích hiển nhiên.** → **Gợi ý đa thương hiệu là lợi thế về niềm tin** mà BeautyAI nên nhấn mạnh rõ |
| **Ulta GLAMlab** | Thử trang điểm bằng AR | Bài toán khác (trang điểm, không phải dưỡng da) |

> **Kết luận nhóm 3:** **Mọi công cụ phụ thuộc phần cứng hoặc cửa hàng vật lý đều đã chết hoặc thu hẹp.** Công cụ sống sót là công cụ chạy trên web/app bằng **dữ liệu người dùng tự cung cấp**.

### Nhóm 4 — Trí tuệ thành phần (nhóm quan trọng nhất với BeautyAI)

| Nền tảng | Cách làm | Đánh giá | Khả dụng cho BeautyAI |
|---|---|---|---|
| **SkinSort** | Phân tích INCI + **routine builder có phát hiện xung đột hoạt chất** + lọc "free of" | ⭐ **Gần nhất với tính năng BeautyAI cần.** Trải nghiệm routine builder rất tốt để tham khảo | Không bán hàng, không có tiếng Việt → **khoảng trống rõ ràng** |
| **INCIDecoder** | Giải nghĩa từng thành phần, chất lượng biên tập cao nhất | Được giới hóa học mỹ phẩm tôn trọng | ❌ **Điều khoản sử dụng cấm rõ ràng** việc thu thập (crawl/scrape/mine), cấm sao chép không có văn bản đồng ý, cấm dùng cho mục đích thương mại. **KHÔNG được dùng.** Chỉ được dẫn link như nguồn tham khảo cho người đọc |
| **CosIng (Ủy ban châu Âu)** | Cơ sở dữ liệu **chính thức của EU**: tên INCI, số CAS/EC, chức năng, và **các phụ lục chất bị cấm / bị hạn chế nồng độ**; ~15.000+ thành phần | Dữ liệu công vụ, chính xác, có thẩm quyền | ✅ **Rủi ro bản quyền thấp nhất → nên là XƯƠNG SỐNG dữ liệu thành phần của BeautyAI** |
| **CosDNA** | Chỉ số comedogenic 0–5, chỉ số gây mụn/kích ứng | Được dùng rộng rãi ở châu Á nhưng **nguồn gốc chỉ số không minh bạch**; thang comedogenic gốc dựa trên **thử nghiệm tai thỏ** → giá trị dự đoán trên da người rất hạn chế | ⚠️ Không có giấy phép mở. **Không dùng làm tính năng chính.** Nếu dùng phải ghi rõ giới hạn |
| **EWG Skin Deep** | Điểm nguy hại 1–10 | **Bị giới khoa học phản bác nặng** vì chấm nguy hại mà bỏ qua nồng độ/phơi nhiễm | ❌ **Không dùng** |
| **Yuka** | Điểm 0–100 + chấm màu; cơ sở dữ liệu 12.600 thành phần | **Bị các nhà hóa học mỹ phẩm phản bác công khai**: hệ thống chấm điểm *"không dựa trên khoa học"*, **không tính nồng độ, hệ dẫn, dạng thành phần** — *"liều lượng tạo nên độc tính"*. Một lotion cơ bản có thể được điểm cao hơn một kem chống nắng được bào chế tốt, chỉ vì một thành phần bị gắn cờ | ❌ **Không bắt chước mô hình này** |
| **Think Dirty** | "Dirty meter" 0–10 | Cùng lỗi phương pháp như Yuka/EWG | ❌ Không dùng |

> ### ⚠️ Kết luận quan trọng nhất của toàn bộ nghiên cứu
>
> **TUYỆT ĐỐI KHÔNG xây "Safety Score" kiểu Yuka / EWG / Think Dirty.** Nó rẻ để làm, trông hấp dẫn, nhưng **sai về phương pháp khoa học** (chấm nguy hại mà bỏ qua nồng độ), **tạo rủi ro pháp lý** (nói sản phẩm hợp pháp của thương hiệu khác là "nguy hiểm"), và là **điểm yếu dễ bị chất vấn nhất** khi bảo vệ đồ án.
>
> **Thay bằng ba thứ phòng thủ được, cùng tạo giá trị thật cho người dùng:**
> | Thay vì | Làm | Vì sao phòng thủ được |
> |---|---|---|
> | "Sản phẩm này an toàn 7/10" | **"Phù hợp 82/100 với hồ sơ da CỦA BẠN"** | Đúng về logic: phù hợp là tương đối theo người, không phải thuộc tính tuyệt đối của sản phẩm |
> | "Thành phần này nguy hiểm" | **"Thành phần này làm gì + trạng thái pháp lý theo CosIng EU"** | Dữ liệu chính thức, không phán xét |
> | Cảnh báo đỏ 6 cặp hoạt chất | **Phát hiện xung đột có phân cấp bằng chứng — chỉ 1 cảnh báo đỏ duy nhất** | Có cơ sở khoa học thật, và sự tiết chế chính là tính năng |

## 3.3. Benchmark nền tảng Việt Nam & khu vực

| Nền tảng | Điểm mạnh | Hạn chế | Bài học / Khoảng trống |
|---|---|---|---|
| **Hasaki.vn** — *benchmark số 1* | Mô hình **"tam giác": TMĐT + chuỗi 200+ cửa hàng + Hasaki Clinic & Spa**. Giao 2 giờ miễn phí. Chính sách niềm tin rõ ràng: hóa đơn VAT mọi đơn, **đền 200% nếu phát hiện hàng giả**, đổi trả 30 ngày. Có vốn đầu tư từ Alibaba, đã mở cửa hàng tại Mỹ | Bộ lọc theo loại da/vấn đề da/thành phần ở mức **cơ bản**. **Không có công cụ xây routine, không kiểm tra tương tác hoạt chất, không có hồ sơ da cá nhân hóa** | ⭐⭐⭐ **ĐÂY CHÍNH LÀ KHOẢNG TRỐNG CỦA BeautyAI.** Học: kiến trúc giỏ hàng/checkout nhanh, chính sách niềm tin minh bạch. Hơn: lớp trí tuệ thành phần. *Lưu ý: Clinic là năng lực phòng thủ nhất của Hasaki — nó cho họ quyền hợp pháp tư vấn ở mức chuyên môn cao hơn một sàn TMĐT thuần. BeautyAI bù bằng đường chuyển tiếp chuyên viên* |
| **Watsons Việt Nam** | Thương hiệu quốc tế, cam kết đầu tư lớn vào công nghệ/dữ liệu/kho bãi; danh mục quốc tế rộng; loyalty toàn cầu mạnh | Trải nghiệm số tại Việt Nam kém Hasaki; bộ lọc theo hoạt chất chưa sâu | Học mô hình loyalty theo hạng (xếp **Could** trong V1.0) |
| **Guardian Việt Nam** | Mạng cửa hàng rộng, có nhãn riêng | Yếu ở miền Bắc; trải nghiệm số hạn chế | — |
| **Sociolla / SOCO** (Social Bella) — *benchmark gần nhất về mô hình* | Kiến trúc **4 lớp: SOCO (cộng đồng/đánh giá) + Sociolla (thương mại) + Lilla (B2B) + Beauty Journal (nội dung)**. Việt Nam là thị trường quốc tế đầu tiên của họ. Đã huy động 566 triệu USD | Lớp cộng đồng cần thời gian và khối lượng người dùng để có giá trị | ⭐⭐⭐ **Mô hình "UGC tạo niềm tin → niềm tin chuyển thành chuyển đổi" đã được kiểm chứng.** Dataset 1,1 triệu đánh giá của BeautyAI **chính là một SOCO có sẵn ngày đầu** — nhưng phải xử lý minh bạch vấn đề xuất xứ (xem §4.4) |
| **Beauty Box** | Danh mục mỹ phẩm Hàn theo trend, được tuyển chọn | Phạm vi hẹp | Định vị theo nguồn gốc là một lựa chọn, BeautyAI chọn định vị theo *trí tuệ thành phần* |
| **Lixibox** | Mạnh nội dung/affiliate, flash sale | Quy mô nhỏ | — |
| **Olive Young Global** | Logistics là năng lực cốt lõi (hợp tác chuyển phát quốc tế để rút ngắn thời gian giao K-beauty) | Rào cản ngôn ngữ & vận chuyển với người Việt | ⚠️ **Giá trị của họ nằm ở sourcing/logistics, không ở AI.** BeautyAI **không nên** đụng vào trục này |
| **Shopee / TikTok Shop (ngành làm đẹp)** | Shopee: bộ lọc + voucher + livestream. TikTok Shop: livestream + affiliate là động cơ tăng trưởng chính | Chatbot chỉ ở cấp người bán, không có tư vấn chuyên môn | Không cạnh tranh ở trục mua bốc đồng |

## 3.4. Zalo — hiện trạng và khoảng trống

- Zalo là kênh nhắn tin nội địa chủ đạo tại Việt Nam. Giám đốc Marketing L'Oréal Việt Nam từng phát biểu công khai: *"Zalo là kênh chúng tôi không thể bỏ qua."*
- **Mô hình phổ biến của nhà bán lẻ mỹ phẩm Việt:** Zalo OA cho chăm sóc khách hàng 1-1 + tin ZNS cho thông báo đơn hàng + Broadcast cho khuyến mãi. Có cả một lớp nền tảng trung gian thương mại hóa việc này (Subiz, eSMS, Nhanh.vn) — chứng tỏ nhu cầu rất phổ biến.
- ⭐⭐⭐ **Khoảng trống:** **chưa thấy nhà bán lẻ mỹ phẩm Việt Nam nào làm chuyển tiếp CÓ NGỮ CẢNH** — tức chuyển cả hồ sơ da + lịch sử hội thoại AI sang chuyên viên. Hiện tại khách **phải kể lại từ đầu**, chuyên viên mất 5–10 phút mỗi ca. **Đây là tính năng BeautyAI có thể làm tốt hơn cả Hasaki, với chi phí gần như bằng 0.**

**Đánh giá tính khả thi của từng kênh Zalo cho V1.0:**

| Kênh | Điều kiện | Khả thi cho V1.0? |
|---|---|---|
| **Deep link `zalo.me/<oa_id>`** + mã phiên hiển thị trên web | Chỉ cần có OA; không cần API, không quota, **chi phí 0** | ✅ **CHỌN DÙNG.** Đây là cách duy nhất làm được chuyển tiếp có ngữ cảnh mà không cần hạn mức API |
| **Zalo Chat Widget / Social Plugin** (nhúng JS) | Chỉ cần snippet, không cần backend | ✅ Dùng bổ trợ |
| **Broadcast** | Chỉ gửi người đã theo dõi OA; **tối đa 40 lượt/30 ngày**; không thu hồi được | 🔸 Could — không cần cho V1.0 |
| **ZNS (Zalo Notification Service)** | OA phải xác thực doanh nghiệp; **template phải được Zalo duyệt**; có phí/tin (~250–360₫); giới hạn ký tự chặt | ❌ **Không khả thi cho V1.0** |
| **Follow Up message** | Yêu cầu **đạt 50.000 tin ZNS VÀ có tối thiểu 5 cửa hàng** | ❌ Không khả thi |
| **OA API 2 chiều (webhook + gửi tin)** | Cần đăng ký ứng dụng trên cổng nhà phát triển + OA đã xác thực | 🔸 Phase 2 |

## 3.5. Trạng thái công nghệ AI (10/2026) — các quyết định rút ra

### Lựa chọn mô hình Gemini

| Nhiệm vụ | Mô hình đề xuất | Lý do |
|---|---|---|
| **Trợ lý hội thoại chính** | **Gemini Flash (dòng mới nhất có tier miễn phí)** | Đủ năng lực suy luận cho hội thoại nhiều lượt có grounding; có tier miễn phí |
| **Phân loại ý định, bóc tách & chuẩn hóa INCI, gắn nhãn sản phẩm** | **Gemini Flash-Lite** | Rẻ nhất trong nhóm có tier miễn phí; nhà cung cấp mô tả rõ là dành cho *tác vụ khối lượng lớn, dịch, xử lý dữ liệu đơn giản* |
| **Xử lý hàng loạt 8.494 sản phẩm (làm giàu dữ liệu)** | **Batch API** (giảm ~50% giá) | **Không gọi thời gian thực** cho tác vụ hàng loạt |

> ⚠️ **Ghi chú ngân sách bắt buộc:** giá Gemini API được nhà cung cấp thông báo **sẽ tăng từ cuối 2026 / đầu 2027**. Mọi con số chi phí trong tài liệu dự án phải ghi kèm **ngày truy cập** và được rà lại trước khi chốt ngân sách.

### Đầu ra có cấu trúc (structured output) — giới hạn phải thiết kế quanh

| Giới hạn | Hệ quả thiết kế |
|---|---|
| Chỉ hỗ trợ **một tập con** của JSON Schema; schema quá lớn/lồng sâu có thể bị từ chối | **Giữ schema phẳng.** Không lồng quá 2 cấp |
| Các ràng buộc `minLength`, `maxLength`, `minProperties`, `maxProperties` **bị bỏ qua, không được thực thi** | **Phải kiểm tra lại ở phía ứng dụng.** Không tin vào schema |
| **JSON hợp lệ không đảm bảo giá trị đúng** | **Phải đối chiếu mọi giá trị với database** — đặc biệt là mã sản phẩm (`BR-AI-15`) |
| `enum` được hỗ trợ cho chuỗi/số nguyên | ✅ Dùng để **ép đầu ra về taxonomy cố định** (vd `loại_da` chỉ nhận 5 giá trị hợp lệ) |

### Gọi hàm (function calling) — biện pháp chống bịa sản phẩm

> **Quyết định kiến trúc:** đặt chế độ gọi hàm ở mức **bắt buộc** với hàm `tim_san_pham(loai_da, van_de, ngan_sach, loai_tru_thanh_phan)`, để **ép mô hình luôn truy vấn danh mục thật thay vì tự sinh tên sản phẩm**. Đây là biện pháp chống "bịa sản phẩm" **hiệu quả nhất và rẻ nhất**, và là nền tảng kỹ thuật của `BR-AI-02` và `BR-AI-15`.

### Hạn mức & chi phí — rủi ro vận hành đã nhận diện

| Phát hiện | Hệ quả |
|---|---|
| Hạn mức tính **theo project, không theo khóa API**; số lượt/ngày reset theo múi giờ nhà cung cấp | **Tier miễn phí KHÔNG đủ cho buổi demo có nhiều người cùng thử.** Bắt buộc có: bộ nhớ đệm câu trả lời phổ biến + giới hạn tần suất phía ứng dụng + dự phòng nâng tier trước ngày demo (`RISK-03`) |
| **Context caching có thể đắt hơn không dùng cache** — một số dòng mô hình có phí lưu trữ tính theo giờ | Với lưu lượng nhỏ của dự án, phí lưu trữ có thể lớn hơn phần tiết kiệm. **Phải tính điểm hòa vốn trước khi bật** |
| Bộ lọc an toàn mặc định của nhà cung cấp có thể chặn hoặc làm nhẹ câu trả lời về mụn viêm, thuốc kê đơn, bệnh da | **Phải có bộ phân loại chặn trước (pre-filter):** nếu câu hỏi có dấu hiệu bệnh lý thì **không gọi mô hình**, mà trả về thông điệp cố định + khuyên gặp bác sĩ + nút Zalo (`BR-AI-03`) |

### Ràng buộc từ chính sách sử dụng AI của nhà cung cấp

| Điều khoản | Hệ quả thiết kế bắt buộc |
|---|---|
| Cấm **quyết định tự động** có thể gây hại đáng kể trong lĩnh vực chăm sóc sức khỏe **khi không có sự giám sát của con người** | ✅ **Phải có đường chuyển tiếp người thật** → chính là `FR-CHAT-07`. Đây là lý do thứ hai (sau pháp luật Việt Nam) khiến chuyển tiếp Zalo là **bắt buộc**, không phải tùy chọn |
| Cấm **tuyên bố chuyên môn gây hiểu nhầm** trong lĩnh vực nhạy cảm như sức khỏe | ✅ Nhân dạng trợ lý phải là **"trợ lý tư vấn sản phẩm"**, không phải "chuyên gia da liễu AI" → `BR-AI-14` |

## 3.6. Tổng hợp: BeautyAI đứng ở đâu

```text
                        CÓ TRÍ TUỆ THÀNH PHẦN
                                  ▲
                                  │
            SkinSort ●            │            ★ BeautyAI
            INCIDecoder ●         │              (vị trí nhắm tới)
                                  │
                                  │         ● Sociolla/SOCO
    KHÔNG BÁN HÀNG ◄──────────────┼──────────────► BÁN HÀNG
                                  │
                                  │    ● Hasaki    ● Watsons
            Yuka ●                │    ● TikTok Shop  ● Shopee
            Think Dirty ●         │    ● Beauty Box
                                  │
                                  ▼
                      KHÔNG CÓ TRÍ TUỆ THÀNH PHẦN
```

**Góc trên phải đang trống.** Không nền tảng nào vừa bán hàng tại Việt Nam, vừa có lớp trí tuệ thành phần thực sự (giải nghĩa INCI, phát hiện xung đột hoạt chất, xây routine theo hồ sơ da). Đó là vị trí BeautyAI nhắm tới, và là lý do dự án có ý nghĩa thương mại thật chứ không chỉ là bài tập.

---


---

## Benchmark Bổ Sung Từ Bản Phân Tích PRD v2.0
## 2. BENCHMARK ĐỐI THỦ & BÀI HỌC ÁP DỤNG

| Đối thủ | Điểm mạnh | Điểm hạn chế | Bài học tối ưu cho BeautyAI |
|---|---|---|---|
| **Hasaki.vn** | Logistics mạnh, giỏ hàng tối ưu, danh mục lớn. | Giao diện dày đặc banner, chưa có công cụ đọc hiểu chuyên sâu thành phần. | Học hỏi kiến trúc giỏ hàng, checkout nhanh; nâng cấp giao diện tinh gọn và trợ lý thành phần. |
| **Watsons VN** | Thương hiệu uy tín, hệ thống loyalty tốt. | Bộ lọc theo hoạt chất chưa sâu, ứng dụng di động còn độ trễ. | Tối ưu hóa bộ lọc Smart Filter (Vegan, Cruelty-free, Hoạt chất chính). |
| **Incidecoder** | Cơ sở dữ liệu thành phần chuẩn xác, phân tích chi tiết. | Trang tra cứu thuần túy, không có tính năng thương mại điện tử và mua sắm. | Tích hợp bảng giải nghĩa thành phần khoa học trực tiếp vào trang chi tiết sản phẩm (PDP). |
| **Olive Young** | Thiết kế phẳng tối giản, thời thượng, chuẩn Gen Z. | Rào cản ngôn ngữ và vận chuyển quốc tế đối với người dùng Việt Nam. | Áp dụng ngôn ngữ thiết kế Flat & Clean, thẻ tag trực quan và trải nghiệm xem sản phẩm sang trọng. |

---


