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
interface WriteEducationSectionToDocxData extends BuildEducationSectionData {
    outputPath: string;
}
export declare function writeEducationSectionToDocx(data: WriteEducationSectionToDocxData): Promise<void>;
export {};
//# sourceMappingURL=educationBuilder.d.ts.map