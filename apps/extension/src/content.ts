import { fillPage } from "./domFill";
import {
  uploadCoverLetterFromDocuments,
  uploadResumeFromDocuments,
} from "./fileUpload";
import { RULES } from "./rules";

const touched = new WeakSet<Element>();
const filled = new WeakSet<Element>();

let isFilling = false;

function markTouched(e: Event) {
  // Only consider real user events.
  // Programmatic events dispatched by the extension have isTrusted === false.
  if (!(e as any).isTrusted) return;
  if (isFilling) return;

  const t = e.target;
  if (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement
  ) {
    touched.add(t);
  }
}

// Capture so we catch it even if the site stops propagation
document.addEventListener("input", markTouched, true);
document.addEventListener("change", markTouched, true);
document.addEventListener("click", markTouched, true);

function run() {
  isFilling = true;
  try {
    fillPage(RULES, { touched, filled });
    void uploadResumeFromDocuments();
    void uploadCoverLetterFromDocuments();
  } finally {
    isFilling = false;
  }
}

// Run after DOMContentLoaded, then once more after hydration commonly finishes
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    run();
    setTimeout(run, 600);
  });
} else {
  run();
  setTimeout(run, 600);
}

// Observe dynamic inserts (SPAs)
let scheduled: number | undefined;

const observer = new MutationObserver(() => {
  if (isFilling) return;

  if (scheduled) clearTimeout(scheduled);
  scheduled = window.setTimeout(run, 200);
});

observer.observe(document.documentElement, { subtree: true, childList: true });

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "RUN_FILL") run();
});
