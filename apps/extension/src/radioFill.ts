import { cssEscape } from "../utils/normalization";

export type RememberedRadioSelections = Record<string, string>;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanQuestionText(value: string): string {
  return cleanText(value.replace(/\*/g, " "));
}

function normalizeLookupKey(value: string): string {
  return cleanQuestionText(value).toLowerCase();
}

function buildSelectionLookup(
  selections: RememberedRadioSelections,
): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const [groupLabel, radioLabel] of Object.entries(selections)) {
    lookup.set(normalizeLookupKey(groupLabel), radioLabel);
  }

  return lookup;
}

export function getRadioLabelText(radio: HTMLInputElement): string {
  const ariaLabel = radio.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanText(ariaLabel);

  if (radio.id) {
    const label = radio.ownerDocument.querySelector(
      `label[for="${cssEscape(radio.id)}"]`,
    );
    if (label?.textContent?.trim()) return cleanText(label.textContent);
  }

  const wrappingLabel = radio.closest("label");
  if (wrappingLabel?.textContent?.trim()) {
    return cleanText(wrappingLabel.textContent);
  }

  return cleanText(radio.parentElement?.textContent ?? "");
}

function getPreviousSiblingText(el: Element): string {
  let previous = el.previousElementSibling;

  while (previous) {
    if (previous instanceof HTMLElement) {
      if (previous.querySelector('input[type="radio"]')) return "";

      const text = cleanQuestionText(previous.textContent ?? "");
      if (text) return text;
    }

    previous = previous.previousElementSibling;
  }

  return "";
}

function getFieldsetLegendText(radio: HTMLInputElement): string {
  const legend = radio.closest("fieldset")?.querySelector("legend");
  return cleanQuestionText(legend?.textContent ?? "");
}

function findRadioFieldEntry(radio: HTMLInputElement): HTMLElement | null {
  const radioName = radio.name.trim();
  let current = radio.parentElement;

  while (current) {
    if (current instanceof HTMLDivElement) {
      const fieldEntryId = current.getAttribute("data-field-entry-id");
      if (fieldEntryId && radioName && fieldEntryId.includes(radioName)) {
        return current;
      }
    }

    current = current.parentElement;
  }

  return null;
}

function getTextBeforeFirstRadio(container: HTMLElement): string {
  const parts: string[] = [];

  for (const child of Array.from(container.childNodes)) {
    if (
      child instanceof Element &&
      child.querySelector('input[type="radio"]')
    ) {
      break;
    }

    parts.push(child.textContent ?? "");
  }

  return cleanQuestionText(parts.join(" "));
}

function getFieldEntryLabelText(
  fieldEntry: HTMLElement,
  radio: HTMLInputElement,
): string {
  const labels = Array.from(fieldEntry.querySelectorAll("label"));

  for (const label of labels) {
    if (label.contains(radio)) continue;
    if (label.querySelector('input[type="radio"]')) continue;

    const text = cleanQuestionText(label.textContent ?? "");
    if (text) return text;
  }

  return getTextBeforeFirstRadio(fieldEntry);
}

export function getRadioGroupLabelText(radio: HTMLInputElement): string {
  const fieldEntry = findRadioFieldEntry(radio);
  if (fieldEntry) {
    const fieldEntryLabel = getFieldEntryLabelText(fieldEntry, radio);
    console.log("[form-filler] radio field entry label lookup", {
      radioName: radio.name,
      fieldEntryId: fieldEntry.getAttribute("data-field-entry-id"),
      fieldEntryLabel,
    });
    if (fieldEntryLabel) return fieldEntryLabel;
  } else {
    console.log("[form-filler] radio field entry not found", {
      radioName: radio.name,
      radioLabel: getRadioLabelText(radio),
    });
  }

  const fieldsetLegend = getFieldsetLegendText(radio);
  if (fieldsetLegend) return fieldsetLegend;

  let current: Element | null = radio.closest("label") ?? radio;

  for (let i = 0; i < 5 && current; i += 1) {
    const previousText = getPreviousSiblingText(current);
    if (previousText) return previousText;

    current = current.parentElement;
  }

  return "";
}

export function checkRememberedRadioButtons(
  selections: RememberedRadioSelections,
  root: ParentNode = document,
): boolean {
  let didCheck = false;
  const lookup = buildSelectionLookup(selections);
  const radios = Array.from(root.querySelectorAll('input[type="radio"]'));

  console.log("[form-filler] checking remembered radio selections", {
    selectionCount: lookup.size,
    pageRadioCount: radios.length,
    selections,
  });

  for (const radio of radios) {
    if (!(radio instanceof HTMLInputElement)) continue;
    if (radio.disabled) {
      console.log("[form-filler] skipping radio candidate: disabled", {
        value: radio.value,
        name: radio.name,
        id: radio.id,
      });
      continue;
    }

    const candidateGroupLabel = getRadioGroupLabelText(radio);
    const rememberedRadioLabel = lookup.get(
      normalizeLookupKey(candidateGroupLabel),
    );

    console.log("[form-filler] radio page label lookup", {
      candidateGroupLabel,
      hasRememberedSelection: Boolean(rememberedRadioLabel),
      rememberedRadioLabel,
      value: radio.value,
      name: radio.name,
      id: radio.id,
    });

    if (!rememberedRadioLabel) continue;

    const candidateLabel = getRadioLabelText(radio);
    const labelMatches =
      normalizeLookupKey(candidateLabel) ===
      normalizeLookupKey(rememberedRadioLabel);

    console.log("[form-filler] remembered radio candidate", {
      candidateGroupLabel,
      rememberedRadioLabel,
      candidateLabel,
      labelMatches,
      checked: radio.checked,
      value: radio.value,
      name: radio.name,
      id: radio.id,
    });

    if (!labelMatches) continue;

    if (radio.checked) {
      console.log("[form-filler] matching radio already checked", {
        label: candidateLabel,
        groupLabel: candidateGroupLabel,
        value: radio.value,
        name: radio.name,
        id: radio.id,
      });
      continue;
    }

    console.log("[form-filler] clicking matching radio from page lookup", {
      label: candidateLabel,
      groupLabel: candidateGroupLabel,
      value: radio.value,
      name: radio.name,
      id: radio.id,
    });

    radio.click();
    radio.dispatchEvent(new Event("input", { bubbles: true }));
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    didCheck = true;

    console.log("[form-filler] radio click complete", {
      checked: radio.checked,
      label: getRadioLabelText(radio),
      groupLabel: getRadioGroupLabelText(radio),
      value: radio.value,
      name: radio.name,
      id: radio.id,
    });
  }

  console.log("[form-filler] remembered radio fill finished", {
    didCheck,
    selectionCount: lookup.size,
    pageRadioCount: radios.length,
  });

  return didCheck;
}
