import type { CommunalQuestionGroup } from "@form-filler/shared";

const API_BASE_URL = "http://localhost:3001";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

function isQuestionGroup(value: unknown): value is CommunalQuestionGroup {
  if (!value || typeof value !== "object") return false;

  const questions = (value as { questions?: unknown }).questions;
  return (
    Array.isArray(questions) &&
    questions.every((question) => typeof question === "string")
  );
}

export async function fetchCommunalQuestionGroups(
  fetcher: Fetcher = fetch,
): Promise<CommunalQuestionGroup[]> {
  const res = await fetcher(`${API_BASE_URL}/qa`);
  if (!res.ok) return [];

  const body = (await res.json()) as unknown;
  if (!Array.isArray(body)) return [];

  return body.filter(isQuestionGroup);
}

export async function uploadQuestionGroups(
  groups: CommunalQuestionGroup[],
  fetcher: Fetcher = fetch,
): Promise<void> {
  const uploadableGroups = groups.filter((group) => group.questions.length > 1);

  for (const group of uploadableGroups) {
    const res = await fetcher(`${API_BASE_URL}/qa`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ questions: group.questions }),
    });

    if (!res.ok) {
      throw new Error(`Failed to upload question group: ${res.status}`);
    }
  }
}
