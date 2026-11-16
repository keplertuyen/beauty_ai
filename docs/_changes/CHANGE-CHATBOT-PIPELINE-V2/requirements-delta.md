---
doc: requirements-delta
title: Requirements Delta — CHANGE-CHATBOT-PIPELINE-V2
status: draft
precedence: 3
owner: ba
last_reviewed: 2026-11-09
---

# Requirements Delta — CHANGE-CHATBOT-PIPELINE-V2

> Thuật ngữ chuẩn hóa trong toàn bộ tài liệu thuộc phạm vi Trợ lý AI (`requirements.md`, `docs/_requirements/M12.md`, `docs/domain-rules.md`, `docs/llm-policy.md`):
> - **Khối dữ liệu & ETL Offline:** quy trình nạp và tổng hợp dữ liệu từ CSV vào PostgreSQL (chạy offline, 0 token).
> - **Chặng `C0`…`C9` (`C9a` đồng bộ, `C9b` bất đồng bộ):** các bước xử lý tuần tự theo đúng thứ tự thực thi của một lượt chat lúc runtime.
> - **Nguồn trả lời (`ChatResponseSource`):** một trong 6 giá trị Enum đóng: `RULE` · `CACHE` · `LLM` · `TEMPLATE` · `CLARIFY` · `HANDOFF` (cùng trạng thái chặn sớm `RATE_LIMITED` tại `C0`).
>
> Từ `"Tầng 1 / Tầng 2 / Tầng 3"` trong các mục của Trợ lý AI được thay thế đồng bộ bằng `"Nguồn trả lời"`.

---

## 0. Xử lý mâu thuẫn trong tài liệu hiện hành (`BO-05` & `D14 = 14B`)

1. **Cách tính chỉ tiêu `BO-05` theo cấp Hội thoại & Điều kiện đóng phiên (`requirements.md` vs `llm-policy.md §9.4`):**
   - **Khi nào một phiên hội thoại được coi là kết thúc (đóng):** khi khách chủ động đóng/tạo mới phiên, hoặc sau **`session_inactivity_timeout_minutes` (mặc định `30 phút`, cấu hình trong `app_settings`)** không có tin nhắn mới. Chỉ các phiên đã đóng mới được đưa vào phép tính `BO-05`.
   - **Định nghĩa chuẩn hóa (`BO-05`):** Một **hội thoại đã đóng** được tính vào **tử số** (*"Giải quyết tự động thành công không cần chuyển người"*) khi thỏa mãn đồng thời 3 điều kiện:
     1. Có **ít nhất 1 lượt trả lời thực chất** thuộc nguồn `RULE`, `CACHE`, `LLM`, hoặc `TEMPLATE`, **VÀ**
     2. **Không có bất kỳ lượt nào** thuộc nguồn `HANDOFF` trong suốt hội thoại, **VÀ**
     3. Lượt cuối cùng của hội thoại **không phải** là một câu hỏi `CLARIFY` bị khách bỏ dở (nếu phiên đóng lại sau 30 phút không hoạt động mà lượt cuối cùng vẫn là `CLARIFY` và chưa có lượt trả lời thực chất nào, phiên đó được gắn nhãn `ABANDONED_AT_CLARIFY`, vẫn nằm trong **mẫu số** nhưng **không** được tính vào tử số của `BO-05`).
   - **Mẫu số của `BO-05`:** Tổng số hội thoại đã đóng có ít nhất 1 lượt vượt qua `C0` (các lượt bị chặn ở `C0` với `RATE_LIMITED` được đếm riêng vào `rate_limited_turn_count` và loại khỏi mẫu số).
   - Mục tiêu `BO-05`: `Số hội thoại giải quyết tự động thành công / Tổng số hội thoại hợp lệ đã đóng >= 60%`.
   - Đo riêng chỉ số tiết kiệm chi phí theo lượt: `llm_free_turn_rate` = `(Số lượt RULE + CACHE + TEMPLATE) / Tổng số lượt vượt qua C0`.
2. **Phạm vi Ngôn ngữ & Tiền tệ của Chatbot ở Phase 1 (`D14 = 14B`):**
   - Trong Phase 1, Chatbot hiển thị **100% bằng Tiếng Anh (`en`) và USD (`$`)**, khớp với banner tại `docs/llm-policy.md:15` và giao diện hiện tại của nền tảng.
   - Giữ nguyên banner tại `docs/llm-policy.md:15`, chỉ bổ sung ghi chú: **Các bộ lọc an toàn (`C1` che PII, `C4` bộ chặn y tế, `C9a` bộ lọc tuân thủ) vẫn quét song ngữ Anh + Việt (`en` + `vi`) ngay ở V1** để bảo vệ người dùng Việt Nam khi gõ tiếng Việt vào giao diện tiếng Anh.
   - Các bảng template (`intro_templates`, `reason_code_templates`, `clarifying_question_templates`) giữ cột `locale` trong lược đồ DB, nhưng ở V1 **chỉ nạp và kiểm thử dữ liệu `locale = 'en'`**.
   - Từ điển `slang_dictionary` ở `C0` và bộ mẫu `IntentRouter` ở `C5` chỉ nạp tiếng Anh ở V1.
   - Chỉ cập nhật `docs/prompt/01_gemini_advisor_en.md` theo JSON Schema đầu ra mới `{ scope, items[] }`; giữ nguyên `docs/prompt/02_gemini_advisor_vi.md` ở trạng thái dự thảo cho Phase 2.
   - *(Ghi chú phạm vi: các yêu cầu song tệ/ngôn ngữ cấp toàn nền tảng như `ASM-08`, `CON-09`, `U6`, `M10`, `BR-PRICE-01`, `E2E-02`, `E2E-07` sẽ được đối chiếu trong một change riêng cấp nền tảng, không sửa trong change chatbot này).*

