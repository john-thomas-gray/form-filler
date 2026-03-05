export function buildSkillsSection(data) {
    const { title, categories, listingSkills } = data;
    const normalizedCategories = categories.map(normalizeCategory);
    setMatchedAndUnmatchedSkills(normalizedCategories, listingSkills);
    const resolvedTitle = title ?? "Skills";
    return {
        type: "section",
        title: resolvedTitle,
        lines: buildSkillsLines(normalizedCategories, resolvedTitle),
    };
}
function buildSkillsLines(categories, title) {
    const lines = [
        [
            {
                id: "skills-section-header",
                order: 0,
                type: "section-header",
                text: title,
            },
        ],
    ];
    return lines.concat(categories.map((category) => {
        const { id: categoryId, order: categoryOrder, name: categoryName, matchedSkills, unmatchedSkills, } = category;
        const line = [];
        // Category label
        line.push({
            id: categoryId,
            order: categoryOrder,
            type: "category",
            text: categoryName,
        });
        // Pipe separator after category
        line.push({
            id: `separator-${categoryId}-pipe`,
            order: categoryOrder + 1,
            type: "separator",
            variant: "skill",
            text: " | ",
        });
        let currentOrder = categoryOrder + 2;
        const allSkills = [...matchedSkills, ...unmatchedSkills];
        allSkills.forEach((skill, index) => {
            line.push({
                id: skill.id,
                order: currentOrder++,
                type: "skill",
                text: skill.text,
            });
            // Add comma separator between skills, not after last
            if (index < allSkills.length - 1) {
                line.push({
                    id: `separator-${categoryId}-comma-${index}`,
                    order: currentOrder++,
                    type: "separator",
                    variant: "skill",
                    text: ", ",
                });
            }
        });
        return line;
    }));
}
function normalizeCategory(category) {
    return {
        id: category.id,
        order: category.order,
        name: category.name,
        type: "normalized-category",
        matchedSkills: [],
        unmatchedSkills: normalizeSkills(category.skills),
    };
}
function normalizeSkills(skills) {
    return skills.map((skill) => {
        const id = `skill-${skill.trim().toLowerCase().replace(/ /g, "-")}`;
        const order = skills.indexOf(skill);
        return {
            id,
            order,
            type: "skill",
            text: skill.trim(),
        };
    });
}
function setMatchedAndUnmatchedSkills(normalizedCategories, listingSkills) {
    for (const category of normalizedCategories) {
        category.matchedSkills = category.unmatchedSkills.filter((skill) => listingSkills.includes(skill.text));
        category.unmatchedSkills = category.unmatchedSkills.filter((skill) => !listingSkills.includes(skill.text));
    }
    const matchedSkills = normalizedCategories.flatMap((category) => category.matchedSkills);
    const unmatchedSkills = normalizedCategories.flatMap((category) => category.unmatchedSkills);
    return { matchedSkills, unmatchedSkills };
}
//# sourceMappingURL=skillsBuilder.js.map