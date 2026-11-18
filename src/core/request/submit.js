// Отправка заявки через адаптер. Адрес формы — только переменная VITE_FORM_ENDPOINT
// (Formspree или Web3Forms). Пока её нет, заявка никуда не уходит: демо-режим.

const TEXT_FIELDS = ['variant', 'direction', 'objectType', 'objectNote', 'timing', 'name', 'phone', 'email', 'city', 'comment'];
const DEFAULT_TIMEOUT_MS = 20000;

export const SUBMIT_ERRORS = {
  network: 'Нет соединения с сервисом заявок. Проверьте интернет и отправьте ещё раз.',
  service: 'Сервис приёма заявок сейчас недоступен. Повторите чуть позже или позвоните нам.',
};

/** Строки КП → читаемый список для письма: «1. Название × 2 — ссылка». */
function formatItems(items) {
  return items
    .map((item, index) => `${index + 1}. ${item.name} × ${item.qty}${item.sourceUrl ? ` — ${item.sourceUrl}` : ''}`)
    .join('\n');
}

function buildFormData(payload, endpoint) {
  const form = new FormData();
  for (const field of TEXT_FIELDS) {
    const value = payload[field];
    if (value != null && String(value).trim() !== '') form.append(field, String(value));
  }
  form.append('consent', payload.consent ? 'yes' : 'no');
  if (payload.items?.length) form.append('items', formatItems(payload.items));
  if (payload.file) form.append('attachment', payload.file, payload.file.name);
  // Web3Forms ждёт публичный ключ доступа в теле формы; храним его вместе с адресом в одной переменной.
  try {
    const accessKey = new URL(endpoint).searchParams.get('access_key');
    if (accessKey) form.append('access_key', accessKey);
  } catch {
    // не URL — fetch сам вернёт ошибку, ключ искать негде
  }
  return form;
}

/**
 * @param {{ variant, direction, objectType, objectNote, timing, name, phone, email, city, comment, consent,
 *   items: { id, name, qty, sourceUrl }[], file: File|null }} payload
 * @param {{ endpoint?: string, fetchImpl?: typeof fetch, timeoutMs?: number }} [options]
 * @returns {Promise<{ ok: true, demo: boolean } | { ok: false, error: string }>}
 */
export async function submitRequest(
  payload,
  { endpoint = import.meta.env.VITE_FORM_ENDPOINT, fetchImpl = globalThis.fetch?.bind(globalThis), timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) {
  const url = typeof endpoint === 'string' ? endpoint.trim() : '';
  if (!url) return { ok: true, demo: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: buildFormData(payload, url),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, error: SUBMIT_ERRORS.service };
    let body = null;
    try {
      body = await response.json();
    } catch {
      // пустое или не JSON-тело при 2xx — считаем отправку удавшейся
    }
    if (body && (body.success === false || body.ok === false)) return { ok: false, error: SUBMIT_ERRORS.service };
    return { ok: true, demo: false };
  } catch (error) {
    return { ok: false, error: error?.name === 'AbortError' ? SUBMIT_ERRORS.service : SUBMIT_ERRORS.network };
  } finally {
    clearTimeout(timer);
  }
}
