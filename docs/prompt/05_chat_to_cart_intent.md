---
doc: prompt-chat-to-cart-intent
title: Prompt Phân Loại Ý Định & Tính Năng Chat-To-Cart
status: stable
precedence: 5
owner: AI Lead / Tech Lead
last_reviewed: 2026-10-28
---

# PROMPT PHÂN LOẠI Ý ĐỊNH & CHAT-TO-CART (INTENT CLASSIFIER)

> **Mục đích:** Bóc tách ý định người dùng trong khung chat tư vấn để kích hoạt các hành động giỏ hàng (Chat-to-Cart), tìm kiếm sản phẩm thay thế (Alternative finder) hoặc chuyển tiếp tư vấn chuyên sâu.
> **Quy tắc an toàn (INV-12):** AI không tự ý đặt hàng hay trừ tiền; AI chỉ tạo đối tượng giỏ hàng / gợi ý và người dùng là người bấm nút xác nhận cuối cùng.

---

## 📝 Định Nghĩa Ý Định (Intent Taxonomy)

| Intent Code | Ý Nghĩa | Ví Dụ Câu Nói Người Dùng |
|---|---|---|
| `ADD_TO_CART` | Thêm 1 hoặc nhiều sản phẩm cụ thể vào giỏ hàng | "Cho mình lấy chai serum Niacinamide này nhé", "Thêm kem chống nắng này vào giỏ" |
| `BUY_ENTIRE_ROUTINE` | Mua trọn bộ chu trình vừa gợi ý | "Mình muốn mua cả routine sáng này luôn", "Thêm cả bộ vào giỏ giúp mình" |
| `FIND_CHEAPER_ALTERNATIVE` | Tìm sản phẩm thay thế giá mềm hơn | "Có loại nào tương tự nhưng rẻ hơn không?", "Sản phẩm này hơi quá ngân sách của mình" |
| `CHECK_ALLERGY_SAFETY` | Hỏi xem sản phẩm có an toàn với da dị ứng không | "Da mình bị dị ứng cồn thì dùng lọ này có sao không?" |
| `CHECK_CONFLICT` | Hỏi xem 2 sản phẩm có dùng chung được không | "Dùng serum này chung với kem dưỡng ẩm BHA tối qua được không?" |
| `GENERAL_CONSULTATION` | Hỏi đáp kiến thức da liễu thông thường | "Da đổ dầu vùng chữ T nhưng khô 2 bên má là da gì?" |

---

## 🛠️ Gemini Function Calling Definition (Tool Schema)

```json
{
  "name": "execute_cart_action",
  "description": "Trigger an e-commerce cart action directly from chat conversation",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["ADD_SINGLE_ITEM", "ADD_ROUTINE_BUNDLE", "NAVIGATE_TO_CHECKOUT"]
      },
      "productIds": {
        "type": "array",
        "items": { "type": "integer" },
        "description": "List of valid product IDs from the database to add to cart"
      },
      "confirmationMessage": {
        "type": "string",
        "description": "Polite confirmation message in English or Vietnamese for the user to review before checking out."
      }
    },
    "required": ["action", "productIds", "confirmationMessage"]
  }
}
```
