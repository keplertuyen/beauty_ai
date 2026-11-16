---
doc: change-proposal
title: Change Proposal — CHANGE-CHATBOT-PIPELINE-V2
status: draft
precedence: 3
owner: pm-ba
last_reviewed: 2026-11-09
---

# Change Proposal

## Change ID
CHANGE-CHATBOT-PIPELINE-V2

## Summary
Thiết kế lại đường ống trợ lý AI (`docs/llm-policy.md` §9) và nâng cấp bản mẫu chatbot hiện có trong `src/` (`AiController.cs`, `GeminiSkincareProvider.cs`, `ExpertConsult.jsx`) lên kiến trúc đường ống 10 chặng (`C0`–`C9`, tách bước lọc tuân thủ đồng bộ `C9a` và ghi log/cache bất đồng bộ `C9b`) trước khi triển khai chính thức. Trong Phase 1, Chatbot hiển thị **100% bằng Tiếng Anh và USD** (đồng bộ với `docs/llm-policy.md:15` và phần còn lại của giao diện hiện tại), trong khi các lớp chắn an toàn PII/Y tế/Tuân thủ vẫn quét song ngữ Anh + Việt.

Bảy điểm cốt lõi của thiết kế mới (theo tài liệu nguồn `chatbot_architecture_v3.md`):

1. **Một chốt chặn kiểm tra duy nhất (`INV-13`, trừ `RATE_LIMITED` ở `C0`):**
   - Mọi lượt chat vượt qua bộ chặn spam `C0` (`RULE`, `CACHE`, `LLM`, `TEMPLATE`, `CLARIFY`, `HANDOFF`) đều bắt buộc đi qua `C9a` (`AdvertisingComplianceFilter`), và mọi nguồn `RULE`, `CACHE`, `LLM`, `TEMPLATE`, `CLARIFY` đều phải qua `C8` (`GroundingValidator`) trước `C9a`. Ngoại lệ duy nhất là `RATE_LIMITED` tại `C0` (tăng bộ đếm `rate_limited_turn_count` trong bộ nhớ và trả thông báo tĩnh ngay lập tức).
   - `C8` hoạt động theo **3 chế độ rõ ràng** (`RECOMMEND_MODE`, `PRODUCT_LOOKUP_MODE`, `NON_PRODUCT_MODE`).
2. **Loại bỏ 100% văn bản tự do từ LLM (Chốt `D4`: bỏ hẳn trường `intro` ở V1) & Gọi Tool đúng 2 lượt tuần tự (`C7`):**
   - **Pha 1 (`1 lượt gọi duy nhất`):** truyền `tools = [search_products, lookup_ingredient, ask_clarifying_question]` với `mode = "ANY"` (cho phép LLM trả về một hoặc nhiều lời gọi hàm song song trong cùng 1 phản hồi, **không lặp vòng 2 với `mode = ANY`**). Nếu LLM gọi `ask_clarifying_question(missing_slot)`, kết thúc `C7` ngay sau 1 lượt gọi.
   - **Pha 2 (`1 lượt gọi tổng hợp`):** sau khi chạy các truy vấn SQL từ Pha 1, gọi mô hình đã cấu hình (`Gemini:ChatModel`) **không truyền `tools`**, chỉ bật `responseSchema = PlanSchema` (`{ scope, items: [{ productId, reasonCodes[] }] }`).
3. **Khóa Cache nhất quán theo đúng `SafeLlmContext` thực tế gửi đi (`D7`, `FR-SKIN-07`, `GC-17`):**
   - Tại `C1`, `DeIdentificationService` tạo `SafeLlmContext`: nếu `AllowAiSharing == true` thì hợp nhất hồ sơ tài khoản với `sessionSlots`; nếu `AllowAiSharing == false` (hoặc chưa đăng nhập) thì **chỉ lấy `sessionSlots`** do khách tự nêu trong phiên hiện tại.
   - Tại `C6`, khóa cache luôn được băm từ **toàn bộ nội dung `SafeLlmContext` thực sự gửi đi** (`skinType`, `isSensitive`, `sort(concerns)`, `routineStep`, `budgetBand`, `sort(avoidIngredients)`), hoặc chuỗi `"NO_PROFILE"` khi `SafeLlmContext` hoàn toàn rỗng. Nhờ vậy khách chưa bật `AllowAiSharing` nhưng đã khai báo loại da trong phiên chat vẫn có khóa cache tách biệt theo đúng loại da đó.
