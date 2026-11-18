// «Каталог-витрина» — шесть характерных товаров трёх направлений в карточках-«витринах».
// Появляются группой: вдоль ряда проходит полоса света, и светильники над нишами зажигаются по ходу её движения.
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { getProduct } from '../../../core/catalog/index.js';
import { useQuickView } from '../../../core/pages/parts/QuickView.jsx';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { useLitOnView } from '../light.js';
import { ProductCard, SectionHeading } from '../ui.jsx';

/**
 * Порядок — по направлениям поочерёдно, чтобы ни одно не выглядело главным.
 * Благоустройство и металл сняты на белом — стоят в каменных нишах; товары ритейла на dvk-style.ru сняты
 * только в интерьере — показаны кадрами во всю рамку (см. media-kind.js).
 */
const SHOWCASE = [
  'vitrina-dlya-chasov-vchyu-23',
  'igrovoy-kompleks-mgm-78-korablik',
  'shkaf-instrumentalnyy-hard-2000-062000',
  'torgovyy-modul-tmd-3210',
  'detskaya-gorka-mgs-3-vverkh-nogami',
  'verstak-vl-200-05-s-ekranom-vl-200-e4',
];

export function Showcase() {
  const { id } = useVariant();
  const { openQuickView, quickView } = useQuickView();
  const [ref, lit] = useLitOnView({ threshold: 0.3 });
  const products = SHOWCASE.map((slug) => getProduct(slug)).filter(Boolean);
  return (
    <section className="sr-screen sr-showcase" aria-labelledby="sr-showcase-title">
      <div className="sr-wrap">
        <div className="sr-showcase__head">
          <SectionHeading
            id="sr-showcase-title"
            title={
              <>
                Каталог под <em>подсветкой</em>
              </>
            }
            lead="Характерные позиции трёх направлений. Добавляйте в запрос КП — все позиции войдут в одно коммерческое предложение."
          />
          <Link to={`/${id}/catalog`} className="sr-link-arrow">
            Весь каталог
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div ref={ref} className="sr-showcase__stage" data-lit={lit || undefined}>
          <span className="sr-showcase__sweep" aria-hidden="true" />
          <ul className="sr-showcase__list">
            {products.map((product, index) => (
              <li key={product.id} style={{ '--i': index }}>
                <ProductCard product={product} onQuickView={openQuickView} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      {quickView}
    </section>
  );
}
