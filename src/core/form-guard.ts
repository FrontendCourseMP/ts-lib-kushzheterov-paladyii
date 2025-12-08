import type {
  FieldConfig,
  ValidationRule,
  ValidationResult,
  ValidationError,
  FieldValidity,
  FormGuardConfig,
  IFormGuard,
  ExtendedHTMLElement,
  AttributeMessages,
  ValidatorFunction, // Добавлен импорт
} from "../types/types";
import { validateRule, validatorsRegistry } from "../lib/validators";
import {
  getFieldValue,
  validateFormStructure,
  findErrorContainer,
  showError,
  hideError,
  createErrorMessage,
  checkRuleConflicts,
} from "../lib/utils";

export default class FormGuard implements IFormGuard {
  private form: HTMLFormElement;
  private fields: Map<string, FieldConfig> = new Map();
  private config: Required<FormGuardConfig>;
  private attributeMessages: AttributeMessages;
  private eventListeners: Map<string, EventListenerOrEventListenerObject> =
    new Map();

  private defaultErrorMessages: Record<string, string> = {
    required: "Это поле обязательно для заполнения",
    email: "Введите корректный email адрес",
    minLength: "Длина должна быть не менее {value} символов",
    maxLength: "Длина должна быть не более {value} символов",
    min: "Значение должно быть не менее {value}",
    max: "Значение должно быть не более {value}",
    pattern: "Неверный формат",
    url: "Введите корректный URL",
    phone: "Введите корректный номер телефона",
    custom: "Некорректное значение",
  };

  constructor(
    form: HTMLFormElement,
    config: FormGuardConfig = {},
    attributeMessages?: AttributeMessages
  ) {
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("FormGuard: переданный элемент не является формой");
    }

    this.form = form;
    this.attributeMessages = attributeMessages || {};

    this.config = {
      suppressAllWarnings: false,
      errorClass: "error",
      successClass: "success",
      errorContainerAttribute: "data-error-for",
      validateOnChange: false,
      validateOnBlur: false,
      customMessages: {},
      ...config,
    };

    this.mergeCustomMessages();
    validateFormStructure(this.form, this.config.errorContainerAttribute);
    this.setupLiveValidation();
  }

