# Phase 3 independent scientific and application audit

Review date: 14 October 2026. Repository branch: `feature/lecture-content-enrichment`. This review started from the existing, uncommitted enrichment; those changes were preserved. No commit, push, deployment, production query, or production write was performed.

## Overall assessment

**The mathematical core is substantially sound, but the application should not yet receive unconditional student-release approval.** All 26 authored lessons and all 264 scored items were read, including their equations, examples, explanations, formative solutions, objectives and source references. No incorrectly indexed MCQ key or incorrect true/false key was identified under the taught models. One small lesson rounding error and an inherited, mathematically impossible mock-exam dataset were corrected. Independently derived checks support the particularly sensitive coalescent, MK, time-scaling, waiting-time, Tajima, LD, F-statistic and likelihood results.

Two release-critical concerns remain: every MCQ bank reveals the same correct-option cycle, and the lesson transfer activity displays thousands of characters of AI reference material as an unformatted heading. Tutor retrieval also fails on ordinary scientific abbreviations and some specific mathematical queries. These are observed defects, not hypothetical risks. The narrow correction policy was applied: this audit corrected numerical content, versioned the corrected unscored mock activity and added focused mathematical regression tests; it did not redesign assessments, alter objectives, change stored option meanings, or undertake an AI/UI redesign.

Classification: **VERIFIED** means the stated check was actually completed; **CORRECTION REQUIRED** means a demonstrated defect needs a concrete correction; **INSTRUCTOR REVIEW** means teaching judgment, source clarification, or an unperformed integration check remains. A finding's severity is separate from its classification. A corrected finding retains its original classification in the correction log and records its final VERIFIED state.

## Evidence and limits

- The private README, Phase 1 audit, concept inventory, coverage matrix and scientific-decision record were read as orientation. Their previous conclusions were not accepted as independent proof.
- The supplied Hahn PDF is readable. Relevant chapter/page references were checked against actual pages, using printed page +19 for physical PDF numbering. Direct checks included printed pp.5,17–24,49,52–53,60–61,70–71,118–121,127,133,161–162,192–194,217–218; surrounding cached extracted chapter text supplied context. Chapter 4 supports T1 and chapter 7, with chapter 8, supports T2.
- Current lecture source pages were re-extracted directly from the PDFs for diversity, WF/Moran, hierarchical structure, coalescence, selection, demographic inference and ecological genomics. Checks included L1 pp.16–19,26; WF/Moran pp.29,38,42,48; subdivision pp.14,18,26,37; coalescent pp.40,58,61,70,87; selection pp.3,8,13–14,28,31,35,39; demographic pp.24,28,30,32,36,40,45,48,53,61; ecological genomics pp.6,16,27,29,33,38. Image-only fastsimcoal likelihood and Hahn Eq.7.19 were also rendered and inspected visually in this review. Historical material remains supporting evidence.
- Recalculation used fresh arithmetic, exact combinatorics, numerical integration, explicit merger-history enumeration, and an independent SciPy Fisher test. Existing passing tests were checked against these calculations rather than used as scientific authority.
- This was **not** a new page-by-page visual authentication of every supplied image, an audit of every textbook chapter, or an independent replication of the underlying empirical studies. The existing coverage matrix is provenance, not proof that every figure annotation is now resolved. Fine empirical annotations remain qualified below.
- Local tests exercise mathematical examples, data structure, assessment compatibility and actual React Markdown/KaTeX server rendering. Authenticated browser flows, live Supabase RLS, remote enrollment, production progress writes, Deno execution and actual LLM replies were **not exercised**. Prior mobile-browser results were not rerun or counted as independent browser verification here.

## Critical findings before release

### A1 — CORRECTION REQUIRED: deterministic MCQ answer-position cue

**Location:** `src/courseData.json`, all 26 `lessons[*].assessment` arrays; individual IDs and exact lines are in [phase3-question-audit.csv](phase3-question-audit.csv). Example: `l1-allele-genotype-v2-1` onward, beginning at line 340. Rendering preserves array order at `src/App.tsx:565`.

Every lecture lesson has the correct-position sequence **A,B,C,D,A,B**. Each extension has **A,B,C,D,A,B,C,D**. Across 160 MCQs the counts are A=52, B=52, C=28, D=28. A student who recognizes the cycle can answer every MCQ without population genetics. Varied positions alone, as described in `docs/lecture-content-enrichment.md:44`, do not establish absence of cues.

