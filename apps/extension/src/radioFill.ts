import { FillRule } from "@form-filler/shared";
import { cssEscape } from "../utils/normalization";

function normalizeToken(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function matchesRadioOption(
  rule: FillRule,
  optionText: string,
  optionValue: string,
): boolean {
  const want = normalizeToken(rule.value);
  const wantSet = new Set([want]);

  if (rule.radioValues) {
    for (const v of rule.radioValues) wantSet.add(normalizeToken(v));
  }

  return (
    wantSet.has(normalizeToken(optionText)) ||
    wantSet.has(normalizeToken(optionValue))
  );
}

export function getRadioLabelText(radio: HTMLInputElement): string {
  const id = radio.id;
  if (id) {
    const label = document.querySelector(`label[for="${cssEscape(id)}"]`);
    const t = label?.textContent?.trim();
    if (t) return t;
  }

  const wrappingLabel = radio.closest("label");
  const t2 = wrappingLabel?.textContent?.trim();
  if (t2) return t2;

  // fallback: nearby text node or parent container text
  const parentText = radio.parentElement?.textContent?.trim();
  return parentText ?? "";
}

/**
 * Find radio inputs that belong to the same question container as `el`.
 * This handles common structures like:
 *   <div>Are you a veteran?</div>
 *   <ul><li><input type="radio">Yes</li> ...</ul>
 */
export function findNearbyRadioGroup(el: HTMLElement): HTMLInputElement[] {
  // Search upward a few levels for a container that has radios
  let cur: HTMLElement | null = el;
  for (let i = 0; i < 5 && cur; i++) {
    const radios = Array.from(
      cur.querySelectorAll('input[type="radio"]'),
    ) as HTMLInputElement[];
    if (radios.length > 0) return radios;
    cur = cur.parentElement;
  }

  // Fallback: if the element is itself a question label, try sibling search
  const parent = el.parentElement;
  if (!parent) return [];
  return Array.from(
    parent.querySelectorAll('input[type="radio"]'),
  ) as HTMLInputElement[];
}

export function clickRadio(radio: HTMLInputElement) {
  if (radio.disabled) return;
  radio.click();
  radio.dispatchEvent(new Event("input", { bubbles: true }));
  radio.dispatchEvent(new Event("change", { bubbles: true }));
}
