import type { 
  FieldConfig, 
  ValidationRule, 
  ValidationResult, 
  ValidationError,
  FieldValidity,
  FormGuardConfig,
  IFormGuard,
  ExtendedHTMLElement
} from '../types/types';
import { validateRule } from '../lib/validators';
import { 
  getFieldValue, 
  validateFormStructure, 
  findErrorContainer, 
  showError, 
  hideError,
  createErrorMessage,
  checkRuleConflicts
} from '../lib/utils';

/**
 * ОСНОВНОЙ КЛАСС FORM GUARD
 * Реализует всю логику валидации форм
 */
export default class FormGuard implements IFormGuard {
  private form: HTMLFormElement;
  private fields: Map<string, FieldConfig> = new Map();
  private config: Required<FormGuardConfig>;
  
  // Стандартные сообщения об ошибках
  private defaultErrorMessages: Record<string, string> = {
    required: 'Это поле обязательно для заполнения',
    email: 'Введите корректный email адрес',
    minLength: 'Минимальная длина: {value} символов',
    maxLength: 'Максимальная длина: {value} символов',
    min: 'Минимальное значение: {value}',
    max: 'Максимальное значение: {value}',
    pattern: 'Неверный формат',
    url: 'Введите корректный URL',
    phone: 'Введите корректный номер телефона'
  };

  /**
   * КОНСТРУКТОР - создает новый валидатор для формы
   * @param form - HTML форма для валидации
   * @param config - настройки валидатора
   */
  constructor(form: HTMLFormElement, config: FormGuardConfig = {}) {
    // Проверяем что передан именно form элемент
    if (!(form instanceof HTMLFormElement)) {
      throw new Error('FormGuard: переданный элемент не является формой');
    }

    this.form = form;
    
    // Устанавливаем настройки по умолчанию
    this.config = {
      suppressAllWarnings: false,
      errorClass: 'error',
      successClass: 'success',
      errorContainerAttribute: 'data-error-for',
      validateOnChange: false,
      validateOnBlur: false,
      ...config
    };
    
    // Проверяем структуру формы при инициализации
    validateFormStructure(this.form, this.config.errorContainerAttribute);
    
    // Настраиваем live-валидацию если включено
    this.setupLiveValidation();
  }

