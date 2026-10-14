import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build, transform } from 'esbuild';

test('actual React Markdown/KaTeX component renders lessons, tables and safe links',async()=>{
 await transform(fs.readFileSync('supabase/functions/ai-tutor/index.ts','utf8'),{loader:'ts'});
 const temp=path.resolve('node_modules/.tmp/course-render-test.mjs');
 await build({stdin:{contents:`import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {LessonContent} from './src/LessonContent'; export const render=(text)=>renderToStaticMarkup(React.createElement(LessonContent,{text}));`,resolveDir:process.cwd(),loader:'tsx'},outfile:temp,bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external'});
 const {render}=await import(temp);
 const course=JSON.parse(fs.readFileSync('src/courseData.json','utf8'));
 for(const l of course.lessons){
  for(const [heading,body] of l.sections){const html=render(body);assert(!html.includes('katex-error'),`${l.id} ${heading}`);assert(!html.includes('<script'));if(body.includes('$$'))assert(html.includes('katex-display'),`${l.id}: display equations must render as blocks`);}
  assert(!render(l.workedExample).includes('katex-error'));
 }
 const table=render('| x | y |\n|---|---|\n| 1 | 2 |');assert(table.includes('lesson-table-scroll'));assert(table.includes('tabindex="0"'));
 const unsafe=render('<script>alert(1)</script>\n\n[bad](javascript:alert%281%29)');assert(!unsafe.includes('<script'));assert(!unsafe.includes('href="javascript:'));
 const sample=course.lessons.find(l=>l.id==='l7-tajima');
  const html=render(sample.sections[0][1]);assert(html.includes('class="katex"'));assert(html.includes('<math'));
  assert(html.includes('aria-label="Scrollable equation"'));assert(!html.includes('node="[object Object]"'));
 const pages=[course.lessons[1],course.lessons[20],course.lessons[24]];
 const preview=pages.map(l=>`<h1>${l.title}</h1>${l.sections.map(([h,b])=>`<article class="panel"><h2>${h}</h2>${render(b)}</article>`).join('')}<article class="panel"><h2>Worked example</h2>${render(l.workedExample)}</article>`).join('');
 fs.writeFileSync('node_modules/.tmp/course-preview.html',`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="../../src/styles.css"><link rel="stylesheet" href="../katex/dist/katex.min.css"><style>body{padding:16px}main{max-width:1000px;margin:auto}.panel{margin-bottom:1rem}</style></head><body><main>${preview}</main></body></html>`);
});
