# Population Genetics Coach v1.0.0

A responsive QBio305 learning platform based on the v0.1 dashboard structure and the authentication, AI, voice, progress, workspace, and coordinator patterns developed from Ecology Coach 2.5.

## Learning architecture

The learning path contains eight modules aligned with QBio305 Lectures 1–8 and two additional theory extensions from Matthew W. Hahn's *Molecular Population Genetics*:

1. Mendelian genetics in natural populations
2. Genetic drift
3. Wright–Fisher and Moran models
4. Population structure and FST
5. Coalescent theory
6. Fate of mutations with selective effects
7. Demographic modelling
8. Signatures of selection in genomes
9. Recombination and linkage disequilibrium
10. Molecular tests of selection

Reproducible analysis, Bash/R workflows, research design, writing, presentation, feedback, and exam preparation are implemented as guided workspaces.

## Local development

```bash
nvm use 22
npm config set registry https://registry.npmjs.org/
npm install
cp .env.example .env.local
npm run dev
```

Production validation:

```bash
npm run typecheck
npm run build
```

## Supabase and Gemini

Set the frontend variables in `.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_PREVIEW_UNLOCK_ALL=false
```

Apply migrations and deploy the two Edge Functions:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set GEMINI_API_KEY='YOUR_GEMINI_API_KEY'
supabase functions deploy ai-tutor
supabase functions deploy lesson-evaluator
```

See `RELEASE-DEPLOYMENT.md` for the complete release workflow.
