/**
 * Fractional Indexing Library
 * Generates lexicographically ordered string keys for O(1) reordering.
 * Based on the concept of finding string midpoints between two keys.
 */
/**
 * Generate a key between two existing keys.
 * If `a` is null/undefined, generates a key before `b`.
 * If `b` is null/undefined, generates a key after `a`.
 * If both are null/undefined, returns the midpoint of the space.
 */
export declare function generateKeyBetween(a: string | null | undefined, b: string | null | undefined): string;
/**
 * Generate a key that sorts before the given key
 */
export declare function generateKeyBefore(key: string): string;
/**
 * Generate a key that sorts after the given key
 */
export declare function generateKeyAfter(key: string): string;
/**
 * Generate N evenly spaced keys for initial seeding
 */
export declare function generateNKeys(n: number): string[];
//# sourceMappingURL=fractional.d.ts.map