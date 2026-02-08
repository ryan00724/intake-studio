/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Works well for single-instance / Vercel serverless (warm instances share memory).
 * For multi-instance production, swap to Upstash Redis (@upstash/ratelimit).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  /** Unix ms when the window resets */
  reset: number;
}

/**
 * Check rate limit for a given key (usually IP address).
 * Returns `{ success: true }` if the request is allowed.
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  const remaining = Math.max(0, config.max - entry.timestamps.length);
  const oldestInWindow = entry.timestamps[0] || now;
  const reset = oldestInWindow + config.windowMs;

  if (entry.timestamps.length >= config.max) {
    return { success: false, remaining: 0, limit: config.max, reset };
  }

  entry.timestamps.push(now);
  return { success: true, remaining: remaining - 1, limit: config.max, reset };
}

/**
 * Extract the client IP from a Next.js request.
 * Checks x-forwarded-for (set by Vercel/proxies), then x-real-ip, then falls back to "unknown".
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
