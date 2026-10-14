# Lecture content enrichment — implementation and validation

All 26 existing lesson IDs and their ordering are retained: three lessons per lecture, one per theory extension. The content now provides original conceptual explanations, defined mathematical models, assumptions, derivations, worked examples, empirical interpretation, misconceptions, takeaways, unscored recall/application prompts and links to the existing practical/project/analysis/presentation workspaces. Existing glossary records and workspace structures are unchanged.

The private page-level coverage ledger is `private-course-materials/audit/slide-to-lesson-coverage.csv`. It retains Phase 1 findings and adds implementation evidence, verified Hahn references and review decisions. Its 702 rows account for the supplied slide pages/counterparts, historical and duplicate versions, cross-lesson/extension links, workbook sheets and 47 textbook reference ranges. Row counts are not counts of independent concepts or claims that every textbook topic was taught. The original Phase 1 matrix is preserved separately in the ignored audit directory.

## Scientific scope and provenance

Current slides establish the lecture curriculum; Hahn provides deeper explanations and resolves notation. Source references in each lesson distinguish printed textbook pages from physical PDF pages (printed p corresponds to PDF p+19). The supplied textbook's contents and relevant equation pages were inspected; chapter references were not inferred from app labels.

| Module | Main mathematical/conceptual additions | Hahn foundation |
|---|---|---|
| L1 | Genome-to-summary workflow; count frequencies; corrected sample heterozygosity; locus/site diversity; Watterson, folded/derived-singleton and high-derived estimators; joint-SFS scaling; full HWE derivation | Chapters 1–3, with later coalescent context |
| L2 | Sampling moments; fixation, absorption and conditional times; neutral backward equation/sojourn density; diversity recurrence, half-life and variable-size products/harmonic approximation | Chapters 1, 7, 9; explicitly identified Kimura–Ohta corrective framework |
| L3 | Exact finite WF matrix, founder exercise, Moran event moments/decay; event versus turnover scaling; birth–death fixation recurrence; mutation/substitution clock; ancestry bridge | Chapters 1 and 7 |
| L4 | Weighted Wahlund variance; regional FSR/FRT/FST; worksheet calculations; isolation and island assumptions; PCA centering/covariance/eigensystem/projection/reconstruction; ancestry clustering | Chapter 5 |
| L5 | Exact pair waiting; Kingman limit and merger assumptions; topology/height/variance; Poisson mutations; total length; derivation of the 1/i spectrum and expected pi | Chapter 6; Chapter 3 variance support |
| L6 | Fitness normalization/dominance; qualified viability inference; overdominance; exact selected Moran and approximate WF fixation; specified s conventions; mutation–selection fluxes | Chapters 1 and 7 |
| L7 | Single/joint spectra; inference families; fully normalized Tajima contrast; HMM/coalescence hazards/CCR; composite likelihood and simulated branch probabilities; AIC/LRT and island histories | Chapters 3, 8, 9 |
| L8 | Hard/soft/partial and balanced/linked selection; scan calibration; ecological genomics and omics; top-down/bottom-up discovery; QTL/GWAS/BSA, normal-model LOD; trait and functional validation | Chapters 8–10 |
| T1 | Haplotype constraints; D, signed D-prime, r², decay/map units; admixture/regional LD; rho/ARG; four-gamete bounds; rate inference and conversion | Chapter 4, printed pp.59–78 / PDF pp.78–97; Chapters 5–6 connections |
| T2 | Coding opportunities and dN/dS; divergence corrections; MK expectations/test, NI/alpha and aggregation; DFE/constraint caveats; HKA/spectrum/haplotype tests | Chapter 7, printed pp.131–164 / PDF pp.150–183; Chapter 8, printed pp.171–201 / PDF pp.190–220 |

The L7 middle lesson keeps `l7-tajima` but broadens its title to include coalescent demographic histories. Lecture 8 includes the ecological-genomics, trait-mapping and LOD material actually present in its slides, as well as selection theory in the selection deck. Misleading filenames and internal slide lecture numbering do not determine app placement.

## Corrections and qualified source details

- Copy counts are explicit: M is sampled haploid units, usually 2N for diploid autosomes. The joint-SFS gallery's migration M is separately named and uses its stated 2NA m convention.
- Sample heterozygosity has the finite-sample correction. Locus and per-site quantities are not mixed; missingness and callable denominators are stated.
- Hahn verifies that the corrected singleton estimator uses **folded** singleton counts, while the derived-singleton estimator uses a different normalization. Filtering and polarization assumptions are explicit.
- WF support and Moran self-loop labels are corrected. Exact finite-event Moran results are separated from leading generation-scale shorthand, with explicit time conversions.
- Negative time expressions are replaced by positive, defined absorption/conditional means derived from the neutral backward equation. Fixation, loss, occupation time and retrospective age are not conflated.
- Tree height and summed branch length are distinct. Multiple-merger approximations, interval/topology independence and mutation counts conditional on branch lengths are explained.
- Fitness-weighted contributions are normalized. The approximation 2s uses a defined heterozygote-advantage convention; homozygote-effect and census/effective-size changes are translated explicitly.
- Tajima D uses a standard deviation; balancing selection is not described as a sweep. FST is not a direct migrant count, and a statistical rejection is not proof of adaptation.
- Composite likelihood uses conditional frequency-class probabilities. Genealogical parameter dependence, ratio-of-expectations and uncertainty calibration are explicit; likelihood is not posterior probability and AIC weights are not truth probabilities.
- The image-only LOD equation and its fitted-parameter subscripts were re-read at higher resolution and derived under the normal phenotype model. It is a QTL support statistic, not a molecular selection test.
- D-prime uses an explicit signed convention; textbook magnitude/sign presentation is identified. Haplotype-test sign and sampling conventions are also stated.

