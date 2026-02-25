import type { Section, Line } from "../types";

interface EducationSegment {
  institution: string;
  credential: string;
  dateRange: string;
}

function buildEducationLine(data: EducationSegment): Line {
  const { institution, credential, dateRange } = data;
  return [
    {
      id: "education-institution",
      order: 0,
      type: "education-institution",
      text: institution,
    },
    {
      id: "education-separator-1",
      order: 1,
      type: "education-separator",
      text: " - ",
    },
    {
      id: "education-credential",
      order: 2,
      type: "education-credential",
      text: credential,
    },
    {
      id: "education-separator-2",
      order: 3,
      type: "education-separator",
      text: " ",
    },
    {
      id: "education-date-range",
      order: 4,
      type: "date-range",
      text: dateRange,
    },
  ];
}

interface BuildEducationSectionData {
  title?: string;
  educationSegments: EducationSegment[];
}

export function buildEducationSection(
  data: BuildEducationSectionData,
): Section {
  const { educationSegments } = data;
  const lines: Line[] = educationSegments.map(buildEducationLine);
  return {
    type: "section",
    title: data.title ?? "Education",
    lines,
  };
}
