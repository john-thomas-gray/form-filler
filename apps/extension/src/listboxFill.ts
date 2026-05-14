import { cssEscape } from "../utils/normalization";

export type RememberedListboxSelections = Record<string, string>;

export type ListboxSelectionObservation = {
  groupLabel: string;
  optionText: string;
  input: HTMLInputElement;
  option?: HTMLElement;
};

const LISTBOX_COMBOBOX_SELECTOR = [
  'input[role="combobox"][aria-autocomplete="list"]',
  'input[role="combobox"][aria-haspopup="listbox"]',
  'input[aria-autocomplete="list"][aria-haspopup="listbox"]',
].join(",");

const RETRY_DELAYS_MS = [0, 100, 250, 500, 1000];

const pendingInputs = new WeakSet<HTMLInputElement>();
let pendingListboxSelectionCount = 0;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanQuestionText(value: string): string {
  return cleanText(value.replace(/\*/g, " "));
}

function normalizeSelectionText(value: string): string {
  return cleanText(value).toLowerCase();
}

function normalizeLooseSelectionText(value: string): string {
  return normalizeSelectionText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function markPendingInput(input: HTMLInputElement) {
  if (pendingInputs.has(input)) return;

  pendingInputs.add(input);
  pendingListboxSelectionCount += 1;
}

function clearPendingInput(input: HTMLInputElement) {
  if (!pendingInputs.has(input)) return;

  pendingInputs.delete(input);
  pendingListboxSelectionCount = Math.max(0, pendingListboxSelectionCount - 1);
}

export function hasPendingListboxSelections(): boolean {
  return pendingListboxSelectionCount > 0;
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

function focusForProgrammaticFill(input: HTMLInputElement) {
  try {
    input.focus({ preventScroll: true });
  } catch {
    input.focus();
  }
}

function setNativeValue(input: HTMLInputElement, value: string) {
  const desc = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  );
  desc?.set?.call(input, value);
}

function activateInput(input: HTMLInputElement) {
  dispatchPointerEvent(input, "pointerdown");
  dispatchMouseEvent(input, "mousedown");
  focusForProgrammaticFill(input);
  dispatchPointerEvent(input, "pointerup");
  dispatchMouseEvent(input, "mouseup");
  dispatchMouseEvent(input, "click");
}

function activateElement(el: HTMLElement) {
  dispatchPointerEvent(el, "pointerdown");
  dispatchMouseEvent(el, "mousedown");
  dispatchPointerEvent(el, "pointerup");
  dispatchMouseEvent(el, "mouseup");
  el.click();
}

function getButtonText(button: HTMLButtonElement): string {
  const ariaLabel = button.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanText(ariaLabel);

  return cleanText(button.textContent ?? "");
}

function findDropdownButton(input: HTMLInputElement): HTMLButtonElement | null {
  let current = input.parentElement;
  let depth = 0;

  while (current && depth < 6) {
    const buttons = Array.from(current.querySelectorAll("button")).filter(
      (button): button is HTMLButtonElement =>
        button instanceof HTMLButtonElement && !button.disabled,
    );

    const trigger =
      buttons.find(
        (button) =>
          button.getAttribute("aria-haspopup")?.toLowerCase() === "listbox",
      ) ??
      buttons.find((button) => button.hasAttribute("aria-expanded")) ??
      buttons.find((button) =>
        /dropdown|list|open|toggle|select/i.test(getButtonText(button)),
      ) ??
      (buttons.length === 1 ? buttons[0] : null);

    console.log("[form-filler] listbox dropdown button scan", {
      depth,
      tagName: current.tagName,
      buttonCount: buttons.length,
      triggerFound: Boolean(trigger),
      triggerText: trigger ? getButtonText(trigger) : "",
      triggerAriaLabel: trigger?.getAttribute("aria-label"),
      triggerAriaExpanded: trigger?.getAttribute("aria-expanded"),
      triggerAriaHasPopup: trigger?.getAttribute("aria-haspopup"),
    });

    if (trigger) return trigger;

    current = current.parentElement;
    depth += 1;
  }

  console.log("[form-filler] listbox dropdown button not found", {
    inputName: input.name,
    inputId: input.id,
    inputValue: input.value,
  });
  return null;
}

function openListboxDropdown(input: HTMLInputElement, optionText: string) {
  const dropdownButton = findDropdownButton(input);
  const isExpanded = input.getAttribute("aria-expanded") === "true";

  console.log("[form-filler] opening listbox dropdown", {
    optionText,
    inputName: input.name,
    inputId: input.id,
    inputValue: input.value,
    ariaExpanded: input.getAttribute("aria-expanded"),
    isExpanded,
    hasDropdownButton: Boolean(dropdownButton),
    dropdownButtonText: dropdownButton ? getButtonText(dropdownButton) : "",
  });

  if (isExpanded) {
    console.log("[form-filler] listbox dropdown already expanded; not toggling button", {
      optionText,
      inputValue: input.value,
    });
    return;
  }

  if (dropdownButton) {
    activateElement(dropdownButton);
    return;
  }

  activateInput(input);
}

function releaseComboboxFocus(input: HTMLInputElement, optionText: string) {
  const view = input.ownerDocument.defaultView;
  if (!view) return;

  view.setTimeout(() => {
    console.log("[form-filler] releasing listbox combobox focus", {
      optionText,
      inputName: input.name,
      inputId: input.id,
      inputValue: input.value,
      ariaExpanded: input.getAttribute("aria-expanded"),
      isActiveElement: input.ownerDocument.activeElement === input,
      selectionStart: input.selectionStart,
      selectionEnd: input.selectionEnd,
    });

    if (input.ownerDocument.activeElement === input) {
      input.blur();
    }

    console.log("[form-filler] listbox combobox focus released", {
      optionText,
      inputName: input.name,
      inputId: input.id,
      inputValue: input.value,
      ariaExpanded: input.getAttribute("aria-expanded"),
      isActiveElement: input.ownerDocument.activeElement === input,
    });
    clearPendingInput(input);
  }, 50);
}

export function isListboxComboboxInput(
  el: Element | null,
): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;
  if (el.disabled) return false;

  const role = el.getAttribute("role")?.toLowerCase();
  const ariaAutocomplete = el.getAttribute("aria-autocomplete")?.toLowerCase();
  const ariaHasPopup = el.getAttribute("aria-haspopup")?.toLowerCase();

  return (
    role === "combobox" &&
    (ariaAutocomplete === "list" || ariaHasPopup === "listbox")
  );
}

