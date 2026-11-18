// Проверки полей заявки; тексты ошибок — по-русски, их показывают у поля.
import { formatPhone, isPhoneComplete } from './phone.js';

export const FILE_LIMIT = { maxBytes: 10 * 1024 * 1024, types: ['application/pdf', 'image/jpeg', 'image/png', '.dwg'] };

const FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'dwg'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** @param {{ name?: string, type?: string, size?: number }|null|undefined} file → null (годится или файла нет) | текст ошибки */
export function validateFile(file) {
  if (!file) return null;
  const name = String(file.name ?? '').toLowerCase();
  const extension = name.includes('.') ? name.split('.').pop() : '';
  const allowedByType = FILE_LIMIT.types.includes(file.type);
  // dwg у браузеров приходит с самыми разными типами или без типа — для него и для файлов без типа смотрим расширение
  if (!allowedByType && !FILE_EXTENSIONS.includes(extension)) return 'Подходят PDF, JPG, PNG и DWG. Этот формат не принимаем.';
  if (file.size === 0) return 'Файл пустой. Выберите другой.';
  if (file.size > FILE_LIMIT.maxBytes) return 'Файл больше 10 МБ. Выберите файл поменьше.';
  return null;
}

/**
 * Поля шага «контакты». Почта необязательна, но если есть — должна быть похожа на адрес.
 * @param {{ name?: string, phone?: string, email?: string, consent?: boolean, file?: object|null }} values
 * @returns {Record<string, string>} поле → текст ошибки; пусто, если всё верно
 */
export function validateContacts(values = {}) {
  const errors = {};
  if (String(values.name ?? '').trim().length < 2) errors.name = 'Укажите имя';
  if (['', '+7'].includes(formatPhone(values.phone))) errors.phone = 'Укажите телефон';
  else if (!isPhoneComplete(values.phone)) errors.phone = 'Введите номер полностью: +7 (XXX) XXX-XX-XX';
  const email = String(values.email ?? '').trim();
  if (email && !EMAIL.test(email)) errors.email = 'Проверьте адрес почты';
  if (values.consent !== true) errors.consent = 'Нужно согласие на обработку персональных данных';
  const fileError = validateFile(values.file);
  if (fileError) errors.file = fileError;
  return errors;
}

/** Ошибки шага квиза по id шага (см. QUIZ_STEPS). */
export function validateStep(stepId, values = {}) {
  switch (stepId) {
    case 'direction':
      return values.direction ? {} : { direction: 'Выберите направление' };
    case 'object':
      return values.objectType ? {} : { objectType: 'Выберите тип объекта' };
    case 'timing':
      return values.timing ? {} : { timing: 'Выберите сроки' };
    case 'contacts':
      return validateContacts(values);
    default:
      return {};
  }
}
