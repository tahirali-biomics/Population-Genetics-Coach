import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { buildTutorContext } from '../src/courseContext.ts';

const course = JSON.parse(fs.readFileSync('src/courseData.json', 'utf8'));
test('all 26 routed lessons use enriched versioned banks; archive is review-only', () => {
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  assert(app.includes('const l = lessons.find((x) => x.id === id)'));
  assert(app.includes('questions={l.assessment}'));
  assert(!app.includes('assessmentArchive'));
  assert.equal(course.lessons.length, 26);
  assert.equal(course.lessons.flatMap(l => l.assessment).length, 264);
  for (const lesson of course.lessons) {
    assert(lesson.assessment.every(q => q.id.startsWith(`${lesson.id}-v2-`)));
    assert(lesson.references?.some(reference => reference.includes('Hahn')));
  }
});

test('scientific abbreviation and aggregation queries retrieve their authored lessons', () => {
  for (const [query, id] of [
    ['Explain MK', 't2-molecular-selection-tests'], ['What is LD?', 't1-ld-recombination'],
    ['Explain NI', 't2-molecular-selection-tests'], ['dN/dS interpretation', 't2-molecular-selection-tests'],
    ['Why is weighted alpha different from pooled alpha?', 't2-molecular-selection-tests'],
    ['What is FST?', 'l4-fst'], ['WF transition probabilities', 'l3-wf-transition'],
    ['Moran generation scaling', 'l3-moran'], ['Tajima D normalization', 'l7-tajima'],
  ]) {
    const context = buildTutorContext(query, course.lessons, ['l1-allele-genotype']);
    assert(context.startsWith(`Lesson ${id}:`), query);
    assert(context.length <= 28000);
  }
  assert(buildTutorContext('Kingman beta integral derivation', course.lessons, []).startsWith('Lesson l5-theta-diversity:'));
});

test('irrelevant queries and ambiguous single-letter notation do not retrieve arbitrary completed lessons', () => {
  assert(buildTutorContext('Explain D', course.lessons, ['l1-allele-genotype']).includes('needs clarification'));
  assert.equal(buildTutorContext('zzqxxzz', course.lessons, ['l1-allele-genotype']), 'No relevant authored course excerpts matched this query.');
  assert.equal(buildTutorContext('Please explain', course.lessons, ['l1-allele-genotype']), 'No relevant authored course excerpts matched this query.');
});

test('student transfer heading is concise while evaluation keeps the authored reference', async () => {
  const output = path.resolve('node_modules/.tmp/release-heading.mjs');
  await build({ stdin: { contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {AIActivityHeading} from './src/AIActivityHeading';export const render=props=>renderToStaticMarkup(React.createElement(AIActivityHeading,props));`, resolveDir: process.cwd(), loader: 'tsx' }, outfile: output, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
  const { render } = await import(output);
  const html = render({ heading: 'Apply this lesson', task: 'Define symbols, state assumptions and interpret one calculation.' });
  assert(html.startsWith('<h4>Apply this lesson</h4>'));
  assert(html.length < 200);
  assert(!html.includes('Hahn'));
  assert.equal(render({ heading: 'Your working response' }), '<h4>Your working response</h4>');
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  assert(app.includes('prompt={l.aiPrompt}'));
  assert(app.includes('Authored lesson reference:'));
  assert(!app.includes('<h4>{compact ? "Your working response" : prompt}</h4>'));
});
