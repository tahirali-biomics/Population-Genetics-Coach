import { useRef, useState } from 'react';
import type { AssessmentQuestion } from './data';
import { LessonContent } from './LessonContent';
import { AssessmentHistory } from './AssessmentHistory';
import {
  chooseDisplayedOption, chooseTruthValue, completeAssessmentDraft, createAssessmentDraft,
  displayedQuestions, draftStorageKey, persistAssessmentDraft, readAssessmentDraft, readCompletedDrafts, recordedDraft, reviewAssessment,
} from './assessmentAttempt';
import type { AssessmentDraft, RecordedAssessment } from './assessmentAttempt';

export function AssessmentQuiz({ questions, lessonId, userId, previous, history = [], onSubmit }: {
  questions: AssessmentQuestion[];
  lessonId: string;
  userId: string;
  previous?: RecordedAssessment;
  history?: RecordedAssessment[];
  onSubmit: (attempt: AssessmentDraft) => void;
}) {
  const key = draftStorageKey(userId, lessonId);
  const [loaded] = useState(() => {
    try { return { draft: readAssessmentDraft(localStorage, key), completed: readCompletedDrafts(localStorage, key), error: '' }; }
    catch { return { draft: undefined, completed: [] as AssessmentDraft[], error: 'Saved assessment storage is unavailable or invalid. Reload after restoring browser storage; the saved attempt has not been replaced.' }; }
  });
  const [draft, setDraft] = useState<AssessmentDraft | undefined>(loaded.draft);
  const [error, setError] = useState(loaded.error);
  const [localHistory, setLocalHistory] = useState(loaded.completed);
  const submitting = useRef(false);
  let prior: AssessmentDraft | undefined;
  let invalidHistory = false;
  try { prior = previous ? reviewAssessment(questions, previous) : undefined; }
  catch { invalidHistory = true; }
  const active = draft ?? prior;
  const completed = active?.status === 'completed';

  function start() {
    try {
      const next = createAssessmentDraft(questions);
      persistAssessmentDraft(localStorage, key, next, true);
      submitting.current = false;
      setDraft(next);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save the new attempt.'); }
  }
  function save(next: AssessmentDraft) {
    try {
      persistAssessmentDraft(localStorage, key, next);
      setDraft(next);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save your answer.'); }
  }
  function submit() {
    if (!draft || draft.status !== 'draft' || submitting.current) return;
    submitting.current = true;
    try {
      const next = completeAssessmentDraft(draft);
      persistAssessmentDraft(localStorage, key, next);
      setDraft(next);
      setLocalHistory(readCompletedDrafts(localStorage, key));
      onSubmit(next);
      setError('');
    } catch (e) {
      submitting.current = false;
      setError(e instanceof Error ? e.message : 'Unable to record this attempt.');
    }
  }

  const shown = active ? displayedQuestions(active.presentation) : [];
  const bank = active?.presentation.questions ?? questions;
  const allHistory = [...new Map([...history, ...localHistory.map(recordedDraft)].map(item => [item.id, item])).values()];
  return (
    <>
    <section className="panel glass assessment">
      <small>OBJECTIVE SELF-ASSESSMENT</small>
      <h2>{bank.filter(q => q.type === 'mcq').length} multiple choice + {bank.filter(q => q.type === 'tf').length} true/false</h2>
      {error && <p role="alert">{error}</p>}
      {(invalidHistory || (previous && !prior)) && <p>Your previous score is preserved in the recorded-attempt review below. Its answers are not applied to this question set.</p>}
      {!active && <p>Start an attempt to save its question and option order. Refreshing will resume that attempt.</p>}
      {active && <p>{completed ? 'Submitted attempt — read-only.' : 'Answers and presentation are saved in this browser as you work.'}</p>}
      {shown.map((q, i) => (
        <div className="question" key={q.id} data-question-id={q.id}>
          <div className="question-prompt"><b>Question {i + 1}</b><LessonContent text={q.question} /></div>
          {q.type === 'mcq' ? (
            <div className="options">
              {active!.presentation.optionOrder[q.id].map((canonical, slot) => (
                <label key={canonical}>
                  <input type="radio" name={`${active!.presentation.attemptId}:${q.id}`}
                    checked={active!.answers[q.id] === canonical} disabled={completed || Boolean(error)}
                    onChange={() => save(chooseDisplayedOption(draft!, q.id, slot))} />
                  <LessonContent text={q.options![canonical]} inline />
                </label>
              ))}
            </div>
          ) : (
            <div className="tf">
              {[true, false].map(value => (
                <button key={String(value)} disabled={completed || Boolean(error)}
                  className={active!.answers[q.id] === value ? 'selected' : ''}
                  onClick={() => save(chooseTruthValue(draft!, q.id, value))}>{value ? 'True' : 'False'}</button>
              ))}
            </div>
          )}
          {completed && (
            <div className={active!.answers[q.id] === q.answer ? 'explain right' : 'explain wrong'}>
              {active!.answers[q.id] === q.answer ? '✓ ' : 'Review: '}<LessonContent text={q.explanation} />
            </div>
          )}
        </div>
      ))}
      {active && !completed ? (
        <button className="primary full" disabled={Boolean(error)} onClick={submit}>Submit and record attempt</button>
      ) : (
        <button className="primary full" disabled={Boolean(loaded.error)} onClick={start}>{active || previous ? 'Start a new attempt' : 'Start assessment'}</button>
      )}
      {completed && <div className="score-card"><b>{active.score}/{active.presentation.questions.length}</b><span>{Math.round((active.score! / active.presentation.questions.length) * 100)}%</span></div>}
    </section>
    {allHistory.map(attempt => <AssessmentHistory key={attempt.id} lessonId={lessonId} questions={questions} attempt={attempt} />)}
    </>
  );
}
