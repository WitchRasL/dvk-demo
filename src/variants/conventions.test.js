// Общие правила для трёх вариантов, проверяемые по исходникам: что анимируется, как выключается движение
// и что общая логика берётся из ядра, а не копируется (находки ревью ветки, F1).
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VARIANT_IDS } from '../core/variants/registry.js';

const ROOT = resolve(process.cwd(), 'src/variants');
const read = (name) => readFileSync(join(ROOT, name), 'utf8');
const files = readdirSync(ROOT, { recursive: true })
  .map((name) => String(name).replaceAll('\\', '/'))
  .filter((name) => /\.(css|jsx?)$/.test(name) && !/\.test\./.test(name));
const cssFiles = files.filter((name) => name.endsWith('.css'));
const codeFiles = files.filter((name) => !name.endsWith('.css'));
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const ALLOWED = new Set(['transform', 'opacity', 'clip-path', 'none', 'inherit', 'initial', 'unset']);

/** Делит значение по запятым верхнего уровня: запятые внутри cubic-bezier() и var() не считаются. */
function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** Блоки `@media (… prefers-reduced-motion: reduce …) { … }` целиком. */
function reducedMotionBlocks(css) {
  const blocks = [];
  const pattern = /@media[^{]*prefers-reduced-motion:\s*reduce[^{]*\{/g;
  let match;
  while ((match = pattern.exec(css))) {
    let depth = 1;
    let index = pattern.lastIndex;
    while (depth > 0 && index < css.length) {
      if (css[index] === '{') depth += 1;
      if (css[index] === '}') depth -= 1;
      index += 1;
    }
    blocks.push(css.slice(match.index, index));
  }
  return blocks;
}

describe('что анимируется в вариантах', () => {
  it('проверяются все три варианта', () => {
    for (const id of VARIANT_IDS) expect(cssFiles.some((name) => name.startsWith(`${id}/`)), id).toBe(true);
  });

  it('CSS: переходы только по transform, opacity и clip-path', () => {
    const offenders = [];
    for (const name of cssFiles) {
      const css = stripComments(read(name));
      for (const match of css.matchAll(/(?<![-\w])transition(-property)?\s*:\s*([^;}]+)/g)) {
        for (const part of splitTopLevel(match[2])) {
          const property = part.split(/\s+/)[0];
          if (!ALLOWED.has(property)) offenders.push(`${name}: transition ${part}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('разметка: нет классов Tailwind, которые анимируют цвет, тень или «всё»', () => {
    const offenders = codeFiles.filter((name) => /\btransition(-colors|-all|-shadow)?(?=[\s'"`])/.test(read(name).replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')));
    expect(offenders).toEqual([]);
  });
});

describe('prefers-reduced-motion: одно правило и один источник проверки', () => {
  it('движение выключает общее правило ядра: на всё внутри варианта, с остановкой повторов', () => {
    const rule = stripComments(readFileSync(resolve(process.cwd(), 'src/core/ui/reduced-motion.css'), 'utf8')).replace(/\s+/g, ' ');
    expect(rule).toContain('@media (prefers-reduced-motion: reduce)');
    expect(rule).toContain('[data-variant] *, [data-variant] *::before, [data-variant] *::after {');
    for (const declaration of ['animation-duration: 1ms !important', 'animation-iteration-count: 1 !important', 'transition-duration: 1ms !important']) {
      expect(rule).toContain(declaration);
    }
  });

  it.each(VARIANT_IDS)('вариант %s подключает общее правило', (id) => {
    expect(read(`${id}/index.jsx`)).toMatch(/import '\.\.\/\.\.\/core\/ui\/reduced-motion\.css';/);
  });

  it('в CSS вариантов нет своих списков отключения: под reduce не трогают transition и animation', () => {
    const offenders = [];
    for (const name of cssFiles) {
      for (const block of reducedMotionBlocks(stripComments(read(name)))) {
        for (const match of block.matchAll(/(?<![-\w])(transition|animation)(-[a-z-]+)?\s*:[^;}]+/g)) offenders.push(`${name}: ${match[0].trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('в коде вариантов медиазапросы читаются только хуками ядра', () => {
    const own = codeFiles.filter((name) => /matchMedia\s*\??\.?\(|useSyncExternalStore\([^)]*matchMedia/.test(read(name)));
    const fromMotion = codeFiles.filter((name) => /useReducedMotion/.test(read(name)));
    expect(own).toEqual([]);
    expect(fromMotion).toEqual([]);
  });
});

describe('общая логика — из ядра, без копий', () => {
  it('формы слов, итог позиций направления и маркер «[уточнить]» в вариантах не определяются заново', () => {
    const offenders = [];
    for (const name of codeFiles) {
      const code = read(name);
      if (/const [A-Z]+_FORMS\s*=/.test(code)) offenders.push(`${name}: свои формы слов`);
      if (/sections\s*\.reduce\(/.test(code)) offenders.push(`${name}: своя сумма позиций`);
      if (/=\s*'\[уточнить\]'|[?:]\s*'\[уточнить\]'/.test(code)) offenders.push(`${name}: свой маркер [уточнить]`);
    }
    expect(offenders).toEqual([]);
  });

  it('меню шапки и табы отраслей собраны на хуках ядра', () => {
    const uses = (hook) => codeFiles.filter((name) => read(name).includes(hook)).map((name) => name.split('/')[0]);
    expect([...new Set(uses('useHeaderMenu('))].sort()).toEqual([...VARIANT_IDS].sort());
    expect([...new Set(uses('useTabs('))].sort()).toEqual([...VARIANT_IDS].sort());
    expect([...new Set(uses('CoreCitySwitch'))].sort()).toEqual([...VARIANT_IDS].sort());
  });
});
