import { describe, expect, it } from "vitest";
import {
  QUESTION_CONSTRUCTS,
  recognizeQuestionConstructs,
} from "./questionConstructs";

describe("question constructs", () => {
  it("keeps an explicit registry of supported question construct types", () => {
    expect(QUESTION_CONSTRUCTS.map((construct) => construct.kind)).toEqual([
      "text",
      "textarea",
    ]);
  });

  it("recognizes text question constructs on a page", () => {
    document.body.innerHTML = `
      <section>
        <label for="name">Name*</label>
        <input id="name" />

        <label for="bio">Why are you interested?</label>
        <textarea id="bio"></textarea>
      </section>
    `;

    const recognized = recognizeQuestionConstructs();

    expect(
      recognized.map((construct) => ({
        kind: construct.kind,
        questionText: construct.questionText,
      })),
    ).toEqual([
      { kind: "text", questionText: "Name*" },
      { kind: "textarea", questionText: "Why are you interested?" },
    ]);
  });
});