**Action:** choose a nonpredictable, audited option distribution or a presentation-time permutation mapped back to canonical stored indices. Do not reorder persisted option meanings under unchanged IDs. If changing the authored order, archive the current v2 bank and issue a new version; `assessmentArchive.json` currently preserves the original bank, not a v2 snapshot. Verify history restoration, display and scoring after any change. No option reorder was performed in this audit.

### P1 — CORRECTION REQUIRED: reference context shown as the transfer-task heading

**Location:** `src/App.tsx:749` passes `l.aiPrompt`; `src/App.tsx:1317` renders the entire prompt in `<h4>`. All `lessons[*].aiPrompt` values in `src/courseData.json` are affected.

The enriched prompts contain 4,867–12,513 characters of reference sections, worked examples, Markdown and LaTeX. They are useful model context but are displayed as one plain-text heading rather than a student task. Consequently the transfer panel repeats much of the lesson, exposes raw math syntax, and asks an evaluator to judge a draft without a bounded, specific application task. The ordinary lesson renderer's math checks do not cover this heading.

**Action:** separate the visible, concise existing learning task from reference context sent to the evaluator; preserve workspace activity behavior and test the actual lesson transfer panel. Instructor judgment is needed for the task wording. No task objectives or UI architecture were changed in this audit.

## Major scientific and pedagogical concerns

### E1 — CORRECTION REQUIRED: tutor retrieval misses scientific abbreviations and aggregation questions

**Location:** `src/courseContext.ts:8` drops tokens of length two or less; lines 10–15 use substring scores and always select two lessons. The caller is `src/App.tsx:2117`.

Fresh local calls with no completed lessons reproduced:

| Query | Actual selected lesson IDs | Needed scientific context |
|---|---|---|
| `What is LD?` | `l1-allele-genotype`, `l4-fst` | T1 |
| `Explain MK` | `l1-allele-genotype`, `l1-diversity` | T2 |
| `Derive D` | `l1-diversity`, `l1-hwe` | Clarify which D; do not silently assume |
| `Why is weighted alpha different from pooled alpha?` | `l4-fst`, `l1-allele-genotype` | T2 aggregation example |

The Kingman beta-integral query correctly retrieved `l5-theta-diversity` and `l5-k-lineages`; `What is FST?` retrieved the two relevant L4 lessons. This is a specific retrieval defect, not complete failure of the tutor. The supplied-context limit is respected, and all stored lesson AI prompts contain their corresponding sections and example after the rounding correction.

**Action:** test abbreviation/alias handling, relevant mathematical phrases, uncertain single-symbol queries and a minimum relevance threshold. Do not compensate with unsupported generated explanations. Verify actual responses only in an authorized safe integration environment; the current Edge Function changes are undeployed.

### A2 — INSTRUCTOR REVIEW: weak distractors and insufficient transfer difficulty

**Locations:** item-level annotations in the question CSV; examples include `l4-migration-structure-v2-4` (`src/courseData.json:2590`), `l6-fixation-selection-v2-5` (line 3609), and `t1-ld-recombination-v2-6` (line 5245; IDs are authoritative if later formatting moves lines).

Many calculations correctly test one substitution into a taught equation. Several alternatives are impossible quantities, unrelated biological claims or arbitrary nonsense: `V/Z` and `C+V` for PCA scores; sequencing read length as the selection/drift scale; number of MCQ options as information for recovering recombination rate. These do not challenge plausible errors by a university student. False statements often contain “always”, “all”, “exactly” or “proves”, whereas the correct options preserve uncertainty. In 68/160 MCQs the correct option is uniquely longest; this count is a diagnostic, not proof that each of those items is cued.

TF answers are balanced (52 true, 52 false); that balance does not remove obvious wording cues. Several banks reuse short alternating TF patterns. Derivation objectives, alternative-model reasoning and uncertainty interpretation are better developed in the prose than in the scored calculations. Keep useful entry-level checks, but review distractors and replace weak items within the existing teaching objectives; do not add curriculum merely to inflate item count.

Some questions depend on the preceding question or worked example: `l4-wahlund-v2-2`, `l5-coalescent-pairs-v2-2`, `l5-theta-diversity-v2-2`, `l6-fitness-recursion-v2-2`, `t1-ld-recombination-v2-1/2`. They are understandable in the current lesson order but need their own data if later shuffled or reused independently.

### A3 — INSTRUCTOR REVIEW: scored items about unresolved empirical labels

