import { z } from "zod";
export declare const FillStrategySchema: z.ZodEnum<{
    test: "test";
    select: "select";
    radio: "radio";
    checkbox: "checkbox";
}>;
export declare const FillRuleSchema: z.ZodObject<{
    value: z.ZodString;
    matchers: z.ZodArray<z.ZodString>;
    strategy: z.ZodOptional<z.ZodEnum<{
        test: "test";
        select: "select";
        radio: "radio";
        checkbox: "checkbox";
    }>>;
    inputTypes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowTextArea: z.ZodOptional<z.ZodBoolean>;
    radioValues: z.ZodOptional<z.ZodArray<z.ZodString>>;
    checkboxValues: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type FillStrategy = z.infer<typeof FillStrategySchema>;
export type FillRule = z.infer<typeof FillRuleSchema>;
export declare const RulesSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    value: z.ZodString;
    matchers: z.ZodArray<z.ZodString>;
    strategy: z.ZodOptional<z.ZodEnum<{
        test: "test";
        select: "select";
        radio: "radio";
        checkbox: "checkbox";
    }>>;
    inputTypes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowTextArea: z.ZodOptional<z.ZodBoolean>;
    radioValues: z.ZodOptional<z.ZodArray<z.ZodString>>;
    checkboxValues: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
export type Rules = z.infer<typeof RulesSchema>;
export declare function normalize(s: string): string;
export declare function scoreMatchers(candidateText: string, matchers: string[]): number;
export declare function pickBestRule(candidateText: string, rules: Rules): FillRule | null;
//# sourceMappingURL=index.d.ts.map