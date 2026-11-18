// Лист 5 «Позиции каталога»: по две характерные позиции каждого направления. Появление группой: все шесть
// сначала вычерчиваются как чертежи, затем фото «проявляются» поверх шторкой — по столбцам, слева направо.
// Это и есть фишка «Режим чертёж» в обратную сторону: наведение или кнопка «Чертёж» возвращают чертёж.
import { useRef } from 'react';
import { Link } from 'react-router';
import { useInView } from 'motion/react';
import { buildCatalogUrl, getProduct } from '../../../core/catalog/index.js';
import { useQuickView } from '../../../core/pages/parts/QuickView.jsx';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { ProductCard } from '../ui/ProductCard.jsx';
import { SectionHeading } from '../ui/headings.jsx';
import { Sheet } from './Sheet.jsx';

const SHOWCASE = [
  'muzeynaya-vitrina-mvp-30',
  'stellazh-demonstratsionnyy-sd-12',
  'karusel-next-mk-27',
  'skameyka-na-betonnom-osnovanii-s-222',
  'verstak-vs-100-01',
  'shkaf-arkhivnyy-sham-11-920',
];

export function SheetShowcase() {
  const { id: variantId } = useVariant();
  const { openQuickView, quickView } = useQuickView();
  const ref = useRef(null);
  const shown = useInView(ref, { once: true, margin: '0px 0px -25% 0px' });
  const products = SHOWCASE.map(getProduct).filter(Boolean);
  return (
    <Sheet id="showcase" labelledBy="bp-showcase-title">
      <div className="bp-wrap">
        <div className="bp-sheet__head">
          <SectionHeading
            id="bp-showcase-title"
            title="Позиции каталога — и их чертежи"
            lead="Наведите на фото или нажмите «Чертёж»: каркас, стекло, подсветка и размеры — из данных товара. Чего в данных нет, помечено [уточнить]."
          />
          <Link to={buildCatalogUrl(variantId, {})} className="bp-dirs__go">
            Весь каталог — спецификацией
          </Link>
        </div>
        <ul ref={ref} className="bp-showcase rail" data-intro={shown ? 'done' : 'pending'}>
          {products.map((product, index) => (
            <li key={product.id} style={{ '--col': index % 3 }}>
              <ProductCard product={product} onQuickView={openQuickView} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw" />
            </li>
          ))}
        </ul>
      </div>
      {quickView}
    </Sheet>
  );
}