**Locations:** `l6-fitness-recursion-v2-5`, `src/courseData.json:3408`; `l8-selection-demography-v2-9`, line 5061.

Both keys agree with the explicit caveats in the lessons. Nevertheless they assess remembering a disputed cohort total or n/2n wording rather than applying population-genetic reasoning. Keep the uncertainty in the lesson and instructor record; consider using the corresponding scored slot for an unambiguous inference task. Do not silently resolve the source figures to make a new answer appear definitive.

### A4 — INSTRUCTOR REVIEW: rejection wording needs explicit false-positive qualification

**Locations:** `l1-allele-genotype-v2-5`, `src/courseData.json:392`, correct option “At least one specified model or data assumption is inadequate”; related glossary wording at `src/data.ts:102`.

The intended answer is clearly preferable to the other three and the lesson properly rejects a unique selection diagnosis. But the selected option can read as certainty that an assumption failed. A correct null can be rejected by Type I error. Prefer “evidence against the specified model, subject to test calibration and false-positive error.” This is a wording/inference qualification, not an incorrectly indexed answer key. No scientific meaning or stored option index was changed.

### A5 — INSTRUCTOR REVIEW: exact versus conservative test size

**Locations:** `l8-genome-scans-v2-5`, `src/courseData.json:4820`; section “Outliers are candidates under a reference distribution”, line 4711.

The expected count 50 follows linearity if each of the 1,000 null tests has **actual** rejection probability 0.05. A merely valid level-0.05 test can be conservative, especially with discrete data, giving an expectation below 50. State actual size 0.05 in the question and example. Independence is unnecessary for the mean but relevant to the distribution of the count. The keyed number is correct under the intended exact-size assumption.

## Minor improvements and bounded mathematical qualifications

- **S1 — CORRECTION REQUIRED, corrected and now VERIFIED.** `l1-hwe.workedExample` at `src/courseData.json:715` and its mirrored `aiPrompt` at line 736 gave Pearson chi-square 2.94665. Fresh computation gives **2.946638098153251**, rounding to **2.94664** at five decimals. Both strings were corrected. The inference relative to 3.841 and the scored bank are unchanged.
- **S5 — CORRECTION REQUIRED, corrected and now VERIFIED.** The inherited progressive mock exam's “Sequence diversity” task, `src/App.tsx:1443–1447`, specified five sequences, six segregating sites and eight total pairwise differences. Each segregating site contributes at least n−1=4 differences over the ten pairs, so the total must be at least24. Four singleton columns and two doubleton columns give a realizable total28. The prompt now uses28, with pi_locus=2.8 and pi_site=.14 over20 bases. This is an unscored AI-feedback activity, outside the264-question bank. It has `revision:2` and a `-v2` evaluation-context suffix at `src/App.tsx:1659`, leaving earlier conversation records untouched. A constructed alignment regression test verifies realizability and context revision. This defect existed before enrichment; it was discovered while checking workspace consistency.
- **S6 — INSTRUCTOR REVIEW.** The unchanged progressive mock exam's “Selected versus neutral fixation” prompt, `src/App.tsx:1535–1537`, calls an additive benefit s=.005 without saying whether s is the homozygote or heterozygote advantage or whether census N equals Ne. The enriched L6 lesson defines its convention correctly, but a standalone evaluation needs that convention repeated to avoid a factor-of-two dispute. Do not silently choose a convention for old responses.
- **S2 — INSTRUCTOR REVIEW.** Tajima D at `src/courseData.json:4104` explains the S=0 failure but not the n=2/3 degeneracy: all polymorphic classes then have identical pi/thetaW weighting and the usual variance constants vanish. Make the usable sample-size and nonzero-denominator conditions explicit when presenting the standard formula; do not assign a score to an undefined contrast. No taught numerical example uses these invalid cases.
- **S3 — INSTRUCTOR REVIEW.** T1 “Rho, local genealogies and the limits of rate inversion”, `src/courseData.json:5129`, attributes `E[R]=rho a_n` to a reference sampling convention but does not fully describe that convention. Hahn printed pp.70,127 motivates throwing events on a marginal/reference tree. The arithmetic is verified, but this is not a demonstrated count of every event in an unrestricted full ARG. Identify what R counts; do not use it as an exact detectable-event count.
- **S4 — INSTRUCTOR REVIEW.** At T1 “Bounds, D-prime and correlation”, `src/courseData.json:5117`, D'=0 at D=0 is an explicit convention. With a monomorphic margin a normalized association has no information; mention that rather than interpreting the assigned zero as evidence of independence. r² already correctly excludes monomorphic margins.
- **P2 — INSTRUCTOR REVIEW.** All `keyStatement` fields repeat the generic closing sentence about assumptions, units and pattern/process. This is helpful advice but not a replacement for a content-specific synthesis of the actual equations/interpretations. Improve existing summaries, without adding new concepts, if instructor review finds that recall needs a sharper target.
- **E2 — INSTRUCTOR REVIEW.** `supabase/functions/ai-tutor/index.ts:190/230` accepts client-supplied reference text and places it in the system instruction. The instruction tells the model to treat it as reference, but that is not a verified trust boundary against a modified client. `lesson-evaluator/index.ts:29–48` similarly combines reference and student text. No authentication bypass was demonstrated, and gateway JWT/enrollment enforcement was not tested. Before release, verify source-context integrity and prompt-injection behavior in a safe environment; do not claim runtime AI safety from static checks alone.
- **E3 — VERIFIED with performance limitation.** Production build succeeds, but the main JS chunk is approximately **1,649.21 kB** minified / **416.74 kB** gzip and triggers Vite's size warning. Actual low-bandwidth performance was not measured; this is not a build failure.

