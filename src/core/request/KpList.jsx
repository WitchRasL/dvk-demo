// Список запроса КП: позиции с количеством и удалением; пустое состояние — со ссылками в каталог и на квиз.
import { useState } from 'react';
import { Link } from 'react-router';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { imageSrc } from '../../lib/images.js';
import { buildCatalogUrl } from '../catalog/index.js';
import { useKp } from '../kp/index.js';
import { EmptyState } from '../pages/parts/EmptyState.jsx';
import { formatPrice, plural } from '../ui/format.js';
import { QuantityStepper } from '../ui/QuantityStepper.jsx';
import { useVariant } from '../variants/VariantContext.jsx';

const POSITION_FORMS = ['позиция', 'позиции', 'позиций'];

/** Переводит взгляд и фокус на форму заявки (в HashRouter якорь #quiz — это уже другой маршрут). */
export function goToQuiz() {
  const quiz = document.getElementById('quiz');
  if (!quiz) return;
  quiz.scrollIntoView({ block: 'start' });
  quiz.focus({ preventScroll: true });
}

/** @param {{ className?: string }} props */
export function KpList({ className }) {
  const { id: variantId, ui } = useVariant();
  const kp = useKp();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!kp.items.length) {
    return (
      <section aria-labelledby="kp-title" className={cn('kp-list', className)}>
        <EmptyState
          title="В запросе пока нет товаров"
          className="border-0 py-0 md:py-0"
          actions={
            <>
              <ui.Button to={buildCatalogUrl(variantId, {})}>Выбрать в каталоге</ui.Button>
              <ui.Button variant="secondary" onClick={goToQuiz}>
                Перейти к заявке
              </ui.Button>
            </>
          }
        >
          <p>Добавляйте товары кнопкой «В запрос КП» — они войдут в одно коммерческое предложение. Можно и без подборки: оставьте заявку, мы подберём оборудование сами.</p>
        </EmptyState>
        <span id="kp-title" className="sr-only">
          Запрос КП
        </span>
      </section>
    );
  }

  return (
    <section aria-labelledby="kp-title" className={cn('kp-list', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="kp-title" className="font-display text-2xl leading-tight md:text-3xl">
          Ваша подборка
        </h2>
        <p className="tabular text-sm text-fg-muted">
          {kp.count} {plural(kp.count, POSITION_FORMS)}, {kp.totalQty} шт.
        </p>
      </div>

      <ul className="mt-5 border-t border-line">
        {kp.items.map(({ id, qty, product }) => {
          const name = product?.name ?? `Товар ${id}`;
          const image = product?.images?.[0];
          return (
            <li key={id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-line py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
              <div className="row-span-2 aspect-square self-start overflow-hidden rounded-base border border-line bg-[color:var(--stage)] sm:row-span-1">
                {image ? (
                  <img src={imageSrc(image.base)} width={image.w} height={image.h} alt={image.alt || name} loading="lazy" decoding="async" className="size-full object-contain p-1.5" />
                ) : null}
              </div>
              <div className="min-w-0">
                {product ? (
                  <Link to={`/${variantId}/product/${product.slug}`} className="font-display text-lg leading-snug text-balance underline-offset-4 hover:underline">
                    {name}
                  </Link>
                ) : (
                  <p className="font-display text-lg leading-snug">{name}</p>
                )}
                <p className="tabular mt-1 text-sm text-fg-muted">{product ? formatPrice(product) : 'Товара больше нет в каталоге'}</p>
              </div>
              <div className="col-start-2 flex items-center gap-2 sm:col-start-3">
                <QuantityStepper value={qty} onChange={(next) => kp.setQty(id, next)} label={`Количество: ${name}`} />
                <button
                  type="button"
                  onClick={() => kp.remove(id)}
                  aria-label={`Убрать из запроса: ${name}`}
                  className="inline-flex size-11 items-center justify-center rounded-base text-fg-muted transition-[opacity] duration-fast ease-out hover:bg-surface-2 hover:text-fg"
                >
                  <Trash2 className="size-5" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {confirmClear ? (
          <>
            <span className="text-sm text-fg">Убрать все позиции?</span>
            <ui.Button
              variant="secondary"
              size="sm"
              onClick={() => {
                kp.clear();
                setConfirmClear(false);
              }}
            >
              Да, очистить
            </ui.Button>
            <ui.Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
              Оставить
            </ui.Button>
          </>
        ) : (
          <ui.Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
            Очистить подборку
          </ui.Button>
        )}
      </div>
    </section>
  );
}
