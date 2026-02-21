import { generateKeyBetween, generateKeyAfter, generateKeyBefore } from '../../src/lib/fractional';

describe('Fractional Indexing', () => {
    describe('generateKeyBetween', () => {
        it('returns V for null/null', () => {
            expect(generateKeyBetween(null, null)).toBe('V');
        });

        it('returns a key between two letters', () => {
            const result = generateKeyBetween('A', 'C');
            expect(result > 'A').toBe(true);
            expect(result < 'C').toBe(true);
            expect(result).toBe('B');
        });

        it('returns a key between A and B (requires more precision)', () => {
            const result = generateKeyBetween('A', 'B');
            expect(result > 'A').toBe(true);
            expect(result < 'B').toBe(true);
            expect(result.startsWith('A')).toBe(true);
        });

        it('returns midpoint for base-62 chars', () => {
            const result = generateKeyBetween('0', '1');
            expect(result > '0').toBe(true);
            expect(result < '1').toBe(true);
        });
    });

    describe('generateKeyAfter', () => {
        it('returns a key after V', () => {
            const result = generateKeyAfter('V');
            expect(result > 'V').toBe(true);
        });

        it('returns a key after a very late key', () => {
            const result = generateKeyAfter('z');
            expect(result > 'z').toBe(true);
        });
    });

    it('returns a key before a middle key', () => {
        const result = generateKeyBefore('V');
        expect(result < 'V').toBe(true);
    });

    it('handles keys near the start by prepending', () => {
        const result = generateKeyBefore('1');
        // '1' is char index 1. generateKeyBefore('1') should return '0' + midpoint
        expect(result < '1').toBe(true);
    });

    describe('Consistency', () => {
        it('maintains lexicographical order across multiple inserts', () => {
            let k1 = 'V';
            let k2 = generateKeyAfter(k1);
            let k3 = generateKeyBetween(k1, k2);

            expect(k1 < k3).toBe(true);
            expect(k3 < k2).toBe(true);

            let k4 = generateKeyBefore(k1);
            expect(k4 < k1).toBe(true);
        });
    });
});
