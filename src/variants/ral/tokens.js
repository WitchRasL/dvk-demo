// CSS-токены «Палитры RAL» собираются из palette.js — одна правда о цветах для CSS и для теста контраста.
// Поле сайта задаёт шапка: <header class="ral-header" data-field="…">, корень варианта читает его через :has().
// Любой элемент с data-field-scope="…" (образец, колонка меню, плашка проекта) — своё поле внутри страницы.
import { getProjects } from '../../core/catalog/index.js';
import { DIRECTION_FIELDS, FIELDS, SIGNAL } from './palette.js';

const DANGER = {
  primer: '#8E1B12',
  retail: '#FF8F7E',
  landscape: '#4A0A06',
  metal: '#8E1B12',
  paper: '#8E1B12',
  anthracite: '#FFA394',
};

/** Переменные одного поля: токены ядра (--bg, --fg, …) + свои (--stage, --field-code). */
export function fieldVars(field) {
  return [
    `--bg:${field.bg}`,
    `--fg:${field.fg}`,
    `--fg-muted:${field.muted}`,
    `--surface:${field.surface}`,
    `--surface-2:${field.surface2}`,
    `--line:color-mix(in oklab, ${field.fg} 24%, transparent)`,
    `--line-strong:color-mix(in oklab, ${field.fg} 46%, transparent)`,
    `--accent:${field.fg}`,
    `--accent-fg:${field.bg}`,
    // --action ядра (текущая страница нумерации, обводка «В запросе», выделение) — «чернила» поля, не оранжевый.
    `--action:${field.fg}`,
    `--action-fg:${field.bg}`,
    `--focus:${field.fg}`,
    `--danger:${DANGER[field.id] ?? DANGER.paper}`,
    `--stage:${field.stage}`,
    `--field:${field.bg}`,
    `--field-ink:${field.fg}`,
    `--field-code:"${field.code}"`,
    `--field-name:"${field.name}"`,
  ].join(';');
}

const ROOT = '[data-variant="ral"]';

// Части страниц ядра, которые вариант красит своим полем: призыв к заявке — антрацит, окна и карточки — бумага веера.
const CORE_SCOPES = {
  anthracite: ['.request-cta'],
  paper: ['.quick-view', '.project-card', '.page-solution .rail > li > a', '.page-about .grid > li:has(> span > img)'],
};

function scopeSelectors(id) {
  const selectors = [
    `${ROOT}:has(> .ral-header[data-field="${id}"])`,
    `${ROOT} [data-field-scope="${id}"]`,
    ...(CORE_SCOPES[id] ?? []).map((selector) => `${ROOT} ${selector}`),
  ];
  if (DIRECTION_FIELDS.includes(id)) selectors.push(`${ROOT} .page[data-direction="${id}"]`);
  return selectors.join(',\n');
}

/** Плашки проектов в карточках ядра: цвет — по направлению проекта из данных. */
function projectPlates() {
  return getProjects()
    .filter((project) => DIRECTION_FIELDS.includes(project.direction))
    .map((project) => `${ROOT} .project-card:has(a[href$="/projects/${project.slug}"]) > div:last-child{${fieldVars(FIELDS[project.direction])}}`)
    .join('\n');
}

export function buildTokensCss() {
  const fields = Object.values(FIELDS);
  const base = `${ROOT}{${fieldVars(FIELDS.primer)};
  --signal:${SIGNAL.bg};--signal-fg:${SIGNAL.fg};--signal-lit:#FF6C35;
  --paper:${FIELDS.paper.bg};--paper-ink:${FIELDS.paper.fg};--paper-muted:${FIELDS.paper.muted};
  --font-display:'Unbounded', 'Onest', system-ui, sans-serif;
  --font-body:'Onest', system-ui, sans-serif;
  --font-mono:'JetBrains Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace;
  --radius:2px;--radius-lg:2px;
  --shadow:0 18px 40px -22px rgb(14 14 16 / 0.45), 0 2px 6px -2px rgb(14 14 16 / 0.18);
  --ease-out:cubic-bezier(0.16, 1, 0.3, 1);--ease-in-out:cubic-bezier(0.76, 0, 0.24, 1);
  --dur-fast:160ms;--dur-base:320ms;--dur-slow:640ms;
  color-scheme:light;}`;
  const scopes = fields.map((field) => `${scopeSelectors(field.id)}{${fieldVars(field)};color-scheme:${field.scheme}}`).join('\n');
  // Фон и схема всей страницы (overscroll, полоса прокрутки) — в цвет текущего поля.
  const page = [
    `:root:has(${ROOT}){background:${FIELDS.primer.bg};color-scheme:light;scrollbar-color:${FIELDS.primer.fg} ${FIELDS.primer.bg}}`,
    ...fields.map((field) => `:root:has(${ROOT} > .ral-header[data-field="${field.id}"]){background:${field.bg};color-scheme:${field.scheme};scrollbar-color:${field.fg} ${field.bg}}`),
  ].join('\n');
  return [base, scopes, page, projectPlates()].join('\n');
}

export const TOKENS_CSS = buildTokensCss();
