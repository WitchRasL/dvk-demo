import { describe, expect, it } from 'vitest';
import { FILE_LIMIT, formatPhone, isPhoneComplete, validateContacts, validateFile } from './index.js';

describe('formatPhone', () => {
  it.each([
    ['', ''],
    [null, ''],
    [undefined, ''],
    ['abc', ''],
    ['+', ''],
    ['8', '+7'],
    ['7', '+7'],
    ['+7', '+7'],
    ['+7 (', '+7'],
    ['9', '+7 (9'],
    ['89', '+7 (9'],
    ['+7 9', '+7 (9'],
    ['912', '+7 (912'],
    ['9123', '+7 (912) 3'],
    ['912345', '+7 (912) 345'],
    ['9123456', '+7 (912) 345-6'],
    ['91234567', '+7 (912) 345-67'],
    ['912345678', '+7 (912) 345-67-8'],
    ['9123456789', '+7 (912) 345-67-89'],
  ])('по мере ввода %j → %j', (raw, expected) => {
    expect(formatPhone(raw)).toBe(expected);
  });

  it('8 и 7 в начале превращаются в +7, любое оформление приводится к маске', () => {
    expect(formatPhone('8 (912) 345-67-89')).toBe('+7 (912) 345-67-89');
    expect(formatPhone('+79123456789')).toBe('+7 (912) 345-67-89');
    expect(formatPhone('79123456789')).toBe('+7 (912) 345-67-89');
  });

  it('повторное форматирование ничего не меняет', () => {
    expect(formatPhone('+7 (912) 345-67-89')).toBe('+7 (912) 345-67-89');
    expect(formatPhone('+7 (912) 3')).toBe('+7 (912) 3');
  });

  it('лишние цифры отбрасываются', () => {
    expect(formatPhone('89123456789012')).toBe('+7 (912) 345-67-89');
  });

  it('стирание по одному символу не залипает на разделителях', () => {
    // Пользователь стирает последний символ строки «+7 (912) 3»: остаётся «+7 (912) ».
    expect(formatPhone('+7 (912) ')).toBe('+7 (912');
    expect(formatPhone('+7 (91')).toBe('+7 (91');
    expect(formatPhone('+7 (')).toBe('+7');
    expect(formatPhone('+')).toBe('');
  });
});

describe('isPhoneComplete', () => {
  it('нужны ровно 10 цифр после 7/8', () => {
    expect(isPhoneComplete('+7 (912) 345-67-89')).toBe(true);
    expect(isPhoneComplete('89123456789')).toBe(true);
    expect(isPhoneComplete('9123456789')).toBe(true);
    expect(isPhoneComplete('+7 (912) 345-67-8')).toBe(false);
    expect(isPhoneComplete('+7')).toBe(false);
    expect(isPhoneComplete('')).toBe(false);
    expect(isPhoneComplete(undefined)).toBe(false);
    expect(isPhoneComplete('89123456789012')).toBe(false);
  });
});

describe('validateContacts', () => {
  const valid = { name: 'Анна', phone: '+7 (912) 345-67-89', email: '', consent: true };

  it('пустая форма: имя, телефон и согласие — ошибки по-русски, почта необязательна', () => {
    const errors = validateContacts({});
    expect(Object.keys(errors).sort()).toEqual(['consent', 'name', 'phone']);
    expect(errors.name).toMatch(/имя/i);
    expect(errors.phone).toMatch(/телефон/i);
    expect(errors.consent).toMatch(/согласи/i);
  });

  it('верно заполненная форма — без ошибок', () => {
    expect(validateContacts(valid)).toEqual({});
    expect(validateContacts({ ...valid, email: 'anna@example.ru' })).toEqual({});
  });

  it('без согласия отправка недоступна', () => {
    expect(validateContacts({ ...valid, consent: false }).consent).toMatch(/согласи/i);
    expect(validateContacts({ ...valid, consent: 'on' }).consent).toMatch(/согласи/i);
  });

  it('неполный телефон — отдельная ошибка с подсказкой формата', () => {
    const errors = validateContacts({ ...valid, phone: '+7 (912) 3' });
    expect(errors.phone).toMatch(/полностью/i);
    expect(errors.phone).toContain('+7 (XXX) XXX-XX-XX');
  });

  it('имя из пробелов или одной буквы не годится', () => {
    expect(validateContacts({ ...valid, name: '   ' }).name).toBeDefined();
    expect(validateContacts({ ...valid, name: 'А' }).name).toBeDefined();
  });

  it('почта проверяется, только если заполнена', () => {
    expect(validateContacts({ ...valid, email: 'не-почта' }).email).toMatch(/почт/i);
    expect(validateContacts({ ...valid, email: 'a@b' }).email).toBeDefined();
    expect(validateContacts({ ...valid, email: '  ' }).email).toBeUndefined();
  });

  it('ошибка файла попадает в тот же набор', () => {
    const big = { name: 'plan.pdf', type: 'application/pdf', size: FILE_LIMIT.maxBytes + 1 };
    expect(validateContacts({ ...valid, file: big }).file).toMatch(/10 МБ/);
    expect(validateContacts({ ...valid, file: null })).toEqual({});
  });
});

describe('validateFile', () => {
  const file = (name, type, size = 1024) => ({ name, type, size });

  it('файл необязателен', () => {
    expect(validateFile(null)).toBeNull();
    expect(validateFile(undefined)).toBeNull();
  });

  it('до 10 МБ: pdf, jpg, png и dwg принимаются', () => {
    expect(FILE_LIMIT.maxBytes).toBe(10 * 1024 * 1024);
    expect(validateFile(file('plan.pdf', 'application/pdf'))).toBeNull();
    expect(validateFile(file('plan.jpg', 'image/jpeg'))).toBeNull();
    expect(validateFile(file('plan.png', 'image/png'))).toBeNull();
    expect(validateFile(file('plan.dwg', ''))).toBeNull();
    expect(validateFile(file('PLAN.DWG', 'application/acad'))).toBeNull();
    expect(validateFile(file('photo.jpeg', ''))).toBeNull();
  });

  it('ровно 10 МБ ещё можно, на байт больше — нельзя', () => {
    expect(validateFile(file('plan.pdf', 'application/pdf', 10 * 1024 * 1024))).toBeNull();
    expect(validateFile(file('plan.pdf', 'application/pdf', 10 * 1024 * 1024 + 1))).toMatch(/10 МБ/);
  });

  it('другие форматы и пустой файл — понятная ошибка', () => {
    expect(validateFile(file('setup.exe', 'application/x-msdownload'))).toMatch(/PDF, JPG, PNG и DWG/);
    expect(validateFile(file('notes.txt', 'text/plain'))).toMatch(/PDF, JPG, PNG и DWG/);
    expect(validateFile(file('plan.pdf', 'application/pdf', 0))).toMatch(/пуст/i);
  });

  it('работает и с настоящим File', () => {
    expect(validateFile(new File(['x'], 'plan.png', { type: 'image/png' }))).toBeNull();
    expect(validateFile(new File(['x'], 'plan.zip', { type: 'application/zip' }))).not.toBeNull();
  });
});
