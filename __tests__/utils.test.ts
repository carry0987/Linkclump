import { describe, it, expect } from 'vitest';
import { typedKeys, typedEntries, typedValues, tuple, literalSet } from '@/shared/lib/utils';

describe('Utils', () => {
    describe('typedKeys()', () => {
        it('should return object keys with correct types', () => {
            const obj = { name: 'John', age: 30, active: true };
            const keys = typedKeys(obj);

            expect(keys).toEqual(['name', 'age', 'active']);
            expect(keys).toHaveLength(3);
        });

        it('should handle empty object', () => {
            const obj = {};
            const keys = typedKeys(obj);

            expect(keys).toEqual([]);
        });
    });

    describe('typedEntries()', () => {
        it('should return object entries with correct types', () => {
            const obj = { name: 'John', age: 30 };
            const entries = typedEntries(obj);

            expect(entries).toEqual([
                ['name', 'John'],
                ['age', 30]
            ]);
            expect(entries).toHaveLength(2);
        });

        it('should handle empty object', () => {
            const obj = {};
            const entries = typedEntries(obj);

            expect(entries).toEqual([]);
        });
    });

    describe('typedValues()', () => {
        it('should return object values with correct types', () => {
            const obj = { name: 'John', age: 30, active: true };
            const values = typedValues(obj);

            expect(values).toContain('John');
            expect(values).toContain(30);
            expect(values).toContain(true);
            expect(values).toHaveLength(3);
        });

        it('should handle empty object', () => {
            const obj = {};
            const values = typedValues(obj);

            expect(values).toEqual([]);
        });
    });

    describe('tuple()', () => {
        it('should create tuple from arguments', () => {
            const result = tuple('red', 'green', 'blue');

            expect(result).toEqual(['red', 'green', 'blue']);
            expect(result).toHaveLength(3);
        });

        it('should create tuple with numbers', () => {
            const result = tuple(1, 2, 3, 4);

            expect(result).toEqual([1, 2, 3, 4]);
        });

        it('should create empty tuple', () => {
            const result = tuple();

            expect(result).toEqual([]);
        });
    });

    describe('literalSet()', () => {
        it('should create Set from string literals', () => {
            const result = literalSet('a', 'b', 'c');

            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(3);
            expect(result.has('a')).toBe(true);
            expect(result.has('b')).toBe(true);
            expect(result.has('c')).toBe(true);
        });

        it('should create Set from number literals', () => {
            const result = literalSet(1, 2, 3);

            expect(result.size).toBe(3);
            expect(result.has(1)).toBe(true);
            expect(result.has(2)).toBe(true);
            expect(result.has(3)).toBe(true);
        });

        it('should handle duplicate values', () => {
            const result = literalSet('a', 'b', 'a', 'c', 'b');

            expect(result.size).toBe(3); // Set removes duplicates
            expect(result.has('a')).toBe(true);
            expect(result.has('b')).toBe(true);
            expect(result.has('c')).toBe(true);
        });

        it('should create empty Set', () => {
            const result = literalSet();

            expect(result.size).toBe(0);
        });
    });
});
