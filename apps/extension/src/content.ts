import type { FillStrategy } from "@form-filler/shared";
import {
  getButtonPressObservation,
  getYesNoCheckboxObservation,
  type RememberedYesNoSelections,
  type YesNoCheckboxObservation,
} from "./buttonPress";
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
import {
  getListboxKeyboardSelectionObservation,
  getListboxOptionClickObservation,
  hasPendingListboxSelections,
  isListboxComboboxInput,
  type ListboxSelectionObservation,
  type RememberedListboxSelections,
} from "./listboxFill";
import { RULES } from "./rules";
import { createChromeStorageAdapter, loadAutoFillEnabled } from "./settings";

const REMEMBERED_RADIO_LABEL_KEY = "rememberedRadioLabel";
const REMEMBERED_RADIO_GROUP_LABEL_KEY = "rememberedRadioGroupLabel";
const REMEMBERED_RADIO_SELECTIONS_KEY = "rememberedRadioSelections";
const REMEMBERED_YES_NO_SELECTIONS_KEY = "rememberedYesNoSelections";
const REMEMBERED_LISTBOX_SELECTIONS_KEY = "rememberedListboxSelections";
const storage = createChromeStorageAdapter();

const touched = new WeakSet<Element>();
const filled = new WeakSet<Element>();

let isFilling = false;
let learningQueue = Promise.resolve();
let radioLabelQueue = Promise.resolve();
let yesNoSelectionQueue = Promise.resolve();
let listboxSelectionQueue = Promise.resolve();

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

function queueRememberYesNoSelection(observation: YesNoCheckboxObservation) {
  const { groupLabel, answer, choice, container } = observation;
  if (!groupLabel || !answer) {
    console.log("[form-filler] yes/no selection not remembered: missing data", {
      groupLabel,
      answer,
      buttonText: choice.textContent?.trim(),
      containerText: container.textContent?.trim(),
    });
    return;
  }

  console.log("[form-filler] queueing yes/no selection memory", {
    groupLabel,
    answer,
    buttonText: choice.textContent?.trim(),
    containerText: container.textContent?.trim(),
  });

  yesNoSelectionQueue = yesNoSelectionQueue
    .then(async () => {
      const selections =
        (await storage.get<RememberedYesNoSelections>(
          REMEMBERED_YES_NO_SELECTIONS_KEY,
        )) ?? {};
      console.log("[form-filler] loaded yes/no selections before save", {
        selections,
      });

      const nextSelections = {
        ...selections,
        [groupLabel]: answer,
      };
      console.log("[form-filler] committing yes/no selection to memory", {
        storageKey: REMEMBERED_YES_NO_SELECTIONS_KEY,
        groupLabel,
        answer,
        previousSelections: selections,
        nextSelections,
      });
      await storage.set(REMEMBERED_YES_NO_SELECTIONS_KEY, nextSelections);
      console.log("[form-filler] saved yes/no selections", {
        storageKey: REMEMBERED_YES_NO_SELECTIONS_KEY,
        selections: nextSelections,
      });
    })
    .catch((err) => {
      console.warn("Failed to remember yes/no selection", err);
    });
}