function getOptionText(option: HTMLElement): string {
  const ariaLabel = option.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanText(ariaLabel);

  return cleanText(option.textContent ?? "");
}

function isOptionElement(el: Element | null): el is HTMLElement {
  return el instanceof HTMLElement && el.getAttribute("role") === "option";
}

function isListItemElement(el: Element | null): el is HTMLLIElement {
  return el instanceof HTMLLIElement;
}

function isVisibleElement(el: HTMLElement): boolean {
  const view = el.ownerDocument.defaultView;
  const style = view?.getComputedStyle(el);

  if (style?.display === "none" || style?.visibility === "hidden") {
    return false;
  }

  if (el.getAttribute("aria-hidden") === "true") return false;

  return el.getClientRects().length > 0;
}

function getControlledListbox(input: HTMLInputElement): HTMLElement | null {
  const id =
    input.getAttribute("aria-controls") || input.getAttribute("aria-owns");
  if (!id) return null;

  const listbox = input.ownerDocument.getElementById(id);
  return listbox instanceof HTMLElement ? listbox : null;
}

function getListboxOptions(input: HTMLInputElement): HTMLElement[] {
  const controlledListbox = getControlledListbox(input);
  const controlledOptions = controlledListbox
    ? Array.from(controlledListbox.querySelectorAll('li, [role="option"]'))
    : [];

  const allOptions = Array.from(
    input.ownerDocument.querySelectorAll(
      '[role="listbox"] li, [role="listbox"] [role="option"], li, [role="option"]',
    ),
  );

  const options = [...controlledOptions, ...allOptions].filter(
    (option): option is HTMLElement =>
      isOptionElement(option) || isListItemElement(option),
  );
  const uniqueOptions = Array.from(new Set(options));
  const visibleOptions = uniqueOptions.filter(isVisibleElement);

  return visibleOptions.length > 0 ? visibleOptions : uniqueOptions;
}

