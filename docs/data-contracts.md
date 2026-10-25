---
doc: data-contracts
title: Hợp Đồng Dữ Liệu & Lược Đồ Thực Thể (Data Contracts & Schema) — BeautyAI Platform
status: draft
precedence: 2
owner: SA / Database Architect
last_reviewed: 2026-10-25
---

# HỢP ĐỒNG DỮ LIỆU & LƯỢC ĐỒ THỰC THỂ — BeautyAI Platform

> Nguồn chân lý về mô hình đối tượng, quan hệ, entity C# và lược đồ PostgreSQL vật lý (Precedence 2 — Contracts).
> Xem tệp DDL DML hoàn chỉnh tại [`docs/db-schema/schema.sql`](docs/db-schema/schema.sql).

---

# 5. MÔ HÌNH ĐỐI TƯỢNG & ORM

> Mô hình này được thiết kế theo **OOSAD** (`core-principles.md §3.1`): định nghĩa đối tượng, quan hệ và ràng buộc một cách đầy đủ và có chủ đích; **lưu dữ liệu gốc, dẫn xuất giá trị tính toán khi đọc**; giữ mô hình **đủ linh hoạt** để thay đổi quy tắc nghiệp vụ không buộc phải refactor lớn.
>
> **Công nghệ:** Entity Framework Core 10 + Npgsql. Cấu hình bằng **Fluent API** trong các lớp `IEntityTypeConfiguration<T>` riêng (**không** dùng Data Annotation trên entity, để Domain layer không phụ thuộc EF Core — xem §3.3).

## 5.1. Sơ đồ quan hệ tổng thể (ERD logic)

```text
┌─────────────┐        ┌──────────────┐         ┌──────────────────────┐
│   Brand     │1      *│   Product    │*      * │     Ingredient       │
│─────────────│◄───────│──────────────│◄───────►│──────────────────────│
│ Id          │        │ ProductId:str│  qua    │ Id                   │
│ Name        │        │ Name         │ Product │ InciName (unique)    │
│ LogoUrl     │        │ BrandId      │Ingredient│ VietnameseName      │
│ Slug        │        │ CategoryId   │         │ PrimaryFunction      │
└─────────────┘        │ PriceUsd     │         │ CosIngStatus         │
                       │ SalePriceUsd │         │ ComedogenicRating?   │
┌─────────────┐1      *│ Rating       │         │ Description          │
│  Category   │◄───────│ ReviewsCount │         │ SourceUrl            │
│─────────────│        │ LovesCount   │         └──────┬───────────────┘
│ Id          │        │ StockQty     │                │*
│ Name        │        │ SellingStatus│                │
│ Level       │        │ Highlights   │          ┌─────▼──────────────┐
│ ParentId ───┼──┐     │ IngredientsRaw│         │IngredientSynonym   │
│ Slug        │  │     │ IsVegan      │          │ IngredientId       │
└─────────────┘  │     │ IsCrueltyFree│          │ SynonymName        │
       ▲─────────┘     │ IsClean      │          └────────────────────┘
    tự tham chiếu      │ IsFragranceFr│
                       │ IsParabenFree│          ┌────────────────────┐
                       │ IsAlcoholFree│         *│ ActiveGroupMember  │*
                       │ DeclarationNo│◄────────►│────────────────────│
                       │ DeclExpiry   │          │ ActiveGroupId      │
                       │ ImageLocalUrl│          │ IngredientId       │
                       │ RoutineStep  │          └─────┬──────────────┘
                       │ CreatedAt    │                │*
                       └──┬──┬──┬──┬──┘                │
                          │  │  │  │            ┌──────▼──────────┐
       ┌──────────────────┘  │  │  └──────┐     │ ActiveGroup     │
       │                     │  │         │     │─────────────────│
┌──────▼────────────┐ ┌──────▼──▼──┐ ┌────▼───┐ │ Code (RETINOID) │
│ProductIngredient  │ │ CartItem   │ │Review  │ │ DisplayName     │
│───────────────────│ │────────────│ │────────│ └────┬────────┬───┘
│ ProductId  (PK)   │ │ CartId     │ │ProdId  │      │*       │*
│ IngredientId (PK) │ │ ProductId  │ │UserId? │      │        │
│ DisplayOrder      │ │ Quantity   │ │Rating  │ ┌────▼────────▼──────────┐
│ IsKeyActive       │ └────────────┘ │Content │ │ ConflictRule           │
└───────────────────┘                │SkinType│ │────────────────────────│
                                     │Source  │ │ GroupAId · GroupBId    │
┌──────────────────────────┐         │Status  │ │ Severity (CAO/LUU_Y/   │
│ProductUnmatchedIngredient│         └────────┘ │          THONG_TIN)    │
│──────────────────────────│                    │ Mechanism              │
│ ProductId · RawText      │                    │ EvidenceTier (A/B/C)   │
│ DisplayOrder             │                    │ Explanation            │
└──────────────────────────┘                    │ Remediation            │
                                                │ SourceUrl (NOT NULL)   │
┌─────────────────────────────┐                 │ IsActive               │
│ ProductSimilarity           │                 └────────────────────────┘
│─────────────────────────────│
│ ProductId · SimilarProductId│      ┌───────────────────────────┐
│ Score · Version · ComputedAt│      │ AssociationRule           │
└─────────────────────────────┘      │───────────────────────────│
                                     │ AntecedentProductId       │
                                     │ ConsequentProductId       │
                                     │ Support·Confidence·Lift   │
                                     │ Version · ComputedAt      │
                                     └───────────────────────────┘

╔══════════════════════════════════ NGƯỜI DÙNG ══════════════════════════════════╗
║  ┌──────────────────────────┐                                                   ║
║  │ AppUser                  │1                                                  ║
║  │──────────────────────────│───┬──────────┬──────────┬──────────┬──────────┐   ║
║  │ Id · Email(citext,uniq)  │   │1         │*         │*         │*         │*  ║
║  │ PasswordHash             │   ▼          ▼          ▼          ▼          ▼   ║
║  │ SecurityStamp            │ ┌──────────┐┌────────┐┌─────────┐┌────────┐┌─────┐║
║  │ FullName · Phone         │ │SkinProfile││ Cart  ││ Order   ││Wishlist││Conv-│║
║  │ Role (CUSTOMER/ADMIN)    │ │──────────││───────││─────────││ Item   ││ersa-│║
║  │ FailedLoginCount         │ │UserId(PK)││UserId ││OrderCode││────────││tion │║
║  │ LockoutUntil?            │ │SkinType  ││Items  ││Status   ││UserId  ││─────│║
║  │ MustChangePassword       │ │IsSensitive││      ││ExchRate ││ProdId  ││Tier │║
║  │ DefaultAddress (owned)   │ │AllowAiSha-││       ││Totals   │└────────┘│Msgs │║
║  │ CreatedAt                │ │  ring=F  ││       ││Items    │          └─────┘║
║  └──────────────────────────┘ │UpdatedAt ││       ││Discounts│                 ║
║                               └──┬───┬───┘└───────┘└────┬────┘                 ║
║                                  │*  │*                 │*                     ║
║                     ┌────────────▼┐ ┌▼──────────────┐ ┌─▼──────────────┐       ║
║                     │SkinConcern  │ │SkinAllergy    │ │OrderItem       │       ║
║                     │─────────────│ │───────────────│ │────────────────│       ║
║                     │UserId       │ │UserId         │ │OrderId         │       ║
║                     │ConcernCode  │ │IngredientId?  │ │ProductId       │       ║
║                     └─────────────┘ │FreeTextNote?  │ │NameSnapshot    │       ║
║                                     └───────────────┘ │BrandSnapshot   │       ║
║                     ┌───────────────┐                 │UnitPriceUsd    │       ║
║                     │CurrentlyUsing │                 │Quantity        │       ║
║                     │───────────────│                 │ImageSnapshot   │       ║
║                     │UserId         │                 └────────────────┘       ║
║                     │ProductId? or  │                 ┌────────────────┐       ║
║                     │ActiveGroupId? │                 │OrderStatusLog  │       ║
║                     └───────────────┘                 │────────────────│       ║
║                     ┌───────────────┐                 │OrderId·From·To │       ║
║                     │SavedRoutine   │1   *            │ByUserId·Reason │       ║
║                     │───────────────│────►┌──────────┐└────────────────┘       ║
║                     │UserId·Name    │     │RoutineStep│                        ║
║                     │CreatedAt      │     │──────────│ ┌────────────────┐      ║
║                     └───────────────┘     │StepOrder ││ │OrderVoucher    │      ║
║                                           │TimeOfDay ││ │────────────────│      ║
║                                           │ProductId ││ │OrderId·Voucher │      ║
║                                           └──────────┘  │DiscountAmount  │      ║
╚══════════════════════════════════════════════════════════└────────────────┘══════╝

╔═══════════════════════════════ HỘI THOẠI & AI ════════════════════════════════╗
║ ┌──────────────────┐1    *┌────────────────────┐   ┌─────────────────────────┐ ║
║ │ Conversation     │─────►│ ConversationMessage│   │ HandoffRequest          │ ║
║ │──────────────────│      │────────────────────│   │─────────────────────────│ ║
║ │ Id · UserId?     │      │ Role (user/assist) │   │ HandoffCode (#BA-7F3K)  │ ║
║ │ SessionKey       │      │ Content            │   │ ConversationId          │ ║
║ │ StartedAt        │      │ ResolvedTier       │   │ Summary · Reason        │ ║
║ │ ExpiresAt(+90d)  │      │ Helpful?           │   │ ProfileConsentGiven     │ ║
║ └──────────────────┘      │ LlmTokensUsed?     │   │ SkinSnapshotJson?       │ ║
║                           │ CreatedAt          │   │ Status · ExpiresAt(+24h)│ ║
║ ┌──────────────────┐      └────────────────────┘   └─────────────────────────┘ ║
║ │ ChatIntent       │ ┌──────────────────────┐                                  ║
║ │──────────────────│ │ BlockedTopic         │  ◄── BẤT BIẾN: chỉ thêm,         ║
║ │ Code · Patterns  │ │──────────────────────│      không xóa (FR-ADM-10 AC-03) ║
║ │ ResponseTemplate │ │ Code · Patterns      │                                  ║
║ │ IsActive         │ │ FixedResponse        │                                  ║
║ └──────────────────┘ │ IsSystemImmutable    │                                  ║
║                      └──────────────────────┘                                  ║
╚════════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════ HỆ THỐNG & VẬN HÀNH ═══════════════════════════════╗
║ ┌──────────────┐ ┌──────────────────┐ ┌────────────┐ ┌─────────────────────┐  ║
║ │ AppSetting   │ │ExchangeRateHistor│ │ Voucher    │ │ VoucherUsage        │  ║
║ │──────────────│ │──────────────────│ │────────────│ │─────────────────────│  ║
║ │ Key · Value  │ │ OldRate·NewRate  │ │ Code(uniq) │ │ VoucherId·UserId    │  ║
║ │ Description  │ │ ChangedBy·At     │ │ Type       │ │ OrderId·UsedAt      │  ║
║ │ UpdatedAt    │ └──────────────────┘ │ DiscPercent│ └─────────────────────┘  ║
║ └──────────────┘                      │ DiscAmtUsd │                           ║
║ ┌──────────────────────────────┐      │ MinOrderUsd│ ┌─────────────────────┐  ║
║ │ AuditLog                     │      │ BrandId?   │ │ Notification        │  ║
║ │──────────────────────────────│      │ MaxUsesPer │ │─────────────────────│  ║
║ │ ActorUserId · Action         │      │   User     │ │ UserId·Type·Payload │  ║
║ │ EntityType · EntityKey       │      │ ValidFrom  │ │ IsRead·CreatedAt    │  ║
║ │ BeforeJson · AfterJson       │      │ ValidTo    │ └─────────────────────┘  ║
║ │ OccurredAt                   │      │ IsActive   │ ┌─────────────────────┐  ║
║ └──────────────────────────────┘      └────────────┘ │ SupportRequest      │  ║
║                                                      │─────────────────────│  ║
║                                                      │ Code·Content·Status │  ║
║                                                      └─────────────────────┘  ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

## 5.2. Định nghĩa entity (ký hiệu C#)

> Ký hiệu: `?` = cho phép null · `[PK]` = khóa chính · `[FK]` = khóa ngoại · `[U]` = unique · `[Owned]` = value object nhúng · `[Derived]` = **không lưu, tính khi đọc**

### Nhóm 1 — Danh mục sản phẩm

```csharp
// ── Brand ──────────────────────────────────────────────────────────────
class Brand {
    int      Id;                 // [PK] identity
    string   Name;               // [U] max 255
    string   Slug;               // [U] max 255, dùng cho URL
    string?  LogoUrl;
    ICollection<Product> Products;
}

