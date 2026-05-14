import { describe, expect, it } from "vitest";
import {
  AUTO_FILL_ENABLED_KEY,
  loadAutoFillEnabled,
  saveAutoFillEnabled,
  type BooleanStorageAdapter,
} from "./settings";

function createStorage(initial: Record<string, unknown> = {}) {
  const values = new Map(Object.entries(initial));

  const storage: BooleanStorageAdapter = {
    async get<T>(key: string): Promise<T | undefined> {
      return values.get(key) as T | undefined;
    },
    async set(key: string, value: unknown): Promise<void> {
      values.set(key, value);
    },
  };

  return { storage, values };
}

describe("auto-fill setting", () => {
  it("defaults auto-fill to enabled", async () => {
    const { storage } = createStorage();

    await expect(loadAutoFillEnabled(storage)).resolves.toBe(true);
  });

  it("persists the auto-fill preference", async () => {
    const { storage, values } = createStorage();

    await saveAutoFillEnabled(false, storage);

    expect(values.get(AUTO_FILL_ENABLED_KEY)).toBe(false);
    await expect(loadAutoFillEnabled(storage)).resolves.toBe(false);
  });
});
