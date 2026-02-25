import type { Line, Section, Segment } from "../types";
interface BuildContactSectionData {
  name?: string;
  titles?: string[];
  contactInfo?: {
    phone?: string;
    location?: string;
    email?: string;
  };
  links?: { text?: string; url?: string }[];
}

export function buildContactSection(data: BuildContactSectionData): Section {
  const lines: Line[] = [];

  const titles = (data.titles ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (titles.length > 0) {
    const titleLine: Segment[] = [];
    let order = 0;
    titles.forEach((title, index) => {
      titleLine.push({
        id: `contact-title-${index}`,
        order: order++,
        type: "contact",
        text: title,
      });

      if (index < titles.length - 1) {
        titleLine.push({
          id: `contact-title-separator-${index}`,
          order: order++,
          type: "separator",
          variant: "sub-header",
          text: " | ",
        });
      }
    });
    lines.push(titleLine);
  }

  const location = data.contactInfo?.location?.trim();
  const phone = data.contactInfo?.phone?.trim();
  const email = data.contactInfo?.email?.trim();

  const contactValues = [location, phone, email].filter(
    (value): value is string => Boolean(value && value.length > 0),
  );

  if (contactValues.length > 0) {
    const contactLine: Segment[] = [];
    let order = 0;
    contactValues.forEach((value, index) => {
      contactLine.push({
        id: `contact-info-${index}`,
        order: order++,
        type: "contact",
        text: value,
      });

      if (index < contactValues.length - 1) {
        contactLine.push({
          id: `contact-info-separator-${index}`,
          order: order++,
          type: "separator",
          variant: "sub-header",
          text: " | ",
        });
      }
    });
    lines.push(contactLine);
  }

  const links = (data.links ?? [])
    .map((link) => ({
      text: link.text?.trim() ?? "",
      url: link.url?.trim() ?? "",
    }))
    .filter((link) => link.text.length > 0);

  if (links.length > 0) {
    const linksLine: Segment[] = [];
    let order = 0;
    links.forEach((link, index) => {
      linksLine.push({
        id: `contact-link-${index}`,
        order: order++,
        type: "link",
        text: link.text,
        url: link.url,
      });

      if (index < links.length - 1) {
        linksLine.push({
          id: `contact-link-separator-${index}`,
          order: order++,
          type: "separator",
          variant: "sub-header",
          text: " | ",
        });
      }
    });
    lines.push(linksLine);
  }

  return {
    type: "section",
    title: "Contact",
    lines,
  };
}