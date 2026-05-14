"use strict";
(() => {
  // src/settings.ts
  var AUTO_FILL_ENABLED_KEY = "autoFillEnabled";
  function createChromeStorageAdapter(chromeApi = chrome) {
    function getLastError() {
      return chromeApi.runtime?.lastError;
    }
    return {
      async get(key) {
        return new Promise((resolve, reject) => {
          try {
            const maybePromise = chromeApi.storage.local.get(
              key,
              (result) => {
                const lastError = getLastError();
                if (lastError) {
                  reject(lastError);
                  return;
                }
                resolve(result[key]);
              }
            );
            if (maybePromise && typeof maybePromise.then === "function") {
              void maybePromise.then(
                (result) => resolve(result[key]),
                reject
              );
            }
          } catch (err) {
            reject(err);
          }
        });
      },
      async set(key, value) {
        await new Promise((resolve, reject) => {
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
              }
            );
            if (maybePromise && typeof maybePromise.then === "function") {
              void maybePromise.then(() => resolve(), reject);
            }
          } catch (err) {
            reject(err);
          }
        });
      }
    };
  }
  async function loadAutoFillEnabled(storage = createChromeStorageAdapter()) {
    return await storage.get(AUTO_FILL_ENABLED_KEY) ?? true;
  }
  async function saveAutoFillEnabled(enabled, storage = createChromeStorageAdapter()) {
    await storage.set(AUTO_FILL_ENABLED_KEY, enabled);
  }

  // src/popup.ts
  function getDefaultChrome() {
    return globalThis.chrome;
  }
  async function sendManualFill(chromeApi) {
    const [tab] = await chromeApi.tabs.query({
      active: true,
      currentWindow: true
    });
    if (!tab?.id) return;
    await chromeApi.tabs.sendMessage(tab.id, { type: "RUN_FILL" });
  }
  async function initPopup(doc = document, chromeApi = getDefaultChrome()) {
    if (!chromeApi) return;
    const autoFillToggle = doc.getElementById(
      "auto-fill"
    );
    const fillButton = doc.getElementById("fill");
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
})();
