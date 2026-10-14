type CourseLesson = {
  id: string; title: string; concepts: string[]; summary: string;
  objectives: string[]; sections: [string, string][]; workedExample: string; references?: string[];
};

const stopWords = new Set('a an and are as at be by can could define definition derive do does explain for from give how i in is it me of on please show tell that the this to use what when where which why with would you'.split(' '));
const aliases: Record<string, string[]> = {
  mk: ['mcdonald', 'kreitman'], ld: ['linkage', 'disequilibrium'], ni: ['neutrality', 'index'],
  wf: ['wright', 'fisher'], ne: ['effective', 'population', 'size'],
  fst: ['differentiation'], sfs: ['site', 'frequency', 'spectrum'],
  dnds: ['nonsynonymous', 'synonymous'],
};
const tokenize = (text: string): string[] => text.normalize('NFKC').toLowerCase()
  .replace(/d\s*n\s*\/\s*d\s*s/g, 'dnds')
  .match(/[\p{L}\p{N}]+/gu) ?? [];

/** Whole-token matching and scientific aliases over authored material only. */
export function buildTutorContext(query: string, course: CourseLesson[], completed: string[]): string {
  const tokens = tokenize(query);
  const words = [...new Set(tokens.flatMap(word => [word, ...(aliases[word] ?? [])]))]
    .filter(word => !stopWords.has(word) && (word.length > 2 || word in aliases));
  if (!words.length) return tokens.includes('d')
    ? 'No unambiguous reference selected: D alone can denote different quantities in these lessons. The intended model or statistic needs clarification.'
    : 'No relevant authored course excerpts matched this query.';
  const preferred = new Set<string>();
  if (tokens.some(word => ['mk', 'mcdonald', 'kreitman', 'alpha', 'ni', 'dnds', 'omega', 'ehh', 'ihh', 'ihs', 'hka'].includes(word))) preferred.add('t2-molecular-selection-tests');
  if (tokens.some(word => ['ld', 'recombination', 'rho'].includes(word))) preferred.add('t1-ld-recombination');
  if (tokens.includes('fst')) preferred.add('l4-fst');
  if (tokens.includes('tajima')) preferred.add('l7-tajima');
  if (tokens.includes('moran')) preferred.add('l3-moran');
  if (tokens.includes('wf') || (tokens.includes('wright') && tokens.includes('fisher'))) preferred.add('l3-wf-transition');
  const ranked = course.map((lesson, index) => {
    const title = new Set(tokenize(`${lesson.title} ${lesson.concepts.join(' ')}`));
    const headings = new Set(tokenize(lesson.sections.map(([h]) => h).join(' ')));
    const body = new Set(tokenize(`${lesson.summary} ${lesson.sections.map(([, p]) => p).join(' ')}`));
    const score = words.reduce((s, word) => s + (title.has(word) ? 5 : headings.has(word) ? 2 : body.has(word) ? 1 : 0), 0) + (preferred.has(lesson.id) ? 25 : 0);
    return { lesson, index, score, completed: completed.includes(lesson.id) };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.completed) - Number(a.completed) || a.index - b.index);
  if (!ranked.length) return 'No relevant authored course excerpts matched this query.';
  return ranked.slice(0, 2).map(({ lesson }) =>
    `Lesson ${lesson.id}: ${lesson.title}\n${lesson.summary}\nObjectives: ${lesson.objectives.join("; ")}\n` +
    lesson.sections.map(([heading, text]) => `${heading}\n${text}`).join("\n\n") +
    `\nWorked example: ${lesson.workedExample}\nReferences: ${(lesson.references ?? []).join("; ")}`
  ).join("\n\n").slice(0, 28000);
}
