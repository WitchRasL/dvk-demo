// Компоненты страниц ядра, которые варианты переиспользуют в своих главных и перекрытиях.
// Quiz и KpList живут рядом с логикой заявки: src/core/request/Quiz.jsx, KpList.jsx.
export { Breadcrumbs } from '../../ui/Breadcrumbs.jsx';
export { EmptyState } from './EmptyState.jsx';
export { Filters, CatalogSearch, countActiveFilters } from './Filters.jsx';
export { Gallery } from './Gallery.jsx';
export { HowWeWork } from './HowWeWork.jsx';
export { Pagination, pageWindow } from './Pagination.jsx';
export { QuickView, useQuickView } from './QuickView.jsx';
export { RequestCta } from './RequestCta.jsx';
export { SpecTable, buildSpecRows } from './SpecTable.jsx';
export { usePageTitle } from './usePageTitle.js';
