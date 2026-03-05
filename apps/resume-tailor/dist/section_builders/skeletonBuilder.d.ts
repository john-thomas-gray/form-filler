import { formatSegment } from "../formatSegment";
import type { Segment } from "../types";
interface UserInputs {
    contactInfo?: {
        name?: string;
        titles?: string[];
        phone?: string;
        location?: string;
        email?: string;
        links?: {
            text?: string;
            url?: string;
        }[];
    };
    sections?: {
        skills?: {
            categories?: Record<string, {
                skills?: string[];
            }>;
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
        lines: Array<Array<ReturnType<typeof formatSegment> & {
            id: string;
            order: number;
            type: Segment["type"];
            url?: string;
        }>>;
    }>;
}
export declare function buildFormattedDocument(userInputs: UserInputs): FormattedDocument;
export {};
//# sourceMappingURL=skeletonBuilder.d.ts.map