// Листы главной «Чертежа»: порядок, номер в штампе и название раздела.
export const SHEETS = [
  { id: 'hero', title: 'Общий вид' },
  { id: 'directions', title: 'Спецификация направлений' },
  { id: 'cycle', title: 'Полный цикл' },
  { id: 'industries', title: 'Решения по отраслям' },
  { id: 'showcase', title: 'Позиции каталога' },
  { id: 'projects', title: 'Проекты' },
  { id: 'clients', title: 'Клиенты и письма' },
  { id: 'request', title: 'Техническое задание' },
];

export const sheetNumber = (id) => SHEETS.findIndex((sheet) => sheet.id === id) + 1;
export const sheetAnchor = (id) => `sheet-${id}`;
