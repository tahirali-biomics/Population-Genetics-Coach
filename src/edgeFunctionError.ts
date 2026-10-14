/** FunctionsHttpError.context is a Response, not an already-parsed body object. */
export async function edgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const value = error as { context?: Response; message?: string } | undefined;
  const response = value?.context;
  if (response && typeof response.clone === 'function') {
    try {
      const body = await response.clone().json();
      const message = typeof body?.error === 'string' ? body.error : typeof body?.message === 'string' ? body.message : undefined;
      if (message?.trim()) return message.trim().slice(0, 600);
    } catch { /* Use a useful status fallback if the response is not JSON. */ }
    if (response.status === 401 || response.status === 403) return 'Your AI session was not authorized. Please sign in again.';
    if (response.status === 429) return 'The AI service has reached its usage limit. Please try again later.';
    if (response.status === 503) return 'The AI service is temporarily busy. Please try again shortly.';
    if (response.status === 504) return 'The AI request timed out. Please try again shortly.';
    return `${fallback} (HTTP ${response.status}). Please try again.`;
  }
  const message = value?.message;
  return typeof message === 'string' && message.trim() && !/non-2xx/i.test(message) ? message : fallback;
}
