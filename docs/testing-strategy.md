---
doc: testing-strategy
title: Chiến Lược Kiểm Thử Toàn Diện (Testing Strategy) — BeautyAI Platform
status: draft
precedence: 2
owner: QA Lead / Tech Lead
last_reviewed: 2026-10-25
---

# CHIẾN LƯỢC KIỂM THỬ HỆ THỐNG — BeautyAI Platform

> Nguồn chân lý về các tầng kiểm thử: Unit, Integration, Architecture, Golden Test và E2E (Precedence 2 — Contracts).

---

# 17. KIẾN TRÚC KIỂM THỬ

> Thực thi `AGENTS.md §3` (QA-first) và `docs/testing-strategy.md` của framework. Chiến lược nghiệp vụ ở `BRD` §14.

## 17.1. Bản đồ các tầng kiểm thử

```text
tests/
├── BeautyAI.UnitTests/              xUnit · nhanh (<5s toàn bộ) · không I/O
│   ├── Domain/
│   │   ├── OrderStateMachineTests.cs        ⟸ BR-ORDER-01 · F5
│   │   ├── ConflictRuleEvaluatorTests.cs    ⟸ BR-CONF-01b · INV-03
│   │   ├── MoneyTests.cs · OrderCodeTests.cs · HandoffCodeTests.cs
│   └── Application/
│       ├── PricingServiceTests.cs           ⟸ BR-PRICE-01…08
│       ├── VoucherEngineTests.cs            ⟸ BR-CART-05…11 (MỌI tổ hợp)
│       ├── QuizScoringServiceTests.cs       ⟸ BR-REC-01…03, 09
│       ├── RoutineBuilderServiceTests.cs    ⟸ BR-REC-04…06 · INV-11
│       ├── SuitabilityScoringServiceTests.cs⟸ ADR-011 · §8.7
│       ├── ConflictDetectionServiceTests.cs ⟸ BR-CONF-02…06
│       ├── InciParserTests.cs               ⟸ BR-ING-06
│       ├── AllergyMatcherTests.cs           ⟸ BR-SKIN-04, 05
│       ├── DeIdentificationServiceTests.cs  ⟸ BR-AI-16 · INV-04
│       ├── ComplianceFilterTests.cs         ⟸ BR-AI-13 · INV-06
│       └── MedicalGuardClassifierTests.cs   ⟸ BR-AI-03
│
├── BeautyAI.IntegrationTests/        xUnit + Testcontainers PostgreSQL 17
│   ├── Persistence/
│   │   ├── SchemaConstraintTests.cs         ⟸ MỌI ràng buộc CHECK ở §6
│   │   ├── CascadeBehaviourTests.cs         ⟸ bảng quan hệ §5.3
│   │   └── MigrationTests.cs                ⟸ áp dụng từ đầu + từ bản trước
│   ├── Orders/
│   │   ├── InventoryConcurrencyTests.cs     ⟸ INV-02 · FR-ORD-03 AC-04 ⭐
│   │   ├── OrderIdempotencyTests.cs         ⟸ NFR-REL-02
│   │   └── PaymentCallbackTests.cs          ⟸ FR-ORD-04 AC-02, 03, 06
│   ├── Catalog/
│   │   ├── UnaccentedSearchTests.cs         ⟸ FR-CAT-03 AC-03 ⭐
│   │   └── MultiActiveFilterTests.cs        ⟸ FR-CAT-06 AC-02 (AND/OR)
│   ├── Security/
│   │   ├── OwnershipCheckTests.cs           ⟸ NFR-SEC-03 · E2E-08
│   │   ├── AdminCannotReadSkinProfileTests.cs ⟸ INV-07 ⭐
│   │   └── PasswordHashStorageTests.cs      ⟸ INV-08 · DC-19 ⭐
│   └── Providers/
│       └── GeminiAdapterTests.cs            ⟸ với HTTP được mock
│
├── BeautyAI.ArchitectureTests/       NetArchTest — thực thi §3.3 ⭐
│   ├── DomainHasNoDependenciesTests.cs
│   ├── ApplicationDoesNotReferenceEfCoreTests.cs
│   ├── ApplicationDoesNotReferenceAspNetTests.cs
│   ├── ProviderLibrariesOnlyInAdapterLayerTests.cs  ⟸ provider-abstraction
│   └── NoSafetyScoreAnywhereTests.cs        ⟸ INV-01 ⭐⭐
│
├── BeautyAI.GoldenTests/             22 golden case (BRD §14.5)
│   ├── Fixtures/                     bản ghi phản hồi LLM cố định
│   ├── Tier1RulesTests.cs            GC-04…07
│   ├── MedicalGuardTests.cs          GC-08…11
│   ├── GroundingTests.cs             GC-01…03, GC-15
│   ├── PromptInjectionTests.cs       GC-12…14
│   ├── ComplianceTests.cs            GC-16
│   ├── PrivacyTests.cs               GC-17 ⭐
│   ├── DegradationTests.cs           GC-18…20
│   └── ConflictKnowledgeTests.cs     GC-21, GC-22 ⭐
│
└── e2e/                              Playwright — 8 luồng (BRD §14.4)
    ├── e2e-01-guest-to-cod-order.spec.ts
    ├── e2e-02-quiz-routine-vnpay.spec.ts
    ├── e2e-03-allergy-warnings.spec.ts
    ├── e2e-04-conflict-detection.spec.ts
    ├── e2e-05-ai-three-tiers-handoff.spec.ts
    ├── e2e-06-graceful-degradation.spec.ts
    ├── e2e-07-admin-operations.spec.ts
    ├── e2e-08-access-control.spec.ts
    └── a11y/                         @axe-core/playwright ⟸ NFR-A11Y-01
```

