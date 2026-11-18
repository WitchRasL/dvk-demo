// Пустое состояние: что не найдено, что делать дальше. Действия — кнопки или ссылки.
import { cn } from '../../../lib/utils.js';

/** @param {{ title: string, children?: import('react').ReactNode, actions?: import('react').ReactNode, as?: string, className?: string }} props */
export function EmptyState({ title, children, actions, as: Tag = 'h2', className }) {
  return (
    <div className={cn('max-w-2xl border-y border-line py-10 md:py-14', className)}>
      <Tag className="font-display text-2xl leading-tight text-balance md:text-3xl">{title}</Tag>
      {children ? <div className="mt-3 flex max-w-[60ch] flex-col gap-2 text-base text-pretty text-fg-muted">{children}</div> : null}
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
