// Квиз заявки: 4 шага, черновик в localStorage['dvk-quiz-v1'], отправка через адаптер. Без провайдера.
import { useCity } from '../city/index.js';
import { kpItemsToPayload, useKp } from '../kp/index.js';
import { createPersistedStore, useStore } from '../kp/persisted-store.js';
import { SUBMIT_ERRORS, submitRequest } from './submit.js';
import { validateStep } from './validation.js';

export const QUIZ_STEPS = ['direction', 'object', 'timing', 'contacts'];
export const QUIZ_KEY = 'dvk-quiz-v1';

export const EMPTY_VALUES = Object.freeze({
  direction: '',
  objectType: '',
  objectNote: '',
  timing: '',
  name: '',
  phone: '',
  email: '',
  city: '',
  comment: '',
  consent: false,
  file: null,
});

const FIELDS = Object.keys(EMPTY_VALUES);
const LAST_STEP = QUIZ_STEPS.length - 1;
const TEXT_LIMIT = 2000;
/** В черновик не попадают файл (его нельзя сохранить) и согласие (даётся заново при отправке). */
const DRAFT_TEXT_FIELDS = FIELDS.filter((field) => field !== 'file' && field !== 'consent');

function initialState() {
  return { step: 0, values: { ...EMPTY_VALUES }, status: 'idle', error: null, demo: false, attempted: false };
}

const hasErrors = (stepId, values) => Object.keys(validateStep(stepId, values)).length > 0;

/**
 * Чистый редьюсер. Состояние: { step, values, status: 'idle'|'submitting'|'success'|'error', error, demo, attempted }.
 * Действия:
 *  set {field, value} | {values} — ответы (неизвестные поля игнорируются);
 *  next — на шаг вперёд, если ответ на текущем есть, иначе attempted: true; back; reset;
 *  submitStart — только на последнем шаге при верных ответах и не во время отправки;
 *  submitOk {demo} / submitFail {error} — итог, принимаются только во время отправки.
 * Пока идёт отправка, всё, кроме её итога и reset, заморожено. Ничего не меняющее действие возвращает то же состояние.
 */
export function quizReducer(state = initialState(), action = {}) {
  const submitting = state.status === 'submitting';
  switch (action.type) {
    case 'reset':
      return initialState();
    case 'set': {
      if (submitting) return state;
      const patch = action.values ?? (action.field ? { [action.field]: action.value } : {});
      const changes = Object.entries(patch).filter(([field, value]) => FIELDS.includes(field) && state.values[field] !== value);
      if (!changes.length) return state;
      return { ...state, values: { ...state.values, ...Object.fromEntries(changes) } };
    }
    case 'next': {
      if (submitting) return state;
      if (hasErrors(QUIZ_STEPS[state.step], state.values)) return state.attempted ? state : { ...state, attempted: true };
      if (state.step >= LAST_STEP) return state;
      return { ...state, step: state.step + 1, attempted: false, status: state.status === 'error' ? 'idle' : state.status, error: null };
    }
    case 'back': {
      if (submitting || state.step === 0) return state;
      return { ...state, step: state.step - 1, attempted: false, status: state.status === 'error' ? 'idle' : state.status, error: null };
    }
    case 'submitStart': {
      if (submitting || state.status === 'success' || state.step !== LAST_STEP) return state;
      const invalid = QUIZ_STEPS.findIndex((id) => hasErrors(id, state.values));
      if (invalid !== -1) return { ...state, step: invalid, attempted: true };
      return { ...state, status: 'submitting', error: null, attempted: false };
    }
    case 'submitOk':
      return submitting ? { ...state, status: 'success', demo: Boolean(action.demo), error: null } : state;
    case 'submitFail':
      return submitting ? { ...state, status: 'error', error: String(action.error || SUBMIT_ERRORS.service) } : state;
    default:
      return state;
  }
}

function isPristine(state) {
  return state.step === 0 && FIELDS.every((field) => state.values[field] === EMPTY_VALUES[field]);
}

