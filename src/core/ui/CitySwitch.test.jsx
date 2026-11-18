// Переключатель города — общий для трёх шапок: логика одна, классы и короткие подписи задаёт вариант.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useCity } from '../city/index.js';
import { resetStores } from '../pages/test-utils.jsx';
import { CitySwitch } from './CitySwitch.jsx';

beforeEach(() => resetStores());
afterEach(cleanup);

function Phone() {
  const { contacts } = useCity();
  return <output>{contacts?.label}</output>;
}

describe('CitySwitch', () => {
  it('группа «Город» с кнопкой на каждую площадку из company.json; выбранная нажата', () => {
    render(<CitySwitch />);
    const group = screen.getByRole('group', { name: 'Город' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Санкт-Петербург', 'Москва']);
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    expect(buttons.every((button) => button.type === 'button')).toBe(true);
  });

  it('нажатие меняет город для всего сайта', () => {
    render(
      <>
        <CitySwitch />
        <Phone />
      </>,
    );
    expect(screen.getByRole('status').textContent).toBe('Санкт-Петербург');
    fireEvent.click(screen.getByRole('button', { name: 'Москва' }));
    expect(screen.getByRole('status').textContent).toBe('Москва');
    expect(screen.getByRole('button', { name: 'Москва' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Санкт-Петербург' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('вариант задаёт свои классы, короткие подписи и название группы; полное название города — в подсказке', () => {
    render(<CitySwitch className="x-city" buttonClassName="x-city__btn" labels={{ spb: 'СПб' }} label="Выбор города" />);
    const group = screen.getByRole('group', { name: 'Выбор города' });
    expect(group.className).toBe('x-city');
    const [spb, msk] = within(group).getAllByRole('button');
    expect(spb.textContent).toBe('СПб');
    expect(spb.title).toBe('Санкт-Петербург');
    expect(spb.className).toBe('x-city__btn');
    expect(msk.textContent).toBe('Москва');
    expect(msk.hasAttribute('title')).toBe(false); // подпись и так полная
  });
});
