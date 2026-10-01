/** Splits a list into consecutive pieces of at most `size` items. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`chunk size must be a positive integer, got ${size}`);
  }
  const pieces: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pieces.push(items.slice(i, i + size));
  }
  return pieces;
}
