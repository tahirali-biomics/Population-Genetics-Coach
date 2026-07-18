# v1.0 release and beta deployment

## 1. Install and validate locally

```bash
cd ~/github-build/population-genetics-coach-v1.0.0
nvm use 22
npm config delete proxy
npm config delete https-proxy
npm config set registry https://registry.npmjs.org/
rm -rf node_modules
npm install
cp .env.example .env.local
npm run dev -- --port 5180
npm run typecheck
npm run build
```

## 2. Create and link Supabase

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

In Supabase Authentication, enable the email provider and email confirmation. Set the site URL to the final GitHub Pages URL and add both local and production redirect URLs.

## 3. Configure Gemini

Create a Gemini API key in Google AI Studio and store it only as a Supabase secret:

```bash
supabase secrets set GEMINI_API_KEY='YOUR_GEMINI_API_KEY'
supabase functions deploy ai-tutor
supabase functions deploy lesson-evaluator
```

Do not put the Gemini key in frontend environment variables or GitHub Actions.

## 4. Configure roles

Register and confirm the app-manager email, then run:

```sql
update public.profiles
set role = 'app_manager'
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

For a coordinator:

```sql
update public.profiles
set role = 'coordinator'
where id = (select id from auth.users where email = 'COORDINATOR_EMAIL');
```

Coordinator analytics remain inaccessible to guests and students. Internal source provenance is visible only to `admin` and `app_manager`.

## 5. Frontend environment

`.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_PREVIEW_UNLOCK_ALL=false
```

## 6. GitHub release

```bash
git init
git branch -M main
git add -A
git commit -m "Release Population Genetics Coach v1.0.0"
git remote add origin git@github.com:YOUR_ACCOUNT/population-genetics-coach.git
git push -u origin main
```

Before pushing, verify that no private teaching files are tracked:

```bash
git ls-files | grep -Ei '\.(pdf|pptx|docx|zip)$'
```

The command should return nothing.

## 7. GitHub Pages

Add repository Actions secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Select **Settings → Pages → Source → GitHub Actions**. The included Pages workflow deploys `dist` after pushes to `main`.

## 8. Release checks

Test:

- guest overview access;
- confirmed general learner access;
- invited student semester membership;
- coordinator analytics protection;
- app-manager source controls;
- lesson assessment storage;
- progressive 60-mark mock exam;
- microphone input and speech output on desktop and mobile;
- Gemini tutor and lesson-evaluator responses.
