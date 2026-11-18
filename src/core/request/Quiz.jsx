// Квиз подбора: направление → объект → сроки → контакты. Состояние и отправка — в useQuiz (core/request).
// Здесь только разметка: радио-плитки, поля с ошибками у поля, маска телефона, файл, согласие 152-ФЗ, экран успеха.
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Check, CircleAlert, Phone } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { buildCatalogUrl, getCompany, getDirections, getIndustries } from '../catalog/index.js';
import { CITIES, useCity } from '../city/index.js';
import { useKp } from '../kp/index.js';
import { toTel } from '../ui/format.js';
import { Field, FieldError, fieldClass } from '../ui/form.jsx';
import { useVariant } from '../variants/VariantContext.jsx';
import { formatPhone } from './phone.js';
import { useQuiz } from './quiz.js';
import { validateFile } from './validation.js';

const UNSURE_DIRECTION = 'Пока не знаю — нужна консультация';
const OTHER_OBJECT = 'Другое';
const OTHER_CITY = 'Другой город';
const TIMING_OPTIONS = ['Как можно скорее', 'В ближайшие 1–3 месяца', 'Через 3–6 месяцев и позже', 'Пока оцениваю варианты'];
const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.dwg,application/pdf,image/jpeg,image/png';

const STEP_LABELS = { direction: 'Направление', object: 'Объект', timing: 'Сроки', contacts: 'Контакты' };
const STEP_TITLES = {
  direction: 'Какое направление вас интересует?',
  object: 'Для какого объекта?',
  timing: 'Когда нужно оборудование?',
  contacts: 'Как с вами связаться?',
};

/** Радио-плитки: выбранная подсвечена рамкой и фоном, фокус виден. */
function ChoiceGroup({ legendRef, legend, hint, name, options, value, onChange, error }) {
  const errorId = useId();
  return (
    <fieldset className="min-w-0" data-invalid={error ? 'true' : undefined} aria-describedby={error ? errorId : undefined}>
      <legend ref={legendRef} tabIndex={-1} className="font-display text-xl leading-snug text-balance outline-offset-4 md:text-2xl">
        {legend}
      </legend>
      {hint ? <p className="mt-2 text-sm text-fg-muted">{hint}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'quiz-option flex cursor-pointer items-start gap-3 rounded-lg border bg-surface p-4 transition-[opacity] duration-fast ease-out',
              'hover:bg-surface-2 has-checked:border-fg has-checked:bg-surface-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
              error ? 'border-[color:var(--danger)]' : 'border-line',
            )}
          >
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="mt-1 size-4 shrink-0" />
            <span className="min-w-0">
              <span className="block text-base font-medium text-pretty text-fg">{option.label}</span>
              {option.text ? <span className="mt-1 block text-sm text-pretty text-fg-muted">{option.text}</span> : null}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={errorId} className="mt-3">
        {error}
      </FieldError>
    </fieldset>
  );
}

