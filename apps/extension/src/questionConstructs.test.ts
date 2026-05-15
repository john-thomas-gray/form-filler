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
      "select",
      "checkbox",
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

  it("recognizes Gem-style prompts rendered before nested text inputs", () => {
    document.body.innerHTML = `
      <section>
        <div class="gem-field">
          <span>First name <span>*</span></span>
          <div>
            <div>
              <input />
            </div>
          </div>
        </div>

        <div class="gem-field">
          <span>Last name <span>*</span></span>
          <div>
            <div>
              <input />
            </div>
          </div>
        </div>
      </section>
    `;

    const recognized = recognizeQuestionConstructs();

    expect(
      recognized.map((construct) => ({
        kind: construct.kind,
        questionText: construct.questionText,
      })),
    ).toEqual([
      { kind: "text", questionText: "First name" },
      { kind: "text", questionText: "Last name" },
    ]);
  });

  it("recognizes Gem-style custom questions rendered before nested text controls", () => {
    document.body.innerHTML = `
      <section>
        <div class="gem-question">
          <div>
            <span>Why do you want to work here?</span>
          </div>
          <div>
            <div>
              <textarea></textarea>
            </div>
          </div>
        </div>
      </section>
    `;

    const recognized = recognizeQuestionConstructs();

    expect(
      recognized.map((construct) => ({
        kind: construct.kind,
        questionText: construct.questionText,
      })),
    ).toEqual([
      {
        kind: "textarea",
        questionText: "Why do you want to work here?",
      },
    ]);
  });

  it("recognizes native select question constructs", () => {
    document.body.innerHTML = `
      <section>
        <label for="country">Country*</label>
        <select id="country">
          <option value="">Select an option</option>
          <option value="us">United States</option>
        </select>

        <div class="gem-field">
          <span>Highest level of education <span>*</span></span>
          <div>
            <select>
              <option value="">Select an option</option>
              <option value="bachelors">Bachelor's Degree</option>
            </select>
          </div>
        </div>
      </section>
    `;

    const recognized = recognizeQuestionConstructs();

    expect(
      recognized.map((construct) => ({
        kind: construct.kind,
        questionText: construct.questionText,
      })),
    ).toEqual([
      { kind: "select", questionText: "Country*" },
      {
        kind: "select",
        questionText: "Highest level of education",
      },
    ]);
  });

  it("recognizes application checkbox question constructs", () => {
    document.body.innerHTML = `
      <li class="application-question">
        <div class="application-label full-width multiple-select">
          <div class="text">What is your gender identity?</div>
        </div>
        <div class="application-field full-width">
          <ul data-qa="checkboxes">
            <li><label><input type="checkbox" name="gender" value="Female"><span>Female</span></label></li>
            <li><label><input type="checkbox" name="gender" value="Male"><span>Male</span></label></li>
          </ul>
        </div>
      </li>
    `;

    const recognized = recognizeQuestionConstructs();

    expect(
      recognized.map((construct) => ({
        kind: construct.kind,
        questionText: construct.questionText,
      })),
    ).toEqual([
      {
        kind: "checkbox",
        questionText: "What is your gender identity?",
      },
    ]);
  });

  it("does not reuse a previous field label when a nested input has no prompt", () => {
    document.body.innerHTML = `
      <section>
        <div class="gem-field">
          <span>First name</span>
          <div>
            <div>
              <input />
            </div>
          </div>
        </div>

        <div class="gem-field">
          <div>
            <div>
              <input />
            </div>
          </div>
        </div>
      </section>
    `;

    const recognized = recognizeQuestionConstructs();

    expect(recognized.map((construct) => construct.questionText)).toEqual([
      "First name",
    ]);
  });
});
