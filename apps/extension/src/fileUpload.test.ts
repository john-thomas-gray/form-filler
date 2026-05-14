import { afterEach, describe, expect, it, vi } from "vitest";
import {
  findCoverLetterUploader,
  findFileUploader,
  findResumeUploader,
  uploadDocumentToMatchingInput,
} from "./fileUpload";

describe("findFileUploader", () => {
  const originalChrome = (globalThis as any).chrome;

  afterEach(() => {
    (globalThis as any).chrome = originalChrome;
    vi.unstubAllGlobals();
  });

  it("finds uploader using a general matcher", () => {
    document.body.innerHTML = `
      <label for="resume-upload">Upload your resume</label>
      <input id="resume-upload" type="file" />
    `;

    const input = findFileUploader(["resume"]);
    expect(input?.id).toBe("resume-upload");
  });

  it("finds uploader using resume helper", () => {
    document.body.innerHTML = `
      <label for="resume">Resume</label>
      <input id="resume" type="file" />
      <label for="cover-letter">Cover letter</label>
      <input id="cover-letter" type="file" />
    `;

    const input = findResumeUploader();
    expect(input?.id).toBe("resume");
  });

  it("finds uploader using cover letter helper", () => {
    document.body.innerHTML = `
      <label for="resume">Resume</label>
      <input id="resume" type="file" />
      <label for="cover-letter">Cover letter</label>
      <input id="cover-letter" type="file" />
    `;

    const input = findCoverLetterUploader();
    expect(input?.id).toBe("cover-letter");
  });

  it("finds uploader using id when label text is missing", () => {
    document.body.innerHTML = `
      <input id="_systemfield_resume" type="file" />
    `;

    const input = findResumeUploader();
    expect(input?.id).toBe("_systemfield_resume");
  });

  it("skips upload instead of throwing when the bundled document is missing", async () => {
    document.body.innerHTML = `
      <label for="cover-letter">Cover letter</label>
      <input id="cover-letter" type="file" />
    `;
    (globalThis as any).chrome = {
      runtime: {
        getURL(path: string) {
          return `chrome-extension://test/${path}`;
        },
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(
      uploadDocumentToMatchingInput(
        ["cover letter"],
        "documents/cover-letter.pdf",
        "cover-letter.pdf",
      ),
    ).resolves.toBe(false);
  });
});
