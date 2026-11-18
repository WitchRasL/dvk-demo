import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { brokenStorage, memoryStorage } from '../../../tests/fixtures/memory-storage.js';

vi.mock('../catalog/data.js', () => import('../../../tests/fixtures/dataset.js'));

import { createCityStore } from '../city/index.js';
import { createKpStore } from '../kp/index.js';
import { QUIZ_KEY, QUIZ_STEPS, createQuizStore, quizReducer, useQuiz } from './index.js';

const run = (state, ...actions) => actions.reduce((current, action) => quizReducer(current, action), state);
const initial = () => quizReducer(undefined, { type: 'reset' });

const contacts = { name: 'Анна', phone: '+7 (912) 345-67-89', consent: true };
const set = (field, value) => ({ type: 'set', field, value });

/** Состояние на последнем шаге с верно заполненными ответами. */
function readyToSubmit() {
  return run(
    initial(),
    set('direction', 'retail'),
    { type: 'next' },
    set('objectType', 'pharmacy'),
    { type: 'next' },
    set('timing', 'в течение месяца'),
    { type: 'next' },
    { type: 'set', values: contacts },
  );
}

describe('quizReducer: шаги', () => {
  it('четыре шага: направление → объект → сроки → контакты', () => {
    expect(QUIZ_STEPS).toEqual(['direction', 'object', 'timing', 'contacts']);
    expect(initial()).toMatchObject({ step: 0, status: 'idle', error: null, attempted: false });
  });

  it('вперёд только с ответом на текущем шаге; без ответа остаётся и помечает попытку', () => {
    const blocked = run(initial(), { type: 'next' });
    expect(blocked.step).toBe(0);
    expect(blocked.attempted).toBe(true);
    const moved = run(blocked, set('direction', 'retail'), { type: 'next' });
    expect(moved.step).toBe(1);
    expect(moved.attempted).toBe(false);
  });

  it('все четыре шага проходятся по порядку, на последнем «вперёд» ничего не делает', () => {
    const state = readyToSubmit();
    expect(state.step).toBe(3);
    expect(run(state, { type: 'next' }).step).toBe(3);
  });

  it('назад возвращает на шаг, ответы остаются; с первого шага назад нельзя', () => {
    const state = run(initial(), set('direction', 'metal'), { type: 'next' }, { type: 'back' });
    expect(state.step).toBe(0);
    expect(state.values.direction).toBe('metal');
    const first = initial();
    expect(quizReducer(first, { type: 'back' })).toBe(first);
  });

  it('set меняет одно поле или сразу несколько, неизвестные поля не принимает', () => {
    expect(run(initial(), set('direction', 'retail')).values.direction).toBe('retail');
    const many = run(initial(), { type: 'set', values: { name: 'Анна', phone: '89' } });
    expect(many.values).toMatchObject({ name: 'Анна', phone: '89' });
    const state = initial();
    expect(quizReducer(state, set('hacker', 'x'))).toBe(state);
  });

  it('reset возвращает чистое состояние с любого шага', () => {
    expect(run(readyToSubmit(), { type: 'reset' })).toEqual(initial());
  });
});