4. **Ẩn danh hóa hai luồng tách biệt (`text_norm` trong RAM vs `text_masked` lưu trữ/gửi đi):**
   - `C1` tạo `text_masked` với hai biểu thức chính quy tách biệt cho **Mã đơn hàng** (`\bBA-\d{8}-\d{4}\b` → `[MA_DON]`, chuẩn `GC-07`) và **Mã chuyển tiếp** (`\bBA-[0-9A-HJKMNP-TV-Z]{4}\b` → `[MA_CHUYEN_TIEP]`, chuẩn §9.9), cùng SĐT, Email, CCCD, Địa chỉ.
   - Che tên theo cụm dẫn bắt buộc từ theo sau phải **viết hoa chữ cái đầu** và **không nằm trong `PiiStopwordAllowlist`** (`Oily`, `Dry`, `Allergic`, `Pregnant`...).
5. **Bảo vệ hạn mức, Chặn lặp & Luồng `HANDOFF` có xác nhận đồng ý:**
   - Đặt Rate Limit 0-LLM ở `C0`, bắt `REQUEST_HANDOFF` bằng rule ở `C2`, kiểm tra `QuotaGuard` (`llmAllowed`) ở `C3` **trước** bộ chặn y tế `C4`.
   - Tại `C4`, chỉ gọi mô hình phân loại nhẹ đã cấu hình (`Gemini:ClassifierModel`) khi Lớp A rơi vào **Vùng xám (`GREY_ZONE`)** và `llmAllowed = true`. Nếu lỗi/timeout/hết quota trong vùng xám → **Fail-Closed sang `HANDOFF`**.
   - Giới hạn hỏi làm rõ: `consecutive_clarify_count < 2` và `session_clarify_count < 4`. Nút chọn nhanh trả về payload có cấu trúc `{ label, slot, value }`.
   - Nguồn `HANDOFF` chỉ trả về thông điệp cố định + nút mở bước xem trước dữ liệu (`POST /chat/handoff/preview`); chỉ sinh mã `BA-XXXX` sau khi khách xác nhận tại `POST /chat/handoff/confirm`.
6. **Tách bộ lọc đồng bộ (`C9a`) và ghi log/cache bất đồng bộ (`C9b`), cập nhật `NFR-PERF-08` & `FR-CHAT-12`:**
   - `C9a` lọc từ cấm quảng cáo đồng bộ (`< 2ms`) rồi trả kết quả ngay cho khách; `C9b` ghi `chat_turns`, `chat_session_state`, `PlanCache` và telemetry bất đồng bộ trong nền để không cộng độ trễ vào phản hồi của khách.
   - Thay yêu cầu "streaming ký tự đầu ≤ 2s" ở `NFR-PERF-08` bằng chỉ báo tiến trình tức thì (`≤ 300ms`) và ngưỡng hoàn tất toàn trình (`p50 ≤ 3.5s, p95 ≤ 6.0s, timeout = 8.0s`).
   - Khi xóa phiên hội thoại (`FR-CHAT-12`), xóa dây chuyền (`ON DELETE CASCADE`) cả `chat_turns`, `chat_session_state` và `chat_feedback`.

## Business reason
- **An toàn tuyệt đối về dữ kiện & y tế:** bỏ hoàn toàn văn tự do của LLM (kể cả `intro` và câu hỏi làm rõ), kiểm tra dị ứng/xung đột cho cả sản phẩm mua kèm (`apriori_pairs`), và giữ trạng thái tra cứu chính xác ở `C8` khi khách hỏi tồn kho của sản phẩm đã hết hàng.
- **Không trả nhầm cache giữa các loại da:** khóa cache phản ánh chính xác 100% các trường trong `SafeLlmContext` (gồm cả `sessionSlots` khi `AllowAiSharing = false`).
- **Độ trễ thấp & Bảo vệ chi phí (`BO-05`):** Pha 1 chỉ gọi đúng 1 lượt (hỗ trợ gọi nhiều tool song song), kết hợp ghi log/cache bất đồng bộ ở `C9b` giúp giữ vững mục tiêu `p95 ≤ 6.0s`.

