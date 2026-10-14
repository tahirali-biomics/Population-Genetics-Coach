import fs from 'node:fs';
import assert from 'node:assert/strict';
import katex from 'katex';

const course = JSON.parse(fs.readFileSync('src/courseData.json','utf8'));
const expected = ['l1-allele-genotype','l1-diversity','l1-hwe','l2-random-sampling','l2-fixation','l2-heterozygosity-ne','l3-wf-transition','l3-moran','l3-model-comparison','l4-wahlund','l4-fst','l4-migration-structure','l5-coalescent-pairs','l5-k-lineages','l5-theta-diversity','l6-fitness-recursion','l6-fixation-selection','l6-mutation-selection','l7-sfs','l7-tajima','l7-model-fitting','l8-linked-selection','l8-genome-scans','l8-selection-demography','t1-ld-recombination','t2-molecular-selection-tests'];
assert.deepEqual(course.lessons.map(l=>l.id), expected);
assert.deepEqual(course.modules.flatMap(m=>m.lessons.map(l=>l.id)),expected);
course.modules.forEach((m,i)=>assert.equal(m.lessons.length,i<8?3:1));
let mathCount=0,questions=0;
function math(text,label) {
  assert(!/\$\$[^\n]/.test(text),`${label}: display math must use a separate delimiter line`);
  for (const match of text.matchAll(/\$\$([\s\S]*?)\$\$|(?<!\$)\$([^$\n]+)\$(?!\$)/g)) {
    try { katex.renderToString(match[1]??match[2],{throwOnError:true,strict:'error',trust:false}); } catch(error){ throw new Error(`${label}: ${error.message}`); }
    mathCount++;
  }
  assert(!text.includes('\u0008')&&!text.includes('\u000c'),`${label}: damaged escape sequence`);
  const remainder=text.replace(/\$\$([\s\S]*?)\$\$|(?<!\$)\$([^$\n]+)\$(?!\$)/g,'');
  assert(!remainder.includes('$'),`${label}: unmatched math delimiter`);
}
for(const l of course.lessons){
  const summary=course.modules.flatMap(m=>m.lessons).find(s=>s.id===l.id);
  for(const key of ['title','summary','minutes']) assert.equal(summary[key],l[key]);
  for(const key of ['summary','equation','workedExample','keyStatement','aiPrompt']) assert.equal(typeof l[key],'string');
  assert(l.objectives.length>=3&&l.variables.length>0&&l.commonMistakes.length>0);
  const ids=new Set();
  for(const q of l.assessment){
    assert(!ids.has(q.id),`${l.id}: duplicate question ID`);ids.add(q.id);questions++;
    assert(q.question&&q.explanation);
    if(q.type==='mcq') {assert(q.options.length>=3);assert.equal(new Set(q.options).size,q.options.length);assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);}
    else {assert.equal(q.type,'tf');assert.equal(typeof q.answer,'boolean');}
    math(q.question,l.id);math(q.explanation,l.id);q.options?.forEach(o=>math(o,l.id));
  }
  if(l.equationFormat==='latex'){
    katex.renderToString(l.equation,{throwOnError:true,strict:'error',trust:false});mathCount++;
    assert(l.sections.length>=4&&l.practice.length>=3&&l.references.length>=2);
  }
  l.sections.forEach(([heading,body])=>{assert(heading&&body);math(body,l.id+': '+heading)});
  math(l.workedExample,l.id);l.variables.forEach(v=>math(v,l.id));l.practice?.forEach(p=>{assert(p.question&&p.solution);math(p.question,l.id);math(p.solution,l.id)});
}
for(const c of course.concepts) assert(c.lessons.every(id=>expected.includes(id)));
console.log(`Course valid: ${expected.length} stable lessons, ${questions} questions, ${mathCount} LaTeX expressions checked.`);
