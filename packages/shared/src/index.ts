import { z } from "zod";

export const QAItemSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  answer: z.string(),
});

export type QAItem = z.infer<typeof QAItemSchema>;

export function normalizeQuestion(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

export function questionMatches(
  labelText: string,
  configuredQuestion: string,
): boolean {
  return normalizeQuestion(labelText) === normalizeQuestion(configuredQuestion);
}
