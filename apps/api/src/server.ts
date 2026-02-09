import Fastify from "fastify";
import cors from "@fastify/cors";
import { QAItemSchema, type QAItem } from "@form-filler/shared/src";
import { z } from "zod";

const CreateSchema = QAItemSchema.omit({ id: true });

export function buildServer() {
  const app = Fastify();

  void app.register(cors, { origin: true });

  const store: QAItem[] = [];

  app.get("/qa", async () => store);

  app.post("/qa", async (req, reply) => {
    const body = CreateSchema.parse(req.body);
    const item: QAItem = { id: crypto.randomUUID(), ...body };
    store.push(item);
    return reply.code(201).send(item);
  });

  return app;
}
