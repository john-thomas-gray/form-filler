import { describe, expect, it, vi } from "vitest";
import {
  fetchCommunalQuestionGroups,
  uploadQuestionGroups,
} from "./communalApi";

describe("communalApi", () => {
  it("fetches communal question groups", async () => {
    const fetcher = vi.fn(async () => {
      return Response.json([{ questions: ["Phone", "Telephone"] }]);
    });

    const groups = await fetchCommunalQuestionGroups(fetcher);

    expect(fetcher).toHaveBeenCalledWith("http://localhost:3001/qa");
    expect(groups).toEqual([{ questions: ["Phone", "Telephone"] }]);
  });

  it("uploads only question groups", async () => {
    const fetcher = vi.fn(async () => {
      return Response.json({ questions: ["Phone", "Phone Number"] });
    });

    await uploadQuestionGroups(
      [
        { questions: ["Phone", "Phone Number"] },
        { questions: ["Email"] },
      ],
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith("http://localhost:3001/qa", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questions: ["Phone", "Phone Number"] }),
    });
  });
});
