import { Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_VARIANT, getVariant, VARIANT_IDS, VARIANTS } from './registry.js';
import { VariantProvider } from './VariantContext.jsx';

afterEach(cleanup);

const DESCRIPTION_FIELDS = ['metaphor', 'palette', 'fonts', 'mood', 'fishka', 'patterns', 'directions', 'wireframe'];

describe('реестр вариантов', () => {
  it('три варианта по спецификации, по умолчанию «Шоурум»', () => {
    expect(VARIANT_IDS).toEqual(['showroom', 'ral', 'blueprint']);
    expect(DEFAULT_VARIANT).toBe('showroom');
    expect(VARIANTS.map(({ id, number, name }) => [id, number, name])).toEqual([
      ['showroom', 1, 'Шоурум'],
      ['ral', 2, 'Палитра RAL'],
      ['blueprint', 3, 'Чертёж'],
    ]);
  });

  it('getVariant находит вариант по id и не выдумывает неизвестный', () => {
    expect(getVariant('ral')?.name).toBe('Палитра RAL');
    expect(getVariant('nope')).toBeUndefined();
  });

  it.each(VARIANT_IDS)('описание «%s» для панели заполнено, вайрфрейм главной — 6–8 блоков через «→»', (id) => {
    const { description } = getVariant(id);
    for (const field of DESCRIPTION_FIELDS) {
      expect(typeof description[field], field).toBe('string');
      expect(description[field].trim().length, field).toBeGreaterThan(0);
    }
    const blocks = description.wireframe.split('→').map((block) => block.trim());
    expect(blocks.every(Boolean)).toBe(true);
    expect(blocks.length).toBeGreaterThanOrEqual(6);
    expect(blocks.length).toBeLessThanOrEqual(8);
  });
});

describe('модуль варианта по контракту', () => {
  it.each(VARIANT_IDS)('«%s» грузится лениво и отдаёт id, Header, Footer, Home, ui, heroConfig', async (id) => {
    const module = (await getVariant(id).load()).default;
    expect(module.id).toBe(id);
    expect(typeof module.Header).toBe('function');
    expect(typeof module.Footer).toBe('function');
    expect(typeof module.Home).toBe('function');
    expect(typeof module.ui).toBe('object');
    expect(typeof module.heroConfig).toBe('object');
  });

  it.each(VARIANT_IDS)('футер «%s» помечает концепт', async (id) => {
    const module = (await getVariant(id).load()).default;
    const { Footer } = module;
    // use() приостанавливает рендер до загрузки модуля — act нужно дождаться.
    await act(async () => {
      render(
        <MemoryRouter>
          <Suspense fallback={null}>
            <VariantProvider id={id}>
              <Footer />
            </VariantProvider>
          </Suspense>
        </MemoryRouter>,
      );
    });
    expect(await screen.findByText(/Концепт редизайна dvk-style\.ru/)).toBeTruthy();
  });
});
