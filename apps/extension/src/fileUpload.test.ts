import { describe, expect, it } from "vitest";
import {
  findCoverLetterUploader,
  findFileUploader,
  findResumeUploader,
} from "./fileUpload";

describe("findFileUploader", () => {
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
});
