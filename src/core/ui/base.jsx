// Базовый набор UI: откат для useVariant().ui, пока вариант не дал своё.
// Только токены варианта (bg-bg, text-fg, font-display…) — перекрашивается сам.
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils.js';
import { imageSrc, srcSet } from '../../lib/images.js';
import { useVariant } from '../variants/VariantContext.jsx';

const BUTTON_VARIANTS = {
  primary: 'bg-action text-action-fg hover:opacity-90',
  secondary: 'border border-line text-fg hover:bg-surface-2',
  ghost: 'text-fg underline-offset-4 hover:underline',
};

/** ({ variant: 'primary'|'secondary'|'ghost', as, href, to, children, ...rest }) */
export function Button({ variant = 'primary', as, href, to, className, children, ...rest }) {
  const classes = cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-base px-5 py-2.5 text-sm font-medium',
    'transition-[transform,opacity] duration-fast ease-out active:scale-[0.98]',
    BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary,
    className,
  );
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  const Tag = as ?? 'button';
  return (
    <Tag className={classes} {...(Tag === 'button' ? { type: 'button' } : {})} {...rest}>
      {children}
    </Tag>
  );
}

/** ({ as='h2', title, lead }) — заголовок секции, без надписи над ним */
export function SectionHeading({ as: Tag = 'h2', title, lead, className }) {
  return (
    <div className={cn('max-w-3xl', className)}>
      <Tag className="font-display text-3xl leading-tight text-balance md:text-4xl">{title}</Tag>
      {lead ? <p className="mt-3 text-base text-pretty text-fg-muted md:text-lg">{lead}</p> : null}
    </div>
  );
}

/** ({ title, lead, breadcrumbs: [{ label, to }] }) — шапка внутренней страницы */
export function PageHeader({ title, lead, breadcrumbs = [], className }) {
  return (
    <header className={cn('border-b border-line pb-8', className)}>
      {breadcrumbs.length > 0 ? (
        <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-fg-muted">
          <ol className="flex flex-wrap gap-x-2 gap-y-1">
            {breadcrumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {crumb.to && index < breadcrumbs.length - 1 ? (
                  <Link to={crumb.to} className="hover:text-fg">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <h1 className="font-display text-4xl leading-tight text-balance md:text-5xl">{title}</h1>
      {lead ? <p className="mt-4 max-w-2xl text-lg text-pretty text-fg-muted">{lead}</p> : null}
    </header>
  );
}

function formatPrice(product) {
  if (typeof product.price === 'number') return `${product.price.toLocaleString('ru-RU')} ₽`;
  return product.priceNote ?? 'по запросу';
}

/** ({ product, onQuickView }) — карточка товара (кнопку «В запрос КП» подключает таск страниц через useKp) */
export function ProductCard({ product, onQuickView, className }) {
  const { id: variantId } = useVariant();
  const image = product.images?.[0];
  return (
    <article className={cn('flex h-full flex-col rounded-lg border border-line bg-surface p-4', className)}>
      <div className="aspect-[4/3] overflow-hidden rounded-base bg-surface-2">
        {image ? (
          <img
            src={imageSrc(image.base)}
            srcSet={srcSet(image.base)}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw"
            width={image.w}
            height={image.h}
            alt={image.alt || product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : null}
      </div>
      <h3 className="mt-4 font-display text-lg leading-snug">
        <Link to={`/${variantId}/product/${product.slug}`} className="hover:underline">
          {product.name}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-fg-muted">{formatPrice(product)}</p>
      {onQuickView ? (
        <div className="mt-auto pt-4">
          <Button variant="secondary" onClick={() => onQuickView(product)}>
            Быстрый просмотр
          </Button>
        </div>
      ) : null}
    </article>
  );
}

/** ({ products, onQuickView }) — сетка карточек; на мобильном — горизонтальный scroll-snap */
export function ProductList({ products = [], onQuickView, className }) {
  const { ui } = useVariant();
  const Card = ui.ProductCard ?? ProductCard;
  return (
    <ul
      className={cn(
        '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2',
        'sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4',
        className,
      )}
    >
      {products.map((product) => (
        <li key={product.id} className="w-[80%] shrink-0 snap-start sm:w-auto">
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
