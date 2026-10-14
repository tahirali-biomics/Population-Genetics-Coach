import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const out = path.resolve('node_modules/.tmp/phase4-attempt.mjs');
await build({ entryPoints: ['src/assessmentAttempt.ts'], outfile: out, bundle: true, platform: 'node', format: 'esm' });
const api = await import(out);
const { createAssessmentDraft, chooseDisplayedOption, chooseTruthValue, completeAssessmentDraft,
  draftStorageKey, persistAssessmentDraft, readAssessmentDraft, readCompletedDrafts,
  recordedDraft, reviewAssessment, displayedQuestions, storedPresentation, PRESENTATION_KEY } = api;
const course = JSON.parse(fs.readFileSync('src/courseData.json', 'utf8'));
const bank = course.lessons[0].assessment;
class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
}
const identity = bound => bound - 1;
const rotate = () => 0;

test('attempt identity and independent option/question permutations differ without changing scientific keys', () => {
  const before = JSON.stringify(bank);
  const a = createAssessmentDraft(bank, identity), b = createAssessmentDraft(bank, rotate);
  assert.notEqual(a.presentation.attemptId, b.presentation.attemptId);
  assert.notDeepEqual(a.presentation.questionOrder, b.presentation.questionOrder);
  for (const q of bank.filter(q => q.type === 'mcq')) assert.notDeepEqual(a.presentation.optionOrder[q.id], b.presentation.optionOrder[q.id]);
  assert.equal(JSON.stringify(bank), before);
  assert.deepEqual(b.presentation.questions, bank);
  const firstTF = createAssessmentDraft(bank, bound => bound === bank.length ? 0 : bound - 1);
  assert.equal(displayedQuestions(a.presentation)[0].type, 'mcq');
  assert.equal(displayedQuestions(firstTF.presentation)[0].type, 'tf');
  assert.deepEqual(firstTF.presentation.questions.filter(q => q.type === 'tf').map(q => q.answer), bank.filter(q => q.type === 'tf').map(q => q.answer));
});

test('refresh/resume round-trips exact identity, order, selected canonical answers and grading', () => {
  const storage = new MemoryStorage(), key = draftStorageKey('student-a', 'lecture');
  let draft = createAssessmentDraft(bank, rotate);
  persistAssessmentDraft(storage, key, draft, true);
  const q = bank[0], slot = draft.presentation.optionOrder[q.id].indexOf(q.answer);
  draft = chooseDisplayedOption(draft, q.id, slot);
  draft = chooseTruthValue(draft, bank.find(q => q.type === 'tf').id, false);
  persistAssessmentDraft(storage, key, draft);
  const json = storage.getItem(key);
  const resumed = readAssessmentDraft(storage, key);
  assert.deepEqual(resumed, draft);
  assert.equal(resumed.answers[q.id], q.answer);
  assert.equal(storage.getItem(key), json); // Read/refresh never starts or mutates an attempt.
  assert.equal(readAssessmentDraft(storage, draftStorageKey('student-b', 'lecture')), undefined);
  assert.equal(readAssessmentDraft(storage, draftStorageKey('student-a', 'another-lesson')), undefined);
});

test('MCQ grading maps display indices to canonical indices; TF truth values never flip', () => {
  for (const lesson of course.lessons) {
    let draft = createAssessmentDraft(lesson.assessment, rotate);
    for (const q of displayedQuestions(draft.presentation)) {
      draft = q.type === 'mcq'
        ? chooseDisplayedOption(draft, q.id, draft.presentation.optionOrder[q.id].indexOf(q.answer))
        : chooseTruthValue(draft, q.id, q.answer);
    }
    const completed = completeAssessmentDraft(draft);
    assert.equal(completed.score, lesson.assessment.length);
    assert.throws(() => chooseTruthValue(completed, lesson.assessment.find(q => q.type === 'tf').id, true));
    assert.throws(() => completeAssessmentDraft(completed));
    const tf = lesson.assessment.find(q => q.type === 'tf');
    const wrong = chooseTruthValue(createAssessmentDraft(lesson.assessment, identity), tf.id, !tf.answer);
    assert.equal(completeAssessmentDraft(wrong).score, 0);
  }
});