---

## ADDED Requirements

### FR-CHAT-14 — Tách biệt `text_norm` (trong RAM) và `text_masked` (Che PII tại Chặng C1 có Allowlist chống che nhầm)
- **Priority:** Must
- **Description:**
  - Tại `C0`, hệ thống tạo `text_norm` (chữ thường, bỏ dấu, bỏ ký tự chèn, mở rộng từ viết tắt theo `slang_dictionary`) **chỉ lưu trong bộ nhớ tạm của request (RAM)** để phục vụ các bước khớp rule nội bộ (`C2`, `C4 Lớp A`, `C5 RULE`).
  - Tại `C1`, hệ thống tạo `text_masked` bằng cách thay thế PII trong văn bản tự do bằng nhãn ẩn danh. **Mọi thành phần bên ngoài bộ khớp rule nội bộ** — bao gồm `C4 Lớp B`, `C6 (Khóa Cache)`, `C7 (LLM)`, `C9b (Ghi DB chat_turns & Log)` — **chỉ được phép nhận `text_masked`**. Văn bản gốc và `text_norm` tuyệt đối không bao giờ được ghi xuống đĩa, cache hay gửi qua mạng.
  - Phạm vi phát hiện PII ở V1 (theo thứ tự ưu tiên khớp):
    1. **Mã đơn hàng (`Order Code`):** Regex `\bBA-\d{8}-\d{4}\b` (không phân biệt hoa thường, ví dụ `BA-20261021-0042` theo `GC-07`) → thay bằng `[MA_DON]`.
    2. **Mã chuyển tiếp chuyên viên (`Handoff Code`):** Regex `\bBA-[0-9A-HJKMNP-TV-Z]{4}\b` (4 ký tự Crockford Base32 theo §9.9, ví dụ `BA-7F3K`) → thay bằng `[MA_CHUYEN_TIEP]`.
    3. **SĐT Việt Nam & quốc tế:** `(?:\+?84|0)(?:3|5|7|8|9)\d{8}` và định dạng SĐT quốc tế phổ biến → thay bằng `[SDT]`.
    4. **Email:** Regex chuẩn → thay bằng `[EMAIL]`.
    5. **CCCD/CMND/SSN:** 9 hoặc 12 chữ số đứng riêng → thay bằng `[ID]`.
    6. **Địa chỉ:** Theo từ khóa (`số nhà`, `đường`, `phường`, `quận`, `street`, `apt`, `avenue`) → thay bằng `[DIA_CHI]`.
    7. **Họ tên người dùng:** → thay bằng `[TEN]`:
       - **Cách 1 (Khớp hồ sơ tài khoản):** Khớp họ tên đầy đủ và tên gọi lấy từ hồ sơ tài khoản của người đang đăng nhập (theo ranh giới từ, không phân biệt dấu, nhưng loại trừ các từ nằm trong `PiiStopwordAllowlist`).
       - **Cách 2 (Khớp cụm dẫn có kiểm tra Viết hoa & Allowlist):**
         - Cụm dẫn tiếng Anh (`\b(?:[Mm]y name is|[Cc]all me|[Ii] am|[Ii]'m)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){0,2})\b`) và tiếng Việt (`\b(?:[Mm]ình tên(?:\s+là)?|[Tt]ôi tên(?:\s+là)?|[Ee]m tên(?:\s+là)?|[Tt]ên\s+(?:mình|tôi|em|chị|anh)\s+là)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){0,2})\b`).
         - **Điều kiện bắt buộc:** Từ bị bắt sau cụm dẫn **phải bắt đầu bằng chữ cái viết hoa (`[A-ZÀ-Ỹ]`)** VÀ **không nằm trong danh sách loại trừ chuyên ngành (`PiiStopwordAllowlist`)** gồm: các từ chỉ loại da (`Oily`, `Dry`, `Combination`, `Normal`, `Sensitive`), vấn đề/tình trạng (`Acne`, `Allergic`, `Pregnant`, `Breastfeeding`, `Redness`, `Aging`, `Looking`, `Using`, `Wondering`), tên hoạt chất INCI và tên thương hiệu.
- **Acceptance Criteria:**
  - `AC-14-01`: GIVEN message `"Where is my order BA-20261021-0042? My phone is 0912 345 678 and handoff code is BA-7F3K"` WHEN processed THEN `C5 (RULE - QUERY_ORDER)` extracts `BA-20261021-0042` from in-memory `text_norm` and checks `orders.user_id == ctx.UserId`, WHILE `text_masked` persisted in `chat_turns` and logs is `"Where is my order [MA_DON]? My phone is [SDT] and handoff code is [MA_CHUYEN_TIEP]"`.
  - `AC-14-02`: GIVEN message `"I am Sarah and I am allergic to fragrance, I have Oily skin"` WHEN processed by `C1` THEN `"Sarah"` is masked as `[TEN]` while `"allergic"` and `"Oily"` remain intact: `"I am [TEN] and I am allergic to fragrance, I have Oily skin"`.
  - `AC-14-03`: GIVEN logged-in user with profile name `"Nguyễn Thị Lan"` sending `"lan bi mun an"` WHEN calling `C4 Layer B` or `C7` THEN the outbound payload contains `"[TEN] bi mun an"`.
  - `AC-14-04`: GIVEN any chat turn WHEN logged THEN only `pii_masked_count` per category is recorded, never raw PII values.

