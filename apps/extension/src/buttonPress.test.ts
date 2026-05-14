import { describe, expect, it, vi } from "vitest";
import {
  findButtonChoiceGroups,
  getButtonPressObservation,
  isButtonChoiceGroupAnswered,
  pressButtonChoice,
} from "./buttonPress";

describe("buttonPress", () => {
  it("finds an Ashby-style yes/no button group and presses the matching answer", () => {
    const yesClick = vi.fn();
    document.body.innerHTML = `
      <div class="field">
        <div>Do you have at least 3 years of professional work experience?</div>
        <div>
          <button type="button" id="yes">Yes</button>
          <button type="button" id="no">No</button>
        </div>
      </div>
    `;
    document.querySelector("#yes")?.addEventListener("click", yesClick);

    const groups = findButtonChoiceGroups();

    expect(groups).toHaveLength(1);
    expect(groups[0].questionText).toBe(
      "Do you have at least 3 years of professional work experience?",
    );
    expect(
      pressButtonChoice(groups[0], {
        value: "Yes",
        matchers: ["professional work experience"],
      }),
    ).toBe(true);
    expect(yesClick).toHaveBeenCalledTimes(1);
  });

  it("ignores submit and upload buttons", () => {
    document.body.innerHTML = `
      <form>
        <button type="button">Upload File</button>
        <button type="submit">Submit Application</button>
      </form>
    `;

    expect(findButtonChoiceGroups()).toEqual([]);
  });

  it("uses the previous prompt sibling for Ashby-style separated button rows", () => {
    const yesClick = vi.fn();
    document.body.innerHTML = `
      <section>
        <div>Name*</div>
        <input aria-label="Name*" />
        <div>Do you have at least 3 years of professional work experience, or a masters related to this role?*</div>
        <div>
          <button type="button" id="yes">Yes</button>
          <button type="button" id="no">No</button>
        </div>
        <div>Do you have experience designing backend services?*</div>
        <div>
          <button type="button">Yes</button>
          <button type="button">No</button>
        </div>
      </section>
    `;
    document.querySelector("#yes")?.addEventListener("click", yesClick);

    const groups = findButtonChoiceGroups();

    expect(groups.map((group) => group.questionText)).toEqual([
      "Do you have at least 3 years of professional work experience, or a masters related to this role?",
      "Do you have experience designing backend services?",
    ]);
    expect(
      pressButtonChoice(groups[0], {
        value: "Yes",
        matchers: ["at least 3 years of professional work experience"],
        strategy: "button",
      }),
    ).toBe(true);
    expect(yesClick).toHaveBeenCalledTimes(1);
  });

  it("learns the previous prompt sibling when a separated button is clicked", () => {
    document.body.innerHTML = `
      <section>
        <div>Do you have at least 3 years of professional work experience?*</div>
        <div>
          <button type="button" id="yes">Yes</button>
          <button type="button" id="no">No</button>
        </div>
      </section>
    `;

    expect(getButtonPressObservation(document.querySelector("#yes"))).toMatchObject({
      question: "Do you have at least 3 years of professional work experience?",
      answer: "Yes",
      strategy: "button",
    });
  });

  it("detects when a button choice group already has a selected answer", () => {
    document.body.innerHTML = `
      <section>
        <div>Do you have at least 3 years of professional work experience?*</div>
        <div>
          <button type="button" aria-pressed="true">Yes</button>
          <button type="button">No</button>
        </div>
      </section>
    `;

    const groups = findButtonChoiceGroups();

    expect(isButtonChoiceGroupAnswered(groups[0])).toBe(true);
  });
});
