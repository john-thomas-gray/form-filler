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

  it("finds Gem-style uploaders with prompts before nested file inputs", () => {
    document.body.innerHTML = `
      <section>
        <div class="gem-field">
          <span>Resume <span>*</span></span>
          <div>
            <div>
              <input id="gem-resume" type="file" />
              <div>Click to upload or drag and drop here</div>
            </div>
          </div>
        </div>
      </section>
    `;

    const input = findResumeUploader();
    expect(input?.id).toBe("gem-resume");
  });

  it("does not reuse a previous upload label for a nested file input", () => {
    document.body.innerHTML = `
      <section>
        <div class="gem-field">
          <span>Resume</span>
          <div>
            <div>
              <input id="resume" type="file" />
            </div>
          </div>
        </div>

        <div class="gem-field">
          <div>
            <div>
              <input id="cover-letter" type="file" />
            </div>
          </div>
        </div>
      </section>
    `;

    const input = findCoverLetterUploader();
    expect(input).toBeNull();
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