### FR-CHAT-15 — Trạng thái phiên có cấu trúc, Quy tắc tra cứu `QUERY_PRODUCT` & Reset `consecutive_fallback_count`
- **Priority:** Must
- **Description:**
  - Mỗi phiên lưu `chat_session_state` gồm:
    - `sessionSlots`: `{ skinType, isSensitive, concerns[], routineStep, budgetBand, avoidIngredients[] }` (trong đó `routineStep` thuộc Enum: `CLEANSER` | `TONER` | `EXFOLIANT` | `SERUM_TREATMENT` | `MOISTURIZER` | `SUNSCREEN` | `MASK_LIP`).
    - `lastShownProducts[]`: tối đa 5 mục vừa hiển thị ở lượt trước (`{ ref: 1..5, productId, routineStep }`).
    - Bộ đếm: `consecutive_clarify_count`, `session_clarify_count`, và `consecutive_fallback_count`.
  - **Quy tắc tăng và reset `consecutive_fallback_count`:**
    - Khởi tạo = `0`. Tăng thêm `1` khi lượt chat rơi vào nguồn `TEMPLATE` mà không tìm được sản phẩm nào (0 sản phẩm) hoặc khi hệ thống không trả lời được câu hỏi.
    - **Reset về `0`** ngay khi có một lượt trả về thành công ít nhất 1 sản phẩm hợp lệ (từ `RULE`, `CACHE`, `LLM`, hoặc `TEMPLATE`) hoặc trả lời thành công một ý định `NON_PRODUCT_MODE` (`QUERY_INGREDIENT`, `QUERY_ORDER`, `QUERY_POLICY`, `GREETING`).
  - **Quy tắc khớp sản phẩm ở `C5` (`RULE - QUERY_PRODUCT`):**
    1. **Khi câu hỏi dùng đại từ / số thứ tự (`is_context_dependent == true`, ví dụ *"Is the second one in stock?"*, *"How much is that one?"*):**
       - Nếu khách nêu rõ số thứ tự (`ref = k`) có trong `lastShownProducts`, hoặc nói *"that one / this one"* khi `lastShownProducts` chỉ có **đúng 1 sản phẩm** → phân giải ra `productId` và chuyển sang `C8 (PRODUCT_LOOKUP_MODE)`.
       - Nếu `lastShownProducts` có ≥ 2 sản phẩm mà khách không nêu rõ cái nào hoặc danh sách rỗng → chuyển xuống `C7 (LLM)` / `CLARIFY`.
    2. **Khi câu hỏi nêu tên sản phẩm trực tiếp (ví dụ *"How much is CeraVe Cleanser?"*, *"Is Gentle Hydra-Gel Face Cleanser in stock?"*):**
       - So khớp độ tương đồng văn bản (`pg_trgm` / chuẩn hóa tên sản phẩm + thương hiệu trong bảng `products`):
       - **Trường hợp 1 (Khớp duy nhất 1 sản phẩm với điểm `≥ product_lookup_min_score` mặc định `0.85`, cách biệt với sản phẩm thứ hai `≥ 0.15`):** chuyển `productId` đó sang `C8 (PRODUCT_LOOKUP_MODE)` (0 token).
       - **Trường hợp 2 (Khớp từ 2 đến 3 biến thể gần nhau với điểm `≥ 0.75`, ví dụ bản Full-size và bản Travel-size của cùng một sản phẩm):** chuyển cả 2–3 biến thể đó sang `C8 (PRODUCT_LOOKUP_MODE)` để hiển thị giá và tồn kho của từng dung tích cho khách (0 token).
       - **Trường hợp 3 (Không có sản phẩm nào đạt `0.75` hoặc có `> 3` sản phẩm trùng tên mơ hồ):** không đoán ở `RULE`, chuyển xuống `C6`/`C7 (LLM)`.
- **Acceptance Criteria:**
  - `AC-15-01`: GIVEN previous turn displayed `[ref 1: P504322, ref 2: P420652]` WHEN user asks `"How much is the second one?"` THEN `C5 (RULE)` resolves `P420652` and returns its exact DB price via `C8 (PRODUCT_LOOKUP_MODE)` (0 tokens).
  - `AC-15-02`: GIVEN user asks `"How much is Kasbah Eau de Parfum?"` which matches both the 100 mL bottle (`P473660`) and the 7.5 mL travel spray (`P473661`) with score `≥ 0.75` WHEN processed at `C5` THEN both variants are returned via `C8 (PRODUCT_LOOKUP_MODE)` with their exact DB prices and stock statuses.
  - `AC-15-03`: GIVEN `consecutive_fallback_count = 1` from a previous empty turn WHEN the current turn successfully returns products or answers `QUERY_POLICY` THEN `consecutive_fallback_count` resets to `0`.