## Quyết định đã chốt (owner, 2026-11-09)
| # | Quyết định | Ghi chú |
|---|---|---|
| D1 | Chấp nhận câu trả lời ghép từ template với số liệu thật từ `product_skin_stats` thay vì văn tự do của LLM | Yêu cầu `review_count >= min_reviews_for_skin_stat` (mặc định 10) khi xếp hạng theo `recommend_rate` |
| D2 | Mã lý do (`reasonCodes`) và slot hỏi lại (`missing_slot`) đều là **enum đóng**; mã mặc định khi mất hết lý do là `CATALOG_MATCH_STEP` | Nút chọn nhanh của `CLARIFY` mang payload `{ label, slot, value }` |
| D3 | Mỗi mã lý do có 3–4 biến thể câu, chọn tất định theo seed `turn_id` | Giữ tính tất định cho `GC-02` |
| D4 | **Bỏ hẳn trường `intro` tự do ở V1** | Đầu ra Pha 2 của `C7` chỉ còn `{ scope, items: [{ productId, reasonCodes[] }] }`. Câu mở đầu ghép từ `intro_templates` ở `C8` |
| D5 | V1 không dùng NER; che tên bằng tên hồ sơ tài khoản và regex cụm dẫn (yêu cầu viết hoa chữ cái đầu + `PiiStopwordAllowlist`) | Tránh che nhầm `"I am oily"` / `"I am allergic"`. NER ONNX để dành cho V2 |
| D6 | Chỉ dùng **gói API trả phí** (không dùng dữ liệu khách để train) cho môi trường có dữ liệu thật | Gói miễn phí chỉ dùng ở dev với dữ liệu tổng hợp |
| D7 | **Khóa cache = SHA-256 của (`text_masked` chuẩn hóa + toàn bộ `SafeLlmContext` thực sự gửi đi hoặc `"NO_PROFILE"` nếu `SafeLlmContext` rỗng + `locale` + `prompt_version` + `catalog_version`)**, TTL 1 giờ | Đảm bảo nhất quán cho cả trường hợp `AllowAiSharing = false` nhưng có `sessionSlots` |
| D8 | Cho LLM viết lại câu lý do cho mượt hơn: **hoãn**, không làm ở V1 | — |
| D9 | Chỉ gọi mô hình phân loại nhẹ (`Gemini:ClassifierModel`) ở C4 khi Lớp A ở **Vùng xám (`GREY_ZONE`)** và `llmAllowed = true`; nếu lỗi/timeout/hết quota trong vùng xám thì **Fail-Closed sang `HANDOFF`** | Đo `grey_zone_rate` và `grey_zone_fail_closed_rate` ngay từ đầu |
| D10 | Giới hạn hỏi làm rõ (`CLARIFY`): `consecutive_clarify_count < 2` và `session_clarify_count < 4` | Chạm ngưỡng thì rút tool `ask_clarifying_question` và chuyển sang `TEMPLATE` |
| D11 | Sản phẩm mua kèm từ `apriori_pairs` được chọn ở `C8.1` và phải qua cùng bộ kiểm tra tồn kho (`C8.2`), `AllergyMatcher` & `ConflictDetection` (`C8.3`) như sản phẩm chính | — |
| D12 | Rate Limit 0-LLM ở `C0`: cửa sổ trượt `5 tin nhắn / 10 giây` và `30 tin nhắn / 5 phút` trên mỗi IP/Session | Ngoại lệ duy nhất của `INV-13`: `RATE_LIMITED` tăng bộ đếm `rate_limited_turn_count` và trả thẳng ở `C0` |
| D13 | Tách `text_norm` (chỉ trong RAM cho C2, C4 Lớp A, C5 RULE) và `text_masked` (cho C4 Lớp B, C6 Cache, C7 LLM, C9b Log/DB); tách regex `[MA_DON]` (`BA-\d{8}-\d{4}`) và `[MA_CHUYEN_TIEP]` (`BA-[0-9A-HJKMNP-TV-Z]{4}`) | — |
| D14 | **Chốt Phương án 14B cho Chatbot:**<br>• Chatbot Phase 1 hiển thị **100% Tiếng Anh & USD** (đồng bộ với banner `llm-policy.md:15` và phần còn lại của nền tảng hiện tại).<br>• Bộ lọc an toàn (`C1`, `C4`, `C9a`) vẫn quét song ngữ Anh + Việt.<br>• Chỉ viết lại `docs/prompt/01_gemini_advisor_en.md`; giữ `02_gemini_advisor_vi.md` cho Phase 2.<br>• Các mục song tệ/ngôn ngữ cấp toàn nền tảng (`ASM-08`, `CON-09`, `U6`, `M10`, `BR-PRICE-01`, `E2E-02`, `E2E-07`) được ghi nhận để xử lý trong một change riêng cấp nền tảng, không sửa nửa vời trong change chatbot này. | — |
| D15 | **Gọi Tool ở `C7` gồm đúng 1 lượt Pha 1 + 1 lượt Pha 2:** Pha 1 (`mode = ANY`) cho phép gọi song song nhiều hàm trong 1 phản hồi rồi chuyển thẳng sang Pha 2 (`responseSchema`, không truyền `tools`). Tên mô hình luôn đọc từ cấu hình (`NFR-MAIN-04`). | Không lặp vòng 2 với `mode = ANY` để tránh ép gọi tool thừa |

