import type { FillRule } from "@form-filler/shared";
import { cssEscape } from "../utils/normalization";

export type RememberedCheckboxSelections = Record<string, string[]>;

export type CheckboxSelectionObservation = {
  groupLabel: string;
  optionText: string;
  checkbox: HTMLInputElement;
  checked: boolean;
  container: HTMLElement;
};

export type CheckboxChoice = {
  checkbox: HTMLInputElement;
  labelText: string;
  labelElement?: HTMLElement;
};

export type CheckboxChoiceGroup = {
  container: HTMLElement;
  groupLabel: string;
  choices: CheckboxChoice[];
};

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanQuestionText(value: string): string {
  return cleanText(value.replace(/\*/g, " "));
}

function normalizeLookupKey(value: string): string {
  return cleanQuestionText(value).toLowerCase();
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

function getTextWithoutControls(element: HTMLElement): string {
  const clone = element.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    return cleanQuestionText(element.textContent ?? "");
  }

  for (const control of Array.from(
    clone.querySelectorAll(
      [
        "input",
        "textarea",
        "select",
        "button",
        "[role='button']",
        "[role='checkbox']",
        "[role='radio']",
        "[role='listbox']",
        "[role='option']",
      ].join(","),
    ),
  )) {
    control.remove();
  }

  return cleanQuestionText(clone.textContent ?? "");
}

function getLabelText(label: HTMLElement): string {
  const textWithoutControls = getTextWithoutControls(label);
  if (textWithoutControls) return textWithoutControls;

  return cleanText(label.textContent ?? "");
}

function findExplicitLabel(input: HTMLInputElement): HTMLElement | null {
  if (!input.id) return null;

  const label = input.ownerDocument.querySelector(
    `label[for="${cssEscape(input.id)}"]`,
  );
  return label instanceof HTMLElement ? label : null;
}

function findWrappingLabel(input: HTMLInputElement): HTMLElement | null {
  const label = input.closest("label");
  return label instanceof HTMLElement ? label : null;
}

export function getCheckboxOptionLabelText(checkbox: HTMLInputElement): string {
  const ariaLabel = checkbox.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanText(ariaLabel);

  const explicitLabel = findExplicitLabel(checkbox);
  if (explicitLabel) {
    const labelText = getLabelText(explicitLabel);
    if (labelText) return labelText;
  }

  const wrappingLabel = findWrappingLabel(checkbox);
  if (wrappingLabel) {
    const labelText = getLabelText(wrappingLabel);
    if (labelText) return labelText;
  }

  if (checkbox.value && checkbox.value !== "on") {
    return cleanText(checkbox.value);
  }

  return cleanText(checkbox.parentElement?.textContent ?? "");
}

function getCheckboxes(container: ParentNode): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('input[type="checkbox"]')).filter(
    (input): input is HTMLInputElement => input instanceof HTMLInputElement,
  );
}

function getTextBeforeChild(
  container: HTMLElement,
  childOnPath: Element,
): string {
  const parts: string[] = [];

  for (const child of Array.from(container.childNodes)) {
    if (
      child === childOnPath ||
      (child instanceof Element && child.contains(childOnPath))
    ) {
      break;
    }

    if (child instanceof HTMLElement) {
      if (child.querySelector('input[type="checkbox"]')) continue;
      parts.push(getTextWithoutControls(child));
    } else {
      parts.push(child.textContent ?? "");
    }
  }

  return cleanQuestionText(parts.join(" "));
}

function getPreviousSiblingQuestionText(element: Element): string {
  let previous = element.previousElementSibling;

  while (previous) {
    if (previous instanceof HTMLElement) {
      if (previous.querySelector('input[type="checkbox"]')) return "";

      const text = getTextWithoutControls(previous);
      if (text) return text;
    }

    previous = previous.previousElementSibling;
  }

  return "";
}

function getApplicationQuestionLabel(checkbox: HTMLInputElement): string {
  const applicationQuestion = checkbox.closest(".application-question");
  if (!(applicationQuestion instanceof HTMLElement)) return "";

  const label =
    applicationQuestion.querySelector(".application-label .text") ??
    applicationQuestion.querySelector(".application-label");
  return label instanceof HTMLElement ? getTextWithoutControls(label) : "";
}

function getFieldsetLegendText(checkbox: HTMLInputElement): string {
  const legend = checkbox.closest("fieldset")?.querySelector("legend");
  return legend instanceof HTMLElement ? getTextWithoutControls(legend) : "";
}

