import { describe, expect, it } from "vitest";
import {
  findCheckboxChoiceGroups,
  getCheckboxSelectionObservation,
  selectRememberedCheckboxOptions,
} from "./checkboxFill";

function renderApplicationQuestionCheckboxes() {
  document.body.innerHTML = `
    <li class="application-question">
      <div class="application-label full-width multiple-select">
        <div class="text">What is your gender identity?</div>
      </div>
      <div class="application-field full-width">
        <ul data-qa="checkboxes">
          <li>
            <label>
              <input type="checkbox" name="surveysResponses[2c749726-2775-4cf5-827e-3699ca6e59a2][responses][field2]" value="Female">
              <span class="application-answer-alternative">Female</span>
            </label>
          </li>
          <li>
            <label>
              <input id="male" type="checkbox" name="surveysResponses[2c749726-2775-4cf5-827e-3699ca6e59a2][responses][field2]" value="Male">
              <span class="application-answer-alternative">Male</span>
            </label>
          </li>
          <li>
            <label>
              <input type="checkbox" name="surveysResponses[2c749726-2775-4cf5-827e-3699ca6e59a2][responses][field2]" value="Non-binary">
              <span class="application-answer-alternative">Non-binary</span>
            </label>
          </li>
        </ul>
      </div>
    </li>
  `;
}

describe("checkboxFill", () => {
  it("finds checkbox groups in application-question markup", () => {
    renderApplicationQuestionCheckboxes();

    const groups = findCheckboxChoiceGroups();

    expect(groups).toHaveLength(1);
    expect(groups[0].groupLabel).toBe("What is your gender identity?");
    expect(groups[0].choices.map((choice) => choice.labelText)).toEqual([
      "Female",
      "Male",
      "Non-binary",
    ]);
  });

  it("observes the selected checkbox option for memory", () => {
    renderApplicationQuestionCheckboxes();

    const male = document.querySelector("#male") as HTMLInputElement;
    male.checked = true;

    expect(getCheckboxSelectionObservation(male)).toMatchObject({
      groupLabel: "What is your gender identity?",
      optionText: "Male",
      checked: true,
      checkbox: male,
    });
  });

  it("checks remembered checkbox options", () => {
    renderApplicationQuestionCheckboxes();

    selectRememberedCheckboxOptions({
      "What is your gender identity?": ["Male"],
    });

    expect((document.querySelector("#male") as HTMLInputElement).checked).toBe(
      true,
    );
  });
});
