import {
  buildRulesFromMemory,
  createAnswerMemory,
  recordAnswer,
  type AnswerMemory,
  type CommunalQuestionGroup,
  type ObservedAnswer,
  type Rules,
} from "@form-filler/shared";

const ANSWER_MEMORY_KEY = "answerMemory";
const COMMUNAL_GROUPS_KEY = "communalQuestionGroups";

export type StorageAdapter = {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
};

function getChromeStorage(): StorageAdapter {
  function getLastError(): unknown {
    return chrome.runtime?.lastError;
  }

  return {
    async get<T>(key: string): Promise<T | undefined> {
      return new Promise<T | undefined>((resolve, reject) => {
        try {
          const maybePromise = chrome.storage.local.get(
            key,
            (result: Record<string, unknown>) => {
              const lastError = getLastError();
              if (lastError) {
                reject(lastError);
                return;
              }

              resolve(result[key] as T | undefined);
            },
          ) as Promise<Record<string, unknown>> | undefined;

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
          const maybePromise = chrome.storage.local.set(
            { [key]: value },
            () => {
              const lastError = getLastError();
              if (lastError) {
                reject(lastError);
                return;
              }

              resolve();
            },
          ) as Promise<void> | undefined;

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

async function loadAnswerMemory(
  storage: StorageAdapter,
): Promise<AnswerMemory> {
  return (
    (await storage.get<AnswerMemory>(ANSWER_MEMORY_KEY)) ??
    createAnswerMemory()
  );
}

export async function rememberAnswer(
  observation: ObservedAnswer,
  storage: StorageAdapter = getChromeStorage(),
): Promise<AnswerMemory> {
  const current = await loadAnswerMemory(storage);
  const next = recordAnswer(current, observation);

  await storage.set(ANSWER_MEMORY_KEY, next);

  return next;
}

export async function loadLearnedRules(
  storage: StorageAdapter = getChromeStorage(),
): Promise<Rules> {
  const memory = await loadAnswerMemory(storage);
  return buildRulesFromMemory(memory);
}

export async function saveCommunalGroups(
  groups: CommunalQuestionGroup[],
  storage: StorageAdapter = getChromeStorage(),
): Promise<void> {
  await storage.set(COMMUNAL_GROUPS_KEY, groups);
}
