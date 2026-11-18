// Нормализация текста для поиска: регистр не важен, «ё» = «е», пробелы схлопнуты.
export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Слова запроса после нормализации; пустая строка → []. */
export function tokenize(value) {
  const text = normalizeText(value);
  return text ? text.split(' ') : [];
}
