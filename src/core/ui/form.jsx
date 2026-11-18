// Поля форм на токенах варианта: подпись, подсказка, ошибка у поля, aria-связи.
import { useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/** Общий вид текстового поля, выбора и textarea. Ошибка — по aria-invalid. */
export const fieldClass = cn(
  'block w-full min-h-11 rounded-base border border-line bg-surface px-3.5 py-2.5 text-base text-fg',
  'transition-[opacity] duration-fast ease-out disabled:cursor-not-allowed disabled:opacity-50',
  'aria-[invalid=true]:border-[color:var(--danger)]',
);

/** Сообщение об ошибке у поля: иконка + текст, читается скринридером при появлении. */
export function FieldError({ id, children, className }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={cn('flex items-start gap-1.5 text-sm text-[color:var(--danger)]', className)}>
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Поле с подписью. `children` — функция: получает { id, 'aria-describedby', 'aria-invalid' } для своего контрола.
 * @param {{ label: string, hint?: string, error?: string, optional?: boolean, className?: string, children: (props: object) => import('react').ReactNode }} props
 */
export function Field({ label, hint, error, optional = false, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
        {optional ? <span className="font-normal text-fg-muted"> · необязательно</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-fg-muted">
          {hint}
        </p>
      ) : null}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
