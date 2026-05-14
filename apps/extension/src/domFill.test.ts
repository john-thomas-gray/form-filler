import { describe, expect, it } from "vitest";
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

  it("updates blur-driven text form state without requiring user focus", () => {
    document.body.innerHTML = `
      <form id="application">
        <label for="name">Name</label>
        <input id="name" />
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector("#application") as HTMLFormElement;
    const input = document.querySelector("#name") as HTMLInputElement;
    const appState = { name: "" };
    let didFocus = false;
    let message = "";

    input.addEventListener("focus", () => {
      didFocus = true;
    });
    input.addEventListener("blur", () => {
      if (didFocus) appState.name = input.value;
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      message = appState.name ? "" : "Form unfinished: fill in name";
    });

    fillPage({
      fullName: { value: "John Gray", matchers: ["name"] },
    });
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(message).toBe("");
  });

  it("updates focus-driven text form state after the value is filled", () => {
    document.body.innerHTML = `
      <form id="application">
        <label for="name">Name</label>
        <input id="name" />
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector("#application") as HTMLFormElement;
    const input = document.querySelector("#name") as HTMLInputElement;
    const appState = { name: "" };
    let message = "";

    input.addEventListener("focus", () => {
      appState.name = input.value;
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      message = appState.name ? "" : "Form unfinished: fill in name";
    });

    fillPage({
      fullName: { value: "John Gray", matchers: ["name"] },
    });
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(message).toBe("");
  });

  it("updates click-driven text form state after the value is filled", () => {
    document.body.innerHTML = `
      <form id="application">
        <label for="name">Name</label>
        <input id="name" />
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector("#application") as HTMLFormElement;
    const input = document.querySelector("#name") as HTMLInputElement;
    const appState = { name: "" };
    let message = "";

    input.addEventListener("click", () => {
      appState.name = input.value;
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      message = appState.name ? "" : "Form unfinished: fill in name";
    });

    fillPage({
      fullName: { value: "John Gray", matchers: ["name"] },
    });
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(message).toBe("");
  });
});
