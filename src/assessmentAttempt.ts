import type { AssessmentQuestion } from './data';
import { assessmentBankMarker, assessmentInitialState, scoreAssessment } from './assessmentState';
import type { StoredAnswers } from './assessmentState';

export const PRESENTATION_KEY = '__assessment_presentation_v1';
export type SelectedAnswers = Record<string, number | boolean>;
export type Presentation = {
  version: 1;
  attemptId: string;
  createdAt: string;
  questions: AssessmentQuestion[]; // Canonical bank snapshot, including grading keys.
  questionOrder: string[];
  optionOrder: Record<string, number[]>; // Display slot -> canonical option index.
};
export type AssessmentDraft = {
  presentation: Presentation;
  answers: SelectedAnswers;
  revision: number;
  status: 'draft' | 'completed';
  submittedAt?: string;
  score?: number;
};
export type RecordedAssessment = {
  id: string;
  answers: StoredAnswers;
  score: number;
  max: number;
  createdAt: string;
};
export type DraftStorage = Pick<Storage, 'getItem' | 'setItem'>;
type LocalSession = { active: AssessmentDraft; completed: AssessmentDraft[] };

/** Unbiased bounded integers from per-browser cryptographic entropy; no shared seed. */
function randomIndex(bound: number): number {
  const range = 0x100000000;
  const limit = range - range % bound;
  const bytes = new Uint32Array(1);
  do { crypto.getRandomValues(bytes); } while (bytes[0] >= limit);
  return bytes[0] % bound;
}

function shuffled<T>(items: T[], pick: (bound: number) => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    if (!Number.isInteger(j) || j < 0 || j > i) throw new Error('Invalid random index');
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createAssessmentDraft(questions: AssessmentQuestion[], pick = randomIndex): AssessmentDraft {
  const snapshot: AssessmentQuestion[] = JSON.parse(JSON.stringify(questions));
  const draft: AssessmentDraft = {
    presentation: {
      version: 1, attemptId: crypto.randomUUID(), createdAt: new Date().toISOString(),
      questions: snapshot,
      questionOrder: shuffled(snapshot.map(q => q.id), pick),
      optionOrder: Object.fromEntries(snapshot.filter(q => q.type === 'mcq').map(q =>
        [q.id, shuffled(q.options!.map((_, index) => index), pick)])),
    },
    answers: {}, revision: 0, status: 'draft',
  };
  if (!validDraft(draft)) throw new Error('Invalid assessment bank');
  return draft;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function permutation(values: unknown, expected: (number | string)[]): boolean {
  return Array.isArray(values) && values.length === expected.length && new Set(values).size === values.length &&
    values.every(value => expected.includes(value));
}
export function validPresentation(value: unknown): value is Presentation {
  if (!isRecord(value) || value.version !== 1 || typeof value.attemptId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.attemptId) ||
    typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt)) ||
    !Array.isArray(value.questions) || !value.questions.length || !isRecord(value.optionOrder)) return false;
  const questions = value.questions;
  if (!questions.every(q => isRecord(q) && typeof q.id === 'string' && !q.id.startsWith('__') &&
    typeof q.question === 'string' && typeof q.explanation === 'string' &&
    (q.type === 'tf' ? typeof q.answer === 'boolean' : q.type === 'mcq' && Array.isArray(q.options) &&
      q.options.length >= 2 && q.options.every(o => typeof o === 'string') &&
      typeof q.answer === 'number' && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length))) return false;
  const ids = questions.map(q => q.id);
  if (new Set(ids).size !== ids.length || !permutation(value.questionOrder, ids)) return false;
  const orders = value.optionOrder;
  const mcqs = questions.filter(q => q.type === 'mcq');
  return Object.keys(orders).length === mcqs.length && mcqs.every(q =>
    permutation(orders[q.id], q.options.map((_: string, index: number) => index)));
}

function validAnswers(presentation: Presentation, answers: unknown): answers is SelectedAnswers {
  if (!isRecord(answers)) return false;
  return Object.entries(answers).every(([id, answer]) => {
    const q = presentation.questions.find(item => item.id === id);
    return q && (q.type === 'tf' ? typeof answer === 'boolean' :
      typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < q.options!.length);
  });
}
export function validDraft(value: unknown): value is AssessmentDraft {
  if (!isRecord(value) || !validPresentation(value.presentation) || !validAnswers(value.presentation, value.answers) ||
    typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0) return false;
  if (value.status === 'draft') return value.score === undefined && value.submittedAt === undefined;
  return value.status === 'completed' && typeof value.submittedAt === 'string' && Number.isFinite(Date.parse(value.submittedAt)) &&
    value.score === scoreAssessment(value.presentation.questions, value.answers);
}

