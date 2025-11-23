import type { ErrorResponse } from '@/shared/types';

/**
 * Create a structured error response
 */
export const createErrorResponse = (message: string, code?: string, details?: unknown): ErrorResponse => {
    return {
        error: {
            message,
            code,
            details
        }
    };
};

/**
 * Type guard to check if response is an error
 */
export const isErrorResponse = (response: unknown): response is ErrorResponse => {
    return (
        typeof response === 'object' &&
        response !== null &&
        'error' in response &&
        typeof (response as any).error === 'object' &&
        typeof (response as any).error.message === 'string'
    );
};

/**
 * Convert any error to structured error response
 */
export const toErrorResponse = (error: unknown): ErrorResponse => {
    if (isErrorResponse(error)) {
        return error;
    }

    if (error instanceof Error) {
        return createErrorResponse(error.message, error.name, { stack: error.stack });
    }

    return createErrorResponse(String(error), 'UNKNOWN_ERROR');
};
