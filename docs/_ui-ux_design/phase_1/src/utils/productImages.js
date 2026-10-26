/**
 * productImages.js — High-Resolution Real Product Imagery System for BeautyAI
 * 
 * Provides professional studio cosmetics and skincare photography
 * with deterministic hashing per product_id, iconic product overrides,
 * and graceful fallback handling.
 */

// ── 1. ICONIC HERO PRODUCT OVERRIDES ──────────────────────────────────────────
export const TOP_PRODUCT_IMAGES = {
  // Rare Beauty by Selena Gomez - Soft Pinch Liquid Blush
  P97989778: 'https://www.sephora.com/productimages/sku/s3014594-main-zoom.jpg',
  // NARS - Radiant Creamy Concealer
  P377873: 'https://www.sephora.com/productimages/sku/s2172310-main-zoom.jpg',
  // LANEIGE - Lip Sleeping Mask Intense Hydration with Vitamin C
  P420652: 'https://www.sephora.com/productimages/sku/s1966258-main-zoom.jpg',
  // SEPHORA COLLECTION - Cream Lip Stain Liquid Lipstick
  P281411: 'https://www.sephora.com/productimages/sku/s1296110-main-zoom.jpg',
  // Fenty Beauty by Rihanna - Gloss Bomb Universal Lip Luminizer
  P67988453: 'https://www.sephora.com/productimages/sku/s1925965-main-zoom.jpg',
  // Fenty Beauty by Rihanna - Pro Filt’r Soft Matte Longwear Liquid Foundation
  P87985432: 'https://www.sephora.com/productimages/sku/s2170322-main-zoom.jpg',
  // NARS - Blush
  P2855: 'https://www.sephora.com/productimages/sku/s2245389-main-zoom.jpg',
  // Anastasia Beverly Hills - Brow Wiz Ultra-Slim Precision Brow Pencil
  P202633: 'https://www.sephora.com/productimages/sku/s1488337-main-zoom.jpg',
  // Laura Mercier - Translucent Loose Setting Powder
  P109908: 'https://www.sephora.com/productimages/sku/s2988509-main-zoom.jpg',
  // The Ordinary - Niacinamide 10% + Zinc 1% Oil Control Serum
  P427417: 'https://www.sephora.com/productimages/sku/s2031391-main-zoom.jpg',
  // Dior - Dior Addict Lip Glow
  P236816: 'https://www.sephora.com/productimages/sku/s2435345-main-zoom.jpg',
  // The Ordinary - Hyaluronic Acid 2% + B5 Hydrating Serum
  P427419: 'https://www.sephora.com/productimages/sku/s2031375-main-zoom.jpg',
  // Dior - Lip Glow Oil
  P453814: 'https://www.sephora.com/productimages/sku/s2316438-main-zoom.jpg',
  // Urban Decay - All Nighter Long-Lasting Makeup Setting Spray
  P263504: 'https://www.sephora.com/productimages/sku/s1536549-main-zoom.jpg',
  // Estée Lauder - Double Wear Stay-in-Place Foundation
  P378284: 'https://www.sephora.com/productimages/sku/s1465095-main-zoom.jpg',
  // Armani Beauty - Luminous Silk Perfect Glow Flawless Oil-Free Foundation
  P393401: 'https://www.sephora.com/productimages/sku/s1201508-main-zoom.jpg',
  // Anastasia Beverly Hills - DIPBROW Waterproof, Smudge Proof Brow Pomade
  P384060: 'https://www.sephora.com/productimages/sku/s1578277-main-zoom.jpg',
  // Anastasia Beverly Hills - Eye Shadow Singles
  P404832: 'https://www.sephora.com/productimages/sku/s1685817-main-zoom.jpg',
  // Urban Decay - Vice Hydrating Lipstick
  P409523: 'https://www.sephora.com/productimages/sku/s2484392-main-zoom.jpg',
  // Anastasia Beverly Hills - Liquid Lipstick
  P404831: 'https://www.sephora.com/productimages/sku/s1685874-main-zoom.jpg',
  // KVD Beauty - Tattoo Liner Vegan Waterproof Liquid Eyeliner
  P245205: 'https://www.sephora.com/productimages/sku/s1934983-main-zoom.jpg',
  // Urban Decay - 24/7 Glide-On Waterproof Eyeliner Pencil
  P133707: 'https://www.sephora.com/productimages/sku/s1393693-main-zoom.jpg',
  // The Ordinary - Glycolic Acid 7% Exfoliating Toning Solution
  P427406: 'https://www.sephora.com/productimages/sku/s2031508-main-zoom.jpg',
  // The Ordinary - AHA 30% + BHA 2% Exfoliating Peeling Solution
  P442563: 'https://www.sephora.com/productimages/sku/s2210722-main-zoom.jpg',
  // Too Faced - Better Than Sex Volumizing & Lengthening Mascara
  P381000: 'https://www.sephora.com/productimages/sku/s1533439-main-zoom.jpg',
  // Olaplex - No. 3 Hair Repair Perfector
  P428224: 'https://www.sephora.com/productimages/sku/s2033264-main-zoom.jpg',
  // Kosas - Revealer Super Creamy + Brightening Concealer and Daytime Eye Cream
  P456151: 'https://www.sephora.com/productimages/sku/s2334043-main-zoom.jpg',
  // Too Faced - Born This Way Super Coverage Multi-Use Longwear Concealer
  P432298: 'https://www.sephora.com/productimages/sku/s2084408-main-zoom.jpg',
  // Charlotte Tilbury - Hollywood Flawless Filter
  P434104: 'https://www.sephora.com/productimages/sku/s2434678-main-zoom.jpg',
  // Fenty Beauty by Rihanna - Stunna Lip Paint Longwear Fluid Lip Color
  P39787544: 'https://www.sephora.com/productimages/sku/s1925965-main-zoom.jpg',
  // Charlotte Tilbury - Airbrush Flawless Finish Setting Powder
  P433526: 'https://www.sephora.com/productimages/sku/s2434751-main-zoom.jpg',
  // Dior - Dior Addict Lip Maximizer Plumping Gloss
  P186805: 'https://www.sephora.com/productimages/sku/s2168557-main-zoom.jpg',
  // Rare Beauty by Selena Gomez - Positive Light Liquid Luminizer Highlight
  P38855877: 'https://www.sephora.com/productimages/sku/s2362168-main-zoom.jpg',
  // Fenty Beauty by Rihanna - Match Stix Matte Contour Skinstick
  P18975403: 'https://www.sephora.com/productimages/sku/s2565141-main-zoom.jpg',
  // Fenty Beauty by Rihanna - Killawatt Freestyle Highlighter
  P64879845: 'https://www.sephora.com/productimages/sku/s1925940-main-zoom.jpg',
  // LANEIGE - Lip Glowy Balm
  P443563: 'https://www.sephora.com/productimages/sku/s2198083-main-zoom.jpg',
  // Sol de Janeiro - Brazilian Bum Bum Body Cream
  P406080: 'https://www.sephora.com/productimages/sku/s1802412-main-zoom.jpg',
  // Too Faced - Born This Way Natural Finish Longwear Liquid Foundation
  P397517: 'https://www.sephora.com/productimages/sku/s1710011-main-zoom.jpg',
  // Buxom - Full-On Plumping Lip Polish Gloss
  P174213: 'https://www.sephora.com/productimages/sku/s1887850-main-zoom.jpg',
  // stila - Glitter & Glow Liquid Eye Shadow
  P63087293: 'https://www.sephora.com/productimages/sku/s1887850-main-zoom.jpg',
  // Anastasia Beverly Hills - Modern Renaissance Eye Shadow Palette
  P409118: 'https://www.sephora.com/productimages/sku/s1824333-main-zoom.jpg',
  // Charlotte Tilbury - Beauty Highlighter Wand
  P444154: 'https://www.sephora.com/productimages/sku/s2144368-main-zoom.jpg',
  // NARS - Mini Radiant Creamy Concealer
  P422077: 'https://www.sephora.com/productimages/sku/s2172310-main-zoom.jpg',
  // beautyblender - ORIGINAL BEAUTYBLENDER Makeup Sponge
  P228913: 'https://www.sephora.com/productimages/sku/s1100577-main-zoom.jpg',
  // SEPHORA COLLECTION - Sephora Colorful Eyeshadow
  P430932: 'https://www.sephora.com/productimages/sku/s2040921-main-zoom.jpg',
  // Charlotte Tilbury - Lip Cheat Lip Liner
  P433516: 'https://www.sephora.com/productimages/sku/s2434827-main-zoom.jpg',
  // Urban Decay - 24/7 Eyeshadow
  P309813: 'https://www.sephora.com/productimages/sku/s2419406-main-zoom.jpg',
  // SEPHORA COLLECTION - #LIPSTORIES Lipstick
  P424915: 'https://www.sephora.com/productimages/sku/s1974641-main-zoom.jpg',
  // NARS - Velvet Matte Lipstick Pencil
  P78834: 'https://www.sephora.com/productimages/sku/s1637958-main-zoom.jpg',
  // Urban Decay - Naked3 Eyeshadow Palette
  P384099: 'https://www.sephora.com/productimages/sku/s1573336-main-zoom.jpg',
  // NARS - Soft Matte Complete Concealer
  P416200: 'https://www.sephora.com/productimages/sku/s1900356-main-zoom.jpg',
  // Drunk Elephant - Protini Polypeptide Firming Refillable Moisturizer
  P427421: 'https://www.sephora.com/productimages/sku/s2025633-main-zoom.jpg',
  // Laura Mercier - Caviar Stick Eye Shadow
  P293605: 'https://www.sephora.com/productimages/sku/s1368943-main-zoom.jpg',
  // Youth To The People - Superfood Antioxidant Cleanser
  P411387: 'https://www.sephora.com/productimages/sku/s1863588-main-zoom.jpg',
  // Farmacy - Green Clean Makeup Removing Cleansing Balm
  P417238: 'https://www.sephora.com/productimages/sku/s1899103-main-zoom.jpg',
  // ILIA - Super Serum Skin Tint SPF 40 Foundation
  P455418: 'https://www.sephora.com/productimages/sku/s2332583-main-zoom.jpg',
  // stila - Stay All Day Waterproof Liquid Eye Liner
  P253818: 'https://www.sephora.com/productimages/sku/s1221084-main-zoom.jpg',
  // Glow Recipe - Watermelon Glow Niacinamide Dew Drops
  P466123: 'https://www.sephora.com/productimages/sku/s2404846-main-zoom.jpg',
  // Charlotte Tilbury - Mini Pillow Talk Lipstick & Liner Set
  P458268: 'https://www.sephora.com/productimages/sku/s2434827-main-zoom.jpg',
  // Tatcha - The Dewy Skin Cream Plumping & Hydrating Moisturizer
  P441101: 'https://www.sephora.com/productimages/sku/s2181006-main-zoom.jpg',
  // Tower 28 Beauty - ShineOn Lip Jelly Non-Sticky Gloss
  P448854: 'https://www.sephora.com/productimages/sku/s2285195-main-zoom.jpg',
  // Benefit Cosmetics - Hoola Bronzer
  P290636: 'https://www.sephora.com/productimages/sku/s2371904-main-zoom.jpg',
  // tarte - Amazonian Clay 12-Hour Blush
  P278610: 'https://www.sephora.com/productimages/sku/s1328780-main-zoom.jpg',
  // Tatcha - The Water Cream Oil-Free Pore Minimizing Moisturizer
  P418218: 'https://www.sephora.com/productimages/sku/s1932920-main-zoom.jpg',
  // Yves Saint Laurent - Rouge Volupté Shine Lipstick Balm
  P377710: 'https://www.sephora.com/productimages/sku/s1484781-main-zoom.jpg',
  // Rare Beauty by Selena Gomez - Warm Wishes Effortless Bronzer Sticks
  P479343: 'https://www.sephora.com/productimages/sku/s2518934-main-zoom.jpg',
  // tarte - Tartelette In Bloom Clay Eyeshadow Palette
  P403812: 'https://www.sephora.com/productimages/sku/s1776996-main-zoom.jpg',
  // Summer Fridays - Lip Butter Balm
  P455936: 'https://www.sephora.com/productimages/sku/s2495497-main-zoom.jpg',
  // Charlotte Tilbury - Hollywood Contour Wand
  P434002: 'https://www.sephora.com/productimages/sku/s2434652-main-zoom.jpg',
  // Charlotte Tilbury - Matte Revolution Lipstick
  P433530: 'https://www.sephora.com/productimages/sku/s2434777-main-zoom.jpg',
  // The Ordinary - Multi-Peptide + HA Serum
  P427420: 'https://www.sephora.com/productimages/sku/s2031409-main-zoom.jpg',
  // Kaja - Eye Bento Bouncy Eyeshadow Trio
  P436148: 'https://www.sephora.com/productimages/sku/s2139632-main-zoom.jpg',
  // NARS - Audacious Lipstick
  P387906: 'https://www.sephora.com/productimages/sku/s1637958-main-zoom.jpg',
  // Too Faced - Melted Matte Liquid Lipstick
  P407636: 'https://www.sephora.com/productimages/sku/s1829910-main-zoom.jpg',
  // Dior - BACKSTAGE Face & Body Foundation
  P432500: 'https://www.sephora.com/productimages/sku/s2070118-main-zoom.jpg',
  // Anastasia Beverly Hills - Soft Glam Eyeshadow Palette
  P58930227: 'https://www.sephora.com/productimages/sku/s2036499-main-zoom.jpg',
  // Drunk Elephant - D-Bronzi Anti-Pollution Bronzing Drops with Peptides
  P432668: 'https://www.sephora.com/productimages/sku/s2081529-main-zoom.jpg',
  // KVD Beauty - Lock-It Full-Coverage Long-Wear Matte Liquid Foundation
  P311138: 'https://www.sephora.com/productimages/sku/s1501550-main-zoom.jpg',
  // HUDA BEAUTY - Easy Bake Loose Baking & Setting Powder
  P433402: 'https://www.sephora.com/productimages/sku/s2114031-main-zoom.jpg',
  // Smashbox - Always On Longwear Matte Liquid Lipstick
  P409317: 'https://www.sephora.com/productimages/sku/s1815349-main-zoom.jpg',
  // MILK MAKEUP - Hydro Grip Hydrating Makeup Primer
  P441813: 'https://www.sephora.com/productimages/sku/s2169423-main-zoom.jpg',
  // Benefit Cosmetics - The POREfessional Pore Minimizing Primer
  P264900: 'https://www.sephora.com/productimages/sku/s1259068-main-zoom.jpg',
  // Peace Out - Salicylic Acid Acne Healing Dots
  P421275: 'https://www.sephora.com/productimages/sku/s1976075-main-zoom.jpg',
  // Laura Mercier - Mini Translucent Loose Setting Powder
  P422083: 'https://www.sephora.com/productimages/sku/s2042232-main-zoom.jpg',
  // Charlotte Tilbury - Mini Hollywood Flawless Filter
  P467607: 'https://www.sephora.com/productimages/sku/s2434678-main-zoom.jpg',
  // Benefit Cosmetics - They're Real! Lengthening Mascara
  P289307: 'https://www.sephora.com/productimages/sku/s1343938-main-zoom.jpg',
  // NARS - Natural Radiant Longwear Foundation
  P427301: 'https://www.sephora.com/productimages/sku/s2031177-main-zoom.jpg',
  // Fenty Beauty by Rihanna - Eaze Drop Blurring Skin Tint
  P470025: 'https://www.sephora.com/productimages/sku/s2431864-main-zoom.jpg',
  // Urban Decay - Eyeshadow Primer Potion
  P284716: 'https://www.sephora.com/productimages/sku/s1704402-main-zoom.jpg',
  // Charlotte Tilbury - Airbrush Flawless Longwear Foundation
  P448869: 'https://www.sephora.com/productimages/sku/s2244804-main-zoom.jpg',
  // MAKE UP FOR EVER - Artist Color Pencil Brow, Eye & Lip Liner
  P430969: 'https://www.sephora.com/productimages/sku/s2039980-main-zoom.jpg',
  // Supergoop! - Unseen Sunscreen SPF 40 PA+++
  P454380: 'https://www.sephora.com/productimages/sku/s2334589-main-zoom.jpg',
  // Olaplex - No. 7 Bonding Hair Oil
  P447376: 'https://www.sephora.com/productimages/sku/s2266328-main-zoom.jpg',
  // Drunk Elephant - C-Firma Fresh Vitamin-C Day Serum
  P400259: 'https://www.sephora.com/productimages/sku/s2484913-main-zoom.jpg',
  // First Aid Beauty - Ultra Repair Cream Intense Hydration
  P248407: 'https://www.sephora.com/productimages/sku/s1217744-main-zoom.jpg',
  // SEPHORA COLLECTION - Retractable Waterproof Eyeliner
  P230234: 'https://www.sephora.com/productimages/sku/s1198944-main-zoom.jpg',
  // The Ordinary - Lactic Acid 10% + HA 2% Exfoliating Serum
  P427413: 'https://www.sephora.com/productimages/sku/s2031441-main-zoom.jpg',
  // Hourglass - Vanish Seamless Finish Foundation Stick
  P410532: 'https://www.sephora.com/productimages/sku/s1828003-main-zoom.jpg',
  // Benefit Cosmetics - Gimme Brow+ Tinted Volumizing Eyebrow Gel
  P409239: 'https://www.sephora.com/productimages/sku/s2077972-main-zoom.jpg',
  // Drunk Elephant - T.L.C. Framboos Glycolic Resurfacing Night Serum
  P392246: 'https://www.sephora.com/productimages/sku/s1679315-main-zoom.jpg',
};

