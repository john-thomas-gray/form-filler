"use strict";
(() => {
  // src/popup.ts
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("fill");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      console.log("click");
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { type: "RUN_FILL" });
    });
  });
})();
