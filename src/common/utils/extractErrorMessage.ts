export const extractErrorMessage = (data: unknown): string | undefined => {
  if (data == null) return undefined;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return extractErrorMessage(parsed) ?? data;
    } catch {
      return data;
    }
  }
  if (typeof data !== 'object') return undefined;
  const obj: any = data;
  if (obj.error) {
    const err = obj.error;
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err) {
      return err.message || String(err);
    }
  }
  if (obj.message) {
    const msg = obj.message;
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object' && msg) {
      return (msg as any).message || String(msg);
    }
  }
  return undefined;
};
