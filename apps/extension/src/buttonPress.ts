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

export type YesNoAnswer = "Yes" | "No";

export type RememberedYesNoSelections = Record<string, YesNoAnswer>;

export type YesNoCheckboxObservation = {
  groupLabel: string;
  answer: YesNoAnswer;
  choice: HTMLButtonElement;
  container: HTMLElement;
};

type YesNoCheckboxGroup = {
  container: HTMLElement;
  checkbox: HTMLInputElement;
  groupLabel: string;
  yesButton: HTMLButtonElement;
  noButton: HTMLButtonElement;
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

function getButtonText(button: HTMLButtonElement): string {
  const ariaLabel = button.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanText(ariaLabel);

  return cleanText(button.textContent ?? "");
}

function getYesNoAnswer(text: string): YesNoAnswer | null {
  const normalized = cleanText(text).toLowerCase();
  if (normalized === "yes") return "Yes";
  if (normalized === "no") return "No";
  return null;
}

function findButtonByText(
  container: HTMLElement,
  text: string,
): HTMLButtonElement | null {
  const desiredText = cleanText(text).toLowerCase();

  return (
    Array.from(container.querySelectorAll("button")).find(
      (button): button is HTMLButtonElement =>
        button instanceof HTMLButtonElement &&
        getButtonText(button).toLowerCase() === desiredText,
    ) ?? null
  );
}

function findNearestYesNoCheckboxContainer(
  button: HTMLButtonElement,
): HTMLElement | null {
  let current = button.parentElement;
  let depth = 0;

  while (current) {
    const currentText = cleanText(current.textContent ?? "");

    if (current instanceof HTMLDivElement) {
      const yesButton = findButtonByText(current, "Yes");
      const noButton = findButtonByText(current, "No");
      const checkbox = current.querySelector('input[type="checkbox"]');

      console.log("[form-filler] yes/no ancestor div scan", {
        depth,
        currentText,
        hasYesButton: Boolean(yesButton),
        hasNoButton: Boolean(noButton),
        hasCheckbox: checkbox instanceof HTMLInputElement,
        checkboxChecked:
          checkbox instanceof HTMLInputElement ? checkbox.checked : undefined,
        checkboxDisabled:
          checkbox instanceof HTMLInputElement ? checkbox.disabled : undefined,
      });

      if (yesButton && noButton && checkbox instanceof HTMLInputElement) {
        return current;
      }
    } else {
      console.log("[form-filler] yes/no ancestor scan skipping non-div", {
        depth,
        tagName: current.tagName,
        currentText,
      });
    }

    current = current.parentElement;
    depth += 1;
  }

  console.log("[form-filler] yes/no ancestor scan exhausted", {
    noButtonText: getButtonText(button),
  });
  return null;
}

function getYesNoCheckboxInput(container: HTMLElement): HTMLInputElement | null {
  const checkbox = container.querySelector('input[type="checkbox"]');
  return checkbox instanceof HTMLInputElement ? checkbox : null;
}

function findFieldEntryForInputName(input: HTMLInputElement): HTMLElement | null {
  const inputName = input.name.trim();
  let current: Element | null = input;
  let depth = 0;

  if (!inputName) {
    console.log("[form-filler] yes/no field entry lookup skipped: input has no name", {
      inputId: input.id,
      inputValue: input.value,
    });
    return null;
  }

  while (current) {
    const fieldEntryId = current.getAttribute("data-field-entry-id");
    const fieldEntryMatches =
      Boolean(fieldEntryId) && fieldEntryId?.includes(inputName);

    console.log("[form-filler] yes/no field entry scan by input name", {
      depth,
      tagName: current.tagName,
      hasFieldEntryId: Boolean(fieldEntryId),
      fieldEntryId,
      inputName,
      inputId: input.id,
      fieldEntryMatches,
      text: cleanText(current.textContent ?? ""),
    });

    if (current instanceof HTMLDivElement && fieldEntryMatches) {
      return current;
    }

    current = current.parentElement;
    depth += 1;
  }

  console.log("[form-filler] yes/no field entry scan by input name exhausted", {
    inputName,
    inputId: input.id,
    inputValue: input.value,
  });
  return null;
}

function stripYesNoChoiceText(text: string): string {
  return cleanText(
    text
      .replace(/\*/g, " ")
      .replace(/\bYes\b/gi, " ")
      .replace(/\bNo\b/gi, " "),
  );
}

function getTextWithoutControls(element: HTMLElement): string {
  const clone = element.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    return stripYesNoChoiceText(element.textContent ?? "");
  }

  for (const control of Array.from(
    clone.querySelectorAll(
      `${BUTTON_CHOICE_SELECTOR}, input, textarea, select`,
    ),
  )) {
    control.remove();
  }

  return cleanText((clone.textContent ?? "").replace(/\*/g, " "));
}

