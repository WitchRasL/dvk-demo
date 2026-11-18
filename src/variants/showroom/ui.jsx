// UI «Шоурума»: золотая кнопка заявки, карточка-«витрина» на каменном подиуме, заголовки со словом-акцентом,
// шапка внутренней страницы с крошками «через слэш» и появление «свет включается».
import { Fragment, useRef } from 'react';
import { Link } from 'react-router';
import { LoaderCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils.js';
import { imageSrc, srcSet } from '../../lib/images.js';
import { AddToKp } from '../../core/ui/AddToKp.jsx';
import { formatPrice } from '../../core/ui/format.js';
import { useVariant } from '../../core/variants/VariantContext.jsx';
import { useFinePointer, usePrefersReducedMotion } from '../../core/hooks/media.js';
import { useMagnetic } from './light.js';
import { displayName, photoKind } from './media-kind.js';

const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost'];

/**
 * ({ variant: 'primary'|'secondary'|'ghost', size: 'md'|'sm', as, href, to, loading, disabled, magnetic, children, ...rest })
 * primary — градиентная золотая (заявка); secondary — латунная линия; ghost — текст с латунным подчёркиванием.
 * magnetic — кнопка тянется к курсору (только мышь, без reduced-motion).
 */
export function Button({ variant = 'primary', size = 'md', as, href, to, loading = false, disabled = false, magnetic = false, className, children, ...rest }) {
  const inactive = loading || disabled;
  const classes = cn(
    'sr-btn',
    `sr-btn--${BUTTON_VARIANTS.includes(variant) ? variant : 'primary'}`,
    size === 'sm' ? 'sr-btn--sm' : 'sr-btn--md',
    inactive && 'is-inactive',
    className,
  );
  const content = (
    <>
      {loading ? <LoaderCircle className="sr-btn__spin size-4" aria-hidden="true" /> : null}
      {children}
    </>
  );

  let element;
  if (to) {
    element = (
      <Link to={to} className={classes} aria-disabled={inactive || undefined} {...rest}>
        {content}
      </Link>
    );
  } else if (href) {
    element = (
      <a href={href} className={classes} aria-disabled={inactive || undefined} {...rest}>
        {content}
      </a>
    );
  } else {
    const Tag = as ?? 'button';
    element = (
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
  return magnetic ? <Magnet>{element}</Magnet> : element;
}

function Magnet({ children }) {
  const ref = useRef(null);
  const fine = useFinePointer();
  const reduce = usePrefersReducedMotion();
  useMagnetic(ref, { enabled: fine && !reduce });
  return (
    <span ref={ref} className="sr-magnet">
      {children}
    </span>
  );
}

/** ({ as='h2', title, lead, id }) — заголовок секции. title может содержать одно слово-акцент в <em> (PT Serif Italic). */
export function SectionHeading({ as: Tag = 'h2', title, lead, id, className }) {
  return (
    <div className={cn('sr-heading', className)}>
      <Tag id={id} className="sr-heading__title">
        {title}
      </Tag>
      {lead ? <p className="sr-heading__lead">{lead}</p> : null}
    </div>
  );
}

/** Крошки в языке референса: мелкий капс через слэш. Последняя — текущая страница. */
export function Crumbs({ items = [], className }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Хлебные крошки" className={cn('sr-crumbs', className)}>
      <ol>
        {items.map((crumb, index) => {
          const current = index === items.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? (
                <li className="sr-crumbs__slash" aria-hidden="true">
                  /
                </li>
              ) : null}
              <li className="sr-crumbs__item">
                {crumb.to && !current ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span aria-current={current ? 'page' : undefined}>{crumb.label}</span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/** ({ title, lead, breadcrumbs, children }) — шапка внутренней страницы: свет над заголовком зажигается при входе. */
export function PageHeader({ title, lead, breadcrumbs = [], children, className }) {
  return (
    <header className={cn('sr-page-header', className)}>
      <span className="sr-page-header__light" aria-hidden="true" />
      <Crumbs items={breadcrumbs} className="sr-page-header__crumbs" />
      <h1 className="sr-page-header__title">{title}</h1>
      {lead ? <p className="sr-page-header__lead">{lead}</p> : null}
      {children ? <div className="sr-page-header__actions">{children}</div> : null}
    </header>
  );
}

/**
 * ({ product, onQuickView }) — карточка-«витрина»: фото с белого фона стоит в светлой каменной нише
 * (белое растворяется в камне), мягкая тень у подножия, тёплый блик сверху; ниже — название, цена, «В запрос КП».
 */
export function ProductCard({ product, onQuickView, className }) {
  const { id: variantId, ui } = useVariant();
  const image = product.images?.[0];
  const to = `/${variantId}/product/${product.slug}`;
  const priced = typeof product.price === 'number';
  const name = displayName(product.name);
  return (
    <article className={cn('sr-card', className)}>
      {/* photo — съёмка в интерьере: кадр во всю рамку; product — предмет на белом: каменная ниша с подиумом */}
      <Link to={to} tabIndex={-1} aria-hidden="true" className="sr-card__niche" data-kind={image ? photoKind(product) : 'product'}>
        <span className="sr-card__lamp" />
        {image ? (
          <img
            src={imageSrc(image.base)}
            srcSet={srcSet(image.base)}
            sizes="(min-width: 1280px) 26vw, (min-width: 640px) 45vw, 80vw"
            width={image.w}
            height={image.h}
            alt={displayName(image.alt) || name}
            loading="lazy"
            decoding="async"
            className="sr-card__photo"
          />
        ) : (
          <span className="sr-card__nophoto">Фото [уточнить]</span>
        )}
        <span className="sr-card__plinth" />
      </Link>
      <div className="sr-card__body">
        <h3 className="sr-card__name">
          <Link to={to}>{name}</Link>
        </h3>
        <p className={cn('sr-card__price tabular', !priced && 'is-request')}>{formatPrice(product)}</p>
        <div className="sr-card__actions">
          <AddToKp product={product} mode="card" />
          {onQuickView ? (
            <ui.Button variant="ghost" size="sm" onClick={() => onQuickView(product)}>
              Быстрый просмотр
              <span className="sr-only">: {name}</span>
            </ui.Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** ({ children, as, delay }) — «свет включается»: блок из полутени становится ярким. Видим с первого кадра. */
export function Reveal({ children, as = 'div', delay = 0, className }) {
  const reduce = usePrefersReducedMotion();
  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  const MotionTag = motion[as] ?? motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0.3, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}
