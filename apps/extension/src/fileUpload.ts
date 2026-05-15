import { cssEscape } from "../utils/normalization";

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

const CONTROL_SELECTOR =
  "input, textarea, select, button, [role='button'], [role='listbox'], [role='option']";
const FILE_INPUT_SELECTOR = 'input[type="file"]';
const MAX_LABEL_ANCESTOR_DEPTH = 7;

function getTextWithoutControls(element: HTMLElement): string {
  const clone = element.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    return cleanText(element.textContent ?? "");
  }

  for (const control of Array.from(clone.querySelectorAll(CONTROL_SELECTOR))) {
    control.remove();
  }

  return cleanText(clone.textContent ?? "");
}

function containsNestedControl(el: HTMLElement): boolean {
  return Boolean(el.querySelector(CONTROL_SELECTOR));
}

function getTextBeforeInput(
  container: HTMLElement,
  input: HTMLInputElement,
): string {
  const parts: string[] = [];

  for (const child of Array.from(container.childNodes)) {
    if (child instanceof Element && child.contains(input)) break;

    if (child instanceof HTMLElement) {
      if (child.matches(CONTROL_SELECTOR) || containsNestedControl(child)) {
        continue;
      }
      parts.push(getTextWithoutControls(child));
    } else {
      parts.push(child.textContent ?? "");
    }
  }

  return cleanText(parts.join(" ").replace(/\*/g, " "));
}

function containsOnlyCandidateFileInput(
  container: HTMLElement,
  input: HTMLInputElement,
): boolean {
  const inputs = Array.from(container.querySelectorAll(FILE_INPUT_SELECTOR));
  return inputs.length > 0 && inputs.every((candidate) => candidate === input);
}

function getAncestorLabelText(input: HTMLInputElement): string {
  let current: Element | null = input;

  for (let depth = 0; depth < MAX_LABEL_ANCESTOR_DEPTH; depth += 1) {
    const parent: HTMLElement | null = current?.parentElement ?? null;
    if (!parent) break;
    if (parent === input.ownerDocument.body) break;
    if (!containsOnlyCandidateFileInput(parent, input)) {
      current = parent;
      continue;
    }

    const textBeforeInput = getTextBeforeInput(parent, input);
    if (textBeforeInput) return textBeforeInput;

    current = parent;
  }

  return "";
}

function getInputLabelText(input: HTMLInputElement): string {
  const parts: string[] = [];
  const id = input.id;

  if (id) {
    const linkedLabel = input.ownerDocument.querySelector(
      `label[for="${cssEscape(id)}"]`,
    );
    if (linkedLabel?.textContent) parts.push(linkedLabel.textContent);
  }

  const wrappingLabel = input.closest("label");
  if (wrappingLabel?.textContent) parts.push(wrappingLabel.textContent);

  const ariaLabel = input.getAttribute("aria-label");
  if (ariaLabel) parts.push(ariaLabel);

  const labelledBy = input.getAttribute("aria-labelledby");
  if (labelledBy) {
    for (const refId of labelledBy.split(/\s+/)) {
      const ref = input.ownerDocument.getElementById(refId);
      if (ref?.textContent) parts.push(ref.textContent);
    }
  }

  const name = input.getAttribute("name");
  if (name) parts.push(name);

  const placeholder = input.getAttribute("placeholder");
  if (placeholder) parts.push(placeholder);

  const ancestorLabelText = getAncestorLabelText(input);
  if (ancestorLabelText) parts.push(ancestorLabelText);

  if (id) parts.push(id);

  return normalizeText(parts.join(" "));
}

export function findFileUploader(matchers: string[]): HTMLInputElement | null {
  const normalizedMatchers = matchers
    .map((matcher) => normalizeText(matcher))
    .filter(Boolean);

  if (normalizedMatchers.length === 0) return null;

  const fileInputs = Array.from(
    document.querySelectorAll('input[type="file"]'),
  ) as HTMLInputElement[];

  for (const input of fileInputs) {
    const candidateText = getInputLabelText(input);
    if (!candidateText) continue;

    if (normalizedMatchers.some((matcher) => candidateText.includes(matcher))) {
      return input;
    }
  }

  return null;
}

export function findResumeUploader(): HTMLInputElement | null {
  return findFileUploader(["resume"]);
}

export function findCoverLetterUploader(): HTMLInputElement | null {
  return findFileUploader(["cover letter"]);
}

function dispatchUploadEvents(input: HTMLInputElement) {
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setInputFiles(input: HTMLInputElement, files: FileList): boolean {
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "files");
  if (!desc?.set) return false;
  desc.set.call(input, files);
  return true;
}

function isAlreadyUploaded(input: HTMLInputElement): boolean {
  if ((input.files?.length ?? 0) > 0) return true;
  if (input.value.trim().length > 0) return true;

  const container = input.closest("label, fieldset, form, section, div");
  if (!container) return false;

  const controls = Array.from(
    container.querySelectorAll("button, [role='button'], a, label, span"),
  );

  return controls.some((el) =>
    normalizeText(el.textContent ?? "").includes("replace"),
  );
}

async function loadDocumentFromExtension(
  relativePath: string,
  fileName: string,
): Promise<File | null> {
  try {
    const url = chrome.runtime.getURL(relativePath);
    const res = await fetch(url);
    if (!res.ok) return null;

    const blob = await res.blob();
    return new File([blob], fileName, {
      type: blob.type || "application/octet-stream",
    });
  } catch {
    return null;
  }
}

export async function uploadDocumentToMatchingInput(
  matchers: string[],
  relativePath: string,
  fileName: string,
): Promise<boolean> {
  try {
    const input = findFileUploader(matchers);
    if (!input) return false;
    if (isAlreadyUploaded(input)) return false;

    const file = await loadDocumentFromExtension(relativePath, fileName);
    if (!file) return false;

    const dt = new DataTransfer();
    dt.items.add(file);

    const didSet = setInputFiles(input, dt.files);
    if (!didSet) return false;

    dispatchUploadEvents(input);
    return true;
  } catch {
    return false;
  }
}

export async function uploadResumeFromDocuments(): Promise<boolean> {
  return uploadDocumentToMatchingInput(
    ["resume"],
    "documents/resume.pdf",
    "resume.pdf",
  );
}

export async function uploadCoverLetterFromDocuments(): Promise<boolean> {
  return uploadDocumentToMatchingInput(
    ["cover letter"],
    "documents/cover-letter.pdf",
    "cover-letter.pdf",
  );
}
