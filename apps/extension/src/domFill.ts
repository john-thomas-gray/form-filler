import type { Rules } from "@form-filler/shared";
import { pickBestRule } from "@form-filler/shared";
import {
  getCandidateText,
  recognizeQuestionConstructs,
} from "./questionConstructs";
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
  },
) {
  const touched = opts?.touched;
  const filled = opts?.filled;

  console.log("[form-filler] domFill fired", {
    hasTouchedSet: Boolean(touched),
    hasFilledSet: Boolean(filled),
    radioSelections: opts?.radioSelections,
  });

  if (opts?.radioSelections) {
    console.log("[form-filler] starting radio fill", {
      radioSelections: opts.radioSelections,
    });
    checkRememberedRadioButtons(opts.radioSelections);
  } else {
    console.log("[form-filler] skipping radio fill: no remembered selections");
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
