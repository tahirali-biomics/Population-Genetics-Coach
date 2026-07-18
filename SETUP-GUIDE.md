# Setup, testing and deployment guide

## 1. Local development

```bash
unzip population-genetics-coach-v0.1.0.zip
cd population-genetics-coach-v0.1.0
nvm use 22
npm install
cp .env.example .env.local
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

Run validation:

```bash
npm run typecheck
npm run build
npm run preview
```

## 2. Create a new Supabase project

1. Create a new project in the Supabase dashboard. Do not reuse Ecology Coach production tables unless you intentionally want shared users.
2. In **Project Settings → API**, copy the project URL and publishable/anon key into `.env.local`.
3. Install the Supabase CLI and log in:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

4. In SQL Editor, verify the course row exists and create the active semester:

```sql
insert into public.semesters(course_id,name,start_date,end_date,status)
select id,'WS 2026/27','2026-10-01','2027-03-31','active'
from public.courses where slug='population-genetics';
```

### Automatic enrolment logic

The migration creates an auth trigger:

- approved university domains are assigned to the active semester;
- all other users are assigned to the same course with `semester_id = null`;
- account type defaults to `student`;
- coordinators/admins are promoted manually in `profiles` and `course_members`.

Update the domain list in the migration before production if needed.

## 3. Integrate Gemini securely

Never place a Gemini API key in `VITE_*` variables or browser code.

Set the key as an Edge Function secret:

```bash
supabase secrets set GEMINI_API_KEY='YOUR_GEMINI_API_KEY'
supabase functions deploy ai-tutor
supabase functions deploy lesson-evaluator
```

The app currently shows a local first-version tutor response. To call the deployed function, replace the local `send()` body in `src/App.tsx` with a `supabase.functions.invoke('ai-tutor', { body: { message, mode, history } })` call.

Recommended Gemini model in the included function: `gemini-2.5-flash`. Keep the system prompt restrictive and send only original derived lesson context—not raw books, lectures, answer keys, or student reports.

## 4. Create the GitHub repository

Create an empty repository, for example:

```text
population-genetics-coach
```

Then:

```bash
git init
git branch -M main
git add -A
git commit -m "Create Population Genetics Coach first version"
git remote add origin git@github.com:YOUR_ACCOUNT/population-genetics-coach.git
git push -u origin main
```

Before committing, verify:

```bash
git status --short
git ls-files | grep -Ei '\.(pdf|pptx|docx|zip)$' && echo 'STOP: source material detected'
```

The repository must not contain uploaded lectures, books, exercises, solutions, practical files, student reports, data, or instructor pipelines.

## 5. Configure GitHub secrets

Repository → **Settings → Secrets and variables → Actions**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Do not add the Gemini key to GitHub Pages. It belongs only in Supabase Edge Function secrets.

## 6. Publish with GitHub Pages

Repository → **Settings → Pages → Source: GitHub Actions**.

The included workflow builds and deploys after every push to `main`.

Because Vite uses `base: './'`, the build works under a repository subpath. Test the deployed authentication callback URLs and add the Pages URL in Supabase Auth → URL Configuration.

## 7. Production test checklist

- Desktop and mobile navigation
- dark mode
- all routes and lesson links
- local and authenticated progress persistence
- institutional versus external automatic assignment
- active-semester rollover
- student/coordinator/admin authorization
- Gemini quota and error handling
- RLS policies with two test users
- no private files in `dist/`, Git history, Pages artifact, or function bundle
- accessibility: keyboard navigation, focus visibility, labels and contrast

## 8. Next content pass

Only add content after source auditing. For every lesson, store a private source map outside Git with lecture subsection, exercise/practical source, exact notation, assumptions, textbook enrichment, and reviewer status. Student projects may inform question/hypothesis patterns only.