## Independently recalculated examples and derivations

Values below were recomputed without treating the existing numeric tests as authoritative. Stated decimal precision is checked, not enforced as exact biological precision.

| Lesson/model | Independent calculation | Result and assessment |
|---|---|---|
| L1 allele sample | (2×28+32)/160; sqrt(0.55×0.45/160) | p=0.55; SE=0.0393303. VERIFIED under independent-copy sampling. |
| L1 diversity, n=6 | pair numerator=45, pairs=15; a6=137/60 | pi=3; thetaW=420/137=3.06569343; thetaH=3. VERIFIED. |
| L1 singleton variants | folded count=4; 4×5/6; multiton denominator=77/60 | eta=10/3; thetaW_multi=240/77=3.11688312; corrected pi_multi=3. VERIFIED. |
| Joint-SFS scaling | 0.9×10000,0.1×10000; 6000/20000; 20000×0.0001 | sizes 9000/1000; tau=0.3; migration parameter=2; theta_site=0.0004. VERIFIED model translation, not migrant count. |
| HWE | expected 24.2,39.6,16.2; sum (O−E)²/E | 2.946638098153251; rounding corrected to 2.94664. |
| Drift variance | 0.25/100; 0.25/1000; 0.25[1−0.99^100] | SDs 0.05 and 0.0158114; replicate variance 0.158492. VERIFIED. |
| Neutral waiting, Ne=100,x=.2 | solve generator a''=−400/[x(1−x)] with zero endpoints | absorption=200.1609694; conditional fix=357.0296821; loss=160.9437912 generations. VERIFIED diffusion means. |
| Sojourn density | integrate 320/(1−y) on (0,.2), 80/y on (.2,1) | total=200.1609694; interval [.5,.6]=14.5857245 generations. VERIFIED. |
| Diversity decay | .5(.995)^50; ln(.5)/ln(.995) | 0.38915628; half-life=138.282573 generations. VERIFIED. |
| Variable size | 4/(3/100+1/10); (.995)^3(.95) | harmonic=30.7692308; retained fraction=.93582113125. VERIFIED; log approximation qualified. |
| WF, M=6,i=4 | binomial mass at j=4,0,6 | 240/729,1/729,64/729; eventual fix=2/3. VERIFIED distinctions. |
| Founder M=2 | multiply three-state matrix twice | (3/8,1/4,3/8); heterozygote at t20=2^−20. VERIFIED. |
| Moran event, M=6,i=4 | enumerate (+1,0,−1) probabilities | 2/9,5/9,2/9; frequency variance=1/81; expected H=34/81. VERIFIED. |
| Moran six-event variance | iterate changing-state variance or diversity multiplier | .06451703299, distinct from leading .07407407407. VERIFIED. |
| Moran versus WF clock | pair hazard=2/M² versus 1/M | means M²/2 events=M/2 turnovers versus M WF generations. VERIFIED. |
| Neutral clock | (20000×10^−8)×(1/20000) | 10^−8/site/generation; .01 over 10^6 sites. VERIFIED long-run rate. |
| Weighted Wahlund | pooled p=.65; variance=.0675 | HS=.32, HT=.455, deficit=.135; genotypes .49,.32,.19. VERIFIED. |
| F statistics | two-deme ratio; third p=65/120; complement product | FST=.015873016 and .020123839; FSR=.1,FRT=.3 → .37. VERIFIED. |
| Migration/island | .9(.8)+.1(.2); 1/(1+4×500×.002) | p'=.74; model FST=.2. VERIFIED with equilibrium conditions. |
| Source PCA covariance | C=(1/3)I−(1/12)J | eigenvalues 1/3,1/3,1/12; explained fractions 4/9,4/9,1/9. VERIFIED algebra; rotations of tied axes allowed. |
| Pair coalescence | c=1/20000; geometric variance=(1−c)/c² | mean 20000; variance 399980000; expected 1000-base differences=.4. VERIFIED. |
| Five-lineage height | sum scaled means .1,1/6,1/3,1; sum their squared means | height=3200; variance=4595555.55556; SD=2143.72469. VERIFIED for Ne=1000. |
| Total branch exposure | 4000×a5 with a5=25/12; theta=4 | length=8333.3333; E[S]=8.3333333; E[pi]=4. VERIFIED. |
| Historical n10,S50 | 50/a10; multiply by 1+1/9 | fitted thetaW=17.67428812; expected folded singletons=19.63809791. VERIFIED plug-in expectations. |
| Fitness normalization | weighted sum .16+.432+.288; (.16+.216)/.88 | mean=.88; p'=.4272727273; normalized genotypes sum to one. VERIFIED. |
| Viability/overdominance | survival .6,.8,.4 → reference .75,1,.5 | p*=.5/(.5+.25)=2/3. VERIFIED original, staged example. |
| Selected Moran | geometric fixation sum at M=100 | r=2,1.1,1.01,1,.99,.9 → .5,.0909156883,.0157086566,.01,.0058319953,.00000295134494. VERIFIED. |
| WF weak selection | (1−exp(−.02))/(1−exp(−400)) | .01980132669; s is heterozygote benefit. VERIFIED approximation. |
| Mutation–selection | sqrt(10^−6/.01); 10^−6/(.5×.01) | recessive q=.01; additive q=.0002; exact recessive loss=9.9000099×10^−7. VERIFIED approximations. |
| Demographic SFS | weighted numerator 48/15; divide by 23 | pi_locus=3.2, pi_site=.139130435; folded counts 3,3,1. VERIFIED. |
| Tajima normalization | recompute a1,a2,b1,b2,c1,c2,e1,e2 | e1=.0190605338,e2=.00494892777; SD=1.503929263; D=−1.3762051835. VERIFIED. |
| CCR/hazard | 2(.00001)/(.00005+.00005); 1/[2(.00005)] | CCR=.2; Ne=10000 only in the panmictic pair model. VERIFIED. |
| Composite likelihood | 96 ln(.95)+4 ln(.05)+3 ln(.75)+ln(.25) | −19.1564259339; class ratio of totals=8/40=.2 versus average ratios=.3. VERIFIED. |
| Model comparison | 2k−2ell for (3,−120),(6,−116) | AIC 246/244; weights .268941421/.731058579. VERIFIED heuristic, not posterior. |
| Sweep contrast | xi1=4,xi5=2 at n6 | pi=2,thetaW=2.62773723,thetaH=3.6; raw H=−1.6. VERIFIED. |
| Sweep escape | exp(−.01×20),exp(−.1×20) | .818730753 and .135335283. VERIFIED given trajectory/hazard approximation. |
| QTL LOD | known group means 1,5; null mean3; RSS 4,28 | 3log10(7)=2.53529412; fitted likelihood ratio343. VERIFIED; no scan P value inferred. |
| Reciprocal transplant | compare origins within site | local advantages .3 at A, .4 at B; equal origins within a site give no local advantage. VERIFIED design reasoning. |
| T1 haplotype metrics | margins .6,.5; D=.36−.30; denominator=.06 | D=.06,D'=.3,r²=.06. VERIFIED. |
| T1 decay/map | .06(.9)^10; .06(.9)^20; ln(.5)/ln(.9) | D10=.0209207064;r²10=.00729459928; half-life6.57881348 generations. VERIFIED. |
| T1 scaled LD | rho=4×10000×.001; Hahn n50,rho10 expression | rho=40; finite-sample approximation=.0983623079 versus heuristic .0909090909. VERIFIED conditional approximations. |
| T2 opportunities/divergence | (9/900)/(6/300); JC at mismatch .1 | omega=.5; raw count ratio1.5 is different; JC=.107325633. VERIFIED. |
| T2 MK table | ratios .25,.5; four independence expectations | NI=.5,alpha=.5; chi-square4.888888889; Fisher two-sided .0332128656286. VERIFIED. |
| T2 haplotypes | .6²+.3²+.1²; (ln4−.2)/.5 | plug-in EHH=.46;iHS=2.372588722; one iHH interval=.00146 Morgans. VERIFIED stated sign/sample conventions. |

