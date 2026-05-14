import { afterEach, describe, expect, it } from "vitest";
import {
  loadLearnedRules,
  rememberAnswer,
  type StorageAdapter,
} from "./learnedMemory";

function createMemoryStorage(): StorageAdapter {
  const values = new Map<string, unknown>();

  return {
    async get<T>(key: string): Promise<T | undefined> {
      return values.get(key) as T | undefined;
    },
    async set(key: string, value: unknown): Promise<void> {
      values.set(key, value);
    },
  };
}

describe("learned memory storage", () => {
  const originalChrome = (globalThis as any).chrome;

  afterEach(() => {
    (globalThis as any).chrome = originalChrome;
  });

  it("persists observed answers and exposes them as fill rules", async () => {
    const storage = createMemoryStorage();

    await rememberAnswer(
      { question: "Phone", answer: "123456789" },
      storage,
    );
    await rememberAnswer(
      { question: "Telephone Number", answer: "123456789" },
      storage,
    );

    const rules = await loadLearnedRules(storage);

    expect(rules.learned_1).toMatchObject({
      value: "123456789",
      matchers: ["Phone", "Telephone Number"],
    });
  });

  it("loads local learned rules without reading communal aliases", async () => {
    const storage = createMemoryStorage();

    await rememberAnswer(
      { question: "Phone", answer: "123456789" },
      storage,
    );
    await storage.set("communalQuestionGroups", [
      { questions: ["Phone", "Telephone"] },
    ]);

    const rules = await loadLearnedRules(storage);

    expect(rules.learned_1.matchers).toEqual(["Phone"]);
  });

  it("works with callback-style chrome storage APIs", async () => {
    const values = new Map<string, unknown>();
    (globalThis as any).chrome = {
      runtime: {},
      storage: {
        local: {
          get(key: string, callback: (value: Record<string, unknown>) => void) {
            callback({ [key]: values.get(key) });
          },
          set(value: Record<string, unknown>, callback: () => void) {
            for (const [key, storedValue] of Object.entries(value)) {
              values.set(key, storedValue);
            }
            callback();
          },
        },
      },
    };

    await rememberAnswer({
      question: "Phone",
      answer: "123456789",
    });

    const rules = await loadLearnedRules();

    expect(rules.learned_1).toMatchObject({
      value: "123456789",
      matchers: ["Phone"],
    });
  });
});
