import { beforeEach, describe, expect, it, vi } from "vitest";
import { initPopup } from "./popup";
import { AUTO_FILL_ENABLED_KEY } from "./settings";

function createChromeStub(initial: Record<string, unknown> = {}) {
  const values = new Map(Object.entries(initial));
  const sendMessage = vi.fn();

  return {
    values,
    chrome: {
      runtime: {},
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: values.get(key) })),
          set: vi.fn(async (update: Record<string, unknown>) => {
            for (const [key, value] of Object.entries(update)) {
              values.set(key, value);
            }
          }),
        },
      },
      tabs: {
        query: vi.fn(async () => [{ id: 42 }]),
        sendMessage,
      },
    },
  };
}

describe("popup", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <label>
        <input id="auto-fill" type="checkbox" />
        Auto-fill
      </label>
      <button id="fill" type="button">Fill now</button>
    `;
  });

  it("loads and saves the auto-fill toggle", async () => {
    const { chrome, values } = createChromeStub({
      [AUTO_FILL_ENABLED_KEY]: false,
    });

    await initPopup(document, chrome);

    const toggle = document.querySelector(
      "#auto-fill",
    ) as HTMLInputElement | null;
    expect(toggle?.checked).toBe(false);

    toggle!.checked = true;
    toggle!.dispatchEvent(new Event("change"));

    await vi.waitFor(() => {
      expect(values.get(AUTO_FILL_ENABLED_KEY)).toBe(true);
    });
  });

  it("sends a manual fill message to the active tab", async () => {
    const { chrome } = createChromeStub();

    await initPopup(document, chrome);

    document.querySelector<HTMLButtonElement>("#fill")!.click();

    await vi.waitFor(() => {
      expect(chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(42, {
        type: "RUN_FILL",
      });
    });
  });
});
