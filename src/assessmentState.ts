type Question = { id: string; type: "mcq" | "tf"; options?: string[]; answer: number | boolean };
export type StoredAnswers = Record<string, number | boolean | string>;
type Previous = { answers: StoredAnswers; score: number; max: number };

/** Metadata remains inside the existing answers JSON; no schema or old-record change. */
export function assessmentBankMarker(questions: Question[]): string {
  return `__question_set:${questions.map((question) => question.id).join("|")}`;
}

export function scoreAssessment(questions: Question[], answers: StoredAnswers): number {
  return questions.reduce((score, question) => score + Number(answers[question.id] === question.answer), 0);
}

/** Never display a historical score as a score on a different question bank. */
export function assessmentInitialState(questions: Question[], previous?: Previous) {
  if (!previous) return { answers: {} as Record<string, number | boolean>, result: undefined as number | undefined, compatible: false };
  const ids = new Set(questions.map((q) => q.id));
  const marker = assessmentBankMarker(questions);
  const keys = Object.keys(previous.answers);
  const hasBank = previous.answers[marker] === true;
  const compatible = previous.max === questions.length && (hasBank || keys.some((id) => ids.has(id))) &&
    keys.every((id) => ids.has(id) || (id === marker && hasBank)) &&
    questions.every((q) => {
      const answer = previous.answers[q.id];
      return answer === undefined || (q.type === "tf" ? typeof answer === "boolean" :
        typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer < (q.options?.length ?? 0));
    });
  return { answers: compatible ? Object.fromEntries(Object.entries(previous.answers).filter(([id]) => ids.has(id))) as Record<string, number | boolean> : {}, result: compatible ? previous.score : undefined, compatible };
}
