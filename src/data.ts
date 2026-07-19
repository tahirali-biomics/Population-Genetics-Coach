/*
 * Population Genetics Coach
 * Copyright © 2026 Dr. Tahir Ali
 * All rights reserved. See LICENSE.
 */

import raw from "./courseData.json";

export type AssessmentQuestion = {
  id: string;
  type: "mcq" | "tf";
  question: string;
  options?: string[];
  answer: number | boolean;
  explanation: string;
};

export type Lesson = {
  moduleId: string;
  moduleIcon: string;
  moduleTitle: string;
  moduleDescription: string;
  id: string;
  title: string;
  lecture: string;
  minutes: number;
  summary: string;
  objectives: string[];
  sections: [string, string][];
  equation: string;
  variables: string[];
  workedExample: string;
  commonMistakes: string[];
  keyStatement: string;
  distractors: string[];
  trueFacts: string[];
  falseFacts: string[];
  aiPrompt: string;
  sourceBasis?: string;
  concepts: string[];
  assessment: AssessmentQuestion[];
};

export type Module = {
  id: string;
  icon: string;
  title: string;
  description: string;
  lessons: {
    id: string;
    title: string;
    lecture: string;
    minutes: number;
    summary: string;
  }[];
};

export type Concept = {
  term: string;
  definition: string;
  lessons: string[];
  mastery: number;
};

export type Workspace = {
  id: string;
  title: string;
  icon: string;
  description: string;
  stages: string[];
};

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Curated course definitions.
 *
 * These replace the generic placeholder sentence previously stored in
 * courseData.json. Keys are normalised, so capitalization and common dash
 * variants do not affect lookup.
 */
