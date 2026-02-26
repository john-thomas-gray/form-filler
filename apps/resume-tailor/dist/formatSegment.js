const segmentStyle = {
  name: {
    fontColor: "#d9ead3",
    fontSize: 24,
    fontStyle: ["bold", "capitalize"],
    textAlign: "right",
  },
  contact: { fontColor: "#ffffff", fontSize: 10, fontStyle: ["normal"] },
  link: {
    fontColor: "#d9ead3",
    fontSize: 10,
    fontStyle: ["normal", "underline", "capitalize"],
  },
  url: { fontColor: "#b3d3a5", fontSize: 10, fontStyle: ["bold", "lowercase"] },
  category: {
    fontColor: "#b3d3a5",
    fontSize: 12,
    fontStyle: ["italic", "capitalize"],
  },
  skill: {
    fontColor: "#ffffff",
    fontSize: 10,
    fontStyle: ["normal", "capitalize"],
  },
  "section-header": {
    fontColor: "#d9ead3",
    fontSize: 12,
    fontStyle: ["bold", "uppercase"],
  },
  "sub-header": {
    fontColor: "#b3d3a5",
    fontSize: 10,
    fontStyle: ["bold", "capitalize"],
  },
  text: { fontColor: "#ffffff", fontSize: 9, fontStyle: ["normal"] },
  "date-range": {
    fontColor: "#d9ead3",
    fontSize: 9,
    fontStyle: ["italic", "capitalize"],
  },
  "education-institution": {
    fontColor: "#b3d3a5",
    fontSize: 10,
    fontStyle: ["bold", "capitalize"],
  },
  "education-credential": {
    fontColor: "#d9ead3",
    fontSize: 10,
    fontStyle: ["bold", "capitalize"],
  },
  "education-separator": {
    fontColor: "#d9ead3",
    fontSize: 10,
    fontStyle: ["bold"],
  },
  separator: { fontColor: "#d9ead3", fontSize: 10, fontStyle: ["normal"] },
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
