export function createAnswerMemory() {
    return { groups: [] };
}
function cleanText(value) {
    return value.replace(/\s+/g, " ").trim();
}
function normalizeQuestion(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[\u2019']/g, "'")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "");
}
function normalizedAnswer(value) {
    return cleanText(value).toLowerCase();
}
function shouldMergeByAnswer(answer) {
    const normalized = normalizedAnswer(answer);
    const lowInformationAnswers = new Set([
        "yes",
        "no",
        "true",
        "false",
        "n/a",
        "na",
        "none",
        "other",
        "prefer not to say",
    ]);
    return normalized.length >= 3 && !lowInformationAnswers.has(normalized);
}
function uniqueQuestions(questions) {
    const seen = new Set();
    const result = [];
    for (const question of questions) {
        const cleaned = cleanText(question);
        const key = normalizeQuestion(cleaned);
        if (!cleaned || seen.has(key))
            continue;
        seen.add(key);
        result.push(cleaned);
    }
    return result;
}
function withoutQuestion(groups, question) {
    const questionKey = normalizeQuestion(question);
    return groups
        .map((group) => ({
        ...group,
        questions: group.questions.filter((q) => normalizeQuestion(q) !== questionKey),
    }))
        .filter((group) => group.questions.length > 0);
}
function applyObservationMetadata(group, observation) {
    const next = { ...group };
    if (!next.strategy && observation.strategy) {
        next.strategy = observation.strategy;
    }
    if (!next.inputTypes && observation.inputTypes) {
        next.inputTypes = observation.inputTypes;
    }
    if (next.allowTextArea === undefined &&
        observation.allowTextArea !== undefined) {
        next.allowTextArea = observation.allowTextArea;
    }
    return next;
}
export function recordAnswer(memory, observation) {
    const question = cleanText(observation.question);
    const answer = cleanText(observation.answer);
    if (!question || !answer)
        return memory;
    const answerKey = normalizedAnswer(answer);
    const groups = withoutQuestion(memory.groups, question);
    const existing = shouldMergeByAnswer(answer)
        ? groups.find((group) => normalizedAnswer(group.answer) === answerKey)
        : undefined;
    if (existing) {
        return {
            groups: groups.map((group) => group === existing
                ? applyObservationMetadata({
                    ...group,
                    questions: uniqueQuestions([...group.questions, question]),
                }, observation)
                : group),
        };
    }
    const nextGroup = applyObservationMetadata({
        answer,
        questions: [question],
    }, observation);
    return {
        groups: [...groups, nextGroup],
    };
}
export function mergeCommunalAliases(memory, communalGroups) {
    return {
        groups: memory.groups.map((localGroup) => {
            const localQuestionKeys = new Set(localGroup.questions.map(normalizeQuestion));
            const aliases = communalGroups.flatMap((communalGroup) => {
                const matchesLocalGroup = communalGroup.questions.some((question) => localQuestionKeys.has(normalizeQuestion(question)));
                return matchesLocalGroup ? communalGroup.questions : [];
            });
            return {
                ...localGroup,
                questions: uniqueQuestions([...localGroup.questions, ...aliases]),
            };
        }),
    };
}
export function buildRulesFromMemory(memory) {
    return Object.fromEntries(memory.groups.map((group, index) => [
        `learned_${index + 1}`,
        {
            value: group.answer,
            matchers: group.questions,
            strategy: group.strategy,
            inputTypes: group.inputTypes,
            allowTextArea: group.allowTextArea,
        },
    ]));
}