describe('quizReducer: отправка', () => {
  it('submitStart на последнем шаге с верными данными включает отправку', () => {
    const state = run(readyToSubmit(), { type: 'submitStart' });
    expect(state.status).toBe('submitting');
    expect(state.error).toBeNull();
  });

  it('повторная отправка во время отправки невозможна: то же состояние', () => {
    const sending = run(readyToSubmit(), { type: 'submitStart' });
    expect(quizReducer(sending, { type: 'submitStart' })).toBe(sending);
  });

  it('без согласия, с неполным телефоном или не на последнем шаге отправка не начинается', () => {
    const noConsent = run(readyToSubmit(), set('consent', false), { type: 'submitStart' });
    expect(noConsent.status).toBe('idle');
    expect(noConsent.attempted).toBe(true);
    const shortPhone = run(readyToSubmit(), set('phone', '+7 (912) 3'), { type: 'submitStart' });
    expect(shortPhone.status).toBe('idle');
    const early = run(initial(), set('direction', 'retail'), { type: 'submitStart' });
    expect(early.status).toBe('idle');
  });

  it('пока идёт отправка, ответы, шаги и повторный старт заморожены', () => {
    const sending = run(readyToSubmit(), { type: 'submitStart' });
    expect(quizReducer(sending, set('name', 'Другой'))).toBe(sending);
    expect(quizReducer(sending, { type: 'back' })).toBe(sending);
    expect(quizReducer(sending, { type: 'next' })).toBe(sending);
  });

  it('submitOk — успех с признаком демо; submitFail — ошибка, ответы на месте, повтор возможен', () => {
    const sending = run(readyToSubmit(), { type: 'submitStart' });
    expect(run(sending, { type: 'submitOk', demo: true })).toMatchObject({ status: 'success', demo: true, error: null });
    expect(run(sending, { type: 'submitOk', demo: false })).toMatchObject({ status: 'success', demo: false });

    const failed = run(sending, { type: 'submitFail', error: 'Сервис недоступен' });
    expect(failed).toMatchObject({ status: 'error', error: 'Сервис недоступен' });
    expect(failed.values).toMatchObject(contacts);
    expect(failed.step).toBe(3);
    expect(run(failed, { type: 'submitStart' }).status).toBe('submitting');
  });

  it('итог отправки вне отправки игнорируется; после успеха новая отправка не стартует', () => {
    const ready = readyToSubmit();
    expect(quizReducer(ready, { type: 'submitOk', demo: true })).toBe(ready);
    expect(quizReducer(ready, { type: 'submitFail', error: 'x' })).toBe(ready);
    const done = run(ready, { type: 'submitStart' }, { type: 'submitOk', demo: true });
    expect(quizReducer(done, { type: 'submitStart' })).toBe(done);
  });

  it('невалидный ответ из старого черновика возвращает на первый шаг с ошибкой', () => {
    // Состояние на последнем шаге, но направление пустое (например, черновик правили руками).
    const broken = { ...readyToSubmit(), values: { ...readyToSubmit().values, direction: '' } };
    const state = quizReducer(broken, { type: 'submitStart' });
    expect(state.status).toBe('idle');
    expect(state.step).toBe(0);
    expect(state.attempted).toBe(true);
  });
});

