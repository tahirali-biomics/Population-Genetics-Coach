import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const course = JSON.parse(fs.readFileSync('src/courseData.json', 'utf8'));
const near = (actual, expected) => assert(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test('phase 3: corrected mock-exam diversity dataset is realizable and has a separate context revision', () => {
  // Four singleton columns plus two doubleton columns; pad with 14 invariant sites.
  const polymorphisms = [[1,0,0,0,0], [0,1,0,0,0], [0,0,1,0,0], [0,0,0,1,0], [1,1,0,0,0], [0,0,1,1,0]];
  const sequences = Array.from({ length: 5 }, (_, i) => polymorphisms.map((site) => site[i]).concat(Array(14).fill(0)));
  let pairTotal = 0;
  for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) {
    pairTotal += sequences[a].reduce((sum, base, site) => sum + Number(base !== sequences[b][site]), 0);
  }
  assert.equal(pairTotal, 28);
  near(pairTotal / 10 / 20, .14);
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  assert(app.includes('title: "Sequence diversity",\n    revision: 2,'));
  assert(app.includes(`contain ${pairTotal} total pairwise differences`));
  assert(app.includes('q.revision ? `-v${q.revision}` : ""'));
});

test('phase 3: HWE example rounds independently calculated Pearson statistic correctly in lesson and tutor', () => {
  const observed = [28, 32, 20];
  const n = observed.reduce((sum, count) => sum + count, 0);
  const p = (2 * observed[0] + observed[1]) / (2 * n);
  const expected = [n * p ** 2, n * 2 * p * (1 - p), n * (1 - p) ** 2];
  const statistic = observed.reduce((sum, value, i) => sum + (value - expected[i]) ** 2 / expected[i], 0);
  const rounded = statistic.toFixed(5);
  assert.equal(rounded, '2.94664');
  const lesson = course.lessons.find((item) => item.id === 'l1-hwe');
  assert(lesson.workedExample.includes(`=${rounded}`));
  assert(lesson.aiPrompt.includes(`=${rounded}`));
});

test('phase 3: enumerate Kingman merger histories independently of the composition/beta identity', () => {
  for (const n of [4, 5, 6]) {
    const branchLengths = Array(n).fill(0);
    function visit(descendants, probability) {
      const k = descendants.length;
      if (k < 2) return;
      const pairs = k * (k - 1) / 2;
      // Ne=1: a pair has rate 1/2 per generation; k pairs give mean 2/pairs.
      const meanInterval = 2 / pairs;
      for (const size of descendants) branchLengths[size] += probability * meanInterval;
      for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) {
        const next = descendants.filter((_, index) => index !== a && index !== b);
        next.push(descendants[a] + descendants[b]);
        visit(next, probability / pairs);
      }
    }
    visit(Array(n).fill(1), 1);
    for (let i = 1; i < n; i++) near(branchLengths[i], 4 / i);
    if (n === 4) near(branchLengths[2], 2);
  }
  const lesson = course.lessons.find((item) => item.id === 'l5-theta-diversity');
  assert(lesson.sections.some(([, body]) => body.includes('k=2 term is 1/3') && body.includes('k=3 term is 1/6')));
});

test('phase 3: gene-wise, weighted and pooled MK alpha are distinct, correctly bound to authored example', () => {
  const genes = [{ pn: 20, ps: 80, dn: 40, ds: 80 }, { pn: 10, ps: 20, dn: 20, ds: 40 }];
  const alpha = ({ pn, ps, dn, ds }) => 1 - (pn / ps) / (dn / ds);
  near(alpha(genes[0]), .5);
  near(alpha(genes[1]), 0);
  near(genes.reduce((sum, gene) => sum + alpha(gene), 0) / genes.length, .25);
  const contributions = genes.map(({ pn, ps, dn, ds }) => [ds * pn / (ps + ds), ps * dn / (ps + ds)]);
  near(1 - contributions.reduce((sum, pair) => sum + pair[0], 0) / contributions.reduce((sum, pair) => sum + pair[1], 0), .375);
  const pooled = genes.reduce((sum, gene) => Object.fromEntries(Object.keys(gene).map((key) => [key, sum[key] + gene[key]])), { pn: 0, ps: 0, dn: 0, ds: 0 });
  near(alpha(pooled), .4);
  const lesson = course.lessons.find((item) => item.id === 't2-molecular-selection-tests');
  const example = lesson.sections.find(([heading]) => heading === 'Why apparently adaptive tables can mislead')[1];
  for (const number of ['0.375', '0.25', '=0.4']) assert(example.includes(number));
});