function getContainerAriaLabelText(container: HTMLElement): string {
  const ariaLabel = container.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanQuestionText(ariaLabel);

  const ariaLabelledBy = container.getAttribute("aria-labelledby");
  if (!ariaLabelledBy) return "";

  return cleanQuestionText(
    ariaLabelledBy
      .split(/\s+/)
      .map((id) => container.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" "),
  );
}

export function getCheckboxGroupLabelText(
  checkbox: HTMLInputElement,
  container?: HTMLElement,
): string {
  const applicationLabel = getApplicationQuestionLabel(checkbox);
  if (applicationLabel) return applicationLabel;

  const fieldsetLegend = getFieldsetLegendText(checkbox);
  if (fieldsetLegend) return fieldsetLegend;

  if (container) {
    const ariaLabel = getContainerAriaLabelText(container);
    if (ariaLabel) return ariaLabel;
  }

  let childOnPath: Element = checkbox;
  let current: HTMLElement | null = checkbox.parentElement;

  for (let depth = 0; depth < 10 && current; depth += 1) {
    if (current === checkbox.ownerDocument.body) break;

    const textBeforeChild = getTextBeforeChild(current, childOnPath);
    if (textBeforeChild) return textBeforeChild;

    const previousSiblingText = getPreviousSiblingQuestionText(childOnPath);
    if (previousSiblingText) return previousSiblingText;

    childOnPath = current;
    current = current.parentElement;
  }

  return "";
}

function findCheckboxGroupContainer(
  checkbox: HTMLInputElement,
): HTMLElement | null {
  let current = checkbox.parentElement;

  for (let depth = 0; depth < 10 && current; depth += 1) {
    if (current === checkbox.ownerDocument.body) break;

    const checkboxes = getCheckboxes(current);
    const matchingNameCount = checkbox.name
      ? checkboxes.filter((candidate) => candidate.name === checkbox.name).length
      : checkboxes.length;

    if (checkboxes.length >= 2 && matchingNameCount >= 2) {
      const groupLabel = getCheckboxGroupLabelText(checkbox, current);
      if (groupLabel) return current;
    }

    current = current.parentElement;
  }

  return null;
}

function getCheckboxChoices(container: HTMLElement): CheckboxChoice[] {
  return getCheckboxes(container)
    .filter((checkbox) => !checkbox.disabled)
    .map((checkbox) => ({
      checkbox,
      labelText: getCheckboxOptionLabelText(checkbox),
      labelElement: findWrappingLabel(checkbox) ?? findExplicitLabel(checkbox) ?? undefined,
    }))
    .filter((choice) => choice.labelText.length > 0);
}

export function findCheckboxChoiceGroups(
  root: ParentNode = document,
): CheckboxChoiceGroup[] {
  const checkboxes = getCheckboxes(root);
  const seenContainers = new Set<HTMLElement>();
  const groups: CheckboxChoiceGroup[] = [];

  for (const checkbox of checkboxes) {
    if (checkbox.disabled) continue;

    const container = findCheckboxGroupContainer(checkbox);
    if (!container || seenContainers.has(container)) continue;

    const groupLabel = getCheckboxGroupLabelText(checkbox, container);
    const choices = getCheckboxChoices(container);
    seenContainers.add(container);

    if (!groupLabel || choices.length < 2) continue;

    groups.push({
      container,
      groupLabel,
      choices,
    });
  }

  return groups;
}

export function getCheckboxSelectionObservation(
  target: EventTarget | null,
): CheckboxSelectionObservation | null {
  if (!(target instanceof Element)) return null;

  const checkbox = target.closest('input[type="checkbox"]');
  if (!(checkbox instanceof HTMLInputElement)) return null;
  if (checkbox.disabled) return null;

  const container = findCheckboxGroupContainer(checkbox);
  if (!container) return null;

  const groupLabel = getCheckboxGroupLabelText(checkbox, container);
  const optionText = getCheckboxOptionLabelText(checkbox);
  if (!groupLabel || !optionText) return null;

  return {
    groupLabel,
    optionText,
    checkbox,
    checked: checkbox.checked,
    container,
  };
}

