// Палитра «Палитры RAL»: у каждого направления своё поле с кодом, контраст текста на каждом поле ≥ 4.5:1 (WCAG AA),
// сигнальный оранжевый — отдельный цвет, которым не красится ни одно поле.
import { describe, expect, it } from 'vitest';
import { DIRECTION_FIELDS, FIELDS, SIGNAL, fieldFor } from './palette.js';

// Формула WCAG 2.x — независимо от кода палитры.
function channel(value) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const value = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const AA = 4.5;

describe('палитра RAL', () => {
  it('три направления — три разных поля, каждое подписано кодом RAL', () => {
    expect(DIRECTION_FIELDS).toEqual(['retail', 'landscape', 'metal']);
    const codes = DIRECTION_FIELDS.map((id) => fieldFor(id).code);
    codes.forEach((code) => expect(code).toMatch(/^RAL \d{4}$/));
    expect(new Set(codes).size).toBe(3);
    expect(new Set(DIRECTION_FIELDS.map((id) => fieldFor(id).bg)).size).toBe(3);
  });

  it.each(Object.keys(FIELDS))('поле «%s»: основной и второстепенный текст ≥ 4.5:1 на поле и на его поверхностях', (id) => {
    const field = FIELDS[id];
    expect(field.code).toMatch(/^RAL \d{4}$/);
    expect(field.name.length).toBeGreaterThan(0);
    for (const ground of [field.bg, field.surface, field.surface2]) {
      expect(contrast(field.fg, ground), `${id}: fg на ${ground}`).toBeGreaterThanOrEqual(AA);
      expect(contrast(field.muted, ground), `${id}: muted на ${ground}`).toBeGreaterThanOrEqual(AA);
    }
    // Кнопка-«чернила»: текст цвета поля на заливке цветом текста.
    expect(contrast(field.bg, field.fg)).toBeGreaterThanOrEqual(AA);
  });

  it('сигнальный оранжевый (RAL 2004): надпись на кнопке ≥ 4.5:1, ни одно поле им не красится', () => {
    expect(SIGNAL.code).toBe('RAL 2004');
    expect(contrast(SIGNAL.fg, SIGNAL.bg)).toBeGreaterThanOrEqual(AA);
    for (const field of Object.values(FIELDS)) {
      expect(field.bg.toLowerCase()).not.toBe(SIGNAL.bg.toLowerCase());
      expect(field.surface.toLowerCase()).not.toBe(SIGNAL.bg.toLowerCase());
    }
  });

  it('неизвестное направление — поле по умолчанию, а не одно из направлений', () => {
    expect(fieldFor('zzz')).toBe(fieldFor(null));
    expect(DIRECTION_FIELDS.map((id) => fieldFor(id))).not.toContain(fieldFor(null));
  });
});
