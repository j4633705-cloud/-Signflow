declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
  var __signflow_util_remember: Map<string, any>;
}

export function remember<T>(name: string, getValue: () => T): T {
  const g = globalThis as typeof globalThis & {
    __signflow_util_remember: Map<string, any>;
  };

  if (!g.__signflow_util_remember) {
    g.__signflow_util_remember = new Map();
  }

  if (!g.__signflow_util_remember.has(name)) {
    g.__signflow_util_remember.set(name, getValue());
  }

  return g.__signflow_util_remember.get(name);
}
