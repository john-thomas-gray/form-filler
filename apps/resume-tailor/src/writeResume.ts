import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { userInputs } from "./dummy";
import { buildFormattedDocument } from "./section_builders/skeletonBuilder";

type FormattedDocument = ReturnType<typeof buildFormattedDocument>;
type FormattedSegment = FormattedDocument["sections"][number]["lines"][number][number];

const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), "documents");
const outputPath = join(outputDirectory, "resume.docx");
const TWIPS_PER_INCH = 1440;
const LINE_SPACING = 276;

export async function writeResume(inputs = userInputs): Promise<string> {
  const formattedDocument = buildFormattedDocument(inputs);
  const paragraphs = buildParagraphs(formattedDocument);

  const doc = new Document({
    background: {
      color: "1f1f1f",
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: inchesToTwips(0.25),
              bottom: inchesToTwips(0.25),
              left: inchesToTwips(0.25),
              right: inchesToTwips(0.25),
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const docBuffer = await Packer.toBuffer(doc);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, docBuffer);

  return outputPath;
}

function buildParagraphs(document: FormattedDocument): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  document.sections.forEach((section, sectionIndex) => {
    paragraphs.push(
      ...section.lines.map((line) => createParagraph(line, section.title)),
    );

    if (sectionIndex < document.sections.length - 1) {
      paragraphs.push(createSectionSpacerParagraph());
    }
  });

  return paragraphs;
}

function createParagraph(line: FormattedSegment[], sectionTitle: string): Paragraph {
  const firstSegment = line[0];
  const isContactSection = sectionTitle === "Contact";

  return new Paragraph({
    alignment: isContactSection
      ? AlignmentType.RIGHT
      : toParagraphAlignment(firstSegment?.textAlign),
    spacing: { line: LINE_SPACING },
    children: line.map((segment) => createRunOrLink(segment)),
  });
}

function createSectionSpacerParagraph(): Paragraph {
  return new Paragraph({
    spacing: { line: LINE_SPACING },
    children: [new TextRun({ text: "" })],
  });
}

function createRunOrLink(segment: FormattedSegment): TextRun | ExternalHyperlink {
  const run = createTextRun(segment);
  if (segment.url) {
    return new ExternalHyperlink({
      children: [run],
      link: segment.url,
    });
  }
  return run;
}

function createTextRun(segment: FormattedSegment): TextRun {
  const styles = new Set(segment.fontStyle);
  return new TextRun({
    text: normalizeTextByStyle(segment.text, styles),
    color: segment.fontColor.replace("#", ""),
    size: segment.fontSize * 2,
    font: "Inter",
    bold: styles.has("bold"),
    italics: styles.has("italic"),
    underline: styles.has("underline") ? {} : undefined,
    allCaps: styles.has("uppercase"),
  });
}

function normalizeTextByStyle(text: string, styles: Set<string>): string {
  if (styles.has("lowercase")) {
    return text.toLowerCase();
  }
  if (styles.has("capitalize")) {
    return text.replace(/\b([a-z])/g, (match) => match.toUpperCase());
  }
  return text;
}

function toParagraphAlignment(textAlign: FormattedSegment["textAlign"]) {
  if (textAlign === "center") {
    return AlignmentType.CENTER;
  }
  if (textAlign === "right") {
    return AlignmentType.RIGHT;
  }
  if (textAlign === "left") {
    return AlignmentType.LEFT;
  }
  return undefined;
}

function inchesToTwips(inches: number) {
  return Math.round(inches * TWIPS_PER_INCH);
}

await writeResume();