function queueRememberListboxSelection(
  observation: ListboxSelectionObservation,
) {
  const { groupLabel, optionText, input, option } = observation;
  if (!groupLabel || !optionText) {
    console.log("[form-filler] listbox selection not remembered: missing data", {
      groupLabel,
      optionText,
      inputName: input.name,
      inputId: input.id,
      inputValue: input.value,
      optionTextFromElement: option?.textContent?.trim(),
    });
    return;
  }

  console.log("[form-filler] queueing listbox selection memory", {
    groupLabel,
    optionText,
    inputName: input.name,
    inputId: input.id,
    inputValue: input.value,
    optionId: option?.id,
  });

  listboxSelectionQueue = listboxSelectionQueue
    .then(async () => {
      const selections =
        (await storage.get<RememberedListboxSelections>(
          REMEMBERED_LISTBOX_SELECTIONS_KEY,
        )) ?? {};
      console.log("[form-filler] loaded listbox selections before save", {
        selections,
      });

      const nextSelections = {
        ...selections,
        [groupLabel]: optionText,
      };
      console.log("[form-filler] committing listbox selection to memory", {
        storageKey: REMEMBERED_LISTBOX_SELECTIONS_KEY,
        groupLabel,
        optionText,
        previousSelections: selections,
        nextSelections,
      });
      await storage.set(REMEMBERED_LISTBOX_SELECTIONS_KEY, nextSelections);
      console.log("[form-filler] saved listbox selections", {
        storageKey: REMEMBERED_LISTBOX_SELECTIONS_KEY,
        selections: nextSelections,
      });
    })
    .catch((err) => {
      console.warn("Failed to remember listbox selection", err);
    });
}

function markTouched(e: Event) {
  // Only consider real user events.
  // Programmatic events dispatched by the extension have isTrusted === false.
  if (!(e as any).isTrusted) return;
  if (isFilling) return;

  const t = e.target;
  if (e instanceof KeyboardEvent) {
    if (t instanceof HTMLInputElement && isListboxComboboxInput(t)) {
      touched.add(t);
      const listboxObservation = getListboxKeyboardSelectionObservation(e);
      if (listboxObservation) {
        queueRememberListboxSelection(listboxObservation);
      }
    }
    return;
  }

  if (t instanceof HTMLInputElement && t.type.toLowerCase() === "radio") {
    touched.add(t);
    if ((e.type === "input" || e.type === "change") && t.checked) {
      queueRememberRadioLabel(t);
    }
    return;
  }

  if (t instanceof HTMLInputElement && isListboxComboboxInput(t)) {
    touched.add(t);
    console.log("[form-filler] listbox combobox input event observed", {
      eventType: e.type,
      inputName: t.name,
      inputId: t.id,
      inputValue: t.value,
      ariaExpanded: t.getAttribute("aria-expanded"),
    });
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
    const listboxObservation = getListboxOptionClickObservation(t);
    if (listboxObservation) {
      touched.add(listboxObservation.input);
      if (listboxObservation.option) touched.add(listboxObservation.option);
      queueRememberListboxSelection(listboxObservation);
      return;
    }

    const yesNoObservation = getYesNoCheckboxObservation(t);
    if (yesNoObservation) {
      touched.add(yesNoObservation.choice);
      touched.add(yesNoObservation.container);
      queueRememberYesNoSelection(yesNoObservation);
      return;
    }

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
document.addEventListener("keydown", markTouched, true);

async function run() {
  const [
    learnedRules,
    rememberedRadioSelections,
    rememberedRadioLabel,
    rememberedRadioGroupLabel,
    rememberedYesNoSelections,
    rememberedListboxSelections,
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
    storage.get<RememberedYesNoSelections>(
      REMEMBERED_YES_NO_SELECTIONS_KEY,
    ).catch((err) => {
      console.warn("Failed to load remembered yes/no selections", err);
      return undefined;
    }),
    storage.get<RememberedListboxSelections>(
      REMEMBERED_LISTBOX_SELECTIONS_KEY,
    ).catch((err) => {
      console.warn("Failed to load remembered listbox selections", err);
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
    rememberedYesNoSelections,
    rememberedListboxSelections,
  });

  isFilling = true;
  try {
    fillPage(learnedRules, {
      touched,
      filled,
      radioSelections,
      yesNoSelections: rememberedYesNoSelections,
      listboxSelections: rememberedListboxSelections,
    });
    fillPage(RULES, {
      touched,
      filled,
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
  if (hasPendingListboxSelections()) return;

  if (scheduled) clearTimeout(scheduled);
  scheduled = window.setTimeout(runIfAutoFillEnabled, 200);
});

observer.observe(document.documentElement, { subtree: true, childList: true });

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "RUN_FILL") void run();
});
