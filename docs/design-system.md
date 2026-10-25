---
doc: design-system
title: Hệ Thống Thiết Kế & Quy Chuẩn Giao Diện (Design System) — BeautyAI Platform
status: draft
precedence: 2
owner: Frontend Lead / UI-UX Designer
last_reviewed: 2026-10-25
---

# HỆ THỐNG THIẾT KẾ & QUY CHUẨN FRONTEND — BeautyAI Platform

> Kế thừa toàn bộ hệ thống thiết kế từ prototype HTML/CSS (ADR-007).
> Nguồn chân lý về design tokens, typography, màu sắc, bố cục màn hình và các route React SPA (Precedence 2 — Contracts).

---

# 10. THIẾT KẾ FRONTEND (React)

## 10.1. Stack frontend

| Hạng mục | Lựa chọn | Phiên bản | Lý do |
|---|---|---|---|
| Thư viện UI | **React** | `^19` | `CON-02`; blueprint framework |
| Ngôn ngữ | **TypeScript** | `^5.7` | `strict: true` bắt buộc |
| Build & dev | **Vite** | `^6` | HMR nhanh; stack pack `react-vite` của framework |
| Điều hướng | **React Router** | `^7` | PRD v2.0 đã chọn; giữ nguyên |
| Trạng thái server | **TanStack Query** | `^5` | Đệm, vô hiệu, trạng thái tải/lỗi — **không tự viết** |
| Trạng thái UI | **Zustand** | `^5` | Nhẹ (~1KB); chỉ dùng cho giỏ hàng, tiền tệ, hộp thoại |
| Client HTTP | **openapi-fetch** + **openapi-typescript** | `^0.13` / `^7` | Kiểu sinh tự động từ OpenAPI (ADR-008) |
| Biểu mẫu | **React Hook Form** + **Zod** | `^7` / `^3` | Kiểm tra dữ liệu dùng chung schema với client |
| Biểu đồ | **Recharts** | `^2` | PRD v2.0 đã chọn; giữ nguyên |
| Kiểu chữ & màu | **CSS của prototype** (tokens + components) | — | **ADR-007** — giữ nguyên hệ thống thiết kế |
| CSS riêng component | **CSS Modules** | tích hợp Vite | Không cần thư viện thêm |
| Kiểm thử | **Vitest** + **Testing Library** | `^2` / `^16` | Stack pack của framework |
| E2E | **Playwright** | `^1.49` | Chạy được cả local và CI |
| ❌ **KHÔNG dùng** | Tailwind · MUI · Ant Design · Redux · Axios | | ADR-007 (hệ thống thiết kế) + ADR-009 (chống over-engineering) |

## 10.2. Cấu trúc thư mục

