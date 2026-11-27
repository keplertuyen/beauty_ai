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
export const LOCAL_PRODUCT_IMAGES = new Set(['P04897543', 'P109908', 'P111902', 'P114902', 'P12045', 'P122751', 'P122774', 'P12336', 'P12495', 'P12573', 'P126301', 'P12790', 'P128706', 'P133707', 'P139000', 'P163103', 'P173619', 'P173726', 'P174502', 'P17484987', 'P186805', 'P18975403', 'P191858', 'P19700127', 'P202625', 'P202633', 'P210575', 'P219001', 'P228913', 'P232903', 'P232915', 'P244437', 'P248404', 'P248407', 'P253818', 'P255506', 'P256308', 'P258612', 'P261211', 'P264900', 'P269122', 'P270539', 'P278317', 'P281411', 'P283106', 'P284507', 'P284716', 'P2855', 'P286513', 'P289307', 'P290636', 'P297516', 'P297517', 'P297524', 'P302103', 'P302923', 'P308201', 'P309306', 'P309308', 'P309310', 'P309813', 'P375849', 'P377533', 'P377542', 'P377723', 'P377784', 'P377873', 'P378145', 'P378169', 'P378284', 'P378821', 'P378852', 'P379510', 'P379832', 'P381000', 'P381030', 'P382309', 'P384060', 'P384099', 'P384963', 'P385477', 'P386197', 'P387261', 'P388225', 'P38855877', 'P390722', 'P391759', 'P391799', 'P392235', 'P392245', 'P392246', 'P392516', 'P393281', 'P393325', 'P393718', 'P394534', 'P395615', 'P395697', 'P396733', 'P39784685', 'P39787544', 'P399330', 'P399623', 'P400259', 'P4010', 'P402718', 'P402942', 'P402943', 'P402944', 'P403812', 'P403818', 'P404322', 'P404758', 'P404916', 'P406080', 'P406712', 'P406922', 'P407448', 'P407450', 'P407908', 'P408017', 'P408218', 'P408219', 'P409239', 'P409523', 'P410532', 'P411387', 'P411388', 'P411403', 'P411848', 'P412025', 'P412090', 'P413613', 'P415701', 'P415747', 'P415771', 'P416139', 'P416200', 'P416341', 'P416560', 'P416563', 'P416564', 'P417242', 'P417936', 'P417985', 'P418218', 'P418346', 'P418507', 'P420224', 'P420533', 'P420652', 'P421456', 'P421996', 'P421998', 'P422007', 'P422022', 'P422077', 'P422083', 'P422510', 'P423130', 'P423148', 'P423688', 'P423925', 'P423935', 'P424378', 'P424948', 'P425318', 'P425608', 'P426340', 'P426501', 'P426836', 'P427301', 'P427405', 'P427406', 'P427410', 'P427411', 'P427413', 'P427414', 'P427415', 'P427416', 'P427417', 'P427418', 'P427419', 'P427420', 'P427421', 'P427517', 'P428222', 'P428416', 'P428661', 'P428819', 'P429043', 'P429515', 'P429548', 'P429952', 'P429953', 'P430146', 'P430240', 'P430969', 'P431750', 'P431852', 'P432239', 'P432262', 'P432298', 'P432502', 'P432504', 'P433172', 'P433173', 'P433206', 'P433402', 'P433443', 'P433516', 'P433521', 'P433523', 'P433526', 'P433530', 'P433811', 'P433887', 'P434002', 'P434101', 'P434104', 'P434336', 'P435386', 'P436148', 'P436353', 'P436359', 'P437631', 'P439406', 'P439672', 'P439926', 'P440075', 'P440307', 'P440700', 'P440929', 'P441101', 'P441323', 'P441644', 'P441813', 'P441814', 'P441831', 'P442003', 'P442563', 'P442566', 'P442744', 'P442753', 'P442755', 'P442758', 'P442761', 'P442821', 'P442830', 'P442831', 'P442836', 'P442838', 'P442840', 'P442871', 'P443350', 'P443352', 'P443563', 'P443830', 'P443833', 'P443838', 'P443840', 'P443845', 'P444048', 'P444154', 'P444226', 'P444718', 'P444989', 'P445827', 'P446609', 'P446938', 'P446942', 'P447210', 'P447364', 'P447376', 'P447519', 'P447596', 'P448102', 'P448192', 'P448203', 'P448530', 'P449116', 'P449158', 'P449180', 'P449342', 'P450614', 'P450887', 'P451920', 'P453224', 'P453225', 'P453814', 'P453816', 'P454018', 'P454042', 'P454120', 'P454348', 'P454383', 'P454387', 'P454388', 'P454751', 'P454762', 'P454794', 'P454838', 'P455201', 'P455366', 'P455368', 'P455369', 'P455418', 'P455898', 'P455936', 'P456218', 'P456400', 'P456446', 'P456566', 'P456953', 'P457005', 'P457223', 'P458209', 'P458219', 'P458268', 'P458724', 'P458755', 'P459141', 'P459144', 'P459835', 'P460512', 'P460516', 'P461147', 'P461148', 'P461159', 'P461160', 'P461483', 'P461537', 'P461555', 'P462353', 'P462699', 'P463036', 'P463071', 'P465752', 'P465757', 'P465808', 'P466123', 'P466155', 'P467038', 'P467208', 'P467451', 'P467607', 'P467615', 'P467652', 'P467655', 'P467754', 'P467760', 'P467762', 'P467976', 'P467977', 'P468175', 'P468353', 'P468685', 'P468691', 'P468693', 'P468694', 'P468821', 'P469065', 'P469086', 'P469510', 'P469522', 'P469825', 'P470024', 'P470025', 'P470257', 'P470529', 'P471003', 'P471038', 'P471049', 'P471059', 'P471237', 'P471242', 'P472067', 'P472997', 'P473708', 'P474832', 'P475543', 'P475589', 'P475599', 'P476028', 'P476414', 'P476730', 'P477838', 'P479304', 'P479318', 'P479327', 'P479339', 'P479343', 'P479345', 'P479362', 'P479732', 'P479846', 'P479847', 'P480192', 'P480286', 'P481114', 'P481367', 'P481396', 'P481403', 'P481743', 'P481968', 'P482262', 'P482320', 'P482535', 'P482693', 'P482750', 'P483060', 'P483662', 'P484039', 'P500061', 'P500283', 'P500329', 'P500423', 'P500452', 'P500472', 'P500613', 'P500636', 'P500777', 'P501760', 'P502185', 'P503711', 'P503714', 'P503878', 'P504071', 'P55849781', 'P55978864', 'P58930227', 'P61004', 'P64546856', 'P64879845', 'P67988453', 'P69304', 'P73124556', 'P7880', 'P85225585', 'P87985432', 'P88779809', 'P94421', 'P97989778', 'P98364786']);
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

  const rawImg = String(product.imageUrl || product.image_url || '').trim();
  if (
    rawImg.startsWith('/uploads/') ||
    rawImg.startsWith('/images/') ||
    rawImg.startsWith('http://') ||
    rawImg.startsWith('https://')
  ) {
    return rawImg;
  }

  const pid = String(product.code || product.product_id || product.id || '').trim();
  if (pid && LOCAL_PRODUCT_IMAGES.has(pid)) {
    return `/images/products/${pid}.webp`;
  }

  return resolveCategoryPlaceholder(product);
}
