import { describe, it, expect } from "vitest";
import { fillPage } from "./domFill";

describe("fillPage", () => {
  it("fills an input when label matches configured question", () => {
    document.body.innerHTML = `
      <label for="gender">What is your gender?</label>
      <input id="gender" />
    `;

    fillPage({
      gender: { value: "Male", matchers: ["gender", "sex"] },
    });

    expect((document.querySelector("#gender") as HTMLInputElement).value).toBe(
      "Male",
    );
  });

  it("selects the correct radio from a list", () => {
    document.body.innerHTML = `
    <div class="question">
      <div>Are you a veteran?</div>
      <ul>
        <li><label><input type="radio" name="veteran" value="yes"> yes</label></li>
        <li><label><input type="radio" name="veteran" value="no"> no</label></li>
      </ul>
    </div>
  `;

    fillPage({
      veteran: { value: "yes", matchers: ["veteran"], strategy: "radio" },
    });

    const yes = document.querySelector(
      'input[type="radio"][value="yes"]',
    ) as HTMLInputElement;
    expect(yes.checked).toBe(true);
  });
});

describe("fillPage", () => {
  it("checks a checkbox when label matches and rule strategy is checkbox", () => {
    document.body.innerHTML = `
      <label>
        <input id="terms" type="checkbox" />
        I agree to the terms
      </label>
    `;

    fillPage({
      terms: {
        value: "true",
        matchers: ["agree to terms", "i agree", "accept terms"],
        strategy: "checkbox",
      },
    });

    const cb = document.querySelector("#terms") as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it("does not uncheck a checkbox that is already checked", () => {
    document.body.innerHTML = `
      <label>
        <input id="terms" type="checkbox" checked />
        I agree to the terms
      </label>
    `;

    fillPage({
      terms: {
        value: "true",
        matchers: ["agree to terms", "i agree"],
        strategy: "checkbox",
      },
    });

    const cb = document.querySelector("#terms") as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });
});