function getYesNoLabelText(element: HTMLElement): string {
  return (
    getTextWithoutControls(element) ||
    stripYesNoChoiceText(element.textContent ?? "")
  );
}

function getPreviousSiblingText(element: HTMLElement): string {
  let previous = element.previousElementSibling;

  while (previous) {
    if (previous instanceof HTMLElement) {
      const text = getYesNoLabelText(previous);
      console.log("[form-filler] yes/no previous sibling label candidate", {
        tagName: previous.tagName,
        text,
      });
      if (text) return text;
    }

    previous = previous.previousElementSibling;
  }

  return "";
}

function getYesNoCheckboxGroupLabelText(
  container: HTMLElement,
  button: HTMLButtonElement,
): string {
  const checkbox = getYesNoCheckboxInput(container);
  console.log("[form-filler] yes/no checkbox input for label lookup", {
    foundCheckbox: Boolean(checkbox),
    checkboxName: checkbox?.name,
    checkboxId: checkbox?.id,
    checkboxValue: checkbox?.value,
    checkboxChecked: checkbox?.checked,
  });

  const fieldEntry = checkbox ? findFieldEntryForInputName(checkbox) : null;

  if (fieldEntry) {
    const labelCandidates = Array.from(fieldEntry.querySelectorAll("label"))
      .map((label) => ({
        text: getYesNoLabelText(label),
        containsContainer: label.contains(container),
        containsButton: label.contains(button),
        containsCheckbox: checkbox ? label.contains(checkbox) : false,
      }))
      .filter((candidate) => candidate.text);

    const fieldEntryText = getYesNoLabelText(fieldEntry);
    const labelText =
      labelCandidates.find(
        (candidate) =>
          !candidate.containsContainer &&
          !candidate.containsButton &&
          !candidate.containsCheckbox,
      )?.text ??
      labelCandidates[0]?.text ??
      fieldEntryText;

    console.log("[form-filler] yes/no field entry label lookup", {
      checkboxName: checkbox?.name,
      checkboxId: checkbox?.id,
      fieldEntryId: fieldEntry.getAttribute("data-field-entry-id"),
      buttonText: getButtonText(button),
      labelCandidates,
      fieldEntryText,
      chosenLabel: labelText,
    });

    if (labelText) return labelText;
  }

  if (checkbox?.name) {
    console.log("[form-filler] yes/no group label not found from field entry", {
      checkboxName: checkbox.name,
      checkboxId: checkbox.id,
      buttonText: getButtonText(button),
      containerText: cleanText(container.textContent ?? ""),
    });
    return "";
  }

  const previousSiblingText = getPreviousSiblingText(container);
  if (previousSiblingText) {
    console.log("[form-filler] yes/no group label from previous sibling", {
      buttonText: getButtonText(button),
      previousSiblingText,
    });
    return previousSiblingText;
  }

  const containerText = getYesNoLabelText(container);
  console.log("[form-filler] yes/no group label from container fallback", {
    buttonText: getButtonText(button),
    containerText,
  });
  return containerText;
}

function normalizeLabelKey(value: string): string {
  return cleanText(value.replace(/\*/g, " ")).toLowerCase();
}