Nonblocking instructor review remains for the source-specific *Arabis* exchange-arrow labels, the wingfruit cohort/species labels and inconsistent totals, the printed differentiation-threshold boundary, the amaranth n/2n wording, and some fine empirical map/article-panel labels. These are qualified in content or the private ledger. No definitive estimates are inferred from ambiguous labels. Core equations are supplied using verified conventions and consistent original examples. **This report does not claim every unresolved empirical graphic annotation has been fully resolved.**

## Assessment and historical-record compatibility

The old bank was dominated by repeated generic prompts, first-option cues and weak feedback. All 260 old questions were audited and retired intact into `src/assessmentArchive.json`. The revised bank has **264 versioned questions**: six MCQ plus four true/false questions per lecture lesson; eight MCQ plus four true/false questions in each extension. It adds calculations, assumptions, biological interpretation and evidence critique, with worked feedback and varied correct-option positions. The private assessment review ledger has a disposition for each old and new question.

New scientific meanings use new lesson-scoped `-v2-` IDs. Stored beta-user answers, scores, denominators, lesson completion and attempts are not migrated, deleted or reset. On a revised bank, an old attempt is shown as an earlier-bank result rather than prefilled or rescored against new questions. Its original questions remain available for historical review. New attempts include a question-set marker inside the existing answers JSON, allowing even an unanswered zero-score submission to be restored safely without changing the schema. This marker receives no points. Current-bank attempts retain the existing one-point-per-correct-answer scoring, numeric MCQ indices and boolean true/false answers. Quiz labels now derive counts from the actual bank.

Supabase schema/migrations, enrollment, authentication, permissions, concept/workspace records and progress persistence functions are unchanged. No production queries/writes, deployment, push or commit were performed. The pre-existing untracked `supabase/.gitignore` was left untouched.

## Engineering and verification

- Reusable authored-content Markdown renders math, tables and links without raw HTML. Long display equations and tables scroll locally; practice solutions use keyboard-operable native disclosure controls. Explicit LaTeX avoids the legacy text-to-LaTeX substitution path.
- Lesson AI prompts include the taught assumptions, models, examples and sources. The general tutor receives a bounded local selection of authored lesson excerpts; no private source document is transmitted. The Edge Function consumes those excerpts as reference material, with a missing-coverage instruction. This code is **not deployed**; live tutor integration still requires the normal separately authorized deployment/testing process.
- `npm test` validates JSON shape, lesson/module ordering, question IDs/types/options/keys, Markdown delimiters and strict KaTeX parsing. It runs independent numeric checks for model/example calculations, scoring/version restoration tests, tutor-context tests and actual React/Markdown rendering across lessons, including unsafe-link/raw-HTML checks.
- `npm run typecheck` and `npm run build` pass. Vite retains a large-chunk warning; enriched authored text and the historical bank increase the main bundle. No unrelated code-splitting redesign was introduced.
- Local headless Chrome with explicit device emulation verified authored-content previews at **390px and 1280px** after the sandbox-required escalation. The preview contained 15 display equations and no math errors; six equations scrolled locally at 390px, with page width exactly 390px. This is not a live authenticated student/coordinator session. No live-role or database-write test was performed. `scripts/browser-check.mjs` is an optional local CDP check, separate from the portable automated suite.
- Private baseline comparisons confirm all original lesson IDs/order, module membership, glossary/workspaces, original archived assessment text, migration hashes, ignore files and supplied-source fingerprints are preserved. `git diff --check` passes.

Final validation covers 26 enriched lessons, 78 unscored application prompts, 264 current scored questions and 745 checked LaTeX occurrences (occurrences include repeated expressions, not distinct mathematical models). There are 21 focused automated tests. Detailed source matrices, question dispositions and scientific decisions remain private and ignored.

## Changed files

`src/courseData.json`; `src/data.ts`; `src/App.tsx`; `src/styles.css`; new `src/LessonContent.tsx`, `src/AssessmentHistory.tsx`, `src/assessmentState.ts`, `src/courseContext.ts`, `src/assessmentArchive.json`; `supabase/functions/ai-tutor/index.ts`; `package.json`; new validation/tests under `scripts/`; this report. Private audit artifacts were updated separately and remain excluded from Git.
