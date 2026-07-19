import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const cors = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { message, mode = 'theory', history = [], conversation = [] } = await req.json();
    if (!message?.trim()) return new Response(JSON.stringify({ error: 'A message is required.' }), { status: 400, headers: cors });
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }), { status: 500, headers: cors });
    const prior = history.length ? history : conversation;
    const system = `You are the Population Genetics Coach for QBio305. Use only the instructor-approved, app-derived course context supplied to you. Do not browse or import unsupported facts, equations, notation, or examples from the internet. Use precise population-genetics terminology and preserve the notation supplied in the app. Never claim that a statistic alone proves selection. Separate assumptions, calculation, result, biological interpretation, alternatives, and limitations. Do not reproduce uploaded copyrighted course files or student reports. Student projects may inspire structure only and are never a scientific or methods authority.`;
    const prompt = [system, `Mode: ${mode}`, prior.map((x: any) => `${x.role}: ${x.content}`).join('\n'), `Student: ${message}`].filter(Boolean).join('\n\n');
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: .2, maxOutputTokens: 1600 } }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message || 'Gemini tutor request failed.');
    const reply = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? 'No response generated.';
    return new Response(JSON.stringify({ reply }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: cors });
  }
});