```text
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── media/products/           ← ảnh sản phẩm ĐÃ TẢI VỀ (DQ-08)
└── src/
    ├── main.tsx
    ├── App.tsx                   ← bộ định tuyến + các provider
    │
    ├── styles/                   ← ⚠️ LẤY TỪ PROTOTYPE (ADR-007)
    │   ├── tokens.css            ← :root { --primary, --spacing-*, --radius-* … }
    │   ├── base.css              ← reset · typography · utility
    │   └── components.css        ← .btn · .card · .badge · .navbar · .toast …
    │
    ├── api/
    │   ├── schema.d.ts           ← ⚙️ SINH TỰ ĐỘNG từ openapi.json — KHÔNG sửa tay
    │   ├── client.ts             ← createClient<paths>({ credentials: 'include' })
    │   └── queries/              ← hook TanStack Query theo module
    │       ├── useProducts.ts
    │       ├── useCart.ts
    │       ├── useSkinProfile.ts
    │       ├── useQuiz.ts
    │       ├── useChat.ts
    │       └── useAdmin*.ts
    │
    ├── stores/
    │   ├── currencyStore.ts      ← VND | USD, lưu localStorage (BR-PRICE-06)
    │   ├── cartUiStore.ts        ← trạng thái mở/đóng ngăn kéo giỏ
    │   ├── compareStore.ts       ← khay so sánh, tối đa 4 (FR-CMP-01)
    │   └── authStore.ts          ← thông tin người dùng (KHÔNG chứa token — ADR-004)
    │
    ├── components/               ← dùng lại nhiều nơi, không gắn nghiệp vụ
    │   ├── layout/   Navbar · Footer · MobileMenu · AdminShell
    │   ├── feedback/ Toast · Skeleton · EmptyState · ErrorState · DegradedBanner
    │   ├── form/     TextField · Select · Checkbox · RangeSlider · Pagination
    │   └── data/     PriceTag · RatingStars · Badge · Chip · Tooltip
    │
    ├── features/                 ← gắn nghiệp vụ, một thư mục một module
    │   ├── auth/            LoginPage · RegisterPage · ChangePasswordPage · AuthGate
    │   ├── catalog/         ProductsPage · SmartFilter · ProductGrid · ProductCard
    │   │                    · SortControl · FilterChips · SafeForMeToggle
    │   ├── product/         ProductDetailPage · InciTable · SuitabilityCard
    │   │                    · FunctionChart · SimilarProducts · BoughtTogether
    │   │                    · WhyRecommendedPanel · SimilarProfileReviews
    │   │                    · AllergyWarningCard
    │   ├── skin-profile/    SkinProfilePage · SkinTypePicker · ConcernPicker
    │   │                    · AllergyEditor · AiSharingToggle · CurrentlyUsingEditor
    │   ├── quiz/            QuizWizard · QuizStep · RoutineResult · RoutineStepCard
    │   │                    · StepAlternatives · SaveRoutineButton
    │   ├── ingredient/      IngredientAnalyzerPage · IngredientDetailPage
    │   ├── conflict/        ConflictBanner · ConflictDetailModal · RemediationCard
    │   ├── compare/         ComparePage · CompareTray · CompareTable
    │   ├── cart/            CartPage · CartDrawer · CartLine · VoucherBox
    │   │                    · OrderSummaryTable
    │   ├── checkout/        CheckoutPage · AddressForm · PaymentSelector
    │   │                    · OrderResultPage
    │   ├── orders/          OrderHistoryPage · OrderDetailPage · OrderTimeline
    │   ├── wishlist/        WishlistPage
    │   ├── chat/            ChatPanel · ChatLauncher · MessageList · MessageBubble
    │   │                    · SuggestionPills · HandoffPreviewModal · HandoffCard
    │   │                    · TierBadge · DisclaimerBar · DegradedNotice
    │   ├── reviews/         ReviewsPanel · ReviewCard · WriteReviewForm
    │   ├── content/         SupportPage · PolicyPage · MethodologyPage
    │   │                    · RankingCriteriaPage · NotFoundPage · ErrorPage
    │   └── admin/           DashboardPage · ProductManagerPage · OrderManagerPage
    │                        · IngredientDictPage · ConflictRulePage · VoucherPage
    │                        · ExchangeRatePage · ChatRulePage · ReportsPage
    │                        · AuditLogPage · HandoffQueuePage · ConversationLogPage
    │
    ├── hooks/      useDebounce · useMediaQuery · useFocusTrap · useLocalStorage
    ├── lib/        formatPrice · formatDate · normalizeVi · cn
    └── i18n/       vi.ts  (en.ts ở mức Could — I18N-05)
```

## 10.3. Quy tắc triển khai bắt buộc

