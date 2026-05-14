export const AUTO_FILL_ENABLED_KEY = "autoFillEnabled";

export type BooleanStorageAdapter = {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
};

type ChromeStorageArea = {
  get(
    key: string,
    callback?: (value: Record<string, unknown>) => void,
  ): Promise<Record<string, unknown>> | void;
  set(value: Record<string, unknown>, callback?: () => void): Promise<void> | void;
};

type ChromeStorageApi = {
  runtime?: {
    lastError?: unknown;
  };
  storage: {
    local: ChromeStorageArea;
  };
};

export function createChromeStorageAdapter(
  chromeApi: ChromeStorageApi = chrome,
): BooleanStorageAdapter {
  function getLastError(): unknown {
    return chromeApi.runtime?.lastError;
  }

  return {
    async get<T>(key: string): Promise<T | undefined> {
      return new Promise<T | undefined>((resolve, reject) => {
        try {
          const maybePromise = chromeApi.storage.local.get(
            key,
            (result: Record<string, unknown>) => {
              const lastError = getLastError();
              if (lastError) {
                reject(lastError);
                return;
              }

              resolve(result[key] as T | undefined);
            },
          );

          if (maybePromise && typeof maybePromise.then === "function") {
            void maybePromise.then(
              (result) => resolve(result[key] as T | undefined),
              reject,
            );
          }
        } catch (err) {
          reject(err);
        }
      });
    },
    async set(key: string, value: unknown): Promise<void> {
      await new Promise<void>((resolve, reject) => {
        try {
          const maybePromise = chromeApi.storage.local.set(
            { [key]: value },
            () => {
              const lastError = getLastError();
              if (lastError) {
                reject(lastError);
                return;
              }

              resolve();
            },
          );

          if (maybePromise && typeof maybePromise.then === "function") {
            void maybePromise.then(() => resolve(), reject);
          }
        } catch (err) {
          reject(err);
        }
      });
    },
  };
}

export async function loadAutoFillEnabled(
  storage: BooleanStorageAdapter = createChromeStorageAdapter(),
): Promise<boolean> {
  return (await storage.get<boolean>(AUTO_FILL_ENABLED_KEY)) ?? true;
}

export async function saveAutoFillEnabled(
  enabled: boolean,
  storage: BooleanStorageAdapter = createChromeStorageAdapter(),
): Promise<void> {
  await storage.set(AUTO_FILL_ENABLED_KEY, enabled);
}
