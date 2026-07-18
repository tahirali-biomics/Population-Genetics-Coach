# Population Genetics Coach v0.5.0

## Main changes

- Replaced generic workspace prompts with stage-specific, realistic questions and self-checks across Practical Laboratory, Research Project, Data Analysis, Scientific Writing, Presentation, Exam Preparation, and Feedback & Reflection.
- Added live AI-evaluation calls through the `lesson-evaluator` Supabase Edge Function, with visible feedback inside each lesson or workspace stage.
- Changed the Concept Library into a progressive review deck. Concepts unlock from modules the learner starts or completes, and a smaller shuffled deck is shown on each visit.
- Corrected concept-card and mastery-button layouts for desktop, tablet, and mobile screens.
- Added production access gating: unauthenticated visitors see section overviews only; confirmed users can open lessons, workspaces, concepts, progress, and AI activities.
- Local `npm run dev` remains unlocked for instructor inspection. Production builds are locked automatically.
- Coordinator analytics remain inaccessible to guests and students, including in local preview mode.
- Source-provenance notices are visible only to `admin` or `app_manager` roles. They are hidden from students, coordinators, and managers.
- Removed the repeated equation-source caption from learner-facing lessons.

## Local preview versus production

- `npm run dev`: student content is unlocked for local inspection.
- `npm run build`: content is gated until Supabase authentication succeeds.
- The coordinator dashboard is always role-protected.
