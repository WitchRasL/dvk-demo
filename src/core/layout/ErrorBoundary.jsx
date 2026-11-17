import { Component } from 'react';

// Сбой загрузки чанка (например, после нового деплоя) или ошибка рендера — понятный экран вместо белого.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6 font-body">
        <h1 className="text-2xl font-semibold">Не удалось открыть страницу</h1>
        <p className="text-fg-muted">Возможно, прототип обновился. Обновите страницу — обычно этого достаточно.</p>
        <div>
          <button
            type="button"
            className="min-h-11 rounded-base bg-action px-5 text-action-fg"
            onClick={() => window.location.reload()}
          >
            Обновить страницу
          </button>
        </div>
      </main>
    );
  }
}
