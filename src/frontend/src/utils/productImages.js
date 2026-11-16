/**
 * productImages.js — Verified Product Imagery & Neutral Placeholder Resolver
 *
 * Every real photo in LOCAL_PRODUCT_IMAGES is backed by a verified row in
 * docs/_data/images/manifest.csv (synced by scripts/sync_image_data.py).
 * Products without a verified photo render a neutral category SVG placeholder
 * instead of misleading stock photography.
 */

export const DEFAULT_PRODUCT_IMAGE = '/images/placeholders/default.svg';

// Auto-synced by scripts/sync_image_data.py from docs/_data/images/manifest.csv
// BEGIN_VERIFIED_SET
export const LOCAL_PRODUCT_IMAGES = new Set(['P04897543', 'P109908', 'P111902', 'P12045', 'P122751', 'P12336', 'P12495', 'P12573', 'P126301', 'P12790', 'P128706', 'P133707', 'P163103', 'P173726', 'P17484987', 'P186805', 'P18975403', 'P19700127', 'P202625', 'P202633', 'P210575', 'P228913', 'P244437', 'P248404', 'P248407', 'P253818', 'P256308', 'P258612', 'P261211', 'P264900', 'P270539', 'P278317', 'P281411', 'P284507', 'P284716', 'P2855', 'P286513', 'P289307', 'P290636', 'P297524', 'P302103', 'P302923', 'P309813', 'P375849', 'P377533', 'P377542', 'P377723', 'P377784', 'P377873', 'P378145', 'P378284', 'P378821', 'P379832', 'P381000', 'P382309', 'P384060', 'P384099', 'P384963', 'P385477', 'P388225', 'P38855877', 'P391759', 'P392235', 'P392245', 'P392246', 'P392516', 'P393281', 'P393325', 'P393718', 'P394534', 'P395615', 'P395697', 'P39784685', 'P39787544', 'P399330', 'P399623', 'P400259', 'P402718', 'P402944', 'P403812', 'P404758', 'P404916', 'P406712', 'P406922', 'P407908', 'P408017', 'P408218', 'P408219', 'P409239', 'P409523', 'P410532', 'P411388', 'P411848', 'P412090', 'P415747', 'P415771', 'P416200', 'P416563', 'P417936', 'P417985', 'P418507', 'P420533', 'P420652', 'P421456', 'P422077', 'P422083', 'P423925', 'P425608', 'P426340', 'P426836', 'P427301', 'P427411', 'P427413', 'P427415', 'P427416', 'P427417', 'P427418', 'P427419', 'P427421', 'P427517', 'P428222', 'P428661', 'P429515', 'P429548', 'P429952', 'P430146', 'P430240', 'P430969', 'P431750', 'P431852', 'P432298', 'P432502', 'P432504', 'P433172', 'P433173', 'P433206', 'P433402', 'P433516', 'P433523', 'P433530', 'P434002', 'P434101', 'P434104', 'P436148', 'P437631', 'P440307', 'P440700', 'P441813', 'P441814', 'P442563', 'P442744', 'P442821', 'P442830', 'P442831', 'P443352', 'P443563', 'P443833', 'P443840', 'P443845', 'P444048', 'P444154', 'P444718', 'P444989', 'P446609', 'P446938', 'P447364', 'P447376', 'P447519', 'P448102', 'P449116', 'P449342', 'P450887', 'P451920', 'P453225', 'P454042', 'P454348', 'P454751', 'P454762', 'P455201', 'P455418', 'P455936', 'P456218', 'P456446', 'P456953', 'P457223', 'P458219', 'P458268', 'P461147', 'P461148', 'P461483', 'P461537', 'P462353', 'P462699', 'P463036', 'P465757', 'P467038', 'P467208', 'P467451', 'P467607', 'P467760', 'P467762', 'P468175', 'P468353', 'P468685', 'P468691', 'P468693', 'P468694', 'P469065', 'P469825', 'P470025', 'P470257', 'P470529', 'P471049', 'P471059', 'P471242', 'P472997', 'P473708', 'P475543', 'P475599', 'P477838', 'P479343', 'P479345', 'P479732', 'P479846', 'P479847', 'P480286', 'P481114', 'P481396', 'P481403', 'P481968', 'P482262', 'P482535', 'P483662', 'P500061', 'P500283', 'P500423', 'P500452', 'P500636', 'P502185', 'P503711', 'P503714', 'P55849781', 'P55978864', 'P58930227', 'P61004', 'P64546856', 'P64879845', 'P67988453', 'P73124556', 'P7880', 'P85225585', 'P87985432', 'P88779809', 'P94421', 'P97989778', 'P98364786']);
// END_VERIFIED_SET

export function resolveCategoryPlaceholder(product) {
  if (!product) return DEFAULT_PRODUCT_IMAGE;
  const joined = [
    product.categoryName,
    product.department,
    product.tertiary_category,
    product.secondary_category,
    product.primary_category,
    product.category,
    product.name,
    product.product_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/serum|essence|ampoule|retinol|niacinamide/.test(joined)) {
    return '/images/placeholders/serum.svg';
  }
  if (/cleanse|wash|exfoli|scrub|toner/.test(joined)) {
    return '/images/placeholders/cleanser.svg';
  }
  if (/sunscreen|spf|sun /.test(joined)) {
    return '/images/placeholders/sunscreen.svg';
  }
  if (/fragrance|perfume|parfum|cologne|candle/.test(joined)) {
    return '/images/placeholders/fragrance.svg';
  }
  if (/hair|shampoo|conditioner|scalp/.test(joined)) {
    return '/images/placeholders/hair.svg';
  }
  if (/makeup|lipstick|blush|mascara|foundation|concealer|brow|eyeshadow|gloss/.test(joined)) {
    return '/images/placeholders/makeup.svg';
  }
  if (/bath|body|deodorant|hand |lotion/.test(joined)) {
    return '/images/placeholders/bath-body.svg';
  }
  if (/tool|brush|sponge|curler|device/.test(joined)) {
    return '/images/placeholders/tools.svg';
  }
  if (/skincare|moistur|cream|mask|eye|oil|balm/.test(joined)) {
    return '/images/placeholders/skincare.svg';
  }
  return DEFAULT_PRODUCT_IMAGE;
}

/**
 * Resolves a verified local product image or a neutral category placeholder.
 *
 * @param {Object} product - Product object from API
 * @returns {string} Image URL path
 */
export function getProductImage(product) {
  if (!product) return DEFAULT_PRODUCT_IMAGE;

  const pid = String(product.code || product.product_id || product.id || '').trim();
  if (pid && LOCAL_PRODUCT_IMAGES.has(pid)) {
    return `/images/products/${pid}.webp`;
  }

  const rawImg = String(product.imageUrl || product.image_url || '').trim();
  if (rawImg.startsWith('/images/placeholders/')) {
    return rawImg;
  }

  return resolveCategoryPlaceholder(product);
}
