import { writeFile } from "node:fs/promises";
function buildEducationLine(data) {
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
export function buildEducationSection(data) {
    const { educationSegments } = data;
    const lines = educationSegments.map(buildEducationLine);
    return {
        type: "section",
        title: data.title ?? "Education",
        lines,
    };
}
export async function writeEducationSectionToDocx(data) {
    const { outputPath, ...sectionData } = data;
    const educationSection = buildEducationSection(sectionData);
    // Keep runtime dependency optional while still supporting real docx output.
    const pkgName = "docx";
    const docx = (await import(pkgName));
    const { Document, Paragraph, TextRun, Packer, HeadingLevel } = docx;
    const doc = new Document();
    const children = [
        new Paragraph({
            text: educationSection.title,
            heading: HeadingLevel?.HEADING_2 ?? "Heading2",
        }),
    ];
    for (const line of educationSection.lines) {
        const runs = line.map((segment) => {
            return new TextRun({
                text: segment.text,
                bold: segment.type === "education-institution" ||
                    segment.type === "education-credential",
                italics: segment.type === "date-range",
            });
        });
        children.push(new Paragraph({
            children: runs,
            spacing: { after: 120 },
        }));
    }
    doc.addSection({ children });
    const buffer = await Packer.toBuffer(doc);
    await writeFile(outputPath, buffer);
}
//# sourceMappingURL=educationBuilder.js.map