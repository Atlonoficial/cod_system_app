/**
 * BUILD 58: Safe String Utilities
 * Funções de validação segura para prevenir crashes de .trim() is not a function
 */

/**
 * Verifica se um valor é uma string válida e não-vazia
 */
export const isValidString = (value: any): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Verifica se um valor é apenas dígitos numéricos
 * Retorna false para valores inválidos
 */
export const isNumericString = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    return /^\d+$/.test(value.trim());
};

/**
 * Verifica string com regex de forma segura
 * Retorna false para valores inválidos
 */
export const safeStringCheck = (value: any, regex: RegExp): boolean => {
    if (typeof value !== 'string') return false;
    return regex.test(value.trim());
};

/**
 * Retorna valor de string seguro (trimmed) ou string vazia
 */
export const safeString = (value: any): string => {
    if (typeof value !== 'string') return '';
    return value.trim();
};

/**
 * Verifica se descrição é válida para exibição
 * (não é nula, não é apenas números, tem conteúdo)
 */
export const isValidDescription = (description: any): boolean => {
    if (!description) return false;
    if (typeof description !== 'string') return false;
    const trimmed = description.trim();
    if (trimmed.length === 0) return false;
    // Evitar exibir descrições que são apenas números (IDs mal formatados)
    if (/^\d+$/.test(trimmed)) return false;
    return true;
};