### Kingman frequency-spectrum derivation — VERIFIED

At k lineages, randomly ordering the exchangeable ancestral blocks gives positive descendant-size compositions. Counting compositions with one branch of size i gives `E[A_ki]=k C(n−i−1,k−2)/C(n−1,k−1)`. Waiting intervals are independent of merger-pair choices. Multiplication by `4Ne/[k(k−1)]` yields the sum stated in `l5-theta-diversity`, section “Optional derivation of the 1/i spectrum”, `src/courseData.json:3106`.

Independently, the beta integral has exponents k−2 and n−k, giving factorial ratio `(k−2)!(n−k)!/(n−1)!`, exactly `1/[(k−1)C(n−1,k−1)]`. With j=k−2 the sum inside the integral is `(1−x)^(i−1) Σ C(n−i−1,j)x^j(1−x)^(n−i−1−j)`. The binomial sum is one; integrating the remaining factor gives 1/i. Therefore `E[B_i]=4Ne/i`, `E[xi_i]=theta/i`. This is a neutral constant-size Kingman result, not an arbitrary-tree identity.

For n=4,i=2, k=2 gives 1/3 and k=3 gives 1/6; multiplying their sum 1/2 by 4Ne gives **2Ne**. A new regression test independently enumerates every labeled merger history for n=4,5,6, accumulating expected branch exposure; it reproduces 4Ne/i without using the composition formula. Equal composition probabilities do not imply equally likely unlabelled final tree shapes.