// ── Category — cây tự tham chiếu 3 cấp ─────────────────────────────────
class Category {
    int      Id;                 // [PK] identity
    string   Name;               // max 100
    string   Slug;               // [U]
    CategoryLevel Level;         // PRIMARY | SECONDARY | TERTIARY
    int?     ParentId;           // [FK] → Category.Id  (null ở cấp PRIMARY)
    bool     IsActive;
    Category?               Parent;
    ICollection<Category>   Children;
    ICollection<Product>    Products;
    // Ràng buộc: Level=PRIMARY ⟺ ParentId IS NULL
    //            Level=SECONDARY ⟹ Parent.Level=PRIMARY
    //            Level=TERTIARY  ⟹ Parent.Level=SECONDARY
}

// ── Product ────────────────────────────────────────────────────────────
class Product {
    string   ProductId;          // [PK] VARCHAR(50) — GIỮ NGUYÊN mã gốc (ADR-012)
    string   Name;               // max 500
    string   Slug;               // [U]
    int      BrandId;            // [FK]
    int      CategoryId;         // [FK] → danh mục cấp TERTIARY
    decimal  PriceUsd;           // numeric(10,2) — TIỀN TỆ GỐC (BR-PRICE-01)
    decimal? SalePriceUsd;       // numeric(10,2) — giá khuyến mãi
    string?  Size;               // "30 ml"
    decimal  Rating;             // numeric(4,2) default 0
    int      ReviewsCount;
    int      LovesCount;
    int      StockQuantity;      // >= 0 (DC-11)
    SellingStatus SellingStatus; // DANG_BAN | THAM_KHAO | NGUNG_BAN | NHAP
    string?  Highlights;         // text — nhãn đặc tính gốc
    string?  IngredientsRaw;     // text — bảng INCI nguyên văn từ nguồn
    string?  DescriptionVi;      // text — mô tả tiếng Việt ĐÃ QUA bộ lọc tuân thủ
    bool     IsVegan, IsCrueltyFree, IsClean;
    bool     IsFragranceFree, IsParabenFree, IsAlcoholFree;
    RoutineStep? RoutineStep;    // bước routine phù hợp (FR-PDP-07)
    string?  ImageLocalUrl;      // ảnh ĐÃ TẢI VỀ CỤC BỘ (DQ-08)
    string?  CosmeticDeclarationNo;      // CMP-01 — để sẵn cho Phase sau
    DateOnly? DeclarationExpiryDate;     // CMP-02
    DateTimeOffset CreatedAt, UpdatedAt;

    Brand    Brand;  Category Category;
    ICollection<ProductIngredient>           Ingredients;
    ICollection<ProductUnmatchedIngredient>  UnmatchedIngredients;
    ICollection<Review>                      Reviews;

    // [Derived] — KHÔNG lưu:
    //   decimal  EffectivePriceUsd  = SalePriceUsd ?? PriceUsd        (BR-PRICE-05)
    //   decimal  PriceVnd           = PricingService.ToVnd(…)         (BR-PRICE-02)
    //   int      AnalysisCoveragePct= C3.CalculateCoverage(…)         (BR-ING-04b)
    //   int?     SuitabilityScore   = C4.Score(product, skinProfile)  (ADR-011)
    //   int?     MaxComedogenic     = max(Ingredients.Comedogenic)    (BR-ING-04)
    // ❌ KHÔNG CÓ: SafetyScore — bất biến INV-01
}
```

### Nhóm 2 — Trí tuệ thành phần

```csharp
// ── Ingredient — từ điển thành phần ────────────────────────────────────
class Ingredient {
    int      Id;                 // [PK] identity
    string   InciName;           // [U] max 255 — tên INCI chuẩn
    string?  VietnameseName;     // max 255
    IngredientFunction PrimaryFunction;   // 8 giá trị (BR-ING-05)
    CosIngStatus CosIngStatus;   // DUOC_DUNG | GIOI_HAN_NONG_DO | BI_CAM | CHUA_RO
    string?  ConcentrationLimit; // text — mô tả giới hạn nồng độ theo CosIng
    int?     ComedogenicRating;  // 0..5, NULL = chưa có dữ liệu (BR-ING-04)
    string?  Description;        // text — diễn giải tiếng Việt TỰ BIÊN SOẠN
    string?  SourceUrl;          // nguồn tham khảo (CosIng)
    bool     IsReviewed;         // đã được người rà soát hay chưa
    DateTimeOffset CreatedAt, UpdatedAt;

    ICollection<IngredientSynonym>    Synonyms;
    ICollection<IngredientFunctionTag> SecondaryFunctions;
    ICollection<ProductIngredient>    Products;
    ICollection<ActiveGroupMember>    ActiveGroups;
    // ❌ KHÔNG CÓ: SafetyScore — bất biến INV-01
}

class IngredientSynonym {
    int    Id;  int IngredientId;      // [FK]
    string SynonymName;                 // [U cùng với IngredientId]
    // Dùng cho BR-ING-06 (khớp tên đồng nghĩa) và FR-SKIN-02 AC-01
}

class IngredientFunctionTag {           // công năng phụ (nhiều)
    int IngredientId;                   // [PK phần 1]
    IngredientFunction Function;        // [PK phần 2]
}

// ── ProductIngredient — bảng nối, GIỮ THỨ TỰ ───────────────────────────
class ProductIngredient {
    string ProductId;                   // [PK phần 1] [FK]
    int    IngredientId;                // [PK phần 2] [FK]
    int    DisplayOrder;                // [U cùng ProductId] — THỨ TỰ GỐC (BR-ING-07)
    bool   IsKeyActive;
    Product Product;  Ingredient Ingredient;
}

// ── ProductUnmatchedIngredient — thành phần chưa nhận diện ─────────────
class ProductUnmatchedIngredient {      // thực thể #6 trong BRD §9.2 — PRD v2.0 THIẾU
    int    Id;  string ProductId;       // [FK]
    string RawText;                     // nguyên văn dòng không khớp từ điển
    int    DisplayOrder;
    // Mục đích: tính tỷ lệ phủ TRUNG THỰC (BR-ING-04b) + danh sách việc cần làm
    //           cho Admin ưu tiên bổ sung từ điển (FR-ADM-04 AC-04)
}

// ── ActiveGroup — nhóm hoạt chất ───────────────────────────────────────
class ActiveGroup {
    int    Id;  string Code;            // [U] "RETINOID", "AHA", "BHA", …
    string DisplayName;                 // "Retinoid (dẫn xuất Vitamin A)"
    string? Description;
    ICollection<ActiveGroupMember> Members;
}

class ActiveGroupMember {
    int ActiveGroupId;                  // [PK phần 1]
    int IngredientId;                   // [PK phần 2]
}

// ── ConflictRule — quy tắc xung đột hoạt chất ──────────────────────────
class ConflictRule {                    // PRD v2.0 THIẾU HOÀN TOÀN (G-07)
    int    Id;
    int    GroupAId, GroupBId;          // [FK] → ActiveGroup  [U cùng nhau]
    ConflictSeverity Severity;          // CAO | LUU_Y | THONG_TIN
    ConflictMechanism Mechanism;        // PHAN_HUY_HOA_HOC | CONG_GOP_KICH_UNG | CAN_THIEP_PH
    EvidenceTier EvidenceTier;          // A | B | C
    string Explanation;                 // giải thích tiếng Việt, BẮT BUỘC
    string Remediation;                 // phương án xử lý, BẮT BUỘC (BR-CONF-05)
    string SourceUrl;                   // BẮT BUỘC, NOT NULL (BR-CONF-01, DC-13)
    string? ProfessionalNote;           // sắc thái chuyên môn (vd Adapalene bền hơn)
    bool   IsActive;
    DateTimeOffset CreatedAt, UpdatedAt;
    ActiveGroup GroupA, GroupB;

    // ⚠️ RÀNG BUỘC BẤT BIẾN (INV-03, DC-14) — thực thi ở DB VÀ ở code:
    //    CHECK ( NOT (EvidenceTier IN ('B','C') AND Severity = 'CAO') )
}
```

### Nhóm 3 — Người dùng & Cá nhân hóa

```csharp
// ── AppUser ────────────────────────────────────────────────────────────
class AppUser {
    int      Id;                 // [PK] identity
    string   Email;              // [U] kiểu citext — không phân biệt hoa/thường (BR-AUTH-01)
    string   PasswordHash;       // PBKDF2 v3 (ADR-004) — ❌ KHÔNG BAO GIỜ trả về API
    string   SecurityStamp;      // đổi ⟹ vô hiệu mọi phiên (BR-AUTH-05)
    string   FullName;
    string?  Phone;              // định dạng VN, 10 số bắt đầu bằng 0
    UserRole Role;               // CUSTOMER | ADMIN
    int      FailedLoginCount;   // BR-AUTH-04
    DateTimeOffset? LockoutUntil;// BR-AUTH-04
    bool     MustChangePassword; // FR-AUTH-06 AC-02
    Address? DefaultAddress;     // [Owned] value object
    DateTimeOffset CreatedAt, UpdatedAt;

