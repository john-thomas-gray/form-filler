import { describe, it, expect } from "vitest";
import { normalizeQuestion, questionMatches } from "./index";

describe("normalizeQuestion", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeQuestion("  What  is  your  gender ?")).toBe(
      "whatisyourgender?",
    );
  });
});

describe("questionMatches", () => {
  it("matches after normalization", () => {
    expect(
      questionMatches("What is  your gender?", " what is your  gender? "),
    ).toBe(true);
  });
});
