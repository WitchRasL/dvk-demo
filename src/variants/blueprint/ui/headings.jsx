// Заголовок секции и шапка внутренней страницы «Чертежа». Шапка — верх листа: путь, заголовок
// (Fira Sans Condensed курсив — отсылка к чертёжному шрифту) и справа малая основная надпись с типом листа:
// направление страницы меняет его (фасады и узлы / генплан / деталировка и нагрузки).
import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { getCompany, getProduct } from '../../../core/catalog/index.js';
import { Breadcrumbs } from '../../../core/ui/Breadcrumbs.jsx';
import { cn } from '../../../lib/utils.js';
import { ProductBlueprint } from '../drawing/ProductBlueprint.jsx';
import { SheetGlyph } from '../drawing/SheetGlyph.jsx';
import { SHEET_TYPES } from '../lib/drawing.js';

/** ({ as='h2', title, lead, id }) — без надписи над заголовком */
export function SectionHeading({ as: Tag = 'h2', title, lead, id, className }) {
  return (
    <div className={cn('bp-sh', className)}>
      <Tag id={id} className="bp-sh__title font-display">
        {title}
      </Tag>
      {lead ? <p className="bp-sh__lead">{lead}</p> : null}
    </div>
  );
}

const NOT_FOUND = 'Страница не найдена';

/** Направление страницы: ядро ставит data-direction на <main>; страница может смениться без перемонтирования. */
function useDirection(ref) {
  const [direction, setDirection] = useState(null);
  useLayoutEffect(() => {
    const next = ref.current?.closest('[data-direction]')?.getAttribute('data-direction') ?? null;
    if (next !== direction) setDirection(next);
  });
  return direction;
}

function SheetStamp({ direction, notFound }) {
  const sheet = SHEET_TYPES[direction];
  const view = notFound ? 'void' : sheet?.view ?? 'general';
  const type = notFound ? 'Лист изъят' : sheet?.name ?? 'Общие данные';
  return (
    <aside className="bp-ph__stamp" aria-label="Основная надпись">
      <SheetGlyph view={view} className="bp-ph__glyph" />
      <dl className="bp-ph__fields">
        <div>
          <dt>Тип листа</dt>
          <dd>{type}</dd>
        </div>
        <div>
          <dt>Организация</dt>
          <dd>{getCompany().legalName}</dd>
        </div>
      </dl>
    </aside>
  );
}

/** ({ title, lead, breadcrumbs: [{ label, to }], children }) */
export function PageHeader({ title, lead, breadcrumbs = [], children, className }) {
  const ref = useRef(null);
  const direction = useDirection(ref);
  const { pathname } = useLocation();
  const { slug } = useParams();
  const product = /\/product\//.test(pathname) && slug ? getProduct(slug) : null;
  const notFound = title === NOT_FOUND;
  return (
    <header ref={ref} className={cn('bp-ph', notFound && 'bp-ph--void', className)}>
      <Breadcrumbs items={breadcrumbs} className="bp-ph__crumbs" />
      <div className="bp-ph__body">
        <div className="bp-ph__text">
          <h1 className="bp-ph__title font-display">{title}</h1>
          {lead ? <p className="bp-ph__lead">{lead}</p> : null}
          {children ? <div className="bp-ph__actions">{children}</div> : null}
        </div>
        <SheetStamp direction={direction} notFound={notFound} />
      </div>
      {product ? <ProductBlueprint key={product.id} product={product} /> : null}
    </header>
  );
}