function buildYesNoSelectionLookup(
  selections: RememberedYesNoSelections,
): Map<string, YesNoAnswer> {
  const lookup = new Map<string, YesNoAnswer>();

  for (const [groupLabel, answer] of Object.entries(selections)) {
    lookup.set(normalizeLabelKey(groupLabel), answer);
  }

  return lookup;
}

function getYesNoState(
  container: HTMLElement,
  targetButton: HTMLButtonElement,
) {
  const checkbox = container.querySelector('input[type="checkbox"]');
  const yesButton = findButtonByText(container, "Yes");
  const noButton = findButtonByText(container, "No");

  return {
    targetAriaPressed: targetButton.getAttribute("aria-pressed"),
    targetAriaChecked: targetButton.getAttribute("aria-checked"),
    targetDataState: targetButton.getAttribute("data-state"),
    targetClassName: targetButton.className,
    targetDisabled: targetButton.disabled,
    yesAriaPressed: yesButton?.getAttribute("aria-pressed"),
    yesAriaChecked: yesButton?.getAttribute("aria-checked"),
    yesDataState: yesButton?.getAttribute("data-state"),
    yesClassName: yesButton?.className,
    noAriaPressed: noButton?.getAttribute("aria-pressed"),
    noAriaChecked: noButton?.getAttribute("aria-checked"),
    noDataState: noButton?.getAttribute("data-state"),
    noClassName: noButton?.className,
    checkboxChecked:
      checkbox instanceof HTMLInputElement ? checkbox.checked : undefined,
    checkboxValue:
      checkbox instanceof HTMLInputElement ? checkbox.value : undefined,
    checkboxDisabled:
      checkbox instanceof HTMLInputElement ? checkbox.disabled : undefined,
  };
}

export function getYesNoCheckboxObservation(
  target: EventTarget | null,
): YesNoCheckboxObservation | null {
  if (!(target instanceof Element)) return null;

  const button = target.closest("button");
  if (!(button instanceof HTMLButtonElement)) return null;

  const answer = getYesNoAnswer(getButtonText(button));
  console.log("[form-filler] yes/no click observation candidate", {
    targetTagName: target.tagName,
    buttonText: getButtonText(button),
    answer,
    disabled: button.disabled,
    id: button.id,
    type: button.type,
    ariaPressed: button.getAttribute("aria-pressed"),
    ariaChecked: button.getAttribute("aria-checked"),
    dataState: button.getAttribute("data-state"),
    className: button.className,
  });

  if (!answer || button.disabled) return null;

  const container = findNearestYesNoCheckboxContainer(button);
  console.log("[form-filler] yes/no click observation container lookup", {
    answer,
    foundContainer: Boolean(container),
    containerText: container ? cleanText(container.textContent ?? "") : "",
  });

  if (!container) return null;

  const groupLabel = getYesNoCheckboxGroupLabelText(container, button);
  if (!groupLabel) {
    console.log("[form-filler] yes/no click not remembered: missing group label", {
      answer,
      buttonText: getButtonText(button),
      containerText: cleanText(container.textContent ?? ""),
    });
    return null;
  }

  console.log("[form-filler] yes/no click observation ready", {
    groupLabel,
    answer,
    buttonText: getButtonText(button),
    containerText: cleanText(container.textContent ?? ""),
  });

  return {
    groupLabel,
    answer,
    choice: button,
    container,
  };
}

function findNearestYesNoCheckboxContainerForInput(
  checkbox: HTMLInputElement,
): HTMLElement | null {
  let current = checkbox.parentElement;
  let depth = 0;

  while (current) {
    const currentText = cleanText(current.textContent ?? "");

    if (current instanceof HTMLDivElement) {
      const yesButton = findButtonByText(current, "Yes");
      const noButton = findButtonByText(current, "No");

      console.log("[form-filler] yes/no checkbox container scan", {
        depth,
        currentText,
        hasYesButton: Boolean(yesButton),
        hasNoButton: Boolean(noButton),
        checkboxName: checkbox.name,
        checkboxId: checkbox.id,
      });

      if (yesButton && noButton && current.contains(checkbox)) {
        return current;
      }
    }

    current = current.parentElement;
    depth += 1;
  }

  console.log("[form-filler] yes/no checkbox container scan exhausted", {
    checkboxName: checkbox.name,
    checkboxId: checkbox.id,
    checkboxValue: checkbox.value,
  });
  return null;
}