  /**
   * НАСТРОЙКА LIVE-ВАЛИДАЦИИ (onChange, onBlur)
   */
  private setupLiveValidation(): void {
    if (!this.config.validateOnChange && !this.config.validateOnBlur) {
      return;
    }

    // Валидация при изменении значения
    if (this.config.validateOnChange) {
      this.form.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        if (target && target.name && this.fields.has(target.name)) {
          this.validateField(target.name);
        }
      });
    }

    // Валидация при потере фокуса
    if (this.config.validateOnBlur) {
      this.form.addEventListener('blur', (event) => {
        const target = event.target as HTMLInputElement;
        if (target && target.name && this.fields.has(target.name)) {
          this.validateField(target.name, true);
        }
      }, true);
    }
  }

  /**
   * ДОБАВЛЕНИЕ ПОЛЯ ДЛЯ ВАЛИДАЦИИ
   * @param fieldName - имя поля формы
   * @param rules - массив правил валидации
   * @param options - дополнительные опции (например, подавление предупреждений)
   * @returns this для чейнинга
   */
  addField(fieldName: string, rules: ValidationRule[], options?: { suppressWarnings?: boolean }): this {
    const fieldElement = this.form.elements.namedItem(fieldName);
    
    // Проверяем что поле существует в форме
    if (!fieldElement) {
      throw new Error(`FormGuard: поле "${fieldName}" не найдено в форме`);
    }

    // Проверяем конфликты между HTML и JS правилами (если не подавлены)
    const shouldSuppress = options?.suppressWarnings || this.config.suppressAllWarnings;
    if (!shouldSuppress) {
      checkRuleConflicts(fieldElement as ExtendedHTMLElement, rules);
    }

    // Синхронизируем JS правила с HTML атрибутами
    const synchronizedRules = this.syncWithHTMLAttributes(
      fieldElement as ExtendedHTMLElement, 
      rules
    );

    const fieldConfig: FieldConfig = {
      name: fieldName,
      rules: synchronizedRules
    };

    this.fields.set(fieldName, fieldConfig);
    return this;
  }

  /**
   * СИНХРОНИЗАЦИЯ JS ПРАВИЛ С HTML АТРИБУТАМИ
   * Автоматически добавляет правила из HTML атрибутов
   */
  private syncWithHTMLAttributes(
    field: ExtendedHTMLElement, 
    jsRules: ValidationRule[]
  ): ValidationRule[] {
    const htmlRules: ValidationRule[] = [];
    const mergedRules = [...jsRules];

    // Собираем правила из HTML атрибутов
    if (field.hasAttribute('required')) {
      htmlRules.push({ rule: 'required' });
    }

    const minLength = field.getAttribute('minlength');
    if (minLength) {
      // Исправлено: добавлен radix параметр в parseInt
      htmlRules.push({ rule: 'minLength', value: parseInt(minLength, 10) });
    }
    
    const maxLength = field.getAttribute('maxlength');
    if (maxLength) {
      // Исправлено: добавлен radix параметр в parseInt
      htmlRules.push({ rule: 'maxLength', value: parseInt(maxLength, 10) });
    }

    const min = field.getAttribute('min');
    if (min) {
      htmlRules.push({ rule: 'min', value: parseFloat(min) });
    }

    const max = field.getAttribute('max');
    if (max) {
      htmlRules.push({ rule: 'max', value: parseFloat(max) });
    }

    const pattern = field.getAttribute('pattern');
    if (pattern) {
      htmlRules.push({ rule: 'pattern', value: pattern });
    }

    // Объединяем правила (приоритет у JS правил)
    const resultRules = [...mergedRules];
    htmlRules.forEach(htmlRule => {
      if (!resultRules.find(r => r.rule === htmlRule.rule)) {
        resultRules.push(htmlRule);
      }
    });

    return resultRules;
  }

  /**
   * ВАЛИДАЦИЯ ОДНОГО ПОЛЯ
   * @param fieldName - имя поля для валидации
   * @param showUI - показывать ошибки в интерфейсе
   */
  private validateField(fieldName: string, showUI: boolean = false): boolean {
    const fieldConfig = this.fields.get(fieldName);
    if (!fieldConfig) return true;

    const fieldElement = this.form.elements.namedItem(fieldName) as HTMLInputElement;
    if (!fieldElement) return true;

    const value = getFieldValue(fieldElement);
    let isValid = true;
    let firstErrorRule: ValidationRule | null = null;

    // Проверяем все правила поля
    for (const rule of fieldConfig.rules) {
      if (!validateRule(fieldElement, value, rule)) {
        isValid = false;
        firstErrorRule = rule;
        break; // Останавливаемся на первой ошибке
      }
    }

    // Обновляем UI если нужно
    if (showUI) {
      if (!isValid && firstErrorRule) {
        this.displayFieldError(fieldName, firstErrorRule);
      } else {
        this.clearFieldError(fieldName);
      }
    }

    return isValid;
  }

  /**
   * ОСНОВНАЯ ВАЛИДАЦИЯ ВСЕЙ ФОРМЫ
   * @returns результат валидации с ошибками
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    this.fields.forEach((config, fieldName) => {
      const fieldValidity = this.getFieldValidity(fieldName);
      
      if (!fieldValidity.valid) {
        // Находим первое нарушенное правило
        const violatedRule = config.rules.find(rule => {
          // Проверяем соответствующий флаг в validity
          const flagName = `${rule.rule}Mismatch`;
          return fieldValidity[flagName] === true;
        });

        if (violatedRule) {
          const errorMessage = createErrorMessage(
            violatedRule, 
            fieldName, 
            this.defaultErrorMessages
          );

          errors.push({
            field: fieldName,
            message: errorMessage,
            rule: violatedRule.rule
          });

          // Показываем ошибку в UI
          this.displayFieldError(fieldName, violatedRule);
        }
      } else {
        // Очищаем ошибку если поле валидно
        this.clearFieldError(fieldName);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ПРИВЯЗКА ВАЛИДАЦИИ К SUBMIT ФОРМЫ
   * @param callback - функция обратного вызова с результатом валидации
   * @returns this для чейнинга
   */
  onSubmit(callback: (result: ValidationResult, event?: SubmitEvent) => void): this {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const result = this.validate();
      callback(result, event);
    });
    return this;
  }

  /**
   * АВТОМАТИЧЕСКАЯ ПРИВЯЗКА К SUBMIT
   * Блокирует отправку формы при наличии ошибок
   * @returns this для чейнинга
   */
  enableAutoSubmit(): this {
    this.form.addEventListener('submit', (event) => {
      const result = this.validate();
      if (!result.isValid) {
        event.preventDefault();
      }
    });
    return this;
  }

  /**
   * ПОЛУЧЕНИЕ ОБЪЕКТА ВАЛИДНОСТИ ПОЛЯ
   * @param fieldName - имя поля
   * @returns объект с детальной информацией о валидности
   */
  getFieldValidity(fieldName: string): FieldValidity {
    const fieldElement = this.form.elements.namedItem(fieldName) as HTMLInputElement;
    if (!fieldElement) {
      throw new Error(`FormGuard: поле "${fieldName}" не найдено`);
    }

    const fieldConfig = this.fields.get(fieldName);
    const value = getFieldValue(fieldElement);
    
    // Используем нативный ValidityState если доступен
    // Исправлено: убрали any, используем правильный тип
    const nativeValidity = fieldElement.validity || {} as ValidityState;
    
    // Создаем объект валидности
    const validity: FieldValidity = {
      valid: true,
      // Копируем нативные свойства
      valueMissing: nativeValidity.valueMissing,
      typeMismatch: nativeValidity.typeMismatch,
      patternMismatch: nativeValidity.patternMismatch,
      tooLong: nativeValidity.tooLong,
      tooShort: nativeValidity.tooShort,
      rangeUnderflow: nativeValidity.rangeUnderflow,
      rangeOverflow: nativeValidity.rangeOverflow,
      stepMismatch: nativeValidity.stepMismatch,
      badInput: nativeValidity.badInput,
      customError: nativeValidity.customError
    };

    if (!fieldConfig) {
      validity.valid = !nativeValidity.valid;
      return validity;
    }

    // Проверяем каждое правило и обновляем соответствующие флаги
    let allValid = true;
    
    for (const rule of fieldConfig.rules) {
      const isValid = validateRule(fieldElement, value, rule);
      if (!isValid) {
        allValid = false;
        
        // Устанавливаем кастомный флаг для этого правила
        const mismatchFlag = `${rule.rule}Mismatch` as keyof FieldValidity;
        validity[mismatchFlag] = true;
        
        // Устанавливаем стандартные флаги ValidityState
        switch (rule.rule) {
          case 'required':
            validity.valueMissing = true;
            break;
          case 'email':
          case 'url':
            validity.typeMismatch = true;
            break;
          case 'minLength':
            validity.tooShort = true;
            break;
          case 'maxLength':
            validity.tooLong = true;
            break;
          case 'min':
            validity.rangeUnderflow = true;
            break;
          case 'max':
            validity.rangeOverflow = true;
            break;
          case 'pattern':
            validity.patternMismatch = true;
            break;
        }
      }
    }

    validity.valid = allValid;
    
    // Сохраняем объект валидности в поле для быстрого доступа
    (fieldElement as ExtendedHTMLElement).formGuard = validity;
    
    return validity;
  }

  /**
   * ПОКАЗ ОШИБКИ ПОЛЯ В ИНТЕРФЕЙСЕ
   */
  private displayFieldError(fieldName: string, rule: ValidationRule): void {
    const errorContainer = findErrorContainer(
      fieldName, 
      this.form, 
      this.config.errorContainerAttribute
    );
    
    if (!errorContainer) return;

    const errorMessage = createErrorMessage(
      rule, 
      fieldName, 
      this.defaultErrorMessages
    );

    showError(errorContainer, errorMessage, this.config.errorClass);
  }

  /**
   * ОЧИСТКА ОШИБКИ ПОЛЯ
   */
  private clearFieldError(fieldName: string): void {
    const errorContainer = findErrorContainer(
      fieldName, 
      this.form, 
      this.config.errorContainerAttribute
    );
    
    if (!errorContainer) return;

    hideError(errorContainer, this.config.successClass);
  }

  /**
   * ОТКЛЮЧЕНИЕ ПРЕДУПРЕЖДЕНИЙ В КОНСОЛИ
   * @param suppress - отключить предупреждения
   * @returns this для чейнинга
   */
  suppressWarnings(suppress: boolean = true): this {
    this.config.suppressAllWarnings = suppress;
    return this;
  }

  /**
   * ОЧИСТКА ВСЕХ ОШИБОК В ИНТЕРФЕЙСЕ
   */
  clearErrors(): void {
    this.fields.forEach((_, fieldName) => {
      this.clearFieldError(fieldName);
    });
  }

  /**
   * УНИЧТОЖЕНИЕ ВАЛИДАТОРА (cleanup)
   */
  destroy(): void {
    this.clearErrors();
    this.fields.clear();
    
    // Удаляем все обработчики событий, добавленные на форму
    // Это базовый cleanup, в реальной реализации нужно отслеживать добавленные обработчики
    const newForm = this.form.cloneNode(true) as HTMLFormElement;
    this.form.parentNode?.replaceChild(newForm, this.form);
  }
}