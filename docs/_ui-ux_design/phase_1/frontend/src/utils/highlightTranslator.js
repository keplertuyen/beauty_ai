/**
 * highlightTranslator.js — Comprehensive bilingual translator for Sephora product highlights.
 * 
 * Supports all 116 unique Sephora highlight tags with natural Vietnamese translations
 * and polished English title-case formatting.
 */

export const HIGHLIGHTS_MAP_VI = {
  // Common Certifications & Claims
  'vegan': 'Thuần chay (Vegan)',
  'cruelty-free': 'Không thử nghiệm trên động vật (Cruelty-Free)',
  'clean at sephora': 'Tiêu chuẩn Clean at Sephora',
  'clean + planet positive': 'Mỹ phẩm xanh & Bền vững',
  'without parabens': 'Không chứa Paraben',
  'without sulfates sls & sles': 'Không chứa Sulfate SLS & SLES',
  'without phthalates': 'Không chứa Phthalate',
  'without silicones': 'Không chứa Silicone',
  'without mineral oil': 'Không chứa dầu khoáng',
  'without formaldehydes': 'Không chứa Formaldehyde',
  'without formaldehyde-releasing agents': 'Không chứa chất sinh Formaldehyde',
  'without oxybenzone': 'Không chứa Oxybenzone',
  'without retinyl palmitate': 'Không chứa Retinyl Palmitate',
  'without triclocarban': 'Không chứa Triclocarban',
  'without triclosan': 'Không chứa Triclosan',
  'fragrance free': 'Không chứa hương liệu',
  'alcohol free': 'Không chứa cồn',
  'oil free': 'Không chứa dầu (Oil-Free)',
  'gluten free': 'Không chứa Gluten',
  'hypoallergenic': 'Dịu nhẹ cho da nhạy cảm',

  // Skin & Hair Benefits (Good for...)
  'good for: dryness': 'Hỗ trợ: Cải thiện da khô & mất nước',
  'good for: damage': 'Hỗ trợ: Phục hồi tóc hư tổn',
  'good for: color care': 'Hỗ trợ: Bảo vệ tóc nhuộm',
  'good for: dullness/uneven texture': 'Hỗ trợ: Làm đều màu & mờ thâm sạm',
  'good for: anti-aging': 'Hỗ trợ: Ngăn ngừa lão hóa',
  'good for: acne/blemishes': 'Hỗ trợ: Giảm mụn & mờ thâm',
  'good for: dark spots': 'Hỗ trợ: Mờ đốm nâu & tàn nhang',
  'good for: dark circles': 'Hỗ trợ: Giảm quầng thâm mắt',
  'good for: loss of firmness': 'Hỗ trợ: Săn chắc & tăng đàn hồi',
  'good for: pores': 'Hỗ trợ: Thu nhỏ lỗ chân lông',
  'good for: redness': 'Hỗ trợ: Giảm ửng đỏ & làm dịu da',
  'good for: frizz': 'Hỗ trợ: Giảm xơ rối cho tóc',
  'good for: flaky/dry scalp': 'Hỗ trợ: Giảm khô ngứa da đầu & gàu',
  'good for: hair thinning': 'Hỗ trợ: Ngăn ngừa thưa & rụng tóc',
  'good for: oily scalp': 'Hỗ trợ: Kiểm soát dầu da đầu',
  'good for: volume': 'Hỗ trợ: Tăng độ phồng tóc',

  // Actions & Performance
  'hydrating': 'Cấp ẩm sâu & duy trì độ ẩm',
  'increases shine': 'Tăng cường độ bóng mượt',
  'healthy hair': 'Nuôi dưỡng tóc bóng khỏe',
  'heat protection': 'Bảo vệ tóc khỏi nhiệt độ cao',
  'prevents color fading': 'Chống phai màu tóc nhuộm',
  'reduces brassiness': 'Khử ánh vàng cho tóc nhuộm',
  'plumping': 'Làm đầy & căng mọng da',
  'long-wearing': 'Lâu trôi suốt ngày dài',
  'waterproof': 'Kháng nước vượt trội (Waterproof)',

  // Skin Type Suitability
  'best for normal skin': 'Phù hợp nhất cho da thường',
  'normal skin': 'Thích hợp cho da thường',
  'best for dry': 'Phù hợp nhất cho da khô',
  'best for dry skin': 'Phù hợp nhất cho da khô',
  'best for oily': 'Phù hợp nhất cho da dầu',
  'best for oily skin': 'Phù hợp nhất cho da dầu',
  'best for combination skin': 'Phù hợp nhất cho da hỗn hợp',
  'combo': 'Thích hợp cho da hỗn hợp',
  'best for sensitive skin': 'Phù hợp nhất cho da nhạy cảm',

  // Hair Types
  'all hair types': 'Phù hợp cho mọi loại tóc',
  'straight hair': 'Dành cho tóc thẳng',
  'wavy hair': 'Dành cho tóc gợn sóng',
  'curly hair': 'Dành cho tóc xoăn',
  'coily hair': 'Dành cho tóc xoăn lọn nhỏ',
  'curl-enhancing': 'Định hình lọn tóc xoăn',
  'curling': 'Tạo kiểu xoăn bồng bềnh',
  'volumizing': 'Tạo độ bồng bềnh cho tóc',
  'lengthening': 'Làm dài mi tự nhiên',

  // Key Active Ingredients
  'hyaluronic acid': 'Chứa Hyaluronic Acid (Cấp nước)',
  'niacinamide': 'Chứa Niacinamide (Sáng da & Thu nhỏ LCL)',
  'vitamin c': 'Chứa Vitamin C (Sáng da & Mờ thâm)',
  'salicylic acid': 'Chứa BHA / Salicylic Acid (Sạch mụn)',
  'aha/glycolic acid': 'Chứa AHA / Glycolic Acid (Tẩy da chết)',
  'lactic acid': 'Chứa Lactic Acid (Tái tạo bề mặt da)',
  'retinol': 'Chứa Retinol (Trẻ hóa làn da)',
  'collagen': 'Chứa Collagen (Đàn hồi căng bóng)',
  'cbd': 'Chứa chiết xuất CBD làm dịu',

  // Finishes
  'matte finish': 'Hiệu ứng mịn lì (Matte)',
  'natural finish': 'Hiệu ứng tự nhiên (Natural)',
  'radiant finish': 'Hiệu ứng căng bóng (Radiant)',
  'satin finish': 'Hiệu ứng satin mềm mượt',
  'shimmer finish': 'Hiệu ứng nhũ lấp lánh (Shimmer)',
  'metallic finish': 'Hiệu ứng ánh kim (Metallic)',
  'high shine finish': 'Hiệu ứng bóng bắt sáng cao',

  // Formulations & Formats
  'liquid formula': 'Kết cấu dạng lỏng (Liquid)',
  'cream formula': 'Kết cấu dạng kem (Cream)',
  'stick formula': 'Dạng thỏi tiện lợi (Stick)',
  'loose powder formula': 'Dạng phấn bột tơi mịn',
  'pressed powder formula': 'Dạng phấn nén tiện dụng',
  'full coverage': 'Độ che phủ cao',
  'medium coverage': 'Độ che phủ vừa',
  'light coverage': 'Độ che phủ nhẹ tự nhiên',
  'light hold': 'Độ giữ nếp nhẹ nhàng',
  'medium hold': 'Độ giữ nếp vừa phải',
  'strong hold': 'Độ giữ nếp mạnh mẽ',

  // Scents & Fragrance Notes
  'floral scent': 'Hương hoa thanh nhã',
  'fresh scent': 'Hương thơm tươi mát',
  'warm &spicy scent': 'Hương thơm ấm áp & quyến rũ',
  'woody & earthy scent': 'Hương gỗ & đất mộc mạc',
  'layerable scent': 'Hương thơm dễ mix nhiều tầng',
  'unisex/ genderless scent': 'Hương thơm phi giới tính (Unisex)',

  // Eco & Community
  'community favorite': 'Được cộng đồng làm đẹp yêu thích',
  'customizable': 'Tùy chỉnh linh hoạt',
  'recyclable packaging': 'Bao bì tái chế thân thiện',
  'sustainable packaging': 'Bao bì bền vững sinh thái',
  'refill available': 'Có lõi thay thế tiết kiệm',
  'reef safe spf': 'Chống nắng an toàn cho san hô',
  'spf': 'Chỉ số chống nắng SPF',
  'uv protection': 'Bảo vệ toàn diện trước tia UV',
  'black owned at sephora': 'Thương hiệu sáng lập bởi người da màu',

  // Allure Awards
  'allure 2022 best of beauty award winner': 'Giải thưởng Allure Best of Beauty 2022',
  'allure 2021 best of beauty award winner': 'Giải thưởng Allure Best of Beauty 2021',
  'allure 2020 best of beauty award winner': 'Giải thưởng Allure Best of Beauty 2020',
  'allure 2019 best of beauty award winner': 'Giải thưởng Allure Best of Beauty 2019',
  'allure 2018 best of beauty award winner': 'Giải thưởng Allure Best of Beauty 2018',
  'allure 2017 best of beauty award winner': 'Giải thưởng Allure Best of Beauty 2017',
  'allure 2022 clean beauty winner': 'Giải thưởng Allure Clean Beauty 2022',
  'allure 2021: clean beauty winner': 'Giải thưởng Allure Clean Beauty 2021',
  'allure 2019: clean beauty winner': 'Giải thưởng Allure Clean Beauty 2019',
  "allure 2018 readers' choice award winner": "Giải thưởng Allure Readers' Choice 2018",
  "allure readers' choice award winner: original foundation bareminerals": "Giải thưởng Allure Readers' Choice (bareMinerals)",
};

