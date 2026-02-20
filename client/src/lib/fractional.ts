/**
 * Fractional Indexing (client-side copy)
 * Generates lexicographically ordered string keys for O(1) reordering.
 */

const BASE_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = BASE_CHARS.length;

function charToIndex(c: string): number {
    const idx = BASE_CHARS.indexOf(c);
    if (idx === -1) throw new Error(`Invalid character: ${c}`);
    return idx;
}

function indexToChar(i: number): string {
    return BASE_CHARS[i];
}

export function generateKeyBetween(a: string | null | undefined, b: string | null | undefined): string {
    if (!a && !b) return 'V';
    if (!a) return generateKeyBefore(b!);
    if (!b) return generateKeyAfter(a);
    if (a >= b) throw new Error(`Invalid order: ${a} >= ${b}`);
    return midpoint(a, b);
}

export function generateKeyBefore(key: string): string {
    const firstCharIdx = charToIndex(key[0]);
    if (firstCharIdx > 1) return indexToChar(Math.floor(firstCharIdx / 2));
    if (key.length === 1) return key[0] + indexToChar(Math.floor(BASE / 2));
    const suffix = key.slice(1);
    const zeroes = '0'.repeat(suffix.length);
    if (suffix > zeroes) return key[0] + midpoint(zeroes, suffix);
    return key[0] + zeroes + indexToChar(Math.floor(BASE / 2));
}

export function generateKeyAfter(key: string): string {
    const lastCharIdx = charToIndex(key[key.length - 1]);
    if (lastCharIdx < BASE - 2) {
        return key.slice(0, -1) + indexToChar(Math.ceil((lastCharIdx + BASE - 1) / 2));
    }
    return key + indexToChar(Math.floor(BASE / 2));
}

function midpoint(a: string, b: string): string {
    const maxLen = Math.max(a.length, b.length);
    const paddedA = a.padEnd(maxLen, BASE_CHARS[0]);
    const paddedB = b.padEnd(maxLen, BASE_CHARS[0]);
    const digitsA = paddedA.split('').map(charToIndex);
    const digitsB = paddedB.split('').map(charToIndex);

    let carry = 0;
    const sum: number[] = [];
    for (let i = maxLen - 1; i >= 0; i--) {
        const s = digitsA[i] + digitsB[i] + carry;
        sum.unshift(s % BASE);
        carry = Math.floor(s / BASE);
    }
    if (carry) sum.unshift(carry);

    let remainder = 0;
    const result: number[] = [];
    for (let i = 0; i < sum.length; i++) {
        const current = sum[i] + remainder * BASE;
        result.push(Math.floor(current / 2));
        remainder = current % 2;
    }
    if (remainder) result.push(Math.floor(BASE / 2));

    let str = result.map(indexToChar).join('');
    if (!carry && str.length > maxLen) str = str.slice(str.length - maxLen);
    const minLen = Math.min(a.length, b.length) + 1;
    while (str.length > minLen && str[str.length - 1] === BASE_CHARS[0]) {
        str = str.slice(0, -1);
    }
    if (str <= a) str = a + indexToChar(Math.floor(BASE / 2));
    if (str >= b) str = a + indexToChar(Math.floor(BASE / 2));
    return str;
}