test('a new attempt preserves completed presentation/history and uses a new identity', () => {
  const storage = new MemoryStorage(), key = draftStorageKey('s', 'l');
  const first = createAssessmentDraft(bank, rotate);
  persistAssessmentDraft(storage, key, first, true);
  const completed = completeAssessmentDraft(chooseDisplayedOption(first, bank[0].id, 0));
  persistAssessmentDraft(storage, key, completed);
  const second = createAssessmentDraft(bank, identity);
  persistAssessmentDraft(storage, key, second, true);
  assert.deepEqual(readAssessmentDraft(storage, key), second);
  assert.deepEqual(readCompletedDrafts(storage, key), [completed]);
  const review = reviewAssessment([], recordedDraft(completed));
  assert.deepEqual(review.presentation, completed.presentation);
  assert.deepEqual(review.answers, completed.answers);
  assert.equal(review.score, completed.score);
});

test('historical canonical answers and scores are never interpreted as shuffled slot numbers', () => {
  const previous = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), score: 1, max: bank.length, answers: { [bank[0].id]: bank[0].answer } };
  const before = JSON.stringify(previous);
  const legacy = reviewAssessment(bank, previous);
  assert.deepEqual(legacy.presentation.questionOrder, bank.map(q => q.id));
  assert.deepEqual(legacy.presentation.optionOrder[bank[0].id], [0,1,2,3]);
  assert.equal(legacy.answers[bank[0].id], bank[0].answer);
  assert.equal(legacy.score, 1);
  assert.equal(JSON.stringify(previous), before);
  const old = JSON.parse(fs.readFileSync('src/assessmentArchive.json', 'utf8'))[course.lessons[0].id];
  const original = { ...previous, max: old.length, answers: { mc1: 0, tf1: true } };
  assert.equal(reviewAssessment(bank, original), undefined);
  assert.deepEqual(reviewAssessment(old, original).presentation.questions, old);
  assert.deepEqual(reviewAssessment(old, original).answers, original.answers);
});

test('snapshot review survives later bank changes and malformed metadata never falls back to new meanings', () => {
  const completed = completeAssessmentDraft(createAssessmentDraft(bank, rotate));
  const record = recordedDraft(completed), before = JSON.stringify(record);
  const changed = bank.map(q => ({ ...q, question: 'Changed future text', answer: q.type === 'tf' ? !q.answer : (q.answer + 1) % 4 }));
  const review = reviewAssessment(changed, record);
  assert.deepEqual(review.presentation, completed.presentation);
  assert.equal(review.score, record.score);
  assert.equal(JSON.stringify(record), before);
  assert.throws(() => reviewAssessment(bank, { ...record, answers: { ...record.answers, [PRESENTATION_KEY]: '{bad json' } }));
  const corrupt = structuredClone(completed.presentation);
  corrupt.optionOrder[bank[0].id] = [0,0,1,2];
  assert.throws(() => storedPresentation({ [PRESENTATION_KEY]: JSON.stringify(corrupt) }));
});

test('blocked/corrupted persistence and stale tabs fail closed without replacing an unfinished attempt', () => {
  const storage = new MemoryStorage(), key = draftStorageKey('s', 'l');
  const first = createAssessmentDraft(bank, rotate);
  persistAssessmentDraft(storage, key, first, true);
  assert.throws(() => persistAssessmentDraft(storage, key, createAssessmentDraft(bank), true));
  assert.deepEqual(readAssessmentDraft(storage, key), first);
  assert.throws(() => persistAssessmentDraft(storage, key, createAssessmentDraft(bank)));
  const latest = chooseDisplayedOption(first, bank[0].id, 0);
  persistAssessmentDraft(storage, key, latest);
  assert.throws(() => persistAssessmentDraft(storage, key, chooseDisplayedOption(first, bank[0].id, 1)));
  const before = storage.getItem(key);
  assert.throws(() => persistAssessmentDraft({ getItem: storage.getItem.bind(storage), setItem: () => { throw new Error('Quota exceeded'); } }, key, chooseDisplayedOption(latest, bank[0].id, 1)));
  assert.equal(storage.getItem(key), before);
  storage.setItem(key, 'invalid');
  assert.throws(() => readAssessmentDraft(storage, key));
  assert.throws(() => persistAssessmentDraft(storage, key, first, true));
  assert.equal(storage.getItem(key), 'invalid');
});

