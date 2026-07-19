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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 1200 },
        }),
      },
    );
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message || 'Gemini evaluation failed.');
    const feedback = j?.candidates?.[0]?.content?.parts?.map((part: any) => part.text ?? '').join('') || 'No feedback was generated.';
    return new Response(JSON.stringify({ feedback }), { headers: cors });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 400, headers: cors });
  }
});
