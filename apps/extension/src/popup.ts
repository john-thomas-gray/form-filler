import {
  createChromeStorageAdapter,
  loadAutoFillEnabled,
  saveAutoFillEnabled,
} from "./settings";

type PopupChromeApi = Parameters<typeof createChromeStorageAdapter>[0] & {
  tabs: {
    query(queryInfo: {
      active: boolean;
      currentWindow: boolean;
    }): Promise<Array<{ id?: number }>>;
    sendMessage(tabId: number, message: unknown): void | Promise<unknown>;
  };
};

function getDefaultChrome(): PopupChromeApi | undefined {
  return (globalThis as { chrome?: PopupChromeApi }).chrome;
}

async function sendManualFill(chromeApi: PopupChromeApi) {
  const [tab] = await chromeApi.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!tab?.id) return;

  await chromeApi.tabs.sendMessage(tab.id, { type: "RUN_FILL" });
}

export async function initPopup(
  doc: Document = document,
  chromeApi = getDefaultChrome(),
): Promise<void> {
  if (!chromeApi) return;

  const autoFillToggle = doc.getElementById(
    "auto-fill",
  ) as HTMLInputElement | null;
  const fillButton = doc.getElementById("fill") as HTMLButtonElement | null;
  const storage = createChromeStorageAdapter(chromeApi);

  if (autoFillToggle) {
    autoFillToggle.checked = await loadAutoFillEnabled(storage);
    autoFillToggle.addEventListener("change", () => {
      void saveAutoFillEnabled(autoFillToggle.checked, storage);
    });
  }

  fillButton?.addEventListener("click", () => {
    void sendManualFill(chromeApi);
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void initPopup();
    });
  } else {
    void initPopup();
  }
}
