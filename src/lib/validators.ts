import type { ValidationRule, ValidatorFunction } from '../types/types';

// required - работает с разными типами полей
export const validateRequired: ValidatorFunction = (value, _, field) => {
  if (!field) return true;
  
  // Для чекбоксов
  if (field.type === 'checkbox') {
    return value === true;
  }
  
  // Для массивов (группы чекбоксов)
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  // Для текстовых полей
  return value !== null && value !== undefined && value !== '';
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
  if (value === null || value === undefined || value === '') return true;
  return Number(value) >= Number(min);
};

// max - максимальное числовое значение
export const validateMax: ValidatorFunction = (value, max) => {
  if (value === null || value === undefined || value === '') return true;
  return Number(value) <= Number(max);
};

// pattern - регулярное выражение
export const validatePattern: ValidatorFunction = (value, pattern) => {
  if (!value) return true;
  
  try {
    const regex = new RegExp(String(pattern));
    return regex.test(String(value));
  } catch (error) {
    console.error('FormGuard: Invalid regex pattern:', pattern);
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
  
  // Базовая проверка: цифры, пробелы, скобки, плюс, дефис
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
  return phoneRegex.test(String(value).replace(/\s/g, ''));
};

/**
 * РЕЕСТР ВСЕХ ВАЛИДАТОРОВ
 * Связываем названия правил с функциями
 */
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
};

/**
 * ГЛАВНАЯ ФУНКЦИЯ ВАЛИДАЦИИ ПРАВИЛА
 * Выбирает нужный валидатор по имени правила
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