    SkinProfile?  SkinProfile;   // 1:0..1
    Cart?         Cart;          // 1:0..1 (DC-03)
    ICollection<Order> Orders;
    ICollection<WishlistItem> WishlistItems;
    ICollection<SavedRoutine> SavedRoutines;
}

class Address {                  // [Owned] — nhúng vào AppUser và Order
    string RecipientName, Phone, Province, District, Ward, DetailAddress;
    string? Note;
}

// ── SkinProfile — DỮ LIỆU CÁ NHÂN NHẠY CẢM ─────────────────────────────
class SkinProfile {
    int      UserId;             // [PK] = [FK] → AppUser (1:1)
    SkinType SkinType;           // DAU|KHO|HON_HOP|THUONG|NHAY_CAM (BR-SKIN-01)
    bool     IsSensitive;        // thuộc tính bổ sung
    ExperienceLevel ExperienceLevel;  // MOI_BAT_DAU | DA_DUNG_HOAT_CHAT
    decimal? BudgetUsd;          // ngân sách cho một routine
    bool     AllowAiSharing;     // ⚠️ MẶC ĐỊNH FALSE (FR-SKIN-07 AC-01, NFR-PRIV-04)
    DateTimeOffset UpdatedAt;

    ICollection<SkinConcern>  Concerns;        // tối đa 5 (BR-SKIN-02)
    ICollection<SkinAllergy>  Allergies;
    ICollection<CurrentlyUsingItem> CurrentlyUsing;
    // ⚠️ BẤT BIẾN INV-07: KHÔNG tồn tại endpoint nào cho Admin đọc entity này
}

class SkinConcern  { int UserId; SkinConcernCode ConcernCode; }   // [PK] cả hai
class SkinAllergy  {
    int  Id;  int UserId;                                          // [FK]
    int? IngredientId;                                             // [FK] khi đã khớp từ điển
    string? FreeTextNote;                                          // khi CHƯA khớp (BR-SKIN-03)
    // Ràng buộc: IngredientId IS NOT NULL XOR FreeTextNote IS NOT NULL
    // Chỉ dòng có IngredientId được dùng để cảnh báo tự động
}
class CurrentlyUsingItem {       // FR-CONF-05 — PRD v2.0 THIẾU
    int Id;  int UserId;
    string? ProductId;           // [FK] nếu là sản phẩm trên sàn
    int?    ActiveGroupId;       // [FK] nếu khách chỉ khai hoạt chất
    // Ràng buộc: ProductId IS NOT NULL XOR ActiveGroupId IS NOT NULL
}

// ── SavedRoutine ───────────────────────────────────────────────────────
class SavedRoutine {             // PRD v2.0 THIẾU
    int    Id;  int UserId;      // [FK]
    string Name;
    DateTimeOffset CreatedAt;
    ICollection<SavedRoutineStep> Steps;
    // Giới hạn: tối đa 3 routine/người (FR-QUIZ-07 AC-01)
}
class SavedRoutineStep {
    int Id;  int SavedRoutineId; // [FK]
    int StepOrder;               // [U cùng SavedRoutineId + TimeOfDay]
    TimeOfDay TimeOfDay;         // SANG | TOI
    RoutineStep StepType;        // LAM_SACH | DAC_TRI | CHONG_NANG | …
    string ProductId;            // [FK]
    int?   MatchScoreSnapshot;   // điểm tại thời điểm lưu (thông tin, không dùng lại)
}
```

### Nhóm 4 — Thương mại

```csharp
// ── Cart ───────────────────────────────────────────────────────────────
class Cart {
    int      Id;  int UserId;    // [U] — một người MỘT giỏ (DC-03)
    bool     ConflictWarningAcknowledged;   // BR-CONF-04, FR-ORD-12
    DateTimeOffset CreatedAt, UpdatedAt;
    ICollection<CartItem> Items;
    ICollection<CartVoucher> AppliedVouchers;   // tối đa 3, mỗi loại 1 (BR-CART-05)
}
class CartItem {
    int    Id;  int CartId;      // [FK]
    string ProductId;            // [FK]  [U cùng CartId] (DC-04)
    int    Quantity;             // 1..min(10, stock) (BR-CART-03)
    DateTimeOffset AddedAt;
}
class CartVoucher { int CartId; int VoucherId; }   // [PK] cả hai

class WishlistItem {
    int    Id;  int UserId;      // [FK]
    string ProductId;            // [FK]  [U cùng UserId] (DC-04)
    DateTimeOffset CreatedAt;
}

// ── Voucher ────────────────────────────────────────────────────────────
class Voucher {
    int      Id;  string Code;   // [U] (DC-15)
    VoucherType Type;            // BRAND | PLATFORM | FREESHIP
    decimal  DiscountPercent;    // 0 nếu dùng số tiền
    decimal  DiscountAmountUsd;  // 0 nếu dùng %
    decimal  MinOrderUsd;
    int?     BrandId;            // [FK] — BẮT BUỘC khi Type=BRAND
    int?     MaxUsesPerUser;     // null = không giới hạn
    int?     MaxTotalUses;
    DateTimeOffset ValidFrom, ValidTo;
    bool     IsActive;
    // Ràng buộc: (DiscountPercent > 0) XOR (DiscountAmountUsd > 0)
    //            Type = BRAND ⟹ BrandId IS NOT NULL
}
class VoucherUsage {             // PRD v2.0 THIẾU — lỗ hổng nghiệp vụ (G-07)
    int Id;  int VoucherId;      // [FK]
    int UserId;  int OrderId;    // [FK]
    DateTimeOffset UsedAt;
    // Dùng để thực thi MaxUsesPerUser / MaxTotalUses (BR-CART-08, DC-15)
}

// ── Order ──────────────────────────────────────────────────────────────
class Order {
    int      Id;
    string   OrderCode;          // [U] "BA-20261021-0042" (BR-ORDER-07, DC-10)
    int      UserId;             // [FK]
    OrderStatus Status;          // CHO_XU_LY|DA_THANH_TOAN|DANG_GIAO|DA_GIAO|DA_HUY
    PaymentMethod PaymentMethod; // COD | VNPAY
    PaymentStatus PaymentStatus; // CHUA_THANH_TOAN|DA_THANH_TOAN|THAT_BAI|HET_HAN
    string   DisplayCurrency;    // tiền tệ khách CHỌN lúc checkout (hiển thị)

    // ── ĐÓNG BĂNG tại thời điểm chốt đơn (BR-PRICE-04, DC-08, DC-09) ──
    decimal  ExchangeRateApplied;    // NOT NULL, > 0
    decimal  SubtotalUsd;
    decimal  ComboDiscountUsd;       // BR-CART-11
    decimal  BrandDiscountUsd;       // BR-CART-06 bước ②
    decimal  PlatformDiscountUsd;    // BR-CART-06 bước ③
    decimal  ShippingFeeVnd;         // BR-CART-10
    decimal  ShippingDiscountVnd;    // BR-CART-06 bước ⑤
    decimal  TotalUsd;
    decimal  TotalVnd;               // ❌ KHÔNG BAO GIỜ tính lại (DC-09)

    Address  ShippingAddress;        // [Owned] — bản chụp, không tham chiếu AppUser
    bool     ConflictWarningShown;   // FR-ORD-12
    string?  ConflictWarningSnapshot;// jsonb — cảnh báo đã hiển thị
    string?  IdempotencyKey;         // [U] — NFR-REL-02
    string?  TaxCode;                // CMP-24 — để sẵn cho hóa đơn Phase sau
    DateTimeOffset CreatedAt, UpdatedAt;

    ICollection<OrderItem>      Items;
    ICollection<OrderVoucher>   Vouchers;
    ICollection<OrderStatusLog> StatusLogs;
}

// ── OrderItem — BẢN CHỤP ĐẦY ĐỦ (ADR-010) ──────────────────────────────
class OrderItem {
    int      Id;  int OrderId;   // [FK]
    string   ProductId;          // [FK] — CHỈ để liên kết, KHÔNG để đọc dữ liệu
    string   ProductNameSnapshot;    // ⚠️ PRD v2.0 THIẾU trường này
    string   BrandNameSnapshot;      // ⚠️ PRD v2.0 THIẾU trường này
    string?  ImageUrlSnapshot;
    decimal  UnitPriceUsd;
    int      Quantity;
    decimal  LineTotalUsd;
    // Trùng lặp dữ liệu CÓ CHỦ ĐÍCH — xem ADR-010. Không "tối ưu" đi.
}
class OrderVoucher {
    int OrderId;  int VoucherId; // [PK] cả hai
    string VoucherCodeSnapshot;
    decimal DiscountAppliedUsd;  // số tiền giảm THỰC TẾ của mã này
}
class OrderStatusLog {           // PRD v2.0 THIẾU
    int Id;  int OrderId;        // [FK]
    OrderStatus? FromStatus;  OrderStatus ToStatus;
    int? ByUserId;               // null = hệ thống (vd callback cổng thanh toán)
    string? Reason;              // BẮT BUỘC khi Admin hủy đơn (BR-ORDER-02)
    DateTimeOffset OccurredAt;
}
```

### Nhóm 5 — Đánh giá & Hội thoại

```csharp
// ── Review ─────────────────────────────────────────────────────────────
class Review {                   // PRD v2.0 THIẾU dù có tính năng (G-07)
    long     Id;
    string   ProductId;          // [FK]
    int?     UserId;             // [FK] — null khi Source=DU_LIEU_NGOAI
    int      Rating;             // 1..5 (DC-06)
    string   Content;            // 20..2000 ký tự
    SkinType? AuthorSkinType;    // nhãn loại da người viết (FR-PDP-10)
    ReviewSource Source;         // NOI_BO | DU_LIEU_NGOAI
    string?  ExternalAuthorRef;  // mã tác giả ẩn danh từ dataset
    int      HelpfulCount;
    ReviewStatus Status;         // HIEN_THI | DA_AN
    string?  ModerationReason;   // FR-REV-05
    DateTimeOffset SubmittedAt;
    // [U] (ProductId, UserId) khi Source = NOI_BO (DC-16)
    // Chỉ cho viết khi có Order DA_GIAO chứa ProductId (FR-REV-03 AC-01)
}
class ReviewHelpfulVote { long ReviewId; int UserId; }   // [PK] cả hai

// ── Conversation ───────────────────────────────────────────────────────
class Conversation {             // PRD v2.0 THIẾU
    Guid     Id;                 // [PK]
    int?     UserId;             // [FK] — null nếu khách chưa đăng nhập
    string   SessionKey;         // định danh phiên trình duyệt
    DateTimeOffset StartedAt;
    DateTimeOffset ExpiresAt;    // = StartedAt + 90 ngày (DC-18, BR-AI-09)
    ICollection<ConversationMessage> Messages;
}
class ConversationMessage {
    long     Id;  Guid ConversationId;   // [FK]
    MessageRole Role;            // USER | ASSISTANT | SYSTEM
    string   Content;            // ĐÃ che dữ liệu cá nhân khi lưu (NFR-PRIV-10)
    ResolvedTier? ResolvedTier;  // RULES | LLM | CHUYEN_TIEP_ZALO (BO-05)
    bool?    WasHelpful;         // FR-CHAT-13
    int?     LlmPromptTokens, LlmCompletionTokens;   // NFR-OBS-02
    decimal? EstimatedCostUsd;   // NFR-OBS-02 → RISK-03
    int      LatencyMs;
    DateTimeOffset CreatedAt;
}