describe('хранилище квиза: черновик', () => {
  it('ответы и шаг лежат в localStorage[dvk-quiz-v1] и восстанавливаются', () => {
    const storage = memoryStorage();
    const first = createQuizStore(storage);
    first.dispatch(set('direction', 'landscape'));
    first.dispatch({ type: 'next' });
    first.dispatch(set('objectType', 'school'));
    expect(QUIZ_KEY).toBe('dvk-quiz-v1');
    const draft = JSON.parse(storage.data['dvk-quiz-v1']);
    expect(draft.step).toBe(1);
    expect(draft.values).toMatchObject({ direction: 'landscape', objectType: 'school' });

    const reopened = createQuizStore(storage).getSnapshot();
    expect(reopened).toMatchObject({ step: 1, status: 'idle' });
    expect(reopened.values).toMatchObject({ direction: 'landscape', objectType: 'school' });
  });

  it('файл, согласие и состояние отправки в черновик не попадают', () => {
    const storage = memoryStorage();
    const store = createQuizStore(storage);
    store.dispatch({ type: 'set', values: { ...contacts, file: new File(['x'], 'plan.pdf', { type: 'application/pdf' }) } });
    const raw = storage.data['dvk-quiz-v1'];
    expect(raw).not.toContain('plan.pdf');
    expect(raw).not.toContain('consent');
    expect(raw).not.toContain('status');
    const restored = createQuizStore(storage).getSnapshot();
    expect(restored.values.consent).toBe(false);
    expect(restored.values.file).toBeNull();
    expect(restored.values.name).toBe('Анна');
  });

  it('успешная отправка и reset стирают черновик', () => {
    const storage = memoryStorage();
    const store = createQuizStore(storage);
    store.dispatch(set('direction', 'metal'));
    expect(storage.getItem('dvk-quiz-v1')).not.toBeNull();
    store.dispatch({ type: 'reset' });
    expect(storage.getItem('dvk-quiz-v1')).toBeNull();

    store.dispatch({ type: 'set', values: { direction: 'retail', objectType: 'pharmacy', timing: 'скоро', ...contacts } });
    store.dispatch({ type: 'next' });
    store.dispatch({ type: 'next' });
    store.dispatch({ type: 'next' });
    store.dispatch({ type: 'submitStart' });
    store.dispatch({ type: 'submitOk', demo: true });
    expect(store.getSnapshot().status).toBe('success');
    expect(storage.getItem('dvk-quiz-v1')).toBeNull();
  });

  it('испорченный черновик не ломает квиз', () => {
    expect(createQuizStore(memoryStorage({ 'dvk-quiz-v1': 'не json' })).getSnapshot()).toEqual(initial());
    expect(createQuizStore(memoryStorage({ 'dvk-quiz-v1': '[1,2]' })).getSnapshot()).toEqual(initial());
    const odd = JSON.stringify({ step: 99, values: { direction: 5, name: 'Анна' } });
    const state = createQuizStore(memoryStorage({ 'dvk-quiz-v1': odd })).getSnapshot();
    expect(state.step).toBe(0);
    expect(state.values.direction).toBe('');
    expect(state.values.name).toBe('Анна');
  });

  it('localStorage недоступен — квиз работает в памяти', () => {
    const store = createQuizStore(brokenStorage);
    expect(() => store.dispatch(set('direction', 'retail'))).not.toThrow();
    expect(store.getSnapshot().values.direction).toBe('retail');
  });
});

