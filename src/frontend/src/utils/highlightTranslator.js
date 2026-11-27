/**
 * Formats Sephora dataset product highlight tags into clean English Title Case.
 */

function toEnglishTitle(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a raw highlight tag for display in English.
 *
 * @param {string} rawTag - Raw highlight string from dataset
 * @returns {string} Formatted English label
 */
export function translateHighlight(rawTag) {
  if (!rawTag) return '';
  const clean = String(rawTag).trim().toLowerCase().replace(/^[\['"\s]+|[\]'"\s]+$/g, '');
  if (!clean) return '';

  if (clean.startsWith('good for:')) {
    const rest = clean.replace('good for:', '').trim();
    return 'Good for: ' + toEnglishTitle(rest);
  }
  return toEnglishTitle(clean);
}
