// UI «Палитры RAL»: кнопки-«клавиши», заголовки, шапка страницы с кодом поля, карточка-образец с единой этикеткой,
// раскладка образцов плиткой (целыми модулями, со швом), появление «шторкой» по модулям.
import { Children, isValidElement, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { Eye, LoaderCircle } from 'lucide-react';
import { getProduct } from '../../core/catalog/index.js';
import { AddToKp } from '../../core/ui/AddToKp.jsx';
import { Breadcrumbs } from '../../core/ui/Breadcrumbs.jsx';
import { formatPrice } from '../../core/ui/format.js';
import { useVariant } from '../../core/variants/VariantContext.jsx';
import { imageSrc, srcSet } from '../../lib/images.js';
import { cn } from '../../lib/utils.js';
import { useCurrentDirection } from './field-store.js';
import { fieldFor } from './palette.js';
import { swatchLabel } from './label.js';
import { useEntrance } from './entrance.js';

// --- кнопка ------------------------------------------------------------------

function textOf(children) {
  let text = '';
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') text += child;
    else if (isValidElement(child)) text += textOf(child.props.children);
  });
  return text.trim();
}

const pathOf = (value) => String(value ?? '').replace(/^#/, '').split(/[?#]/)[0].replace(/\/+$/, '');

/** Заявка — переход на страницу заявки или отправка квиза. Только у неё сигнальный оранжевый. */
export function isRequestAction({ to, href, type, children, variantId }) {
  const target = pathOf(typeof to === 'string' ? to : to?.pathname ?? href);
  if (target && target === `/${variantId}/request`) return true;
  return type === 'submit' && /^Отправ/.test(textOf(children));
}

/**
 * ({ variant: 'primary'|'secondary'|'ghost', size: 'sm'|'md'|'lg', tone?: 'signal', as, href, to, loading, disabled, children, ...rest })
 * primary — «чернила» поля; secondary — контур; ghost — ссылка. Сигнальная клавиша — сама, у заявки.
 */
export function Button({ variant = 'primary', size = 'md', tone, as, href, to, loading = false, disabled = false, className, children, ...rest }) {
  const { id } = useVariant();
  const inactive = loading || disabled;
  const signal = tone === 'signal' || isRequestAction({ to, href, type: rest.type, children, variantId: id });
  const kind = signal ? 'signal' : variant;
  const classes = cn('ral-btn', `ral-btn--${kind}`, `ral-btn--${size}`, inactive && 'is-inactive', className);
  const content = (
    <>
      {loading ? <LoaderCircle className="ral-spin size-4" aria-hidden="true" /> : null}
      <span className="ral-btn__label">{children}</span>
    </>
  );
  const common = { className: classes, 'data-tone': signal ? 'signal' : undefined };
  if (to) {
    return (
      <Link to={to} {...common} aria-disabled={inactive || undefined} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} {...common} aria-disabled={inactive || undefined} {...rest}>
        {content}
      </a>
    );
  }
  const Tag = as ?? 'button';
  return (
    <Tag
      {...common}
      {...(Tag === 'button' ? { type: 'button', disabled: inactive } : { 'aria-disabled': inactive || undefined })}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </Tag>
  );
}

// --- код поля и модульная линейка ---------------------------------------------

/** Ярлык поля: квадрат цвета + код RAL + название. */
export function FieldCode({ direction, field: fieldId, withLabel = false, className }) {
  const field = fieldId ? fieldFor(fieldId === 'primer' ? null : fieldId) : fieldFor(direction);
  return (
    <span className={cn('ral-code', className)}>
      <span className="ral-code__chip" data-field-scope={field.id} aria-hidden="true" />
      <span className="ral-mono">{field.code}</span>
      <span className="ral-code__name">{withLabel ? field.label : field.name}</span>
    </span>
  );
}