function findOptionByText(
  input: HTMLInputElement,
  optionText: string,
): HTMLElement | null {
  const desired = normalizeSelectionText(optionText);
  const looseDesired = normalizeLooseSelectionText(optionText);
  const options = getListboxOptions(input);

  console.log("[form-filler] listbox option candidates", {
    desired,
    looseDesired,
    optionText,
    optionCount: options.length,
    options: options.map((option) => ({
      text: getOptionText(option),
      normalizedText: normalizeSelectionText(getOptionText(option)),
      looseNormalizedText: normalizeLooseSelectionText(getOptionText(option)),
      tagName: option.tagName,
      id: option.id,
      role: option.getAttribute("role"),
      ariaSelected: option.getAttribute("aria-selected"),
      className: option.className,
    })),
  });

  return (
    options.find(
      (option) =>
        isListItemElement(option) &&
        normalizeSelectionText(getOptionText(option)) === desired,
    ) ??
    options.find(
      (option) =>
        isListItemElement(option) &&
        normalizeLooseSelectionText(getOptionText(option)) === looseDesired,
    ) ??
    options.find((option) => normalizeSelectionText(getOptionText(option)) === desired) ??
    options.find(
      (option) => normalizeLooseSelectionText(getOptionText(option)) === looseDesired,
    ) ??
    null
  );
}

