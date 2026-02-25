import { buildServer } from "./server";

const port = Number(process.env.PORT ?? 4001);

const host = process.env.HOST ?? "0.0.0.0";

const app = buildServer();

await app.listen({ port, host });
