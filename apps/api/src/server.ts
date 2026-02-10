import Fastify from "fastify";
import cors from "@fastify/cors";

import { z } from "zod";

export function buildServer() {
  const app = Fastify();

  void app.register(cors, { origin: true });

  return app;
}
