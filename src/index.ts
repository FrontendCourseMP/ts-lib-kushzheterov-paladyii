// src/index.ts
import FormGuard from './core/form-guard';

// Экспортируем основной класс
export default FormGuard;

// Экспортируем типы
export * from './types/types';

// Экспортируем вспомогательные функции
export { validateRule, validatorsRegistry } from './lib/validators';
export * from './lib/utils';

// Экспортируем для глобального использования (опционально)
export { FormGuard };