function serialize(state) {
  if (state.status === 'success' || isPristine(state)) return null;
  const values = Object.fromEntries(DRAFT_TEXT_FIELDS.map((field) => [field, state.values[field]]));
  return JSON.stringify({ step: state.step, values });
}

/** Черновик → состояние: берутся только известные текстовые поля, шаг не уходит дальше первого неверного. */
function deserialize(raw) {
  const draft = JSON.parse(raw);
  if (!draft || typeof draft !== 'object' || !draft.values || typeof draft.values !== 'object') return null;
  const values = { ...EMPTY_VALUES };
  for (const field of DRAFT_TEXT_FIELDS) {
    if (typeof draft.values[field] === 'string') values[field] = draft.values[field].slice(0, TEXT_LIMIT);
  }
  const saved = Number.isInteger(draft.step) && draft.step >= 0 && draft.step <= LAST_STEP ? draft.step : 0;
  const firstInvalid = QUIZ_STEPS.findIndex((id) => hasErrors(id, values));
  return { ...initialState(), values, step: Math.min(saved, firstInvalid === -1 ? LAST_STEP : firstInvalid) };
}

/** @param {Storage|null} [storage] — по умолчанию localStorage; null — только память */
export function createQuizStore(storage) {
  return createPersistedStore({ key: QUIZ_KEY, reducer: quizReducer, initial: initialState, serialize, deserialize, storage });
}

const defaultStore = createQuizStore();

/** Ответы квиза + список КП + город → payload для submitRequest. */
export function buildPayload(values, { variant, items = [], city = '' } = {}) {
  return {
    variant,
    direction: values.direction,
    objectType: values.objectType,
    objectNote: values.objectNote,
    timing: values.timing,
    name: values.name.trim(),
    phone: values.phone,
    email: values.email.trim(),
    city: values.city || city,
    comment: values.comment,
    consent: values.consent === true,
    items: kpItemsToPayload(items),
    file: values.file ?? null,
  };
}

/**
 * @param {{ store?, kpStore?, cityStore?, submitOptions?: { endpoint?, fetchImpl?, timeoutMs? } }} [options] — всё необязательно, нужно тестам
 * @returns {{
 *   step: number, stepId: string, steps: string[], isFirst: boolean, isLast: boolean,
 *   values: object, errors: Record<string, string>,   // ошибки текущего шага, только после попытки идти дальше или отправить
 *   status: 'idle'|'submitting'|'success'|'error', error: string|null, demo: boolean,
 *   set(field: string, value: any): void, next(): void, back(): void, reset(): void,
 *   submit(args: { variant: string }): Promise<{ ok: boolean, demo?: boolean, error?: string }|null>,  // null — не стартовала
 * }}
 */
export function useQuiz({ store = defaultStore, kpStore, cityStore, submitOptions } = {}) {
  const state = useStore(store);
  const kp = useKp(kpStore);
  const { city } = useCity(cityStore);
  const stepId = QUIZ_STEPS[state.step];

  async function submit({ variant } = {}) {
    const before = store.getSnapshot();
    store.dispatch({ type: 'submitStart' });
    const after = store.getSnapshot();
    if (before.status === 'submitting' || after.status !== 'submitting') return null;

    let result;
    try {
      result = await submitRequest(buildPayload(after.values, { variant, items: kp.items, city }), submitOptions);
    } catch {
      result = { ok: false, error: SUBMIT_ERRORS.service };
    }
    if (result.ok) store.dispatch({ type: 'submitOk', demo: result.demo });
    else store.dispatch({ type: 'submitFail', error: result.error });
    return result;
  }

  return {
    step: state.step,
    stepId,
    steps: QUIZ_STEPS,
    isFirst: state.step === 0,
    isLast: state.step === LAST_STEP,
    values: state.values,
    errors: state.attempted ? validateStep(stepId, state.values) : {},
    status: state.status,
    error: state.error,
    demo: state.demo,
    set: (field, value) => store.dispatch({ type: 'set', field, value }),
    next: () => store.dispatch({ type: 'next' }),
    back: () => store.dispatch({ type: 'back' }),
    reset: () => store.dispatch({ type: 'reset' }),
    submit,
  };
}