/**
 * Capitalizes string nicely for English display.
 */
function toEnglishTitle(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Translates a highlight tag according to selected language.
 * 
 * @param {string} rawTag - Raw highlight string from dataset
 * @param {string} lang - 'vi' | 'en'
 * @returns {string} Translated/Formatted label
 */
export function translateHighlight(rawTag, lang = 'vi') {
  if (!rawTag) return '';
  const clean = String(rawTag).trim().toLowerCase().replace(/^[\['"\s]+|[\]'"\s]+$/g, '');
  if (!clean) return '';

  if (lang === 'vi') {
    // 1. Direct dictionary match
    if (HIGHLIGHTS_MAP_VI[clean]) {
      return HIGHLIGHTS_MAP_VI[clean];
    }

    // 2. Pattern-based fallback for 'good for: ...'
    if (clean.startsWith('good for:')) {
      const rest = clean.replace('good for:', '').trim();
      const lookup = 'good for: ' + rest;
      if (HIGHLIGHTS_MAP_VI[lookup]) {
        return HIGHLIGHTS_MAP_VI[lookup];
      }
      return 'Hỗ trợ: ' + toEnglishTitle(rest);
    }

    // 3. Pattern-based fallback for 'without ...'
    if (clean.startsWith('without ')) {
      const rest = clean.replace('without ', '').trim();
      return 'Không chứa ' + toEnglishTitle(rest);
    }

    // 4. Pattern-based fallback for 'best for ...'
    if (clean.startsWith('best for ')) {
      const rest = clean.replace('best for ', '').trim();
      return 'Phù hợp nhất cho ' + toEnglishTitle(rest);
    }

    return toEnglishTitle(clean);
  }

  // English fallback: Proper Title Case
  if (clean.startsWith('good for:')) {
    const rest = clean.replace('good for:', '').trim();
    return 'Good for: ' + toEnglishTitle(rest);
  }
  return toEnglishTitle(clean);
}
