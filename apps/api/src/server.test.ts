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

describe("POST /qa", () => {
  it("merges communal aliases when submitted question groups overlap", async () => {
    const app = buildServer();

    const first = await app.inject({
      method: "POST",
      url: "/qa",
      payload: { questions: ["Phone", "Telephone"] },
    });
    const second = await app.inject({
      method: "POST",
      url: "/qa",
      payload: { questions: ["Phone", "Phone Number"] },
    });
    const res = await app.inject({ method: "GET", url: "/qa" });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(JSON.parse(res.body)).toEqual([
      { questions: ["Phone", "Telephone", "Phone Number"] },
    ]);
  });
});
