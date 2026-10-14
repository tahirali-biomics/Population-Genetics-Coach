# Phase 4: stable randomized assessment attempts

Implemented on `feature/lecture-content-enrichment`. This closes the Phase 3 A1 presentation cue, not the unrelated AI-heading or tutor-retrieval findings. No production records were accessed or changed; nothing was committed, pushed or deployed.

## Fixed question bank

The app has 26 fixed lesson assessment arrays containing **264 questions:160 MCQs and104 True/False items**. It has no objective-to-validated-alternatives mapping or alternate-question pool. Every new attempt uses its lesson's complete existing set. No questions were generated, replaced, rekeyed or scientifically reinterpreted. Lesson IDs/order, question IDs, canonical options and correct keys are unchanged.

## Limitation identified before implementation

Previously, unfinished answers existed only in React state; only submitted attempts were persisted. That model could not preserve an unfinished presentation across refreshes.

The minimal compatible solution, reported before implementation, is synchronous **account-and-lesson-scoped browser draft storage**, plus an immutable presentation snapshot in the existing `learning_attempts.answers` JSON on submission. No database migration or new permissions are needed.

Unfinished attempts resume in the **same browser profile and origin**, not across devices. Clearing browser data removes drafts. Denied storage, private-mode restrictions or quota exhaustion can prevent saving. The quiz refuses to start/continue when persistence fails rather than silently regenerating an attempt. A server draft service with explicit draft/completed filtering would be needed for cross-device unfinished resume. Ordinary scored rows are not used as unfinished drafts because that would affect attempt-count/score semantics.

## Attempt identity and randomization

`src/assessmentAttempt.ts` creates a draft only when the student explicitly presses **Start assessment** or **Start a new attempt**. Mounting, rerendering, refreshing and returning to a lesson do not create a new attempt.

Each attempt has a cryptographic UUID and creation timestamp. Fisher–Yates shuffles the entire question list, then independently shuffles each MCQ's option indices. Bounded random draws use `crypto.getRandomValues` with rejection sampling to avoid modulo bias. No seed is derived from shared lesson/question/account IDs or timestamps. Injectable generators are confined to deterministic tests.

MCQs and True/False items share the shuffled question list. A True/False statement retains its original truth value; buttons always mean True and False. Random draws can coincidentally repeat positions or presentations; the app removes a fixed shared pattern rather than imposing another pattern.

## Presentation, answers and grading

The immutable presentation stores the original question text, canonical options, keys and explanations; `questionOrder`; and each MCQ's `optionOrder` mapping displayed slots to canonical indices. A student clicking displayed slot B does not necessarily select canonical index1.

Selected answers remain **canonical numeric MCQ indices or actual TF booleans**. Grading uses the snapshot's keys:one point per correct answer, no credit for omission. Metadata is never scored. Each selection is written synchronously before visible state changes.

A local edit revision rejects stale sequential edits. Identity/presentation checks also reject writes after another tab replaces or submits an attempt. Browser storage is not a transactional collaboration service; simultaneous multi-tab editing is unsupported. On detected conflict, refresh resumes saved state instead of generating another attempt.

Submission makes the attempt read-only. Starting another is explicit. One session document contains the active draft and a completed-attempt journal, preserving earlier snapshots when a new attempt starts or remote synchronization fails.

## Persistence format and identity

The local storage key is `pg-assessment-attempt-v1:<encoded account ID or guest>:<encoded lesson ID>`. The document holds active/completed snapshots, canonical answers, status, revision, timestamps and score. Reads validate IDs, permutations, question/answer types and snapshot shape. Corrupted data is not overwritten.

On submission, the existing answers JSON contains canonical selected answers, the existing bank marker and **`__assessment_presentation_v1`**, whose string value is the JSON-serialized immutable presentation. `StoredAnswers` permits this string while actual responses remain numbers/booleans. No column, migration, RLS policy or coordinator query changed.

The client UUID is supplied as the new row's existing UUID `id`, aligning local, snapshot and server identity. Only a new submission uses the normal insert/progress-recording path. Double submission is guarded; refresh/review does not insert rows or increment counts. Lesson completion remains a separate toggle.

The pre-existing shared learning-state cache is not assumed to belong to a newly authenticated account. Assessment history from it is used only after the current account's remote history is loaded. Account-specific local snapshots resume independently. This guard does not change login/enrollment/role permissions or delete cached records.

## Historical compatibility

New completed attempts are reviewed using their stored presentation, original displayed option order and canonical selections. The **recorded score and denominator** are displayed without rescoring against today's bank. Future text/key changes cannot change their snapshot's interpretation.

Older attempts had no shuffle metadata because the old UI was unshuffled. Their numeric answers retain their original canonical meaning. Compatible v2 records use the canonical v2 bank; retired original records use unchanged `src/assessmentArchive.json`. No permutation is invented for legacy records; no old answers are applied to a new attempt; no historical rows are rewritten.

Where an old unversioned unanswered record cannot identify its original bank, or metadata is malformed, review preserves its score and states that presentation cannot safely be reconstructed. It does not guess at information never stored. All available completed records can be reviewed, including the local completed journal when remote sync fails.

## Regression tests and validation

`scripts/assessment-attempt.test.mjs` adds eight tests covering:

- Different attempt identities and question/option permutations, including different first-question types, without changing keys.
- Exact refresh/resume round-trip and account/lesson isolation; reads do not mutate storage.
- Permuted MCQ grading and unchanged TF grading across all26 banks.
- New attempts retaining completed presentations/scores in the local journal.
- Legacy indices, archived original meanings/order and recorded scores.
- Snapshot review after future bank changes; malformed metadata fails closed.
- Corrupted/blocked storage and stale-tab edits preserving the saved attempt.
- Actual React server rendering of saved order/checked options, read-only completion and historical review; mounting does not create an attempt.

| Check | Result |
|---|---|
| JSON, IDs/order, questions and KaTeX | Passed:26 lessons,264 questions,745 LaTeX occurrences |
| Full automated suite | **33 passed,0 failed** |
| TypeScript | Passed |
| Production build | Passed; existing large-chunk warning remains |
| `git diff --check` | Passed |
| Original archive, module membership, migrations and ignore files | Preserved |
| Live authenticated browser/Supabase/LLM integration | Not performed |

Main JS chunk:approximately1,657.30 kB minified /419.45 kB gzip. Verification includes persistence/scoring fixtures and actual server rendering, not a live authenticated browser or cross-device draft service. Existing distractor/wording concerns in Phase 3 still require content-quality review; randomization does not cure them.

## Changed files

New `src/assessmentAttempt.ts`, `src/AssessmentQuiz.tsx`, `scripts/assessment-attempt.test.mjs` and this report. Updated `src/App.tsx`, `src/assessmentState.ts`, `src/AssessmentHistory.tsx` and `scripts/run-tests.mjs`. Private sources, the question bank, schema/migrations and the pre-existing untracked `supabase/.gitignore` were unchanged in this phase.
