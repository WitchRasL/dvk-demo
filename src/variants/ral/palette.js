// Поля «Палитры RAL»: у каждого направления — свой RAL целым полем, плюс грунт (до выбора направления),
// бумага веера и антрацит для плотных экранов. Цвета экрана — приближения каталожных RAL; код подписан на каждом поле.
// Контраст текста на каждом поле и его поверхностях ≥ 4.5:1 — проверяет palette.test.js.

/** @typedef {{ id: string, code: string, name: string, label: string, bg: string, fg: string, muted: string, surface: string, surface2: string, scheme: 'light'|'dark', stage: string }} Field */

/** @type {Record<string, Field>} */
export const FIELDS = {
  // Грунт: сайт ещё не «окрашен» — посетитель выбирает направление веером.
  primer: {
    id: 'primer',
    code: 'RAL 1015',
    name: 'Светлая слоновая кость',
    label: 'Грунт · выберите направление',
    bg: '#E6D2B5',
    fg: '#293133',
    muted: '#4D4A42',
    surface: '#F2E7D6',
    surface2: '#D9C3A2',
    scheme: 'light',
    stage: '#F4ECDF',
  },
  retail: {
    id: 'retail',
    code: 'RAL 9005',
    name: 'Глубокий чёрный',
    label: 'Ритейл и экспозиция',
    bg: '#0E0E10',
    fg: '#F1EBDD',
    muted: '#BDB4A2',
    surface: '#1C1C1F',
    surface2: '#2A2A2D',
    scheme: 'dark',
    stage: '#F1E9D8',
  },
  landscape: {
    id: 'landscape',
    code: 'RAL 6018',
    name: 'Жёлто-зелёный',
    label: 'Благоустройство',
    bg: '#57A639',
    fg: '#0B1A07',
    muted: '#142B0C',
    surface: '#D7EBC8',
    surface2: '#86C06A',
    scheme: 'light',
    stage: '#EAF3E1',
  },
  metal: {
    id: 'metal',
    code: 'RAL 7035',
    name: 'Светло-серый',
    label: 'Металлическая мебель',
    bg: '#CBD0CC',
    fg: '#293133',
    muted: '#454D50',
    surface: '#E2E5E2',
    surface2: '#B8BEBA',
    scheme: 'light',
    stage: '#ECEEEB',
  },
  // Бумага веера: этикетки образцов, спокойные экраны.
  paper: {
    id: 'paper',
    code: 'RAL 9016',
    name: 'Транспортный белый',
    label: 'Бумага веера',
    bg: '#F1F0EA',
    fg: '#293133',
    muted: '#545B5D',
    surface: '#FFFFFF',
    surface2: '#E3E2DA',
    scheme: 'light',
    stage: '#FFFFFF',
  },
  // Антрацит — цвет порошковой краски каркасов: плотные экраны, футер.
  anthracite: {
    id: 'anthracite',
    code: 'RAL 7016',
    name: 'Антрацитово-серый',
    label: 'Производство',
    bg: '#293133',
    fg: '#F1F0EA',
    muted: '#B9C0BF',
    surface: '#333C3E',
    surface2: '#3E484A',
    scheme: 'dark',
    stage: '#F1F0EA',
  },
};

/** Направления каталога в порядке данных; у каждого — своё поле. */
export const DIRECTION_FIELDS = ['retail', 'landscape', 'metal'];

/** Поле до выбора направления. */
export const DEFAULT_FIELD = 'primer';

/** Сигнальный оранжевый: только «Заявка на подбор» и отправка квиза. */
export const SIGNAL = Object.freeze({
  code: 'RAL 2004',
  name: 'Чистый оранжевый',
  bg: '#F44611',
  fg: '#140B06',
});

/** @param {string|null|undefined} direction @returns {Field} поле направления, иначе грунт */
export function fieldFor(direction) {
  return DIRECTION_FIELDS.includes(direction) ? FIELDS[direction] : FIELDS[DEFAULT_FIELD];
}
