type AttemptMap = Map<string, number[]>;

export function checkRateLimit(
  attempts: AttemptMap,
  key: string,
  options: { limit: number; windowMs: number },
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((timestamp) => now - timestamp < options.windowMs);

  if (recent.length >= options.limit) {
    attempts.set(key, recent);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((options.windowMs - (now - recent[0])) / 1000)),
    };
  }

  recent.push(now);
  attempts.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function pruneRateLimitMap(attempts: AttemptMap, windowMs: number): void {
  const now = Date.now();
  for (const [key, timestamps] of attempts) {
    const recent = timestamps.filter((timestamp) => now - timestamp < windowMs);
    if (recent.length === 0) attempts.delete(key);
    else attempts.set(key, recent);
  }
}