/** Модульная сетка 600 мм: линия с делениями на 12 целых модулей. */
export function ModuleRule({ className }) {
  return (
    <div className={cn('ral-rule', className)} aria-hidden="true">
      {Array.from({ length: 13 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

// --- заголовки ----------------------------------------------------------------

/** ({ as='h2', title, lead }) — без надписи над заголовком */
export function SectionHeading({ as: Tag = 'h2', id, title, lead, className }) {
  return (
    <div className={cn('ral-heading', className)}>
      <Tag id={id} className="ral-heading__title">
        {title}
      </Tag>
      {lead ? <p className="ral-heading__lead">{lead}</p> : null}
    </div>
  );
}

/** Этикетка образца: одна сетка подписи для карточки и страницы товара. */
export function SwatchLabel({ product, className }) {
  const label = swatchLabel(product);
  return (
    <dl className={cn('ral-label', className)}>
      <div>
        <dt>{label.finishCaption}</dt>
        <dd className="ral-mono">{label.finish}</dd>
      </div>
      <div>
        <dt>Ш×В×Г, мм</dt>
        <dd className="ral-mono">{label.size}</dd>
      </div>
      <div>
        <dt>Арт.</dt>
        <dd className="ral-mono">{label.article}</dd>
      </div>
    </dl>
  );
}

function useRouteProduct() {
  const { pathname } = useLocation();
  const [, section, slug] = pathname.split('/').filter(Boolean);
  return section === 'product' && slug ? getProduct(slug) : null;
}

/** ({ title, lead, breadcrumbs, children }) — шапка внутренней страницы: код поля, заголовок, модульная линейка */
export function PageHeader({ title, lead, breadcrumbs = [], children, className }) {
  const direction = useCurrentDirection();
  const product = useRouteProduct();
  return (
    <header className={cn('ral-pagehead', className)}>
      <div className="ral-pagehead__top">
        <Breadcrumbs items={breadcrumbs} className="ral-crumbs" />
        <FieldCode direction={direction} withLabel className="ral-pagehead__code" />
      </div>
      <h1 className="ral-pagehead__title">{title}</h1>
      {lead ? <p className="ral-pagehead__lead">{lead}</p> : null}
      {product ? <SwatchLabel product={product} className="ral-pagehead__label" /> : null}
      {children ? <div className="ral-pagehead__actions">{children}</div> : null}
      <ModuleRule className="ral-pagehead__rule" />
    </header>
  );
}

// --- карточка-образец -----------------------------------------------------------

/** ({ product, onQuickView }) — образец: фото на подиуме цвета направления, этикетка, «В запрос КП» */
export function ProductCard({ product, onQuickView, className, priority = false }) {
  const { id: variantId } = useVariant();
  const image = product.images?.[0];
  const to = `/${variantId}/product/${product.slug}`;
  const field = fieldFor(product.direction);
  return (
    <article className={cn('ral-swatch', className)} data-field-scope="paper">
      <Link to={to} tabIndex={-1} aria-hidden="true" className="ral-swatch__stage" data-field-scope={field.id}>
        <span className="ral-swatch__light" />
        {image ? (
          <img
            src={imageSrc(image.base)}
            srcSet={srcSet(image.base)}
            sizes="(min-width: 1280px) 24vw, (min-width: 640px) 45vw, 80vw"
            width={image.w}
            height={image.h}
            alt={image.alt || product.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="ral-swatch__img"
          />
        ) : (
          <span className="ral-swatch__nophoto">Фото [уточнить]</span>
        )}
        <span className="ral-swatch__plinth">
          <span className="ral-mono">{field.code}</span>
          <span>{field.label}</span>
        </span>
      </Link>
      <div className="ral-swatch__body">
        <h3 className="ral-swatch__name">
          <Link to={to}>{product.name}</Link>
        </h3>
        <SwatchLabel product={product} />
        <div className="ral-swatch__foot">
          <p className={cn('ral-swatch__price tabular', typeof product.price !== 'number' && 'is-request')}>{formatPrice(product)}</p>
          <div className="ral-swatch__actions">
            <AddToKp product={product} mode="card" />
            {onQuickView ? (
              <button type="button" className="ral-iconbtn" onClick={() => onQuickView(product)}>
                <Eye className="size-4" aria-hidden="true" />
                <span className="sr-only">Быстрый просмотр: {product.name}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

/** ({ products, onQuickView, layout: 'rail'|'grid' }) — образцы плиткой: целые модули, тонкий шов между плитками */
export function ProductList({ products = [], onQuickView, layout = 'rail', className }) {
  return (
    <ul className={cn('ral-tiles', `ral-tiles--${layout}`, className)}>
      {products.map((product, index) => (
        <li key={product.id} style={{ '--i': Math.min(index, 8) }}>
          <ProductCard product={product} onQuickView={onQuickView} />
        </li>
      ))}
    </ul>
  );
}

// --- появление ------------------------------------------------------------------

/**
 * ({ children, as='div', delay=0 }) — шторка: блок открывается слева направо целыми модулями.
 * Видимое по умолчанию: прячется только то, что ниже экрана в момент появления; шаги квиза открываются сразу.
 * reduced-motion и окружения без IntersectionObserver — без движения.
 */
const inForm = (element) => Boolean(element.closest('form'));

export function Reveal({ children, as: Tag = 'div', delay = 0, className }) {
  const ref = useRef(null);
  const state = useEntrance(ref, { immediate: inForm });
  return (
    <Tag ref={ref} className={cn('ral-reveal', className)} data-reveal={state} style={delay ? { '--reveal-delay': `${delay}s` } : undefined}>
      {children}
    </Tag>
  );
}
