import type { FormFieldElement, ValidationRule, ExtendedHTMLElement } from '../types/types';

/**
 * УТИЛИТЫ ДЛЯ РАБОТЫ С DOM И ФОРМАМИ
 */

export function getFieldValue(
  field: FormFieldElement
): string | number | string[] | boolean | File[] {
  // ГРУППЫ ЧЕКБОКСОВ (массивы)
  if (field.type === 'checkbox' && field.name && field.name.includes('[]')) {
    const form = field.closest('form');
    if (!form) return [];
    
    const checkboxes = form.querySelectorAll<HTMLInputElement>(
      `input[name="${field.name}"]:checked`
    );
    return Array.from(checkboxes).map(cb => cb.value);
  }
  
  // ОДИНОЧНЫЕ ЧЕКБОКСЫ
  if (field.type === 'checkbox') {
    return (field as HTMLInputElement).checked;
  }
  
  // РАДИО-КНОПКИ
  if (field.type === 'radio') {
    const form = field.closest('form');
    if (!form) return '';
    
    const selected = form.querySelector<HTMLInputElement>(
      `input[name="${field.name}"]:checked`
    );
    return selected ? selected.value : '';
  }
  
  // ЧИСЛОВЫЕ ПОЛЯ
  if (field.type === 'number' || field.type === 'range') {
    const numValue = (field as HTMLInputElement).valueAsNumber;
    return isNaN(numValue) ? '' : numValue;
  }
  
  // SELECT MULTIPLE
  if (field instanceof HTMLSelectElement && field.multiple) {
    return Array.from(field.selectedOptions).map(option => option.value);
  }
  
  // ФАЙЛОВЫЕ ПОЛЯ
  if (field.type === 'file') {
    const fileInput = field as HTMLInputElement;
    return fileInput.files ? Array.from(fileInput.files) : [];
  }
  
  // ВСЕ ОСТАЛЬНЫЕ ПОЛЯ
  return field.value;
}

export function findErrorContainer(
  fieldName: string, 
  form: HTMLFormElement, 
  errorContainerAttribute: string = 'data-error-for'
): HTMLElement | null {
  const container = form.querySelector(`[${errorContainerAttribute}="${fieldName}"]`);
  if (container) return container as HTMLElement;
  
  const idContainer = form.querySelector(`#${fieldName}-error`);
  if (idContainer) return idContainer as HTMLElement;
  
  const field = form.elements.namedItem(fieldName);
  if (field && field instanceof HTMLElement) {
    const nextError = field.nextElementSibling;
    if (nextError && nextError.classList.contains('error')) {
      return nextError as HTMLElement;
    }
  }
  
  return null;
}

export function findFieldLabel(
  fieldName: string, 
  form: HTMLFormElement
): HTMLLabelElement | null {
  const labelWithFor = form.querySelector(`label[for="${fieldName}"]`);
  if (labelWithFor) return labelWithFor as HTMLLabelElement;
  
  const field = form.elements.namedItem(fieldName);
  if (field && field instanceof HTMLElement) {
    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel as HTMLLabelElement;
  }
  
  return null;
}

export function showError(
  container: HTMLElement, 
  message: string, 
  errorClass: string = 'error'
): void {
  container.textContent = message;
  container.classList.add(errorClass);
  container.classList.remove('success', 'valid');
  container.style.display = 'block';
  
  const fieldName = container.getAttribute('data-error-for');
  if (!fieldName) {
    const id = container.id;
    if (id && id.endsWith('-error')) {
      const possibleFieldName = id.replace('-error', '');
      addErrorClassToField(possibleFieldName, container, errorClass);
    }
  } else {
    addErrorClassToField(fieldName, container, errorClass);
  }
}

function addErrorClassToField(fieldName: string, container: HTMLElement, errorClass: string): void {
  const form = container.closest('form');
  if (!form) return;
  
  const field = form.elements.namedItem(fieldName);
  if (field && field instanceof HTMLElement) {
    field.classList.add(errorClass);
    field.classList.remove('success', 'valid');
    field.setAttribute('aria-invalid', 'true');
    
    const errorId = container.id || `${fieldName}-error`;
    if (!container.id) {
      container.id = errorId;
    }
    
    const describedBy = field.getAttribute('aria-describedby') || '';
    if (!describedBy.includes(errorId)) {
      field.setAttribute('aria-describedby', 
        describedBy ? `${describedBy} ${errorId}` : errorId
      );
    }
  }
}

