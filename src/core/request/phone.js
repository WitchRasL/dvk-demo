// Маска телефона +7 (XXX) XXX-XX-XX.

/** Цифры номера без кода страны: ведущие 7 или 8 — это код, остальное — десять цифр номера (не больше). */
function nationalDigits(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  const national = /^[78]/.test(digits) ? digits.slice(1) : digits;
  return national.slice(0, 10);
}

/**
 * Приводит ввод к маске по мере набора. Хвостовых разделителей не бывает — иначе стирание
 * с конца упиралось бы в скобку и пробел.
 * @param {string} raw
 * @returns {string} '' · '+7' · '+7 (9' · … · '+7 (912) 345-67-89'
 */
export function formatPhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  const n = nationalDigits(raw);
  if (!n) return /^[78]/.test(digits) ? '+7' : '';
  let out = `+7 (${n.slice(0, 3)}`;
  if (n.length > 3) out += `) ${n.slice(3, 6)}`;
  if (n.length > 6) out += `-${n.slice(6, 8)}`;
  if (n.length > 8) out += `-${n.slice(8, 10)}`;
  return out;
}

/** Десять цифр после 7/8. */
export function isPhoneComplete(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  const national = /^[78]/.test(digits) ? digits.slice(1) : digits;
  return national.length === 10;
}
