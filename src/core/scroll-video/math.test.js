import { describe, expect, it } from 'vitest';
import { calloutState, phaseAt, progressToTime } from './math.js';

describe('progressToTime', () => {
  it('прогресс 0..1 → секунды ролика', () => {
    expect(progressToTime(0, 10)).toBe(0);
    expect(progressToTime(0.5, 10)).toBe(5);
    expect(progressToTime(0.25, 8)).toBe(2);
  });

  it('в самом конце не доходит до последнего кадра вплотную (на «duration» браузеры показывают чёрный кадр)', () => {
    const end = progressToTime(1, 10);
    expect(end).toBeLessThan(10);
    expect(end).toBeGreaterThan(9.9);
  });

  it('прогресс вне 0..1 и нечисловой прижимается', () => {
    expect(progressToTime(-1, 10)).toBe(0);
    expect(progressToTime(Number.NaN, 10)).toBe(0);
    expect(progressToTime(2, 10)).toBe(progressToTime(1, 10));
  });

  it('длительность неизвестна (метаданные не пришли) или бессмысленна — 0', () => {
    for (const duration of [Number.NaN, 0, -3, Infinity, undefined, null]) {
      expect(progressToTime(0.5, duration)).toBe(0);
    }
  });

  it('у очень короткого ролика время не уходит в минус', () => {
    expect(progressToTime(1, 0.03)).toBeGreaterThanOrEqual(0);
  });
});

describe('calloutState', () => {
  const callout = { id: 'a', from: 0.2, to: 0.4 };

  it('до отрезка — не активно, local 0', () => {
    expect(calloutState(0.1, callout)).toEqual({ active: false, local: 0 });
  });

  it('на своём отрезке активно; local — доля пути внутри отрезка', () => {
    expect(calloutState(0.2, callout)).toEqual({ active: true, local: 0 });
    const middle = calloutState(0.3, callout);
    expect(middle.active).toBe(true);
    expect(middle.local).toBeCloseTo(0.5, 10);
  });

  it('конец отрезка исключён: два соседних пояснения не горят вместе', () => {
    expect(calloutState(0.4, callout)).toEqual({ active: false, local: 1 });
    expect(calloutState(0.4, { from: 0.4, to: 0.6 }).active).toBe(true);
  });

  it('после отрезка — не активно, local 1', () => {
    expect(calloutState(0.9, callout)).toEqual({ active: false, local: 1 });
  });

  it('пояснение до самого конца остаётся активным и на прогрессе 1', () => {
    expect(calloutState(1, { from: 0.8, to: 1 })).toEqual({ active: true, local: 1 });
  });

  it('прогресс вне 0..1 и нечисловой прижимается; вырожденный отрезок не активен', () => {
    expect(calloutState(-5, callout)).toEqual({ active: false, local: 0 });
    expect(calloutState(Number.NaN, callout)).toEqual({ active: false, local: 0 });
    expect(calloutState(0.5, { from: 0.5, to: 0.5 }).active).toBe(false);
    expect(calloutState(0.5, { from: 0.6, to: 0.4 }).active).toBe(false);
  });
});

describe('phaseAt', () => {
  const phases = [
    { id: 'design', label: 'ПРОЕКТИРОВАНИЕ', from: 0, to: 0.33 },
    { id: 'production', label: 'ПРОИЗВОДСТВО', from: 0.33, to: 0.66 },
    { id: 'install', label: 'МОНТАЖ', from: 0.66, to: 1 },
  ];

  it('возвращает фазу, в которую попал прогресс', () => {
    expect(phaseAt(0, phases)).toBe(phases[0]);
    expect(phaseAt(0.32, phases)).toBe(phases[0]);
    expect(phaseAt(0.5, phases)).toBe(phases[1]);
    expect(phaseAt(0.9, phases)).toBe(phases[2]);
  });

  it('начало фазы включено, конец исключён; последняя фаза включает 1', () => {
    expect(phaseAt(0.33, phases)).toBe(phases[1]);
    expect(phaseAt(0.66, phases)).toBe(phases[2]);
    expect(phaseAt(1, phases)).toBe(phases[2]);
  });

  it('в промежутке между фазами и без фаз — null', () => {
    const gapped = [
      { id: 'a', from: 0, to: 0.2 },
      { id: 'b', from: 0.5, to: 1 },
    ];
    expect(phaseAt(0.3, gapped)).toBeNull();
    expect(phaseAt(0.5, [])).toBeNull();
    expect(phaseAt(0.5, undefined)).toBeNull();
  });

  it('нечисловой прогресс считается нулём', () => {
    expect(phaseAt(Number.NaN, phases)).toBe(phases[0]);
  });
});
