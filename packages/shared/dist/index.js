import { z } from "zod";
export const FillStrategySchema = z.enum([
    "test",
    "select",
    "radio",
    "checkbox",
]);
export const FillRuleSchema = z.object({
    value: z.string(),
    matchers: z.array(z.string()).min(1),
    strategy: FillStrategySchema.optional(),
    inputTypes: z.array(z.string()).optional(),
    allowTextArea: z.boolean().optional(),
    radioValues: z.array(z.string()).optional(),
    checkboxValues: z.array(z.string()).optional(),
});
export const RulesSchema = z.record(z.string(), FillRuleSchema);
export function normalize(s) {
    return s
        .toLowerCase()
        .trim()
        .replace(/[\u2019']/g, "'")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "");
}
export function scoreMatchers(candidateText, matchers) {
    const c = normalize(candidateText);
    let best = 0;
    for (const m of matchers) {
        const mm = normalize(m);
        if (!mm)
            continue;
        if (c.includes(mm))
            best = Math.max(best, mm.length);
    }
    return best;
}
export function pickBestRule(candidateText, rules) {
    let bestRule = null;
    let bestScore = 0;
    let tied = false;
    for (const key of Object.keys(rules)) {
        const rule = rules[key];
        const score = scoreMatchers(candidateText, rule.matchers);
        if (score <= 0)
            continue;
        if (score > bestScore) {
            bestScore = score;
            bestRule = rule;
            tied = false;
        }
        else if (score === bestScore) {
            tied = true;
        }
    }
    if (!bestRule)
        return null;
    if (tied)
        return null;
    return bestRule;
}
