import { describe, expect, it } from "vitest";
import { pickBestRule } from "./index";
import { buildRulesFromMemory, createAnswerMemory, mergeCommunalAliases, recordAnswer, } from "./learning";
describe("answer memory learning", () => {
    it("groups different prompts that received the same answer", () => {
        let memory = createAnswerMemory();
        memory = recordAnswer(memory, {
            question: "Phone",
            answer: "123456789",
        });
        memory = recordAnswer(memory, {
            question: "Telephone Number",
            answer: "123456789",
        });
        expect(memory.groups).toHaveLength(1);
        expect(memory.groups[0]).toMatchObject({
            answer: "123456789",
            questions: ["Phone", "Telephone Number"],
        });
        const rules = buildRulesFromMemory(memory);
        expect(rules.learned_1.matchers).toEqual(["Phone", "Telephone Number"]);
        expect(rules.learned_1.value).toBe("123456789");
    });
    it("adds communal aliases only when the user has a local answer for that field type", () => {
        const memory = recordAnswer(createAnswerMemory(), {
            question: "Phone",
            answer: "123456789",
        });
        const merged = mergeCommunalAliases(memory, [
            {
                questions: ["Phone", "Telephone", "Phone Number"],
            },
        ]);
        expect(merged.groups[0].questions).toEqual([
            "Phone",
            "Telephone",
            "Phone Number",
        ]);
    });
    it("does not merge unrelated prompts that share a low-information answer", () => {
        let memory = createAnswerMemory();
        memory = recordAnswer(memory, {
            question: "Do you need visa sponsorship?",
            answer: "No",
        });
        memory = recordAnswer(memory, {
            question: "Are you a protected veteran?",
            answer: "No",
        });
        expect(memory.groups).toEqual([
            {
                answer: "No",
                questions: ["Do you need visa sponsorship?"],
            },
            {
                answer: "No",
                questions: ["Are you a protected veteran?"],
            },
        ]);
    });
    it("matches lower years-of-experience thresholds from a learned yes answer", () => {
        const memory = recordAnswer(createAnswerMemory(), {
            question: "Do you have at least 3 years of professional work experience, or a masters related to this role?",
            answer: "Yes",
        });
        const rules = buildRulesFromMemory(memory);
        const rule = pickBestRule("Do you have at least 2 years of professional work experience?", rules);
        expect(rule?.value).toBe("Yes");
    });
});