### MK aggregation — VERIFIED

`src/courseData.json:5368`, “Why apparently adaptive tables can mislead”, matches the visually checked Hahn printed p.162 Eq.7.19. Gene 1 `(PN,PS,DN,DS)=(20,80,40,80)` has alpha .5. Gene 2 `(10,20,20,40)` has alpha 0. The arithmetic mean is **.25**. Weighted numerator contributions are 10 and 20/3; denominator contributions 20 and 20/3. Thus weighted alpha=`1−(50/3)/(80/3)`=**.375**. Pooled counts `(30,100,60,120)` give alpha=`1−3600/6000`=**.4**. None is presented as the guaranteed true adaptive fraction. No correction was needed.

### Time, subdivision and inference distinctions — VERIFIED

Moran event variance is 2pq/M²; M events are a turnover convention, with approximately twice the drift of one WF generation at the same M. Roughly M/2 events match WF drift, and exact finite diversity matching uses the stated logarithm ratio. The fixation probabilities can match while waiting times differ.

The neutral generator has half the frequency variance: x(1−x)/(4Ne). The absorption and conditional-time boundary problems, probability-weighted average, signs and sojourn integral are consistent. All displayed times are explicitly approximate diffusion means, not exact finite-chain means. The original negative-time recap was not reinstated.

FST's variance form, hierarchy complement identity, equal-deme weights, undefined HT=0 case and potentially negative finite estimates are consistent. The isolation and island formulas are qualified approximations, not direct empirical migrant counts. Composite likelihood explicitly conditions its frequency probabilities on polymorphism and recognizes linkage. Ratio of expected branch lengths is correctly separated from mean ratios; `E[exp(−mu B)]` is not replaced by `exp(−mu E[B])`. AIC/LRT support is qualified for composite likelihood, boundaries and model misspecification.

## Lesson-by-lesson verification summary

All rows inherit A1 and P1; a VERIFIED scientific row is not unconditional release approval. Question counts are the number actually reviewed, not evidence of psychometric calibration.