## Scope
### In scope
- Sửa `docs/llm-policy.md` (làm rõ bộ lọc an toàn song ngữ ở banner dòng 15, cập nhật §9.1 → §9.11).
- Sửa `docs/domain-rules.md` (`BR-AI-01`, `BR-AI-05`, `BR-AI-06`, `BR-AI-07`, `BR-AI-10`, `BR-AI-15`, `BR-AI-16`).
- Sửa các mục thuộc phạm vi Trợ lý AI trong `requirements.md` (`U5`, `BO-05`, `NFR-PERF-07/08`, `NFR-OBS-04/06/07`, `E2E-05/06`, `GC-04/06/18/20`) và `docs/_requirements/M12.md` (`FR-CHAT-01` → `FR-CHAT-19`).
- Viết lại `docs/prompt/01_gemini_advisor_en.md` theo quy trình gọi tool 2 pha và JSON Schema đầu ra `{ scope, items: [{ productId, reasonCodes[] }] }`.
- Cập nhật `docs/data-contracts.md`, `docs/api-contract.md`, `docs/security-policy.md`, `docs/tech-stack.md`, `docs/testing-strategy.md`.
- Tạo ADR mới cho kiến trúc Plan Cache & Template Rendering.

### Out of scope (Tách bạch rõ)
- **Đồng bộ phạm vi ngôn ngữ/tiền tệ cấp toàn nền tảng (`ASM-08`, `CON-09`, `U6`, `M10`, `BR-PRICE-01`, `E2E-02`, `E2E-07`):** các mục này liên quan tới thanh toán VNPay, tỷ giá và toàn bộ e-commerce nên sẽ được đối chiếu và xử lý trong một change riêng cấp nền tảng. Change này chỉ quy định Chatbot hiển thị Tiếng Anh & USD giống phần còn lại của giao diện hiện tại.
- Viết mới hoặc dịch sang tiếng Việt cho `docs/prompt/02_gemini_advisor_vi.md` và dữ liệu seed template `locale = 'vi'` (thuộc Phase 2).
- Mô hình NER ONNX (V2) và LLM rephrasing (D8).

## Affected users / systems
- Khách hàng: nhận tư vấn Tiếng Anh & giá USD đồng nhất với giao diện hiện tại; vẫn được bảo vệ bởi bộ lọc PII và chặn y tế song ngữ Anh + Việt.
- Admin: theo dõi các chỉ số vận hành mới (`grey_zone_rate`, `grey_zone_fail_closed_rate`, `cache_hit_rate`, `llm_free_turn_rate`, `rate_limited_turn_count`, `BO-05`).
- Codebase hiện có (sẽ nâng cấp ở bước implementation sau khi duyệt): `src/BeautyAI.Api/Controllers/AiController.cs`, `src/BeautyAI.Infrastructure/Providers/GeminiSkincareProvider.cs`, `src/frontend/src/pages/ExpertConsult.jsx`.