test('actual quiz and history rendering preserve saved order, selected options and read-only completion', async () => {
  const output = path.resolve('node_modules/.tmp/phase4-render.mjs');
  await build({ stdin: { contents: `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {AssessmentQuiz} from './src/AssessmentQuiz'; import {AssessmentHistory} from './src/AssessmentHistory'; export const quiz=props=>renderToStaticMarkup(React.createElement(AssessmentQuiz,props)); export const history=props=>renderToStaticMarkup(React.createElement(AssessmentHistory,props));`, resolveDir: process.cwd(), loader: 'tsx' }, outfile: output, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
  const render = await import(output);
  const storage = new MemoryStorage(), key = draftStorageKey('s', course.lessons[0].id);
  let draft = createAssessmentDraft(bank, rotate);
  persistAssessmentDraft(storage, key, draft, true);
  draft = chooseDisplayedOption(draft, bank[0].id, 0);
  persistAssessmentDraft(storage, key, draft);
  const oldStorage = globalThis.localStorage;
  try {
    globalThis.localStorage = storage;
    const props = { questions: bank, lessonId: course.lessons[0].id, userId: 's', onSubmit() {} };
    const html = render.quiz(props);
    assert.deepEqual([...html.matchAll(/data-question-id="([^"]+)"/g)].map(m => m[1]), draft.presentation.questionOrder);
    assert(html.includes('checked=""')); assert(html.includes('Submit and record attempt'));
    const firstMCQ = html.slice(html.indexOf(`data-question-id="${bank[0].id}"`));
    const offsets = draft.presentation.optionOrder[bank[0].id].map(canonical => firstMCQ.indexOf(bank[0].options[canonical]));
    assert(offsets.every((offset, index) => offset >= 0 && (index === 0 || offset > offsets[index - 1])));
    assert.equal(render.quiz(props), html); // A fresh component mount sees exactly the saved presentation.
    const complete = completeAssessmentDraft(draft);
    persistAssessmentDraft(storage, key, complete);
    const completedHTML = render.quiz(props);
    assert(completedHTML.includes('Submitted attempt — read-only.'));
    assert(completedHTML.includes('Start a new attempt'));
    assert(!completedHTML.includes('Submit and record attempt'));
    const historyHTML = render.history({ ...props, attempt: recordedDraft(complete) });
    const ordered = displayedQuestions(complete.presentation).map(q => q.question);
    assert(historyHTML.includes('recorded score and denominator are preserved'));
    assert(historyHTML.indexOf(ordered[0]) < historyHTML.indexOf(ordered[1]));
    const archive = JSON.parse(fs.readFileSync('src/assessmentArchive.json', 'utf8'))[course.lessons[0].id];
    const legacy = { id: crypto.randomUUID(), score: 1, max: 10, answers: { mc1: 0, tf1: true }, createdAt: new Date().toISOString() };
    const oldHTML = render.history({ ...props, attempt: legacy });
    assert(oldHTML.includes('1/10')); assert(oldHTML.includes(archive[0].options[0]));
    assert(oldHTML.indexOf(archive[0].question) < oldHTML.indexOf(archive[1].question));
    const blocked = render.quiz({ ...props, userId: 'blocked' }); // Ordinary mount creates no new attempt.
    assert(blocked.includes('Start assessment')); assert.equal(storage.getItem(draftStorageKey('blocked', props.lessonId)), null);
  } finally { if (oldStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = oldStorage; }
});
