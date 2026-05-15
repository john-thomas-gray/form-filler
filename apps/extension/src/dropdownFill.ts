const LAST_USER_TRIGGER_MAX_AGE_MS = 60_000;

export type RememberedDropdownSelections = Record<string, string>;

export type DropdownSelectionObservation = {
  groupLabel: string;
  optionText: string;
  trigger: HTMLElement;
  option: HTMLElement;
};

let lastUserDropdownTrigger:
  | {
      trigger: HTMLElement;
      groupLabel: string;
      openedAt: number;
    }
  | null = null;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getElementSummary(el: HTMLElement) {
  return {
    tagName: el.tagName,
    text: cleanText(el.textContent ?? ""),
    className: el.className,
    id: el.id,
    type: el instanceof HTMLButtonElement ? el.type : undefined,
    role: el.getAttribute("role"),
    ariaHasPopup: el.getAttribute("aria-haspopup"),
    ariaExpanded: el.getAttribute("aria-expanded"),
    ariaControls: el.getAttribute("aria-controls"),
    ariaDisabled: el.getAttribute("aria-disabled"),
    disabled:
      el instanceof HTMLButtonElement || el instanceof HTMLInputElement
        ? el.disabled
        : undefined,
  };
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

function isDisabledElement(el: HTMLElement): boolean {
  if (el.getAttribute("aria-disabled") === "true") return true;
  if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
    return el.disabled;
  }

  return false;
}

function getButtonContentText(button: HTMLElement): string {
  const content = button.querySelector("[class*='buttonContentContainer']");
  if (content?.textContent?.trim()) return cleanText(content.textContent);

  return cleanText(button.textContent ?? "");
}

function cleanQuestionText(value: string): string {
  return cleanText(value.replace(/\*/g, " "));
}

const CONTROL_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "[role='button']",
  "[role='listbox']",
  "[role='option']",
  "[role='menu']",
  "[role='menuitem']",
  "menu",
].join(",");

function getTextWithoutControls(element: HTMLElement): string {
  const clone = element.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    return cleanQuestionText(element.textContent ?? "");
  }

  for (const control of Array.from(clone.querySelectorAll(CONTROL_SELECTOR))) {
    control.remove();
  }

  return cleanQuestionText(clone.textContent ?? "");
}

function getTextBeforeChild(container: HTMLElement, childOnPath: Element): string {
  const parts: string[] = [];

  for (const child of Array.from(container.childNodes)) {
    if (child === childOnPath || (child instanceof Element && child.contains(childOnPath))) {
      break;
    }

    if (child instanceof HTMLElement) {
      parts.push(getTextWithoutControls(child));
    } else {
      parts.push(child.textContent ?? "");
    }
  }

  return cleanQuestionText(parts.join(" "));
}

function getPreviousSiblingQuestionText(el: Element): string {
  let previous = el.previousElementSibling;

  while (previous) {
    if (previous instanceof HTMLElement) {
      const text = getTextWithoutControls(previous);
      if (text) return text;
    }

    previous = previous.previousElementSibling;
  }

  return "";
}

function getDropdownGroupLabelText(trigger: HTMLElement): string {
  const ariaLabel = trigger.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanQuestionText(ariaLabel);

  const ariaLabelledBy = trigger.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const text = ariaLabelledBy
      .split(/\s+/)
      .map((id) => trigger.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" ");
    if (text.trim()) return cleanQuestionText(text);
  }

  let current: Element = trigger;
  for (let depth = 0; depth < 8; depth += 1) {
    const parent = current.parentElement;
    if (!parent || parent === trigger.ownerDocument.body) break;

    const textBeforeChild = getTextBeforeChild(parent, current);
    const previousSiblingText = getPreviousSiblingQuestionText(current);

    console.log("[form-filler] dropdown group label ancestor scan", {
      depth,
      parentTagName: parent.tagName,
      parentClassName: parent.className,
      currentTagName: current.tagName,
      textBeforeChild,
      previousSiblingText,
      parentText: cleanQuestionText(parent.textContent ?? ""),
    });

    if (textBeforeChild) return textBeforeChild;
    if (previousSiblingText) return previousSiblingText;

    current = parent;
  }

  return "";
}

function getDropdownTriggerDecision(el: Element): {
  accepted: boolean;
  reason: string;
} {
  if (!(el instanceof HTMLElement)) {
    return { accepted: false, reason: "not an HTMLElement" };
  }

  const disabled = isDisabledElement(el);
  const visible = isVisibleElement(el);
  const role = el.getAttribute("role")?.toLowerCase();
  const ariaHasPopup = el.getAttribute("aria-haspopup")?.toLowerCase();
  const tagName = el.tagName.toLowerCase();
  const buttonText = getButtonContentText(el).toLowerCase();

  if (tagName !== "button" && role !== "button") {
    return { accepted: false, reason: "not a button-like element" };
  }

  if (disabled) {
    return { accepted: false, reason: "disabled" };
  }

  if (!visible) {
    return { accepted: false, reason: "not visible" };
  }

  if (ariaHasPopup === "listbox" || ariaHasPopup === "menu") {
    return { accepted: true, reason: "aria-haspopup dropdown trigger" };
  }
  if (el.hasAttribute("aria-expanded")) {
    return { accepted: true, reason: "has aria-expanded" };
  }
  if (el.hasAttribute("aria-controls")) {
    return { accepted: true, reason: "has aria-controls" };
  }

  if (buttonText === "select an option") {
    return { accepted: true, reason: "Gem select placeholder button" };
  }

  return { accepted: false, reason: "no dropdown trigger signal" };
}