describe('useQuiz', () => {
  const okFetch = () => vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }));

  function setup({ fetchImpl, endpoint = 'https://forms.example.test/f/abc', kp = [] } = {}) {
    const store = createQuizStore(memoryStorage());
    const kpStore = createKpStore(memoryStorage());
    const cityStore = createCityStore(memoryStorage());
    kp.forEach((id) => kpStore.dispatch({ type: 'add', id }));
    const hook = renderHook(() => useQuiz({ store, kpStore, cityStore, submitOptions: { endpoint, fetchImpl } }));
    return { ...hook, store, cityStore };
  }

  function fillAll(result) {
    act(() => result.current.set('direction', 'retail'));
    act(() => result.current.next());
    act(() => result.current.set('objectType', 'pharmacy'));
    act(() => result.current.set('objectNote', 'Аптека, 80 м²'));
    act(() => result.current.next());
    act(() => result.current.set('timing', 'в течение месяца'));
    act(() => result.current.next());
    act(() => result.current.set('name', 'Анна'));
    act(() => result.current.set('phone', '+7 (912) 345-67-89'));
    act(() => result.current.set('consent', true));
  }

  it('отдаёт шаг, ответы и ошибки текущего шага только после попытки идти дальше', () => {
    const { result } = setup();
    expect(result.current).toMatchObject({ step: 0, stepId: 'direction', isFirst: true, isLast: false, status: 'idle' });
    expect(result.current.errors).toEqual({});
    act(() => result.current.next());
    expect(result.current.step).toBe(0);
    expect(result.current.errors.direction).toMatch(/направлени/i);
    act(() => result.current.set('direction', 'metal'));
    expect(result.current.errors).toEqual({});
    act(() => result.current.next());
    expect(result.current).toMatchObject({ step: 1, stepId: 'object' });
    act(() => result.current.back());
    expect(result.current.values.direction).toBe('metal');
  });

  it('ответы видны всем, кто использует квиз (страница и шапка), и восстанавливаются с черновика', () => {
    const storage = memoryStorage();
    const store = createQuizStore(storage);
    const a = renderHook(() => useQuiz({ store }));
    const b = renderHook(() => useQuiz({ store }));
    act(() => a.result.current.set('direction', 'landscape'));
    expect(b.result.current.values.direction).toBe('landscape');
    const reopenedStore = createQuizStore(storage);
    const reopened = renderHook(() => useQuiz({ store: reopenedStore }));
    expect(reopened.result.current.values.direction).toBe('landscape');
  });

  it('без настроенного адреса — демо-успех, в сеть ничего не уходит', async () => {
    const fetchImpl = okFetch();
    const { result } = setup({ fetchImpl, endpoint: '' });
    fillAll(result);
    let outcome;
    await act(async () => {
      outcome = await result.current.submit({ variant: 'ral' });
    });
    expect(outcome).toEqual({ ok: true, demo: true });
    expect(result.current).toMatchObject({ status: 'success', demo: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('отправляет ответы, город и список КП; вариант передаёт вызывающий', async () => {
    const fetchImpl = okFetch();
    const { result, cityStore } = setup({ fetchImpl, kp: ['p01', 'p04'] });
    cityStore.dispatch({ type: 'set', city: 'msk' });
    fillAll(result);
    await act(async () => {
      await result.current.submit({ variant: 'blueprint' });
    });
    expect(result.current).toMatchObject({ status: 'success', demo: false });
    const body = fetchImpl.mock.calls[0][1].body;
    expect(body.get('variant')).toBe('blueprint');
    expect(body.get('city')).toBe('msk');
    expect(body.get('direction')).toBe('retail');
    expect(body.get('objectNote')).toBe('Аптека, 80 м²');
    expect(body.get('phone')).toBe('+7 (912) 345-67-89');
    expect(body.get('items')).toBe(
      ['1. Витрина узкая торговая × 1 — https://example.test/vitrina-uzkaya', '2. Прилавок-касса × 1 — https://example.test/prilavok-kassa'].join('\n'),
    );
  });

  it('двойное нажатие «Отправить» даёт одну отправку', async () => {
    let release;
    const fetchImpl = vi.fn(() => new Promise((resolve) => { release = () => resolve({ ok: true, status: 200, json: async () => ({}) }); }));
    const { result } = setup({ fetchImpl });
    fillAll(result);
    let first;
    let second;
    await act(async () => {
      first = result.current.submit({ variant: 'ral' });
      second = result.current.submit({ variant: 'ral' });
      await Promise.resolve();
    });
    expect(result.current.status).toBe('submitting');
    await expect(second).resolves.toBeNull();
    release();
    await act(async () => {
      await first;
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('success');
  });

  it('сервис упал: ошибка на экране, ответы на месте, повтор доходит', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });
    const { result } = setup({ fetchImpl });
    fillAll(result);
    await act(async () => {
      await result.current.submit({ variant: 'ral' });
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/[а-я]/i);
    expect(result.current.values).toMatchObject({ name: 'Анна', phone: '+7 (912) 345-67-89', direction: 'retail' });
    await act(async () => {
      await result.current.submit({ variant: 'ral' });
    });
    expect(result.current.status).toBe('success');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('с ошибкой в контактах отправка не стартует, ошибки показываются у полей', async () => {
    const fetchImpl = okFetch();
    const { result } = setup({ fetchImpl });
    fillAll(result);
    act(() => result.current.set('consent', false));
    let outcome;
    await act(async () => {
      outcome = await result.current.submit({ variant: 'ral' });
    });
    expect(outcome).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.errors.consent).toMatch(/согласи/i);
    expect(result.current.values.name).toBe('Анна');
  });

  it('reset очищает квиз', async () => {
    const { result } = setup({ endpoint: '' });
    fillAll(result);
    await act(async () => {
      await result.current.submit({ variant: 'ral' });
    });
    act(() => result.current.reset());
    expect(result.current).toMatchObject({ step: 0, status: 'idle' });
    expect(result.current.values.name).toBe('');
  });
});
