import Fastify from "fastify";
import cors from "@fastify/cors";

import { normalize } from "@form-filler/shared";
import { z } from "zod";

const QuestionGroupSchema = z.object({
  questions: z.array(z.string().trim().min(1)).min(1),
});

type QuestionGroup = z.infer<typeof QuestionGroupSchema>;

function uniqueQuestions(questions: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const question of questions) {
    const cleaned = question.replace(/\s+/g, " ").trim();
    const key = normalize(cleaned);
    if (!cleaned || seen.has(key)) continue;

    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function groupsOverlap(a: QuestionGroup, b: QuestionGroup): boolean {
  const aKeys = new Set(a.questions.map(normalize));
  return b.questions.some((question) => aKeys.has(normalize(question)));
}

export function buildServer() {
  const app = Fastify();
  let questionGroups: QuestionGroup[] = [];

  void app.register(cors, { origin: true });

  app.get("/qa", async () => questionGroups);

  app.post("/qa", async (req, reply) => {
    const parsed = QuestionGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid question group" });
    }

    const incoming: QuestionGroup = {
      questions: uniqueQuestions(parsed.data.questions),
    };
    const overlapping = questionGroups.filter((group) =>
      groupsOverlap(group, incoming),
    );
    const separate = questionGroups.filter(
      (group) => !groupsOverlap(group, incoming),
    );
    const merged: QuestionGroup = {
      questions: uniqueQuestions([
        ...overlapping.flatMap((group) => group.questions),
        ...incoming.questions,
      ]),
    };

    questionGroups = [...separate, merged];

    return reply.code(201).send(merged);
  });

  return app;
}
