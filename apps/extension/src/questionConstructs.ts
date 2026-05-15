import type { FillRule } from "@form-filler/shared";
import { cssEscape } from "../utils/normalization";
import {
  checkboxGroupAcceptsRule,
  checkCheckboxChoiceGroup,
  findCheckboxChoiceGroups,
  isCheckboxChoiceGroupAnswered,
} from "./checkboxFill";
import { isListboxComboboxInput } from "./listboxFill";

export type QuestionConstructKind =
  | "text"
  | "textarea"
  | "select"
  | "checkbox";

export type QuestionConstructDefinition = {
  kind: QuestionConstructKind;
  description: string;
};

export type QuestionConstruct = {
  kind: QuestionConstructKind;
  questionText: string;
  container: Element;
  elements: Element[];
  isAnswered(): boolean;
  accepts(rule: FillRule): boolean;
  fill(rule: FillRule, touched?: WeakSet<Element>): boolean;
};

export const QUESTION_CONSTRUCTS: QuestionConstructDefinition[] = [
  {
    kind: "text",
    description: "Single-line text-like input with label or nearby prompt text.",
  },
  {
    kind: "textarea",
    description: "Multi-line freeform text field.",
  },
  {
    kind: "select",
    description: "Native select menu with label or nearby prompt text.",
  },
  {
    kind: "checkbox",
    description: "Native checkbox choice group with label or nearby prompt text.",
  },
];

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function dispatchEvents(el: HTMLElement) {
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function dispatchPointerEvent(el: HTMLElement, type: string) {
  const view = el.ownerDocument.defaultView;
  if (!view) return;

  const init = { bubbles: true, cancelable: true };
  const event =
    typeof view.PointerEvent === "function"
      ? new view.PointerEvent(type, init)
      : new view.Event(type, init);
  el.dispatchEvent(event);
}

function dispatchMouseEvent(el: HTMLElement, type: string) {
  const view = el.ownerDocument.defaultView;
  if (!view) return;

  el.dispatchEvent(new view.MouseEvent(type, { bubbles: true, cancelable: true }));
}

function focusForProgrammaticFill(el: HTMLElement) {
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
}

function activateAfterProgrammaticFill(el: HTMLElement): boolean {
  const alreadyFocused = document.activeElement === el;

  dispatchPointerEvent(el, "pointerdown");
  dispatchMouseEvent(el, "mousedown");

  if (!alreadyFocused) focusForProgrammaticFill(el);

  dispatchPointerEvent(el, "pointerup");
  dispatchMouseEvent(el, "mouseup");
  dispatchMouseEvent(el, "click");

  return !alreadyFocused && document.activeElement === el;
}

function blurAfterProgrammaticFill(el: HTMLElement, didFocus: boolean) {
  if (didFocus && document.activeElement === el) el.blur();
}

export function focusAndBlurTextControl(
  el: HTMLInputElement | HTMLTextAreaElement,
) {
  if (el.ownerDocument.activeElement === el) el.blur();
  focusForProgrammaticFill(el);
  if (el.ownerDocument.activeElement === el) el.blur();
}

function setNativeValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const proto =
    el instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLTextAreaElement.prototype;

  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  desc?.set?.call(el, value);
}

function setNativeSelectValue(el: HTMLSelectElement, value: string) {
  const desc = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    "value",
  );
  desc?.set?.call(el, value);
}

function isTextInput(el: HTMLInputElement): boolean {
  const element: Element = el;
  if (isListboxComboboxInput(element)) return false;

  const type = (el.getAttribute("type") || "text").toLowerCase();
  return ![
    "button",
    "checkbox",
    "file",
    "hidden",
    "image",
    "password",
    "radio",
    "reset",
    "submit",
  ].includes(type);
}

function acceptsTextRule(rule: FillRule): boolean {
  return Boolean(rule.value);
}

function acceptsSelectRule(rule: FillRule): boolean {
  return Boolean(rule.value) && (!rule.strategy || rule.strategy === "select");
}

function normalizeSelectionText(value: string): string {
  return cleanText(value).toLowerCase();
}

