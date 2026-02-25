export type SegmentType = "name" | "contact" | "link" | "url" | "category" | "skill" | "section-header" | "sub-header" | "text" | "date-range" | "education-institution" | "education-credential" | "education-separator" | "separator";
interface BaseSegment {
    id: string;
    order: number;
    type: SegmentType;
    text: string;
}
export type Segment = (BaseSegment & {
    type: "name";
    textAlign: "right";
}) | (BaseSegment & {
    type: "contact";
}) | (BaseSegment & {
    type: "link";
    url: string;
}) | (BaseSegment & {
    type: "url";
    url: string;
}) | (BaseSegment & {
    type: "category";
}) | (BaseSegment & {
    type: "skill";
}) | (BaseSegment & {
    type: "section-header";
}) | (BaseSegment & {
    type: "sub-header";
}) | (BaseSegment & {
    type: "text";
}) | (BaseSegment & {
    type: "date-range";
}) | (BaseSegment & {
    type: "education-institution";
}) | (BaseSegment & {
    type: "education-credential";
}) | (BaseSegment & {
    type: "education-separator";
}) | (BaseSegment & {
    type: "separator";
    variant: "skill" | "sub-header" | "category";
    text: "|";
});
export type Line = readonly Segment[];
export interface Section {
    type: "section";
    title: string;
    lines: Line[];
}
export {};
//# sourceMappingURL=types.d.ts.map