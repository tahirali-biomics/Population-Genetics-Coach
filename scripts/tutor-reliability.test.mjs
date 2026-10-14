import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { edgeFunctionErrorMessage } from '../src/edgeFunctionError.ts';

const output = path.resolve('node_modules/.tmp/gemini-request-test.mjs');
await build({ entryPoints: ['supabase/functions/ai-tutor/geminiRequest.ts'], outfile: output, bundle: true, platform: 'node', format: 'esm' });
const { requestGemini, createRequestBudget, selectTutorModel, TUTOR_REQUEST_POLICY } = await import(output);
const fail = (status, message = 'This model is currently experiencing high demand.', providerStatus = 'UNAVAILABLE') => new Response(JSON.stringify({ error: { message, status: providerStatus } }), { status });
const ok = () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Complete grounded reply.' }] } }] }), { status: 200 });

test('tutor override has independent precedence and preserves shared/evaluator fallback', () => {
  assert.equal(selectTutorModel(k => ({ GEMINI_TUTOR_MODEL: ' gemini-3.5-flash-lite ', GEMINI_MODEL: 'evaluator-model' })[k]), 'gemini-3.5-flash-lite');
  assert.equal(selectTutorModel(k => ({ GEMINI_TUTOR_MODEL: ' ', GEMINI_MODEL: 'evaluator-model' })[k]), 'evaluator-model');
  assert.equal(selectTutorModel(() => undefined), 'gemini-3.1-flash-lite');
  const evaluator = fs.readFileSync('supabase/functions/lesson-evaluator/index.ts', 'utf8');
  assert(!evaluator.includes('GEMINI_TUTOR_MODEL'));
});

test('temporary Gemini errors retry twice with bounded exponential backoff and no key in URL', async () => {
  let clock = 0, calls = 0; const waits = [];
  const budget = createRequestBudget(clock);
  const data = await requestGemini('gemini-3.5-flash-lite', 'private-key', {}, budget, {
    now: () => clock, random: () => 0,
    sleep: async ms => { waits.push(ms); clock += ms; },
    fetch: async (url, init) => {
      assert(!url.includes('private-key')); assert.equal(init.headers['x-goog-api-key'], 'private-key');
      return ++calls < 3 ? fail(503) : ok();
    },
  });
  assert.equal(calls, 3); assert.deepEqual(waits, [500, 1000]);
  assert.equal(budget.attemptsLeft, 0); assert(data.candidates);
  assert(clock < TUTOR_REQUEST_POLICY.totalTimeoutMs);
});

test('authentication, invalid-model and other permanent errors are not retried', async () => {
  for (const [status, providerStatus] of [[400,'INVALID_ARGUMENT'],[401,'UNAUTHENTICATED'],[403,'PERMISSION_DENIED'],[404,'NOT_FOUND'],[501,'UNIMPLEMENTED'],[500,'UNAUTHENTICATED']]) {
    let calls = 0;
    await assert.rejects(requestGemini('model', 'key', {}, createRequestBudget(), {
      fetch: async () => { calls++; return fail(status, 'Rejected configuration', providerStatus); },
      sleep: async () => assert.fail('Permanent error must not sleep'),
    }), e => e.status === status && e.providerMessage === 'Rejected configuration');
    assert.equal(calls, 1);
  }
});

test('retries stop at the global deadline and concise continuation shares the attempt budget', async () => {
  let calls = 0;
  await assert.rejects(requestGemini('model','key',{}, {deadline:400,attemptsLeft:3}, {
    now:()=>0,random:()=>0,fetch:async()=>{calls++;return fail(503);},sleep:async()=>assert.fail('Cannot sleep beyond budget'),
  }), e=>e.status===503);
  assert.equal(calls,1);
  const budget=createRequestBudget();budget.attemptsLeft=1;
  await requestGemini('model','key',{},budget,{fetch:async()=>ok()});
  await assert.rejects(requestGemini('model','key',{},budget,{fetch:async()=>assert.fail('No remaining call budget')}), e=>e.code==='GEMINI_TIMEOUT');
});

test('a hung fetch or response body is aborted and returns within its bounded timeout', async () => {
  for (const bodyHangs of [false,true]) {
    let signal;
    const start=Date.now();
    await assert.rejects(requestGemini('model','key',{}, {deadline:Date.now()+200,attemptsLeft:1}, {
      attemptTimeoutMs:10,
      fetch:async(_url,init)=>{signal=init.signal; return bodyHangs ? {ok:true,status:200,text:()=>new Promise(()=>{})} : new Promise(()=>{});},
    }), e=>e.code==='GEMINI_TIMEOUT' && e.status===504);
    assert(signal.aborted);assert(Date.now()-start<1000);
  }
});

test('exhausted temporary failure retains exact safe provider error and masks credentials', async () => {
  const budget=createRequestBudget();budget.attemptsLeft=1;
  await assert.rejects(requestGemini('model','secret-value',{},budget,{fetch:async()=>fail(503,'High demand for secret-value')}),e=>{
    assert.equal(e.providerMessage,'High demand for [redacted]');
    assert.equal(e.code,'GEMINI_UNAVAILABLE');assert(e.message.includes('busy'));return true;
  });
});

test('frontend reads cloned Edge Function JSON instead of a non-2xx wrapper', async () => {
  const context=new Response(JSON.stringify({error:'The AI tutor provider is busy. Please try again shortly.',code:'GEMINI_UNAVAILABLE'}),{status:503});
  assert.equal(await edgeFunctionErrorMessage({message:'Edge Function returned a non-2xx status code',context},'Fallback'),'The AI tutor provider is busy. Please try again shortly.');
  assert.equal(context.bodyUsed,false);
  assert.equal(await edgeFunctionErrorMessage({message:'non-2xx',context:new Response('not JSON',{status:504})},'Fallback'),'The AI request timed out. Please try again shortly.');
  assert.equal(await edgeFunctionErrorMessage({message:'non-2xx'},'Fallback'),'Fallback');
});