⭐ = bài test có giá trị cao bất thường; nếu thời gian hạn chế thì viết các bài này trước.

## 17.2. Năm bài test quan trọng nhất

### ⭐ `NoSafetyScoreAnywhereTests` — thực thi INV-01 bằng máy

```csharp
[Fact]
public void Khong_ton_tai_bat_ky_thuoc_tinh_diem_an_toan_nao()
{
    var banned = new[] { "SafetyScore", "SafetyRating", "HazardScore",
                         "DangerLevel", "ToxicityScore", "SafetyLevel" };

    var offenders = typeof(Product).Assembly.GetTypes()
        .SelectMany(t => t.GetProperties())
        .Where(p => banned.Any(b => p.Name.Contains(b, StringComparison.OrdinalIgnoreCase)))
        .Select(p => $"{p.DeclaringType!.Name}.{p.Name}")
        .ToArray();

    offenders.Should().BeEmpty(
        "INV-01: BeautyAI KHÔNG chấm điểm an toàn/nguy hiểm (xem BRD §4.3 G-01). " +
        "Dùng SuitabilityScore (phù hợp với hồ sơ da) thay thế.");
}

[Fact]
public async Task Lược_đồ_DB_khong_co_cot_diem_an_toan()
{
    var cols = await _db.QueryAsync<string>(
        "SELECT table_name || '.' || column_name FROM information_schema.columns " +
        "WHERE column_name ILIKE '%safety%' OR column_name ILIKE '%hazard%'");
    cols.Should().BeEmpty("DC-07");
}
```

> **Vì sao bài test này đáng viết:** `INV-01` là một quyết định sản phẩm, và quyết định sản phẩm **sẽ bị xói mòn theo thời gian** nếu chỉ nằm trong tài liệu. Một AI code agent đọc PRD v2.0 cũ, hoặc một lập trình viên tương lai thấy `comedogenic_rating` và nghĩ "chắc thiếu safety score", sẽ thêm nó vào. Bài test này biến một quyết định thành một **ràng buộc có thể thực thi**.

### ⭐ `InventoryConcurrencyTests` — thực thi INV-02