export function hideError(
  container: HTMLElement, 
  successClass: string = 'success'
): void {
  container.textContent = '';
  container.classList.remove('error', 'invalid');
  container.classList.add(successClass);
  container.style.display = 'none';
  
  const fieldName = container.getAttribute('data-error-for');
  if (!fieldName) {
    const id = container.id;
    if (id && id.endsWith('-error')) {
      const possibleFieldName = id.replace('-error', '');
      removeErrorClassFromField(possibleFieldName, container, successClass);
    }
  } else {
    removeErrorClassFromField(fieldName, container, successClass);
  }
}

function removeErrorClassFromField(fieldName: string, container: HTMLElement, successClass: string): void {
  const form = container.closest('form');
  if (!form) return;
  
  const field = form.elements.namedItem(fieldName);
  if (field && field instanceof HTMLElement) {
    field.classList.remove('error', 'invalid');
    field.classList.add(successClass);
    
    const hasErrors = form.querySelector(`[data-error-for="${fieldName}"].error`);
    if (!hasErrors) {
      field.setAttribute('aria-invalid', 'false');
    }
  }
}

export function validateFormStructure(
  form: HTMLFormElement,
  errorContainerAttribute: string = 'data-error-for'
): void {
  const fields = form.querySelectorAll<FormFieldElement>(
    'input, select, textarea'
  );

  fields.forEach(field => {
    const name = field.name;
    if (!name) {
      console.warn('FormGuard: поле без имени будет проигнорировано', field);
      return;
    }

    const label = findFieldLabel(name, form);
    if (!label) {
      console.warn(`FormGuard: для поля "${name}" не найден связанный label`);
    }

    const errorContainer = findErrorContainer(name, form, errorContainerAttribute);
    if (!errorContainer) {
      console.warn(`FormGuard: для поля "${name}" не найден контейнер ошибок с атрибутом [${errorContainerAttribute}="${name}"]`);
    }
  });
}

export function createErrorMessage(
  rule: ValidationRule,
  fieldName: string,
  defaultMessages: Record<string, string> = {}
): string {
  if (rule.errorMessage) {
    return rule.errorMessage;
  }
  
  const defaultMessage = defaultMessages[rule.rule];
  if (defaultMessage) {
    return defaultMessage.replace(/{value}/g, String(rule.value || ''));
  }
  
  return `Ошибка валидации поля "${fieldName}" по правилу: ${rule.rule}`;
}

export function checkRuleConflicts(
  field: ExtendedHTMLElement,
  jsRules: ValidationRule[],
  suppressWarnings: boolean = false
): void {
  if (suppressWarnings) return;
  
  const htmlRules: ValidationRule[] = [];
  
  if (field.hasAttribute('required')) {
    htmlRules.push({ rule: 'required' });
  }
  
  const minLength = field.getAttribute('minlength');
  if (minLength) {
    htmlRules.push({ rule: 'minLength', value: parseInt(minLength, 10) });
  }
  
  const maxLength = field.getAttribute('maxlength');
  if (maxLength) {
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
  
  const type = field.getAttribute('type');
  if (type === 'email') {
    htmlRules.push({ rule: 'email' });
  }
  
  if (type === 'url') {
    htmlRules.push({ rule: 'url' });
  }
  
  htmlRules.forEach(htmlRule => {
    const jsRule = jsRules.find(r => r.rule === htmlRule.rule);
    if (jsRule && jsRule.value !== htmlRule.value) {
      console.warn(
        `FormGuard: конфликт правил для поля "${field.getAttribute('name')}". ` +
        `HTML: ${htmlRule.rule}=${htmlRule.value}, JS: ${jsRule.rule}=${jsRule.value}`
      );
    }
  });
}

export function createErrorContainerIfNeeded(
  fieldName: string,
  form: HTMLFormElement,
  errorContainerAttribute: string = 'data-error-for'
): HTMLElement {
  const existing = findErrorContainer(fieldName, form, errorContainerAttribute);
  if (existing) return existing;
  
  const field = form.elements.namedItem(fieldName);
  if (!field || !(field instanceof HTMLElement)) {
    throw new Error(`Поле "${fieldName}" не найдено`);
  }
  
  const errorContainer = document.createElement('div');
  errorContainer.setAttribute(errorContainerAttribute, fieldName);
  errorContainer.id = `${fieldName}-error`;
  errorContainer.classList.add('error-container');
  errorContainer.style.display = 'none';
  
  field.parentNode?.insertBefore(errorContainer, field.nextSibling);
  return errorContainer;
}