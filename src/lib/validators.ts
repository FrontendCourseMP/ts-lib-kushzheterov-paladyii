/**
 * Функции валидации для FormGuard
 *
 * Этот модуль содержит все встроенные валидаторы для различных типов проверок:
 * - Обязательные поля (required)
 * - Форматы данных (email, url, phone, pattern)
 * - Ограничения длины (minLength, maxLength)
 * - Числовые ограничения (min, max)
 * - Специализированные валидаторы (numeric, integer, alphanumeric)
 * - Валидаторы массивов (arrayMin, arrayMax)
 * - Сравнение полей (equalTo)
 *
 * Все валидаторы возвращают true для успешной валидации и false для ошибки.
 * Пустые значения (null, undefined, "") обычно считаются валидными.
 */

import type { ValidationRule, ValidatorFunction } from "../types/types";

// required - работает с разными типами полей
export const validateRequired: ValidatorFunction = (value, _, field) => {
  if (!field) return true;

  // Для чекбоксов
  if (field.type === "checkbox") {
    return value === true;
  }

  // Для массивов (группы чекбоксов)
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  // Для текстовых полей
  return value !== null && value !== undefined && value !== "";
};

// email - валидация email
export const validateEmail: ValidatorFunction = (value) => {
  if (!value) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(value));
};

// minLength - минимальная длина
export const validateMinLength: ValidatorFunction = (value, minLength) => {
  if (!value) return true;

  if (Array.isArray(value)) {
    return value.length >= Number(minLength);
  }

  return String(value).length >= Number(minLength);
};

// maxLength - максимальная длина
export const validateMaxLength: ValidatorFunction = (value, maxLength) => {
  if (!value) return true;

  if (Array.isArray(value)) {
    return value.length <= Number(maxLength);
  }

  return String(value).length <= Number(maxLength);
};

// min - минимальное числовое значение
export const validateMin: ValidatorFunction = (value, min) => {
  if (value === null || value === undefined || value === "") return true;
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= Number(min);
};

// max - максимальное числовое значение
export const validateMax: ValidatorFunction = (value, max) => {
  if (value === null || value === undefined || value === "") return true;
  const num = Number(value);
  if (isNaN(num)) return false;
  return num <= Number(max);
};

// pattern - регулярное выражение
export const validatePattern: ValidatorFunction = (value, pattern) => {
  if (!value) return true;

  try {
    const regex = new RegExp(String(pattern));
    return regex.test(String(value));
  } catch (error) {
    console.error("FormGuard: Invalid regex pattern:", pattern);
    return false;
  }
};

// url - валидация URL
export const validateUrl: ValidatorFunction = (value) => {
  if (!value) return true;

  try {
    new URL(String(value));
    return true;
  } catch {
    return false;
  }
};

// phone - базовая валидация телефона
export const validatePhone: ValidatorFunction = (value) => {
  if (!value) return true;

  // Убираем все пробелы, скобки, дефисы для проверки
  const cleaned = String(value).replace(/[\s\-\(\)]/g, "");

  // Проверяем что остались только цифры и возможно + в начале
  if (!/^\+?\d+$/.test(cleaned)) {
    return false;
  }

  // Проверяем минимальную длину (например, 10 цифр для международных номеров)
  const digitsOnly = cleaned.replace("+", "");
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

// ДОПОЛНИТЕЛЬНЫЕ ВАЛИДАТОРЫ:

// arrayMin - минимальное количество элементов в массиве
export const validateArrayMin: ValidatorFunction = (value, min) => {
  if (!value) return true;

  const array = Array.isArray(value) ? value : [value];
  return array.length >= Number(min);
};

// arrayMax - максимальное количество элементов в массиве
export const validateArrayMax: ValidatorFunction = (value, max) => {
  if (!value) return true;

  const array = Array.isArray(value) ? value : [value];
  return array.length <= Number(max);
};

// equalTo - проверка равенства с другим полем
export const validateEqualTo: ValidatorFunction = (
  value,
  otherFieldName,
  field
) => {
  if (!field || !field.form) return true;

  const otherField = field.form.elements.namedItem(
    String(otherFieldName)
  ) as HTMLInputElement;
  if (!otherField) {
    console.warn(
      `FormGuard: поле "${otherFieldName}" не найдено для сравнения`
    );
    return true;
  }

  return value === getFieldValue(otherField);
};

// numeric - проверка что значение числовое
export const validateNumeric: ValidatorFunction = (value) => {
  if (!value) return true;
  return !isNaN(Number(value)) && isFinite(Number(value));
};

// integer - проверка что значение целое число
export const validateInteger: ValidatorFunction = (value) => {
  if (!value) return true;
  return Number.isInteger(Number(value));
};

// alphanumeric - только буквы и цифры
export const validateAlphanumeric: ValidatorFunction = (value) => {
  if (!value) return true;
  return /^[a-zA-Z0-9]+$/.test(String(value));
};

// РЕЕСТР ВСЕХ ВАЛИДАТОРОВ
export const validatorsRegistry: Record<string, ValidatorFunction> = {
  required: validateRequired,
  email: validateEmail,
  minLength: validateMinLength,
  maxLength: validateMaxLength,
  min: validateMin,
  max: validateMax,
  pattern: validatePattern,
  url: validateUrl,
  phone: validatePhone,
  arrayMin: validateArrayMin,
  arrayMax: validateArrayMax,
  equalTo: validateEqualTo,
  numeric: validateNumeric,
  integer: validateInteger,
  alphanumeric: validateAlphanumeric,
};

/**
 * ГЛАВНАЯ ФУНКЦИЯ ВАЛИДАЦИИ ПРАВИЛА
 */
export function validateRule(
  field: HTMLInputElement,
  value: any,
  rule: ValidationRule
): boolean {
  const validator = validatorsRegistry[rule.rule];

  if (!validator) {
    console.warn(`FormGuard: Unknown validation rule: ${rule.rule}`);
    return true;
  }

  return validator(value, rule.value, field);
}

/**
 * ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ЗНАЧЕНИЯ ПОЛЯ
 * (используется в validateEqualTo)
 */
function getFieldValue(field: HTMLInputElement): any {
  switch (field.type) {
    case "checkbox":
      return field.checked;
    case "radio":
      return field.checked ? field.value : "";
    case "number":
      const numValue = field.valueAsNumber;
      return isNaN(numValue) ? NaN : numValue;
    default:
      return field.value;
  }
}
