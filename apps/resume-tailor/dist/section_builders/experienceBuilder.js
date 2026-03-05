export function buildExperienceSection(data) {
    const lines = [];
    let previousSectionHeader = "";
    data.experiences.forEach((experience, experienceIndex) => {
        const sectionHeader = experience.sectionHeader?.trim() ?? "";
        if (sectionHeader.length > 0 && sectionHeader !== previousSectionHeader) {
            lines.push([
                {
                    id: `experience-section-header-${experienceIndex}`,
                    order: 0,
                    type: "section-header",
                    text: sectionHeader,
                },
            ]);
            previousSectionHeader = sectionHeader;
        }
        const entryHeaderLine = buildEntryHeaderLine(experience, experienceIndex);
        if (entryHeaderLine.length > 0) {
            lines.push(entryHeaderLine);
        }
        const skillsLine = buildSkillsLine(experience, experienceIndex);
        if (skillsLine.length > 0) {
            lines.push(skillsLine);
        }
        const responsibilityLines = buildResponsibilityLines(experience, experienceIndex);
        if (responsibilityLines.length > 0) {
            lines.push(...responsibilityLines);
        }
        if (experienceIndex < data.experiences.length - 1) {
            lines.push([
                {
                    id: `experience-spacer-${experienceIndex}`,
                    order: 0,
                    type: "text",
                    text: "",
                },
            ]);
        }
    });
    return {
        type: "section",
        title: data.title ?? "Experience",
        lines,
    };
}
function buildEntryHeaderLine(experience, experienceIndex) {
    const position = experience.position?.trim() ?? "";
    const company = experience.company?.trim() ?? "";
    const website = experience.website?.trim() ?? "";
    const project = experience.project?.trim() ?? "";
    const dateRange = experience.dateRange?.trim() ?? "";
    const line = [];
    let order = 0;
    const hasProfessionalHeader = position.length > 0 || company.length > 0 || website.length > 0;
    if (hasProfessionalHeader) {
        if (position.length > 0) {
            line.push({
                id: `experience-position-${experienceIndex}`,
                order: order++,
                type: "sub-header",
                text: position,
            });
        }
        if (company.length > 0) {
            if (line.length > 0) {
                line.push({
                    id: `experience-position-company-separator-${experienceIndex}`,
                    order: order++,
                    type: "separator",
                    variant: "sub-header",
                    text: " | ",
                });
            }
            line.push({
                id: `experience-company-${experienceIndex}`,
                order: order++,
                type: "sub-header",
                text: company,
            });
        }
        if (website.length > 0) {
            if (line.length > 0) {
                line.push({
                    id: `experience-company-website-separator-${experienceIndex}`,
                    order: order++,
                    type: "separator",
                    variant: "sub-header",
                    text: " | ",
                });
            }
            line.push({
                id: `experience-website-${experienceIndex}`,
                order: order++,
                type: "url",
                text: website,
                url: website,
            });
        }
    }
    else if (project.length > 0) {
        line.push({
            id: `experience-project-${experienceIndex}`,
            order: order++,
            type: "sub-header",
            text: project,
        });
    }
    if (dateRange.length > 0) {
        if (line.length > 0) {
            line.push({
                id: `experience-date-separator-${experienceIndex}`,
                order: order++,
                type: "text",
                text: " ",
            });
        }
        line.push({
            id: `experience-date-range-${experienceIndex}`,
            order: order++,
            type: "date-range",
            text: dateRange,
        });
    }
    return line;
}
function buildSkillsLine(experience, experienceIndex) {
    const skills = (experience.skills ?? [])
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    const line = [];
    let order = 0;
    skills.forEach((skill, skillIndex) => {
        line.push({
            id: `experience-skill-${experienceIndex}-${skillIndex}`,
            order: order++,
            type: "skill",
            text: skill,
        });
        if (skillIndex < skills.length - 1) {
            line.push({
                id: `experience-skill-separator-${experienceIndex}-${skillIndex}`,
                order: order++,
                type: "separator",
                variant: "skill",
                text: " | ",
            });
        }
    });
    return line;
}
function buildResponsibilityLines(experience, experienceIndex) {
    return (experience.responsibilities ?? [])
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value, responsibilityIndex) => [
        {
            id: `experience-responsibility-${experienceIndex}-${responsibilityIndex}`,
            order: 0,
            type: "text",
            text: ` •  ${value}`,
        },
    ]);
}
//# sourceMappingURL=experienceBuilder.js.map