// ── 2. CURATED CATEGORY REAL STUDIO PHOTOGRAPHY ──────────────────────────────
export const CATEGORY_STUDIO_IMAGES = {
  // ── Moisturizers & Creams
  Moisturizers: [
    'https://images.unsplash.com/photo-1608248597359-0020163351ca?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1556228722-d0b7313a0328?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=85',
  ],

  // ── Serums & Essences
  'Serums & Essences': [
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1608248597359-0020163351ca?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&q=85',
  ],

  // ── Cleansers & Face Wash
  'Face Wash & Cleansers': [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1556228722-d0b7313a0328?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1567928805164-e598f4194098?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=85',
  ],

  // ── Sunscreens
  'Face Sunscreen': [
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1608248597359-0020163351ca?auto=format&fit=crop&q=85',
  ],

  // ── Eye Creams & Care
  'Eye Creams': [
    'https://images.unsplash.com/photo-1608248597359-0020163351ca?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1556228722-d0b7313a0328?auto=format&fit=crop&q=85',
  ],

  // ── Face Masks
  'Face Masks': [
    'https://images.unsplash.com/photo-1567928805164-e598f4194098?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1608248597359-0020163351ca?auto=format&fit=crop&q=85',
  ],

  // ── Facial Oils
  'Face Oils': [
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&q=85',
  ],

  // ── Toners & Mists
  Toners: [
    'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1556228722-d0b7313a0328?auto=format&fit=crop&q=85',
  ],

  // ── Lip Treatments
  'Lip Balm & Treatments': [
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1599732497042-302381285223?auto=format&fit=crop&q=85',
  ],

  // ── Anti-Aging & Treatments
  'Anti-Aging': [
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1608248597359-0020163351ca?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=85',
  ],

  // ── Acne & Blemishes
  'Acne & Blemishes': [
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1608248597359-0020163351ca?auto=format&fit=crop&q=85',
  ],

  // ── Makeup
  Makeup: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1503236823255-94609f598e71?auto=format&fit=crop&q=85',
  ],

  // ── Hair
  Hair: [
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1608248597359-0020163351ca?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=85',
  ],

  // ── Fragrance
  Fragrance: [
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=85',
  ],

  // ── Bath & Body
  'Bath & Body': [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1556228722-d0b7313a0328?auto=format&fit=crop&q=85',
  ],
};

