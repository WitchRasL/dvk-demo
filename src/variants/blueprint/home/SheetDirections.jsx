// Лист 2 «Спецификация направлений»: три равные графы — у каждой свой тип листа (фасад / генплан / деталь),
// разделы с числом позиций на dvk-style.ru. При входе в экран спецификация заполняется строками:
// линия строки вычерчивается слева направо, затем проявляется текст.
import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useInView } from 'motion/react';
import { buildCatalogUrl, getDirections } from '../../../core/catalog/index.js';
import { useVariant } from '../../../core/variants/VariantContext.jsx';
import { SheetGlyph } from '../drawing/SheetGlyph.jsx';
import { SHEET_TYPES } from '../lib/drawing.js';
import { SectionHeading } from '../ui/headings.jsx';
import { Sheet } from './Sheet.jsx';

export function SheetDirections() {
  const { id: variantId } = useVariant();
  const ref = useRef(null);
  const filled = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  return (
    <Sheet id="directions" labelledBy="bp-directions-title">
      <div className="bp-wrap">
        <SectionHeading
          id="bp-directions-title"
          title="Три направления — три типа листа"
          lead="Ритейл, благоустройство и металл равны: выберите своё. Число у раздела — позиций на dvk-style.ru, в прототипе — характерные товары."
        />
        <div ref={ref} className="bp-dirs" data-filled={filled || undefined}>
          {getDirections().map((direction, index) => {
            const sheet = SHEET_TYPES[direction.id];
            const total = direction.sections.reduce((sum, section) => sum + (section.count ?? 0), 0);
            return (
              <article key={direction.id} className="bp-dirs__col" data-direction-sheet={direction.id} style={{ '--col': index }}>
                <div className="bp-dirs__head">
                  <SheetGlyph view={sheet?.view} className="bp-dirs__glyph" />
                  <p className="bp-dirs__type">
                    <span className="bp-mono">{index + 1}</span> Тип листа: {sheet?.name}
                  </p>
                </div>
                <h3 className="bp-dirs__name font-display">
                  <Link to={buildCatalogUrl(variantId, { direction: direction.id })} className="bp-link-quiet">
                    {direction.name}
                  </Link>
                </h3>
                <p className="bp-dirs__summary">{direction.summary}</p>
                <table className="bp-dirs__table" role="table">
                  <caption className="sr-only">Разделы: {direction.name}</caption>
                  <thead role="rowgroup">
                    <tr role="row">
                      <th scope="col" role="columnheader">Поз.</th>
                      <th scope="col" role="columnheader">Раздел</th>
                      <th scope="col" role="columnheader">Позиций</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {direction.sections.map((section, sectionIndex) => {
                      return (
                        <tr key={section.id} role="row" style={{ '--i': sectionIndex }}>
                          <td className="bp-mono" role="cell">{`${index + 1}.${sectionIndex + 1}`}</td>
                          <td role="cell">
                            <Link to={buildCatalogUrl(variantId, { direction: direction.id, section: section.id })} className="bp-link-quiet">
                              {section.name}
                            </Link>
                          </td>
                          <td className="tabular" role="cell">{section.count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot role="rowgroup">
                    <tr role="row" style={{ '--i': direction.sections.length }}>
                      <td role="cell" />
                      <th scope="row" role="rowheader">Итого</th>
                      <td className="tabular" role="cell">{total}</td>
                    </tr>
                  </tfoot>
                </table>
                <Link to={buildCatalogUrl(variantId, { direction: direction.id })} className="bp-dirs__go">
                  Открыть направление
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}