### FR-CHAT-16 — Câu hỏi làm rõ qua Enum đóng, Payload Nút chọn nhanh có cấu trúc & Giới hạn chống lặp (`CLARIFY`)
- **Priority:** Must
- **Description:**
  - Tool `ask_clarifying_question` chỉ nhận tham số `missing_slot` thuộc Enum đóng: `SKIN_TYPE` | `PRIMARY_CONCERN` | `ROUTINE_STEP` | `BUDGET_BAND`. **Tool không có trường văn bản tự do.**
  - Câu hỏi hiển thị và danh sách nút chọn nhanh (`quickReplies[]`) được `C8` lấy từ bảng `clarifying_question_templates` theo `(missing_slot, locale = 'en')`.
  - **Cấu trúc bắt buộc của mỗi nút chọn nhanh (`QuickReplyOption`):**
    ```json
    {
      "label": "Oily Skin",
      "slot": "SKIN_TYPE",
      "value": "OILY"
    }
    ```
    Khi khách bấm vào nút chọn nhanh trên giao diện, frontend gửi kèm `selectedSlot: { slot: "SKIN_TYPE", value: "OILY" }` trong `ChatRequest`. Tại `C0`, hệ thống ghi nhận trực tiếp giá trị Enum này vào `sessionSlots` (độ chính xác 100%, không cần dùng LLM phân tích câu trả lời của nút bấm) và reset `consecutive_clarify_count = 0`.
  - **Hai bộ đếm giới hạn hỏi lại:**
    - `consecutive_clarify_count` (khởi tạo = `0`, tăng `1` mỗi lượt trả về `CLARIFY`, reset về `0` khi khách cung cấp thêm ít nhất 1 slot hợp lệ qua nút bấm hoặc văn bản): chỉ cho phép trả về `CLARIFY` khi `consecutive_clarify_count < 2` (tối đa **2 lần hỏi lại liên tiếp**).
    - `session_clarify_count` (khởi tạo = `0`, tăng `1` mỗi lượt trả về `CLARIFY`, không reset trong phiên): chỉ cho phép trả về `CLARIFY` khi `session_clarify_count < 4` (tối đa **4 lần hỏi lại trong toàn phiên**).
  - Khi `consecutive_clarify_count >= 2` hoặc `session_clarify_count >= 4`: trước khi gọi `C7`, hệ thống **loại bỏ `ask_clarifying_question` khỏi `allowed_function_names`**. Nếu LLM vẫn không trả được kế hoạch hợp lệ, hệ thống chuyển thẳng sang nguồn `TEMPLATE`.
- **Acceptance Criteria:**
  - `AC-16-01`: GIVEN `consecutive_clarify_count = 0` and user asks `"Recommend something for my face"` (missing `routineStep` and `skinType`) WHEN LLM calls `ask_clarifying_question(missing_slot: "SKIN_TYPE")` THEN response contains `quickReplies` with structured `{ label, slot: "SKIN_TYPE", value }` items, and both counters increment to `1`.
  - `AC-16-02`: GIVEN user clicks quick reply `{ label: "Oily Skin", slot: "SKIN_TYPE", value: "OILY" }` WHEN request arrives at `C0` THEN `sessionSlots.skinType` is set to `OILY` deterministically and `consecutive_clarify_count` resets to `0`.
  - `AC-16-03`: GIVEN `consecutive_clarify_count = 2` or `session_clarify_count = 4` WHEN user sends another vague message THEN `ask_clarifying_question` is disabled and the turn routes to `TEMPLATE`.

### FR-CHAT-17 — Nguồn trả lời `TEMPLATE` (Đường lui 0-Token có lọc `routineStep` và ngưỡng `review_count`)
- **Priority:** Must
- **Description:**
  - Được kích hoạt khi: ① `llmAllowed == false` (hết hạn mức ở `C3`), ② mô hình ở `C7` bị lỗi, timeout (> 8s), hoặc trả JSON hỏng sau 1 lần thử lại, ③ chạm trần hỏi làm rõ ở `FR-CHAT-16`, hoặc ④ kết quả gợi ý sản phẩm (`RECOMMEND_MODE`) sau khi lọc ở `C8` bị rỗng (0 sản phẩm).
  - Hệ thống lấy `sessionSlots` (bao gồm cả **`routineStep`**, `skinType`, `concerns[]`, `budgetBand`, `avoidIngredients[]`) kết hợp với bộ trích xuất slot bằng rule từ `text_norm` (ví dụ phát hiện từ `"cleanser"` → `routineStep = CLEANSER`).
  - Truy vấn PostgreSQL lấy Top 3 sản phẩm từ `product_skin_stats` kết hợp bảng `products`:
    - Bắt buộc khớp `routineStep` (nếu đã biết), còn hàng (`out_of_stock == 0`), trong `budgetBand`, và không chứa chất trong `AllergyBlacklist`.
    - **Ngưỡng số lượng đánh giá tối thiểu (`min_reviews_for_skin_stat`, mặc định `10` trong `app_settings`):** ưu tiên sắp xếp theo `recommend_rate DESC, review_count DESC` đối với các sản phẩm có `review_count >= 10` ở nhóm da đó. Nếu chưa đủ 3 sản phẩm đạt ngưỡng `review_count >= 10`, lấy bù các sản phẩm còn lại trong cùng `routineStep` sắp xếp theo điểm đánh giá tổng thể `products.rating DESC, products.reviews DESC`.
  - Đưa danh sách ứng viên qua `C8 (RECOMMEND_MODE)` → `C9a`. Nếu vẫn còn 0 sản phẩm, trả thông báo chuẩn từ mẫu cố định và tăng `consecutive_fallback_count` (khi `consecutive_fallback_count >= 2` thì chuyển sang nguồn `HANDOFF`).
- **Acceptance Criteria:**
  - `AC-17-01`: GIVEN LLM returns HTTP 503 and user with `skinType = OILY` asks `"Recommend a cleanser under $25"` WHEN `TEMPLATE` executes THEN it extracts `routineStep = CLEANSER`, filters to cleansers ≤ $25 with `review_count >= 10` for oily skin sorted by `recommend_rate DESC`, and returns 3 cleansers via `C8`.
  - `AC-17-02`: GIVEN product A has `recommend_rate = 1.0` with `review_count = 1` and product B has `recommend_rate = 0.90` with `review_count = 50` WHEN `TEMPLATE` ranks candidates THEN product B ranks above product A.

