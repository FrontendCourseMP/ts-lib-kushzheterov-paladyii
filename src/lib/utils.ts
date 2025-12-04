import type { FormFieldElement, ValidationRule, ExtendedHTMLElement } from '../types/types';

/**
 * УТИЛИТЫ ДЛЯ РАБОТЫ С DOM И ФОРМАМИ
 * Вспомогательные функции для основной логики
 */

/**
 * ПОЛУЧЕНИЕ ЗНАЧЕНИЯ ПОЛЯ С УЧЕТОМ ЕГО ТИПА
 * Обрабатывает: текстовые поля, числа, чекбоксы, массивы чекбоксов
 */
export function getFieldValue(
  field: FormFieldElement
): string | number | string[] | boolean {
  //  ГРУППЫ ЧЕКБОКСОВ (массивы) - возвращаем массив значений
  if (field.type === 'checkbox' && field.name.includes('[]')) {
    const form = field.closest('form');
    if (!form) return [];
    
    const checkboxes = form.querySelectorAll<HTMLInputElement>(
      `input[name="${field.name}"]:checked`
    );
    return Array.from(checkboxes).map(cb => cb.value);
  }
  
  //  ОДИНОЧНЫЕ ЧЕКБОКСЫ - возвращаем boolean
  if (field.type === 'checkbox') {
    return (field as HTMLInputElement).checked;
  }
  
  //  РАДИО-КНОПКИ - возвращаем значение выбранной
  if (field.type === 'radio') {
    const form = field.closest('form');
    if (!form) return '';
    
    const selected = form.querySelector<HTMLInputElement>(
      `input[name="${field.name}"]:checked`
    );
    return selected ? selected.value : '';
  }
  
  //  ЧИСЛОВЫЕ ПОЛЯ - возвращаем number
  if (field.type === 'number' || field.type === 'range') {
    const numValue = (field as HTMLInputElement).valueAsNumber;
    return isNaN(numValue) ? '' : numValue;
  }
  
  //  SELECT MULTIPLE - возвращаем массив выбранных значений
  if (field instanceof HTMLSelectElement && field.multiple) {
    return Array.from(field.selectedOptions).map(option => option.value);
  }
  
  //  ВСЕ ОСТАЛЬНЫЕ ПОЛЯ - возвращаем string
  return field.value;
}

/**
 * ПОИСК КОНТЕЙНЕРА ДЛЯ ОШИБОК ПОЛЯ
 * Ищет элемент с атрибутом data-error-for="fieldName"
 */
export function findErrorContainer(
  fieldName: string, 
  form: HTMLFormElement, 
  errorContainerAttribute: string = 'data-error-for'
): HTMLElement | null {
  return form.querySelector(`[${errorContainerAttribute}="${fieldName}"]`);
}

/**
 * ПОИСК СВЯЗАННОГО LABEL ДЛЯ ПОЛЯ
 * Ищет <label for="fieldName"> или родительский <label>
 */
export function findFieldLabel(
  fieldName: string, 
  form: HTMLFormElement
): HTMLLabelElement | null {
  // Ищем label с атрибутом for
  const labelWithFor = form.querySelector(`label[for="${fieldName}"]`);
  if (labelWithFor) return labelWithFor as HTMLLabelElement;
  
  // Ищем поле и проверяем родительский label
  const field = form.elements.namedItem(fieldName);
  if (field && field instanceof HTMLElement) {
    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel as HTMLLabelElement;
  }
  
  return null;
}

/**
 * ПОКАЗ СООБЩЕНИЯ ОБ ОШИБКЕ В ИНТЕРФЕЙСЕ
 * Добавляет текст ошибки и CSS классы
 */
export function showError(
  container: HTMLElement, 
  message: string, 
  errorClass: string = 'error'
): void {
  container.textContent = message;
  container.classList.add(errorClass);
  container.classList.remove('success');
  container.style.display = 'block';
  
  // Также добавляем класс к самому полю
  const fieldName = container.getAttribute('data-error-for');
  if (fieldName) {
    const field = container.closest('form')?.elements.namedItem(fieldName);
    if (field && field instanceof HTMLElement) {
      field.classList.add(errorClass);
    }
  }
}

/**
 * СКРЫТИЕ ОШИБКИ И ПОКАЗ УСПЕШНОГО СОСТОЯНИЯ
 * Очищает сообщение и добавляет success класс
 */
export function hideError(
  container: HTMLElement, 
  successClass: string = 'success'
): void {
  container.textContent = '';
  container.classList.remove('error');
  container.classList.add(successClass);
  container.style.display = 'none';
  
  // Убираем класс ошибки с поля
  const fieldName = container.getAttribute('data-error-for');
  if (fieldName) {
    const field = container.closest('form')?.elements.namedItem(fieldName);
    if (field && field instanceof HTMLElement) {
      field.classList.remove('error');
      field.classList.add(successClass);
    }
  }
}

/**
 * ПРОВЕРКА СТРУКТУРЫ ФОРМЫ ПРИ ИНИЦИАЛИЗАЦИИ
 * Проверяет наличие полей, label и контейнеров ошибок
 * Выводит предупреждения в консоль
 */
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

    // Проверка наличия связанного label
    const label = findFieldLabel(name, form);
    if (!label) {
      console.warn(`FormGuard: для поля "${name}" не найден связанный label`);
    }

    // Проверка наличия контейнера для ошибок
    const errorContainer = findErrorContainer(name, form, errorContainerAttribute);
    if (!errorContainer) {
      console.warn(`FormGuard: для поля "${name}" не найден контейнер ошибок с атрибутом [${errorContainerAttribute}="${name}"]`);
    }
  });
}

/**
 * СОЗДАНИЕ СООБЩЕНИЯ ОБ ОШИБКЕ
 * Использует кастомное сообщение или стандартное с подстановкой значений
 */
export function createErrorMessage(
  rule: ValidationRule,
  fieldName: string,
  defaultMessages: Record<string, string> = {}
): string {
  // Если есть кастомное сообщение - используем его
  if (rule.errorMessage) {
    return rule.errorMessage;
  }
  
  // Ищем стандартное сообщение для этого правила
  const defaultMessage = defaultMessages[rule.rule];
  if (defaultMessage) {
    // Заменяем плейсхолдер {value} на актуальное значение
    return defaultMessage.replace('{value}', String(rule.value || ''));
  }
  
  // Сообщение по умолчанию
  return `Ошибка валидации поля "${fieldName}" по правилу: ${rule.rule}`;
}

/**
 * ПРОВЕРКА КОНФЛИКТА ПРАВИЛ
 * Сравнивает HTML атрибуты с JS правилами и выводит предупреждения
 */
export function checkRuleConflicts(
  field: ExtendedHTMLElement,
  jsRules: ValidationRule[],
  suppressWarnings: boolean = false
): void {
  if (suppressWarnings) return;
  
  const htmlRules: ValidationRule[] = [];
  
  // Собираем правила из HTML атрибутов
  if (field.hasAttribute('required')) {
    htmlRules.push({ rule: 'required' });
  }
  
  const minLength = field.getAttribute('minlength');
  if (minLength) {
    htmlRules.push({ rule: 'minLength', value: parseInt(minLength) });
  }
  
  const maxLength = field.getAttribute('maxlength');
  if (maxLength) {
    htmlRules.push({ rule: 'maxLength', value: parseInt(maxLength) });
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
  
  // Проверяем конфликты
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