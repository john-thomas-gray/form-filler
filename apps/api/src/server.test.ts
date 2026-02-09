import { describe, it, expect } from "vitest";
import { buildServer } from "./server";

describe("GET /qa", () => {
  it("returns an empty list initially", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/qa" });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });
});