function optionMatchesDesired(
  choice: CheckboxChoice,
  desired: string,
): boolean {
  const desiredText = normalizeSelectionText(desired);
  const looseDesiredText = normalizeLooseSelectionText(desired);
  const compactDesiredText = normalizeCompactSelectionText(desired);
  const optionText = normalizeSelectionText(choice.labelText);
  const optionValue = normalizeSelectionText(choice.checkbox.value);
  const looseOptionText = normalizeLooseSelectionText(choice.labelText);
  const looseOptionValue = normalizeLooseSelectionText(choice.checkbox.value);
  const compactOptionText = normalizeCompactSelectionText(choice.labelText);
  const compactOptionValue = normalizeCompactSelectionText(choice.checkbox.value);

  if (optionText === desiredText || optionValue === desiredText) return true;
  if (
    looseOptionText === looseDesiredText ||
    looseOptionValue === looseDesiredText
  ) {
    return true;
  }
  if (
    compactOptionText === compactDesiredText ||
    compactOptionValue === compactDesiredText
  ) {
    return true;
  }

  return (
    compactDesiredText.length >= 3 &&
    compactOptionText.length >= 3 &&
    (compactDesiredText.includes(compactOptionText) ||
      compactOptionText.includes(compactDesiredText))
  );
}

function setNativeChecked(checkbox: HTMLInputElement, checked: boolean) {
  const desc = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "checked",
  );
  desc?.set?.call(checkbox, checked);
}

function dispatchCheckboxEvents(checkbox: HTMLInputElement) {
  checkbox.dispatchEvent(new Event("input", { bubbles: true }));
  checkbox.dispatchEvent(new Event("change", { bubbles: true }));
}

function checkChoice(choice: CheckboxChoice, filled?: WeakSet<Element>): boolean {
  if (choice.checkbox.checked) {
    filled?.add(choice.checkbox);
    if (choice.labelElement) filled?.add(choice.labelElement);
    return false;
  }

  (choice.labelElement ?? choice.checkbox).click();
  if (!choice.checkbox.checked) {
    setNativeChecked(choice.checkbox, true);
  }
  dispatchCheckboxEvents(choice.checkbox);

  filled?.add(choice.checkbox);
  if (choice.labelElement) filled?.add(choice.labelElement);
  return true;
}

function getRuleDesiredValues(rule: FillRule): string[] {
  const values = [rule.value, ...(rule.checkboxValues ?? [])]
    .map(cleanText)
    .filter((value) => value.length > 0);

  return Array.from(new Set(values));
}

export function checkboxGroupAcceptsRule(rule: FillRule): boolean {
  return (
    getRuleDesiredValues(rule).length > 0 &&
    (!rule.strategy || rule.strategy === "checkbox")
  );
}

export function isCheckboxChoiceGroupAnswered(
  group: CheckboxChoiceGroup,
): boolean {
  return group.choices.some((choice) => choice.checkbox.checked);
}

export function checkCheckboxChoiceGroup(
  group: CheckboxChoiceGroup,
  rule: FillRule,
  touched?: WeakSet<Element>,
  filled?: WeakSet<Element>,
): boolean {
  const desiredValues = getRuleDesiredValues(rule);
  let didCheck = false;

  for (const choice of group.choices) {
    if (touched?.has(choice.checkbox)) continue;
    if (!desiredValues.some((value) => optionMatchesDesired(choice, value))) {
      continue;
    }

    didCheck = checkChoice(choice, filled) || didCheck;
  }

  return didCheck;
}

function buildSelectionLookup(
  selections: RememberedCheckboxSelections,
): Map<string, Set<string>> {
  const lookup = new Map<string, Set<string>>();

  for (const [groupLabel, optionTexts] of Object.entries(selections)) {
    lookup.set(
      normalizeLookupKey(groupLabel),
      new Set(optionTexts.map(normalizeLookupKey)),
    );
  }

  return lookup;
}

export function selectRememberedCheckboxOptions(
  selections: RememberedCheckboxSelections,
  root: ParentNode = document,
  filled?: WeakSet<Element>,
): boolean {
  const lookup = buildSelectionLookup(selections);
  const groups = findCheckboxChoiceGroups(root);
  let didFill = false;

  for (const group of groups) {
    const rememberedOptions = lookup.get(normalizeLookupKey(group.groupLabel));
    if (!rememberedOptions || rememberedOptions.size === 0) continue;

    for (const choice of group.choices) {
      if (!rememberedOptions.has(normalizeLookupKey(choice.labelText))) {
        continue;
      }

      didFill = checkChoice(choice, filled) || didFill;
    }
  }

  return didFill;
}
