import type { Rules, FillRule } from "@form-filler/shared";
import { pickBestRule } from "@form-filler/shared";
import {
  findNearbyRadioGroup,
  getRadioLabelText,
  matchesRadioOption,
  clickRadio,
} from "./radioFill";
import { cssEscape } from "../utils/normalization";

function isFillable(
  el: Element,
): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLSelectElement) return true;
  if (!(el instanceof HTMLInputElement)) return false;

  const type = (el.getAttribute("type") || "text").toLowerCase();
  if (type === "password" || type === "hidden") return false;
  return true;
}

function getCandidateText(el: HTMLElement): string {
  const id = (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)
    .id;

  if (id) {
    const safeId = cssEscape(id);
    const label = document.querySelector(`label[for="${safeId}"]`);
    if (label?.textContent?.trim()) return label.textContent;
  }

  const wrappingLabel = el.closest("label");
  if (wrappingLabel?.textContent?.trim()) return wrappingLabel.textContent;

  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel;

  const ariaLabelledBy = el.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const text = ariaLabelledBy
      .split(/\s+/)
      .map((id2) => document.getElementById(id2)?.textContent ?? "")
      .join(" ")
      .trim();
    if (text) return text;
  }

  const placeholder = el.getAttribute("placeholder");
  if (placeholder?.trim()) return placeholder;

  return "";
}

function dispatchEvents(el: HTMLElement) {
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
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

function applyRule(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  rule: FillRule,
  touched?: WeakSet<Element>,
): boolean {
  // --- Radio (anchored off a nearby element) ---
  if (rule.strategy === "radio") {
    const anchor = el as unknown as HTMLElement;
    const radios = findNearbyRadioGroup(anchor);
    if (radios.length === 0) return false;

    for (const r of radios) {
      const optionText = getRadioLabelText(r);
      const optionValue = r.value ?? "";
      if (matchesRadioOption(rule, optionText, optionValue)) {
        clickRadio(r);
        return true;
      }
    }

    return false;
  }

  // --- Checkbox ---
  if (rule.strategy === "checkbox") {
    if (!(el instanceof HTMLInputElement)) return false;
    if (touched?.has(el)) return false;

    const type = (el.getAttribute("type") || "text").toLowerCase();
    if (type !== "checkbox") return false;

    const wantChecked = rule.value.trim().toLowerCase() === "true";
    if (!wantChecked) return false;

    if (!el.checked) {
      el.click();
      dispatchEvents(el);
      return true;
    }

    return false;
  }

  // --- Select ---
  if (el instanceof HTMLSelectElement) {
    const desired = rule.value.trim().toLowerCase();
    const option = Array.from(el.options).find(
      (o) =>
        o.value.trim().toLowerCase() === desired ||
        o.text.trim().toLowerCase() === desired,
    );
    if (!option) return false;

    if (el.value === option.value) return false;

    el.value = option.value;
    dispatchEvents(el);
    return true;
  }

  // --- Textarea ---
  if (el instanceof HTMLTextAreaElement) {
    if (rule.allowTextArea === false) return false;
    if (touched?.has(el)) return false;

    if (el.value === rule.value) return false;

    setNativeValue(el, rule.value);
    dispatchEvents(el);
    return true;
  }

  // --- Text input ---
  const type = (el.getAttribute("type") || "text").toLowerCase();
  if (type === "password" || type === "hidden") return false;
  if (rule.inputTypes && !rule.inputTypes.includes(type)) return false;
  if (touched?.has(el)) return false;

  if (el.value === rule.value) return false;

  setNativeValue(el, rule.value);
  dispatchEvents(el);
  return true;
}

export function fillPage(
  rules: Rules,
  opts?: { touched?: WeakSet<Element>; filled?: WeakSet<Element> },
) {
  const touched = opts?.touched;
  const filled = opts?.filled;

  const els = Array.from(document.querySelectorAll("input, textarea, select"));

  for (const el of els) {
    if (!isFillable(el)) continue;
    if (touched?.has(el)) continue;
    if (filled?.has(el)) continue;

    // Correct handling of "already filled"
    if (el instanceof HTMLInputElement) {
      const type = (el.getAttribute("type") || "text").toLowerCase();

      if (type === "checkbox" || type === "radio") {
        if (el.checked) continue;
      } else {
        const current = el.value;
        if (current && current.trim().length > 0) continue;
      }
    } else {
      const current = el.value;
      if (current && current.trim().length > 0) continue;
    }

    const candidateText = getCandidateText(el);
    if (!candidateText) continue;

    const rule = pickBestRule(candidateText, rules);
    if (!rule) continue;

    const didFill = applyRule(el, rule, touched);
    if (didFill) filled?.add(el);
  }

  // --- Radio second pass for question containers ---
  const radioGroups = Array.from(
    document.querySelectorAll(
      'fieldset, [role="radiogroup"], ul, ol, div, section, form',
    ),
  ).filter((el) => el.querySelector('input[type="radio"]'));

  for (const group of radioGroups) {
    const candidateText = group.textContent ?? "";
    if (!candidateText.trim()) continue;

    const rule = pickBestRule(candidateText, rules);
    if (!rule || rule.strategy !== "radio") continue;

    const radios = Array.from(
      group.querySelectorAll('input[type="radio"]'),
    ) as HTMLInputElement[];

    for (const r of radios) {
      if (touched?.has(r)) continue;
      if (filled?.has(r)) continue;

      if (matchesRadioOption(rule, getRadioLabelText(r), r.value ?? "")) {
        clickRadio(r);
        filled?.add(r);
        break;
      }
    }
  }
}
