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

  it("fills a native select when label matches a learned select answer", () => {
    document.body.innerHTML = `
      <form id="application">
        <label for="country">Country</label>
        <select id="country">
          <option value="">Select an option</option>
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </select>
        <button type="submit">Submit</button>
      </form>
    `;

    const select = document.querySelector("#country") as HTMLSelectElement;
    let inputCount = 0;
    let changeCount = 0;

    select.addEventListener("input", () => {
      inputCount += 1;
    });
    select.addEventListener("change", () => {
      changeCount += 1;
    });

    fillPage({
      country: {
        value: "United States",
        matchers: ["country"],
        strategy: "select",
      },
    });

    expect(select.value).toBe("us");
    expect(inputCount).toBe(1);
    expect(changeCount).toBe(1);
  });

  it("fills a native select by matching a configured answer to option text", () => {
    document.body.innerHTML = `
      <label for="country">Country</label>
      <select id="country">
        <option value="">Select an option</option>
        <option value="us">United States</option>
      </select>
    `;

    fillPage({
      country: { value: "+1 United States", matchers: ["country"] },
    });

    expect((document.querySelector("#country") as HTMLSelectElement).value).toBe(
      "us",
    );
  });

  it("prefers a full matching native select option over a shorter contained option", () => {
    document.body.innerHTML = `
      <label for="race">Race</label>
      <select id="race">
        <option value="">Select an option</option>
        <option value="hispanic">Hispanic or Latino</option>
        <option value="white">White (Not Hispanic or Latino)</option>
        <option value="black">Black or African American</option>
      </select>
    `;

    fillPage({
      race: {
        value: "White (Not Hispanic or Latino)",
        matchers: ["race"],
        strategy: "select",
      },
    });

    expect((document.querySelector("#race") as HTMLSelectElement).value).toBe(
      "white",
    );
  });

  it("prefers a prefix contained native select option when no full option exists", () => {
    document.body.innerHTML = `
      <label for="race">Race</label>
      <select id="race">
        <option value="">Select an option</option>
        <option value="hispanic">Hispanic or Latino</option>
        <option value="white">White</option>
      </select>
    `;

    fillPage({
      race: {
        value: "White (Not Hispanic or Latino)",
        matchers: ["race"],
        strategy: "select",
      },
    });

    expect((document.querySelector("#race") as HTMLSelectElement).value).toBe(
      "white",
    );
  });

  it("replaces a native select's implicit browser default", () => {
    document.body.innerHTML = `
      <label for="country">Country</label>
      <select id="country">
        <option value="us">United States</option>
        <option value="ca">Canada</option>
      </select>
    `;

    fillPage({
      country: { value: "Canada", matchers: ["country"], strategy: "select" },
    });

    expect((document.querySelector("#country") as HTMLSelectElement).value).toBe(
      "ca",
    );
  });

  it("fills an application checkbox group from a matching rule", () => {
    document.body.innerHTML = `
      <li class="application-question">
        <div class="application-label full-width multiple-select">
          <div class="text">What is your gender identity?</div>
        </div>
        <div class="application-field full-width">
          <ul data-qa="checkboxes">
            <li><label><input type="checkbox" name="gender" value="Female"><span class="application-answer-alternative">Female</span></label></li>
            <li><label><input id="male" type="checkbox" name="gender" value="Male"><span class="application-answer-alternative">Male</span></label></li>
            <li><label><input type="checkbox" name="gender" value="Non-binary"><span class="application-answer-alternative">Non-binary</span></label></li>
          </ul>
        </div>
      </li>
    `;

    fillPage({
      gender: { value: "Male", matchers: ["gender identity"] },
    });

    expect((document.querySelector("#male") as HTMLInputElement).checked).toBe(
      true,
    );
  });

  it("fills an application checkbox group from remembered selections", () => {
    document.body.innerHTML = `
      <li class="application-question">
        <div class="application-label full-width multiple-select">
          <div class="text">What is your gender identity?</div>
        </div>
        <div class="application-field full-width">
          <ul data-qa="checkboxes">
            <li><label><input type="checkbox" name="gender" value="Female"><span class="application-answer-alternative">Female</span></label></li>
            <li><label><input id="male" type="checkbox" name="gender" value="Male"><span class="application-answer-alternative">Male</span></label></li>
            <li><label><input type="checkbox" name="gender" value="Non-binary"><span class="application-answer-alternative">Non-binary</span></label></li>
          </ul>
        </div>
      </li>
    `;

    fillPage(
      {},
      {
        checkboxSelections: {
          "What is your gender identity?": ["Male"],
        },
      },
    );

    expect((document.querySelector("#male") as HTMLInputElement).checked).toBe(
      true,
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

  it("runs a final text focus/blur pass after all text values are filled", () => {
    document.body.innerHTML = `
      <form id="application">
        <label for="name">Name</label>
        <input id="name" />
        <label for="email">Email</label>
        <input id="email" />
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector("#application") as HTMLFormElement;
    const name = document.querySelector("#name") as HTMLInputElement;
    const email = document.querySelector("#email") as HTMLInputElement;
    const appState = { nameReady: false, emailReady: false };
    let message = "";

    name.addEventListener("blur", () => {
      appState.nameReady = name.value !== "" && email.value !== "";
    });
    email.addEventListener("blur", () => {
      appState.emailReady = name.value !== "" && email.value !== "";
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      message =
        appState.nameReady && appState.emailReady
          ? ""
          : "Form unfinished: text inputs not recognized";
    });

    fillPage({
      fullName: { value: "John Gray", matchers: ["name"] },
      email: { value: "john@example.com", matchers: ["email"] },
    });
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(message).toBe("");
  });

  it("rechecks text controls filled by an earlier fillPage call", () => {
    document.body.innerHTML = `
      <form id="application">
        <label for="name">Name</label>
        <input id="name" />
        <label for="email">Email</label>
        <input id="email" />
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector("#application") as HTMLFormElement;
    const name = document.querySelector("#name") as HTMLInputElement;
    const email = document.querySelector("#email") as HTMLInputElement;
    const filled = new WeakSet<Element>();
    const appState = { nameReady: false, emailReady: false };
    let message = "";

    name.addEventListener("blur", () => {
      appState.nameReady = name.value !== "" && email.value !== "";
    });
    email.addEventListener("blur", () => {
      appState.emailReady = name.value !== "" && email.value !== "";
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      message =
        appState.nameReady && appState.emailReady
          ? ""
          : "Form unfinished: text inputs not recognized";
    });

    fillPage(
      { fullName: { value: "John Gray", matchers: ["name"] } },
      { filled },
    );
    fillPage(
      { email: { value: "john@example.com", matchers: ["email"] } },
      { filled },
    );
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(message).toBe("");
  });
});