function findFieldEntryForInputName(input: HTMLInputElement): HTMLElement | null {
  const inputName = input.name.trim();
  let current: Element | null = input;
  let depth = 0;

  if (!inputName) {
    console.log("[form-filler] listbox field entry lookup skipped: input has no name", {
      inputId: input.id,
      inputValue: input.value,
    });
    return null;
  }

  while (current) {
    const fieldEntryId = current.getAttribute("data-field-entry-id");
    const fieldEntryMatches =
      Boolean(fieldEntryId) && fieldEntryId?.includes(inputName);

    console.log("[form-filler] listbox field entry scan by input name", {
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

  console.log("[form-filler] listbox field entry scan by input name exhausted", {
    inputName,
    inputId: input.id,
    inputValue: input.value,
  });
  return null;
}

function getTextBeforeInput(container: HTMLElement, input: HTMLInputElement): string {
  const parts: string[] = [];

  for (const child of Array.from(container.childNodes)) {
    if (child instanceof Element && child.contains(input)) break;
    parts.push(child.textContent ?? "");
  }

  return cleanQuestionText(parts.join(" "));
}

function getTextWithoutControls(element: HTMLElement): string {
  const clone = element.cloneNode(true);
  if (!(clone instanceof HTMLElement)) return cleanQuestionText(element.textContent ?? "");

  for (const control of Array.from(
    clone.querySelectorAll("input, textarea, select, button, [role='listbox'], [role='option']"),
  )) {
    control.remove();
  }

  return cleanQuestionText(clone.textContent ?? "");
}

function getFieldEntryLabelText(
  fieldEntry: HTMLElement,
  input: HTMLInputElement,
): string {
  const labels = Array.from(fieldEntry.querySelectorAll("label"));

  for (const label of labels) {
    if (label.contains(input)) continue;
    if (label.querySelector(LISTBOX_COMBOBOX_SELECTOR)) continue;

    const text = getTextWithoutControls(label);
    if (text) return text;
  }

  return getTextBeforeInput(fieldEntry, input) || getTextWithoutControls(fieldEntry);
}

function getLabelForInputId(input: HTMLInputElement): string {
  if (!input.id) return "";

  const label = input.ownerDocument.querySelector(
    `label[for="${cssEscape(input.id)}"]`,
  );
  return cleanQuestionText(label?.textContent ?? "");
}

function getAriaLabelledByText(input: HTMLInputElement): string {
  const ariaLabelledBy = input.getAttribute("aria-labelledby");
  if (!ariaLabelledBy) return "";

  return cleanQuestionText(
    ariaLabelledBy
      .split(/\s+/)
      .map((id) => input.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" "),
  );
}

function getPreviousSiblingText(el: Element): string {
  let previous = el.previousElementSibling;

  while (previous) {
    if (previous instanceof HTMLElement) {
      if (previous.matches("input, textarea, select, button")) return "";
      if (previous.querySelector(LISTBOX_COMBOBOX_SELECTOR)) return "";

      const text = cleanQuestionText(previous.textContent ?? "");
      if (text) return text;
    }

    previous = previous.previousElementSibling;
  }

  return "";
}

export function getListboxGroupLabelText(input: HTMLInputElement): string {
  const fieldEntry = findFieldEntryForInputName(input);
  if (fieldEntry) {
    const fieldEntryLabel = getFieldEntryLabelText(fieldEntry, input);
    console.log("[form-filler] listbox field entry label lookup", {
      inputName: input.name,
      inputId: input.id,
      fieldEntryId: fieldEntry.getAttribute("data-field-entry-id"),
      fieldEntryLabel,
    });
    if (fieldEntryLabel) return fieldEntryLabel;
  }

  const explicitLabel = getLabelForInputId(input);
  if (explicitLabel) return explicitLabel;

  const wrappingLabel = input.closest("label");
  if (wrappingLabel?.textContent?.trim()) {
    const text = getTextWithoutControls(wrappingLabel);
    if (text) return text;
  }

  const ariaLabelledBy = getAriaLabelledByText(input);
  if (ariaLabelledBy) return ariaLabelledBy;

  const ariaLabel = input.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanQuestionText(ariaLabel);

  let current: Element | null = input;
  for (let i = 0; i < 5 && current; i += 1) {
    const previousText = getPreviousSiblingText(current);
    if (previousText) return previousText;
    current = current.parentElement;
  }

  return "";
}

function findComboboxForOption(option: HTMLElement): HTMLInputElement | null {
  const doc = option.ownerDocument;
  const activeElement = doc.activeElement;
  if (isListboxComboboxInput(activeElement)) return activeElement;

  if (option.id) {
    const activeDescendantInput = doc.querySelector(
      `${LISTBOX_COMBOBOX_SELECTOR}[aria-activedescendant="${cssEscape(option.id)}"]`,
    );
    if (isListboxComboboxInput(activeDescendantInput)) {
      return activeDescendantInput;
    }
  }

  const listbox = option.closest('[role="listbox"]');
  if (listbox?.id) {
    const controlledInput = doc.querySelector(
      `${LISTBOX_COMBOBOX_SELECTOR}[aria-controls="${cssEscape(
        listbox.id,
      )}"], ${LISTBOX_COMBOBOX_SELECTOR}[aria-owns="${cssEscape(listbox.id)}"]`,
    );
    if (isListboxComboboxInput(controlledInput)) return controlledInput;
  }

  const comboboxes = Array.from(doc.querySelectorAll(LISTBOX_COMBOBOX_SELECTOR));
  return comboboxes.find(isListboxComboboxInput) ?? null;
}

export function getListboxOptionClickObservation(
  target: EventTarget | null,
): ListboxSelectionObservation | null {
  if (!(target instanceof Element)) return null;

  const option = target.closest('[role="option"]');
  if (!isOptionElement(option)) return null;

  const optionText = getOptionText(option);
  if (!optionText) return null;

  const input = findComboboxForOption(option);
  if (!input) {
    console.log("[form-filler] listbox option click not remembered: no combobox", {
      optionText,
      optionId: option.id,
    });
    return null;
  }

  const groupLabel = getListboxGroupLabelText(input);
  if (!groupLabel) {
    console.log("[form-filler] listbox option click not remembered: missing group label", {
      optionText,
      inputName: input.name,
      inputId: input.id,
      inputValue: input.value,
    });
    return null;
  }

  console.log("[form-filler] listbox option click observation ready", {
    groupLabel,
    optionText,
    inputName: input.name,
    inputId: input.id,
    optionId: option.id,
  });

  return { groupLabel, optionText, input, option };
}

export function getListboxKeyboardSelectionObservation(
  event: KeyboardEvent,
): ListboxSelectionObservation | null {
  if (event.key !== "Enter") return null;
  if (!isListboxComboboxInput(event.target as Element | null)) return null;

  const input = event.target as HTMLInputElement;
  const activeDescendant = input.getAttribute("aria-activedescendant");
  const option = activeDescendant
    ? input.ownerDocument.getElementById(activeDescendant)
    : null;

  if (!isOptionElement(option)) {
    console.log("[form-filler] listbox keyboard selection not remembered: no active option", {
      inputName: input.name,
      inputId: input.id,
      inputValue: input.value,
      activeDescendant,
    });
    return null;
  }

  const optionText = getOptionText(option);
  const groupLabel = getListboxGroupLabelText(input);
  if (!optionText || !groupLabel) return null;

  console.log("[form-filler] listbox keyboard selection observation ready", {
    groupLabel,
    optionText,
    inputName: input.name,
    inputId: input.id,
    optionId: option.id,
  });

  return { groupLabel, optionText, input, option };
}

function normalizeLabelKey(value: string): string {
  return cleanQuestionText(value).toLowerCase();
}

function buildListboxSelectionLookup(
  selections: RememberedListboxSelections,
): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const [groupLabel, optionText] of Object.entries(selections)) {
    lookup.set(normalizeLabelKey(groupLabel), optionText);
  }

  return lookup;
}

function prepareListboxSearch(input: HTMLInputElement, optionText: string) {
  focusForProgrammaticFill(input);
  setNativeValue(input, optionText);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  openListboxDropdown(input, optionText);
}

function attemptSelectListboxOption(
  input: HTMLInputElement,
  groupLabel: string,
  optionText: string,
  filled: WeakSet<Element> | undefined,
  attempt: number,
) {
  console.log("[form-filler] attempting remembered listbox selection", {
    groupLabel,
    optionText,
    attempt,
    inputName: input.name,
    inputId: input.id,
    inputValue: input.value,
    ariaExpanded: input.getAttribute("aria-expanded"),
  });

  if (attempt === 0) {
    prepareListboxSearch(input, optionText);
  } else if (input.getAttribute("aria-expanded") !== "true") {
    openListboxDropdown(input, optionText);
  }

  const option = findOptionByText(input, optionText);
  if (option) {
    console.log("[form-filler] clicking remembered listbox option", {
      groupLabel,
      optionText,
      optionId: option.id,
      beforeInputValue: input.value,
    });

    activateElement(option);
    filled?.add(input);
    releaseComboboxFocus(input, optionText);

    console.log("[form-filler] remembered listbox option click complete", {
      groupLabel,
      optionText,
      afterInputValue: input.value,
      inputMarkedFilled: filled?.has(input),
      inputIsActiveElement: input.ownerDocument.activeElement === input,
    });
    return;
  }

  const nextAttempt = attempt + 1;
  const delay = RETRY_DELAYS_MS[nextAttempt];
  if (delay === undefined) {
    clearPendingInput(input);
    console.log("[form-filler] remembered listbox option not found after retries", {
      groupLabel,
      optionText,
      inputName: input.name,
      inputId: input.id,
      inputValue: input.value,
    });
    return;
  }

  console.log("[form-filler] remembered listbox option not found yet; retrying", {
    groupLabel,
    optionText,
    nextAttempt,
    delay,
  });

  input.ownerDocument.defaultView?.setTimeout(() => {
    attemptSelectListboxOption(input, groupLabel, optionText, filled, nextAttempt);
  }, delay);
}

export function selectRememberedListboxOptions(
  selections: RememberedListboxSelections,
  root: ParentNode = document,
  filled?: WeakSet<Element>,
): boolean {
  const lookup = buildListboxSelectionLookup(selections);
  const inputs = Array.from(root.querySelectorAll(LISTBOX_COMBOBOX_SELECTOR));
  console.log("[form-filler] starting remembered listbox fill", {
    selectionCount: lookup.size,
    pageInputCount: inputs.length,
    selections,
  });

  let scheduled = false;
  for (const input of inputs) {
    if (!isListboxComboboxInput(input)) continue;
    if (filled?.has(input)) continue;
    if (pendingInputs.has(input)) continue;

    const groupLabel = getListboxGroupLabelText(input);
    const optionText = lookup.get(normalizeLabelKey(groupLabel));

    console.log("[form-filler] listbox page label lookup", {
      groupLabel,
      hasRememberedSelection: Boolean(optionText),
      optionText,
      inputName: input.name,
      inputId: input.id,
      inputValue: input.value,
      ariaExpanded: input.getAttribute("aria-expanded"),
      ariaControls: input.getAttribute("aria-controls"),
    });

    if (!optionText) {
      console.log("[form-filler] no remembered listbox option for page label", {
        groupLabel,
        inputName: input.name,
        inputId: input.id,
      });
      continue;
    }

    markPendingInput(input);
    attemptSelectListboxOption(input, groupLabel, optionText, filled, 0);
    scheduled = true;
  }

  console.log("[form-filler] remembered listbox fill queued", {
    scheduled,
    selectionCount: lookup.size,
    pageInputCount: inputs.length,
  });
  return scheduled;
}
