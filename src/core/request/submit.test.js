import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitRequest } from './index.js';

const ENDPOINT = 'https://forms.example.test/f/abc123';

const payload = {
  variant: 'showroom',
  direction: 'retail',
  objectType: 'pharmacy',
  objectNote: 'Аптека, 80 м²',
  timing: 'в течение месяца',
  name: 'Анна',
  phone: '+7 (912) 345-67-89',
  email: 'anna@example.ru',
  city: 'spb',
  comment: '',
  consent: true,
  items: [
    { id: 'p01', name: 'Витрина узкая торговая', qty: 2, sourceUrl: 'https://example.test/vitrina-uzkaya' },
    { id: 'p04', name: 'Прилавок-касса', qty: 1, sourceUrl: null },
  ],
  file: null,
};

const okResponse = (body = { ok: true }) => ({ ok: true, status: 200, json: async () => body });
const failResponse = (status) => ({ ok: false, status, json: async () => ({ error: 'upstream' }) });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('submitRequest: демо-режим', () => {
  it('без адреса формы ничего не уходит в сеть, ответ — демо-успех', async () => {
    const fetchImpl = vi.fn();
    expect(await submitRequest(payload, { endpoint: '', fetchImpl })).toEqual({ ok: true, demo: true });
    expect(await submitRequest(payload, { endpoint: '   ', fetchImpl })).toEqual({ ok: true, demo: true });
    expect(await submitRequest(payload, { endpoint: null, fetchImpl })).toEqual({ ok: true, demo: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('адрес по умолчанию — VITE_FORM_ENDPOINT; не задан — демо', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    vi.stubEnv('VITE_FORM_ENDPOINT', '');
    expect(await submitRequest(payload, { fetchImpl })).toEqual({ ok: true, demo: true });
    expect(fetchImpl).not.toHaveBeenCalled();

    vi.stubEnv('VITE_FORM_ENDPOINT', ENDPOINT);
    expect(await submitRequest(payload, { fetchImpl })).toEqual({ ok: true, demo: false });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(ENDPOINT);
  });
});

describe('submitRequest: отправка', () => {
  it('POST multipart/form-data с Accept: application/json; заголовок Content-Type ставит браузер', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const result = await submitRequest(payload, { endpoint: ENDPOINT, fetchImpl });
    expect(result).toEqual({ ok: true, demo: false });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Accept: 'application/json' });
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('поля заявки и список КП уходят в форме; пустые поля пропускаются', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    await submitRequest(payload, { endpoint: ENDPOINT, fetchImpl });
    const body = fetchImpl.mock.calls[0][1].body;
    expect(body.get('name')).toBe('Анна');
    expect(body.get('phone')).toBe('+7 (912) 345-67-89');
    expect(body.get('email')).toBe('anna@example.ru');
    expect(body.get('city')).toBe('spb');
    expect(body.get('direction')).toBe('retail');
    expect(body.get('objectType')).toBe('pharmacy');
    expect(body.get('objectNote')).toBe('Аптека, 80 м²');
    expect(body.get('timing')).toBe('в течение месяца');
    expect(body.get('variant')).toBe('showroom');
    expect(body.get('consent')).toBe('yes');
    expect(body.has('comment')).toBe(false);
    expect(body.has('attachment')).toBe(false);
    expect(body.get('items')).toBe(
      ['1. Витрина узкая торговая × 2 — https://example.test/vitrina-uzkaya', '2. Прилавок-касса × 1'].join('\n'),
    );
  });

  it('без позиций КП поле items не отправляется', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    await submitRequest({ ...payload, items: [] }, { endpoint: ENDPOINT, fetchImpl });
    expect(fetchImpl.mock.calls[0][1].body.has('items')).toBe(false);
  });

  it('файл прикладывается под именем attachment вместе с оригинальным именем', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const file = new File(['%PDF-1.4'], 'plan.pdf', { type: 'application/pdf' });
    await submitRequest({ ...payload, file }, { endpoint: ENDPOINT, fetchImpl });
    const sent = fetchImpl.mock.calls[0][1].body.get('attachment');
    expect(sent).toBeInstanceOf(File);
    expect(sent.name).toBe('plan.pdf');
  });

  it('ключ доступа из адреса (Web3Forms: ?access_key=…) дублируется полем формы', async () => {
    const fetchImpl = vi.fn(async () => okResponse({ success: true }));
    await submitRequest(payload, { endpoint: 'https://api.web3forms.test/submit?access_key=test-key', fetchImpl });
    expect(fetchImpl.mock.calls[0][1].body.get('access_key')).toBe('test-key');
    await submitRequest(payload, { endpoint: ENDPOINT, fetchImpl });
    expect(fetchImpl.mock.calls[1][1].body.has('access_key')).toBe(false);
  });
});

describe('submitRequest: сбои', () => {
  it('не-2xx → ok: false с русским текстом, адрес в тексте не светится', async () => {
    for (const status of [400, 422, 500, 503]) {
      const result = await submitRequest(payload, { endpoint: ENDPOINT, fetchImpl: async () => failResponse(status) });
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/[а-я]/i);
      expect(result.error).not.toContain('forms.example.test');
    }
  });

  it('сеть недоступна → ok: false', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const result = await submitRequest(payload, { endpoint: ENDPOINT, fetchImpl });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/соединени|интернет|сет/i);
  });

  it('2xx, но сервис пишет об отказе в теле (Web3Forms success: false) → ok: false', async () => {
    const result = await submitRequest(payload, { endpoint: ENDPOINT, fetchImpl: async () => okResponse({ success: false }) });
    expect(result.ok).toBe(false);
  });

  it('2xx с пустым или нечитаемым телом — успех', async () => {
    const response = { ok: true, status: 200, json: async () => { throw new SyntaxError('empty'); } };
    expect(await submitRequest(payload, { endpoint: ENDPOINT, fetchImpl: async () => response })).toEqual({ ok: true, demo: false });
  });

  it('зависший сервис не держит кнопку вечно: по таймауту → ok: false', async () => {
    const fetchImpl = (url, init) =>
      new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    const result = await submitRequest(payload, { endpoint: ENDPOINT, fetchImpl, timeoutMs: 20 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/[а-я]/i);
  });
});