function StepProgress({ steps, step }) {
  return (
    <ol aria-label="Шаги заявки" className="grid grid-cols-4 gap-2">
      {steps.map((stepId, index) => {
        const done = index < step;
        const current = index === step;
        return (
          <li key={stepId} aria-current={current ? 'step' : undefined} className={cn('flex min-w-0 flex-col gap-1.5 border-t-2 pt-2 text-xs sm:text-sm', done || current ? 'border-fg' : 'border-line')}>
            <span className={cn('flex items-center gap-1 truncate', current ? 'font-medium text-fg' : 'text-fg-muted')}>
              {done ? <Check className="size-3.5 shrink-0" aria-hidden="true" /> : <span className="tabular" aria-hidden="true">{index + 1}</span>}
              <span className="truncate">{STEP_LABELS[stepId]}</span>
              <span className="sr-only">{done ? ' — готово' : current ? ' — текущий шаг' : ''}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function PhoneLine({ contacts, className }) {
  const phone = contacts?.phones?.[0];
  if (!phone) return null;
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 text-sm text-fg-muted', className)}>
      <Phone className="size-4" aria-hidden="true" />
      Или позвоните:
      <a href={`tel:${toTel(phone)}`} className="tabular text-fg underline underline-offset-4 hover:no-underline">
        {phone}
      </a>
      <span>({contacts.label})</span>
    </p>
  );
}

/** @param {{ className?: string }} props */
export function Quiz({ className }) {
  const { id: variantId, ui } = useVariant();
  const quiz = useQuiz();
  const kp = useKp();
  const { contacts } = useCity();
  const company = getCompany();
  const formRef = useRef(null);
  const legendRef = useRef(null);
  const successRef = useRef(null);
  const shownStep = useRef(null);
  const [fileKey, setFileKey] = useState(0);

  const { values, errors, stepId, step, status } = quiz;
  const submitting = status === 'submitting';
  const fileError = errors.file ?? validateFile(values.file);

  // Новый шаг — фокус на его заголовок: клавиатура и скринридер не остаются на пропавшей кнопке.
  useEffect(() => {
    const previous = shownStep.current;
    shownStep.current = step;
    if (previous !== null && previous !== step) legendRef.current?.focus({ preventScroll: true });
  }, [step]);

  // Нажали «Далее» без ответа — фокус на первое проблемное поле.
  const errorKeys = Object.keys(errors).join(',');
  useEffect(() => {
    if (!errorKeys) return;
    const target = formRef.current?.querySelector('[data-invalid="true"] input, [aria-invalid="true"]');
    target?.focus({ preventScroll: false });
  }, [errorKeys]);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!quiz.isLast) {
      quiz.next();
      return;
    }
    if (!values.city) quiz.set('city', contacts?.label ?? '');
    quiz.submit({ variant: variantId });
  }

  const directions = getDirections();
  const selectedDirection = directions.find((direction) => direction.name === values.direction);
  const industries = getIndustries().filter((industry) => !selectedDirection || industry.directions?.includes(selectedDirection.id));
  const cityOptions = [...CITIES.map((id) => company.cities?.[id]?.label).filter(Boolean), OTHER_CITY];

  if (status === 'success') {
    return (
      <section id="quiz" tabIndex={-1} className={cn('quiz outline-none', className)} aria-labelledby="quiz-done">
        <div className="max-w-xl border-y border-line py-10" role="status">
          <h2 id="quiz-done" ref={successRef} tabIndex={-1} className="font-display text-2xl leading-tight text-balance outline-offset-4 md:text-3xl">
            {quiz.demo ? 'Демо: заявка не отправлена' : 'Заявка отправлена'}
          </h2>
          <p className="mt-3 max-w-[56ch] text-base text-pretty text-fg-muted">
            {quiz.demo
              ? 'Так выглядит экран после отправки. Адрес приёма заявок пока не подключён, поэтому ничего никуда не ушло.'
              : `Мы получили вашу заявку. ${company.promise}.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ui.Button to={buildCatalogUrl(variantId, {})}>В каталог</ui.Button>
            <ui.Button variant="secondary" onClick={() => quiz.reset()}>
              Новая заявка
            </ui.Button>
          </div>
          <PhoneLine contacts={contacts} className="mt-6" />
        </div>
      </section>
    );
  }

  return (
    <section id="quiz" tabIndex={-1} className={cn('quiz outline-none', className)} aria-labelledby="quiz-title">
      <h2 id="quiz-title" className="font-display text-2xl leading-tight text-balance md:text-3xl">
        Бесплатный подбор
      </h2>
      <p className="mt-2 max-w-[56ch] text-base text-pretty text-fg-muted">{company.promise}.</p>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-7">
        <StepProgress steps={quiz.steps} step={step} />

        <ui.Reveal key={stepId}>
          {stepId === 'direction' ? (
            <ChoiceGroup
              legendRef={legendRef}
              legend={STEP_TITLES.direction}
              name="quiz-direction"
              value={values.direction}
              error={errors.direction}
              onChange={(value) => quiz.set('direction', value)}
              options={[
                ...directions.map((direction) => ({ value: direction.name, label: direction.name, text: direction.summary })),
                { value: UNSURE_DIRECTION, label: UNSURE_DIRECTION },
              ]}
            />
          ) : null}

          {stepId === 'object' ? (
            <div className="flex flex-col gap-6">
              <ChoiceGroup
                legendRef={legendRef}
                legend={STEP_TITLES.object}
                name="quiz-object"
                value={values.objectType}
                error={errors.objectType}
                onChange={(value) => quiz.set('objectType', value)}
                options={[...industries.map((industry) => ({ value: industry.name, label: industry.name })), { value: OTHER_OBJECT, label: OTHER_OBJECT }]}
              />
              <Field label="Что известно об объекте" optional hint="Город, площадь, что нужно разместить.">
                {(props) => (
                  <textarea
                    {...props}
                    rows={3}
                    maxLength={2000}
                    value={values.objectNote}
                    onChange={(event) => quiz.set('objectNote', event.target.value)}
                    className={cn(fieldClass, 'resize-y')}
                  />
                )}
              </Field>
            </div>
          ) : null}

          {stepId === 'timing' ? (
            <ChoiceGroup
              legendRef={legendRef}
              legend={STEP_TITLES.timing}
              name="quiz-timing"
              value={values.timing}
              error={errors.timing}
              onChange={(value) => quiz.set('timing', value)}
              options={TIMING_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          ) : null}

          {stepId === 'contacts' ? (
            <fieldset className="flex min-w-0 flex-col gap-5">
              <legend ref={legendRef} tabIndex={-1} className="mb-1 font-display text-xl leading-snug text-balance outline-offset-4 md:text-2xl">
                {STEP_TITLES.contacts}
              </legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Имя" error={errors.name}>
                  {(props) => <input {...props} type="text" autoComplete="name" value={values.name} onChange={(event) => quiz.set('name', event.target.value)} className={fieldClass} />}
                </Field>
                <Field label="Телефон" error={errors.phone}>
                  {(props) => (
                    <input
                      {...props}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={values.phone}
                      onChange={(event) => quiz.set('phone', formatPhone(event.target.value))}
                      className={cn(fieldClass, 'tabular')}
                    />
                  )}
                </Field>
                <Field label="Почта" optional error={errors.email}>
                  {(props) => (
                    <input {...props} type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(event) => quiz.set('email', event.target.value)} className={fieldClass} />
                  )}
                </Field>
                <Field label="Город">
                  {(props) => (
                    <select {...props} value={values.city || contacts?.label || ''} onChange={(event) => quiz.set('city', event.target.value)} className={fieldClass}>
                      {cityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
              <Field label="Комментарий" optional>
                {(props) => (
                  <textarea {...props} rows={3} maxLength={2000} value={values.comment} onChange={(event) => quiz.set('comment', event.target.value)} className={cn(fieldClass, 'resize-y')} />
                )}
              </Field>
              <Field label="План помещения" optional hint="PDF, JPG, PNG или DWG, до 10 МБ." error={fileError}>
                {(props) => (
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      key={fileKey}
                      {...props}
                      type="file"
                      accept={FILE_ACCEPT}
                      onChange={(event) => quiz.set('file', event.target.files?.[0] ?? null)}
                      className={cn(
                        fieldClass,
                        'min-w-0 flex-1 cursor-pointer p-1.5 text-sm text-fg-muted',
                        'file:mr-3 file:min-h-8 file:cursor-pointer file:rounded-base file:border-0 file:bg-surface-2 file:px-3.5 file:py-1.5 file:text-sm file:font-medium file:text-fg',
                      )}
                    />
                    {values.file ? (
                      <ui.Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          quiz.set('file', null);
                          setFileKey((key) => key + 1);
                        }}
                      >
                        Убрать файл
                      </ui.Button>
                    ) : null}
                  </div>
                )}
              </Field>

              <div data-invalid={errors.consent ? 'true' : undefined}>
                <ConsentField checked={values.consent} error={errors.consent} onChange={(checked) => quiz.set('consent', checked)} variantId={variantId} />
              </div>

              <p className="text-sm text-fg-muted">
                {kp.count
                  ? `К заявке приложим вашу подборку: ${kp.count} из запроса КП.`
                  : 'Подборки товаров нет — это нормально: подберём оборудование сами.'}
              </p>
            </fieldset>
          ) : null}
        </ui.Reveal>

        {status === 'error' ? (
          <div role="alert" className="flex flex-col gap-2 rounded-base border border-[color:var(--danger)] p-4 text-base text-fg">
            <p className="flex items-center gap-2 font-medium">
              <CircleAlert className="size-5 shrink-0 text-[color:var(--danger)]" aria-hidden="true" />
              Заявка не отправилась
            </p>
            <p className="text-pretty">{quiz.error} Введённые данные сохранены.</p>
            <PhoneLine contacts={contacts} className="text-fg" />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {!quiz.isFirst ? (
            <ui.Button variant="ghost" onClick={() => quiz.back()} disabled={submitting}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Назад
            </ui.Button>
          ) : null}
          <ui.Button type="submit" loading={submitting} className="min-w-44">
            {submitting ? 'Отправляем…' : quiz.isLast ? (status === 'error' ? 'Отправить ещё раз' : 'Отправить заявку') : 'Далее'}
            {!submitting && !quiz.isLast ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
          </ui.Button>
        </div>
        {quiz.isLast && status !== 'error' ? <PhoneLine contacts={contacts} /> : null}
      </form>
    </section>
  );
}

function ConsentField({ checked, error, onChange, variantId }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-pretty text-fg">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 size-5 shrink-0"
        />
        <span>
          Согласен на обработку персональных данных (152-ФЗ).{' '}
          <Link to={`/${variantId}/privacy`} target="_blank" rel="noopener" className="underline underline-offset-4 hover:no-underline">
            Политика обработки данных
          </Link>
        </span>
      </label>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
