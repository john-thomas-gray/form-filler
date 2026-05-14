import { z } from "zod";

export const FillStrategySchema = z.enum([
  "test",
  "select",
  "radio",
  "checkbox",
  "button",
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

export type FillStrategy = z.infer<typeof FillStrategySchema>;
export type FillRule = z.infer<typeof FillRuleSchema>;

export const RulesSchema = z.record(z.string(), FillRuleSchema);
export type Rules = z.infer<typeof RulesSchema>;

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[\u2019']/g, "'")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "");
}

export function scoreMatchers(
  candidateText: string,
  matchers: string[],
): number {
  const c = normalize(candidateText);
  let best = 0;

  for (const m of matchers) {
    const mm = normalize(m);
    if (!mm) continue;
    if (c.includes(mm)) best = Math.max(best, mm.length);
  }

  return best;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

function extractYearsThreshold(value: string): number | null {
  const match = value
    .toLowerCase()
    .match(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*\+?\s+years?\b/,
    );

  if (!match) return null;

  const raw = match[1];
  if (/^\d+$/.test(raw)) return Number(raw);

  return NUMBER_WORDS[raw] ?? null;
}

function isExperienceThresholdQuestion(value: string): boolean {
  const normalized = normalize(value);
  return (
    normalized.includes("experience") ||
    normalized.includes("professionalwork") ||
    normalized.includes("workexperience") ||
    normalized.includes("masters")
  );
}

function scoreYearsThresholdMatcher(
  candidateText: string,
  matcher: string,
  answer: string,
): number {
  if (
    !isExperienceThresholdQuestion(candidateText) ||
    !isExperienceThresholdQuestion(matcher)
  ) {
    return 0;
  }

  const candidateYears = extractYearsThreshold(candidateText);
  const matcherYears = extractYearsThreshold(matcher);
  if (candidateYears === null || matcherYears === null) return 0;

  const normalizedAnswer = normalizeAnswer(answer);
  const isYes = normalizedAnswer === "yes" || normalizedAnswer === "true";
  const isNo = normalizedAnswer === "no" || normalizedAnswer === "false";

  if (isYes && candidateYears <= matcherYears) {
    return normalize(matcher).length - Math.abs(matcherYears - candidateYears);
  }

  if (isNo && candidateYears >= matcherYears) {
    return normalize(matcher).length - Math.abs(matcherYears - candidateYears);
  }

  return 0;
}

function scoreRule(candidateText: string, rule: FillRule): number {
  let best = scoreMatchers(candidateText, rule.matchers);

  for (const matcher of rule.matchers) {
    best = Math.max(
      best,
      scoreYearsThresholdMatcher(candidateText, matcher, rule.value),
    );
  }

  return best;
}

export function pickBestRule(
  candidateText: string,
  rules: Rules,
): FillRule | null {
  let bestRule: FillRule | null = null;
  let bestScore = 0;
  let tied = false;

  for (const key of Object.keys(rules)) {
    const rule = rules[key];
    const score = scoreRule(candidateText, rule);
    if (score <= 0) continue;

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
      tied = false;
    } else if (score === bestScore) {
      tied = true;
    }
  }

  if (!bestRule) return null;
  if (tied) return null;
  return bestRule;
}

export * from "./learning";
