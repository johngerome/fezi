export const toError = (err: unknown): Error => {
  if (err instanceof Error) return err;
  if (typeof err === 'string') return new Error(err);
  if (err && typeof (err as any).message === 'string') return new Error((err as any).message);
  return new Error('Unknown error');
};
