const COLORS = {
    default: "#ffffff",
    highlight: "#d9ead3",
    highlightDark: "#b3d3a5",
};
const segmentStyle = {
    name: {
        fontColor: COLORS.default,
        fontSize: 24,
        fontStyle: ["bold", "capitalize"],
        textAlign: "right",
    },
    contact: { fontColor: COLORS.default, fontSize: 10, fontStyle: ["normal"] },
    link: {
        fontColor: COLORS.highlight,
        fontSize: 10,
        fontStyle: ["normal", "underline", "capitalize"],
    },
    url: {
        fontColor: COLORS.highlightDark,
        fontSize: 10,
        fontStyle: ["bold", "lowercase"],
    },
    category: {
        fontColor: COLORS.highlight,
        fontSize: 10,
        fontStyle: ["italic", "capitalize"],
    },
    skill: {
        fontColor: COLORS.default,
        fontSize: 10,
        fontStyle: ["normal", "capitalize"],
    },
    "section-header": {
        fontColor: COLORS.highlight,
        fontSize: 12,
        fontStyle: ["bold", "uppercase", "underline"],
    },
    "sub-header": {
        fontColor: COLORS.highlightDark,
        fontSize: 10,
        fontStyle: ["bold", "capitalize"],
    },
    text: { fontColor: COLORS.default, fontSize: 9, fontStyle: ["normal"] },
    "date-range": {
        fontColor: COLORS.highlight,
        fontSize: 9,
        fontStyle: ["italic", "capitalize"],
    },
    "education-institution": {
        fontColor: COLORS.highlightDark,
        fontSize: 9,
        fontStyle: ["bold", "capitalize"],
    },
    "education-credential": {
        fontColor: COLORS.highlight,
        fontSize: 9,
        fontStyle: ["bold", "capitalize"],
    },
    "education-separator": {
        fontColor: COLORS.highlight,
        fontSize: 9,
        fontStyle: ["bold"],
    },
    separator: {
        fontColor: COLORS.highlight,
        fontSize: 10,
        fontStyle: ["normal"],
    },
};
export function formatSegment(segment) {
    const style = segmentStyle[segment.type];
    return {
        text: segment.text,
        fontColor: style.fontColor,
        fontSize: style.fontSize,
        fontStyle: style.fontStyle,
        textAlign: style.textAlign,
    };
}
//# sourceMappingURL=formatSegment.js.map