private mergeCustomMessages(): void {
  if (this.config.customMessages) {
    // Преобразуем Partial<AttributeMessages> в Record<string, string>
    const customMessages = this.config.customMessages as Record<string, string>;
    
    // Удаляем undefined значения
    const filteredMessages: Record<string, string> = {};
    Object.entries(customMessages).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredMessages[key] = value;
      }
    });
    
    this.defaultErrorMessages = {
      ...this.defaultErrorMessages,
      ...filteredMessages
    };
  }
}

  private setupLiveValidation(): void {
    if (this.config.validateOnChange) {
      // Обработчик для текстовых полей (input event)
      const inputHandler = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target && target.name && this.fields.has(target.name)) {
          this.validateField(target.name, true);
        }
      };
      this.form.addEventListener("input", inputHandler);
      this.eventListeners.set("input", inputHandler);

      // Обработчик для select, checkbox, radio (change event)
      const changeHandler = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target && target.name && this.fields.has(target.name)) {
          this.validateField(target.name, true);
        }
      };
      this.form.addEventListener("change", changeHandler);
      this.eventListeners.set("change", changeHandler);
    }

    if (this.config.validateOnBlur) {
      const blurHandler = (event: Event) => {
        // Исправлено: Event вместо FocusEvent
        const target = event.target as HTMLInputElement;
        if (target && target.name && this.fields.has(target.name)) {
          this.validateField(target.name, true);
        }
      };
      this.form.addEventListener("blur", blurHandler, true);
      this.eventListeners.set("blur", blurHandler);
    }
  }

  addField(
    fieldName: string,
    rules: ValidationRule[],
    options?: { suppressWarnings?: boolean }
  ): this {
    const fieldElement = this.form.elements.namedItem(fieldName);

    if (!fieldElement) {
      throw new Error(`FormGuard: поле "${fieldName}" не найдено в форме`);
    }

    const shouldSuppress =
      options?.suppressWarnings || this.config.suppressAllWarnings;
    if (!shouldSuppress) {
      checkRuleConflicts(fieldElement as ExtendedHTMLElement, rules);
    }

    const synchronizedRules = this.syncWithHTMLAttributes(
      fieldElement as ExtendedHTMLElement,
      rules
    );

    const fieldConfig: FieldConfig = {
      name: fieldName,
      rules: synchronizedRules,
      suppressWarnings: options?.suppressWarnings,
    };

    this.fields.set(fieldName, fieldConfig);

    return this;
  }

  private syncWithHTMLAttributes(
    field: ExtendedHTMLElement,
    jsRules: ValidationRule[]
  ): ValidationRule[] {
    const htmlRules: ValidationRule[] = [];
    const mergedRules = [...jsRules];

    if (!(field instanceof HTMLElement)) {
      return mergedRules;
    }

    if (field.hasAttribute("required")) {
      htmlRules.push({
        rule: "required",
        errorMessage: this.getAttributeErrorMessage("required", field),
      });
    }

    const minLength = field.getAttribute("minlength");
    if (minLength) {
      htmlRules.push({
        rule: "minLength",
        value: parseInt(minLength, 10),
        errorMessage: this.getAttributeErrorMessage("minlength", field),
      });
    }

    const maxLength = field.getAttribute("maxlength");
    if (maxLength) {
      htmlRules.push({
        rule: "maxLength",
        value: parseInt(maxLength, 10),
        errorMessage: this.getAttributeErrorMessage("maxlength", field),
      });
    }

    const min = field.getAttribute("min");
    if (min) {
      htmlRules.push({
        rule: "min",
        value: parseFloat(min),
        errorMessage: this.getAttributeErrorMessage("min", field),
      });
    }

    const max = field.getAttribute("max");
    if (max) {
      htmlRules.push({
        rule: "max",
        value: parseFloat(max),
        errorMessage: this.getAttributeErrorMessage("max", field),
      });
    }

    const pattern = field.getAttribute("pattern");
    if (pattern) {
      htmlRules.push({
        rule: "pattern",
        value: pattern,
        errorMessage: this.getAttributeErrorMessage("pattern", field),
      });
    }

    const type = field.getAttribute("type");
    if (type === "email") {
      htmlRules.push({
        rule: "email",
        errorMessage: this.getAttributeErrorMessage("email", field),
      });
    }

    if (type === "url") {
      htmlRules.push({
        rule: "url",
        errorMessage: this.getAttributeErrorMessage("url", field),
      });
    }

    const resultRules = [...mergedRules];
    htmlRules.forEach((htmlRule) => {
      const existingIndex = resultRules.findIndex(
        (r) => r.rule === htmlRule.rule
      );
      if (existingIndex === -1) {
        resultRules.push(htmlRule);
      }
    });

    return resultRules;
  }

  private getAttributeErrorMessage(
    attribute: string,
    field: ExtendedHTMLElement
  ): string | undefined {
    if (this.attributeMessages[attribute]) {
      return this.attributeMessages[attribute];
    }

    if (this.config.customMessages && this.config.customMessages[attribute]) {
      return this.config.customMessages[attribute];
    }

    const dataMessage = field.getAttribute(`data-${attribute}-message`);
    if (dataMessage) {
      return dataMessage;
    }

    const title = field.getAttribute("title");
    if (title) {
      return title;
    }

    return undefined;
  }

  validateField(fieldName: string, showUI: boolean = false): boolean {
    const fieldConfig = this.fields.get(fieldName);
    if (!fieldConfig) {
      if (!this.config.suppressAllWarnings) {
        console.warn(
          `FormGuard: поле "${fieldName}" не добавлено для валидации`
        );
      }
      return true;
    }

    const fieldElement = this.form.elements.namedItem(
      fieldName
    ) as HTMLInputElement;
    if (!fieldElement) return true;

    const value = getFieldValue(fieldElement);
    let isValid = true;
    let firstErrorRule: ValidationRule | null = null;

    for (const rule of fieldConfig.rules) {
      let ruleValid: boolean;

      if (rule.rule === "custom" && rule.customValidator) {
        ruleValid = rule.customValidator(value, fieldElement);
      } else {
        ruleValid = validateRule(fieldElement, value, rule);
      }

      if (!ruleValid) {
        isValid = false;
        firstErrorRule = rule;
        break;
      }
    }

    if (showUI) {
      if (!isValid && firstErrorRule) {
        this.displayFieldError(fieldName, firstErrorRule);
      } else {
        this.clearFieldError(fieldName);
      }
    }

    return isValid;
  }

  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    this.fields.forEach((config, fieldName) => {
      const fieldValidity = this.getFieldValidity(fieldName);

      if (!fieldValidity.valid) {
        const violatedRule = config.rules.find((rule) => {
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
            rule: violatedRule.rule,
          });

          this.displayFieldError(fieldName, violatedRule);
        }
      } else {
        this.clearFieldError(fieldName);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  onSubmit(
    callback: (result: ValidationResult, event?: SubmitEvent) => void
  ): this {
    const submitHandler = (event: Event) => {
      // Исправлено: Event вместо SubmitEvent
      event.preventDefault();
      const result = this.validate();
      callback(result, event as SubmitEvent);
    };

    this.form.addEventListener("submit", submitHandler);
    this.eventListeners.set("submit", submitHandler);
    return this;
  }

  enableAutoSubmit(): this {
    const submitHandler = (event: Event) => {
      // Исправлено: Event вместо SubmitEvent
      const result = this.validate();
      if (!result.isValid) {
        event.preventDefault();
        this.fields.forEach((_, fieldName) => {
          this.validateField(fieldName, true);
        });
      }
    };

    this.form.addEventListener("submit", submitHandler);
    this.eventListeners.set("submit-auto", submitHandler);
    return this;
  }

  getFieldValidity(fieldName: string): FieldValidity {
    const fieldElement = this.form.elements.namedItem(
      fieldName
    ) as HTMLInputElement;
    if (!fieldElement) {
      throw new Error(`FormGuard: поле "${fieldName}" не найдено`);
    }

    const fieldConfig = this.fields.get(fieldName);
    const value = getFieldValue(fieldElement);

    const nativeValidity = fieldElement.validity || ({} as ValidityState);

    const validity: FieldValidity = {
      valid: true,
      valueMissing: nativeValidity.valueMissing,
      typeMismatch: nativeValidity.typeMismatch,
      patternMismatch: nativeValidity.patternMismatch,
      tooLong: nativeValidity.tooLong,
      tooShort: nativeValidity.tooShort,
      rangeUnderflow: nativeValidity.rangeUnderflow,
      rangeOverflow: nativeValidity.rangeOverflow,
      stepMismatch: nativeValidity.stepMismatch,
      badInput: nativeValidity.badInput,
      customError: nativeValidity.customError,
    };

    if (!fieldConfig) {
      validity.valid = !nativeValidity.valid;
      return validity;
    }

    let allValid = true;

    for (const rule of fieldConfig.rules) {
      let isValid: boolean;

      if (rule.rule === "custom" && rule.customValidator) {
        isValid = rule.customValidator(value, fieldElement);
      } else {
        isValid = validateRule(fieldElement, value, rule);
      }

      if (!isValid) {
        allValid = false;

        const mismatchFlag = `${rule.rule}Mismatch` as keyof FieldValidity;
        validity[mismatchFlag] = true;

        switch (rule.rule) {
          case "required":
            validity.valueMissing = true;
            break;
          case "email":
          case "url":
            validity.typeMismatch = true;
            break;
          case "minLength":
            validity.tooShort = true;
            break;
          case "maxLength":
            validity.tooLong = true;
            break;
          case "min":
            validity.rangeUnderflow = true;
            break;
          case "max":
            validity.rangeOverflow = true;
            break;
          case "pattern":
            validity.patternMismatch = true;
            break;
          case "phone":
            validity.customError = true;
            break;
        }
      }
    }

    validity.valid = allValid;

    (fieldElement as ExtendedHTMLElement).formGuard = validity;

    return validity;
  }

  addCustomValidator(ruleName: string, validator: ValidatorFunction): this {
    if (validatorsRegistry[ruleName] && !this.config.suppressAllWarnings) {
      console.warn(`FormGuard: переопределение валидатора "${ruleName}"`);
    }

    validatorsRegistry[ruleName] = validator;
    return this;
  }

  private displayFieldError(fieldName: string, rule: ValidationRule): void {
    const errorContainer = findErrorContainer(
      fieldName,
      this.form,
      this.config.errorContainerAttribute
    );

    if (!errorContainer) {
      if (!this.config.suppressAllWarnings) {
        console.warn(
          `FormGuard: для поля "${fieldName}" не найден контейнер ошибок`
        );
      }
      return;
    }

    const errorMessage = createErrorMessage(
      rule,
      fieldName,
      this.defaultErrorMessages
    );

    showError(errorContainer, errorMessage, this.config.errorClass);
  }

  private clearFieldError(fieldName: string): void {
    const errorContainer = findErrorContainer(
      fieldName,
      this.form,
      this.config.errorContainerAttribute
    );

    if (!errorContainer) return;

    hideError(errorContainer, this.config.successClass);
  }

  suppressWarnings(suppress: boolean = true): this {
    this.config.suppressAllWarnings = suppress;
    return this;
  }

  clearErrors(): void {
    this.fields.forEach((_, fieldName) => {
      this.clearFieldError(fieldName);
    });
  }

  destroy(): void {
    this.clearErrors();
    this.fields.clear();

    this.eventListeners.forEach((handler, type) => {
      if (type === "blur") {
        this.form.removeEventListener("blur", handler, true);
      } else if (type.startsWith("submit")) {
        this.form.removeEventListener("submit", handler);
      } else {
        this.form.removeEventListener(type, handler);
      }
    });
    this.eventListeners.clear();

    const fields = this.form.querySelectorAll("input, select, textarea");
    fields.forEach((field) => {
      const extendedField = field as ExtendedHTMLElement;
      delete extendedField.formGuard;
      delete extendedField._formGuardListeners;
    });
  }
}
