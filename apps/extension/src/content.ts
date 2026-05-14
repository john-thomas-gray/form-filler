import type { FillStrategy } from "@form-filler/shared";
import { getButtonPressObservation } from "./buttonPress";
import { fillPage, getCandidateText } from "./domFill";
import {
  uploadCoverLetterFromDocuments,
  uploadResumeFromDocuments,
} from "./fileUpload";
import {
  loadLearnedRules,
  rememberAnswer,
} from "./learnedMemory";
import {
  getRadioGroupLabelText,
  getRadioLabelText,
  type RememberedRadioSelections,
} from "./radioFill";
import { RULES } from "./rules";
import { createChromeStorageAdapter, loadAutoFillEnabled } from "./settings";

const REMEMBERED_RADIO_LABEL_KEY = "rememberedRadioLabel";
const REMEMBERED_RADIO_GROUP_LABEL_KEY = "rememberedRadioGroupLabel";
const REMEMBERED_RADIO_SELECTIONS_KEY = "rememberedRadioSelections";
const storage = createChromeStorageAdapter();

const touched = new WeakSet<Element>();
const filled = new WeakSet<Element>();

let isFilling = false;
let learningQueue = Promise.resolve();
let radioLabelQueue = Promise.resolve();

function getFieldAnswer(
  field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): string {
  if (field instanceof HTMLSelectElement) {
    return field.selectedOptions[0]?.text.trim() || field.value.trim();
  }

  if (field instanceof HTMLTextAreaElement) return field.value.trim();

  const type = (field.getAttribute("type") || "text").toLowerCase();

  if (type === "checkbox") return field.checked ? "true" : "";
  if (type === "radio") return field.checked ? field.value.trim() : "";

  return field.value.trim();
}

function queueRememberObservation(
  question: string,
  answer: string,
  strategy?: FillStrategy,
) {
  if (!question || !answer) return;

  learningQueue = learningQueue
    .then(async () => {
      await rememberAnswer({ question, answer, strategy });
    })
    .catch((err) => {
      console.warn("Failed to remember form answer", err);
    });
}

function queueRememberFieldAnswer(
  field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
) {
  queueRememberObservation(getCandidateText(field), getFieldAnswer(field));
}

function queueRememberRadioLabel(radio: HTMLInputElement) {
  const label = getRadioLabelText(radio);
  if (!label) {
    console.log("[form-filler] radio selection not remembered: missing label", {
      value: radio.value,
      name: radio.name,
      id: radio.id,
    });
    return;
  }
  const groupLabel = getRadioGroupLabelText(radio);
  if (!groupLabel) {
    console.log(
      "[form-filler] radio selection not remembered: missing group label",
      {
        label,
        value: radio.value,
        name: radio.name,
        id: radio.id,
      },
    );
    return;
  }

  console.log("[form-filler] queueing radio selection memory", {
    groupLabel,
    label,
    value: radio.value,
    name: radio.name,
    id: radio.id,
  });

  radioLabelQueue = radioLabelQueue
    .then(async () => {
      const selections =
        (await storage.get<RememberedRadioSelections>(
          REMEMBERED_RADIO_SELECTIONS_KEY,
        )) ?? {};
      console.log("[form-filler] loaded radio selections before save", {
        selections,
      });

      const nextSelections = {
        ...selections,
        [groupLabel]: label,
      };
      console.log("[form-filler] committing radio selection to memory", {
        storageKey: REMEMBERED_RADIO_SELECTIONS_KEY,
        groupLabel,
        radioLabel: label,
        previousSelections: selections,
        nextSelections,
      });
      await storage.set(REMEMBERED_RADIO_SELECTIONS_KEY, nextSelections);
      console.log("[form-filler] saved radio selections", {
        storageKey: REMEMBERED_RADIO_SELECTIONS_KEY,
        selections: nextSelections,
      });
    })
    .catch((err) => {
      console.warn("Failed to remember radio selection", err);
    });
}

function markTouched(e: Event) {
  // Only consider real user events.
  // Programmatic events dispatched by the extension have isTrusted === false.
  if (!(e as any).isTrusted) return;
  if (isFilling) return;

  const t = e.target;
  if (t instanceof HTMLInputElement && t.type.toLowerCase() === "radio") {
    touched.add(t);
    if ((e.type === "input" || e.type === "change") && t.checked) {
      queueRememberRadioLabel(t);
    }
    return;
  }

  if (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement
  ) {
    touched.add(t);
    if (e.type === "input" || e.type === "change") {
      queueRememberFieldAnswer(t);
    }
    return;
  }

  if (e.type === "click" && t instanceof Element) {
    const observation = getButtonPressObservation(t);
    if (!observation) return;

    touched.add(observation.choice);
    queueRememberObservation(
      observation.question,
      observation.answer,
      observation.strategy,
    );
  }
}

// Capture so we catch it even if the site stops propagation
document.addEventListener("input", markTouched, true);
document.addEventListener("change", markTouched, true);
document.addEventListener("click", markTouched, true);

async function run() {
  const [
    learnedRules,
    rememberedRadioSelections,
    rememberedRadioLabel,
    rememberedRadioGroupLabel,
  ] = await Promise.all([
    loadLearnedRules().catch((err) => {
      console.warn("Failed to load learned form rules", err);
      return {};
    }),
    storage.get<RememberedRadioSelections>(
      REMEMBERED_RADIO_SELECTIONS_KEY,
    ).catch((err) => {
      console.warn("Failed to load remembered radio selections", err);
      return undefined;
    }),
    storage.get<string>(REMEMBERED_RADIO_LABEL_KEY).catch((err) => {
      console.warn("Failed to load remembered radio label", err);
      return undefined;
    }),
    storage.get<string>(REMEMBERED_RADIO_GROUP_LABEL_KEY).catch((err) => {
      console.warn("Failed to load remembered radio group label", err);
      return undefined;
    }),
  ]);
  const radioSelections =
    rememberedRadioSelections ??
    (rememberedRadioGroupLabel && rememberedRadioLabel
      ? { [rememberedRadioGroupLabel]: rememberedRadioLabel }
      : undefined);

  console.log("[form-filler] loaded fill inputs", {
    rememberedRadioSelections,
    rememberedRadioLabel,
    rememberedRadioGroupLabel,
    radioSelections,
  });

  isFilling = true;
  try {
    fillPage(learnedRules, {
      touched,
      filled,
      radioSelections,
    });
    fillPage(RULES, {
      touched,
      filled,
      radioSelections,
    });
    void uploadResumeFromDocuments();
    void uploadCoverLetterFromDocuments();
  } finally {
    isFilling = false;
  }
}

async function runIfAutoFillEnabled() {
  const enabled = await loadAutoFillEnabled().catch((err) => {
    console.warn("Failed to load auto-fill setting", err);
    return true;
  });

  if (enabled) await run();
}

// Run after DOMContentLoaded, then once more after hydration commonly finishes
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void runIfAutoFillEnabled();
    setTimeout(() => void runIfAutoFillEnabled(), 600);
  });
} else {
  void runIfAutoFillEnabled();
  setTimeout(() => void runIfAutoFillEnabled(), 600);
}

// Observe dynamic inserts (SPAs)
let scheduled: number | undefined;

const observer = new MutationObserver(() => {
  if (isFilling) return;

  if (scheduled) clearTimeout(scheduled);
  scheduled = window.setTimeout(runIfAutoFillEnabled, 200);
});

observer.observe(document.documentElement, { subtree: true, childList: true });

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "RUN_FILL") void run();
});
