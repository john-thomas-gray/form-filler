import type { FillRule } from "@form-filler/shared";
import { cssEscape } from "../utils/normalization";

export type QuestionConstructKind =
  | "text"
  | "textarea";

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

function isTextInput(el: HTMLInputElement): boolean {
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

function getPreviousSiblingText(el: Element): string {
  let previous = el.previousElementSibling;

  while (previous) {
    if (previous instanceof HTMLElement) {
      if (previous.matches("input, textarea, select, button")) return "";

      const text = cleanText((previous.textContent ?? "").replace(/\*/g, " "));
      if (text) return text;
    }

    previous = previous.previousElementSibling;
  }

  return "";
}

export function getCandidateText(el: HTMLElement): string {
  const id = (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)
    .id;

  if (id) {
    const safeId = cssEscape(id);
    const label = document.querySelector(`label[for="${safeId}"]`);
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

  return getPreviousSiblingText(el);
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

  return constructs;
}