function isDropdownTrigger(el: Element): el is HTMLElement {
  return getDropdownTriggerDecision(el).accepted;
}

function findDropdownTriggerForTarget(target: Element): HTMLElement | null {
  const trigger = target.closest("button, [role='button']");
  if (!trigger || !isDropdownTrigger(trigger)) return null;

  return trigger;
}

function getOptionText(option: HTMLElement): string {
  const ariaLabel = option.getAttribute("aria-label");
  if (ariaLabel?.trim()) return cleanText(ariaLabel);

  return cleanText(option.textContent ?? "");
}

function findDropdownOptionForTarget(target: Element): HTMLElement | null {
  const option = target.closest(
    [
      "[role='option']",
      "[role='menuitem']",
      "menu[role='listbox'] li",
      "menu li",
    ].join(","),
  );

  if (!(option instanceof HTMLElement)) return null;
  if (isDisabledElement(option)) return null;

  const optionText = getOptionText(option);
  if (!optionText) return null;

  return option;
}

export function noteDropdownTriggerClick(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  const trigger = findDropdownTriggerForTarget(target);
  console.log("[form-filler] dropdown trigger click check", {
    foundTrigger: Boolean(trigger),
    targetTagName: target.tagName,
    targetText: cleanText(target.textContent ?? ""),
    trigger: trigger ? getElementSummary(trigger) : null,
  });

  if (!trigger) return false;

  const groupLabel = getDropdownGroupLabelText(trigger);
  lastUserDropdownTrigger = {
    trigger,
    groupLabel,
    openedAt: Date.now(),
  };

  console.log("[form-filler] remembered active dropdown trigger", {
    groupLabel,
    trigger: getElementSummary(trigger),
    buttonContentText: getButtonContentText(trigger),
  });

  return true;
}

export function getDropdownOptionClickObservation(
  target: EventTarget | null,
): DropdownSelectionObservation | null {
  if (!(target instanceof Element)) return null;

  const option = findDropdownOptionForTarget(target);
  console.log("[form-filler] dropdown option click check", {
    foundOption: Boolean(option),
    targetTagName: target.tagName,
    targetText: cleanText(target.textContent ?? ""),
    option: option ? getElementSummary(option) : null,
    optionText: option ? getOptionText(option) : "",
    hasLastUserDropdownTrigger: Boolean(lastUserDropdownTrigger),
    lastUserDropdownTrigger: lastUserDropdownTrigger
      ? {
          groupLabel: lastUserDropdownTrigger.groupLabel,
          ageMs: Date.now() - lastUserDropdownTrigger.openedAt,
          trigger: getElementSummary(lastUserDropdownTrigger.trigger),
        }
      : null,
  });

  if (!option) return null;

  const activeTrigger = lastUserDropdownTrigger;
  if (!activeTrigger) {
    console.log("[form-filler] dropdown option not remembered: no active trigger", {
      optionText: getOptionText(option),
    });
    return null;
  }

  const triggerAgeMs = Date.now() - activeTrigger.openedAt;
  if (
    triggerAgeMs > LAST_USER_TRIGGER_MAX_AGE_MS ||
    activeTrigger.trigger.ownerDocument !== option.ownerDocument
  ) {
    console.log("[form-filler] dropdown option not remembered: stale active trigger", {
      optionText: getOptionText(option),
      triggerAgeMs,
      maxAgeMs: LAST_USER_TRIGGER_MAX_AGE_MS,
    });
    lastUserDropdownTrigger = null;
    return null;
  }

  const optionText = getOptionText(option);
  const groupLabel =
    activeTrigger.groupLabel || getDropdownGroupLabelText(activeTrigger.trigger);
  if (!groupLabel || !optionText) {
    console.log("[form-filler] dropdown option not remembered: missing data", {
      groupLabel,
      optionText,
      trigger: getElementSummary(activeTrigger.trigger),
      option: getElementSummary(option),
    });
    return null;
  }

  console.log("[form-filler] dropdown option click observation ready", {
    groupLabel,
    optionText,
    trigger: getElementSummary(activeTrigger.trigger),
    option: getElementSummary(option),
  });

  lastUserDropdownTrigger = null;
  return {
    groupLabel,
    optionText,
    trigger: activeTrigger.trigger,
    option,
  };
}
