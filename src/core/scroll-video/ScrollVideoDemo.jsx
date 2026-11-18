// Демо движка скролл-видео: /#/<вариант>/__scroll-video. Только в dev (маршрут подключён под import.meta.env.DEV).
// Все три режима на фикстуре из tests/fixtures/scroll-video: заглушка, ролик, статика.
import demoVideo from '../../../tests/fixtures/scroll-video/demo.webm';
import demoPoster from '../../../tests/fixtures/scroll-video/poster.jpg';
import { ScrollVideo } from './ScrollVideo.jsx';

// Фикстура лежит не в public/, поэтому передаём полный адрес — asset() внешние адреса не трогает.
const absolute = (url) => new URL(url, window.location.href).href;

const poster = { src: absolute(demoPoster), alt: 'Фикстура: синтетический кадр интерьера' };
const camera = { from: { x: 0, y: 0, scale: 1.05 }, to: { x: -4, y: 2, scale: 1.3 } };
const callouts = [
  { id: 'one', from: 0.08, to: 0.3, x: 0.3, y: 0.35, title: 'Пояснение 1', text: 'Фикстура: здесь будет текст из данных ДВК.' },
  { id: 'two', from: 0.3, to: 0.52, x: 0.68, y: 0.5, title: 'Пояснение 2', text: 'Фикстура: у каждого пояснения свой отрезок прогресса.' },
  { id: 'three', from: 0.52, to: 0.76, x: 0.4, y: 0.62, title: 'Пояснение 3', text: 'Фикстура: точка привязана к месту в кадре.' },
  { id: 'four', from: 0.76, to: 1, x: 0.72, y: 0.3, title: 'Пояснение 4', text: 'Фикстура: последнее остаётся до конца сцены.' },
];
const phases = [
  { id: 'design', label: 'ПРОЕКТИРОВАНИЕ', from: 0, to: 1 / 3 },
  { id: 'production', label: 'ПРОИЗВОДСТВО', from: 1 / 3, to: 2 / 3 },
  { id: 'install', label: 'МОНТАЖ', from: 2 / 3, to: 1 },
];

function overlayFor(title) {
  // Минимальный оверлей: показывает, что получает вариант (прогресс, фазу, seekTo).
  return (progress, { mode, phase, seekTo }) => (
    <div className="flex h-full flex-col justify-between p-4 md:p-8">
      <div className="max-w-md rounded-base border border-line bg-surface p-4 text-fg">
        <p className="font-display text-lg">{title}</p>
        <p className="mt-1 text-sm text-fg-muted">
          Режим: {mode}. Прогресс: {progress.toFixed(2)}. Фаза: {phase ? phase.label : '—'}.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {phases.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => seekTo(item.from)}
              className="rounded-base border border-line bg-surface-2 px-3 py-1 text-xs text-fg focus-visible:outline-2 focus-visible:outline-focus"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Scene({ title, note, children }) {
  return (
    <section aria-label={title}>
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <h2 className="font-display text-2xl text-fg">{title}</h2>
        <p className="mt-2 text-fg-muted">{note}</p>
      </div>
      {children}
    </section>
  );
}

export default function ScrollVideoDemo() {
  return (
    <main className="page page-scroll-video-demo">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <h1 className="font-display text-3xl text-fg">Демо движка скролл-видео</h1>
        <p className="mt-3 text-fg-muted">
          Только для разработки. Три режима на фикстуре из tests/fixtures/scroll-video: заглушка, ролик и статика.
          Прокрутите страницу: кадр догоняет скролл со сглаживанием, пояснения появляются на своих отрезках.
        </p>
      </div>

      <Scene title="1. Заглушка (ролика нет)" note="Нет файла — постер с движением камеры и пометкой.">
        <ScrollVideo poster={poster} camera={camera} callouts={callouts} phases={phases} lengthVh={300} renderOverlay={overlayFor('Заглушка')} />
      </Scene>

      <Scene title="2. Ролик" note="Ролик из фикстуры (72 кадра, каждый ключевой) перематывается скроллом.">
        <ScrollVideo
          poster={poster}
          sources={{ desktop: absolute(demoVideo) }}
          callouts={callouts}
          phases={phases}
          lengthVh={300}
          renderOverlay={overlayFor('Ролик')}
        />
      </Scene>

      <Scene title="3. Статика (prefers-reduced-motion)" note="Без закрепления: кадр и список пояснений. Принудительно, независимо от настроек системы.">
        <ScrollVideo poster={poster} callouts={callouts} phases={phases} forceMode="static" renderOverlay={overlayFor('Статика')} />
      </Scene>
    </main>
  );
}
