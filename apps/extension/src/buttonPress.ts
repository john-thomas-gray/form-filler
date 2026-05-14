import type { FillRule } from "@form-filler/shared";

const BUTTON_CHOICE_SELECTOR = [
  "button",
  '[role="button"]',
  '[role="radio"]',
  '[role="checkbox"]',
  "[aria-pressed]",
  "[aria-checked]",
  'input[type="button"]',
].join(",");

export type ButtonChoiceGroup = {
  container: HTMLElement;
  questionText: string;
  choices: HTMLElement[];
};

export type ButtonPressObservation = {
  question: string;
  answer: string;
  choice: HTMLElement;
  strategy: "button";
};

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getChoiceText(choice: HTMLElement): string {
  const ariaLabel = choice.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanText(ariaLabel);

  if (choice instanceof HTMLInputElement) {
    return cleanText(choice.value);
  }

  return cleanText(choice.textContent ?? "");
}

function isActionButton(choice: HTMLElement): boolean {
  const text = normalizeToken(getChoiceText(choice));

  if (choice instanceof HTMLButtonElement && choice.type === "submit") {
    return true;
  }

  return [
    "submit",
    "submitapplication",
    "upload",
    "uploadfile",
    "choosefile",
    "resume",
  ].includes(text);
}

function isButtonChoice(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (el.hasAttribute("disabled")) return false;
  if (el.getAttribute("aria-disabled") === "true") return false;

  const text = getChoiceText(el);
  if (!text) return false;

  return !isActionButton(el);
}

function getChoices(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(BUTTON_CHOICE_SELECTOR)).filter(
    isButtonChoice,
  );
}

function removeChoiceText(text: string, choiceText: string): string {
  const escaped = choiceText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "gi"), " ");
}

function getQuestionText(
  container: HTMLElement,
  choices: HTMLElement[],
): string {
  let text = cleanText(container.textContent ?? "");

  for (const choice of choices) {
    const choiceText = getChoiceText(choice);
    if (choiceText) text = removeChoiceText(text, choiceText);
  }

  return cleanText(text.replace(/\*/g, " "));
}

function getPreviousSiblingQuestionText(container: HTMLElement): string {
  let previous = container.previousElementSibling;

  while (previous) {
    if (previous instanceof HTMLElement) {
      if (getChoices(previous).length > 0) return "";
      if (previous.matches("input, textarea, select, button")) return "";

      const text = cleanText((previous.textContent ?? "").replace(/\*/g, " "));
      if (text) return text;
    }

    previous = previous.previousElementSibling;
  }

  return "";
}

function findButtonChoiceGroupFor(
  choice: HTMLElement,
): ButtonChoiceGroup | null {
  let current = choice.parentElement;

  for (let i = 0; i < 6 && current; i += 1) {
    const choices = getChoices(current);
    if (choices.length >= 2 && choices.length <= 8) {
      const questionText =
        getQuestionText(current, choices) ||
        getPreviousSiblingQuestionText(current);
      if (questionText.length > 5) {
        return { container: current, questionText, choices };
      }
    }

    current = current.parentElement;
  }

  return null;
}

function isSelected(choice: HTMLElement): boolean {
  return (
    choice.getAttribute("aria-pressed") === "true" ||
    choice.getAttribute("aria-checked") === "true" ||
    choice.getAttribute("data-state") === "checked" ||
    choice.classList.contains("selected")
  );
}

export function isButtonChoiceGroupAnswered(group: ButtonChoiceGroup): boolean {
  return group.choices.some(isSelected);
}

function matchesButtonOption(rule: FillRule, choice: HTMLElement): boolean {
  const wantSet = new Set([normalizeToken(rule.value)]);

  for (const value of rule.radioValues ?? []) {
    wantSet.add(normalizeToken(value));
  }

  for (const value of rule.checkboxValues ?? []) {
    wantSet.add(normalizeToken(value));
  }

  return wantSet.has(normalizeToken(getChoiceText(choice)));
}

export function findButtonChoiceGroups(
  root: ParentNode = document,
): ButtonChoiceGroup[] {
  const choices = Array.from(
    root.querySelectorAll(BUTTON_CHOICE_SELECTOR),
  ).filter(isButtonChoice);
  const groupedChoices = new Set<HTMLElement>();
  const groups = new Map<HTMLElement, ButtonChoiceGroup>();

  const choicesByParent = new Map<HTMLElement, HTMLElement[]>();
  for (const choice of choices) {
    const parent = choice.parentElement;
    if (!parent) continue;

    const siblings = choicesByParent.get(parent) ?? [];
    siblings.push(choice);
    choicesByParent.set(parent, siblings);
  }

  for (const [container, parentChoices] of choicesByParent) {
    const choicesInContainer = getChoices(container);
    if (
      parentChoices.length < 2 ||
      parentChoices.length > 8 ||
      choicesInContainer.length !== parentChoices.length
    ) {
      continue;
    }

    const questionText =
      getQuestionText(container, parentChoices) ||
      getPreviousSiblingQuestionText(container);

    if (questionText.length <= 5) continue;

    for (const choice of parentChoices) groupedChoices.add(choice);
    groups.set(container, {
      container,
      questionText,
      choices: parentChoices,
    });
  }

  for (const choice of choices) {
    if (groupedChoices.has(choice)) continue;

    const group = findButtonChoiceGroupFor(choice);
    if (group) groups.set(group.container, group);
  }

  return Array.from(groups.values());
}

export function pressButtonChoice(
  group: ButtonChoiceGroup,
  rule: FillRule,
  touched?: WeakSet<Element>,
): boolean {
  for (const choice of group.choices) {
    if (touched?.has(choice)) continue;
    if (!matchesButtonOption(rule, choice)) continue;
    if (isSelected(choice)) return false;

    choice.click();
    choice.dispatchEvent(new Event("input", { bubbles: true }));
    choice.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  return false;
}

export function getButtonPressObservation(
  target: EventTarget | null,
): ButtonPressObservation | null {
  if (!(target instanceof Element)) return null;

  const choice = target.closest(BUTTON_CHOICE_SELECTOR);
  if (!choice || !isButtonChoice(choice)) return null;

  const group = findButtonChoiceGroupFor(choice);
  if (!group) return null;

  const answer = getChoiceText(choice);
  if (!answer) return null;

  return {
    question: group.questionText,
    answer,
    choice,
    strategy: "button",
  };
}
