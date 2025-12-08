import { expect, test, describe, beforeEach, afterEach } from "vitest";
import {
  validateRequired,
  validateEmail,
  validateMinLength,
  validateMaxLength,
  validateMin,
  validateMax,
  validatePattern,
  validateUrl,
  validatePhone,
  validateArrayMin,
  validateArrayMax,
  validateEqualTo,
  validateNumeric,
  validateInteger,
  validateAlphanumeric,
  validateRule,
  validatorsRegistry
} from "../lib/validators";

/**
 * Тесты для валидаторов FormGuard
 * Эти тесты проверяют работу всех функций валидации формы
 */
describe("FormGuard Validators", () => {
  /**
   * Тесты для валидатора обязательных полей
   * Проверяет различные типы полей: текстовые, чекбоксы, массивы
   */
  describe("validateRequired", () => {
    const mockTextField = { type: "text" };

    test("должен возвращать true для непустой строки", () => {
      expect(validateRequired("test", null, mockTextField)).toBe(true);
    });

    test("должен возвращать false для пустой строки", () => {
      expect(validateRequired("", null, mockTextField)).toBe(false);
    });

    test("должен возвращать false для null значения", () => {
      expect(validateRequired(null, null, mockTextField)).toBe(false);
    });

    test("должен возвращать false для undefined значения", () => {
      expect(validateRequired(undefined, null, mockTextField)).toBe(false);
    });

    test("должен возвращать true для отмеченного чекбокса", () => {
      const mockField = { type: "checkbox" };
      expect(validateRequired(true, null, mockField)).toBe(true);
    });

    test("должен возвращать false для неотмеченного чекбокса", () => {
      const mockField = { type: "checkbox" };
      expect(validateRequired(false, null, mockField)).toBe(false);
    });

    test("должен возвращать true для непустого массива", () => {
      expect(validateRequired(["item"], null, mockTextField)).toBe(true);
    });

    test("должен возвращать false для пустого массива", () => {
      expect(validateRequired([], null, mockTextField)).toBe(false);
    });
  });

  /**
   * Тесты для валидатора email
   * Проверяет корректность email адресов
   */
  describe("validateEmail", () => {
    test("должен возвращать true для корректного email", () => {
      expect(validateEmail("test@example.com")).toBe(true);
    });

    test("должен возвращать false для некорректного email", () => {
      expect(validateEmail("invalid-email")).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateEmail("")).toBe(true);
    });
  });

  /**
   * Тесты для валидатора минимальной длины
   * Проверяет минимальную длину строк и массивов
   */
  describe("validateMinLength", () => {
    test("должен возвращать true для строки достаточной длины", () => {
      expect(validateMinLength("hello", 3)).toBe(true);
    });

    test("должен возвращать false для строки недостаточной длины", () => {
      expect(validateMinLength("hi", 3)).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateMinLength("", 3)).toBe(true);
    });

    test("должен возвращать true для массива достаточной длины", () => {
      expect(validateMinLength(["a", "b", "c"], 2)).toBe(true);
    });

    test("должен возвращать false для массива недостаточной длины", () => {
      expect(validateMinLength(["a"], 2)).toBe(false);
    });
  });

  /**
   * Тесты для валидатора максимальной длины
   * Проверяет максимальную длину строк и массивов
   */
  describe("validateMaxLength", () => {
    test("должен возвращать true для строки в пределах максимальной длины", () => {
      expect(validateMaxLength("hello", 10)).toBe(true);
    });

    test("должен возвращать false для строки превышающей максимальную длину", () => {
      expect(validateMaxLength("hello world", 5)).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateMaxLength("", 5)).toBe(true);
    });

    test("должен возвращать true для массива в пределах максимальной длины", () => {
      expect(validateMaxLength(["a", "b"], 3)).toBe(true);
    });

    test("должен возвращать false для массива превышающего максимальную длину", () => {
      expect(validateMaxLength(["a", "b", "c", "d"], 2)).toBe(false);
    });
  });

  /**
   * Тесты для валидатора минимального числового значения
   * Проверяет минимальное значение чисел
   */
  describe("validateMin", () => {
    test("должен возвращать true для числа соответствующего минимуму", () => {
      expect(validateMin(5, 3)).toBe(true);
    });

    test("должен возвращать false для числа ниже минимума", () => {
      expect(validateMin(2, 3)).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateMin("", 3)).toBe(true);
    });

    test("должен возвращать false для некорректного числа", () => {
      expect(validateMin("abc", 3)).toBe(false);
    });
  });

  /**
   * Тесты для валидатора максимального числового значения
   * Проверяет максимальное значение чисел
   */
  describe("validateMax", () => {
    test("должен возвращать true для числа в пределах максимума", () => {
      expect(validateMax(5, 10)).toBe(true);
    });

    test("должен возвращать false для числа превышающего максимум", () => {
      expect(validateMax(15, 10)).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateMax("", 10)).toBe(true);
    });

    test("должен возвращать false для некорректного числа", () => {
      expect(validateMax("abc", 10)).toBe(false);
    });
  });

  /**
   * Тесты для валидатора по регулярному выражению
   * Проверяет соответствие строки паттерну
   */
  describe("validatePattern", () => {
    test("должен возвращать true для строки соответствующей паттерну", () => {
      expect(validatePattern("123", "\\d+")).toBe(true);
    });

    test("должен возвращать false для строки не соответствующей паттерну", () => {
      expect(validatePattern("abc", "\\d+")).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validatePattern("", "\\d+")).toBe(true);
    });

    test("должен корректно обрабатывать некорректные регулярные выражения", () => {
      expect(validatePattern("test", "[invalid")).toBe(false);
    });
  });

  /**
   * Тесты для валидатора URL
   * Проверяет корректность URL адресов
   */
  describe("validateUrl", () => {
    test("должен возвращать true для корректного URL", () => {
      expect(validateUrl("https://example.com")).toBe(true);
    });

    test("должен возвращать false для некорректного URL", () => {
      expect(validateUrl("not-a-url")).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateUrl("")).toBe(true);
    });
  });

  /**
   * Тесты для валидатора телефонных номеров
   * Проверяет формат телефонных номеров
   */
  describe("validatePhone", () => {
    test("должен возвращать true для корректного телефонного номера", () => {
      expect(validatePhone("+12345678901")).toBe(true);
    });

    test("должен возвращать false для некорректного телефонного номера", () => {
      expect(validatePhone("abc")).toBe(false);
    });

    test("должен возвращать false для слишком короткого номера", () => {
      expect(validatePhone("123")).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validatePhone("")).toBe(true);
    });
  });

  /**
   * Тесты для валидатора минимального количества элементов массива
   * Проверяет минимальное количество элементов в массиве
   */
  describe("validateArrayMin", () => {
    test("должен возвращать true для массива достаточной длины", () => {
      expect(validateArrayMin(["a", "b"], 2)).toBe(true);
    });

    test("должен возвращать false для массива недостаточной длины", () => {
      expect(validateArrayMin(["a"], 2)).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateArrayMin("", 2)).toBe(true);
    });

    test("должен корректно обрабатывать не-массивные значения", () => {
      expect(validateArrayMin("test", 2)).toBe(false);
    });
  });

  /**
   * Тесты для валидатора максимального количества элементов массива
   * Проверяет максимальное количество элементов в массиве
   */
  describe("validateArrayMax", () => {
    test("должен возвращать true для массива в пределах максимальной длины", () => {
      expect(validateArrayMax(["a", "b"], 3)).toBe(true);
    });

    test("должен возвращать false для массива превышающего максимальную длину", () => {
      expect(validateArrayMax(["a", "b", "c", "d"], 2)).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateArrayMax("", 2)).toBe(true);
    });
  });

  /**
   * Тесты для валидатора равенства значений полей
   * Проверяет совпадение значения с другим полем формы
   */
  describe("validateEqualTo", () => {
    let mockForm, mockField, mockOtherField;

    beforeEach(() => {
      // Создаем mock объекты для формы и полей
      mockForm = {
        elements: {
          namedItem: (name) => name === "otherField" ? mockOtherField : null
        }
      };
      mockField = { form: mockForm };
      mockOtherField = { value: "match" };
    });

    test("должен возвращать true когда значения совпадают", () => {
      expect(validateEqualTo("match", "otherField", mockField)).toBe(true);
    });

    test("должен возвращать false когда значения не совпадают", () => {
      expect(validateEqualTo("different", "otherField", mockField)).toBe(false);
    });

    test("должен возвращать true когда другое поле не найдено", () => {
      mockForm.elements.namedItem = () => null;
      expect(validateEqualTo("value", "nonexistent", mockField)).toBe(true);
    });
  });

  /**
   * Тесты для валидатора числовых значений
   * Проверяет что значение является числом
   */
  describe("validateNumeric", () => {
    test("должен возвращать true для корректного числа", () => {
      expect(validateNumeric("123")).toBe(true);
    });

    test("должен возвращать false для некорректного числа", () => {
      expect(validateNumeric("abc")).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateNumeric("")).toBe(true);
    });
  });

  /**
   * Тесты для валидатора целых чисел
   * Проверяет что значение является целым числом
   */
  describe("validateInteger", () => {
    test("должен возвращать true для корректного целого числа", () => {
      expect(validateInteger("123")).toBe(true);
    });

    test("должен возвращать false для десятичного числа", () => {
      expect(validateInteger("123.45")).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateInteger("")).toBe(true);
    });
  });

  /**
   * Тесты для валидатора буквенно-цифровых значений
   * Проверяет что значение содержит только буквы и цифры
   */
  describe("validateAlphanumeric", () => {
    test("должен возвращать true для буквенно-цифровой строки", () => {
      expect(validateAlphanumeric("abc123")).toBe(true);
    });

    test("должен возвращать false для строки со специальными символами", () => {
      expect(validateAlphanumeric("abc@123")).toBe(false);
    });

    test("должен возвращать true для пустого значения", () => {
      expect(validateAlphanumeric("")).toBe(true);
    });
  });

  /**
   * Тесты для главной функции валидации правила
   * Проверяет применение правил валидации к полям формы
   */
  describe("validateRule", () => {
    let mockField;

    beforeEach(() => {
      // Создаем DOM элемент для тестирования
      mockField = document.createElement("input");
      mockField.name = "testField";
    });

    test("должен валидировать используя зарегистрированный валидатор", () => {
      const rule = { rule: "required", value: null };
      expect(validateRule(mockField, "test", rule)).toBe(true);
      expect(validateRule(mockField, "", rule)).toBe(false);
    });

    test("должен возвращать true для неизвестного правила", () => {
      const rule = { rule: "unknown", value: null };
      expect(validateRule(mockField, "test", rule)).toBe(true);
    });
  });

  /**
   * Тесты для реестра валидаторов
   * Проверяет что все валидаторы правильно зарегистрированы
   */
  describe("validatorsRegistry", () => {
    test("должен содержать все функции валидаторов", () => {
      expect(validatorsRegistry.required).toBe(validateRequired);
      expect(validatorsRegistry.email).toBe(validateEmail);
      expect(validatorsRegistry.minLength).toBe(validateMinLength);
      expect(validatorsRegistry.maxLength).toBe(validateMaxLength);
      expect(validatorsRegistry.min).toBe(validateMin);
      expect(validatorsRegistry.max).toBe(validateMax);
      expect(validatorsRegistry.pattern).toBe(validatePattern);
      expect(validatorsRegistry.url).toBe(validateUrl);
      expect(validatorsRegistry.phone).toBe(validatePhone);
      expect(validatorsRegistry.arrayMin).toBe(validateArrayMin);
      expect(validatorsRegistry.arrayMax).toBe(validateArrayMax);
      expect(validatorsRegistry.equalTo).toBe(validateEqualTo);
      expect(validatorsRegistry.numeric).toBe(validateNumeric);
      expect(validatorsRegistry.integer).toBe(validateInteger);
      expect(validatorsRegistry.alphanumeric).toBe(validateAlphanumeric);
    });
  });
});
