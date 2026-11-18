// Экран «Каталог-образцы»: девять характерных изделий, по три на направление — каждая колонка своего цвета.
// Появление группой: три шторки цвета направлений поднимаются целыми модулями, колонка за колонкой.
import { useRef, useState } from 'react';
import { buildCatalogUrl, getProduct } from '../../../core/catalog/index.js';
import { useQuickView } from '../../../core/pages/parts/QuickView.jsx';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { useEntrance } from '../entrance.js';
import { DIRECTION_FIELDS, fieldFor } from '../palette.js';
import { Button, ProductCard, SectionHeading } from '../ui.jsx';

// По строкам: ритейл · благоустройство · металл — колонки складываются в три поля веера.
const SHOWCASE = [
  'vitrina-dlya-chasov-vchyu-23',
  'igrovoy-kompleks-mgm-78-korablik',
  'shkaf-arkhivnyy-sham-11-920',
  'muzeynaya-vitrina-mvp-30',
  'karusel-next-mk-27',
  'verstak-vs-100-01',
  'torgovyy-modul-tmd-3210',
  'skameyka-na-betonnom-osnovanii-s-222',
  'tumba-instrumentalnaya-ti-7-006',
];

export function Showcase() {
  const { id } = useVariant();
  const { openQuickView, quickView } = useQuickView();
  const products = SHOWCASE.map((slug) => getProduct(slug)).filter(Boolean);
  const gridRef = useRef(null);
  const state = useEntrance(gridRef, { threshold: 0.85 });
  // Шторки снимаются из DOM после подъёма: смена ширины окна не проигрывает вход заново.
  const [lifted, setLifted] = useState(false);
  return (
    <section className="ral-section ral-showcase" aria-labelledby="ral-showcase-title">
      <div className="ral-wrap ral-section__head ral-section__head--split">
        <SectionHeading
          id="ral-showcase-title"
          title="Образцы из каталога"
          lead="По три изделия каждого направления: этикетка с кодом RAL или материалом, габаритами и артикулом. Цена — с сайта или «по запросу»."
        />
        <Button variant="secondary" to={buildCatalogUrl(id, {})}>
          Весь каталог
        </Button>
      </div>
      <div className="ral-wrap">
        <div ref={gridRef} className="ral-showcase__board" data-entrance={state}>
          <ul className="ral-tiles ral-tiles--showcase">
            {products.map((product, index) => (
              <li key={product.id} style={{ '--i': index }}>
                <ProductCard product={product} onQuickView={openQuickView} />
              </li>
            ))}
          </ul>
          {lifted ? null : (
            <div
              className="ral-shutters"
              aria-hidden="true"
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget.lastElementChild) setLifted(true);
              }}
            >
              {DIRECTION_FIELDS.map((direction, index) => (
                <span key={direction} data-field-scope={direction} style={{ '--i': index }}>
                  <span className="ral-mono">{fieldFor(direction).code}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {quickView}
    </section>
  );
}
