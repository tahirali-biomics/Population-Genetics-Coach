import { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useParams } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import {
  Atom,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Database,
  FileText,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Presentation,
  School,
  Settings,
  Sun,
  Users,
  X,
  Library,
  CheckCircle2,
  LockKeyhole,
  Mic,
  Volume2,
  Square,
  RotateCcw,
  Clock3,
} from "lucide-react";
import {
  concepts,
  lessons,
  modules,
  workspaces,
  AssessmentQuestion,
} from "./data";
import { workspaceGuides } from "./workspaceGuides";
import { supabase } from "./supabase";
import {
  useVoicePreferences,
  startDictation,
  speakText,
  stopSpeaking,
  getSpeechStatus,
  subscribeSpeechStatus,
} from "./voice";
import { useSyncExternalStore } from "react";
type Attempt = {
  id: string;
  contextType: "lesson" | "workspace";
  contextId: string;
  score: number;
  max: number;
  answers: Record<string, number | boolean>;
  createdAt: string;
};
type State = {
  completedLessons: string[];
  workspaceStages: Record<string, number[]>;
  attempts: Attempt[];
  conceptMastery: Record<string, number>;
  aiInteractions: number;
};
const defaultState: State = {
  completedLessons: [],
  workspaceStages: {},
  attempts: [],
  conceptMastery: {},
  aiInteractions: 0,
};
const icons: any = {
  project: FlaskConical,
  practical: Code2,
  analysis: Database,
  writing: FileText,
  presentation: Presentation,
  exam: GraduationCap,
  feedback: MessageSquareText,
  coordinator: Users,
};
const privilegedRoles = ["coordinator", "admin", "manager", "app_manager"];
const appManagerRoles = ["admin", "app_manager"];
function Head({
  eyebrow = "POPULATION GENETICS COACH",
  title,
  text,
}: {
  eyebrow?: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-head">
      <small>{eyebrow}</small>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}
function Shell({
  children,
  dark,
  setDark,
  session,
  role,
  onAuth,
}: {
  children: any;
  dark: boolean;
  setDark: (x: boolean) => void;
  session: Session | null;
  role: string;
  onAuth: () => void;
}) {
  const [open, setOpen] = useState(false);
  const nav = [
    ["/", LayoutDashboard, "Dashboard"],
    ["/paths", BookOpen, "Learning paths"],
    ["/concepts", Library, "Concept library"],
    ["/tutor", BrainCircuit, "AI tutor"],
    ["/workspaces", FlaskConical, "Workspaces"],
    ["/progress", ClipboardCheck, "Progress"],
    ["/settings", Settings, "Settings"],
  ];
  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark">
            <Atom />
          </div>
          <div>
            <strong>Population Genetics</strong>
            <span>Coach</span>
          </div>
          <button className="icon mobile-close" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav>
          {nav.map(([to, I, label]: any) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <I />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="course-pill">
            <School />
            <div>
              <b>QBio305</b>
              <span>{session ? `${role} account` : "Preview mode"}</span>
            </div>
          </div>
          <button className="secondary" onClick={onAuth}>
            {session ? (
              <>
                <LogOut /> Sign out
              </>
            ) : (
              <>
                <LogIn /> Sign in
              </>
            )}
          </button>
        </div>
      </aside>
      <main>
        <header>
          <button className="icon menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="header-course">
            <span>QBio305</span>
            <b>Population & Quantitative Genetics</b>
          </div>
          <div className="header-actions">
            <button className="icon" onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Moon />}
            </button>
            <button className="header-auth" onClick={onAuth}>
              {session ? "Account" : "Sign in"}
            </button>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
function Dashboard({ state }: { state: State }) {
  const total = lessons.length,
    done = state.completedLessons.length;
  return (
    <>
      <section className="hero glass">
        <div>
          <small>THEORY · MODELS · GENOMIC INFERENCE · RESEARCH PRACTICE</small>
          <h1>
            Build population-genetic understanding from equations to defensible
            research.
          </h1>
          <p>
            Eight lecture-grounded modules, two theory extensions, guided
            practicals, a semester project workflow, concept mastery, objective
            assessment, and AI-supported scientific reasoning.
          </p>
          <div className="hero-actions">
            <NavLink className="primary" to="/paths">
              Continue learning <ChevronRight />
            </NavLink>
            <NavLink className="secondary" to="/workspaces">
              Open workspaces
            </NavLink>
          </div>
        </div>
        <div className="helix">
          <Atom />
        </div>
      </section>
      <div className="stats">
        <article className="glass">
          <span>Course progress</span>
          <b>
            {done}/{total}
          </b>
          <div className="bar">
            <i style={{ width: `${(100 * done) / total}%` }} />
          </div>
        </article>
        <article className="glass">
          <span>Assessment attempts</span>
          <b>{state.attempts.length}</b>
          <p>
            {state.attempts.length
              ? `${Math.round((state.attempts.reduce((a, b) => a + b.score / b.max, 0) / state.attempts.length) * 100)}% mean score`
              : "Begin a lesson self-check"}
          </p>
        </article>
        <article className="glass">
          <span>Concepts reviewed</span>
          <b>{Object.keys(state.conceptMastery).length}</b>
          <p>{concepts.length} concepts in the library</p>
        </article>
      </div>
      <Head
        title="Integrated learning environment"
        text="The v0.1 interface now combines source-bound lessons, assessments, guided workspaces, concept mastery, and role-controlled coordinator analytics."
      />
      <div className="workspace-grid">
        {workspaces
          .filter((w) => w.id !== "coordinator")
          .slice(0, 4)
          .map((w) => {
            const I = icons[w.id];
            return (
              <NavLink
                to={`/workspace/${w.id}`}
                className="workspace glass"
                key={w.id}
              >
                <I />
                <h2>{w.title}</h2>
                <p>{w.description}</p>
                <span>
                  {w.stages.length} guided stages <ChevronRight />
                </span>
              </NavLink>
            );
          })}
      </div>
    </>
  );
}
function Paths({
  state,
  role,
  canPreview,
}: {
  state: State;
  role: string;
  canPreview: boolean;
}) {
  const canRead = role !== "guest" || canPreview;
  return (
    <>
      <Head
        title="Learning paths"
        text={`${modules.length} modules and ${lessons.length} lessons organised around the uploaded QBio305 teaching collection.`}
      />
      {appManagerRoles.includes(role) && (
        <div className="source-policy glass">
          <b>Course-source policy</b>
          <span>
            Equations, models, terminology, examples, and interpretation are
            restricted to the approved uploaded course collection.
          </span>
        </div>
      )}
      <div className="module-grid">
        {modules.map((m) => (
          <article className="module glass" key={m.id}>
            <div className="module-title">
              <span>{m.icon}</span>
              <div>
                <h2>{m.title}</h2>
                <p>{m.description}</p>
              </div>
            </div>
            {m.lessons.map((l, li) => {
              const done = state.completedLessons.includes(l.id);
              const at = state.attempts
                .filter((a) => a.contextId === l.id)
                .at(-1);
              const unlocked = canRead || li === 0;
              return unlocked ? (
                <NavLink to={`/lesson/${l.id}`} className="lesson" key={l.id}>
                  <div>
                    <small>
                      {l.lecture} · {l.minutes} MIN READ
                    </small>
                    <b>{l.title}</b>
                    <p>{l.summary}</p>
                  </div>
                  <span className={done ? "status done" : "status"}>
                    {done
                      ? "Completed"
                      : at
                        ? `${Math.round((at.score / at.max) * 100)}%`
                        : "Start"}
                  </span>
                </NavLink>
              ) : (
                <div className="lesson locked-row" key={l.id}>
                  <div>
                    <small>{l.lecture}</small>
                    <b>{l.title}</b>
                    <p>
                      Sign in to open the lesson, assessment, and AI-supported
                      activities.
                    </p>
                  </div>
                  <LockKeyhole />
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </>
  );
}
function Quiz({
  questions,
  onSubmit,
  previous,
}: {
  questions: AssessmentQuestion[];
  onSubmit: (score: number, answers: Record<string, number | boolean>) => void;
  previous?: Attempt;
}) {
  const [answers, setAnswers] = useState<Record<string, number | boolean>>(
    previous?.answers || {},
  );
  const [result, setResult] = useState<number | undefined>(previous?.score);
  function submit() {
    let s = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) s++;
    });
    setResult(s);
    onSubmit(s, answers);
  }
  return (
    <section className="panel glass assessment">
      <small>OBJECTIVE SELF-ASSESSMENT</small>
      <h2>5 multiple choice + 5 true/false</h2>
      {questions.map((q, i) => (
        <div className="question" key={q.id}>
          <b>
            {i + 1}. {q.question}
          </b>
          {q.type === "mcq" ? (
            <div className="options">
              {q.options?.map((o, j) => (
                <label key={o}>
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === j}
                    onChange={() => setAnswers({ ...answers, [q.id]: j })}
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="tf">
              <button
                className={answers[q.id] === true ? "selected" : ""}
                onClick={() => setAnswers({ ...answers, [q.id]: true })}
              >
                Correct
              </button>
              <button
                className={answers[q.id] === false ? "selected" : ""}
                onClick={() => setAnswers({ ...answers, [q.id]: false })}
              >
                False
              </button>
            </div>
          )}
          {result !== undefined && (
            <p
              className={
                answers[q.id] === q.answer ? "explain right" : "explain wrong"
              }
            >
              {answers[q.id] === q.answer ? "✓ " : "Review: "}
              {q.explanation}
            </p>
          )}
        </div>
      ))}
      <button className="primary full" onClick={submit}>
        Submit and record attempt
      </button>
      {result !== undefined && (
        <div className="score-card">
          <b>
            {result}/{questions.length}
          </b>
          <span>{Math.round((result / questions.length) * 100)}%</span>
        </div>
      )}
    </section>
  );
}
function Lesson({
  state,
  setState,
  role,
  canPreview,
}: {
  state: State;
  setState: (s: State) => void;
  role: string;
  canPreview: boolean;
}) {
  const { id = "" } = useParams();
  const l = lessons.find((x) => x.id === id);
  if (!l) return <p>Lesson not found.</p>;
  const assessmentLength = l.assessment.length;
  if (role === "guest" && !canPreview)
    return <LockedPreview title={l.title} text={l.summary} />;
  const done = state.completedLessons.includes(id);
  const prev = state.attempts.filter((a) => a.contextId === id).at(-1);
  function record(score: number, answers: Record<string, number | boolean>) {
    const a: Attempt = {
      id: crypto.randomUUID(),
      contextType: "lesson",
      contextId: id,
      score,
      max: l!.assessment.length,
      answers,
      createdAt: new Date().toISOString(),
    };
    setState({ ...state, attempts: [...state.attempts, a] });
    void syncAttempt(a);
    void syncLessonProgress(
      id,
      null,
      Math.round((score / Math.max(1, assessmentLength)) * 100),
      true,
    );
  }
  function complete() {
    const completed = !done;
    setState({
      ...state,
      completedLessons: completed
        ? [...new Set([...state.completedLessons, id])]
        : state.completedLessons.filter((x) => x !== id),
    });
    void syncLessonProgress(id, completed);
  }
  return (
    <>
      <NavLink to="/paths" className="back">
        ← Learning paths
      </NavLink>
      <Head
        title={l.title}
        text={`${l.summary} · approximately ${l.minutes} minutes`}
      />
      {appManagerRoles.includes(role) && (
        <div className="lesson-source glass">
          <LockKeyhole />
          <div>
            <b>Approved source basis</b>
            <span>
              {l.sourceBasis ||
                `${l.lecture}; uploaded course books, exercises, and practical material only.`}
            </span>
          </div>
        </div>
      )}
      <div className="objectives glass">
        <small>LEARNING OBJECTIVES</small>
        <ul>
          {l.objectives.map((x) => (
            <li key={x}>
              <CheckCircle2 />
              {x}
            </li>
          ))}
        </ul>
      </div>
      <div className="lesson-rich">
        {l.sections.map(([h, p]) => (
          <article className="panel glass" key={h}>
            <h2>{h}</h2>
            {p.split("\n\n").map((x, i) => (
              <p key={i}>{x}</p>
            ))}
          </article>
        ))}
        <article className="panel glass">
          <h2>Model or equation</h2>
          <div className="equation">{l.equation}</div>
          <ul>
            {l.variables.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </article>
        <article className="panel glass">
          <h2>Worked example</h2>
          <p>{l.workedExample}</p>
          <div className="interpret-box">
            <b>Interpretation check</b>
            <span>
              Separate the numerical result from the biological conclusion and
              state the assumptions that permit the interpretation.
            </span>
          </div>
        </article>
        <article className="panel glass">
          <h2>Common mistakes</h2>
          <ul>
            {l.commonMistakes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </article>
      </div>
      <AIActivity
        contextId={l.id}
        title={l.title}
        prompt={l.aiPrompt}
        placeholder="Write a structured answer: assumptions → reasoning → result → biological interpretation → limitations."
        state={state}
        setState={setState}
      />
      <Quiz questions={l.assessment} previous={prev} onSubmit={record} />
      <button
        className={done ? "complete done" : "complete"}
        onClick={complete}
      >
        {done ? "✓ Lesson completed" : "Mark lesson complete"}
      </button>
    </>
  );
}
async function syncAttempt(a: Attempt) {
  if (!supabase) return;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("learning_attempts").insert({
      user_id: user.id,
      context_type: a.contextType,
      context_id: a.contextId,
      score: a.score,
      max_score: a.max,
      answers: a.answers,
    });
    if (error) throw error;
  } catch (e) {
    console.warn("Attempt kept locally", e);
  }
}

// Add these helpers to src/App.tsx near syncAttempt().

async function syncLessonProgress(
  lessonId: string,
  completed: boolean | null,
  score: number | null = null,
  incrementAttempts = false,
) {
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existing, error: readError } = await supabase
    .from("lesson_progress")
    .select("attempts, score, completed")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (readError) {
    console.warn("Could not read lesson progress", readError);
    return;
  }

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      completed:
        completed === null ? Boolean(existing?.completed) : completed,
      score: score ?? existing?.score ?? null,
      attempts:
        Number(existing?.attempts || 0) + (incrementAttempts ? 1 : 0),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) console.warn("Lesson progress kept locally", error);
}

async function syncConceptMastery(conceptId: string, mastery: number) {
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("concept_mastery").upsert(
    {
      user_id: user.id,
      concept_id: conceptId,
      mastery,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,concept_id" },
  );

  if (error) console.warn("Concept mastery kept locally", error);
}

async function syncWorkspaceProgress(args: {
  workspaceId: string;
  stageIndex: number;
  completed: boolean;
  draft?: string | null;
  aiFeedback?: unknown;
}) {
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existing, error: readError } = await supabase
    .from("workspace_progress")
    .select("draft, ai_feedback")
    .eq("user_id", user.id)
    .eq("workspace_id", args.workspaceId)
    .eq("stage_index", args.stageIndex)
    .maybeSingle();

  if (readError) {
    console.warn("Could not read workspace progress", readError);
    return;
  }

  const { error } = await supabase.from("workspace_progress").upsert(
    {
      user_id: user.id,
      workspace_id: args.workspaceId,
      stage_index: args.stageIndex,
      completed: args.completed,
      draft:
        args.draft === undefined ? (existing?.draft ?? null) : args.draft,
      ai_feedback:
        args.aiFeedback === undefined
          ? (existing?.ai_feedback ?? null)
          : args.aiFeedback,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,workspace_id,stage_index" },
  );

  if (error) console.warn("Workspace progress kept locally", error);
}

async function syncConversationTurn(args: {
  mode: string;
  userText: string;
  aiReply: string;
  feedback?: unknown;
}) {
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("conversation_turns").insert({
    user_id: user.id,
    mode: args.mode,
    user_text: args.userText,
    ai_reply: args.aiReply,
    feedback: args.feedback ?? null,
  });

  if (error) console.warn("AI interaction kept locally", error);
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
function Concepts({
  state,
  setState,
  role,
  canPreview,
}: {
  state: State;
  setState: (s: State) => void;
  role: string;
  canPreview: boolean;
}) {
  const [q, setQ] = useState("");
  const started = new Set([
    ...state.completedLessons,
    ...state.attempts.map((a) => a.contextId),
  ]);
  const startedModules = new Set(
    lessons.filter((l) => started.has(l.id)).map((l) => l.moduleId),
  );
  const unlocked = concepts.filter((c) =>
    c.lessons.some(
      (id) =>
        started.has(id) ||
        startedModules.has(lessons.find((l) => l.id === id)?.moduleId || ""),
    ),
  );
  const foundation = concepts
    .filter((c) =>
      c.lessons.some(
        (id) => lessons.find((l) => l.id === id)?.moduleId === modules[0]?.id,
      ),
    )
    .slice(0, 12);
  const pool = unlocked.length ? unlocked : foundation;
  const [deckSeed, setDeckSeed] = useState(0);
  const deck = useMemo(
    () => shuffle(pool).slice(0, 12),
    [pool.length, deckSeed],
  );
  const filtered = (q ? pool : deck).filter((c) =>
    (c.term + " " + c.definition).toLowerCase().includes(q.toLowerCase()),
  );
  if (role === "guest" && !canPreview)
    return (
      <LockedPreview
        title="Concept library"
        text="Concept cards unlock progressively as you begin and complete learning modules."
      />
    );
  return (
    <>
      <Head
        title="Concept library"
        text="A progressive, reshuffled review deck based on the modules you have started or completed."
      />
      <div className="concept-summary glass">
        <div>
          <b>{pool.length}</b>
          <span>concepts currently unlocked</span>
        </div>
        <p>
          Each visit presents a smaller mixed deck. Complete more lessons to
          unlock additional concepts.
        </p>
      </div>
      <div className="concept-tools">
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search unlocked concepts…"
        />
        <button
          className="secondary reshuffle"
          onClick={() => setDeckSeed((x) => x + 1)}
        >
          <RotateCcw /> Reshuffle deck
        </button>
      </div>
      <div className="concept-grid">
        {filtered.map((c) => {
          const m = state.conceptMastery[c.term] || 0;
          return (
            <article className="panel glass concept-card" key={c.term}>
              <small>
                {c.lessons.length} LINKED LESSON
                {c.lessons.length === 1 ? "" : "S"}
              </small>
              <h2>{c.term}</h2>
              <p>{c.definition}</p>
              <div className="mastery">
                <span>How confident are you?</span>
                <div>
                  {[1, 2, 3].map((x) => (
                    <button
                      key={x}
                      className={m === x ? "selected" : ""}
                      onClick={() => {
                        setState({
                          ...state,
                          conceptMastery: {
                            ...state.conceptMastery,
                            [c.term]: x,
                          },
                        });
                        void syncConceptMastery(c.term, x);
                      }}
                    >
                      <span>
                        {x === 1 ? "New" : x === 2 ? "Developing" : "Confident"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
function Workspaces({
  role,
  canPreview,
}: {
  role: string;
  canPreview: boolean;
}) {
  const visible = workspaces.filter(
    (w) => w.id !== "coordinator" || privilegedRoles.includes(role),
  );
  return (
    <>
      <Head
        title="Integrated workspaces"
        text="Guided environments for practical work, project development, analysis, writing, presentation, exam preparation, and targeted reflection."
      />
      <div className="workspace-grid">
        {visible.map((w) => {
          const I = icons[w.id];
          const locked = role === "guest" && !canPreview;
          return locked ? (
            <article className="workspace glass locked-card" key={w.id}>
              <I />
              <h2>{w.title}</h2>
              <p>{w.description}</p>
              <span>
                <LockKeyhole /> Sign in to open
              </span>
            </article>
          ) : (
            <NavLink
              to={`/workspace/${w.id}`}
              className="workspace glass"
              key={w.id}
            >
              <I />
              <h2>{w.title}</h2>
              <p>{w.description}</p>
              <span>
                {w.id === "coordinator"
                  ? "Open analytics"
                  : `${w.stages.length} guided stages`}{" "}
                <ChevronRight />
              </span>
            </NavLink>
          );
        })}
      </div>
    </>
  );
}
function Workspace({
  state,
  setState,
  role,
  canPreview,
}: {
  state: State;
  setState: (s: State) => void;
  role: string;
  canPreview: boolean;
}) {
  const { id = "project" } = useParams();
  if (id === "coordinator") {
    return privilegedRoles.includes(role) ? <Coordinator /> : <AccessDenied />;
  }
  const w =
    workspaces.find((x) => x.id === id && x.id !== "coordinator") ||
    workspaces[0];
  if (role === "guest" && !canPreview)
    return <LockedPreview title={w.title} text={w.description} />;
  const done = state.workspaceStages[id] || [];
  const guides = workspaceGuides[id] || [];
  return (
    <>
      <Head
        eyebrow="POPULATION GENETICS COACH · WORKSPACE"
        title={w.title}
        text={w.description}
      />
      {appManagerRoles.includes(role) && (
        <div className="source-policy glass">
          <b>Workspace source policy</b>
          <span>
            Instructions and AI feedback must remain within the approved
            uploaded teaching collection.
          </span>
        </div>
      )}
      <div className="stage-list">
        {w.stages.map((stageName, i) => {
          const complete = done.includes(i);
          const guide = guides[i];
          const toggleStage = () => {
            const completed = !complete;
            const next = completed ? [...done, i] : done.filter((x) => x !== i);
            setState({
              ...state,
              workspaceStages: { ...state.workspaceStages, [id]: next },
            });
            void syncWorkspaceProgress({
              workspaceId: id,
              stageIndex: i,
              completed,
            });
          };
          return (
            <details className="stage glass" key={stageName}>
              <summary>
                <span>{i + 1}</span>
                <div>
                  <small>STAGE {i + 1}</small>
                  <h3>{stageName}</h3>
                  <p>
                    {guide?.purpose ||
                      "Open the guided section and complete the stage-specific task."}
                  </p>
                </div>
                <b>{complete ? "✓ Completed" : "Open"}</b>
              </summary>
              <div className="stage-body">
                <div className="stage-context">
                  <small>WHY THIS STAGE MATTERS</small>
                  <p>{guide?.purpose}</p>
                </div>
                <div className="stage-guide">
                  <h4>Questions to work through</h4>
                  <ol>{guide?.prompts.map((p) => <li key={p}>{p}</li>)}</ol>
                </div>
                {id === "exam" && i === 10 ? (
                  <MockExam state={state} setState={setState} />
                ) : (
                  <AIActivity
                    contextId={`${id}-${i + 1}`}
                    title={`${w.title}: ${stageName}`}
                    prompt={guide?.aiFocus || stageName}
                    placeholder={
                      guide?.placeholder ||
                      `Draft your response for: ${stageName}`
                    }
                    state={state}
                    setState={setState}
                    compact
                    onEvaluated={(draft, aiFeedback) =>
                      void syncWorkspaceProgress({
                        workspaceId: id,
                        stageIndex: i,
                        completed: complete,
                        draft,
                        aiFeedback,
                      })
                    }
                  />
                )}
                <div className="mini-check">
                  <b>Self-evaluation before completion</b>
                  {guide?.checks.map((check) => (
                    <label key={check}>
                      <input type="checkbox" /> {check}
                    </label>
                  ))}
                </div>
                <div className="hero-actions stage-actions">
                  <button className="primary" onClick={toggleStage}>
                    {complete ? "Reopen stage" : "Complete and record"}
                  </button>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}

function LockedPreview({ title, text }: { title: string; text: string }) {
  return (
    <>
      <Head title={title} text={text} />
      <section className="locked-preview glass">
        <LockKeyhole />
        <h2>Sign in to continue</h2>
        <p>
          You can preview the section overview, but lessons, assessments, AI
          evaluation, concept mastery, progress recording, and workspace tasks
          require a confirmed account.
        </p>
      </section>
    </>
  );
}
function AIActivity({
  contextId,
  title,
  prompt,
  placeholder,
  state,
  setState,
  compact = false,
  onEvaluated,
}: {
  contextId: string;
  title: string;
  prompt: string;
  placeholder: string;
  state: State;
  setState: (s: State) => void;
  compact?: boolean;
  onEvaluated?: (draft: string, feedback: string) => void;
}) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const { prefs } = useVoicePreferences();
  useEffect(() => {
    if (feedback && prefs.autoRead)
      speakText(feedback, prefs, `feedback-${contextId}`);
  }, [feedback]);
  async function evaluate() {
    if (!text.trim()) {
      setFeedback("Write a draft before requesting evaluation.");
      return;
    }
    setLoading(true);
    setState({ ...state, aiInteractions: state.aiInteractions + 1 });
    try {
      if (!supabase) {
        setFeedback(
          "AI evaluation is ready, but Supabase is not configured in this local preview. Add the Supabase URL and publishable key, then deploy the lesson-evaluator Edge Function.",
        );
        return;
      }
      const { data, error } = await supabase.functions.invoke(
        "lesson-evaluator",
        { body: { contextId, title, prompt, response: text } },
      );
      if (error) throw error;
      const returnedFeedback =
        data?.feedback || data?.message || "Evaluation completed.";
      setFeedback(returnedFeedback);
      onEvaluated?.(text, returnedFeedback);
      void syncConversationTurn({
        mode: "lesson_evaluator",
        userText: text,
        aiReply: returnedFeedback,
        feedback: { contextId, title },
      });
    } catch (error: any) {
      setFeedback(error?.message || "AI evaluation could not be completed.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <section
      className={
        compact ? "ai-activity compact" : "panel glass ai-check ai-activity"
      }
    >
      {!compact && <small>AI-EVALUATED TRANSFER TASK</small>}
      <h4>{compact ? "Your working response" : prompt}</h4>
      <VoiceTextarea
        value={text}
        onChange={setText}
        placeholder={placeholder}
        id={`draft-${contextId}`}
      />
      <button className="secondary" onClick={evaluate} disabled={loading}>
        {loading ? "Evaluating…" : "Evaluate draft with course-grounded AI"}
      </button>
      {feedback && (
        <div className="ai-feedback">
          <div className="feedback-head">
            <b>AI feedback</b>
            <SpeakButton text={feedback} id={`feedback-${contextId}`} />
          </div>
          <p>{feedback}</p>
        </div>
      )}
    </section>
  );
}

function VoiceTextarea({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
}) {
  const { prefs } = useVoicePreferences();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  function toggle() {
    if (listening) {
      window.dispatchEvent(new Event("pg-stop-dictation"));
      setListening(false);
      return;
    }
    setError("");
    const ok = startDictation({
      onInterim: setInterim,
      onFinal: (spoken) => {
        onChange([value, spoken].filter(Boolean).join(value.trim() ? " " : ""));
        setInterim("");
      },
      onError: (message) => {
        setError(message);
        setListening(false);
      },
      onEnd: () => {
        setListening(false);
        setInterim("");
      },
    });
    if (ok) setListening(true);
    else setError("Voice input is not supported by this browser.");
  }
  return (
    <div className="voice-field">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {prefs.enabled && (
        <div className="voice-toolbar">
          <button
            type="button"
            className={listening ? "voice-button listening" : "voice-button"}
            onClick={toggle}
          >
            <Mic />
            {listening ? "Stop recording" : "Record answer"}
          </button>
          {interim && <span className="interim">{interim}</span>}
          {error && <span className="voice-error">{error}</span>}
        </div>
      )}
    </div>
  );
}
function SpeakButton({ text, id }: { text: string; id: string }) {
  const { prefs } = useVoicePreferences();
  const status = useSyncExternalStore(
    subscribeSpeechStatus,
    getSpeechStatus,
    getSpeechStatus,
  );
  const active = status.speaking && status.id === id;
  if (!prefs.enabled || !text.trim()) return null;
  return (
    <button
      type="button"
      className={active ? "speak-button active" : "speak-button"}
      onClick={() => (active ? stopSpeaking() : speakText(text, prefs, id))}
    >
      {active ? (
        <>
          <Square />
          Stop
        </>
      ) : (
        <>
          <Volume2 />
          Listen
        </>
      )}
    </button>
  );
}
type ExamQuestion = { moduleId: string; title: string; prompt: string };
const progressiveExamPool: ExamQuestion[] = [
  {
    moduleId: "lecture1",
    title: "Allele and genotype frequencies",
    prompt:
      "A diploid sample contains 48 AA, 36 Aa and 16 aa individuals. Calculate p and q, observed genotype frequencies, Hardy–Weinberg expected counts, and the direction of any heterozygote deviation. State two biologically different explanations compatible with the deviation.",
  },
  {
    moduleId: "lecture1",
    title: "Sequence diversity",
    prompt:
      "Five aligned sequences of 20 bp contain eight total pairwise differences across all ten sequence pairs and six segregating sites. Calculate nucleotide diversity per site, state what the statistic measures, and explain why a segregating-site estimator weights the data differently.",
  },
  {
    moduleId: "lecture1",
    title: "Multiallelic gene diversity",
    prompt:
      "A locus has allele frequencies 0.50, 0.30 and 0.20. Calculate expected gene diversity using H=1-sum(p_i^2), verify the range, and explain why an allele at frequency 0.01 contributes little to H.",
  },
  {
    moduleId: "lecture2",
    title: "One-generation drift variance",
    prompt:
      "For a neutral allele at p=0.30, calculate Var(p') and SD(p') for N=25 and N=250 diploid individuals. Compare the two distributions and explain why the expected change is zero although realized changes occur.",
  },
  {
    moduleId: "lecture2",
    title: "Fixation and loss",
    prompt:
      "A neutral allele is present in 12 of 80 sampled gene copies. Calculate its initial frequency, eventual fixation probability and loss probability. Contrast this with the probability for one newly arisen copy in the same population.",
  },
  {
    moduleId: "lecture2",
    title: "Heterozygosity decay",
    prompt:
      "Starting from H0=0.50, calculate expected heterozygosity after 100 generations for Ne=50 and Ne=500 using the lecture equation. Interpret the difference and state why census size cannot automatically replace Ne.",
  },
  {
    moduleId: "lecture3",
    title: "Wright–Fisher transition",
    prompt:
      "In a diploid Wright–Fisher population with N=3 and current allele frequency p=1/3, calculate the probability of observing exactly 0, 1, and 2 copies in the next generation. State the model assumptions used.",
  },
  {
    moduleId: "lecture3",
    title: "Moran transition",
    prompt:
      "In a neutral haploid Moran population with N=10 and i=3 copies, calculate the probabilities of an increase, decrease, and no change in one event. Explain why Moran events cannot be compared directly with Wright–Fisher generations without rescaling.",
  },
  {
    moduleId: "lecture3",
    title: "Model comparison",
    prompt:
      "Compare Wright–Fisher and Moran models for an annual plant and a continuously reproducing microbial population. For each system, justify the preferred model, identify the replacement assumption, and state one limitation.",
  },
  {
    moduleId: "lecture4",
    title: "Wahlund effect",
    prompt:
      "Two equally sampled demes have allele frequencies p1=0.90 and p2=0.50. Calculate pooled p, HT, mean HS, and the expected heterozygote deficit caused by pooling. Explain why this is not automatically evidence of inbreeding within demes.",
  },
  {
    moduleId: "lecture4",
    title: "FST calculation",
    prompt:
      "Two equally sampled populations have p1=0.80 and p2=0.40. Calculate HT, HS and FST using the lecture formulation. Interpret the result and give two evolutionary processes that can generate it.",
  },
  {
    moduleId: "lecture4",
    title: "Migration step",
    prompt:
      "A recipient population has p=0.70, migrants have p=0.30, and m=0.05. Calculate the post-migration frequency. Then list the assumptions required before interpreting the equilibrium FST approximation in terms of Ne m.",
  },
  {
    moduleId: "lecture5",
    title: "Pairwise coalescence",
    prompt:
      "For Ne=25,000 diploid individuals, calculate the probability that two lineages coalesce in the previous generation and their expected waiting time. Explain how halving Ne changes both quantities.",
  },
  {
    moduleId: "lecture5",
    title: "Multiple-lineage waiting times",
    prompt:
      "For Ne=20,000, calculate E[T8], E[T4], and E[T2] using the lecture equation. Explain why deep coalescent intervals contribute strongly to tree height.",
  },
  {
    moduleId: "lecture5",
    title: "Theta and segregating sites",
    prompt:
      "For Ne=50,000 and mutation rate 2e-8, calculate theta. For n=6 sequences and S=20 segregating sites across 1,000 bp, calculate Watterson's theta per site using a_n. Explain why the two values need not match exactly in one dataset.",
  },
  {
    moduleId: "lecture6",
    title: "Viability selection recursion",
    prompt:
      "At p=0.20, genotype fitnesses are wAA=1.0, wAa=0.95 and waa=0.80. Calculate mean fitness and p after selection. Define every term and explain the direction of change.",
  },
  {
    moduleId: "lecture6",
    title: "Selected versus neutral fixation",
    prompt:
      "In N=5,000 diploid individuals, compare the fixation probability of one neutral mutation with the approximate fixation probability of a new additive beneficial mutation with s=0.005. State why the selected result is an approximation.",
  },
  {
    moduleId: "lecture6",
    title: "Mutation–selection balance",
    prompt:
      "For a fully recessive deleterious allele with mutation rate 2e-6 and s=0.02, calculate the approximate equilibrium frequency. Explain why recessivity allows deleterious copies to persist.",
  },
  {
    moduleId: "lecture7",
    title: "Reading the SFS",
    prompt:
      "Describe how a recent population expansion changes genealogical branch lengths and the low-frequency classes of an unfolded SFS. Contrast this with one bottleneck effect and state why the pattern is not unique to demography.",
  },
  {
    moduleId: "lecture7",
    title: "Tajima's D",
    prompt:
      "A window has pi=0.003 and thetaW=0.005. Predict the sign of Tajima's D, explain the implied frequency-spectrum skew, and provide three processes compatible with the result.",
  },
  {
    moduleId: "lecture7",
    title: "Demographic model",
    prompt:
      "Specify a two-population split model with migration: list parameters, identify expected features in the two-dimensional SFS, and describe two diagnostics for poor model fit and one alternative history that may be difficult to distinguish.",
  },
  {
    moduleId: "lecture8",
    title: "Selective sweep",
    prompt:
      "Predict how a recent hard sweep affects nucleotide diversity, rare-variant abundance, and linkage disequilibrium near the selected site. Explain how recombination changes the spatial scale and why demography remains a confounder.",
  },
  {
    moduleId: "lecture8",
    title: "Genome scan design",
    prompt:
      "Design a genome scan using FST, diversity and LD. Define the null distribution, justify window or LD-block treatment, identify non-independence, and state the evidence required before calling a region a candidate for selection.",
  },
  {
    moduleId: "lecture8",
    title: "Selection versus demography",
    prompt:
      "A region has high FST and low diversity. Construct an evidence hierarchy that compares it with genome-wide and demographic expectations. State one defensible conclusion and one conclusion that remains unsupported.",
  },
];
function buildProgressiveExam(state: State) {
  const lectureIds = modules
    .filter((m) => /^lecture[1-8]$/.test(m.id))
    .map((m) => m.id);
  const covered = lectureIds.filter((mid) =>
    lessons.some(
      (l) => l.moduleId === mid && state.completedLessons.includes(l.id),
    ),
  );
  const allowed = covered.length ? covered : ["lecture1"];
  const pool = progressiveExamPool.filter((q) => allowed.includes(q.moduleId));
  const seed = state.completedLessons.length + allowed.length * 7;
  const rotated = pool.map((_, i) => pool[(i + seed) % pool.length]);
  const selected: Array<ExamQuestion & { marks: number }> = [];
  for (let i = 0; i < 6; i++)
    selected.push({ ...rotated[i % rotated.length], marks: 10 });
  return { selected, allowed };
}
function MockExam({
  state,
  setState,
}: {
  state: State;
  setState: (s: State) => void;
}) {
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(60 * 60);
  const { selected, allowed } = useMemo(
    () => buildProgressiveExam(state),
    [state.completedLessons.join("|")],
  );
  useEffect(() => {
    setRemaining(60 * 60);
    setStarted(false);
  }, [allowed.join("|")]);
  useEffect(() => {
    if (!started || remaining <= 0) return;
    const t = setInterval(() => setRemaining((x) => x - 1), 1000);
    return () => clearInterval(t);
  }, [started, remaining]);
  return (
    <section className="mock-exam">
      <div className="mock-head">
        <div>
          <small>PROGRESSIVE LECTURE-BASED EXAM</small>
          <h4>60-minute mock exam · 60 marks</h4>
          <p>
            Questions are drawn only from Lectures 1–8 that you have started.
            Completing lessons expands and changes the paper. Current coverage:{" "}
            {allowed.map((x) => x.replace("lecture", "Lecture ")).join(", ")}.
          </p>
        </div>
        <div className="timer">
          <Clock3 />
          <b>
            {String(Math.floor(remaining / 60)).padStart(2, "0")}:
            {String(remaining % 60).padStart(2, "0")}
          </b>
          <button className="secondary" onClick={() => setStarted(!started)}>
            {started ? "Pause" : "Start timer"}
          </button>
        </div>
      </div>
      <div className="mock-questions">
        {selected.map((q, i) => (
          <article
            className="mock-question"
            key={`${q.moduleId}-${q.title}-${i}`}
          >
            <div className="mock-title">
              <h5>
                {i + 1}. {q.title}
              </h5>
              <span>{q.marks} marks</span>
            </div>
            <p>{q.prompt}</p>
            <AIActivity
              contextId={`mock-exam-${q.moduleId}-${i + 1}`}
              title={q.title}
              prompt={q.prompt}
              placeholder="Show equations, calculations, definitions, assumptions, and biological interpretation."
              state={state}
              setState={setState}
              compact
            />
          </article>
        ))}
      </div>
    </section>
  );
}
function AccessDenied() {
  return (
    <section className="access-denied glass">
      <LockKeyhole />
      <h1>Coordinator access required</h1>
      <p>
        This page is restricted to authenticated coordinator, manager, and
        administrator accounts. Student and guest accounts cannot view
        course-wide analytics.
      </p>
      <NavLink className="primary" to="/workspaces">
        Return to workspaces
      </NavLink>
    </section>
  );
}
type CoordinatorStudent = {
  student_user_id: string;
  display_name: string;
  email: string;
  lessons_completed: number;
  attempts: number;
  mean_score: number;
  ai_interactions: number;
  workspace_milestones: number;
  last_active: string | null;
};

function Coordinator() {
  const [students, setStudents] = useState<CoordinatorStudent[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [attempts, setAttempts] = useState<any[]>([]);
  const [lessonRows, setLessonRows] = useState<any[]>([]);
  const [workspaceRows, setWorkspaceRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = students.find((student) => student.student_user_id === selectedId);

  useEffect(() => {
    let active = true;

    async function loadStudents() {
      if (!supabase) {
        if (active) {
          setError("Supabase is not configured.");
          setLoading(false);
        }
        return;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "get_course_student_summary",
        { target_course_id: 1 },
      );

      if (!active) return;

      if (rpcError) {
        setError(rpcError.message);
        setStudents([]);
      } else {
        const rows = (data || []) as CoordinatorStudent[];
        setStudents(rows);
        setSelectedId((current) =>
          current && rows.some((row) => row.student_user_id === current)
            ? current
            : rows[0]?.student_user_id || "",
        );
      }
      setLoading(false);
    }

    loadStudents();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStudentDetail() {
      if (!supabase || !selectedId) {
        setAttempts([]);
        setLessonRows([]);
        setWorkspaceRows([]);
        return;
      }

      setDetailLoading(true);
      setError("");

      const [attemptResult, lessonResult, workspaceResult] = await Promise.all([
        supabase
          .from("learning_attempts")
          .select("*")
          .eq("user_id", selectedId)
          .order("created_at", { ascending: false }),
        supabase
          .from("lesson_progress")
          .select("*")
          .eq("user_id", selectedId)
          .order("updated_at", { ascending: false }),
        supabase
          .from("workspace_progress")
          .select("*")
          .eq("user_id", selectedId)
          .order("updated_at", { ascending: false }),
      ]);

      if (!active) return;

      const firstError =
        attemptResult.error || lessonResult.error || workspaceResult.error;
      if (firstError) setError(firstError.message);

      setAttempts(attemptResult.data || []);
      setLessonRows(lessonResult.data || []);
      setWorkspaceRows(workspaceResult.data || []);
      setDetailLoading(false);
    }

    loadStudentDetail();
    return () => {
      active = false;
    };
  }, [selectedId]);

  const completedLessonIds = new Set(
    lessonRows.filter((row) => row.completed).map((row) => row.lesson_id),
  );

  return (
    <div className="coordinator-layout">
      <Head
        title="Coordinator dashboard"
        text="Course-scoped analytics for students registered in Population Genetics Coach."
      />

      <section className="panel glass coordinator-roster">
        <div className="coordinator-heading">
          <div>
            <h2>Student roster</h2>
            <p>
              {students.length} registered{" "}
              {students.length === 1 ? "student" : "students"}
            </p>
          </div>
          {loading && <span className="muted">Loading…</span>}
        </div>

        {error && <p className="error">{error}</p>}

        {!loading && !students.length ? (
          <p>No students are assigned to this course.</p>
        ) : (
          <div className="student-card-grid">
            {students.map((student) => (
              <button
                type="button"
                key={student.student_user_id}
                className={
                  student.student_user_id === selectedId
                    ? "student-summary-card selected-student"
                    : "student-summary-card"
                }
                onClick={() => setSelectedId(student.student_user_id)}
              >
                <strong>{student.display_name}</strong>
                <small>ID …{student.student_user_id.slice(-8)}</small>
                <dl>
                  <div>
                    <dt>Lessons</dt>
                    <dd>
                      {student.lessons_completed}/{lessons.length}
                    </dd>
                  </div>
                  <div>
                    <dt>Attempts</dt>
                    <dd>{student.attempts}</dd>
                  </div>
                  <div>
                    <dt>Mean score</dt>
                    <dd>
                      {Number(student.mean_score || 0).toFixed(1)}%
                    </dd>
                  </div>
                  <div>
                    <dt>AI interactions</dt>
                    <dd>{student.ai_interactions}</dd>
                  </div>
                  <div>
                    <dt>Milestones</dt>
                    <dd>{student.workspace_milestones}</dd>
                  </div>
                  <div>
                    <dt>Last active</dt>
                    <dd>
                      {student.last_active
                        ? new Date(student.last_active).toLocaleString()
                        : "Not yet"}
                    </dd>
                  </div>
                </dl>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="coordinator-content">
          <div className="selected-student-head">
            <div>
              <small>SELECTED STUDENT</small>
              <h2>{selected.display_name}</h2>
              <p className="muted">User ID …{selected.student_user_id.slice(-8)}</p>
            </div>
            {detailLoading && <span className="muted">Loading details…</span>}
          </div>

          <div className="stats coordinator-stats">
            <article className="glass">
              <span>Lessons completed</span>
              <b>{selected.lessons_completed}</b>
              <p>of {lessons.length}</p>
            </article>
            <article className="glass">
              <span>Attempts</span>
              <b>{selected.attempts}</b>
              <p>{Number(selected.mean_score || 0).toFixed(1)}% mean</p>
            </article>
            <article className="glass">
              <span>AI interactions</span>
              <b>{selected.ai_interactions}</b>
              <p>tutor and formative feedback</p>
            </article>
          </div>

          <section className="panel glass table-wrap coordinator-table">
            <h2>Assessment history</h2>
            {attempts.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Context</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td data-label="Date">
                        {new Date(attempt.created_at).toLocaleString()}
                      </td>
                      <td data-label="Context">
                        {lessons.find(
                          (lesson) => lesson.id === attempt.context_id,
                        )?.title || attempt.context_id}
                      </td>
                      <td data-label="Score">
                        {attempt.score}/{attempt.max_score} (
                        {attempt.max_score
                          ? Math.round(
                              (attempt.score / attempt.max_score) * 100,
                            )
                          : 0}
                        %)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No attempts recorded for this student.</p>
            )}
          </section>

          <section className="panel glass">
            <h2>Lesson completion</h2>
            <div className="coordinator-lesson-grid">
              {modules.map((module) => {
                const completed = module.lessons.filter((lesson) =>
                  completedLessonIds.has(lesson.id),
                ).length;
                return (
                  <div key={module.id}>
                    <div>
                      <b>{module.title}</b>
                      <span>
                        {completed}/{module.lessons.length}
                      </span>
                    </div>
                    <div className="bar">
                      <i
                        style={{
                          width: `${
                            module.lessons.length
                              ? (100 * completed) / module.lessons.length
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel glass">
            <h2>Workspace milestones</h2>
            {workspaces
              .filter(
                (workspace) =>
                  workspace.stages.length && workspace.id !== "coordinator",
              )
              .map((workspace) => {
                const completed = workspaceRows.filter(
                  (row) => row.workspace_id === workspace.id && row.completed,
                ).length;
                return (
                  <div className="coord-row" key={workspace.id}>
                    <b>{workspace.title}</b>
                    <span>
                      {completed}/{workspace.stages.length}
                    </span>
                    <div className="bar">
                      <i
                        style={{
                          width: `${
                            workspace.stages.length
                              ? (100 * completed) / workspace.stages.length
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </section>
        </div>
      )}
    </div>
  );
}

function Tutor({
  state,
  setState,
  role,
  canPreview,
}: {
  state: State;
  setState: (s: State) => void;
  role: string;
  canPreview: boolean;
}) {
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const { prefs } = useVoicePreferences();
  useEffect(() => {
    if (reply && prefs.autoRead) speakText(reply, prefs, "tutor-reply");
  }, [reply]);
  if (role === "guest" && !canPreview)
    return (
      <LockedPreview
        title="AI population-genetics tutor"
        text="Course-grounded support for registered learners."
      />
    );
  async function send() {
    if (!msg.trim()) return;
    setLoading(true);
    setState({ ...state, aiInteractions: state.aiInteractions + 1 });
    try {
      if (!supabase) {
        setReply(
          "The tutor is ready, but Supabase is not configured in this local preview. Add your Supabase URL and publishable key and deploy the ai-tutor Edge Function.",
        );
        return;
      }
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: { message: msg, conversation: [] },
      });
      if (error) throw error;
      const returnedReply =
        data?.reply || data?.message || "The tutor returned no text.";
      setReply(returnedReply);
      void syncConversationTurn({
        mode: "tutor",
        userText: msg,
        aiReply: returnedReply,
      });
    } catch (error: any) {
      setReply(error?.message || "The AI tutor could not be reached.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <Head
        title="AI population-genetics tutor"
        text="Course-grounded support restricted to approved uploaded teaching content."
      />
      <div className="chat glass">
        <div className="chat-intro">
          <BrainCircuit />
          <div>
            <h2>Ask a question</h2>
            <p>
              Production responses are generated through the Supabase Edge
              Function and grounded in approved derived course content.
            </p>
          </div>
        </div>
        {reply && (
          <div className="bubble ai">
            <div className="feedback-head">
              <b>AI tutor</b>
              <SpeakButton text={reply} id="tutor-reply" />
            </div>
            {reply}
          </div>
        )}
        <VoiceTextarea
          value={msg}
          onChange={setMsg}
          id="tutor-question"
          placeholder="Example: Why can negative Tajima’s D reflect more than one process?"
        />
        <button className="primary" onClick={send} disabled={loading}>
          {loading ? "Thinking…" : "Send question"}
        </button>
      </div>
    </>
  );
}
function ProgressPage({
  state,
  role,
  canPreview,
}: {
  state: State;
  role: string;
  canPreview: boolean;
}) {
  if (role === "guest" && !canPreview)
    return (
      <LockedPreview
        title="Learning progress"
        text="Your lesson, assessment, workspace, and concept progress will appear here after sign-in."
      />
    );
  return (
    <>
      <Head
        title="Learning progress"
        text="Lesson completion, assessment history, workspace milestones, concept confidence, and AI activity are shown together."
      />
      <div className="progress-list glass">
        {modules.map((m) => {
          const d = m.lessons.filter((l) =>
            state.completedLessons.includes(l.id),
          ).length;
          return (
            <div key={m.id}>
              <span>{m.icon}</span>
              <div>
                <b>{m.title}</b>
                <p>
                  {d} of {m.lessons.length} lessons completed
                </p>
                <div className="bar">
                  <i style={{ width: `${(100 * d) / m.lessons.length}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="settings-grid">
        <article className="panel glass">
          <h2>Workspace completion</h2>
          {workspaces
            .filter((w) => w.stages.length && w.id !== "coordinator")
            .map((w) => (
              <p key={w.id}>
                <b>{w.title}:</b> {(state.workspaceStages[w.id] || []).length}/
                {w.stages.length}
              </p>
            ))}
        </article>
        <article className="panel glass">
          <h2>Assessment and concepts</h2>
          <p>
            <b>Attempts:</b> {state.attempts.length}
          </p>
          <p>
            <b>Concepts rated:</b> {Object.keys(state.conceptMastery).length}/
            {concepts.length}
          </p>
          <p>
            <b>AI interactions:</b> {state.aiInteractions}
          </p>
        </article>
      </div>
    </>
  );
}
function SettingsPage() {
  const { prefs, update } = useVoicePreferences();
  return (
    <>
      <Head
        title="Settings and enrolment"
        text="Control voice interaction, reading preferences, account access, and course enrolment."
      />
      <div className="settings-grid">
        <article className="panel glass">
          <h2>Voice and speaking</h2>
          <label className="setting-row">
            <span>
              <b>Enable voice tools</b>
              <small>
                Show microphone and read-aloud controls wherever AI writing is
                available.
              </small>
            </span>
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
            />
          </label>
          <label className="setting-row">
            <span>
              <b>Read AI feedback automatically</b>
              <small>Speak newly returned tutor and evaluator feedback.</small>
            </span>
            <input
              type="checkbox"
              checked={prefs.autoRead}
              onChange={(e) => update({ autoRead: e.target.checked })}
            />
          </label>
          <label className="setting-row">
            <span>
              <b>Slower speech</b>
              <small>
                Use a slower speaking rate for careful listening practice.
              </small>
            </span>
            <input
              type="checkbox"
              checked={prefs.rate === "slow"}
              onChange={(e) =>
                update({ rate: e.target.checked ? "slow" : "normal" })
              }
            />
          </label>
          <p className="muted">
            Voice input uses the browser speech-recognition service. Read-aloud
            uses the browser's installed English voices. Chrome and Edge
            normally provide the broadest support.
          </p>
        </article>
        <article className="panel glass">
          <h2>Role-based access</h2>
          <p>
            <b>Registered learners:</b> learning paths, concepts, AI tutor,
            student workspaces, assessments, and personal progress.
          </p>
          <p>
            <b>Invited students:</b> the same learning environment plus
            assignment to the active university semester.
          </p>
          <p>
            <b>Coordinators and managers:</b> course analytics, but not
            app-manager source administration.
          </p>
        </article>
        <article className="panel glass">
          <h2>Privacy boundary</h2>
          <p>
            Raw lectures, books, exercises, solutions, practicals, project
            reports, and instructor pipelines remain outside the Git repository
            and deployment bundle.
          </p>
        </article>
      </div>
    </>
  );
}

function AuthModal({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: Session | null;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState("");
  if (!open) return null;
  async function submit(kind: "signin" | "signup") {
    if (!supabase) {
      setError("Supabase is not configured in this local preview.");
      return;
    }
    const r =
      kind === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (r.error) {
      setError(r.error.message);
      return;
    }
    onClose();
  }
  async function signOut() {
    await supabase?.auth.signOut();
    onClose();
  }
  return (
    <div className="modal-backdrop">
      <section className="modal glass">
        <button className="modal-x" onClick={onClose}>
          <X />
        </button>
        <h2>{session ? "Account" : "Sign in"}</h2>
        {session ? (
          <>
            <p>{session.user.email}</p>
            <button className="primary full" onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            {error && <p className="error">{error}</p>}
            <div className="hero-actions">
              <button className="secondary" onClick={() => submit("signup")}>
                Register
              </button>
              <button className="primary" onClick={() => submit("signin")}>
                Sign in
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
export default function App() {
  const previewUnlocked =
    import.meta.env.DEV && import.meta.env.VITE_PREVIEW_UNLOCK_ALL !== "false";
  const [dark, setDark] = useState(
    () => localStorage.getItem("pg-dark") === "1",
  );
  const [state, setStateRaw] = useState<State>(() => {
    try {
      return {
        ...defaultState,
        ...JSON.parse(localStorage.getItem("pg-state-v06") || "{}"),
      };
    } catch {
      return defaultState;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState("guest");
  const [authReady, setAuthReady] = useState(!supabase);
  const [roleReady, setRoleReady] = useState(!supabase);
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => localStorage.setItem("pg-dark", dark ? "1" : "0"), [dark]);
  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      if (!authReady) return;

      setRoleReady(false);

      if (!session?.user || !supabase) {
        if (active) {
          setRole(session ? "student" : "guest");
          setRoleReady(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.warn("Could not load account role", error);
        setRole("student");
      } else {
        setRole(data?.account_type || "student");
      }

      setRoleReady(true);
    }

    void loadRole();

    return () => {
      active = false;
    };
  }, [authReady, session?.user.id]);
  useEffect(() => {
    let active = true;

    async function loadRemoteState() {
      if (!session?.user || !supabase) return;

      const [
        lessonResult,
        attemptResult,
        workspaceResult,
        masteryResult,
        conversationResult,
      ] = await Promise.all([
        supabase
          .from("lesson_progress")
          .select("*")
          .eq("user_id", session.user.id),
        supabase
          .from("learning_attempts")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("workspace_progress")
          .select("*")
          .eq("user_id", session.user.id),
        supabase
          .from("concept_mastery")
          .select("*")
          .eq("user_id", session.user.id),
        supabase
          .from("conversation_turns")
          .select("id")
          .eq("user_id", session.user.id),
      ]);

      if (!active) return;

      const firstError =
        lessonResult.error ||
        attemptResult.error ||
        workspaceResult.error ||
        masteryResult.error ||
        conversationResult.error;

      if (firstError) {
        console.warn(
          "Remote learning state could not be fully loaded",
          firstError,
        );
        return;
      }

      const workspaceStages: Record<string, number[]> = {};
      for (const row of workspaceResult.data || []) {
        if (!row.completed) continue;
        const current = workspaceStages[row.workspace_id] || [];
        workspaceStages[row.workspace_id] = [...current, row.stage_index].sort(
          (a, b) => a - b,
        );
      }

      const conceptMastery: Record<string, number> = {};
      for (const row of masteryResult.data || []) {
        conceptMastery[row.concept_id] = row.mastery;
      }

      const remoteState: State = {
        completedLessons: (lessonResult.data || [])
          .filter((row) => row.completed)
          .map((row) => row.lesson_id),
        attempts: (attemptResult.data || []).map((row) => ({
          id: row.id,
          contextType: row.context_type,
          contextId: row.context_id,
          score: row.score,
          max: row.max_score,
          answers: row.answers || {},
          createdAt: row.created_at,
        })),
        workspaceStages,
        conceptMastery,
        aiInteractions: (conversationResult.data || []).length,
      };

      setStateRaw(remoteState);
      localStorage.setItem("pg-state-v06", JSON.stringify(remoteState));
    }

    void loadRemoteState();
    return () => {
      active = false;
    };
  }, [session?.user.id]);
  function setState(s: State) {
    setStateRaw(s);
    localStorage.setItem("pg-state-v06", JSON.stringify(s));
  }
  const visibleRole = useMemo(() => role, [role]);

  if (!authReady || !roleReady) {
    return (
      <div className="app-loading">
        <div className="panel glass">
          <h2>Loading account</h2>
          <p>Restoring your session and course permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <Shell
      dark={dark}
      setDark={setDark}
      session={session}
      role={visibleRole}
      onAuth={() => setAuthOpen(true)}
    >
      <Routes>
        <Route path="/" element={<Dashboard state={state} />} />
        <Route
          path="/paths"
          element={
            <Paths
              state={state}
              role={visibleRole}
              canPreview={previewUnlocked}
            />
          }
        />
        <Route
          path="/lesson/:id"
          element={
            <Lesson
              state={state}
              setState={setState}
              role={visibleRole}
              canPreview={previewUnlocked}
            />
          }
        />
        <Route
          path="/concepts"
          element={
            <Concepts
              state={state}
              setState={setState}
              role={visibleRole}
              canPreview={previewUnlocked}
            />
          }
        />
        <Route
          path="/workspaces"
          element={
            <Workspaces role={visibleRole} canPreview={previewUnlocked} />
          }
        />
        <Route
          path="/workspace/:id"
          element={
            <Workspace
              state={state}
              setState={setState}
              role={visibleRole}
              canPreview={previewUnlocked}
            />
          }
        />
        <Route
          path="/tutor"
          element={
            <Tutor
              state={state}
              setState={setState}
              role={visibleRole}
              canPreview={previewUnlocked}
            />
          }
        />
        <Route
          path="/progress"
          element={
            <ProgressPage
              state={state}
              role={visibleRole}
              canPreview={previewUnlocked}
            />
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        session={session}
      />
    </Shell>
  );
}
