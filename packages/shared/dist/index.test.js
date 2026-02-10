import { describe, it, expect } from "vitest";
import { normalize, scoreMatchers, pickBestRule } from "./index";
describe("normalize", () => {
    it("normalizes case and whitespace", () => {
        expect(normalize("  Gender   Identity? ")).toBe("genderidentity");
    });
});
describe("scoreMatchers", () => {
    it("prefers longer phrase matches", () => {
        const s1 = scoreMatchers("What is your gender identity?", [
            "gender",
            "gender identity",
        ]);
        expect(s1).toBe("genderidentity".length);
    });
    it("matches through punctuation and casing", () => {
        const s = scoreMatchers("GENDER-IDENTITY:", ["gender identity"]);
        expect(s).toBe("genderidentity".length);
    });
});
describe("pickBestRule", () => {
    it("picks highest scoring rule", () => {
        const rules = {
            gender: { value: "Male", matchers: ["gender", "sex"] },
            email: { value: "a@b.com", matchers: ["email"] },
        };
        expect(pickBestRule("What is your gender?", rules)?.value).toBe("Male");
    });
    it("returns null on tie", () => {
        const rules = {
            a: { value: "X", matchers: ["name"] },
            b: { value: "Y", matchers: ["name"] },
        };
        expect(pickBestRule("Full name", rules)).toBeNull();
    });
});
