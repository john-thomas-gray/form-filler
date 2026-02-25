import { describe, it, expect } from "vitest";
import { buildServer } from "./server";

describe("resume-tailor service", () => {
  it("health returns ok", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
  });
});