// ── HandoffRequest ─────────────────────────────────────────────────────
class HandoffRequest {           // PRD v2.0 THIẾU
    int      Id;
    string   HandoffCode;        // [U] "BA-7F3K" — Crockford Base32 (ADR-006)
    Guid     ConversationId;     // [FK]
    int?     UserId;             // [FK]
    string   Summary;            // tóm tắt 3–5 dòng
    string   Reason;             // lý do chuyển tiếp
    bool     ProfileConsentGiven;// ⚠️ BẮT BUỘC đồng ý RIÊNG (BR-AI-11, FR-CHAT-07 AC-02)
    string?  SkinSnapshotJson;   // jsonb — CHỈ khi ProfileConsentGiven = true
    string?  CartSnapshotJson;   // jsonb
    HandoffStatus Status;        // CHO | DA_TIEP_NHAN | DA_XU_LY | HUY
    DateTimeOffset CreatedAt;
    DateTimeOffset ExpiresAt;    // = CreatedAt + 24 giờ (ADR-006)
    int?     HandledByUserId;  DateTimeOffset? HandledAt;
}

// ── Kịch bản chatbot ───────────────────────────────────────────────────
class ChatIntent {               // Tầng 1 (FR-ADM-10)
    int    Id;  string Code;     // [U] "CHINH_SACH_DOI_TRA", "TRA_GIA_SAN_PHAM", …
    string DisplayName;
    string PatternsJson;         // jsonb — mảng mẫu/từ khóa khớp
    string ResponseTemplate;     // có thể chứa biến thay thế từ DB
    IntentHandler Handler;       // TEMPLATE | QUERY_PRODUCT | QUERY_ORDER | QUERY_INGREDIENT
    bool   IsActive;
}
class BlockedTopic {             // Vùng chặn (BR-AI-03)
    int    Id;  string Code;     // [U] "CHAN_DOAN_BENH", "THAI_KY", "TRE_DUOI_12", …
    string DisplayName;
    string PatternsJson;         // jsonb
    string FixedResponse;        // câu trả lời cố định + khuyến nghị gặp bác sĩ
    bool   RequiresUrgentAdvice; // true ⟹ khuyên đi khám NGAY (GC-10)
    bool   IsSystemImmutable;    // ⚠️ true ⟹ KHÔNG XÓA ĐƯỢC (FR-ADM-10 AC-03)
}
```

### Nhóm 6 — Gợi ý tính sẵn & Hệ thống

```csharp
// ── Gợi ý tính sẵn ngoại tuyến (ADR-001) ───────────────────────────────
class ProductSimilarity {
    string ProductId, SimilarProductId;   // [PK] cả hai, [FK]
    decimal Score;                        // 0..1
    int     Version;                      // BR-DATA-06
    DateTimeOffset ComputedAt;
}
class AssociationRule {
    int     Id;
    string  AntecedentProductId, ConsequentProductId;   // [FK]
    decimal Support, Confidence, Lift;
    int     Version;  DateTimeOffset ComputedAt;
    // Chỉ nạp luật có Support>=0.005 AND Confidence>=0.20 AND Lift>1 (BR-REC-08)
}

// ── Hệ thống ───────────────────────────────────────────────────────────
class AppSetting {
    string Key;                  // [PK] "exchange_rate_usd_vnd", "support_hours_start", …
    string Value;                // lưu dạng chuỗi, parse theo kiểu khai báo
    string DataType;             // decimal | int | string | time | bool | json
    string Description;          // BẮT BUỘC — FR-ADM-09 yêu cầu mô tả ý nghĩa
    DateTimeOffset UpdatedAt;  int? UpdatedByUserId;
}
class ExchangeRateHistory {      // PRD v2.0 THIẾU (BR-PRICE-03)
    int Id;  decimal OldRate, NewRate;
    int ChangedByUserId;  DateTimeOffset ChangedAt;
}
class AuditLog {                 // PRD v2.0 THIẾU (BR-SEC-05, FR-ADM-16)
    long   Id;  int ActorUserId;
    string Action;               // "UPDATE_PRODUCT_PRICE", "CANCEL_ORDER", …
    string EntityType, EntityKey;
    string? BeforeJson, AfterJson;   // jsonb — ĐÃ che dữ liệu cá nhân
    DateTimeOffset OccurredAt;
    // Ghi TỰ ĐỘNG bởi AuditInterceptor (C9) — không phụ thuộc Dev nhớ gọi
}
class Notification {
    long   Id;  int UserId;      // [FK]
    NotificationType Type;  string PayloadJson;
    bool   IsRead;  DateTimeOffset CreatedAt;
}
class SupportRequest {
    int    Id;  string Code;     // [U] mã tra cứu cho khách
    int?   UserId;  string ContactInfo, Content;
    SupportStatus Status;  DateTimeOffset CreatedAt;
}
```

## 5.3. Bảng tổng hợp quan hệ

| Quan hệ | Loại | Hành vi khi xóa | Lý do |
|---|---|---|---|
| `Brand` → `Product` | 1:N | `RESTRICT` | Không cho xóa thương hiệu còn sản phẩm |
| `Category` → `Category` | 1:N tự tham chiếu | `RESTRICT` | `FR-ADM-03` — không xóa danh mục còn con |
| `Category` → `Product` | 1:N | `RESTRICT` | `FR-ADM-03` — phải chuyển sản phẩm trước |
| `Product` ↔ `Ingredient` | N:M qua `ProductIngredient` | `CASCADE` phía Product · `RESTRICT` phía Ingredient | Xóa sản phẩm thì xóa liên kết; không cho xóa thành phần đang được dùng |
| `Ingredient` → `IngredientSynonym` | 1:N | `CASCADE` | — |
| `ActiveGroup` ↔ `Ingredient` | N:M qua `ActiveGroupMember` | `CASCADE` | — |
| `ActiveGroup` → `ConflictRule` | 1:N (hai phía A và B) | `RESTRICT` | Không cho xóa nhóm đang có quy tắc |
| `AppUser` → `SkinProfile` | 1:0..1 | `CASCADE` | `FR-SKIN-06` — xóa hồ sơ là xóa thật |
| `SkinProfile` → `SkinConcern`/`SkinAllergy`/`CurrentlyUsing` | 1:N | `CASCADE` | `BR-SKIN-07` |
| `AppUser` → `Cart` | 1:0..1 | `CASCADE` | — |
| `Cart` → `CartItem` | 1:N | `CASCADE` | — |
| `AppUser` → `Order` | 1:N | **`RESTRICT`** | ⚠️ **Không được xóa người dùng còn đơn hàng** — dữ liệu kế toán |
| `Order` → `OrderItem` | 1:N | `CASCADE` | — |
| `Product` → `OrderItem` | 1:N | **`RESTRICT`** | ⚠️ `DC-21` — xóa sản phẩm **không** được xóa lịch sử đơn |
| `Order` → `OrderStatusLog` | 1:N | `CASCADE` | — |
| `Voucher` → `VoucherUsage` | 1:N | `RESTRICT` | Giữ lịch sử sử dụng |
| `Product` → `Review` | 1:N | `CASCADE` | — |
| `AppUser` → `Review` | 1:N | `SET NULL` | Xóa người dùng thì đánh giá trở thành ẩn danh |
| `Conversation` → `ConversationMessage` | 1:N | `CASCADE` | `BR-AI-09` — dọn theo phiên |
| `Conversation` → `HandoffRequest` | 1:N | `CASCADE` | — |
| `Product` → `ProductSimilarity` | 1:N (hai phía) | `CASCADE` | Dữ liệu dẫn xuất, tính lại được |
| `Product` → `AssociationRule` | 1:N (hai phía) | `CASCADE` | Dữ liệu dẫn xuất |

## 5.4. Nguyên tắc cấu hình EF Core

| Nguyên tắc | Lý do |
|---|---|
| **Fluent API trong `IEntityTypeConfiguration<T>` riêng từng entity** | Giữ `Domain` sạch, không phụ thuộc EF Core (§3.3). Dễ review trong PR |
| **Mọi `DateTimeOffset` lưu dạng `timestamptz`** | `BR-DATA-02` — UTC |
| **Enum lưu dạng `varchar` + ràng buộc `CHECK`**, không lưu số | Đọc được trực tiếp trong DB; thêm giá trị mới không phá dữ liệu cũ; truy vấn tay dễ hơn |
| **`Email` dùng kiểu `citext`** của PostgreSQL | `BR-AUTH-01` — không phân biệt hoa/thường ở tầng DB, không phụ thuộc code nhớ `.ToLower()` |
| **Trường jsonb cho dữ liệu bán cấu trúc** (`PatternsJson`, `BeforeJson`, snapshot) | Linh hoạt mà vẫn truy vấn được; tránh tạo bảng cho dữ liệu chỉ đọc nguyên khối |
| **`RowVersion` (`xmin`) cho `Product`** | Phát hiện xung đột cập nhật đồng thời khi Admin sửa giá |
| **Truy vấn `AsNoTracking()` làm mặc định cho mọi query đọc** | Hiệu năng; chỉ bật tracking khi thực sự sửa |
| **Truy vấn biên dịch (`EF.CompileAsyncQuery`) cho các query nóng** | `NFR-PERF-03` — danh mục & tìm kiếm |
| **Không dùng Lazy Loading** | Tránh truy vấn N+1 ngoài ý muốn; dùng `Include` tường minh |
| **Migration là nguồn chân lý của lược đồ** | ADR-003 — lý do bỏ Stored Procedure |
| **Index được khai báo trong Fluent API, không chỉ trong SQL tay** | Để migration mang theo index; tránh sai lệch giữa môi trường |

---
# 6. LƯỢC ĐỒ CƠ SỞ DỮ LIỆU VẬT LÝ

> **Nguồn chân lý của lược đồ là EF Core Migrations.** DDL dưới đây là **bản tham chiếu đã được rà soát** để Dev/AI Agent đối chiếu, và để khởi tạo nhanh khi cần. Khi hai bên khác nhau → **migration thắng**, và phải cập nhật tài liệu này trong cùng change (`AGENTS.md §2.2`).
>
> ⚠️ **Đã sửa lỗi của PRD v2.0 (`G-06`):** mọi giá trị mặc định dạng chuỗi dùng **nháy đơn** `'user'`, không phải nháy kép `"user"` (trong PostgreSQL nháy kép là tên đối tượng → lỗi `column "user" does not exist`).

## 6.1. Phần mở đầu — extension & enum domain

```sql
-- ═══════════════════════════════════════════════════════════════════
-- EXTENSION (bắt buộc — xem ADR-002)
-- ═══════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS citext;      -- email không phân biệt hoa/thường (BR-AUTH-01)
CREATE EXTENSION IF NOT EXISTS unaccent;    -- tìm kiếm không dấu (FR-CAT-03 AC-03)
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- gợi ý tìm kiếm mờ (FR-CAT-03 AC-02)

