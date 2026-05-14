import type { Rules } from "@form-filler/shared";
import { pickBestRule } from "@form-filler/shared";
import {
  pressRememberedYesNoCheckboxButtons,
  type RememberedYesNoSelections,
} from "./buttonPress";
import {
  getCandidateText,
  recognizeQuestionConstructs,
} from "./questionConstructs";
import {
  selectRememberedListboxOptions,
  type RememberedListboxSelections,
} from "./listboxFill";
import {
  checkRememberedRadioButtons,
  type RememberedRadioSelections,
} from "./radioFill";

export { getCandidateText };

export function fillPage(
  rules: Rules,
  opts?: {
    touched?: WeakSet<Element>;
    filled?: WeakSet<Element>;
    radioSelections?: RememberedRadioSelections;
    yesNoSelections?: RememberedYesNoSelections;
    listboxSelections?: RememberedListboxSelections;
  },
) {
  const touched = opts?.touched;
  const filled = opts?.filled;

  console.log("[form-filler] domFill fired", {
    hasTouchedSet: Boolean(touched),
    hasFilledSet: Boolean(filled),
    radioSelections: opts?.radioSelections,
    yesNoSelections: opts?.yesNoSelections,
    listboxSelections: opts?.listboxSelections,
  });

  if (opts?.radioSelections) {
    console.log("[form-filler] starting radio fill", {
      radioSelections: opts.radioSelections,
    });
    checkRememberedRadioButtons(opts.radioSelections);
  } else {
    console.log("[form-filler] skipping radio fill: no remembered selections");
  }

  if (
    opts?.yesNoSelections &&
    Object.keys(opts.yesNoSelections).length > 0
  ) {
    console.log("[form-filler] starting yes/no fill", {
      yesNoSelections: opts.yesNoSelections,
    });
    pressRememberedYesNoCheckboxButtons(
      opts.yesNoSelections,
      document,
      filled,
    );
  } else {
    console.log("[form-filler] skipping yes/no fill: no remembered selections");
  }

  if (
    opts?.listboxSelections &&
    Object.keys(opts.listboxSelections).length > 0
  ) {
    console.log("[form-filler] starting listbox fill", {
      listboxSelections: opts.listboxSelections,
    });
    const didQueueListboxFill = selectRememberedListboxOptions(
      opts.listboxSelections,
      document,
      filled,
    );
    if (didQueueListboxFill) {
      return;
    }
  } else {
    console.log("[form-filler] skipping listbox fill: no remembered selections");
  }

  for (const construct of recognizeQuestionConstructs()) {
    try {
      if (filled?.has(construct.container)) continue;
      if (construct.elements.some((el) => touched?.has(el))) continue;
      if (construct.isAnswered()) continue;

      const rule = pickBestRule(construct.questionText, rules);
      if (!rule) continue;
      if (!construct.accepts(rule)) continue;

      const didFill = construct.fill(rule, touched);
      if (!didFill) continue;

      filled?.add(construct.container);
      for (const el of construct.elements) filled?.add(el);
    } catch (err) {
      console.warn("Failed to fill form question", {
        kind: construct.kind,
        question: construct.questionText,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
