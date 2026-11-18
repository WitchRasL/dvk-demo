// Кнопка «В запрос КП» и её состояние «В запросе». Работает с хранилищем КП без провайдера.
import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../lib/utils.js';
import { useKp } from '../kp/index.js';
import { useVariant } from '../variants/VariantContext.jsx';
import { QuantityStepper } from './QuantityStepper.jsx';

/**
 * @param {{ product: object, mode?: 'card'|'full', variant?: 'primary'|'secondary'|'ghost', className?: string }} props
 *   card — одна кнопка-переключатель (карточки, список); full — страница товара и быстрый просмотр:
 *   после добавления «В запросе · изменить количество», счётчик, «Убрать» и ссылка на запрос КП.
 */
export function AddToKp({ product, mode = 'card', variant = mode === 'card' ? 'secondary' : 'primary', className }) {
  const { id: variantId, ui } = useVariant();
  const kp = useKp();
  const [announcement, setAnnouncement] = useState('');
  const entry = kp.items.find((item) => item.id === String(product.id));
  const Button = ui.Button;

  const add = () => {
    kp.add(product.id);
    setAnnouncement(`Добавлено в запрос КП: ${product.name}`);
  };
  const remove = () => {
    kp.remove(product.id);
    setAnnouncement(`Убрано из запроса КП: ${product.name}`);
  };

  const live = (
    <span role="status" className="sr-only">
      {announcement}
    </span>
  );

  if (mode === 'card') {
    return (
      <>
        <Button variant={entry ? 'secondary' : variant} size="sm" className={cn(entry && 'border-action', className)} onClick={entry ? remove : add}>
          {entry ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          {entry ? 'В запросе' : 'В запрос КП'}
          <span className="sr-only">: {product.name}</span>
        </Button>
        {live}
      </>
    );
  }

  if (!entry) {
    return (
      <div className={className}>
        <Button variant={variant} onClick={add}>
          <Plus className="size-4" aria-hidden="true" />
          Добавить в запрос КП
        </Button>
        {live}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="flex items-center gap-2 text-sm font-medium text-fg">
        <Check className="size-4 shrink-0" aria-hidden="true" />В запросе · изменить количество
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={entry.qty} onChange={(qty) => kp.setQty(product.id, qty)} label={`Количество: ${product.name}`} />
        <Button variant="ghost" size="sm" onClick={remove}>
          Убрать
          <span className="sr-only"> из запроса КП</span>
        </Button>
      </div>
      <Link to={`/${variantId}/request`} className="w-fit text-sm underline underline-offset-4 hover:no-underline">
        Открыть запрос КП ({kp.count})
      </Link>
      {live}
    </div>
  );
}
