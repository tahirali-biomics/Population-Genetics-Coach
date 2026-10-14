export const TUTOR_REQUEST_POLICY = {
  totalTimeoutMs: 45_000,
  attemptTimeoutMs: 15_000,
  maxAttempts: 3,
  backoffMs: 500,
};

export function selectTutorModel(get: (name: string) => string | undefined): string {
  return get('GEMINI_TUTOR_MODEL')?.trim() || get('GEMINI_MODEL')?.trim() || 'gemini-3.1-flash-lite';
}

export type RequestBudget = { deadline: number; attemptsLeft: number };
export function createRequestBudget(now = Date.now()): RequestBudget {
  return { deadline: now + TUTOR_REQUEST_POLICY.totalTimeoutMs, attemptsLeft: TUTOR_REQUEST_POLICY.maxAttempts };
}

export class GeminiRequestError extends Error {
  constructor(message: string, public status: number, public code: string, public providerMessage?: string) {
    super(message);
  }
}

type Dependencies = {
  fetch: typeof fetch;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  random: () => number;
  attemptTimeoutMs: number;
  backoffMs: number;
};
const defaults: Dependencies = {
  fetch: (...args) => fetch(...args), now: Date.now,
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)), random: Math.random,
  attemptTimeoutMs: TUTOR_REQUEST_POLICY.attemptTimeoutMs, backoffMs: TUTOR_REQUEST_POLICY.backoffMs,
};
const temporaryStatuses = new Set([408, 429, 500, 502, 503, 504]);
const timeoutError = () => new GeminiRequestError('The AI tutor did not respond in time. Please try again shortly.', 504, 'GEMINI_TIMEOUT');

/** One shared deadline/attempt budget also covers the optional concise-answer request. */
export async function requestGemini(model: string, key: string, body: unknown, budget: RequestBudget, overrides: Partial<Dependencies> = {}) {
  const deps = { ...defaults, ...overrides };
  let retry = 0;
  while (budget.attemptsLeft > 0) {
    const remaining = budget.deadline - deps.now();
    if (remaining <= 0) throw timeoutError();
    budget.attemptsLeft--;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failure: GeminiRequestError;
    let temporary = false;
    try {
      const operation = (async () => {
        const response = await deps.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST', signal: controller.signal,
          headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(body),
        });
        const text = await response.text(); // Reading the response body shares the timeout.
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; }
        catch { if (response.ok) throw new GeminiRequestError('The AI provider returned an invalid response.', 502, 'GEMINI_INVALID_RESPONSE'); }
        return { response, data };
      })();
      const timedOut = new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(timeoutError()); }, Math.min(deps.attemptTimeoutMs, remaining));
      });
      const { response, data } = await Promise.race([operation, timedOut]);
      if (deps.now() >= budget.deadline) throw timeoutError();
      if (response.ok) return data;
      const providerMessage = String(data?.error?.message || `Gemini returned HTTP ${response.status}.`).replaceAll(key, '[redacted]');
      const providerStatus = data?.error?.status;
      temporary = temporaryStatuses.has(response.status) && !['INVALID_ARGUMENT', 'UNAUTHENTICATED', 'PERMISSION_DENIED', 'NOT_FOUND'].includes(providerStatus);
      const message = response.status === 503
        ? 'The AI tutor provider is busy. Please try again shortly.'
        : response.status === 429 ? 'The AI tutor has reached its usage limit. Please try again later.'
        : response.status === 401 || response.status === 403 ? 'The AI provider rejected its credentials. Please contact the course coordinator.'
        : response.status === 400 || response.status === 404 ? 'The configured AI tutor model or request was rejected. Please contact the course coordinator.'
        : 'The AI provider could not complete the request. Please try again shortly.';
      failure = new GeminiRequestError(message, response.status,
        response.status === 503 ? 'GEMINI_UNAVAILABLE' : response.status === 429 ? 'QUOTA_EXCEEDED' : 'GEMINI_REQUEST_FAILED', providerMessage);
    } catch (error) {
      if (error instanceof GeminiRequestError) {
        failure = error;
        temporary = error.code === 'GEMINI_TIMEOUT';
      } else if (controller.signal.aborted) {
        failure = timeoutError();
        temporary = true;
      } else {
        // Do not echo fetch exceptions, which may contain request/credential details.
        failure = new GeminiRequestError('The AI provider could not be reached. Please try again shortly.', 502, 'GEMINI_NETWORK_ERROR');
        temporary = true;
      }
    } finally { clearTimeout(timer); }
    if (!temporary || budget.attemptsLeft <= 0) throw failure;
    const delay = deps.backoffMs * 2 ** retry++ + Math.floor(deps.random() * 250);
    if (deps.now() + delay >= budget.deadline) throw failure;
    await deps.sleep(delay);
  }
  throw new GeminiRequestError('The AI tutor could not finish within its request budget. Please try again shortly.', 504, 'GEMINI_TIMEOUT');
}
