// Базовый набор UI: откат для useVariant().ui, пока вариант не дал своё.
// Только токены варианта (bg-bg, text-fg, font-display…) — перекрашивается сам.
import { Link } from 'react-router';
import { LoaderCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils.js';
import { imageSrc, srcSet } from '../../lib/images.js';
import { useVariant } from '../variants/VariantContext.jsx';
import { AddToKp } from './AddToKp.jsx';
import { Breadcrumbs } from './Breadcrumbs.jsx';
import { formatPrice } from './format.js';

const BUTTON_VARIANTS = {
  primary: 'bg-action text-action-fg hover:opacity-90',
  secondary: 'border border-line bg-transparent text-fg hover:bg-surface-2',
  ghost: 'text-fg underline-offset-4 hover:underline',
};

const BUTTON_SIZES = {
  md: 'min-h-11 px-5 py-2.5 text-sm',
  sm: 'min-h-10 px-3.5 py-2 text-sm',
};

/**
 * ({ variant: 'primary'|'secondary'|'ghost', size: 'md'|'sm', as, href, to, loading, disabled, children, ...rest })
 * `loading` — идёт действие: кнопка недоступна, внутри индикатор.
 */
export function Button({ variant = 'primary', size = 'md', as, href, to, loading = false, disabled = false, className, children, ...rest }) {
  const inactive = loading || disabled;
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-base font-medium',
    'transition-[transform,opacity] duration-fast ease-out active:scale-[0.98]',
    BUTTON_SIZES[size] ?? BUTTON_SIZES.md,
    BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary,
    inactive && 'pointer-events-none opacity-60',
    className,
  );
  const content = (
    <>
      {loading ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
      {children}
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

/** ({ as='h2', title, lead }) — заголовок секции, без надписи над ним */
export function SectionHeading({ as: Tag = 'h2', title, lead, className }) {
  return (
    <div className={cn('max-w-3xl', className)}>
      <Tag className="font-display text-2xl leading-tight text-balance md:text-3xl">{title}</Tag>
      {lead ? <p className="mt-3 max-w-[68ch] text-base text-pretty text-fg-muted md:text-lg">{lead}</p> : null}
    </div>
  );
}

/** ({ title, lead, breadcrumbs: [{ label, to }], children }) — шапка внутренней страницы; children — под текстом (действия) */
export function PageHeader({ title, lead, breadcrumbs = [], children, className }) {
  return (
    <header className={cn('border-b border-line pb-8 md:pb-10', className)}>
      <Breadcrumbs items={breadcrumbs} className="mb-5 md:mb-6" />
      <h1 className="max-w-4xl font-display text-3xl leading-[1.1] text-balance sm:text-4xl md:text-5xl">{title}</h1>
      {lead ? <p className="mt-4 max-w-[68ch] text-base text-pretty text-fg-muted md:text-lg">{lead}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}

/** ({ product, onQuickView }) — карточка товара: фото на подиуме, название, цена, «В запрос КП» */
export function ProductCard({ product, onQuickView, className }) {
  const { id: variantId } = useVariant();
  const image = product.images?.[0];
  const to = `/${variantId}/product/${product.slug}`;
  return (
    <article className={cn('group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface', className)}>
      <Link to={to} tabIndex={-1} aria-hidden="true" className="block aspect-[4/3] overflow-hidden bg-[color:var(--stage)]">
        {image ? (
          <img
            src={imageSrc(image.base)}
            srcSet={srcSet(image.base)}
            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 85vw"
            width={image.w}
            height={image.h}
            alt={image.alt || product.name}
            loading="lazy"
            decoding="async"
            className="size-full object-contain p-3 transition-transform duration-slow ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-sm text-[color:var(--stage-fg,#555)]">Фото [уточнить]</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-lg leading-snug text-balance">
            <Link to={to} className="underline-offset-4 hover:underline">
              {product.name}
            </Link>
          </h3>
          <p className={cn('tabular mt-1.5 text-sm', typeof product.price === 'number' ? 'font-medium text-fg' : 'text-fg-muted')}>{formatPrice(product)}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <AddToKp product={product} mode="card" />
          {onQuickView ? (
            <Button variant="ghost" size="sm" onClick={() => onQuickView(product)}>
              Быстрый просмотр
              <span className="sr-only">: {product.name}</span>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

const LIST_LAYOUTS = {
  // ряд карточек: на телефоне — горизонтальный scroll-snap, дальше — сетка
  rail: cn(
    'rail relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 scroll-pl-4',
    'sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4',
  ),
  // длинный список (каталог): на телефоне — вертикально, дальше — сетка
  grid: 'grid grid-cols-1 gap-4 min-[34rem]:grid-cols-2 xl:grid-cols-3',
};

/** ({ products, onQuickView, layout: 'rail'|'grid' }) — список карточек */
export function ProductList({ products = [], onQuickView, layout = 'rail', className }) {
  const { ui } = useVariant();
  const Card = ui.ProductCard ?? ProductCard;
  return (
    <ul className={cn(LIST_LAYOUTS[layout] ?? LIST_LAYOUTS.rail, className)}>
      {products.map((product) => (
        <li key={product.id} className={cn('min-w-0', layout === 'rail' && 'w-[80%] shrink-0 snap-start sm:w-auto')}>
          <Card product={product} onQuickView={onQuickView} />
        </li>
      ))}
    </ul>
  );
}

/** ({ children, as='div', delay=0 }) — появление по скроллу; reduced-motion — без движения */
export function Reveal({ children, as = 'div', delay = 0, className }) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  const MotionTag = motion[as] ?? motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
