import type { Section } from "../types";
interface BuildContactSectionData {
    name?: string;
    titles?: string[];
    contactInfo?: {
        phone?: string;
        location?: string;
        email?: string;
    };
    links?: {
        text?: string;
        url?: string;
    }[];
}
export declare function buildContactSection(data: BuildContactSectionData): Section;
export {};
//# sourceMappingURL=contactBuilder.d.ts.map