## Affected contracts & documents
| Tài liệu | Precedence | Mức độ | Mục bị ảnh hưởng |
|---|---|---|---|
| `docs/llm-policy.md` | 2 | Lớn | Ghi chú banner dòng 15 (an toàn song ngữ), §9.1 → §9.11 |
| `docs/data-contracts.md` | 2 | Trung bình | Bảng `chat_session_state`, `chat_feedback`, `intro_templates`, `reason_code_templates`, `clarifying_question_templates`, `slang_dictionary`, `product_skin_stats`, `apriori_pairs`, khóa ngoại `ON DELETE CASCADE` |
| `docs/api-contract.md` | 2 | Nhỏ | `clarifyingQuestion`, `quickReplies` (`{label, slot, value}`), `selectedSlot`, `POST /chat/feedback`, bỏ SSE streaming cho chat V1 |
| `docs/security-policy.md` | 2 | Nhỏ | Ranh giới `text_norm` (RAM) / `text_masked`, tách regex mã đơn & mã chuyển tiếp, quy tắc che tên có Allowlist, gói API trả phí |
| `docs/tech-stack.md` | 2 | Nhỏ | Cấu hình `Gemini:Tier`, `Gemini:ChatModel`, `Gemini:ClassifierModel` |
| `docs/testing-strategy.md` | 2 | Nhỏ | Cập nhật `GC-18`, `GC-19`, `GC-20` và thêm `GC-23` → `GC-32` |
| `requirements.md` | 3 | Trung bình | Các mục của Trợ lý AI: `U5`, `BO-05`, `NFR-PERF-07/08`, `NFR-OBS-04/06/07`, `E2E-05/06`, `GC-04/06/18/20` |
| `docs/_requirements/M12.md` | 3 | Trung bình | `FR-CHAT-01` (`AC-03`), `FR-CHAT-02/03/07/10/11/12` và thêm `FR-CHAT-14` → `FR-CHAT-19` |
| `docs/domain-rules.md` | 4 | Trung bình | `BR-AI-01`, `-05`, `-06`, `-07`, `-10`, `-15`, `-16` |
| `docs/prompt/01_gemini_advisor_en.md` | 5 | Trung bình | Cập nhật hướng dẫn gọi tool 2 pha và JSON Schema đầu ra `{ scope, items[] }` |
| `docs/adr/` | 2 | Mới | ADR "Cache kế hoạch và render bằng template thay vì văn tự do LLM" |

## Risks
| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Câu trả lời ghép hoàn toàn từ template (bỏ cả `intro`) có thể lặp cấu trúc | Medium | Dùng bảng `intro_templates` + `reason_code_templates` (3–4 biến thể tiếng Anh/mã theo seed `turn_id`) kèm số liệu thật từ `product_skin_stats`; theo dõi tỉ lệ 👍/👎 |
| R2 | Regex che tên theo cụm dẫn tiếng Anh (`"I am ..."`) có nguy cơ che nhầm tính từ chỉ loại da hoặc tình trạng | Medium | Bắt buộc từ sau cụm dẫn phải **viết hoa chữ cái đầu** (`[A-Z]`) VÀ kiểm tra đối chiếu với **`PiiStopwordAllowlist`** |
| R3 | Che tên bằng regex bỏ sót tên tự gõ không viết hoa hoặc không có cụm dẫn | Low | Đã xóa sạch SĐT/Email/CCCD/Địa chỉ/Mã đơn; tên đơn lẻ không đủ định danh. Để dành NER ONNX cho V2 |
| R4 | Gói API trả phí có đơn giá cao hơn gói miễn phí | Medium | `C0` Rate Limit, `C2` Handoff rule, `C4` Vùng xám, `C5` RULE, `C6` Cache và `TEMPLATE` cắt giảm phần lớn lượt gọi LLM |
| R5 | Không dùng token streaming làm khách phải chờ C7 + C8 + C9a hoàn tất mới thấy câu trả lời | Medium | Sửa `NFR-PERF-08`: hiển thị trạng thái xử lý theo chặng trong `≤ 300ms`, Pha 1 chỉ gọi đúng 1 lượt (hỗ trợ parallel tool calls), `C9b` ghi DB/log bất đồng bộ, giữ `p95 ≤ 6.0s` |
| R6 | Tuân thủ quy định bảo vệ dữ liệu cá nhân tại Việt Nam | High | Che PII ở C1, tôn trọng công tắc `AllowAiSharing` (`FR-SKIN-07`), xóa dây chuyền ở `FR-CHAT-12`, dùng gói API trả phí. **Bắt buộc rà soát pháp lý trước khi vận hành thương mại** |
| R7 | Từ khóa Vùng xám ở C4 quá rộng làm tăng tỉ lệ Fail-Closed sang `HANDOFF`, gây ảnh hưởng chỉ tiêu `BO-05` | Medium | Đo `grey_zone_rate` và `grey_zone_fail_closed_rate` ở C9b ngay từ đầu để tinh chỉnh từ khóa |
| R8 | Một số phiên bản Gemini API từ chối request có đồng thời cả khai báo `tools` và `generationConfig.responseSchema` | Medium | Ở Pha 2 của `C7`, **bỏ khai báo `tools`** khỏi payload và chỉ truyền `responseSchema`. Thêm bước kiểm thử thực tế với mô hình cấu hình trong `tasks.md` |

## Approval
| Role | Name | Status | Date |
|---|---|---|---|
| PM | Owner | Draft | 2026-11-09 |
| BA | Owner | Draft | 2026-11-09 |
| TA/SA | Owner | Draft | 2026-11-09 |
| QA Lead | Owner | Draft | 2026-11-09 |
