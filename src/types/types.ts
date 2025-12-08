/* eslint-disable @typescript-eslint/no-explicit-any */

// FORM GUARD - ТИПЫ

// ЛИТЕРАЛЫ И БАЗОВЫЕ ТИПЫ
export type FieldType =
  | "string"
  | "number"
  | "array"
  | "boolean"
  | "email"
  | "tel"
  | "url";

export type ValidationRuleName =
  | "required"
  | "email"
  | "minLength"
  | "maxLength"
  | "min"
  | "max"
  | "pattern"
  | "url"
  | "phone"
  | "custom";

// ОСНОВНЫЕ ИНТЕРФЕЙСЫ ВАЛИДАЦИИ
export interface ValidationRule {
  rule: ValidationRuleName;
  value?: any;
  errorMessage?: string;
  customValidator?: (value: any, field?: HTMLInputElement) => boolean;
}

export interface FieldConfig {
  name: string;
  rules: ValidationRule[];
  customErrorMessage?: string;
  suppressWarnings?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  rule: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface FieldValidity {
  valid: boolean;
  valueMissing?: boolean;
  typeMismatch?: boolean;
  tooShort?: boolean;
  tooLong?: boolean;
  patternMismatch?: boolean;
  rangeUnderflow?: boolean;
  rangeOverflow?: boolean;
  stepMismatch?: boolean;
  badInput?: boolean;
  customError?: boolean;
  emailMismatch?: boolean;
  minLengthMismatch?: boolean;
  maxLengthMismatch?: boolean;
  minValueMismatch?: boolean;
  maxValueMismatch?: boolean;
  phoneMismatch?: boolean;
  urlMismatch?: boolean;
  patternMismatchCustom?: boolean;
  [key: string]: boolean | undefined;
}

export interface FormGuardConfig {
  suppressAllWarnings?: boolean;
  errorClass?: string;
  successClass?: string;
  errorContainerAttribute?: string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  customMessages?: Partial<AttributeMessages>; // Исправлено: Partial
}

export interface AttributeMessages {
  required?: string;
  minlength?: string;
  maxlength?: string;
  min?: string;
  max?: string;
  pattern?: string;
  email?: string;
  url?: string;
  [key: string]: string | undefined; // Исправлено
}

export interface FieldDescriptor {
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  config: FieldConfig;
  lastValue?: any;
  isValid?: boolean;
}

// ТИПЫ ДЛЯ ФУНКЦИЙ
export type ValidatorFunction = (
  value: any,
  ruleValue?: any,
  field?: HTMLInputElement
) => boolean;

export type ErrorMessageResolver = (
  rule: ValidationRule,
  fieldName: string
) => string;

// ТИПЫ ДЛЯ ОБЪЕКТОВ
export type ErrorMessages = {
  [rule in ValidationRuleName]?: string;
};

export type ValidatorsRegistry = {
  [rule: string]: ValidatorFunction;
};

// ТИПЫ ДЛЯ КЛАССА FORM GUARD
export interface IFormGuard {
  addField(fieldName: string, rules: ValidationRule[], options?: { suppressWarnings?: boolean }): IFormGuard;
  validate(): ValidationResult;
  suppressWarnings(suppress?: boolean): IFormGuard;
  getFieldValidity(fieldName: string): FieldValidity;
  clearErrors(): void;
  destroy(): void;
  onSubmit(callback: (result: ValidationResult, event?: SubmitEvent) => void): IFormGuard;
  enableAutoSubmit(): IFormGuard;
  addCustomValidator(ruleName: string, validator: ValidatorFunction): IFormGuard;
  validateField(fieldName: string, showUI?: boolean): boolean;
}

export interface FormGuardConstructor {
  new (form: HTMLFormElement, config?: FormGuardConfig): IFormGuard;
}

// ТИПЫ ДЛЯ DOM ЭЛЕМЕНТОВ
export type FormFieldElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

export interface SingleFieldValidationResult {
  isValid: boolean;
  error?: ValidationError;
  validity: FieldValidity;
}

export type ValidationEventType = "change" | "blur" | "submit";

declare global {
  interface HTMLElement {
    formGuard?: FieldValidity;
    _formGuardListeners?: Map<string, EventListenerOrEventListenerObject>;
  }
}

export interface ExtendedHTMLElement extends HTMLElement {
  formGuard?: FieldValidity;
  _formGuardListeners?: Map<string, EventListenerOrEventListenerObject>;
  type?: string;
  name?: string;
  value?: string;
}