```csharp
[Fact]
public async Task Hai_don_dong_thoi_cho_san_pham_con_1_ton_kho_chi_mot_don_thanh_cong()
{
    await SeedProductAsync("P001", stock: 1);
    var userA = await CreateUserWithCartAsync("P001", qty: 1);
    var userB = await CreateUserWithCartAsync("P001", qty: 1);

    var results = await Task.WhenAll(
        PlaceOrderAsync(userA), PlaceOrderAsync(userB));

    results.Count(r => r.IsSuccess).Should().Be(1,
        "FR-ORD-03 AC-04: chỉ một đơn được thành công");
    results.Count(r => r.ErrorCode == "PRODUCT_OUT_OF_STOCK").Should().Be(1);

    var stock = await GetStockAsync("P001");
    stock.Should().Be(0, "INV-02: tồn kho KHÔNG BAO GIỜ âm");
}
```

> **Vì sao:** đây là loại lỗi **không bao giờ xuất hiện khi test tay** nhưng chắc chắn xảy ra khi có người dùng thật. Mẫu "đọc → kiểm tra → ghi" trông đúng và chạy đúng 99% thời gian. Chỉ bài test đồng thời mới phát hiện được.

### ⭐ `AdminCannotReadSkinProfileTests` — thực thi INV-07

```csharp
[Fact]
public async Task Khong_co_endpoint_nao_cho_admin_doc_ho_so_da_cua_khach()
{
    var customer = await CreateCustomerWithSkinProfileAsync();
    var admin = await LoginAsAdminAsync();

    // Thử mọi biến thể đường dẫn mà một người có thể nghĩ ra
    foreach (var path in new[] {
        $"/api/v1/skin-profile?userId={customer.Id}",
        $"/api/v1/skin-profile/{customer.Id}",
        $"/api/v1/admin/users/{customer.Id}/skin-profile",
        $"/api/v1/admin/skin-profiles",
        $"/api/v1/admin/users/{customer.Id}/allergies" })
    {
        var res = await admin.GetAsync(path);
        res.StatusCode.Should().BeOneOf(
            HttpStatusCode.NotFound, HttpStatusCode.Forbidden, HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync())
            .Should().NotContain(customer.SkinType.ToString(),
                "INV-07/BR-SEC-03: Admin không được thấy hồ sơ da của khách");
    }
}
```

### ⭐ `DeIdentificationServiceTests` + `GC-17` — thực thi INV-04

```csharp
[Fact]
public void Tai_gui_cho_LLM_khong_bao_gio_chua_du_lieu_gan_danh_tinh()
{
    var ctx = new ChatContext {
        UserId = 42,
        UserEmail = "mai@example.com",
        UserFullName = "Nguyễn Thị Mai",
        UserPhone = "0901234567",
        SkinProfile = new() { SkinType = HON_HOP, AllowAiSharing = true }
    };

    var safe = _sut.Sanitize(ctx);
    var json = JsonSerializer.Serialize(safe);

    json.Should().NotContain("42");
    json.Should().NotContain("mai@example.com");
    json.Should().NotContain("Nguyễn Thị Mai");
    json.Should().NotContain("0901234567");
    json.Should().Contain("HON_HOP", "loại da ĐƯỢC gửi khi khách bật chia sẻ");
}

[Fact]
public void Khi_cong_tac_chia_se_TAT_thi_khong_gui_ho_so_da()
{
    var ctx = ContextWith(allowAiSharing: false, skinType: HON_HOP);
    var json = JsonSerializer.Serialize(_sut.Sanitize(ctx));
    json.Should().NotContain("HON_HOP", "FR-CHAT-03 AC-06");
}
```

### ⭐ `ConflictKnowledgeTests` (`GC-21`, `GC-22`) — bảo vệ điểm khác biệt khoa học

