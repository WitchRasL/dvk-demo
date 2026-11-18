// Единственное место, где ядро читает данные сайта. В тестах подменяется фикстурой (vi.mock).
import categories from '../../data/categories.json';
import company from '../../data/company.json';
import products from '../../data/products.json';
import projects from '../../data/projects.json';

export { categories, company, products, projects };
