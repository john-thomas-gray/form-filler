import { formatSegment } from "../formatSegment";
import type { RawCategory, Section, Segment } from "../types";
import { buildContactSection } from "./contactBuilder";
import { buildEducationSection } from "./educationBuilder";
import { buildExperienceSection } from "./experienceBuilder";
import { buildSkillsSection } from "./skillsBuilder";

interface UserInputs {
  contactInfo?: {
    name?: string;
    titles?: string[];
    phone?: string;
    location?: string;
    email?: string;
    links?: { text?: string; url?: string }[];
  };
  sections?: {
    skills?: {
      categories?: Record<string, { skills?: string[] }>;
    };
    experiences?: Array<{
      sectionHeader?: string;
      position?: string;
      company?: string;
      website?: string;
      project?: string;
      dateRange?: string;
      skills?: string[];
      responsibilities?: string[];
    }>;
    education?: {
      institutions?: Array<{
        institution?: string;
        credential?: string;
        dateRange?: string;
      }>;
    };
  };
}

interface FormattedDocument {
  type: "document";
  sections: Array<{
    type: "section";
    title: string;
    lines: Array<
      Array<
        ReturnType<typeof formatSegment> & {
          id: string;
          order: number;
          type: Segment["type"];
          url?: string;
        }
      >
    >;
  }>;
}

export function buildFormattedDocument(userInputs: UserInputs): FormattedDocument {
  const contactSection = buildContactSection({
    name: userInputs.contactInfo?.name,
    titles: userInputs.contactInfo?.titles,
    contactInfo: {
      phone: userInputs.contactInfo?.phone,
      location: userInputs.contactInfo?.location,
      email: userInputs.contactInfo?.email,
    },
    links: userInputs.contactInfo?.links,
  });

  const name = userInputs.contactInfo?.name?.trim();
  if (name) {
    contactSection.lines.unshift([
      {
        id: "contact-name",
        order: 0,
        type: "name",
        text: name,
        textAlign: "right",
      },
    ]);
  }

  const experienceSection = buildExperienceSection({
    experiences: userInputs.sections?.experiences ?? [],
  });

  const skillsSection = buildSkillsSection({
    categories: normalizeSkillsCategories(userInputs),
    listingSkills: uniqueListingSkills(userInputs),
  });

  const educationSection = buildEducationSection({
    educationSegments: (userInputs.sections?.education?.institutions ?? []).map(
      (institution) => ({
        institution: institution.institution ?? "",
        credential: institution.credential ?? "",
        dateRange: institution.dateRange ?? "",
      }),
    ),
  });

  return {
    type: "document",
    sections: [contactSection, skillsSection, experienceSection, educationSection].map(
      formatSection,
    ),
  };
}

function formatSection(section: Section) {
  return {
    type: section.type,
    title: section.title,
    lines: section.lines.map((line) =>
      [...line]
        .sort((left, right) => left.order - right.order)
        .map((segment) => ({
          id: segment.id,
          order: segment.order,
          type: segment.type,
          url: "url" in segment ? segment.url : undefined,
          ...formatSegment(segment),
        })),
    ),
  };
}

function normalizeSkillsCategories(userInputs: UserInputs): RawCategory[] {
  const categories = userInputs.sections?.skills?.categories ?? {};

  return Object.entries(categories).map(([name, value], index) => ({
    id: `skills-category-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    order: index * 100,
    type: "raw-category",
    name,
    skills: value.skills ?? [],
  }));
}

function uniqueListingSkills(userInputs: UserInputs): string[] {
  const allSkills = (userInputs.sections?.experiences ?? []).flatMap(
    (experience) => experience.skills ?? [],
  );

  return [...new Set(allSkills.map((skill) => skill.trim()).filter(Boolean))];
}
