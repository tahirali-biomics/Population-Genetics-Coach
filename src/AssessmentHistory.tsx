import assessmentArchive from "./assessmentArchive.json";
import type { AssessmentQuestion } from "./data";
import { LessonContent } from "./LessonContent";
import { displayedQuestions, reviewAssessment } from "./assessmentAttempt";
import type { AssessmentDraft, RecordedAssessment } from "./assessmentAttempt";

export function AssessmentHistory({ lessonId, questions, attempt }: { lessonId: string; questions: AssessmentQuestion[]; attempt: RecordedAssessment }) {
  const archived = (assessmentArchive as Record<string, AssessmentQuestion[]>)[lessonId] ?? [];
  let review: AssessmentDraft | undefined;
  try { review = reviewAssessment(questions, attempt) ?? reviewAssessment(archived, attempt); }
  catch { /* Malformed metadata must not cause historical indices to be reinterpreted. */ }
  return (
    <section className="panel glass">
      <details>
        <summary>Review previous attempt ({attempt.score}/{attempt.max}, recorded {new Date(attempt.createdAt).toLocaleDateString()})</summary>
        <p>This recorded score and denominator are preserved. The original presentation and explanations are shown where available.</p>
        {(review ? displayedQuestions(review.presentation) : []).map((question, index) => (
          <div className="lesson-practice" key={question.id}>
            <b>Question {index + 1}</b>
            <LessonContent text={question.question} />
            {question.type === "mcq" && <ol type="A">{review!.presentation.optionOrder[question.id].map(canonical => (
              <li key={canonical}><LessonContent text={question.options![canonical]} inline />{review!.answers[question.id] === canonical && " — selected"}</li>
            ))}</ol>}
            <p>Your recorded answer: {question.type === "tf"
              ? (question.id in review!.answers ? String(review!.answers[question.id]) : "Unanswered")
              : question.options?.[Number(review!.answers[question.id])] ?? "Unanswered"}</p>
            <LessonContent text={question.explanation} />
          </div>
        ))}
        {!review && <p>The original presentation cannot be safely reconstructed for this question set. Its recorded score has not been recomputed.</p>}
      </details>
    </section>
  );
}