### FR-CHAT-18 — Mở rộng Phản hồi 👍/👎 (`FR-CHAT-13`) thành Vòng lặp cải thiện Rule
- **Priority:** Should
- **Description:** Mở rộng `FR-CHAT-13`: mỗi lượt trả lời lưu đánh giá vào bảng `chat_feedback` (`turn_id`, `source`, `intent`, `is_helpful`, `reason`, không lưu `userId`). Các câu hỏi ở nguồn `LLM` lặp lại nhiều lần và có tỉ lệ 👍 cao được gom nhóm làm ứng viên tạo `RULE` mới trên Admin Console (trạng thái `PENDING`, chỉ kích hoạt khi Admin duyệt).
- **Acceptance Criteria:**
  - `AC-18-01`: GIVEN user submits 👎 feedback THEN a `chat_feedback` record is saved with no `userId`.
  - `AC-18-02`: GIVEN a candidate `RULE` intent is suggested THEN it remains `PENDING` and inactive in `C5` until Admin approves it.

### FR-CHAT-19 — Giới hạn tốc độ chống spam không dùng LLM ở Chặng C0 (`RateLimiter`) & Bộ đếm `rate_limited_turn_count`
- **Priority:** Must
- **Description:** Ngay tại `C0` (trước khi chạy `C1`..`C9`), hệ thống kiểm tra bộ giới hạn tốc độ cửa sổ trượt trong bộ nhớ theo `sessionId` và địa chỉ IP: mặc định tối đa `5 tin nhắn / 10 giây` và `30 tin nhắn / 5 phút` (đặt trong `app_settings`). Nếu vượt ngưỡng, **tăng bộ đếm `rate_limited_turn_count` trong bộ nhớ** và trả ngay phản hồi tĩnh `RATE_LIMITED` yêu cầu chờ vài giây (0 token, 0 truy vấn DB).
- **Acceptance Criteria:**
  - `AC-19-01`: GIVEN a single IP sends 6 messages within 3 seconds WHEN the 6th message arrives at `C0` THEN `rate_limited_turn_count` increments by 1 and the request is rejected with source `RATE_LIMITED` without invoking `C4` or `C7`.

### NFR-OBS-07 — Đo lường chi tiết từng chặng & Tách ghi bất đồng bộ tại `C9b`
- **Priority:** Must
- **Description:**
  - Tách Chặng 9 thành **`C9a` (Đồng bộ — `AdvertisingComplianceFilter`)** và **`C9b` (Bất đồng bộ — Ghi `chat_turns`, `chat_session_state`, `PlanCache` và Telemetry qua hàng đợi trong bộ nhớ `Channel<ChatTurnTelemetry>`)** để việc ghi DB/log không làm chậm thời gian trả kết quả cho khách.
  - Ghi nhận đầy đủ: `source` (`RULE` | `CACHE` | `LLM` | `TEMPLATE` | `CLARIFY` | `HANDOFF` | `RATE_LIMITED`), độ trễ `latency_ms` của từng chặng `C0`–`C9a`, kết quả tra cache (`hit` | `miss` | `bypassed_context` | `evicted_empty`), `tokens`, `estimated_cost_usd`, `dropped_product_ids_count`, `dropped_reason_codes_count`, `dropped_paired_product_count`, kết quả bộ chặn y tế `medical_guard_result` (`CLEAN` | `BLOCK_LAYER_A` | `GREY_PASS_LAYER_B` | `GREY_BLOCK_LAYER_B` | `GREY_FAIL_CLOSED`), `pii_masked_count`, và `rate_limited_turn_count`.
- **Acceptance Criteria:**
  - `AC-OBS7-01`: GIVEN Admin opens the dashboard THEN `grey_zone_rate`, `grey_zone_fail_closed_rate`, `cache_hit_rate`, `llm_free_turn_rate`, `rate_limited_turn_count`, and closed-session `BO-05` resolution rate are displayed.

---

## MODIFIED Requirements

### FR-CHAT-01 (`AC-03`) & NFR-PERF-08 — Bỏ streaming token thô, thay bằng chỉ báo tiến trình tức thì
- **Current behavior:** Thời gian tới ký tự đầu tiên ≤ 2 giây; hiển thị theo luồng (streaming) bắt buộc.
- **New behavior:**
  - Không stream token thô từ LLM trước khi hoàn tất đối chiếu DB ở `C8` và lọc từ cấm ở `C9a`.
  - Trong **≤ 300ms** kể từ khi gửi tin nhắn, giao diện hiển thị chỉ báo tiến trình theo giai đoạn (*"Searching catalog..."* → *"Verifying ingredient safety..."*).
  - Thời gian phản hồi hoàn tất toàn trình (end-to-end) cho lượt có gọi LLM (`C7`): **p50 ≤ 3.5 giây, p95 ≤ 6.0 giây**, thời gian chờ tối đa giữ nguyên **8.0 giây** (`NFR-PERF-09`).
- **Acceptance Criteria changes:**
  - `AC-PERF8-NEW`: GIVEN user sends a query handled by `C7 (LLM)` THEN stage indicator appears in `≤ 300ms` and the complete validated response renders with `p95 ≤ 6.0s`.

