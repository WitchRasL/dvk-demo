// Веер направлений — фишка варианта. Образец направления — ссылка в его каталог; клик заливает сайт цветом
// образца (clip-path от точки клика) и ведёт в направление. Слой заливки живёт в шапке, внутри корня варианта.
import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { buildCatalogUrl, getDirectionTotal, getDirections } from '../../core/catalog/index.js';
import { prefersReducedMotion } from '../../core/hooks/media.js';
import { countText } from '../../core/ui/format.js';
import { useVariant } from '../../core/variants/VariantContext.jsx';
import { cn } from '../../lib/utils.js';
import { cancelRepaint, chooseDirection, finishRepaint, useCurrentDirection, useRepaint, useRepaintLink } from './field-store.js';
import { fieldFor } from './palette.js';

/** Направления с полем, числом разделов и позиций на dvk-style.ru (из categories.json). */
export function useFanDirections() {
  const { id } = useVariant();
  return getDirections().map((direction) => {
    const total = getDirectionTotal(direction);
    return {
      ...direction,
      field: fieldFor(direction.id),
      to: buildCatalogUrl(id, { direction: direction.id }),
      total,
      totalText: countText(total, 'position'),
      sectionsText: countText(direction.sections.length, 'section'),
    };
  });
}

/** Ссылка-образец: обычная ссылка (новая вкладка работает), левый клик — перекраска и переход. */
export function FieldLink({ direction, to, className, children, ...rest }) {
  const navigate = useNavigate();
  const onClick = useRepaintLink(direction, to, navigate);
  return (
    <Link to={to} onClick={onClick} className={className} {...rest}>
      {children}
    </Link>
  );
}

/**
 * Образец направления: поле цвета, код, название, разделы и позиции. size: strip (hero) | chip (меню, футер).
 * Образец текущего поля сайта того же цвета, что и фон под ним, поэтому держит край швом и подписан «Текущее поле».
 */
export function DirectionSwatch({ direction, className, size = 'strip', ...rest }) {
  const current = useCurrentDirection() === direction.id;
  return (
    <FieldLink
      direction={direction.id}
      to={direction.to}
      className={cn('ral-dir', `ral-dir--${size}`, className)}
      data-field-scope={direction.field.id}
      aria-current={current ? 'true' : undefined}
      {...rest}
    >
      <span className="ral-dir__top">
        <span className="ral-mono ral-dir__code">{direction.field.code}</span>
        <ArrowUpRight className="ral-dir__arrow" aria-hidden="true" />
      </span>
      <span className="ral-dir__name">
        <span className="ral-dir__full">{direction.name}</span>
        {/* Короткое название — для узких лопастей в hero на телефоне; скринридер читает полное. */}
        <span className="ral-dir__short" aria-hidden="true">
          {direction.field.short}
        </span>
      </span>
      {current ? <span className="ral-dir__current">Текущее поле</span> : null}
      {size === 'strip' ? (
        <span className="ral-dir__meta">
          {direction.sectionsText} · {direction.totalText} на dvk-style.ru
        </span>
      ) : null}
    </FieldLink>
  );
}

/** Слой заливки: раскрывается кругом от точки клика, после перехода уходит вверх, открывая страницу того же цвета. */
export function RepaintLayer() {
  const repaint = useRepaint();
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const ref = useRef(null);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Слой размонтирован посреди заливки (переключили вариант) — запрос перекраски сбрасывается:
  // иначе при возврате в вариант заливка проиграется снова и уведёт на старый адрес.
  useEffect(() => () => cancelRepaint(), []);

  // Зависимость — только сам запрос перекраски: смена страницы посреди заливки не должна её обрывать.
  useEffect(() => {
    const element = ref.current;
    if (!repaint || !element) return undefined;
    let cancelled = false;
    const { id, direction, to, x, y } = repaint;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 8;
    const run = async () => {
      try {
        await element.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${radius}px at ${x}px ${y}px)` }], {
          duration: prefersReducedMotion() ? 1 : 720,
          easing: 'cubic-bezier(0.7, 0, 0.2, 1)',
          fill: 'forwards',
        }).finished;
        if (cancelled) return;
        chooseDirection(direction);
        navigateRef.current(to);
        await new Promise((resolve) => setTimeout(resolve, 220));
        if (cancelled) return;
        await element.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], {
          duration: 560,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'forwards',
        }).finished;
      } catch {
        chooseDirection(direction);
        navigateRef.current(to);
      }
      if (!cancelled) finishRepaint(id);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [repaint]);

  if (!repaint) return null;
  const field = fieldFor(repaint.direction);
  return (
    <div ref={ref} className="ral-repaint" data-field-scope={field.id} aria-hidden="true" style={{ clipPath: `circle(0px at ${repaint.x}px ${repaint.y}px)` }}>
      <div className="ral-repaint__label">
        <span className="ral-mono ral-repaint__code">{field.code}</span>
        <span className="ral-repaint__name">
          {field.name} · {field.label}
        </span>
      </div>
    </div>
  );
}
