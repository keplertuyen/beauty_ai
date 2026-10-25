---
doc: review-risk-register
title: Danh Mục Rủi Ro & Kế Hoạch Giảm Thiểu (Risk Register) — BeautyAI Platform
status: draft
precedence: 6
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# 16. RỦI RO & PHƯƠNG ÁN GIẢM THIỂU

> **Phát hiện `G-30`:** PRD v2.0 không nêu rủi ro nào.
> Thang: **Xác suất** (Cao/TB/Thấp) × **Tác động** (Cao/TB/Thấp) → **Mức** (🔴 Nghiêm trọng · 🟠 Cao · 🟡 Trung bình · 🟢 Thấp)

| Mã | Rủi ro | XS | TĐ | Mức | Phương án giảm thiểu | Chủ |
|---|---|---|---|---|---|---|
| **RISK-01** | **Vi phạm quy định bảo vệ dữ liệu cá nhân** do gửi hồ sơ da (dữ liệu nhạy cảm) gắn danh tính ra dịch vụ nước ngoài | TB | **Rất cao** | 🔴 | **Ẩn danh hóa bắt buộc ở tầng kiến trúc** (`BR-AI-16`, `NFR-PRIV-03`) · công tắc chia sẻ mặc định TẮT · kiểm thử tự động xác minh tải gửi đi (GC-17) · trang chính sách dữ liệu đầy đủ | Chủ dự án |
| **RISK-02** | **Vi phạm quy định quảng cáo mỹ phẩm** — AI hoặc nội dung sản phẩm dùng từ ngữ gây hiểu nhầm là thuốc, hoặc nhân dạng mang dấu hiệu nghề y | **Cao** | Cao | 🔴 | **Bộ lọc ở đầu ra, không chỉ ở prompt** (`BR-AI-13`) · đổi nhân dạng trợ lý (`BR-AI-14`) · rà soát 100% mô tả sản phẩm Lớp A (`DQ-05`) · golden case GC-16 | Chủ dự án |
| **RISK-03** | **Hạn mức/chi phí Gemini API vượt dự kiến, hoặc hết hạn mức đúng lúc demo** | **Cao** | Cao | 🔴 | Suy giảm có kiểm soát (`BR-AI-05`) · bộ nhớ đệm câu trả lời phổ biến · giới hạn tần suất phía ứng dụng (`BR-AI-06`) · **nâng tier trước ngày demo** · theo dõi chi phí theo lệnh gọi (`NFR-OBS-02`) · dùng mô hình Flash-Lite cho tác vụ khối lượng lớn | Chủ dự án |
| **RISK-04** | **AI bịa sản phẩm/thành phần nghe rất thuyết phục** → mất niềm tin ngay lần đầu người dùng kiểm tra | **Cao** | Cao | 🔴 | **Ép gọi hàm tra cứu danh mục** (`BR-AI-15`) · **đối chiếu mã sản phẩm với DB trước khi hiển thị** (`BR-AI-02`) · golden case GC-15 | Chủ dự án |
| **RISK-05** | **Vấn đề xuất xứ danh mục bị chỉ ra khi bảo vệ** — 8.494 sản phẩm Mỹ không bán ở Việt Nam | **Cao** | Cao | 🔴 | **Chiến lược danh mục hai lớp** (§4.4) · tuyên bố rõ hạn chế trong báo cáo (`CMP-03`) · **xử lý trung thực là điểm cộng, không phải điểm trừ** | Chủ dự án |
| **RISK-06** | **Khối lượng biên soạn từ điển thành phần bị đánh giá thấp** → trễ Phase 1, kéo theo toàn bộ | **Cao** | Cao | 🔴 | Giới hạn phạm vi **150–200 hoạt chất** (`ASM-07`) · ưu tiên theo **số sản phẩm chứa nó** (`FR-ADM-04` AC-04) · dùng AI soạn nháp + người rà soát · **đặt thành cột mốc riêng có tiêu chí hoàn thành** trong kế hoạch |
| **RISK-07** | **Cảnh báo quá mức làm người dùng bỏ qua mọi cảnh báo** → mất giá trị cốt lõi của Conflict Detector | TB | Cao | 🟠 | **Phân cấp bằng chứng bắt buộc** (`BR-CONF-01b`) · ràng buộc dữ liệu chặn nâng mức (`DC-14`) · chỉ **1 cặp** ở mức đỏ (`BR-CONF-02c`) | Chủ dự án |
| **RISK-08** | **Scope creep qua lập luận "AI làm được mà"** — nút thắt dịch chuyển từ *viết code* sang *tích hợp bên thứ ba và tuân thủ* | **Cao** | Cao | 🔴 | Danh sách **Won't** rõ ràng (§6.4) · mọi thay đổi phạm vi phải qua Change Request (`AGENTS.md §2.7`) · **kế hoạch lập theo nút thắt tích hợp, không theo giờ code** | Chủ dự án |
| **RISK-09** | **Nhịp 4h/ngày bị gián đoạn bởi công việc chính** → trễ tiến độ | **Cao** | TB | 🟠 | Chia công việc thành **lát mỏng hoàn thành được trong 1 buổi** · mỗi phase có **lát khả dụng tối thiểu** để luôn có bản chạy được · đệm thời gian 20% mỗi phase |
| **RISK-10** | **Tích hợp VNPay Sandbox khó hơn dự kiến** (callback cần địa chỉ công khai, mà hệ thống chạy local) | TB | TB | 🟡 | Dùng đường hầm (tunnel) để lộ địa chỉ local · chuẩn bị **phương án mô phỏng thanh toán hoàn toàn nội bộ** làm dự phòng · COD luôn hoạt động độc lập |
| **RISK-11** | **Không xin được tài khoản Zalo OA kịp thời** | TB | TB | 🟡 | V1.0 chỉ cần **deep link + mã phiên** (không cần API, không cần xác thực doanh nghiệp) · dự phòng: form để lại liên hệ (`DEP-02`) |
| **RISK-12** | **Ảnh sản phẩm vỡ** do phụ thuộc CDN bên thứ ba | **Cao** | TB | 🟠 | **Tải ảnh về lưu cục bộ** cho sản phẩm Lớp A (`DQ-08`) · ảnh placeholder cho Lớp B |
| **RISK-13** | **Chất lượng bóc tách INCI thấp** → tỷ lệ phủ phân tích thấp → tính năng cốt lõi mất giá trị | TB | Cao | 🟠 | Chuẩn hóa có danh sách tên đồng nghĩa (`BR-ING-06`) · lưu dòng chưa nhận diện để cải thiện dần (thực thể #6) · **hiển thị tỷ lệ phủ trung thực** thay vì che đi |
| **RISK-14** | **Nợ kỹ thuật từ việc đi tắt với AI code agent** — code chạy được nhưng không kiểm thử được | TB | Cao | 🟠 | **QA-first bắt buộc** (`AGENTS.md §3`) · ngưỡng độ phủ (`NFR-MAIN-01`) · quality gate chặn merge · mỗi quy tắc nghiệp vụ có test (`NFR-MAIN-02`) |
| **RISK-15** | **Mất dữ liệu phát triển** (CSDL cục bộ, không có bản sao đám mây) | TB | Cao | 🟠 | Sao lưu hằng ngày + **phục hồi thử trước demo** (`NFR-REL-05`) · script khởi tạo dữ liệu có thể chạy lại từ đầu (§9.6) · đẩy code lên GitHub thường xuyên |
| **RISK-16** | **Demo thất bại vì phụ thuộc mạng/dịch vụ ngoài** đúng lúc trình bày | TB | **Rất cao** | 🔴 | **Chuẩn bị chế độ demo ngoại tuyến**: dữ liệu đã nạp sẵn, câu trả lời AI đã cache cho các câu hỏi demo, mô phỏng thanh toán nội bộ · **tổng duyệt đầy đủ ít nhất 2 lần** |
| **RISK-17** | **Tỷ giá viết cứng trong prototype gây sai số liệu khi demo** | **Cao** | Thấp | 🟡 | Chuyển tỷ giá sang cấu hình (`BR-PRICE-03`) — xử lý trong nhiệm vụ (4) |
| **RISK-18** | **Lỗ hổng quyền truy cập dữ liệu người dùng khác** (đổi mã trên địa chỉ) | TB | Cao | 🟠 | Kiểm tra chủ sở hữu ở phía máy chủ trên mọi truy vấn (`NFR-SEC-03`) · luồng E2E-08 kiểm thử riêng điều này |

## 16.1. Ba rủi ro cần hành động ngay trong Phase 1

| Ưu tiên | Rủi ro | Hành động cụ thể trong Phase 1 |
|---|---|---|
| 1 | **RISK-06** Khối lượng từ điển thành phần | Chốt danh sách 150–200 hoạt chất **trước** khi viết code tính Điểm Phù Hợp; đặt thành cột mốc có tiêu chí hoàn thành đo được |
| 2 | **RISK-05** Vấn đề xuất xứ danh mục | Chốt danh sách 200–400 sản phẩm Lớp A **ngay Phase 1**, trước khi xây luồng thương mại |
| 3 | **RISK-01** + **RISK-02** Tuân thủ | Viết lớp ẩn danh hóa và bộ lọc đầu ra **cùng lúc với** adapter LLM, không để làm sau — nếu để sau thì sẽ không bao giờ được làm |

---

