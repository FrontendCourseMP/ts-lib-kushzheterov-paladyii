/* eslint-disable @typescript-eslint/no-explicit-any */

// FORM GUARD

//  ЛИТЕРАЛЫ И БАЗОВЫЕ ТИПЫ

// Поддерживаемые типы полей формы
export type FieldType =
  | "string"
  | "number"
  | "array"
  | "boolean"
  | "email"
  | "tel"
  | "url";

// Конкретные названия правил валидации для защиты от опечаток
export type ValidationRuleName =
  | "required"
  | "email"
  | "minLength"
  | "maxLength"
  | "min"
  | "max"
  | "pattern"
  | "url"
  | "phone";

//  ОСНОВНЫЕ ИНТЕРФЕЙСЫ ВАЛИДАЦИИ

export interface ValidationRule {
  rule: ValidationRuleName; // Название правила: 'required', 'email', 'minLength' - теперь только конкретные значения
  value?: any;
  errorMessage?: string;
}

export interface FieldConfig {
  name: string;
  rules: ValidationRule[];
  customErrorMessage?: string;
  suppressWarnings?: boolean; // Отключить предупреждения для этого поля
}

export interface ValidationError {
  field: string;
  message: string;
  rule: string; // Какое правило нарушено: 'required', 'email'
}

// Чтобы знать прошла ли форма валидацию и если нет - то какие ошибки
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Это аналог стандартного ValidityState из браузера, но расширенный
export interface FieldValidity {
  valid: boolean;

  // СТАНДАРТНЫЕ СВОЙСТВА из Constraint Validation API
  valueMissing?: boolean; // required поле не заполнено
  typeMismatch?: boolean; // email без @, url без http://
  tooShort?: boolean;
  tooLong?: boolean;
  patternMismatch?: boolean; // не соответствует pattern="..."
  rangeUnderflow?: boolean; // число меньше min
  rangeOverflow?: boolean; // число больше max
  stepMismatch?: boolean; // не соответствует step
  badInput?: boolean; // некорректный ввод (буквы в number)
  customError?: boolean; // установлена кастомная ошибка

  // КАСТОМНЫЕ СВОЙСТВА для наших правил
  emailMismatch?: boolean; // нарушено правило email
  minLengthMismatch?: boolean; // нарушено minLength
  maxLengthMismatch?: boolean; // нарушено maxLength
  minValueMismatch?: boolean; // нарушено min
  maxValueMismatch?: boolean; // нарушено max

  // ДЛЯ РАСШИРЕНИЯ: любые другие правила
  [key: string]: boolean | undefined;
}

// Глобальные настройки поведения валидатора
export interface FormGuardConfig {
  suppressAllWarnings?: boolean; // ОТВЕТ на требование "опцию для подавления"
  errorClass?: string;
  successClass?: string;
  errorContainerAttribute?: string; // Атрибут для контейнеров ошибок
  validateOnChange?: boolean; // Валидировать при вводе
  validateOnBlur?: boolean; // Валидировать при потере фокуса
}

// Хранит ссылки на DOM элементы и состояние валидации
export interface FieldDescriptor {
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  config: FieldConfig;
  lastValue?: any; // Для отслеживания изменений
  isValid?: boolean; // Текущий статус
}

//  ТИПЫ ДЛЯ ФУНКЦИЙ

// Тип для функций валидации - каждая проверяет одно правило
export type ValidatorFunction = (
  value: any,
  ruleValue?: any,
  field?: HTMLInputElement
) => boolean;

// Функция для создания кастомных сообщений об ошибках
export type ErrorMessageResolver = (
  rule: ValidationRule,
  fieldName: string
) => string;

//  ТИПЫ ДЛЯ ОБЪЕКТОВ

// Объект со стандартными сообщениями об ошибках для разных правил
export type ErrorMessages = {
  [rule in ValidationRuleName]?: string;
};

// Реестр всех доступных валидаторов
export type ValidatorsRegistry = {
  [rule in ValidationRuleName]?: ValidatorFunction;
};

//  ТИПЫ ДЛЯ КЛАССА FORM GUARD

// Интерфейс главного класса валидатора - описывает все публичные методы
export interface IFormGuard {
  // ОСНОВНЫЕ МЕТОДЫ ИЗ ЗАДАНИЯ
  addField(fieldName: string, rules: ValidationRule[], options?: { suppressWarnings?: boolean }): IFormGuard;
  validate(): ValidationResult;
  suppressWarnings(suppress?: boolean): IFormGuard;

  // ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ
  getFieldValidity(fieldName: string): FieldValidity; // ОТВЕТ на вопрос "validity объект как достать"
  clearErrors(): void;
  destroy(): void;
  
  // НОВЫЕ МЕТОДЫ для привязки к событиям
  onSubmit(callback: (result: ValidationResult, event?: SubmitEvent) => void): IFormGuard;
  enableAutoSubmit(): IFormGuard;
}

// Тип конструктора для создания new FormGuard(HTMLFormElement)
export interface FormGuardConstructor {
  new (form: HTMLFormElement, config?: FormGuardConfig): IFormGuard;
}

//  ТИПЫ ДЛЯ DOM ЭЛЕМЕНТОВ

// Все поддерживаемые элементы формы
export type FormFieldElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

//  ВСПОМОГАТЕЛЬНЫЕ ТИПЫ

// Результат валидации одного поля
export interface SingleFieldValidationResult {
  isValid: boolean;
  error?: ValidationError;
  validity: FieldValidity;
}

// Типы событий для live-валидации
export type ValidationEventType = "change" | "blur" | "submit";

// Глобальное расширение для хранения validity объекта в DOM элементах
declare global {
  interface HTMLElement {
    formGuard?: FieldValidity; // Позволяет прикреплять объект валидности к элементам
  }
}

// Тип для элемента с расширенными свойствами
export interface ExtendedHTMLElement extends HTMLElement {
  formGuard?: FieldValidity;
  type?: string;
  name?: string;
}