import { formatSegment } from "../formatSegment";
import { buildContactSection } from "./contactBuilder";
import { buildEducationSection } from "./educationBuilder";
import { buildExperienceSection } from "./experienceBuilder";
import { buildSkillsSection } from "./skillsBuilder";
export function buildFormattedDocument(userInputs) {
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
        educationSegments: (userInputs.sections?.education?.institutions ?? []).map((institution) => ({
            institution: institution.institution ?? "",
            credential: institution.credential ?? "",
            dateRange: institution.dateRange ?? "",
        })),
    });
    return {
        type: "document",
        sections: [contactSection, skillsSection, experienceSection, educationSection].map(formatSection),
    };
}
function formatSection(section) {
    return {
        type: section.type,
        title: section.title,
        lines: section.lines.map((line) => [...line]
            .sort((left, right) => left.order - right.order)
            .map((segment) => ({
            id: segment.id,
            order: segment.order,
            type: segment.type,
            url: "url" in segment ? segment.url : undefined,
            ...formatSegment(segment),
        }))),
    };
}
function normalizeSkillsCategories(userInputs) {
    const categories = userInputs.sections?.skills?.categories ?? {};
    return Object.entries(categories).map(([name, value], index) => ({
        id: `skills-category-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        order: index * 100,
        type: "raw-category",
        name,
        skills: value.skills ?? [],
    }));
}
function uniqueListingSkills(userInputs) {
    const allSkills = (userInputs.sections?.experiences ?? []).flatMap((experience) => experience.skills ?? []);
    return [...new Set(allSkills.map((skill) => skill.trim()).filter(Boolean))];
}
//# sourceMappingURL=skeletonBuilder.js.map