-- Hàm chuẩn hóa tìm kiếm: bỏ dấu + chữ thường. IMMUTABLE để dùng được trong index.
CREATE OR REPLACE FUNCTION vn_normalize(txt text)
RETURNS text AS $$
  SELECT lower(public.unaccent('public.unaccent', coalesce(txt, '')))
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;
```

> 💡 **Ghi chú kỹ thuật quan trọng:** `unaccent()` một tham số **không** phải `IMMUTABLE` (vì phụ thuộc cấu hình từ điển), nên **không dùng được trong index**. Phải gọi dạng hai tham số `unaccent('public.unaccent', txt)` như trên. Đây là lỗi rất phổ biến khi làm tìm kiếm không dấu trong PostgreSQL — nếu làm sai, `CREATE INDEX` sẽ báo *"functions in index expression must be marked IMMUTABLE"*.

## 6.2. Danh mục sản phẩm

```sql
-- ═══ 1. Thương hiệu ═══
CREATE TABLE brands (
    id          INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL,
    logo_url    TEXT,
    CONSTRAINT uq_brands_name UNIQUE (name),
    CONSTRAINT uq_brands_slug UNIQUE (slug)
);

-- ═══ 2. Danh mục 3 cấp (tự tham chiếu) ═══
CREATE TABLE categories (
    id          INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(150) NOT NULL,
    level       VARCHAR(20)  NOT NULL,
    parent_id   INT REFERENCES categories(id) ON DELETE RESTRICT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_categories_slug UNIQUE (slug),
    CONSTRAINT ck_categories_level CHECK (level IN ('PRIMARY','SECONDARY','TERTIARY')),
    -- Cấp PRIMARY không có cha; cấp khác bắt buộc có cha
    CONSTRAINT ck_categories_parent CHECK (
        (level = 'PRIMARY'  AND parent_id IS NULL) OR
        (level <> 'PRIMARY' AND parent_id IS NOT NULL)
    )
);
CREATE INDEX ix_categories_parent ON categories(parent_id);

-- ═══ 3. Sản phẩm ═══
CREATE TABLE products (
    product_id              VARCHAR(50)  PRIMARY KEY,   -- GIỮ mã gốc (ADR-012)
    name                    VARCHAR(500) NOT NULL,
    slug                    VARCHAR(600) NOT NULL,
    brand_id                INT NOT NULL REFERENCES brands(id)     ON DELETE RESTRICT,
    category_id             INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    price_usd               NUMERIC(10,2) NOT NULL,
    sale_price_usd          NUMERIC(10,2),
    size                    VARCHAR(100),
    rating                  NUMERIC(4,2)  NOT NULL DEFAULT 0,
    reviews_count           INT           NOT NULL DEFAULT 0,
    loves_count             INT           NOT NULL DEFAULT 0,
    stock_quantity          INT           NOT NULL DEFAULT 0,
    selling_status          VARCHAR(20)   NOT NULL DEFAULT 'NHAP',
    highlights              TEXT,
    ingredients_raw         TEXT,
    description_vi          TEXT,                      -- ĐÃ qua bộ lọc tuân thủ (CMP-05)
    is_vegan                BOOLEAN NOT NULL DEFAULT FALSE,
    is_cruelty_free         BOOLEAN NOT NULL DEFAULT FALSE,
    is_clean                BOOLEAN NOT NULL DEFAULT FALSE,
    is_fragrance_free       BOOLEAN NOT NULL DEFAULT FALSE,
    is_paraben_free         BOOLEAN NOT NULL DEFAULT FALSE,
    is_alcohol_free         BOOLEAN NOT NULL DEFAULT FALSE,
    routine_step            VARCHAR(20),
    image_local_url         TEXT,                      -- ảnh TẢI VỀ CỤC BỘ (DQ-08)
    cosmetic_declaration_no VARCHAR(100),              -- CMP-01, để sẵn cho Phase sau
    declaration_expiry_date DATE,                      -- CMP-02
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_products_slug      UNIQUE (slug),
    CONSTRAINT ck_products_price     CHECK (price_usd >= 0),
    CONSTRAINT ck_products_saleprice CHECK (sale_price_usd IS NULL OR
                                            (sale_price_usd >= 0 AND sale_price_usd <= price_usd)),
    CONSTRAINT ck_products_rating    CHECK (rating BETWEEN 0 AND 5),
    CONSTRAINT ck_products_stock     CHECK (stock_quantity >= 0),          -- DC-11 / INV-02
    CONSTRAINT ck_products_status    CHECK (selling_status IN
                                            ('DANG_BAN','THAM_KHAO','NGUNG_BAN','NHAP')),
    CONSTRAINT ck_products_step      CHECK (routine_step IS NULL OR routine_step IN
        ('TAY_TRANG','LAM_SACH','CAN_BANG','TAY_DA_CHET','DAC_TRI','DUONG_AM','CHONG_NANG'))
    -- ❌ KHÔNG CÓ cột safety_score — bất biến INV-01, ràng buộc DC-07
);

-- Chỉ mục phục vụ danh mục & tìm kiếm (NFR-PERF-03, NFR-PERF-04)
CREATE INDEX ix_products_brand        ON products(brand_id);
CREATE INDEX ix_products_category     ON products(category_id);
CREATE INDEX ix_products_status       ON products(selling_status)
                                      WHERE selling_status IN ('DANG_BAN','THAM_KHAO');
CREATE INDEX ix_products_price        ON products(price_usd);
CREATE INDEX ix_products_rating       ON products(rating DESC);
CREATE INDEX ix_products_loves        ON products(loves_count DESC);
CREATE INDEX ix_products_routinestep  ON products(routine_step);
-- Lọc theo nhãn đặc tính: index tổ hợp các cờ boolean hay dùng nhất
CREATE INDEX ix_products_flags        ON products(is_vegan, is_cruelty_free, is_clean);
-- Tìm kiếm không dấu + mờ
CREATE INDEX ix_products_name_trgm    ON products USING GIN (vn_normalize(name) gin_trgm_ops);
CREATE INDEX ix_products_highlights_trgm
                                      ON products USING GIN (vn_normalize(highlights) gin_trgm_ops);
```

## 6.3. Trí tuệ thành phần

```sql
-- ═══ 4. Từ điển thành phần ═══
CREATE TABLE ingredients (
    id                  INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    inci_name           VARCHAR(255) NOT NULL,
    vietnamese_name     VARCHAR(255),
    primary_function    VARCHAR(30)  NOT NULL,
    cosing_status       VARCHAR(30)  NOT NULL DEFAULT 'CHUA_RO',
    concentration_limit TEXT,
    comedogenic_rating  SMALLINT,                      -- NULL = chưa có dữ liệu (BR-ING-04)
    description         TEXT,                          -- TỰ BIÊN SOẠN (BR-ING-04c)
    source_url          TEXT,
    is_reviewed         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_ingredients_inci UNIQUE (inci_name),
    CONSTRAINT ck_ingredients_func CHECK (primary_function IN
        ('DUONG_AM','LAM_DIU','CHONG_OXY_HOA','DAC_TRI',
         'LAM_SACH','CHONG_NANG','TAO_CAU_TRUC','HUONG_BAO_QUAN')),
    CONSTRAINT ck_ingredients_cosing CHECK (cosing_status IN
        ('DUOC_DUNG','GIOI_HAN_NONG_DO','BI_CAM','CHUA_RO')),
    CONSTRAINT ck_ingredients_comedo CHECK (comedogenic_rating IS NULL OR
                                            comedogenic_rating BETWEEN 0 AND 5)   -- DC-06
    -- ❌ KHÔNG CÓ cột safety_score — bất biến INV-01
);
CREATE INDEX ix_ingredients_func      ON ingredients(primary_function);
CREATE INDEX ix_ingredients_reviewed  ON ingredients(is_reviewed);
CREATE INDEX ix_ingredients_inci_trgm ON ingredients USING GIN (vn_normalize(inci_name) gin_trgm_ops);

-- ═══ 5. Tên đồng nghĩa (BR-ING-06) ═══
CREATE TABLE ingredient_synonyms (
    id            INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    synonym_name  VARCHAR(255) NOT NULL,
    CONSTRAINT uq_ing_syn UNIQUE (ingredient_id, synonym_name)
);
CREATE INDEX ix_ing_syn_name ON ingredient_synonyms USING GIN (vn_normalize(synonym_name) gin_trgm_ops);

-- ═══ 6. Công năng phụ ═══
CREATE TABLE ingredient_function_tags (
    ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    function      VARCHAR(30) NOT NULL,
    PRIMARY KEY (ingredient_id, function),
    CONSTRAINT ck_ift_func CHECK (function IN
        ('DUONG_AM','LAM_DIU','CHONG_OXY_HOA','DAC_TRI',
         'LAM_SACH','CHONG_NANG','TAO_CAU_TRUC','HUONG_BAO_QUAN'))
);

-- ═══ 7. Liên kết Sản phẩm – Thành phần (GIỮ THỨ TỰ) ═══
CREATE TABLE product_ingredients (
    product_id    VARCHAR(50) NOT NULL REFERENCES products(product_id)  ON DELETE CASCADE,
    ingredient_id INT         NOT NULL REFERENCES ingredients(id)       ON DELETE RESTRICT,
    display_order INT         NOT NULL,
    is_key_active BOOLEAN     NOT NULL DEFAULT FALSE,
    PRIMARY KEY (product_id, ingredient_id),
    -- Thứ tự phải DUY NHẤT trong phạm vi một sản phẩm (DC-05, BR-ING-07)
    CONSTRAINT uq_prod_ing_order UNIQUE (product_id, display_order),
    CONSTRAINT ck_prod_ing_order CHECK (display_order >= 1)
);
CREATE INDEX ix_prod_ing_ingredient ON product_ingredients(ingredient_id);
-- Index này là THEN CHỐT cho FR-CAT-06 (lọc theo hoạt chất) — không có nó, lọc sẽ quét toàn bảng

-- ═══ 8. Thành phần chưa nhận diện (PRD v2.0 THIẾU — G-07) ═══
CREATE TABLE product_unmatched_ingredients (
    id            BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    product_id    VARCHAR(50) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    raw_text      VARCHAR(500) NOT NULL,
    display_order INT NOT NULL
);
CREATE INDEX ix_pui_product  ON product_unmatched_ingredients(product_id);
CREATE INDEX ix_pui_rawtext  ON product_unmatched_ingredients(vn_normalize(raw_text));
-- Dùng cho FR-ADM-04 AC-04: Admin sắp theo số lần xuất hiện để ưu tiên bổ sung từ điển