### FR-CHAT-07 & llm-policy §9.9 — Làm rõ Nguồn `HANDOFF` là Đề nghị kèm Xác nhận đồng ý
- **Current behavior:** Sơ đồ trước đó ghi tắt tại node `HANDOFF` là *"Sinh mã BA-XXXX"*.
- **New behavior:**
  - Khi một lượt chat kết thúc ở nguồn `HANDOFF`, phản hồi trả về ở `C9a` **chỉ gồm thông điệp cố định** (kèm `urgentAdviceText` nếu là tình huống cấp cứu) và **nút mở bước xem trước chuyển tiếp (`POST /chat/handoff/preview`)**, đặt `handoffSuggested = true` và `routineSteps = []`.
  - Mã bàn giao 4 ký tự `BA-XXXX` và bản ghi `handoff_requests` **chỉ được sinh ra sau khi** khách xem danh sách dữ liệu tại `/chat/handoff/preview`, tự tích chọn việc chia sẻ hồ sơ da (`includeProfile`) và bấm xác nhận tại `POST /chat/handoff/confirm`.

### FR-CHAT-12 — Xóa lịch sử hội thoại xóa dây chuyền `chat_session_state` và `chat_feedback`
- **Current behavior:** Xóa phiên hội thoại chưa quy định rõ các bảng trạng thái và phản hồi mới.
- **New behavior:** Khi xóa một phiên hội thoại (do khách yêu cầu ở `AC-02` hoặc tác vụ dọn dẹp 90 ngày ở `AC-03`), hệ thống xóa dây chuyền (`ON DELETE CASCADE`) toàn bộ bản ghi thuộc phiên đó trong `chat_turns`, `chat_session_state`, và `chat_feedback`.
- **Acceptance Criteria changes:**
  - `AC-12-NEW-1`: GIVEN a session has rows in `chat_sessions`, `chat_turns`, `chat_session_state`, and `chat_feedback` WHEN the session is deleted THEN all 4 tables contain 0 rows for that session.

### BR-AI-01 — Đường ống C0–C9, 6 Nguồn trả lời & Bất biến `INV-13` (có ngoại lệ `RATE_LIMITED`)
- **Current behavior:** Định tuyến 3 tầng (Tầng 1 Rules → Tầng 2 Gemini → Tầng 3 Zalo).
- **New behavior:**
  - Thay thế thuật ngữ "Tầng" bằng **Chặng thực thi `C0`–`C9`** và **6 Nguồn trả lời (`ChatResponseSource`)**: `RULE`, `CACHE`, `LLM`, `TEMPLATE`, `CLARIFY`, `HANDOFF` (cùng trạng thái chặn spam `RATE_LIMITED` ở `C0`).
  - Bắt yêu cầu gặp người thật (`REQUEST_HANDOFF`) bằng rule ngay tại **`C2`** (trước cả `QuotaGuard` và Bộ chặn y tế `C4`).
  - **Bất biến `INV-13`:** Mọi lượt chat vượt qua bộ chặn spam `C0` (`RULE`, `CACHE`, `LLM`, `TEMPLATE`, `CLARIFY`, `HANDOFF`) đều **bắt buộc** đi qua `C9a (AdvertisingComplianceFilter)`, và mọi nguồn `RULE`, `CACHE`, `LLM`, `TEMPLATE`, `CLARIFY` đều **bắt buộc** đi qua `C8 (GroundingValidator & Cá nhân hóa)` trước `C9a`. **Ngoại lệ duy nhất là `RATE_LIMITED` tại `C0`**.

### BR-AI-05 & BR-AI-06 — Hạn mức (`QuotaGuard` ở C3) và Suy giảm có kiểm soát
- **Current behavior:** Vượt hạn mức hoặc lỗi Gemini thì chỉ thử Tầng 1, nếu không khớp thì đề nghị Zalo ngay.
- **New behavior:**
  - `QuotaGuard` chạy ở **`C3` (trước `C4` Bộ chặn y tế)** và đặt cờ `llmAllowed` kiểm soát cả mô hình phân loại nhẹ ở `C4` lẫn mô hình hội thoại chính ở `C7`.
  - Khi hết hạn mức hoặc lỗi LLM, hệ thống đi theo chuỗi suy giảm: `RULE` (`C5`) → `CACHE` (`C6`) → `TEMPLATE` (`FR-CHAT-17`). Chỉ chuyển sang `HANDOFF` khi `TEMPLATE` thất bại 2 lượt liên tiếp hoặc khi câu hỏi rơi vào Vùng xám y tế ở `C4` mà không có `llmAllowed`.

