import { buildServer } from "./server";

const app = buildServer();
app.listen({ port: 3001, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