-- ═══ 9. Nhóm hoạt chất ═══
CREATE TABLE active_groups (
    id           INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code         VARCHAR(50)  NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description  TEXT,
    CONSTRAINT uq_active_groups_code UNIQUE (code)
);
CREATE TABLE active_group_members (
    active_group_id INT NOT NULL REFERENCES active_groups(id) ON DELETE CASCADE,
    ingredient_id   INT NOT NULL REFERENCES ingredients(id)   ON DELETE CASCADE,
    PRIMARY KEY (active_group_id, ingredient_id)
);
CREATE INDEX ix_agm_ingredient ON active_group_members(ingredient_id);

-- ═══ 10. Quy tắc xung đột (PRD v2.0 THIẾU — G-07) ═══
CREATE TABLE conflict_rules (
    id                INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    group_a_id        INT NOT NULL REFERENCES active_groups(id) ON DELETE RESTRICT,
    group_b_id        INT NOT NULL REFERENCES active_groups(id) ON DELETE RESTRICT,
    severity          VARCHAR(20) NOT NULL,
    mechanism         VARCHAR(30) NOT NULL,
    evidence_tier     CHAR(1)     NOT NULL,
    explanation       TEXT        NOT NULL,
    remediation       TEXT        NOT NULL,                 -- BR-CONF-05
    source_url        TEXT        NOT NULL,                 -- DC-13 — BẮT BUỘC
    professional_note TEXT,
    is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_cr_severity  CHECK (severity  IN ('CAO','LUU_Y','THONG_TIN')),
    CONSTRAINT ck_cr_mechanism CHECK (mechanism IN
                       ('PHAN_HUY_HOA_HOC','CONG_GOP_KICH_UNG','CAN_THIEP_PH')),
    CONSTRAINT ck_cr_tier      CHECK (evidence_tier IN ('A','B','C')),
    CONSTRAINT ck_cr_distinct  CHECK (group_a_id <> group_b_id),
    CONSTRAINT ck_cr_sourceurl CHECK (length(trim(source_url)) > 0),

    -- ⚠️⚠️ BẤT BIẾN INV-03 / DC-14 — thực thi NGAY TẠI TẦNG DỮ LIỆU.
    -- Lý do: nếu chỉ kiểm ở code, một lần nạp dữ liệu sai sẽ tạo cảnh báo đỏ
    -- không có bằng chứng — đúng thứ BeautyAI muốn khác biệt với Yuka.
    CONSTRAINT ck_cr_tier_severity CHECK (
        NOT (evidence_tier IN ('B','C') AND severity = 'CAO')
    )
);
-- Một cặp nhóm chỉ có MỘT quy tắc, bất kể thứ tự A/B
CREATE UNIQUE INDEX uq_cr_pair ON conflict_rules (
    LEAST(group_a_id, group_b_id), GREATEST(group_a_id, group_b_id)
);
CREATE INDEX ix_cr_active ON conflict_rules(is_active) WHERE is_active = TRUE;
```

## 6.4. Người dùng & cá nhân hóa

```sql
-- ═══ 11. Người dùng ═══
CREATE TABLE app_users (
    id                   INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    email                CITEXT       NOT NULL,          -- BR-AUTH-01 (ADR-002)
    password_hash        VARCHAR(255) NOT NULL,          -- PBKDF2 v3 (ADR-004) · DC-19
    security_stamp       VARCHAR(64)  NOT NULL,          -- BR-AUTH-05
    full_name            VARCHAR(255) NOT NULL,
    phone                VARCHAR(20),
    role                 VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER',   -- ✅ nháy ĐƠN (G-06)
    failed_login_count   INT          NOT NULL DEFAULT 0,
    lockout_until        TIMESTAMPTZ,
    must_change_password BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Địa chỉ mặc định (owned value object)
    addr_recipient_name  VARCHAR(255), addr_phone    VARCHAR(20),
    addr_province        VARCHAR(100), addr_district VARCHAR(100),
    addr_ward            VARCHAR(100), addr_detail   VARCHAR(500),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_role  CHECK (role IN ('CUSTOMER','ADMIN')),
    CONSTRAINT ck_users_phone CHECK (phone IS NULL OR phone ~ '^0[0-9]{9}$')  -- BR-ORDER-08
);

-- ═══ 12. Hồ sơ da — DỮ LIỆU CÁ NHÂN NHẠY CẢM ═══
CREATE TABLE skin_profiles (
    user_id          INT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    skin_type        VARCHAR(20) NOT NULL,
    is_sensitive     BOOLEAN NOT NULL DEFAULT FALSE,
    experience_level VARCHAR(30) NOT NULL DEFAULT 'MOI_BAT_DAU',
    budget_usd       NUMERIC(10,2),
    allow_ai_sharing BOOLEAN NOT NULL DEFAULT FALSE,   -- ⚠️ MẶC ĐỊNH FALSE (NFR-PRIV-04)
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_sp_type CHECK (skin_type IN ('DAU','KHO','HON_HOP','THUONG','NHAY_CAM')),
    CONSTRAINT ck_sp_exp  CHECK (experience_level IN ('MOI_BAT_DAU','DA_DUNG_HOAT_CHAT'))
);
COMMENT ON TABLE skin_profiles IS
  'DỮ LIỆU CÁ NHÂN NHẠY CẢM (tình trạng sức khỏe). Chỉ chủ sở hữu truy cập. '
  'Admin KHÔNG có quyền đọc (BR-SEC-03, INV-07). Không gửi gắn danh tính ra ngoài (BR-AI-16).';

CREATE TABLE skin_concerns (
    user_id      INT NOT NULL REFERENCES skin_profiles(user_id) ON DELETE CASCADE,
    concern_code VARCHAR(30) NOT NULL,
    PRIMARY KEY (user_id, concern_code),
    CONSTRAINT ck_sc_code CHECK (concern_code IN
        ('MUN','MUN_AN','LO_CHAN_LONG','THAM_SAU_MUN','NAM_TANG_SAC_TO','LAO_HOA',
         'KHONG_DEU_MAU','KHO_BONG_TROC','DAU_NHON','DO_KICH_UNG','QUANG_MAT'))
);
-- Giới hạn tối đa 5 vấn đề (BR-SKIN-02) được thực thi ở Application layer
-- (ràng buộc đếm trong SQL cần trigger — tránh trigger để giữ mô hình đơn giản)

CREATE TABLE skin_allergies (
    id             INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES skin_profiles(user_id) ON DELETE CASCADE,
    ingredient_id  INT REFERENCES ingredients(id) ON DELETE CASCADE,
    free_text_note VARCHAR(255),
    -- BR-SKIN-03: chỉ dòng ĐÃ KHỚP từ điển được dùng cảnh báo tự động
    CONSTRAINT ck_sa_one_of CHECK (
        (ingredient_id IS NOT NULL AND free_text_note IS NULL) OR
        (ingredient_id IS NULL     AND free_text_note IS NOT NULL)
    ),
    CONSTRAINT uq_sa_user_ing UNIQUE (user_id, ingredient_id)
);
CREATE INDEX ix_sa_user ON skin_allergies(user_id);

CREATE TABLE currently_using_items (       -- FR-CONF-05 — PRD v2.0 THIẾU
    id              INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES skin_profiles(user_id) ON DELETE CASCADE,
    product_id      VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
    active_group_id INT         REFERENCES active_groups(id)    ON DELETE CASCADE,
    CONSTRAINT ck_cui_one_of CHECK (
        (product_id IS NOT NULL AND active_group_id IS NULL) OR
        (product_id IS NULL     AND active_group_id IS NOT NULL)
    )
);