### BR-AI-07 & BR-AI-16 & llm-policy §9.5/§9.6 — Công tắc `AllowAiSharing` (`FR-SKIN-07`, `GC-17`) và Công thức Khóa Cache nhất quán (`D7`)
- **Current behavior:** Khóa cache chưa đồng nhất với `SafeLlmContext` khi `AllowAiSharing == false` nhưng có `sessionSlots`.
- **New behavior:**
  1. **Cách tạo `SafeLlmContext` tại `C1` (`DeIdentificationService`):**
     - Khi `AllowAiSharing == false` (mặc định TẮT) hoặc khách chưa đăng nhập: `SafeLlmContext` **tuyệt đối không đọc** `AccountSkinProfile` hay `AccountAllergyBlacklist` đã lưu trong tài khoản; nó **chỉ chứa các trường từ `sessionSlots`** do khách tự nêu trong phiên hiện tại (`skinType`, `isSensitive`, `concerns[]`, `routineStep`, `budgetBand`, `avoidIngredients[]`).
     - Khi `AllowAiSharing == true`: `SafeLlmContext` hợp nhất `AccountSkinProfile` + `AccountAllergyBlacklist` (chỉ lấy tên INCI) với `sessionSlots` (trong đó `sessionSlots` ghi đè nếu khách đổi tiêu chí tạm thời trong phiên).
  2. **Công thức Khóa Cache nhất quán tại `C6` (`PlanCache`):**
     - Khóa cache **luôn băm từ chính đối tượng `SafeLlmContext` thực sự gửi cho LLM** (hoặc chuỗi `"NO_PROFILE"` nếu mọi trường trong `SafeLlmContext` đều trống):
       ```text
       serialized_context = SafeLlmContext.IsEmpty
           ? "NO_PROFILE"
           : CanonicalSerialize(
               SafeLlmContext.SkinType,
               SafeLlmContext.IsSensitive,
               sort(SafeLlmContext.Concerns),
               SafeLlmContext.RoutineStep,
               SafeLlmContext.BudgetBand,
               sort(SafeLlmContext.AvoidIngredients)
             )
       cache_key = SHA256(
           text_masked_normalized
         | serialized_context
         | locale
         | prompt_version
         | catalog_version
       )
       ```
     - Nhờ công thức này: nếu khách tắt `AllowAiSharing` nhưng nói *"I have oily skin"* ở lượt 1 (`sessionSlots.skinType = OILY`) rồi hỏi *"recommend a cleanser"* ở lượt 2, `serialized_context` chứa `skinType = OILY` chứ không phải `"NO_PROFILE"`, nên không bao giờ trả nhầm kế hoạch của da dầu cho khách da khô.
  3. **Kiểm tra an toàn nội bộ tại `C8` (`AllergyMatcher` trên máy chủ BeautyAI):**
     - Vì `C8` chạy 100% nội bộ trên PostgreSQL của BeautyAI, `AllergyMatcher` ở `C8` **luôn kiểm tra hợp nhất của `AccountAllergyBlacklist` (nếu đã đăng nhập) và `sessionSlots.avoidIngredients`** theo đúng `BR-SKIN-05`.
     - Chỉ xóa (`evict`) mục cache ở `C6` khi sản phẩm hết hàng/ẩn trong DB hoặc vi phạm điều kiện nằm trong chính `SafeLlmContext` đã tạo ra khóa cache đó.
- **Acceptance Criteria changes:**
  - `AC-16-NEW-1 (GC-17)`: GIVEN logged-in user has account profile `SkinType = DRY`, `AllergyBlacklist = ["retinol"]`, with `AllowAiSharing = false` and empty `sessionSlots` WHEN calling `C7` THEN outbound `SafeLlmContext` is empty (`HasProfile = false`) and `cache_key` uses `"NO_PROFILE"`, WHILE at `C8` products containing `retinol` are still filtered/flagged locally.
  - `AC-16-NEW-2`: GIVEN User A (`AllowAiSharing = false`, stated `skinType = OILY` in turn 1) and User B (`AllowAiSharing = false`, stated `skinType = DRY` in turn 1) both ask `"Recommend a cleanser"` in turn 2 WHEN `C6` computes `cache_key` THEN `cache_key(A) != cache_key(B)`.

### BR-AI-10 — Bỏ trường `intro` tự do & 3 Chế độ xử lý tại Chặng C8 (`GroundingValidator`)
- **Current behavior:** Cho phép LLM sinh `NarrativeText` tự do, chưa kiểm tra dị ứng cho sản phẩm mua kèm, và chưa tách chế độ tra cứu sản phẩm lẻ (`RULE`) với chế độ gợi ý sản phẩm.
- **New behavior:**
  - Schema đầu ra của LLM ở Pha 2 (`C7`) chỉ gồm `{ scope: "IN_SCOPE | OUT_OF_SCOPE", items: [{ productId, reasonCodes[] }] }` (bỏ hoàn toàn trường `intro` tự do ở V1).
  - Tại **`C8` (`GroundingValidator & Cá nhân hóa`)**, hệ thống xử lý theo **3 chế độ dựa trên `(source, intent)`**:
    1. **Chế độ 1 — `RECOMMEND_MODE` (Áp dụng cho `CACHE`, `LLM`, `TEMPLATE`):**
       - **`C8.1` (Chọn ứng viên mua kèm):** Từ các `productId` chính, tra `apriori_pairs` lấy tối đa 1 sản phẩm mua kèm khác bước routine có `confidence` và `lift` cao nhất (`FREQUENTLY_PAIRED`).
       - **`C8.2` (Đọc dữ liệu thật từ DB cho cả SP chính & SP kèm):** Chỉ giữ sản phẩm tồn tại, đang hiển thị và **còn hàng (`out_of_stock == 0`)**.
       - **`C8.3` (Kiểm tra `AllergyMatcher`, `ConflictDetection` & `reasonCode` cho cả SP chính & SP kèm):**
         - Loại bỏ mọi sản phẩm (chính hoặc kèm) chứa chất dị ứng của khách (`GC-03`) và loại bỏ sản phẩm mua kèm nếu gây xung đột hoạt chất với sản phẩm chính hoặc giỏ hàng.
         - Kiểm tra từng `reasonCode` với số liệu DB thật (`product_skin_stats` với `review_count >= min_reviews_for_skin_stat`); nếu sản phẩm chính hợp lệ bị loại hết `reasonCodes` → gán mã mặc định **`CATALOG_MATCH_STEP`**.
         - Nếu còn **0 sản phẩm chính** sau `C8.3` → xóa mục cache (nếu lỗi do dữ liệu chung trong khóa cache) và chuyển sang chạy **`TEMPLATE`**. Nếu `TEMPLATE` cũng còn 0 sản phẩm → trả thông báo chuẩn từ mẫu cố định và tăng `consecutive_fallback_count` (đạt 2 lần liên tiếp thì chuyển sang `HANDOFF`).
       - **`C8.4` (Ghép câu từ Template):** Ghép câu mở đầu từ `intro_templates` và lời giải thích từ `reason_code_templates` (`locale = 'en'`), chọn biến thể theo seed `turn_id`.
    2. **Chế độ 2 — `PRODUCT_LOOKUP_MODE` (Áp dụng cho `RULE` với `intent == QUERY_PRODUCT`):**
       - **Không loại bỏ sản phẩm khi `out_of_stock == 1` hoặc khi chứa chất dị ứng!**
       - Đọc giá `price_usd` và trạng thái tồn kho thật (`in_stock` / `out_of_stock`) từ DB để trả lời chính xác câu hỏi của khách.
       - Chạy `AllergyMatcher` để **gắn cờ và hiển thị cảnh báo dị ứng cá nhân hóa ngay trên thẻ/câu trả lời** (`hasAllergyWarning = true` theo `BR-SKIN-05`).
       - Chỉ chuyển sang thông báo "không tìm thấy sản phẩm" nếu `productId` không tồn tại trong DB (`INV-05`).
    3. **Chế độ 3 — `NON_PRODUCT_MODE` (Áp dụng cho `CLARIFY`, và `RULE` với `QUERY_INGREDIENT`, `QUERY_ORDER`, `QUERY_POLICY`, `GREETING`):**
       - Không yêu cầu có sản phẩm trong kết quả (không bao giờ kích hoạt nhánh "0 sản phẩm → `TEMPLATE`").
       - Với `QUERY_INGREDIENT`: chạy `AllergyMatcher` trên hoạt chất đang tra cứu; nếu trùng với danh sách cần tránh của khách thì đính kèm cảnh báo dị ứng cá nhân (`AC-01-NEW-2`).
       - Với `CLARIFY`: lấy câu hỏi và `quickReplies[]` (`{ label, slot, value }`) từ `clarifying_question_templates` theo `(missing_slot, locale = 'en')`.