function findYesNoCheckboxGroups(
  root: ParentNode = document,
): YesNoCheckboxGroup[] {
  const checkboxes = Array.from(root.querySelectorAll('input[type="checkbox"]'));
  const seenContainers = new Set<HTMLElement>();
  const groups: YesNoCheckboxGroup[] = [];

  console.log("[form-filler] scanning page yes/no checkbox groups", {
    checkboxCount: checkboxes.length,
  });

  for (const checkbox of checkboxes) {
    if (!(checkbox instanceof HTMLInputElement)) continue;

    const container = findNearestYesNoCheckboxContainerForInput(checkbox);
    if (!container) continue;
    if (seenContainers.has(container)) continue;

    const yesButton = findButtonByText(container, "Yes");
    const noButton = findButtonByText(container, "No");
    if (!yesButton || !noButton) continue;

    const groupLabel = getYesNoCheckboxGroupLabelText(container, yesButton);
    seenContainers.add(container);

    console.log("[form-filler] page yes/no checkbox group", {
      groupLabel,
      checkboxName: checkbox.name,
      checkboxId: checkbox.id,
      checkboxChecked: checkbox.checked,
      yesDisabled: yesButton.disabled,
      noDisabled: noButton.disabled,
      containerText: cleanText(container.textContent ?? ""),
    });

    if (!groupLabel) continue;

    groups.push({
      container,
      checkbox,
      groupLabel,
      yesButton,
      noButton,
    });
  }

  return groups;
}

export function pressRememberedYesNoCheckboxButtons(
  selections: RememberedYesNoSelections,
  root: ParentNode = document,
  filled?: WeakSet<Element>,
): boolean {
  const lookup = buildYesNoSelectionLookup(selections);
  const groups = findYesNoCheckboxGroups(root);

  console.log("[form-filler] starting remembered yes/no checkbox fill", {
    selectionCount: lookup.size,
    pageGroupCount: groups.length,
    selections,
  });

  let didFill = false;
  for (const group of groups) {
    const answer = lookup.get(normalizeLabelKey(group.groupLabel));

    console.log("[form-filler] yes/no page label lookup", {
      groupLabel: group.groupLabel,
      hasRememberedSelection: Boolean(answer),
      answer,
      checkboxName: group.checkbox.name,
      checkboxId: group.checkbox.id,
      checkboxChecked: group.checkbox.checked,
    });

    if (!answer) continue;

    if (filled?.has(group.container)) {
      console.log("[form-filler] skipping yes/no checkbox group: already filled", {
        groupLabel: group.groupLabel,
        answer,
        containerText: cleanText(group.container.textContent ?? ""),
      });
      continue;
    }

    const button = answer === "Yes" ? group.yesButton : group.noButton;
    if (button.disabled) {
      console.log("[form-filler] skipping yes/no checkbox group: target disabled", {
        groupLabel: group.groupLabel,
        answer,
        buttonText: getButtonText(button),
      });
      continue;
    }

    console.log("[form-filler] clicking remembered yes/no checkbox button", {
      answer,
      groupLabel: group.groupLabel,
      containerText: cleanText(group.container.textContent ?? ""),
      before: getYesNoState(group.container, button),
    });

    button.click();
    button.dispatchEvent(new Event("input", { bubbles: true }));
    button.dispatchEvent(new Event("change", { bubbles: true }));
    filled?.add(group.container);
    filled?.add(button);
    didFill = true;

    console.log("[form-filler] remembered yes/no click complete", {
      answer,
      groupLabel: group.groupLabel,
      containerMarkedFilled: filled?.has(group.container),
      buttonMarkedFilled: filled?.has(button),
      after: getYesNoState(group.container, button),
    });
  }

  console.log("[form-filler] remembered yes/no checkbox fill complete", {
    didFill,
    selectionCount: lookup.size,
    pageGroupCount: groups.length,
  });
  return didFill;
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