| Stable lesson ID and file location | Questions | Scientific result and remaining qualification |
|---|---:|---|
| `l1-allele-genotype`, courseData:272 | 10 | VERIFIED count/SE and sampling units; INSTRUCTOR REVIEW exchange arrows and A4 rejection wording. |
| `l1-diversity`, :472 | 10 | VERIFIED h,pi,thetaW,folding,singleton corrections and units; finite/infinite-site distinctions retained. |
| `l1-hwe`, :677 | 10 | VERIFIED random-union derivation, allele conservation and tests after S1 rounding correction. |
| `l2-random-sampling`, :878 | 10 | VERIFIED Bernoulli/binomial moments and replicate variance; expectation versus trajectory explicit. |
| `l2-fixation`, :1077 | 10 | VERIFIED martingale probability, diffusion boundaries, conditional means and occupation density. |
| `l2-heterozygosity-ne`, :1279 | 10 | VERIFIED recurrence, products and half-lives; N=1 harmonic approximation explicitly invalidated. |
| `l3-wf-transition`, :1480 | 10 | VERIFIED transition support, normalization, matrix powers and founder exercise. |
| `l3-moran`, :1680 | 10 | VERIFIED independent birth/death, self-loops, finite moments and clock distinctions. |
| `l3-model-comparison`, :1880 | 10 | VERIFIED fixation recurrence, neutral clock and ancestry scaling; selection model distinction retained. |
| `l4-wahlund`, :2082 | 10 | VERIFIED weighted variance, genotype pooling/fusion and recessive example; not medical-risk guidance. |
| `l4-fst`, :2282 | 10 | VERIFIED descriptive and hierarchical ratios, weights and worksheet arithmetic; INSTRUCTOR REVIEW printed threshold. |
| `l4-migration-structure`, :2482 | 10 | VERIFIED mixing/island/PCA eigenvalues; clustering assumptions appropriate; A2 wording/distractors need review. |
| `l5-coalescent-pairs`, :2682 | 10 | VERIFIED geometric/exponential distinction, copy units, branch exposure and mutation interpretation. |
| `l5-k-lineages`, :2882 | 10 | VERIFIED binary-merger limit, height/variance and topology reasoning. |
| `l5-theta-diversity`, :3082 | 10 | VERIFIED Poisson conditioning, total length, variance and independently enumerated 1/i spectrum. |
| `l6-fitness-recursion`, :3287 | 10 | VERIFIED normalization, dominance and equilibrium; INSTRUCTOR REVIEW empirical cohort staging/species label and A3. |
| `l6-fixation-selection`, :3488 | 10 | VERIFIED finite Moran and weak-selection WF formulas, s conventions and numerical table. |
| `l6-mutation-selection`, :3689 | 10 | VERIFIED exact loss/normalization and conditional recessive/nonrecessive approximations. |
| `l7-sfs`, :3890 | 10 | VERIFIED counts, units, information loss and demographic confounding; source histories remain estimates. |
| `l7-tajima`, :4091 | 10 | VERIFIED constants, D, hazards and CCR; INSTRUCTOR REVIEW small-n domain and empirical chronology details. |
| `l7-model-fitting`, :4293 | 10 | VERIFIED conditional likelihood, simulation weighting, AIC/LRT caveats; colonization is not equated with split time. |
| `l8-linked-selection`, :4498 | 10 | VERIFIED trajectory escape, sweep/soft/balanced/background distinctions and diversity contrasts. |
| `l8-genome-scans`, :4699 | 10 | VERIFIED LOD derivation/fit, design assumptions and trait-versus-selection distinction; A5 exact-size qualification. |
| `l8-selection-demography`, :4900 | 10 | VERIFIED transplant logic and demographic alternatives; INSTRUCTOR REVIEW n/2n wording and empirical origins. |
| `t1-ld-recombination`, :5101 | 12 | VERIFIED D bounds, signed D',r²,decay,admixture,map and rate scales; S3/S4 conventions need clearer boundaries. |
| `t2-molecular-selection-tests`, :5339 | 12 | VERIFIED opportunities,MK,Fisher,weighted alpha,JC,EHH/iHS; empirical adaptation needs calibration. |

## Question-bank audit summary

[The 264-row item ledger](phase3-question-audit.csv) identifies each stable question ID, exact source line, type, key, scientific verdict and pedagogical concern. Every MCQ's chosen answer was read against all alternatives and its feedback; every TF statement and explanation was read. Numerical keys were recomputed. There were **160 MCQs and 104 TFs**, not 264 independently demanding quantitative tasks.

No incorrect indexed key was found. A4 and A5 require assumption/wording judgment rather than changing an index. All 160 MCQs inherit the demonstrated A1 cue and therefore require a version-safe presentation correction. No psychometric difficulty, discrimination, reliability or item-response claim is possible without student response data. Student records were not accessed for that purpose.

