// Хлебные крошки: последняя — текущая страница. Используется в PageHeader и отдельно.
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../lib/utils.js';

/** @param {{ items: { label: string, to?: string }[], className?: string }} props */
export function Breadcrumbs({ items = [], className }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Хлебные крошки" className={cn('text-sm text-fg-muted', className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {items.map((crumb, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" /> : null}
              {crumb.to && !current ? (
                <Link to={crumb.to} className="rounded-base py-1 underline-offset-4 hover:text-fg hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={current ? 'page' : undefined} className={cn('py-1', current && 'max-w-[30ch] truncate text-fg sm:max-w-[48ch]')}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