function normalizeLooseSelectionText(value: string): string {
  return normalizeSelectionText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeCompactSelectionText(value: string): string {
  return normalizeLooseSelectionText(value).replace(/[^a-z0-9]/g, "");
}

function getOptionText(option: HTMLOptionElement): string {
  const text = cleanText(option.textContent ?? "");
  return text || cleanText(option.label ?? "");
}

function scoreSelectOptionText(optionText: string, desired: string): number {
  const desiredText = normalizeSelectionText(desired);
  const looseDesiredText = normalizeLooseSelectionText(desired);
  const compactDesiredText = normalizeCompactSelectionText(desired);
  const normalizedOptionText = normalizeSelectionText(optionText);
  const looseOptionText = normalizeLooseSelectionText(optionText);
  const compactOptionText = normalizeCompactSelectionText(optionText);

  if (!compactDesiredText || !compactOptionText) return 0;

  if (normalizedOptionText === desiredText) return 10_000;
  if (looseOptionText === looseDesiredText) return 9_000;
  if (compactOptionText === compactDesiredText) return 8_000;

  if (
    compactDesiredText.length >= 3 &&
    compactOptionText.includes(compactDesiredText)
  ) {
    return 7_000 + compactDesiredText.length;
  }

  if (
    compactOptionText.length >= 3 &&
    compactDesiredText.includes(compactOptionText)
  ) {
    const startsDesired = compactDesiredText.startsWith(compactOptionText);
    return 5_000 + (startsDesired ? 500 : 0) + compactOptionText.length;
  }

  return 0;
}

function scoreSelectOption(
  option: HTMLOptionElement,
  desired: string,
): number {
  return Math.max(
    scoreSelectOptionText(getOptionText(option), desired),
    scoreSelectOptionText(option.value, desired),
  );
}

function findSelectOptionByRuleValue(
  el: HTMLSelectElement,
  value: string,
): HTMLOptionElement | null {
  const options = Array.from(el.options).filter((option) => !option.disabled);
  let bestOption: HTMLOptionElement | null = null;
  let bestScore = 0;

  for (const option of options) {
    const score = scoreSelectOption(option, value);
    if (score > bestScore) {
      bestScore = score;
      bestOption = option;
    }
  }

  return bestOption;
}

function isSelectAnswered(el: HTMLSelectElement): boolean {
  if (el.multiple) {
    return Array.from(el.selectedOptions).some((option) =>
      option.value.trim().length > 0,
    );
  }

  const selectedOption = el.selectedOptions[0];
  if (!selectedOption) return false;
  if (selectedOption.value.trim().length === 0) return false;
  if (selectedOption.defaultSelected) return true;

  return el.selectedIndex > 0;
}

const CONTROL_SELECTOR =
  "input, textarea, select, button, [role='button'], [role='listbox'], [role='option']";
const QUESTION_CONTROL_SELECTOR = "input:not([type='hidden']), textarea, select";
const MAX_LABEL_ANCESTOR_DEPTH = 7;

function getTextWithoutControls(element: HTMLElement): string {
  const clone = element.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    return cleanText(element.textContent ?? "");
  }

  for (const control of Array.from(clone.querySelectorAll(CONTROL_SELECTOR))) {
    control.remove();
  }

  return cleanText(clone.textContent ?? "");
}

function containsNestedControl(el: HTMLElement): boolean {
  return Boolean(el.querySelector(CONTROL_SELECTOR));
}

function getPreviousSiblingText(el: Element): string {
  let previous = el.previousElementSibling;

  while (previous) {
    if (previous instanceof HTMLElement) {
      if (previous.matches("input, textarea, select, button")) return "";
      if (containsNestedControl(previous)) return "";

      const text = cleanText((previous.textContent ?? "").replace(/\*/g, " "));
      if (text) return text;
    }

    previous = previous.previousElementSibling;
  }

  return "";
}

function getTextBeforeControl(container: HTMLElement, control: HTMLElement): string {
  const parts: string[] = [];

  for (const child of Array.from(container.childNodes)) {
    if (child instanceof Element && child.contains(control)) break;

    if (child instanceof HTMLElement) {
      if (child.matches(CONTROL_SELECTOR) || containsNestedControl(child)) {
        continue;
      }
      parts.push(getTextWithoutControls(child));
    } else {
      parts.push(child.textContent ?? "");
    }
  }

  return cleanText(parts.join(" ").replace(/\*/g, " "));
}

function containsOnlyCandidateTextControl(
  container: HTMLElement,
  control: HTMLElement,
): boolean {
  const controls = Array.from(
    container.querySelectorAll(QUESTION_CONTROL_SELECTOR),
  );
  return (
    controls.length > 0 &&
    controls.every((candidate) => candidate === control)
  );
}

function getAncestorPromptText(el: HTMLElement): string {
  let current: Element | null = el;

  for (let depth = 0; depth < MAX_LABEL_ANCESTOR_DEPTH; depth += 1) {
    const parent: HTMLElement | null = current?.parentElement ?? null;
    if (!parent) break;
    if (parent === el.ownerDocument.body) break;
    if (!containsOnlyCandidateTextControl(parent, el)) {
      current = parent;
      continue;
    }

    const textBeforeControl = getTextBeforeControl(parent, el);
    if (textBeforeControl) return textBeforeControl;

    const previousSiblingText = getPreviousSiblingText(parent);
    if (previousSiblingText) return previousSiblingText;

    current = parent;
  }

  return "";
}

