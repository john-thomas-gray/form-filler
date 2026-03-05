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
    const title = data.title ?? "Education";
    const { educationSegments } = data;
    const lines = [
        [
            {
                id: "education-section-header",
                order: 0,
                type: "section-header",
                text: title,
            },
        ],
        ...educationSegments.map(buildEducationLine),
    ];
    return {
        type: "section",
        title,
        lines,
    };
}
//# sourceMappingURL=educationBuilder.js.map