## Compatibility and application safety

**VERIFIED by local comparison:** all 26 lesson IDs/order and module membership match `git show HEAD:src/courseData.json`; the glossary records and workspaces are structurally unchanged; all 260 archived original questions exactly equal their original lesson banks. The version marker is stored inside existing answer JSON, receives no score and distinguishes blank current attempts from legacy blank attempts. Original scores/denominators are not rescored against new IDs. Current scored responses retain one point per correct answer and distinguish boolean TF values from numeric MCQ indices.

**VERIFIED statically:** persistence functions `syncAttempt`, `syncLessonProgress`, `syncWorkspaceProgress`, `syncConceptMastery` match the pre-enrichment implementation. Outside the unscored exam numerical correction/version noted above, the workspace implementation remains unchanged. Completion remains a separate user toggle (`src/App.tsx:658`); submitting a quiz records an attempt rather than automatically resetting completion. The enrichment diff does not alter authentication, enrollment, role gates or workspace persistence. All five migration hashes, `src/supabase.ts`, workspace guides, repository `.gitignore` and the pre-existing untracked `supabase/.gitignore` match the private baseline. All 16 supplied-source fingerprints match the manifest. Nothing was staged or committed.

**VERIFIED locally:** compatibility fixtures pass for old/current/invalid/blank attempts; archived scores are displayed without recomputation. React rendering rejects raw HTML and unsafe link URLs; course equations parse/render without KaTeX errors and scrolling regions have keyboard access.

**INSTRUCTOR REVIEW / integration verification required:** actual login, beta-user history across accounts, enrollment policies, student/coordinator/admin authorization, live role claims, remote progress synchronization and LLM behavior. Unchanged source and passing fixtures cannot establish that the deployed service or real data behave correctly. The historical review component displays the latest incompatible attempt; the complete persistence history is not rewritten, but broader historical navigation was not redesigned or exhaustively tested.

## Instructor decisions remaining

1. `l1-allele-genotype`, “From a sequenced genome to a testable pattern”, courseData:288: determine source-specific direction/unit meaning of *Arabis* “1/33 gen.” and “1/150 gen.” arrows. No definitive migrant counts are taught.
2. `l6-fitness-recursion`, “Viability inference and the wingfruit slide discrepancy”, courseData:3307: observed sum850, expected sum1225 and displayed total1225 require cohort-stage/species clarification. The original staged example is mathematically consistent and remains separate.
3. `l4-fst`, “Differentiation through time and empirical interpretation”, courseData:2306: printed0.005 boundary is not silently promoted to a universal FST threshold.
4. `l8-selection-demography`, “Amaranth: multiple lines of evidence, several uncertainties”, courseData:4924: source “diploid (16 chromosomes)” does not specify n/2n. Independent domestication and precise demographic chronology remain source-model interpretations rather than independently replicated histories.
5. Approve the version-safe answer presentation correction and the replacement/rewording of the identified weak/scored-label items; determine a concise transfer task aligned to existing objectives. These changes need focused review, not more curriculum.

## Correction log and final checks

The HWE rounding strings were changed in curriculum JSON; the inherited unscored mock-exam numerical total and its activity-context revision were corrected in `src/App.tsx`. Question IDs, option order, answer keys, lesson objectives and empirical qualifiers were not changed. New `scripts/phase3-science.test.mjs` checks the corrected rendered/tutor number, constructs a realizable mock-exam alignment with its separate context revision, independently enumerates Kingman merger histories and verifies distinct MK aggregation targets; `scripts/run-tests.mjs` includes it. New audit outputs are this report and `docs/phase3-question-audit.csv`. Other enrichment files were preserved.

- `npm test`: **25 passed, 0 failed**; JSON/structure validator also passes for26 lessons,264 questions and745 checked LaTeX occurrences. This count includes repeated expressions, not745 distinct verified models.
- `npm run typecheck`: **passed**.
- `npm run build`: **passed**, with the documented large-chunk warning.
- `git diff --check`: **passed**.
- Source/compatibility hash comparisons: **passed** as described above.
- Production/live integration: **not performed**.

Release recommendation: correct A1 and P1, resolve E1 for ordinary course queries, review the scientific/pedagogical qualifications, then exercise authenticated and AI flows in a separately authorized safe environment. Passing mathematical and build checks alone does not close those release gates.