### BR-AI-15 — Gọi Tool 2 Pha tại Chặng C7 (`GeminiLlmProvider`): Đúng 1 lượt Pha 1 + 1 lượt Pha 2 & Tên mô hình từ cấu hình (`NFR-MAIN-04`)
- **Current behavior:** `ToolChoice = Required` cho mọi lượt gọi; một số chỗ ghi cứng tên model.
- **New behavior:**
  - Tên mô hình hội thoại chính (`Gemini:ChatModel`) và mô hình phân loại nhẹ (`Gemini:ClassifierModel`) **bắt buộc đọc từ cấu hình (`app_settings` / `IConfiguration`)**, không viết cứng trong code hay hợp đồng (`NFR-MAIN-04`).
  - **Pha 1 (Đúng 1 lượt gọi chọn hàm truy xuất):** Truyền `tools = [search_products, lookup_ingredient, ask_clarifying_question]` (rút `ask_clarifying_question` nếu chạm ngưỡng `FR-CHAT-16`) với `toolConfig.functionCallingConfig.mode = "ANY"`, **không** truyền `responseSchema`. Mô hình có thể trả về một hoặc nhiều lời gọi hàm song song (parallel function calls) ngay trong 1 phản hồi duy nhất của Pha 1.
    - Nếu phản hồi Pha 1 chứa `ask_clarifying_question(missing_slot)`: kết thúc `C7` ngay lập tức (chuyển sang `CLARIFY`, không gọi Pha 2).
    - Nếu phản hồi Pha 1 chứa `search_products` và/hoặc `lookup_ingredient`: backend thực thi song song các truy vấn chỉ-đọc trên PostgreSQL (giới hạn tối đa 3 lời gọi hàm song song trong phản hồi Pha 1) rồi chuyển thẳng sang Pha 2 (**không lặp vòng 2 với `mode = ANY`**).
  - **Pha 2 (Đúng 1 lượt gọi tổng hợp kế hoạch JSON):** Đính kèm kết quả ứng viên từ PostgreSQL vào `contents`, **bỏ khai báo `tools` khỏi request** và bật `generationConfig.responseMimeType = "application/json"` kèm `generationConfig.responseSchema = PlanSchema` (`{ scope, items[] }`).
- **Acceptance Criteria changes:**
  - `AC-15-NEW-1`: GIVEN user asks `"Recommend a cleanser and a moisturizer for oily skin"` WHEN `C7` runs Phase 1 THEN the model can emit 2 parallel `search_products` calls in a single Phase 1 turn, backend executes both against DB, and Phase 2 synthesizes the plan in 1 final call (total = 2 LLM calls, never a 2nd `mode = ANY` tool round).

---

## REMOVED Requirements
- Trường văn bản tự do `NarrativeText` / `intro` từ LLM trong phản hồi tư vấn sản phẩm (`llm-policy.md §9.7`).
- Yêu cầu streaming từng token trực tiếp từ LLM ra giao diện trước khi hoàn tất kiểm duyệt (`NFR-PERF-08`).

## DEPRECATED Requirements
- Thuật ngữ `"Tầng 1 / Tầng 2 / Tầng 3"` và sự kiện `conversation_resolved_tier` → thay bằng `"Nguồn trả lời"` (`ChatResponseSource`) và `conversation_resolved_source`.
- Tên tool tiếng Việt (`tim_san_pham`, `tra_thanh_phan`) → thay bằng `search_products`, `lookup_ingredient`, `ask_clarifying_question`.
