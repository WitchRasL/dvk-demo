// Кнопка «Чертежа»: прямоугольник основной линией (2 px), без скруглений.
// Наведение: слой туши (primary) или штриховка (secondary) «вычерчивается» слева направо через clip-path;
// ghost — линия подчёркивания вытягивается (transform). Цвет-маркер — только у главного действия.
import { Link } from 'react-router';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../../lib/utils.js';

/**
 * ({ variant: 'primary'|'secondary'|'ghost', size: 'md'|'sm', as, href, to, loading, disabled, children, ...rest })
 */
export function Button({ variant = 'primary', size = 'md', as, href, to, loading = false, disabled = false, className, children, ...rest }) {
  const inactive = loading || disabled;
  const classes = cn('bp-btn', `bp-btn--${variant}`, `bp-btn--${size}`, inactive && 'is-inactive', className);
  const content = (
    <>
      {loading ? <LoaderCircle className="bp-btn__spin size-4" aria-hidden="true" /> : null}
      <span className="bp-btn__label">{children}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={inactive || undefined} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} aria-disabled={inactive || undefined} {...rest}>
        {content}
      </a>
    );
  }
  const Tag = as ?? 'button';
  return (
    <Tag
      className={classes}
      {...(Tag === 'button' ? { type: 'button', disabled: inactive } : { 'aria-disabled': inactive || undefined })}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </Tag>
  );
}
