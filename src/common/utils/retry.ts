const randomJitter = (base: number, spread: number = 300) => {
  return base + Math.floor(Math.random() * spread);
};

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delays429 = [2000, 4000, 8000];
  const delaysNet = [1000, 2000];
  let attempt = 0;
  let error;
  while (attempt < 3) {
    try {
      return await fn();
    } catch (e: any) {
      error = e;
      let delay = 0;
      if (e?.response?.status === 429 && attempt < delays429.length) {
        delay = randomJitter(delays429[attempt]);
      } else if (
        (e?.code === 'ECONNRESET' || e?.code === 'ETIMEDOUT') &&
        attempt < delaysNet.length
      ) {
        delay = randomJitter(delaysNet[attempt]);
      } else {
        break;
      }
      attempt++;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw error;
}