export function draftStorageKey(userId: string, lessonId: string): string {
  return `pg-assessment-attempt-v1:${encodeURIComponent(userId)}:${encodeURIComponent(lessonId)}`;
}
function readSession(storage: DraftStorage, key: string): LocalSession | undefined {
  const raw = storage.getItem(key);
  if (raw === null) return undefined;
  const value: unknown = JSON.parse(raw);
  // Accept a standalone draft if an earlier development build stored one.
  if (validDraft(value)) return { active: value, completed: value.status === 'completed' ? [value] : [] };
  if (!isRecord(value) || !validDraft(value.active) || !Array.isArray(value.completed) ||
    !value.completed.every(item => validDraft(item) && item.status === 'completed')) {
    throw new Error('The saved assessment could not be validated. It has not been replaced.');
  }
  return value as LocalSession;
}
export function readAssessmentDraft(storage: DraftStorage, key: string): AssessmentDraft | undefined {
  return readSession(storage, key)?.active;
}
export function readCompletedDrafts(storage: DraftStorage, key: string): AssessmentDraft[] {
  return readSession(storage, key)?.completed ?? [];
}
export function recordedDraft(draft: AssessmentDraft): RecordedAssessment {
  if (draft.status !== 'completed') throw new Error('Unfinished attempt is not a recorded score');
  return { id: draft.presentation.attemptId, answers: storedAssessmentAnswers(draft), score: draft.score!, max: draft.presentation.questions.length, createdAt: draft.submittedAt! };
}
export function persistAssessmentDraft(storage: DraftStorage, key: string, draft: AssessmentDraft, startNew = false): void {
  if (!validDraft(draft)) throw new Error('Invalid assessment attempt');
  const session = readSession(storage, key);
  const existing = session?.active;
  if (existing && !startNew && (existing.presentation.attemptId !== draft.presentation.attemptId ||
    JSON.stringify(existing.presentation) !== JSON.stringify(draft.presentation) || existing.status === 'completed' ||
    draft.revision <= existing.revision)) {
    throw new Error('This attempt changed in another tab. Refresh to resume its saved presentation.');
  }
  if (existing?.status === 'draft' && startNew) throw new Error('Resume the existing unfinished attempt before starting another.');
  const completed = session?.completed ?? [];
  const saved = JSON.stringify({ active: draft, completed: draft.status === 'completed'
    ? [...completed.filter(item => item.presentation.attemptId !== draft.presentation.attemptId), draft] : completed });
  storage.setItem(key, saved); // One synchronous session+journal write before UI or grading changes.
  if (storage.getItem(key) !== saved) throw new Error('The assessment could not be saved.');
}

export function displayedQuestions(presentation: Presentation): AssessmentQuestion[] {
  return presentation.questionOrder.map(id => presentation.questions.find(q => q.id === id)!);
}
export function chooseDisplayedOption(draft: AssessmentDraft, id: string, slot: number): AssessmentDraft {
  if (draft.status !== 'draft') throw new Error('Completed attempts are read-only');
  const q = draft.presentation.questions.find(item => item.id === id);
  const canonical = draft.presentation.optionOrder[id]?.[slot];
  if (q?.type !== 'mcq' || !Number.isInteger(slot) || canonical === undefined) throw new Error('Invalid displayed option');
  return { ...draft, revision: draft.revision + 1, answers: { ...draft.answers, [id]: canonical } };
}
export function chooseTruthValue(draft: AssessmentDraft, id: string, answer: boolean): AssessmentDraft {
  if (draft.status !== 'draft' || draft.presentation.questions.find(q => q.id === id)?.type !== 'tf' || typeof answer !== 'boolean') {
    throw new Error('Invalid True/False response');
  }
  return { ...draft, revision: draft.revision + 1, answers: { ...draft.answers, [id]: answer } };
}
export function completeAssessmentDraft(draft: AssessmentDraft): AssessmentDraft {
  if (draft.status !== 'draft') throw new Error('Attempt already submitted');
  return { ...draft, revision: draft.revision + 1, status: 'completed', submittedAt: new Date().toISOString(), score: scoreAssessment(draft.presentation.questions, draft.answers) };
}
export function storedAssessmentAnswers(draft: AssessmentDraft): StoredAnswers {
  return {
    ...draft.answers,
    [assessmentBankMarker(draft.presentation.questions)]: true,
    [PRESENTATION_KEY]: JSON.stringify(draft.presentation),
  };
}
export function storedPresentation(answers: StoredAnswers): Presentation | undefined {
  if (!(PRESENTATION_KEY in answers)) return undefined;
  const raw = answers[PRESENTATION_KEY];
  if (typeof raw !== 'string') throw new Error('Invalid stored presentation');
  const parsed: unknown = JSON.parse(raw);
  if (!validPresentation(parsed)) throw new Error('Invalid stored presentation');
  return parsed;
}

/** Never infer a permutation for a record that did not store one. */
export function reviewAssessment(questions: AssessmentQuestion[], previous: RecordedAssessment): AssessmentDraft | undefined {
  const saved = storedPresentation(previous.answers);
  if (saved) {
    const answers = Object.fromEntries(saved.questions.filter(q => q.id in previous.answers).map(q => [q.id, previous.answers[q.id]]));
    if (previous.max !== saved.questions.length || !validAnswers(saved, answers)) throw new Error('Invalid stored answers');
    // Use the original recorded score, never rescore history against current content.
    return { presentation: saved, answers, revision: 0, status: 'completed', submittedAt: previous.createdAt, score: previous.score };
  }
  const legacy = assessmentInitialState(questions, previous);
  if (!legacy.compatible) return undefined;
  return {
    presentation: {
      version: 1, attemptId: previous.id, createdAt: previous.createdAt,
      questions: JSON.parse(JSON.stringify(questions)), questionOrder: questions.map(q => q.id),
      optionOrder: Object.fromEntries(questions.filter(q => q.type === 'mcq').map(q => [q.id, q.options!.map((_, i) => i)])),
    },
    answers: legacy.answers, revision: 0, status: 'completed', submittedAt: previous.createdAt, score: previous.score,
  };
}