const conceptDefinitions: Record<string, string> = {
  population:
    "A group of individuals of the same species that can potentially interbreed and whose allele frequencies are considered together.",
  genotype:
    "The allelic state carried by an individual at one or more loci, such as AA, Aa, or aa at a diploid biallelic locus.",
  "genotype frequency":
    "The proportion of sampled individuals carrying a particular genotype. For a diploid biallelic locus, the three genotype frequencies sum to one.",
  "allele frequency":
    "The proportion of sampled gene copies represented by a specified allele. In diploids, p = (2NAA + NAa)/(2N).",
  "gene copy":
    "One copy of a locus in a sampled genome. A diploid individual normally contributes two gene copies at an autosomal locus.",
  "null model":
    "A formal reference expectation defined by stated assumptions. A departure from the null indicates that the reference model is inadequate, but does not by itself identify the biological cause.",
  "empirical null":
    "A reference distribution estimated from observed or simulated genome-wide data rather than from a simple theoretical distribution.",
  heterozygosity:
    "The probability that two gene copies sampled from a population carry different alleles, or equivalently the expected fraction of heterozygotes under specified assumptions.",
  "observed heterozygosity":
    "The fraction of sampled individuals that are heterozygous at a locus or across a set of loci.",
  "expected heterozygosity":
    "The heterozygosity expected from allele frequencies under random mating; for two alleles it is 2pq.",
  "heterozygote deficiency":
    "Observed heterozygosity below the Hardy-Weinberg expectation. Possible causes include inbreeding, population mixture, genotyping error, null alleles, or selection.",
  "hardy-weinberg equilibrium":
    "The genotype-frequency expectation p², 2pq, and q² produced by random union of gametes at a diploid biallelic locus.",
  "hardy–weinberg equilibrium":
    "The genotype-frequency expectation p², 2pq, and q² produced by random union of gametes at a diploid biallelic locus.",
  "hardy-weinberg":
    "The genotype-frequency expectation p², 2pq, and q² produced by random union of gametes at a diploid biallelic locus.",
  inbreeding:
    "Mating among relatives more often than expected under random mating, increasing homozygosity without necessarily changing allele frequencies immediately.",
  "inbreeding coefficient":
    "A measure of the proportional reduction in heterozygosity relative to the random-mating expectation.",
  "wahlund effect":
    "A heterozygote deficiency caused by combining genetically differentiated subpopulations into one pooled sample.",
  "segregating site":
    "A nucleotide position at which more than one allele is present in the sampled sequences.",
  "nucleotide diversity":
    "The mean number of nucleotide differences per site between two sequences sampled from a population, commonly denoted π.",
  "pairwise difference":
    "The number of nucleotide positions at which two sampled sequences differ.",
  mutation:
    "A heritable change in DNA sequence that creates new genetic variation.",
  "mutation rate":
    "The probability that a specified nucleotide, locus, or genome acquires a mutation per generation.",
  theta:
    "A population-scaled mutation parameter, commonly θ = 4Neμ for diploid autosomal loci under the standard neutral model.",
  "wattersons theta":
    "An estimator of θ based on the number of segregating sites and the sample-size correction aₙ.",
  "watterson's theta":
    "An estimator of θ based on the number of segregating sites and the sample-size correction aₙ.",
  drift:
    "Random change in allele frequency caused by finite sampling of gene copies between generations.",
  "genetic drift":
    "Random change in allele frequency caused by finite sampling of gene copies between generations.",
  "random sampling":
    "Chance sampling of gene copies during reproduction, which generates stochastic allele-frequency change in finite populations.",
  "binomial sampling":
    "Sampling with two possible outcomes in each draw. In the Wright-Fisher model, the next-generation allele count is binomially distributed.",
  "sampling variance":
    "The variance among replicate samples produced by random sampling; under Wright-Fisher drift it depends on p, q, and population size.",
  fixation:
    "The state in which an allele reaches frequency one in the population.",
  loss:
    "The state in which an allele reaches frequency zero in the population.",
  absorption:
    "Entry into a boundary state, such as allele loss or fixation, from which the neutral finite-population process does not leave.",
  "fixation probability":
    "The probability that an allele eventually reaches frequency one. For a neutral allele, this equals its current frequency.",
  "stochastic loss":
    "Loss of an allele through random drift rather than because it is necessarily deleterious.",
  "effective population size":
    "The size of an idealized population that would experience the same rate of drift or inbreeding as the observed population.",
  "census population size":
    "The actual number of individuals counted in a population, which can differ substantially from effective population size.",
  "loss of heterozygosity":
    "The decline of expected heterozygosity through time as drift removes allelic variation from a finite population.",
  "wright-fisher model":
    "A discrete-generation model in which 2N gene copies in the next diploid generation are sampled independently from the current generation.",
  "wright–fisher model":
    "A discrete-generation model in which 2N gene copies in the next diploid generation are sampled independently from the current generation.",
  "moran model":
    "An overlapping-generation birth-death model in which one individual reproduces and one individual dies at each elementary step.",
  "transition probability":
    "The probability of moving from one allele-count or allele-frequency state to another in one model step.",
  "markov chain":
    "A stochastic process in which the probability of the next state depends on the current state rather than the full previous history.",
  "population subdivision":
    "Division of a species into partially isolated subpopulations whose allele frequencies may diverge through drift, selection, and restricted gene flow.",
  "population structure":
    "Non-random genetic differences among individuals or subpopulations, often reflecting geography, ancestry, migration, drift, or selection.",
  fst:
    "A standardized measure of genetic differentiation that compares within-population diversity with total diversity, often expressed as (HT - HS)/HT.",
  "f_st":
    "A standardized measure of genetic differentiation that compares within-population diversity with total diversity, often expressed as (HT - HS)/HT.",
  "within-population diversity":
    "Genetic diversity measured among gene copies sampled within the same population.",
  "total diversity":
    "Genetic diversity calculated after treating all sampled populations as one pooled population.",
  migration:
    "Movement of individuals or gametes among populations that can transfer alleles and oppose divergence caused by drift.",
  "gene flow":
    "Transfer of alleles among populations through migration and reproduction.",
  "isolation by distance":
    "A pattern in which genetic differentiation increases with geographic distance because dispersal is spatially limited.",
  pca:
    "Principal component analysis: an ordination that summarizes major axes of covariance among individuals or populations without assigning a causal evolutionary process.",
  "principal component analysis":
    "An ordination that summarizes major axes of covariance among individuals or populations without assigning a causal evolutionary process.",
  ancestry:
    "The genetic contribution of source populations or lineages to an individual or population, inferred under a specified model.",
  admixture:
    "Genetic mixing between previously differentiated populations or lineages.",
  coalescent:
    "A backward-in-time framework that traces sampled gene copies to their common ancestors.",
  coalescence:
    "The event in which two sampled lineages trace back to the same ancestral gene copy.",
  lineage:
    "A sampled gene copy and its ancestral path backward through time.",
  "coalescence time":
    "The number of generations backward until two or more sampled lineages share a common ancestor.",
  tmrca:
    "Time to the most recent common ancestor of a specified sample of lineages.",
  "most recent common ancestor":
    "The latest ancestral gene copy from which all sampled lineages descend.",
  "site-frequency spectrum":
    "The distribution of derived or minor allele counts across polymorphic sites in a sample.",
  sfs:
    "The site-frequency spectrum: the distribution of derived or minor allele counts across polymorphic sites in a sample.",
  "folded sfs":
    "A site-frequency spectrum based on minor allele counts when the ancestral state is unknown.",
  "unfolded sfs":
    "A site-frequency spectrum based on derived allele counts after ancestral and derived states have been assigned.",
  "tajimas d":
    "A standardized contrast between nucleotide diversity and Watterson’s θ. Its interpretation depends on demography, selection, recombination, and data quality.",
  "tajima’s d":
    "A standardized contrast between nucleotide diversity and Watterson’s θ. Its interpretation depends on demography, selection, recombination, and data quality.",
  bottleneck:
    "A temporary reduction in effective population size that increases drift and alters diversity, linkage disequilibrium, and the allele-frequency spectrum.",
  "population expansion":
    "An increase in population size that can generate an excess of rare variants relative to a constant-size neutral model.",
  "demographic model":
    "A quantitative description of changes in population size, migration, splitting, and related processes through time.",
  "demographic null":
    "A reference model in which genome-wide patterns are explained by demographic history without invoking locus-specific selection.",
  identifiability:
    "The ability to distinguish parameter values or evolutionary processes from the available data; different models can sometimes generate similar patterns.",
  likelihood:
    "The probability of the observed data as a function of model parameters.",
  selection:
    "Differential reproductive success associated with heritable variation, producing non-random changes in allele frequency.",
  fitness:
    "Expected reproductive contribution of a genotype or phenotype to future generations, usually expressed relative to other genotypes.",
  "relative fitness":
    "Fitness scaled relative to a reference genotype, often the genotype with the highest fitness.",
  "selection coefficient":
    "A parameter describing the fitness difference between genotypes or alleles relative to a reference.",
  dominance:
    "The extent to which the heterozygote fitness or phenotype resembles one homozygote rather than lying midway between homozygotes.",
  "viability selection":
    "Selection caused by genotype-specific differences in survival to reproduction.",
  "beneficial mutation":
    "A mutation that increases fitness in the specified environment and genetic background.",
  "deleterious allele":
    "An allele that reduces fitness in the specified environment and genetic background.",
  "neutral mutation":
    "A mutation whose fitness effect is effectively zero at the relevant population size and environmental context.",
  "purifying selection":
    "Selection that removes deleterious variants and tends to conserve functional sequence.",
  "positive selection":
    "Selection that increases the frequency of beneficial variants.",
  "mutation-selection balance":
    "An equilibrium in which recurrent mutation introduces deleterious alleles while selection removes them.",
  "mutation–selection balance":
    "An equilibrium in which recurrent mutation introduces deleterious alleles while selection removes them.",
  "selective sweep":
    "The rapid increase of a beneficial allele and the associated reduction of linked neutral variation through genetic hitchhiking.",
  hitchhiking:
    "Change in the frequency of a neutral or weakly selected variant because it is linked to a variant under selection.",
  "linked neutral variation":
    "Neutral variation whose frequency is influenced by physical linkage to a selected site.",
  outlier:
    "A locus or window with a statistic unusually extreme relative to a specified null distribution; an outlier is a candidate, not proof of selection.",
  "genome scan":
    "A genome-wide comparison of statistics across loci or windows to identify unusual regions relative to a theoretical or empirical null.",
  "recombination":
    "Exchange of genetic material between homologous chromosomes that breaks down associations among alleles at different loci.",
  haplotype:
    "A combination of alleles carried together on the same chromosome segment.",
  "linkage disequilibrium":
    "Non-random association of alleles at different loci.",
  ld:
    "Linkage disequilibrium: non-random association of alleles at different loci.",
  "d statistic":
    "The difference between the observed haplotype frequency and the frequency expected from the product of the component allele frequencies.",
  "r2":
    "A standardized measure of linkage disequilibrium based on the squared correlation between alleles at two loci.",
  rho:
    "The population-scaled recombination parameter, commonly ρ = 4Ner for diploid autosomal loci.",
  "population recombination parameter":
    "The population-scaled recombination parameter, commonly ρ = 4Ner for diploid autosomal loci.",
  "background selection":
    "Reduction of neutral diversity caused by continual removal of linked deleterious mutations.",
  "dnds":
    "The ratio of nonsynonymous to synonymous substitution rates, used to compare protein-changing and silent evolutionary change under stated assumptions.",
  "dn/ds":
    "The ratio of nonsynonymous to synonymous substitution rates, used to compare protein-changing and silent evolutionary change under stated assumptions.",
  "mcdonald-kreitman test":
    "A comparison of synonymous and nonsynonymous polymorphism with synonymous and nonsynonymous divergence to test departures from neutrality.",
  "polymorphism":
    "Genetic variation present within a population or species.",
  divergence:
    "Genetic differences accumulated between populations, species, or lineages since their separation.",
  alpha:
    "In McDonald-Kreitman reasoning, an estimate of the proportion of nonsynonymous substitutions attributable to positive selection under the model assumptions."
};

const rawModules = raw.modules as Module[];
const rawLessons = raw.lessons as Lesson[];
const rawConcepts = raw.concepts as Concept[];
const rawWorkspaces = raw.workspaces as Workspace[];

export const modules = rawModules;
export const lessons = rawLessons;

/**
 * Apply curated definitions while preserving lesson links and stored mastery.
 * A term without a curated entry keeps its existing definition so the app
 * remains robust while further course concepts are added.
 */
export const concepts: Concept[] = rawConcepts.map((concept) => {
  const curated = conceptDefinitions[normalise(concept.term)];
  return {
    ...concept,
    definition: curated ?? concept.definition
  };
});

export const workspaces = rawWorkspaces;
