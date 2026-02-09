import type { QAItem } from "@form-filler/shared/src";
import { questionMatches } from "@form-filler/shared/src";

export function fillPage(items: QAItem[]) {
  const labels = Array.from(document.querySelectorAll("label"));

  for (const label of labels) {
    const labelText = label.textContent ?? "";
    const forId = label.getAttribute("for");
    if (!forId) continue;

    const input = document.getElementById(forId) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    if (!input) continue;

    const match = items.find((x) => questionMatches(labelText, x.question));
    if (!match) continue;

    if (
      input instanceof HTMLInputElement ||
      input instanceof HTMLTextAreaElement
    ) {
      input.value = match.answer;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}
