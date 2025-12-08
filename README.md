# Документация

## Название команды: Кушжетеров-Паладий
## Участники:
## @paladijmaxim - Паладий Максим Юрьевич
## @Ibragim29052003 - Кушжетеров Ибрагим Хасанович

---

# FormGuard - Библиотека валидации форм

**FormGuard** - это мощная и гибкая библиотека валидации форм для TypeScript/JavaScript, предназначенная для упрощения проверки пользовательского ввода в веб-приложениях.

## Особенности

- ✅ **Полная поддержка TypeScript** - типизированные интерфейсы и функции
- ✅ **Модульная архитектура** - используйте только необходимые валидаторы
- ✅ **Работа с DOM** - встроенные утилиты для работы с элементами форм
- ✅ **Расширяемость** - легко добавлять собственные правила валидации
- ✅ **Комплексное тестирование** - 81 тест с покрытием всех функций
- ✅ **jsdom поддержка** - тестирование в изолированной DOM среде

## Установка

```bash
npm install form-guard
```

## Быстрый старт

```typescript
import FormGuard from 'form-guard';

// Создание экземпляра FormGuard
const formGuard = new FormGuard('#myForm', {
  rules: {
    email: { rule: 'email' },
    password: { rule: 'minLength', value: 8 },
    age: { rule: 'min', value: 18 }
  }
});

// Валидация формы
const isValid = formGuard.validate();
if (isValid) {
  // Форма валидна, отправляем данные
  console.log('Форма успешно валидирована!');
}
```

## Доступные валидаторы

### Основные валидаторы

| Валидатор | Описание | Пример использования |
|-----------|----------|---------------------|
| `required` | Обязательное поле | `{ rule: 'required' }` |
| `email` | Валидация email | `{ rule: 'email' }` |
| `url` | Валидация URL | `{ rule: 'url' }` |
| `phone` | Валидация телефона | `{ rule: 'phone' }` |

### Валидаторы длины и размера

| Валидатор | Описание | Пример использования |
|-----------|----------|---------------------|
| `minLength` | Минимальная длина | `{ rule: 'minLength', value: 5 }` |
| `maxLength` | Максимальная длина | `{ rule: 'maxLength', value: 100 }` |
| `min` | Минимальное число | `{ rule: 'min', value: 0 }` |
| `max` | Максимальное число | `{ rule: 'max', value: 100 }` |

### Специализированные валидаторы

| Валидатор | Описание | Пример использования |
|-----------|----------|---------------------|
| `pattern` | Регулярное выражение | `{ rule: 'pattern', value: '\\d{4}' }` |
| `numeric` | Только числа | `{ rule: 'numeric' }` |
| `integer` | Только целые числа | `{ rule: 'integer' }` |
| `alphanumeric` | Буквы и цифры | `{ rule: 'alphanumeric' }` |
| `equalTo` | Равенство с другим полем | `{ rule: 'equalTo', value: 'password' }` |

### Валидаторы массивов

| Валидатор | Описание | Пример использования |
|-----------|----------|---------------------|
| `arrayMin` | Мин. количество элементов | `{ rule: 'arrayMin', value: 2 }` |
| `arrayMax` | Макс. количество элементов | `{ rule: 'arrayMax', value: 10 }` |

## Конфигурация

### Правила валидации

```typescript
const rules = {
  username: [
    { rule: 'required', errorMessage: 'Имя пользователя обязательно' },
    { rule: 'minLength', value: 3, errorMessage: 'Минимум 3 символа' },
    { rule: 'alphanumeric', errorMessage: 'Только буквы и цифры' }
  ],
  email: { rule: 'email' },
  password: { rule: 'minLength', value: 8 }
};
```

### Настройки отображения ошибок

```typescript
const formGuard = new FormGuard('#myForm', {
  rules: rules,
  errorContainerAttribute: 'data-error', // Атрибут для контейнеров ошибок
  errorClass: 'error-message', // CSS класс для ошибок
  successClass: 'valid' // CSS класс для валидных полей
});
```

## Тестирование

Проект включает комплексный набор тестов, написанных с использованием **Vitest** и **jsdom**.

### Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск тестов в режиме наблюдения
npm test -- --watch

# Запуск с подробным выводом
npm test -- --reporter=verbose
```

### Структура тестов

- **`src/tests/validators.test.js`** - Тесты всех функций валидации (62 теста)
- **`src/tests/utils.test.js`** - Тесты утилитарных функций DOM (19 тестов)

Всего: **81 тест** с полным покрытием функциональности.

### Примеры тестов

```typescript
describe("validateEmail", () => {
  test("должен возвращать true для корректного email", () => {
    expect(validateEmail("test@example.com")).toBe(true);
  });

  test("должен возвращать false для некорректного email", () => {
    expect(validateEmail("invalid-email")).toBe(false);
  });
});
```

## Структура проекта

```
src/
├── core/
│   └── form-guard.ts      # Основной класс FormGuard
├── lib/
│   ├── validators.ts      # Функции валидации
│   └── utils.ts          # Утилиты для работы с DOM
├── types/
│   └── types.ts          # TypeScript интерфейсы
├── tests/
│   ├── validators.test.js # Тесты валидаторов
│   └── utils.test.js      # Тесты утилит
└── index.ts               # Точка входа
```

## Сборка и разработка

```bash
# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Сборка в режиме разработки (с отслеживанием изменений)
npm run dev

# Локальный сервер для тестирования
npm run serve
```