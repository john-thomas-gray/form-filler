import type { Section } from "../types";
interface ExperienceSegment {
    sectionHeader?: string;
    position?: string;
    company?: string;
    website?: string;
    project?: string;
    dateRange?: string;
    skills?: string[];
    responsibilities?: string[];
}
interface BuildExperienceSectionData {
    title?: string;
    experiences: ExperienceSegment[];
}
export declare function buildExperienceSection(data: BuildExperienceSectionData): Section;
export {};
//# sourceMappingURL=experienceBuilder.d.ts.map