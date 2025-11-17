import pLimit from 'p-limit';

const limit = pLimit(
  parseInt(process.env.APP_QUEUE_LIMIT || '10', 10),
);

export const runWithLimit = <T>(fn: () => Promise<T>): Promise<T> => {
  return limit(fn);
};
