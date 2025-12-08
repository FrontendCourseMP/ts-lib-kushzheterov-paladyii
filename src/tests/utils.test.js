import { expect, test, describe, beforeEach, afterEach } from "vitest";
import {
  getFieldValue,
  findErrorContainer,
  findFieldLabel,
  showError,
  hideError,
  validateFormStructure,
  createErrorMessage,
  checkRuleConflicts,
  createErrorContainerIfNeeded
} from "../lib/utils";

/**
 * Тесты для утилитарных функций FormGuard
 * Эти тесты проверяют вспомогательные функции для работы с DOM и формами
 */
describe("FormGuard Utils", () => {
  /**
   * Тесты для функции получения значения поля
   * Проверяет корректное извлечение значений из разных типов полей формы
   */
  describe("getFieldValue", () => {
    test("должен возвращать значение для обычного текстового поля", () => {
      const field = { value: "test", type: "text" };
      expect(getFieldValue(field)).toBe("test");
    });

    test("должен возвращать статус checked для чекбокса", () => {
      const field = { checked: true, type: "checkbox" };
      expect(getFieldValue(field)).toBe(true);
    });

    test("должен возвращать массив для группы чекбоксов", () => {
      // Создаем форму с чекбоксами для тестирования
      const form = document.createElement("form");
      const checkbox1 = document.createElement("input");
      checkbox1.type = "checkbox";
      checkbox1.name = "test[]";
      checkbox1.value = "value1";
      checkbox1.checked = true;

      const checkbox2 = document.createElement("input");
      checkbox2.type = "checkbox";
      checkbox2.name = "test[]";
      checkbox2.value = "value2";
      checkbox2.checked = false;

      const checkbox3 = document.createElement("input");
      checkbox3.type = "checkbox";
      checkbox3.name = "test[]";
      checkbox3.value = "value3";
      checkbox3.checked = true;

      form.appendChild(checkbox1);
      form.appendChild(checkbox2);
      form.appendChild(checkbox3);

      expect(getFieldValue(checkbox1)).toEqual(["value1", "value3"]);
    });

    test("должен возвращать выбранное значение для радиокнопок", () => {
      const form = document.createElement("form");
      const radio1 = document.createElement("input");
      radio1.type = "radio";
      radio1.name = "test";
      radio1.value = "value1";
      radio1.checked = false;

      const radio2 = document.createElement("input");
      radio2.type = "radio";
      radio2.name = "test";
      radio2.value = "value2";
      radio2.checked = true;

      form.appendChild(radio1);
      form.appendChild(radio2);

      expect(getFieldValue(radio1)).toBe("value2");
    });

    test("должен возвращать число для числового поля", () => {
      const field = { type: "number", valueAsNumber: 42 };
      expect(getFieldValue(field)).toBe(42);
    });

    test("должен возвращать массив для множественного селекта", () => {
      const select = document.createElement("select");
      select.multiple = true;

      const option1 = document.createElement("option");
      option1.value = "value1";
      option1.selected = true;

      const option2 = document.createElement("option");
      option2.value = "value2";
      option2.selected = false;

      const option3 = document.createElement("option");
      option3.value = "value3";
      option3.selected = true;

      select.appendChild(option1);
      select.appendChild(option2);
      select.appendChild(option3);

      expect(getFieldValue(select)).toEqual(["value1", "value3"]);
    });

    test("должен возвращать файлы для файлового поля", () => {
      const field = { type: "file", files: [new File([""], "test.txt")] };
      expect(getFieldValue(field)).toEqual([field.files[0]]);
    });
  });

  /**
   * Тесты для функции поиска контейнера ошибок
   * Проверяет поиск контейнеров для отображения ошибок валидации
   */
  describe("findErrorContainer", () => {
    let form;

    beforeEach(() => {
      form = document.createElement("form");
    });

    test("должен найти контейнер по data-атрибуту", () => {
      const container = document.createElement("div");
      container.setAttribute("data-error-for", "testField");
      form.appendChild(container);

      const field = document.createElement("input");
      field.name = "testField";
      form.appendChild(field);

      expect(findErrorContainer("testField", form)).toBe(container);
    });

    test("должен найти контейнер по id", () => {
      const container = document.createElement("div");
      container.id = "testField-error";
      form.appendChild(container);

      expect(findErrorContainer("testField", form)).toBe(container);
    });

    test("должен найти следующий sibling как контейнер ошибок", () => {
      const field = document.createElement("input");
      field.name = "testField";

      const container = document.createElement("div");
      container.classList.add("error");

      field.parentNode?.insertBefore(container, field.nextSibling);
      form.appendChild(field);
      form.appendChild(container);

      expect(findErrorContainer("testField", form)).toBe(container);
    });
  });

  describe("findFieldLabel", () => {
    let form;

    beforeEach(() => {
      form = document.createElement("form");
    });

    test("should find label by for attribute", () => {
      const label = document.createElement("label");
      label.setAttribute("for", "testField");
      form.appendChild(label);

      expect(findFieldLabel("testField", form)).toBe(label);
    });

    test("should find parent label", () => {
      const label = document.createElement("label");
      const field = document.createElement("input");
      field.name = "testField";

      label.appendChild(field);
      form.appendChild(label);

      expect(findFieldLabel("testField", form)).toBe(label);
    });
  });

  describe("showError and hideError", () => {
    let container, field;

    beforeEach(() => {
      container = document.createElement("div");
      container.setAttribute("data-error-for", "testField");

      field = document.createElement("input");
      field.name = "testField";
      field.type = "text";

      const form = document.createElement("form");
      form.appendChild(field);
      form.appendChild(container);

      document.body.appendChild(form);
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    test("showError should display error message", () => {
      showError(container, "Error message");

      expect(container.textContent).toBe("Error message");
      expect(container.classList.contains("error")).toBe(true);
      expect(container.style.display).toBe("block");
    });

    test("hideError should hide error container", () => {
      hideError(container);

      expect(container.textContent).toBe("");
      expect(container.classList.contains("success")).toBe(true);
      expect(container.style.display).toBe("none");
    });
  });

  describe("createErrorMessage", () => {
    test("should return custom error message", () => {
      const rule = { rule: "required", errorMessage: "Custom message" };
      expect(createErrorMessage(rule)).toBe("Custom message");
    });

    test("should return default message", () => {
      const rule = { rule: "minLength", value: 5 };
      const defaults = { minLength: "Minimum length is {value}" };
      expect(createErrorMessage(rule, "testField", defaults)).toBe("Minimum length is 5");
    });

    test("should return fallback message", () => {
      const rule = { rule: "unknown" };
      expect(createErrorMessage(rule, "testField")).toBe("Ошибка валидации поля \"testField\" по правилу: unknown");
    });
  });

  describe("createErrorContainerIfNeeded", () => {
    let form, field;

    beforeEach(() => {
      form = document.createElement("form");
      field = document.createElement("input");
      field.name = "testField";
      form.appendChild(field);
      document.body.appendChild(form);
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    test("should return existing container", () => {
      const existing = document.createElement("div");
      existing.setAttribute("data-error-for", "testField");
      form.appendChild(existing);

      expect(createErrorContainerIfNeeded("testField", form)).toBe(existing);
    });

    test("should create new container", () => {
      const container = createErrorContainerIfNeeded("testField", form);

      expect(container).toBeDefined();
      expect(container.getAttribute("data-error-for")).toBe("testField");
      expect(container.id).toBe("testField-error");
      expect(container.style.display).toBe("none");
    });
  });
});