// Default universal fallback image
export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1608248597359-0020163351ca?auto=format&fit=crop&q=85';

/**
 * Deterministic hash function that maps a string to a non-negative integer.
 */
function hashString(str) {
  if (!str) return 0;
  const s = String(str);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Resolves the real studio photo for a product based on its ID, brand, or category.
 * 
 * @param {Object} product - Product object from API
 * @param {number} width - Desired image width (default: 600)
 * @returns {string} Fully qualified image URL
 */
export function getProductImage(product, width = 600) {
  if (!product) return `${DEFAULT_PRODUCT_IMAGE}&w=${width}`;

  const pid = String(product.product_id || product.id || '').trim();

  // 1. Direct custom image URL if supplied
  if (product.image_url && String(product.image_url).startsWith('http')) {
    return product.image_url;
  }

  // 2. Iconic hero product override
  if (pid && TOP_PRODUCT_IMAGES[pid]) {
    return `${TOP_PRODUCT_IMAGES[pid]}&w=${width}`;
  }

  // 3. Category matching (check tertiary -> secondary -> primary)
  const categoriesToCheck = [
    product.tertiary_category,
    product.secondary_category,
    product.primary_category,
    product.category,
  ].filter(Boolean);

  let matchedList = null;

  for (const cat of categoriesToCheck) {
    if (CATEGORY_STUDIO_IMAGES[cat]) {
      matchedList = CATEGORY_STUDIO_IMAGES[cat];
      break;
    }

    const catLower = String(cat).toLowerCase();
    if (catLower.includes('serum') || catLower.includes('essence') || catLower.includes('treatment')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Serums & Essences'];
      break;
    }
    if (catLower.includes('cleanse') || catLower.includes('wash') || catLower.includes('remover')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Face Wash & Cleansers'];
      break;
    }
    if (catLower.includes('moistur') || catLower.includes('cream') || catLower.includes('lotion')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Moisturizers'];
      break;
    }
    if (catLower.includes('sun') || catLower.includes('spf')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Face Sunscreen'];
      break;
    }
    if (catLower.includes('eye')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Eye Creams'];
      break;
    }
    if (catLower.includes('mask')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Face Masks'];
      break;
    }
    if (catLower.includes('oil')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Face Oils'];
      break;
    }
    if (catLower.includes('toner') || catLower.includes('mist')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Toners'];
      break;
    }
    if (catLower.includes('lip')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Lip Balm & Treatments'];
      break;
    }
    if (catLower.includes('aging') || catLower.includes('anti-aging')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Anti-Aging'];
      break;
    }
    if (catLower.includes('acne') || catLower.includes('blemish')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Acne & Blemishes'];
      break;
    }
    if (catLower.includes('fragrance') || catLower.includes('perfume')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Fragrance'];
      break;
    }
    if (catLower.includes('hair')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Hair'];
      break;
    }
    if (catLower.includes('makeup')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Makeup'];
      break;
    }
    if (catLower.includes('body') || catLower.includes('bath')) {
      matchedList = CATEGORY_STUDIO_IMAGES['Bath & Body'];
      break;
    }
  }

  // Fallback to Moisturizers if no specific category matched
  if (!matchedList || matchedList.length === 0) {
    matchedList = CATEGORY_STUDIO_IMAGES['Moisturizers'];
  }

  // 4. Deterministic indexing using hash of product_id or product_name
  const seed = pid || product.product_name || 'beautyai';
  const index = hashString(seed) % matchedList.length;
  const baseUrl = matchedList[index];

  return `${baseUrl}&w=${width}`;
}
