/*
 * Population Genetics Coach
 * Copyright © 2026 Dr. Tahir Ali
 * All rights reserved. See LICENSE.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const cors = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { contextId, title, prompt, response } = await req.json();
    if (!response?.trim()) {
      return new Response(JSON.stringify({ error: 'A response is required.' }), { status: 400, headers: cors });
    }
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }), { status: 500, headers: cors });
    }

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.1-flash-lite';

    const system = `You are the course-grounded evaluator for QBio305 Population & Quantitative Genetics.
Evaluate only against the task context supplied by the application and the instructor-approved derived course content available to the app. Do not browse, add facts from the internet, introduce alternative mathematical notation, or invent missing course content. Preserve the terminology and model framing supplied in the task. Student reports are never scientific authorities.
Return concise formative feedback under exactly these headings:
1. What is already strong
2. What is missing or unclear
3. Scientific reasoning and assumptions
4. Interpretation and overclaiming check
5. One concrete revision
6. One follow-up question
Do not rewrite the entire answer for the student.`;

    const fullPrompt = [
      system,
      `Context ID: ${contextId}`,
      `Activity: ${title}`,
      `Evaluation focus: ${prompt}`,
      `Student response:\n${response}`,
    ].join('\n\n');

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 1200 },
        }),
      },
    );
    const responseText = await r.text();
    let j: any = {};

    try {
      j = responseText ? JSON.parse(responseText) : {};
    } catch {
      console.error('Gemini evaluator returned invalid JSON', {
        status: r.status,
        body: responseText.slice(0, 1000),
      });
      return new Response(
        JSON.stringify({ error: 'Gemini returned an invalid response.' }),
        { status: 502, headers: cors },
      );
    }

    if (!r.ok) {
      const upstreamMessage =
        j?.error?.message || 'Gemini evaluation failed.';

      console.error('Gemini evaluation failed', {
        status: r.status,
        model,
        message: upstreamMessage,
      });

      if (
        r.status === 429 ||
        /quota|rate limit|resource_exhausted/i.test(upstreamMessage)
      ) {
        return new Response(
          JSON.stringify({
            error:
              'The AI evaluator has temporarily reached its usage limit. Please try again shortly.',
            code: 'QUOTA_EXCEEDED',
          }),
          { status: 429, headers: cors },
        );
      }

      return new Response(
        JSON.stringify({
          error: upstreamMessage,
          code: 'GEMINI_REQUEST_FAILED',
        }),
        { status: r.status >= 400 ? r.status : 502, headers: cors },
      );
    }

    const feedback =
      j?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text ?? '')
        .join('') || 'No feedback was generated.';

    return new Response(JSON.stringify({ feedback }), { headers: cors });
  } catch (error) {
    console.error('Lesson evaluator failure', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Unexpected evaluator error.',
        code: 'LESSON_EVALUATOR_ERROR',
      }),
      { status: 500, headers: cors },
    );
  }
});
