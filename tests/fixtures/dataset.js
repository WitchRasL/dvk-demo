// Фикстура данных каталога: в тестах подменяет src/core/catalog/data.js (vi.mock), реальные JSON не читаются.
// Товаров 44: 14 вручную (три направления, материалы, подсветка, ё и е в названиях) и 30 «горок» для пагинации.
import categories from './categories.json';
import company from './company.json';
import products from './products.json';
import projects from './projects.json';

export { categories, company, products, projects };
