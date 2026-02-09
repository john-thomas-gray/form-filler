import { describe, it, expect } from "vitest";
import { fillPage } from "./domFill";

describe("fillPage", () => {
  it("fills an input when label matches configured question", () => {
    document.body.innerHTML = `
      <label for="gender">What is your gender?</label>
      <input id="gender" />
    `;

    fillPage([{ id: "1", question: "What is your gender?", answer: "Male" }]);

    expect((document.querySelector("#gender") as HTMLInputElement).value).toBe(
      "Male",
    );
  });
});