| Mã | Quy tắc | Căn cứ |
|---|---|---|
| **FE-01** | **Không viết tay DTO.** Mọi kiểu dữ liệu API lấy từ `schema.d.ts` sinh tự động | ADR-008 · `docs/api-contract.md §4` |
| **FE-02** | **Không gọi `fetch` trực tiếp trong component.** Mọi lệnh gọi qua hook trong `api/queries/` | `presets/stacks/react-vite/docs/architecture.md §5` |
| **FE-03** | **Không lưu token xác thực trong JavaScript.** Phiên nằm ở cookie httpOnly | ADR-004 · `NFR-SEC-01` |
| **FE-04** | **Mọi component hiển thị dữ liệu phải xử lý đủ 4 trạng thái**: tải · rỗng · lỗi · suy giảm | `UI-05` · `.agents/rules/ui-ux-standards.md §1.5` |
| **FE-05** | **Không phát minh token mới.** Mọi màu/khoảng cách/bán kính lấy từ `tokens.css` | `UI-03` · ADR-007 |
| **FE-06** | **Đổi tiền tệ KHÔNG gọi lại API.** API trả cả `priceUsd` và `priceVnd`; frontend chỉ chọn hiển thị | `BR-PRICE-06` · §7.1 |
| **FE-07** | **Bộ lọc nằm trong tham số URL**, để chia sẻ và đánh dấu được | `FR-CAT-01` AC-02 |
| **FE-08** | **Disclaimer của trợ lý hiển thị CỐ ĐỊNH trong khung chat**, không phải hiện một lần | `UI-09` · `CMP-17` |
| **FE-09** | **Mọi chỉ số/điểm bấm được để xem cách tính** | `UI-08` · `BR-ING-04d` |
| **FE-10** | **Thông tin truyền bằng màu phải có cách truyền thứ hai** (chữ/biểu tượng) | `NFR-A11Y-02` |
| **FE-11** | **Hộp thoại & ngăn kéo giữ tiêu điểm, đóng bằng `Esc`, trả tiêu điểm khi đóng** | `NFR-A11Y-06` |
| **FE-12** | **Phản hồi lạc quan (optimistic) cho wishlist và số lượng giỏ**, tự hoàn tác khi lỗi | `FR-WISH-01` AC-01 |
| **FE-13** | **Chống gọi liên tiếp ≥ 250ms cho gợi ý tìm kiếm** | `FR-CAT-03` AC-02 |
| **FE-14** | **Không hardcode chuỗi hiển thị trong component** — dùng `i18n/vi.ts` | `I18N-01` |
| **FE-15** | **Không hiển thị bất kỳ chỉ số nào mang nghĩa "an toàn/nguy hiểm"** | `INV-01` |

## 10.4. Ánh xạ prototype → route React

| Trang prototype | Route | Trạng thái |
|---|---|---|
| `index.html` | `/` | Chuyển đổi |
| `products.html` | `/san-pham` | Chuyển đổi + thêm `SafeForMeToggle` |
| `product-detail.html` | `/san-pham/:slug` | Chuyển đổi + **đổi `SafetyScore` → `SuitabilityCard`** + thêm `WhyRecommendedPanel`, `SimilarProfileReviews` |
| `skin-quiz.html` | `/skin-quiz` | Chuyển đổi |
| `ingredient-analyzer.html` | `/phan-tich-thanh-phan` | Chuyển đổi + đổi nhãn điểm |
| `compare.html` | `/so-sanh` | Chuyển đổi |
| `cart.html` | `/gio-hang` | Chuyển đổi + `ConflictBanner` 3 mức mới |
| `checkout.html` | `/thanh-toan` | Chuyển đổi |
| `wishlist.html` | `/yeu-thich` | Chuyển đổi |
| `profile.html` | `/ho-so` | Chuyển đổi + **thêm `AiSharingToggle`** + nút xóa hồ sơ da |
| `expert-consult.html` | `/tro-ly` | Chuyển đổi + **đổi nhân dạng** (`BR-AI-14`) + `DisclaimerBar` cố định + `HandoffCard` |
| `support.html` | `/ho-tro` | Chuyển đổi |
| `admin.html` | `/admin` | Chuyển đổi |
| — | `/dang-nhap`, `/dang-ky`, `/doi-mat-khau` | **Mới** (`G-23`) |
| — | `/dat-hang-thanh-cong/:orderCode` | **Mới** |
| — | `/don-hang`, `/don-hang/:orderCode` | **Mới** |
| — | `/thanh-phan/:slug` | **Mới** |
| — | `/phuong-phap-tinh-diem` | **Mới** — `FR-SUP-02` |
| — | `/tieu-chi-xep-hang` | **Mới** — **`CMP-20` nghĩa vụ pháp lý** |
| — | `/chinh-sach-du-lieu-ca-nhan` | **Mới** — **`FR-SUP-03` nghĩa vụ pháp lý** |
| — | `*` (404) | **Mới** |
| — | `/admin/*` (11 trang con) | **Mới** |

---