-- ═══ 13. Routine đã lưu (PRD v2.0 THIẾU) ═══
CREATE TABLE saved_routines (
    id         INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_sr_user ON saved_routines(user_id);

CREATE TABLE saved_routine_steps (
    id                 INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    saved_routine_id   INT NOT NULL REFERENCES saved_routines(id) ON DELETE CASCADE,
    time_of_day        VARCHAR(10) NOT NULL,
    step_order         INT NOT NULL,
    step_type          VARCHAR(20) NOT NULL,
    product_id         VARCHAR(50) NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    match_score_snapshot INT,
    CONSTRAINT uq_srs_order UNIQUE (saved_routine_id, time_of_day, step_order),
    CONSTRAINT ck_srs_tod   CHECK (time_of_day IN ('SANG','TOI')),
    CONSTRAINT ck_srs_type  CHECK (step_type IN
        ('TAY_TRANG','LAM_SACH','CAN_BANG','TAY_DA_CHET','DAC_TRI','DUONG_AM','CHONG_NANG'))
);
```

## 6.5. Thương mại

```sql
-- ═══ 14. Giỏ hàng ═══
CREATE TABLE carts (
    id          INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    conflict_warning_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_carts_user UNIQUE (user_id)       -- DC-03: một người MỘT giỏ
);
CREATE TABLE cart_items (
    id         INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    cart_id    INT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity   INT NOT NULL,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cart_items UNIQUE (cart_id, product_id),            -- DC-04
    CONSTRAINT ck_cart_qty   CHECK (quantity BETWEEN 1 AND 10)        -- BR-CART-03
);
CREATE TABLE cart_vouchers (
    cart_id    INT NOT NULL REFERENCES carts(id)    ON DELETE CASCADE,
    voucher_id INT NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    PRIMARY KEY (cart_id, voucher_id)
);

CREATE TABLE wishlist_items (
    id         INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wishlist UNIQUE (user_id, product_id)               -- DC-04
);

-- ═══ 15. Voucher ═══
CREATE TABLE vouchers (
    id                  INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code                VARCHAR(50)  NOT NULL,
    type                VARCHAR(20)  NOT NULL,
    discount_percent    NUMERIC(5,2) NOT NULL DEFAULT 0,
    discount_amount_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_order_usd       NUMERIC(10,2) NOT NULL DEFAULT 0,
    brand_id            INT REFERENCES brands(id) ON DELETE RESTRICT,
    max_uses_per_user   INT,
    max_total_uses      INT,
    valid_from          TIMESTAMPTZ NOT NULL,
    valid_to            TIMESTAMPTZ NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_vouchers_code UNIQUE (code),                        -- DC-15
    CONSTRAINT ck_v_type   CHECK (type IN ('BRAND','PLATFORM','FREESHIP')),
    -- Hoặc giảm theo %, hoặc giảm theo số tiền — không được cả hai, không được không có
    CONSTRAINT ck_v_amount CHECK (
        (discount_percent > 0 AND discount_amount_usd = 0) OR
        (discount_percent = 0 AND discount_amount_usd > 0)
    ),
    CONSTRAINT ck_v_brand  CHECK (type <> 'BRAND' OR brand_id IS NOT NULL),
    CONSTRAINT ck_v_period CHECK (valid_to > valid_from)
);
CREATE INDEX ix_vouchers_active ON vouchers(is_active, valid_from, valid_to);

CREATE TABLE voucher_usages (                -- PRD v2.0 THIẾU — lỗ hổng nghiệp vụ
    id         INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    voucher_id INT NOT NULL REFERENCES vouchers(id)  ON DELETE RESTRICT,
    user_id    INT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    order_id   INT NOT NULL,
    used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_vu_voucher_user ON voucher_usages(voucher_id, user_id);

-- ═══ 16. Đơn hàng — ĐÓNG BĂNG GIÁ TRỊ (ADR-010) ═══
CREATE TABLE orders (
    id                      INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    order_code              VARCHAR(30)  NOT NULL,                -- BR-ORDER-07 / DC-10
    user_id                 INT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'CHO_XU_LY',   -- ✅ nháy ĐƠN
    payment_method          VARCHAR(20)  NOT NULL,
    payment_status          VARCHAR(25)  NOT NULL DEFAULT 'CHUA_THANH_TOAN',
    display_currency        VARCHAR(5)   NOT NULL DEFAULT 'VND',

    -- ── GIÁ TRỊ ĐÃ ĐÓNG BĂNG (BR-PRICE-04, DC-08, DC-09) ──
    exchange_rate_applied   NUMERIC(12,2) NOT NULL,
    subtotal_usd            NUMERIC(10,2) NOT NULL,
    combo_discount_usd      NUMERIC(10,2) NOT NULL DEFAULT 0,
    brand_discount_usd      NUMERIC(10,2) NOT NULL DEFAULT 0,
    platform_discount_usd   NUMERIC(10,2) NOT NULL DEFAULT 0,
    shipping_fee_vnd        NUMERIC(15,0) NOT NULL DEFAULT 0,
    shipping_discount_vnd   NUMERIC(15,0) NOT NULL DEFAULT 0,
    total_usd               NUMERIC(10,2) NOT NULL,
    total_vnd               NUMERIC(15,0) NOT NULL,

    -- Địa chỉ giao hàng — BẢN CHỤP, không tham chiếu app_users
    ship_recipient_name     VARCHAR(255) NOT NULL,
    ship_phone              VARCHAR(20)  NOT NULL,
    ship_province           VARCHAR(100) NOT NULL,
    ship_district           VARCHAR(100) NOT NULL,
    ship_ward               VARCHAR(100) NOT NULL,
    ship_detail             VARCHAR(500) NOT NULL,
    ship_note               VARCHAR(500),

    conflict_warning_shown     BOOLEAN NOT NULL DEFAULT FALSE,     -- FR-ORD-12
    conflict_warning_snapshot  JSONB,
    idempotency_key         VARCHAR(100),                          -- NFR-REL-02
    tax_code                VARCHAR(20),                           -- CMP-24
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_orders_code       UNIQUE (order_code),
    CONSTRAINT uq_orders_idem       UNIQUE (idempotency_key),
    CONSTRAINT ck_orders_status     CHECK (status IN
                  ('CHO_XU_LY','DA_THANH_TOAN','DANG_GIAO','DA_GIAO','DA_HUY')),
    CONSTRAINT ck_orders_paymethod  CHECK (payment_method IN ('COD','VNPAY')),
    CONSTRAINT ck_orders_paystatus  CHECK (payment_status IN
                  ('CHUA_THANH_TOAN','DA_THANH_TOAN','THAT_BAI','HET_HAN')),
    CONSTRAINT ck_orders_currency   CHECK (display_currency IN ('VND','USD')),
    CONSTRAINT ck_orders_rate       CHECK (exchange_rate_applied > 0),   -- DC-08
    CONSTRAINT ck_orders_totals     CHECK (total_usd >= 0 AND total_vnd >= 0),  -- BR-CART-07
    CONSTRAINT ck_orders_phone      CHECK (ship_phone ~ '^0[0-9]{9}$')   -- BR-ORDER-08
);
CREATE INDEX ix_orders_user    ON orders(user_id, created_at DESC);
CREATE INDEX ix_orders_status  ON orders(status);
CREATE INDEX ix_orders_created ON orders(created_at DESC);

CREATE TABLE order_items (
    id                    INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    order_id              INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id            VARCHAR(50) NOT NULL
                          REFERENCES products(product_id) ON DELETE RESTRICT,  -- DC-21
    -- ⚠️ BẢN CHỤP (ADR-010) — PRD v2.0 THIẾU các cột *_snapshot này.
    --    Trùng lặp CÓ CHỦ ĐÍCH. Không "tối ưu" đi.
    product_name_snapshot VARCHAR(500) NOT NULL,
    brand_name_snapshot   VARCHAR(255) NOT NULL,
    image_url_snapshot    TEXT,
    unit_price_usd        NUMERIC(10,2) NOT NULL,
    quantity              INT NOT NULL,
    line_total_usd        NUMERIC(10,2) NOT NULL,
    CONSTRAINT ck_oi_qty   CHECK (quantity > 0),
    CONSTRAINT ck_oi_price CHECK (unit_price_usd >= 0)
);
CREATE INDEX ix_oi_order   ON order_items(order_id);
CREATE INDEX ix_oi_product ON order_items(product_id);

CREATE TABLE order_vouchers (
    order_id              INT NOT NULL REFERENCES orders(id)    ON DELETE CASCADE,
    voucher_id            INT NOT NULL REFERENCES vouchers(id)  ON DELETE RESTRICT,
    voucher_code_snapshot VARCHAR(50)   NOT NULL,
    discount_applied_usd  NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (order_id, voucher_id)
);

CREATE TABLE order_status_logs (             -- PRD v2.0 THIẾU
    id          BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    order_id    INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(20),                 -- NULL ở bản ghi đầu tiên
    to_status   VARCHAR(20) NOT NULL,
    by_user_id  INT REFERENCES app_users(id) ON DELETE SET NULL,  -- NULL = hệ thống
    reason      VARCHAR(500),                -- BẮT BUỘC khi Admin hủy (BR-ORDER-02)
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_osl_order ON order_status_logs(order_id, occurred_at);

-- Khóa ngoại trễ cho voucher_usages.order_id (vì orders khai báo sau vouchers)
ALTER TABLE voucher_usages
  ADD CONSTRAINT fk_vu_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;
```

## 6.6. Đánh giá, hội thoại & AI

```sql
-- ═══ 17. Đánh giá (PRD v2.0 THIẾU) ═══
CREATE TABLE reviews (
    id                  BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    product_id          VARCHAR(50) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    user_id             INT REFERENCES app_users(id) ON DELETE SET NULL,
    rating              SMALLINT     NOT NULL,
    content             TEXT         NOT NULL,
    author_skin_type    VARCHAR(20),
    source              VARCHAR(20)  NOT NULL,
    external_author_ref VARCHAR(100),
    helpful_count       INT          NOT NULL DEFAULT 0,
    status              VARCHAR(20)  NOT NULL DEFAULT 'HIEN_THI',
    moderation_reason   VARCHAR(500),
    submitted_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_rv_rating CHECK (rating BETWEEN 1 AND 5),           -- DC-06
    CONSTRAINT ck_rv_len    CHECK (length(content) BETWEEN 20 AND 2000),
    CONSTRAINT ck_rv_source CHECK (source IN ('NOI_BO','DU_LIEU_NGOAI')),
    CONSTRAINT ck_rv_status CHECK (status IN ('HIEN_THI','DA_AN')),
    CONSTRAINT ck_rv_skin   CHECK (author_skin_type IS NULL OR author_skin_type IN
                             ('DAU','KHO','HON_HOP','THUONG','NHAY_CAM')),
    -- Đánh giá nội bộ: một người MỘT đánh giá cho MỘT sản phẩm (DC-16)
    CONSTRAINT ck_rv_internal_user CHECK (source <> 'NOI_BO' OR user_id IS NOT NULL)
);
CREATE UNIQUE INDEX uq_rv_internal ON reviews(product_id, user_id)
       WHERE source = 'NOI_BO' AND user_id IS NOT NULL;
-- Index THEN CHỐT cho FR-PDP-12 ("người có da giống bạn nói gì")
CREATE INDEX ix_rv_product_skin ON reviews(product_id, author_skin_type, rating)
       WHERE status = 'HIEN_THI';
CREATE INDEX ix_rv_product_time ON reviews(product_id, submitted_at DESC)
       WHERE status = 'HIEN_THI';

CREATE TABLE review_helpful_votes (
    review_id BIGINT NOT NULL REFERENCES reviews(id)   ON DELETE CASCADE,
    user_id   INT    NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    PRIMARY KEY (review_id, user_id)
);

-- ═══ 18. Hội thoại (PRD v2.0 THIẾU) ═══
CREATE TABLE conversations (
    id          UUID PRIMARY KEY,
    user_id     INT REFERENCES app_users(id) ON DELETE CASCADE,
    session_key VARCHAR(100) NOT NULL,
    started_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ  NOT NULL        -- = started_at + 90 ngày (DC-18)
);
CREATE INDEX ix_conv_user    ON conversations(user_id, started_at DESC);
CREATE INDEX ix_conv_expires ON conversations(expires_at);    -- cho ConversationPurgeWorker

CREATE TABLE conversation_messages (
    id                    BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    conversation_id       UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role                  VARCHAR(15) NOT NULL,
    content               TEXT NOT NULL,          -- ĐÃ che dữ liệu cá nhân (NFR-PRIV-10)
    resolved_tier         VARCHAR(25),
    was_helpful           BOOLEAN,
    llm_prompt_tokens     INT,
    llm_completion_tokens INT,
    estimated_cost_usd    NUMERIC(10,6),          -- NFR-OBS-02 → theo dõi RISK-03
    latency_ms            INT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_cm_role CHECK (role IN ('USER','ASSISTANT','SYSTEM')),
    CONSTRAINT ck_cm_tier CHECK (resolved_tier IS NULL OR resolved_tier IN
                           ('RULES','LLM','CHUYEN_TIEP_ZALO'))
);
CREATE INDEX ix_cm_conv ON conversation_messages(conversation_id, created_at);
CREATE INDEX ix_cm_tier ON conversation_messages(resolved_tier, created_at);  -- BO-05

-- ═══ 19. Yêu cầu chuyển tiếp Zalo (PRD v2.0 THIẾU) ═══
CREATE TABLE handoff_requests (
    id                    INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    handoff_code          VARCHAR(12) NOT NULL,          -- "BA-7F3K" (ADR-006)
    conversation_id       UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id               INT REFERENCES app_users(id) ON DELETE SET NULL,
    summary               TEXT NOT NULL,
    reason                VARCHAR(500) NOT NULL,
    profile_consent_given BOOLEAN NOT NULL DEFAULT FALSE, -- BR-AI-11 — đồng ý RIÊNG
    skin_snapshot_json    JSONB,                          -- CHỈ khi consent = TRUE
    cart_snapshot_json    JSONB,
    status                VARCHAR(20) NOT NULL DEFAULT 'CHO',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at            TIMESTAMPTZ NOT NULL,           -- +24h (ADR-006)
    handled_by_user_id    INT REFERENCES app_users(id) ON DELETE SET NULL,
    handled_at            TIMESTAMPTZ,
    CONSTRAINT uq_hr_code   UNIQUE (handoff_code),
    CONSTRAINT ck_hr_status CHECK (status IN ('CHO','DA_TIEP_NHAN','DA_XU_LY','HUY')),
    -- ⚠️ Không có đồng ý thì KHÔNG được lưu bản chụp hồ sơ da (BR-AI-11)
    CONSTRAINT ck_hr_consent CHECK (profile_consent_given OR skin_snapshot_json IS NULL)
);
CREATE INDEX ix_hr_status ON handoff_requests(status, created_at DESC);

-- ═══ 20. Kịch bản chatbot ═══
CREATE TABLE chat_intents (
    id                INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code              VARCHAR(50)  NOT NULL,
    display_name      VARCHAR(255) NOT NULL,
    patterns_json     JSONB        NOT NULL,
    response_template TEXT         NOT NULL,
    handler           VARCHAR(30)  NOT NULL DEFAULT 'TEMPLATE',
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_ci_code   UNIQUE (code),
    CONSTRAINT ck_ci_handler CHECK (handler IN
          ('TEMPLATE','QUERY_PRODUCT','QUERY_ORDER','QUERY_INGREDIENT','QUERY_POLICY'))
);

CREATE TABLE blocked_topics (
    id                    INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code                  VARCHAR(50)  NOT NULL,
    display_name          VARCHAR(255) NOT NULL,
    patterns_json         JSONB        NOT NULL,
    fixed_response        TEXT         NOT NULL,
    requires_urgent_advice BOOLEAN     NOT NULL DEFAULT FALSE,   -- GC-10
    is_system_immutable   BOOLEAN      NOT NULL DEFAULT TRUE,    -- FR-ADM-10 AC-03
    CONSTRAINT uq_bt_code UNIQUE (code)
);
COMMENT ON COLUMN blocked_topics.is_system_immutable IS
  'TRUE = vùng chặn an toàn y tế, KHÔNG XÓA ĐƯỢC. Chỉ mở rộng được (FR-ADM-10 AC-03).';
```

## 6.7. Gợi ý tính sẵn & hệ thống

```sql
-- ═══ 21. Gợi ý tính sẵn ngoại tuyến (ADR-001) ═══
CREATE TABLE product_similarities (
    product_id         VARCHAR(50) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    similar_product_id VARCHAR(50) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    score              NUMERIC(6,5) NOT NULL,
    version            INT NOT NULL,
    computed_at        TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (product_id, similar_product_id),
    CONSTRAINT ck_ps_score    CHECK (score BETWEEN 0 AND 1),
    CONSTRAINT ck_ps_distinct CHECK (product_id <> similar_product_id)   -- BR-REC-07
);
CREATE INDEX ix_ps_lookup ON product_similarities(product_id, score DESC);

CREATE TABLE association_rules (
    id                     BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    antecedent_product_id  VARCHAR(50) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    consequent_product_id  VARCHAR(50) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    support     NUMERIC(8,6) NOT NULL,
    confidence  NUMERIC(8,6) NOT NULL,
    lift        NUMERIC(10,6) NOT NULL,
    version     INT NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_ar_pair UNIQUE (antecedent_product_id, consequent_product_id),
    -- Chỉ nạp luật ĐẠT NGƯỠNG (BR-REC-08) — thực thi ngay ở tầng dữ liệu
    CONSTRAINT ck_ar_thresholds CHECK (support >= 0.005 AND confidence >= 0.20 AND lift > 1)
);
CREATE INDEX ix_ar_antecedent ON association_rules(antecedent_product_id, confidence DESC);

-- ═══ 22. Cấu hình & vận hành ═══
CREATE TABLE app_settings (
    key              VARCHAR(100) PRIMARY KEY,
    value            TEXT        NOT NULL,
    data_type        VARCHAR(20) NOT NULL,
    description      TEXT        NOT NULL,              -- FR-ADM-09 yêu cầu BẮT BUỘC
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by_user_id INT REFERENCES app_users(id) ON DELETE SET NULL,
    CONSTRAINT ck_as_type CHECK (data_type IN ('decimal','int','string','time','bool','json'))
);

CREATE TABLE exchange_rate_history (         -- PRD v2.0 THIẾU (BR-PRICE-03)
    id                 INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    old_rate           NUMERIC(12,2) NOT NULL,
    new_rate           NUMERIC(12,2) NOT NULL,
    changed_by_user_id INT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    changed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_erh_rates CHECK (old_rate > 0 AND new_rate > 0)
);
CREATE INDEX ix_erh_time ON exchange_rate_history(changed_at DESC);

CREATE TABLE audit_logs (                    -- PRD v2.0 THIẾU (BR-SEC-05)
    id             BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    actor_user_id  INT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    action         VARCHAR(100) NOT NULL,
    entity_type    VARCHAR(100) NOT NULL,
    entity_key     VARCHAR(100) NOT NULL,
    before_json    JSONB,                    -- ĐÃ che dữ liệu cá nhân
    after_json     JSONB,
    occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_al_actor  ON audit_logs(actor_user_id, occurred_at DESC);
CREATE INDEX ix_al_entity ON audit_logs(entity_type, entity_key, occurred_at DESC);
CREATE INDEX ix_al_time   ON audit_logs(occurred_at DESC);

CREATE TABLE notifications (
    id           BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    type         VARCHAR(50) NOT NULL,
    payload_json JSONB NOT NULL,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_notif_user ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE support_requests (
    id           INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code         VARCHAR(20) NOT NULL,
    user_id      INT REFERENCES app_users(id) ON DELETE SET NULL,
    contact_info VARCHAR(255) NOT NULL,
    content      TEXT NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'CHO',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sreq_code UNIQUE (code),
    CONSTRAINT ck_sreq_status CHECK (status IN ('CHO','DANG_XU_LY','DA_XU_LY'))
);
```

## 6.8. Khóa cấu hình bắt buộc trong `app_settings`

| Khóa | Kiểu | Giá trị mặc định | Mô tả | FR/BR |
|---|---|---|---|---|
| `exchange_rate_usd_vnd` | decimal | — (**bắt buộc đặt**) | Tỷ giá USD→VND toàn sàn | `BR-PRICE-03`, `BR-PRICE-08` |
| `shipping_fee_vnd` | decimal | `30000` | Phí vận chuyển cơ bản | `BR-CART-10` |
| `free_shipping_threshold_vnd` | decimal | `500000` | Ngưỡng miễn phí vận chuyển | `BR-CART-10` |
| `combo_discount_percent` | decimal | `5` | % giảm khi thêm toàn bộ routine | `BR-CART-11` |
| `support_hours_start` | time | `08:00` | Giờ bắt đầu hỗ trợ (giờ VN) | `BR-AI-12` |
| `support_hours_end` | time | `21:00` | Giờ kết thúc hỗ trợ | `BR-AI-12` |
| `zalo_oa_url` | string | — | Đường dẫn deep link Zalo OA | ADR-006 |
| `llm_quota_guest_per_session` | int | `10` | Hạn mức lượt gọi LLM/phiên cho khách | `BR-AI-06` |
| `llm_quota_guest_per_day_ip` | int | `20` | Hạn mức/ngày theo IP | `BR-AI-06` |
| `llm_quota_user_per_day` | int | `50` | Hạn mức/ngày cho người đã đăng nhập | `BR-AI-06` |
| `llm_timeout_seconds` | int | `8` | Thời gian chờ gọi LLM | `NFR-PERF-09` |
| `conversation_retention_days` | int | `90` | Thời gian lưu hội thoại | `BR-AI-09`, `DC-18` |
| `handoff_code_ttl_hours` | int | `24` | Thời hạn mã phiên chuyển tiếp | ADR-006 |
| `max_cart_item_quantity` | int | `10` | Số lượng tối đa mỗi dòng giỏ | `BR-CART-03` |
| `max_skin_concerns` | int | `5` | Số vấn đề da tối đa | `BR-SKIN-02` |
| `max_saved_routines` | int | `3` | Số routine lưu tối đa | `FR-QUIZ-07` |
| `min_similar_reviews_to_show` | int | `5` | Số đánh giá tối thiểu để hiện khối "da giống bạn" | `FR-PDP-12` AC-03 |
| `min_coverage_pct_for_score` | int | `50` | Tỷ lệ phủ tối thiểu để hiện Điểm Phù Hợp | `FR-PDP-03` AC-04 |
| `exchange_rate_change_warn_pct` | int | `20` | Ngưỡng lệch tỷ giá cần xác nhận lần hai | `FR-ADM-08` AC-03 |

> **Nguyên tắc:** `NFR-MAIN-04` — **mọi ngưỡng ở đây đều KHÔNG được viết cứng trong code.** Truy cập qua một lớp `ISettingsProvider` có đệm trong tiến trình, làm mới khi Admin lưu.

## 6.9. So sánh lược đồ: PRD v2.0 → V1.0

| | PRD v2.0 | V1.0 |
|---|---|---|
| Số bảng | 11 | **35** |
| Lỗi cú pháp | 4 chỗ dùng nháy kép cho chuỗi | ✅ Đã sửa |
| Cột `safety_score` | Có | ❌ **Đã loại bỏ** (INV-01) |
| Bảng `reviews` | Thiếu | ✅ Có |
| Bảng hội thoại AI | Thiếu | ✅ Có (2 bảng) |
| Bảng chuyển tiếp Zalo | Thiếu | ✅ Có |
| Bảng routine đã lưu | Thiếu | ✅ Có (2 bảng) |
| Bảng quy tắc xung đột | Thiếu | ✅ Có + **ràng buộc cấp bằng chứng** |
| Bảng nhóm hoạt chất | Thiếu | ✅ Có (2 bảng) |
| Bảng tên đồng nghĩa thành phần | Thiếu | ✅ Có |
| Bảng thành phần chưa nhận diện | Thiếu | ✅ Có |
| Bảng lịch sử tỷ giá | Thiếu | ✅ Có |
| Bảng nhật ký kiểm toán | Thiếu | ✅ Có |
| Bảng lượt dùng voucher | Thiếu (**lỗ hổng**) | ✅ Có |
| Bảng lịch sử trạng thái đơn | Thiếu | ✅ Có |
| Bản chụp tên sản phẩm trong đơn | Thiếu | ✅ Có |
| Chỉ mục | Không nêu | ✅ **38 chỉ mục** có mục đích rõ ràng |
| Ràng buộc `CHECK` | 2 | ✅ **40+** |
| Ràng buộc bất biến ở tầng DB | Không có | ✅ `ck_cr_tier_severity`, `ck_hr_consent`, `ck_products_stock`, `ck_ar_thresholds` |

---

