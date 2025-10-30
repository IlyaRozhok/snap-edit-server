import pLimit from 'p-limit';

const limit = pLimit(5);

export async function runWithLimit<T>(fn: () => Promise<T>): Promise<T> {
  return limit(fn);
}
