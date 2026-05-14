import type { FillStrategy, Rules } from "./index";
export type LearnedQuestionGroup = {
    answer: string;
    questions: string[];
    strategy?: FillStrategy;
    inputTypes?: string[];
    allowTextArea?: boolean;
};
export type AnswerMemory = {
    groups: LearnedQuestionGroup[];
};
export type ObservedAnswer = {
    question: string;
    answer: string;
    strategy?: FillStrategy;
    inputTypes?: string[];
    allowTextArea?: boolean;
};
export type CommunalQuestionGroup = {
    questions: string[];
};
export declare function createAnswerMemory(): AnswerMemory;
export declare function recordAnswer(memory: AnswerMemory, observation: ObservedAnswer): AnswerMemory;
export declare function mergeCommunalAliases(memory: AnswerMemory, communalGroups: CommunalQuestionGroup[]): AnswerMemory;
export declare function buildRulesFromMemory(memory: AnswerMemory): Rules;
//# sourceMappingURL=learning.d.ts.map