import type { Section } from "../types";
interface EducationSegment {
    institution: string;
    credential: string;
    dateRange: string;
}
interface BuildEducationSectionData {
    title?: string;
    educationSegments: EducationSegment[];
}
export declare function buildEducationSection(data: BuildEducationSectionData): Section;
export {};
//# sourceMappingURL=educationBuilder.d.ts.map