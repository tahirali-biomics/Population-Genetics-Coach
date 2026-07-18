# Beta deployment: GitHub Pages + Supabase + Gemini

## 1. Local validation

```bash
nvm use 22
npm config set registry https://registry.npmjs.org/
rm -rf node_modules
npm install
npm run typecheck
npm run build
npm run dev
```

Local preview intentionally unlocks learner content when `VITE_PREVIEW_UNLOCK_ALL` is not set to `false`. Coordinator analytics remain role-protected.

## 2. Create the Supabase project

1. Create a new Supabase project.
2. Copy the project URL and publishable/anon key.
3. Install and authenticate the CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migrations create profiles, courses, semesters, enrolments, lesson attempts, workspace progress, and concept mastery.

## 3. Authentication and email confirmation

In Supabase Dashboard:

- Authentication → Providers → Email: enable Email provider.
- Enable **Confirm email** for beta accounts.
- Authentication → URL Configuration:
  - Site URL: your GitHub Pages URL.
  - Redirect URLs: add the same GitHub Pages URL and your local URL, e.g. `http://localhost:5173/**`.

General users register and confirm their email before learner content is available in production. University students can be invited or auto-enrolled through the configured domain/semester migration logic.

Promote your own account after registration:

```sql
update public.profiles
set role = 'app_manager'
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

Use `coordinator` for teaching staff who should see analytics but not internal app-manager source controls.

## 4. Gemini activation

Create a Gemini API key in Google AI Studio. Store it only in Supabase:

```bash
supabase secrets set GEMINI_API_KEY='YOUR_GEMINI_API_KEY'
supabase functions deploy ai-tutor
supabase functions deploy lesson-evaluator
```

Do not place the Gemini key in `.env.local`, GitHub secrets used by the frontend, or committed files.

The beta voice workflow is:

- browser microphone → speech-to-text;
- text → Supabase Edge Function → Gemini;
- Gemini response → browser read-aloud.

This provides voice interaction without exposing the Gemini key. It is not the consumer Gemini Live mobile application and is not a persistent streaming audio session.

## 5. Local Supabase configuration

Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_PREVIEW_UNLOCK_ALL=false
```

Restart Vite after changing environment variables.

## 6. Create and push the GitHub repository

```bash
git init
git branch -M main
git add -A
git commit -m "Release Population Genetics Coach v1.0.0"
git remote add origin git@github.com:YOUR_ACCOUNT/population-genetics-coach.git
git push -u origin main
```

Before committing, confirm that private teaching files are absent:

```bash
git ls-files | grep -Ei '\.(pdf|pptx|docx|zip)$'
```

This should return nothing.

## 7. GitHub repository secrets

Repository → Settings → Secrets and variables → Actions → New repository secret:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Do not add `GEMINI_API_KEY` to GitHub Pages; it belongs in Supabase secrets.

## 8. Enable GitHub Pages

Repository → Settings → Pages → Source → **GitHub Actions**.

The included `.github/workflows/pages.yml` builds on every push to `main` and deploys `dist/`.

## 9. Beta acceptance checks

Test with four account states:

1. Guest: sees overviews only in production and never sees coordinator analytics.
2. Confirmed general learner: can access learner content but has no active university semester.
3. Invited university student: can access learner content and belongs to the active semester.
4. Coordinator/app manager: coordinator analytics are available; only app manager/admin sees internal source-administration notices.

Also test microphone permission, dictation, read-aloud, lesson evaluation, mock-exam evaluation, mobile navigation, and tablet layout.
