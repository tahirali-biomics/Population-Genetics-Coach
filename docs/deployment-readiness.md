# Deployment readiness

This release contains the 26 enriched lessons,264 versioned scored questions,78 formative prompts, safe mathematical rendering, historical-assessment compatibility and Phase 4 attempt-level presentation randomization. This preparation did not change curriculum or assessment keys and did not repeat the scientific audit.

## Checks and interface fixes

- A release regression confirms every lesson route supplies `l.assessment` to the quiz, all264 current IDs are lesson-scoped v2 IDs, and the original archive is used only for review.
- The student transfer panel now displays a short heading and a concise application task. The full authored reference remains in the evaluator request; it is not displayed as a heading. Compact workspace/exam interfaces remain unchanged.
- Tutor retrieval uses whole tokens, scientific aliases (including MK,LD,NI,WF,dN/dS), explicit topic priorities and a positive relevance threshold. MK/LD and weighted-versus-pooled-alpha regression cases select the relevant authored theory extension. Ambiguous D and unmatched queries do not select arbitrary completed lessons.
- Phase 4 persistence, randomized question/option presentation, canonical grading and historical review regression tests continue to pass.
- **37 automated tests pass**, along with TypeScript, production build and diff whitespace checks. The build retains the large-chunk warning (approximately1,659.21 kB minified /420.27 kB gzip).
- Reviewed files contain no detected private-key/token patterns or literal private environment credentials. Private teaching sources, `.env` files, migrations and the pre-existing untracked `supabase/.gitignore` are excluded. Original archive, lesson ordering, workspace/glossary structures and protected migration/ignore hashes remain intact.

## Established deployment workflow

`.github/workflows/pages.yml` deploys the frontend on a push to `main` or workflow dispatch. It builds using existing GitHub Secrets for the Supabase URL and publishable key, uploads `dist`, and deploys to GitHub Pages. The previously successful production URL is:

https://tahirali-biomics.github.io/Population-Genetics-Coach/

The linked local Supabase project and configured frontend host both identify `dpftoriqsefbotcfxuxw`. The updated `ai-tutor` Edge Function must also be deployed to that project so the production tutor consumes the supplied authored context. The unchanged lesson evaluator already accepts the task/reference prompt. No SQL migration or production-data reset is part of deployment.

## Current access blocker

The Supabase CLI access check returned **Invalid access token**. No function deployment or frontend production update was attempted after that failure. GitHub access is available, and its current main head matched the local pre-release base during preparation.

Restore Supabase CLI authorization locally with `supabase login` (do not paste credentials into chat), then recheck access. Once access is restored, deploy the reviewed ai-tutor function and publish the reviewed frontend commit through the existing Pages workflow. Verify the completed workflow and production assets before declaring the enriched lessons/randomization live. This document is a readiness record, not proof of a new production deployment.

## Remaining verification limits

Authenticated browser inspection with an existing login and actual LLM replies remain to be exercised after deployment. Unfinished assessment attempts resume only in the same browser profile/origin; completed snapshots use existing answer JSON and preserve recorded scores. Source-specific instructor-review items remain documented in the scientific audit. Neither frontend deployment nor function deployment requires changing student records, roles, enrollment or database schema.
