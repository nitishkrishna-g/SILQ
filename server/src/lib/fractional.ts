/**
 * Fractional Indexing Library
 * Generates lexicographically ordered string keys for O(1) reordering.
 * Based on the concept of finding string midpoints between two keys.
 */

const BASE_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = BASE_CHARS.length; // 62

/**
 * Returns the integer value of a character in our base-62 alphabet
 */
function charToIndex(c: string): number {
    const idx = BASE_CHARS.indexOf(c);
    if (idx === -1) throw new Error(`Invalid character in orderKey: ${c}`);
    return idx;
}

/**
 * Returns the character for a given index in our base-62 alphabet
 */
function indexToChar(i: number): string {
    if (i < 0 || i >= BASE) throw new Error(`Index out of range: ${i}`);
    return BASE_CHARS[i];
}

/**
 * Generate a key between two existing keys.
 * If `a` is null/undefined, generates a key before `b`.
 * If `b` is null/undefined, generates a key after `a`.
 * If both are null/undefined, returns the midpoint of the space.
 */
export function generateKeyBetween(a: string | null | undefined, b: string | null | undefined): string {
    if (a === null || a === undefined) {
        if (b === null || b === undefined) {
            // No keys exist, return middle of space
            return 'V'; // Midpoint of base-62
        }
        // Generate before b
        return generateKeyBefore(b);
    }

    if (b === null || b === undefined) {
        // Generate after a
        return generateKeyAfter(a);
    }

    if (a >= b) {
        throw new Error(`Invalid order: a (${a}) must be less than b (${b})`);
    }

    return midpoint(a, b);
}

/**
 * Generate a key that sorts before the given key
 */
export function generateKeyBefore(key: string): string {
    const firstCharIdx = charToIndex(key[0]);

    if (firstCharIdx > 0) {
        // We can use a character halfway between '0' and this character
        // or just the previous character if they are adjacent
        return indexToChar(Math.floor(firstCharIdx / 2));
    }

    // First char is '0', we need to go deeper
    // Prepend '0' and find midpoint with the rest
    if (key.length === 1) {
        // e.g., key = "0" -> return "0V" (incorrectly after 0, but 0 is absolute start)
        // Correct approach for '0': "0" is min, so we append midpoint to a virtual "zero"
        // But lexicographically, any string starting with "0" and having more chars is > "0"
        // So we return "0" plus a midpoint character.
        return key[0] + indexToChar(Math.floor(BASE / 2));
    }

    // Find midpoint between key[0] + "000..." and key
    const prefix = key[0];
    const suffix = key.slice(1);
    const zeroes = '0'.repeat(suffix.length);

    if (suffix > zeroes) {
        return prefix + midpoint(zeroes, suffix);
    }

    return prefix + zeroes + indexToChar(Math.floor(BASE / 2));
}

/**
 * Generate a key that sorts after the given key
 */
export function generateKeyAfter(key: string): string {
    const lastCharIdx = charToIndex(key[key.length - 1]);

    if (lastCharIdx < BASE - 2) {
        // We can increment the last character
        const midIdx = Math.ceil((lastCharIdx + BASE - 1) / 2);
        return key.slice(0, -1) + indexToChar(midIdx);
    }

    // Last char is near the end, append a midpoint character
    return key + indexToChar(Math.floor(BASE / 2));
}

/**
 * Calculate the lexicographic midpoint between two strings
 */
function midpoint(a: string, b: string): string {
    // Pad to same length
    const maxLen = Math.max(a.length, b.length);
    const paddedA = a.padEnd(maxLen, BASE_CHARS[0]);
    const paddedB = b.padEnd(maxLen, BASE_CHARS[0]);

    // Convert to digit arrays
    const digitsA = paddedA.split('').map(charToIndex);
    const digitsB = paddedB.split('').map(charToIndex);

    // Calculate midpoint in base-62
    let carry = 0;
    const sum: number[] = [];

    for (let i = maxLen - 1; i >= 0; i--) {
        const s = digitsA[i] + digitsB[i] + carry;
        sum.unshift(s % BASE);
        carry = Math.floor(s / BASE);
    }

    if (carry) {
        sum.unshift(carry);
    }

    // Divide by 2
    let remainder = 0;
    const result: number[] = [];

    for (let i = 0; i < sum.length; i++) {
        const current = sum[i] + remainder * BASE;
        result.push(Math.floor(current / 2));
        remainder = current % 2;
    }

    // If there's a remainder, we need to add precision
    if (remainder) {
        result.push(Math.floor(BASE / 2));
    }

    // Convert back to string and trim trailing zeros
    let str = result.map(indexToChar).join('');

    // Remove leading zeros that weren't in the original (from carry handling)
    if (!carry && str.length > maxLen) {
        str = str.slice(str.length - maxLen);
    }

    // Trim trailing '0's but keep at least one char more than the shorter input
    const minLen = Math.min(a.length, b.length) + 1;
    while (str.length > minLen && str[str.length - 1] === BASE_CHARS[0]) {
        str = str.slice(0, -1);
    }

    // Ensure result is actually between a and b
    if (str <= a) {
        str = a + indexToChar(Math.floor(BASE / 2));
    }
    if (str >= b) {
        // Fallback: append midpoint char to a
        str = a + indexToChar(Math.floor(BASE / 2));
    }

    return str;
}

/**
 * Generate N evenly spaced keys for initial seeding
 */
export function generateNKeys(n: number): string[] {
    const keys: string[] = [];
    let prev: string | null = null;

    for (let i = 0; i < n; i++) {
        const next = generateKeyAfter(prev || 'V');
        keys.push(prev === null ? 'V' : next);
        prev = prev === null ? 'V' : next;
    }

    return keys;
}
