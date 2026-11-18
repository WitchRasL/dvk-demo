// Нумерация страниц каталога. Каждая страница — ссылка с page в URL.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../../lib/utils.js';

/** Номера страниц с пропусками: 1 … 4 5 [6] 7 8 … 20 (пропуск — 'gap'). */
export function pageWindow(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  const numbers = [...wanted].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
  const out = [];
  numbers.forEach((value, index) => {
    if (index > 0 && value - numbers[index - 1] > 1) out.push('gap');
    out.push(value);
  });
  return out;
}

/** @param {{ page: number, pages: number, hrefFor: (page: number) => string, className?: string }} props */
export function Pagination({ page, pages, hrefFor, className }) {
  if (pages <= 1) return null;
  const base = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-base px-3 text-sm transition-[opacity] duration-fast ease-out';
  return (
    <nav aria-label="Страницы каталога" className={className}>
      <ul className="flex flex-wrap items-center gap-1.5">
        {page > 1 ? (
          <li>
            <Link to={hrefFor(page - 1)} rel="prev" className={cn(base, 'border border-line text-fg hover:bg-surface-2')} aria-label="Предыдущая страница">
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Link>
          </li>
        ) : null}
        {pageWindow(page, pages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-fg-muted">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                to={hrefFor(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Страница ${item}`}
                className={cn(base, 'tabular', item === page ? 'bg-action text-action-fg' : 'border border-line text-fg hover:bg-surface-2')}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        {page < pages ? (
          <li>
            <Link to={hrefFor(page + 1)} rel="next" className={cn(base, 'border border-line text-fg hover:bg-surface-2')} aria-label="Следующая страница">
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