```csharp
[Fact]
public async Task VitaminC_va_Niacinamide_KHONG_duoc_canh_bao()
{
    var warnings = await _sut.DetectAsync(
        ["P_VITC_SERUM", "P_NIACINAMIDE_SERUM"], AnyContext());

    warnings.Should().NotContain(w => w.Severity is CAO or LUU_Y,
        "BR-CONF-02b: cặp này là HUYỀN THOẠI đã bị phản bác. " +
        "Hệ thống phải ĐÍNH CHÍNH, không cảnh báo.");

    warnings.Should().Contain(w => w.Severity == THONG_TIN
        && w.Explanation.Contains("thường bị cho là kỵ nhau"));
}

[Fact]
public async Task Retinoid_va_BenzoylPeroxide_canh_bao_CAO_kem_sac_thai_Adapalene()
{
    var warnings = await _sut.DetectAsync(
        ["P_TRETINOIN", "P_BENZOYL_PEROXIDE"], AnyContext());

    var w = warnings.Should().ContainSingle(x => x.Severity == CAO).Subject;
    w.EvidenceTier.Should().Be('A', "chỉ cấp A được phép ở mức CAO — INV-03");
    w.SourceUrl.Should().NotBeNullOrWhiteSpace("DC-13");
    w.Remediation.Should().NotBeNullOrWhiteSpace("BR-CONF-05");
    w.ProfessionalNote.Should().Contain("Adapalene",
        "BR-CONF-02c: sắc thái Adapalene bền hơn Tretinoin là điểm khác biệt chuyên môn");
}

[Fact]
public async Task Khong_quy_tac_nao_cap_B_hoac_C_duoc_hien_thi_muc_CAO()
{
    var all = await _ruleRepo.GetAllActiveAsync();
    all.Where(r => r.EvidenceTier is 'B' or 'C')
       .Should().OnlyContain(r => r.Severity != CAO, "INV-03 · DC-14");
}
```

## 17.3. Chiến lược test cho hành vi AI

| Vấn đề | Giải pháp |
|---|---|
| **LLM không tất định** → không test trực tiếp được | ① Test **từng chặng riêng** của đường ống (§9.2) — mọi chặng trừ chặng 5 đều **tất định** ② Chặng 5 test bằng **bản ghi phản hồi cố định** (fixtures) |
| **Không muốn gọi API thật trong CI** | `Providers__Llm=Null` trong CI; golden test đọc fixtures |
| **Cần biết khi mô hình bị hồi quy chất lượng** | Chạy golden test **thủ công với API thật** trước mỗi lần đổi prompt/model (`CMP-19`); kết quả ghi vào `docs/_states/` |
| **Cần phát hiện mô hình bịa nhiều hơn** | Sự kiện `llm_hallucinated_product` (§16.4) — theo dõi theo thời gian |

**Mẫu golden test:**

```csharp
[Theory]
[GoldenCase("GC-01")] [GoldenCase("GC-02")] /* … GC-22 */
public async Task Golden_case_phai_dat_moi_tieu_chi(GoldenCaseFixture f)
{
    var res = await _orchestrator.HandleAsync(f.Request, default);

    // 7 tiêu chí pass chung (BRD §14.5)
    res.Should().MatchSchema(f.ExpectedSchema);                           // ①
    res.AssertNumbersMatchDatabase(_db);                                   // ②
    res.AssertAllProductIdsExist(_db);                                     // ③
    res.AssertNoBannedTerms(_complianceRules);                             // ④
    res.Disclaimer.Should().NotBeNullOrWhiteSpace();                       // ⑤
    res.AssertNoExpertiseClaim();                                          // ⑥
    _llmSpy.LastPayload.AssertNoIdentifyingData();                         // ⑦

    // tiêu chí riêng của từng ca
    f.CaseSpecificAssertions(res);
}
```

## 17.4. Dữ liệu test

| Loại | Cách tạo |
|---|---|
| **Unit test** | Builder trong code (`ProductBuilder`, `SkinProfileBuilder`, `CartBuilder`) — **không** phụ thuộc DB |
| **Integration test** | Testcontainers PostgreSQL 17 mới cho mỗi lớp test; áp dụng migration; seed tối thiểu |
| **Golden test** | Tập dữ liệu nhỏ cố định: 20 sản phẩm, 30 thành phần, 12 quy tắc xung đột, 5 hồ sơ da — **đủ để phủ mọi golden case, không hơn** |
| **E2E** | Toàn bộ seed của §9.6 `BRD`, chạy một lần trước bộ E2E |
| **5 hồ sơ da mẫu** | ① Hỗn hợp + mụn ẩn ② Khô + nhạy cảm + dị ứng `Fragrance` ③ Dầu + mụn + người mới ④ Thường + lão hóa ⑤ Chưa có hồ sơ (để test `BR-ING-02`) |