export function getCandidateText(el: HTMLElement): string {
  const id = (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)
    .id;

  if (id) {
    const safeId = cssEscape(id);
    const label = el.ownerDocument.querySelector(`label[for="${safeId}"]`);
    if (label?.textContent?.trim()) return cleanText(label.textContent);
  }

  const wrappingLabel = el.closest("label");
  if (wrappingLabel?.textContent?.trim()) {
    return cleanText(wrappingLabel.textContent);
  }

  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanText(ariaLabel);

  const ariaLabelledBy = el.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const text = ariaLabelledBy
      .split(/\s+/)
      .map((id2) => document.getElementById(id2)?.textContent ?? "")
      .join(" ")
      .trim();
    if (text) return cleanText(text);
  }

  const placeholder = el.getAttribute("placeholder");
  if (placeholder?.trim()) return cleanText(placeholder);

  return getPreviousSiblingText(el) || getAncestorPromptText(el);
}

function textInputConstruct(el: HTMLInputElement): QuestionConstruct | null {
  const questionText = getCandidateText(el);
  if (!questionText) return null;

  return {
    kind: "text",
    questionText,
    container: el,
    elements: [el],
    isAnswered: () => el.value.trim().length > 0,
    accepts: acceptsTextRule,
    fill: (rule, touched) => {
      if (touched?.has(el)) return false;
      if (el.value === rule.value) return false;
      if (rule.inputTypes) {
        const type = (el.getAttribute("type") || "text").toLowerCase();
        if (!rule.inputTypes.includes(type)) return false;
      }

      let didFocus = false;
      try {
        setNativeValue(el, rule.value);
        didFocus = activateAfterProgrammaticFill(el);
        dispatchEvents(el);
        return true;
      } finally {
        blurAfterProgrammaticFill(el, didFocus);
      }
    },
  };
}

function textareaConstruct(el: HTMLTextAreaElement): QuestionConstruct | null {
  const questionText = getCandidateText(el);
  if (!questionText) return null;

  return {
    kind: "textarea",
    questionText,
    container: el,
    elements: [el],
    isAnswered: () => el.value.trim().length > 0,
    accepts: acceptsTextRule,
    fill: (rule, touched) => {
      if (rule.allowTextArea === false) return false;
      if (touched?.has(el)) return false;
      if (el.value === rule.value) return false;

      let didFocus = false;
      try {
        setNativeValue(el, rule.value);
        didFocus = activateAfterProgrammaticFill(el);
        dispatchEvents(el);
        return true;
      } finally {
        blurAfterProgrammaticFill(el, didFocus);
      }
    },
  };
}

function selectConstruct(el: HTMLSelectElement): QuestionConstruct | null {
  const questionText = getCandidateText(el);
  if (!questionText) return null;

  return {
    kind: "select",
    questionText,
    container: el,
    elements: [el],
    isAnswered: () => isSelectAnswered(el),
    accepts: acceptsSelectRule,
    fill: (rule, touched) => {
      if (touched?.has(el)) return false;

      const option = findSelectOptionByRuleValue(el, rule.value);
      if (!option) return false;
      if (!el.multiple && el.value === option.value) return false;
      if (el.multiple && option.selected) return false;

      const alreadyFocused = el.ownerDocument.activeElement === el;
      try {
        if (!alreadyFocused) focusForProgrammaticFill(el);

        if (el.multiple) {
          for (const candidate of Array.from(el.options)) {
            candidate.selected = false;
          }
          option.selected = true;
        } else {
          setNativeSelectValue(el, option.value);
        }

        dispatchEvents(el);
        return true;
      } finally {
        blurAfterProgrammaticFill(
          el,
          !alreadyFocused && el.ownerDocument.activeElement === el,
        );
      }
    },
  };
}

export function recognizeQuestionConstructs(
  root: ParentNode = document,
): QuestionConstruct[] {
  const constructs: QuestionConstruct[] = [];

  const inputs = Array.from(root.querySelectorAll("input"));
  for (const input of inputs) {
    if (!(input instanceof HTMLInputElement)) continue;

    if (isTextInput(input)) {
      const construct = textInputConstruct(input);
      if (construct) constructs.push(construct);
    }
  }

  const textareas = Array.from(root.querySelectorAll("textarea"));
  for (const textarea of textareas) {
    if (!(textarea instanceof HTMLTextAreaElement)) continue;

    const construct = textareaConstruct(textarea);
    if (construct) constructs.push(construct);
  }

  const selects = Array.from(root.querySelectorAll("select"));
  for (const select of selects) {
    if (!(select instanceof HTMLSelectElement)) continue;

    const construct = selectConstruct(select);
    if (construct) constructs.push(construct);
  }

  for (const group of findCheckboxChoiceGroups(root)) {
    constructs.push({
      kind: "checkbox",
      questionText: group.groupLabel,
      container: group.container,
      elements: group.choices.map((choice) => choice.checkbox),
      isAnswered: () => isCheckboxChoiceGroupAnswered(group),
      accepts: checkboxGroupAcceptsRule,
      fill: (rule, touched) => checkCheckboxChoiceGroup(group, rule, touched),
    });
  }

  return constructs;
}
