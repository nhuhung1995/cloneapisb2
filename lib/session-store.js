import { randomUUID } from 'node:crypto';

const sessionStore = new Map();

const STEP_INDEX = {
  zipcode: 1,
  chome: 2,
  banchi: 3,
  room: 4,
  eligibility: 5
};

function now() {
  return Date.now();
}

function ttlMs() {
  const ttl = Number(process.env.SESSION_TTL_SECONDS || 1800);
  return Math.max(60, ttl) * 1000;
}

export function createSession(seed = {}) {
  const sessionId = randomUUID();
  const expiresAt = now() + ttlMs();
  sessionStore.set(sessionId, {
    step: 'zipcode',
    context: seed,
    expiresAt
  });
  return sessionId;
}

export function getSession(sessionId) {
  const data = sessionStore.get(sessionId);
  if (!data) return null;
  if (data.expiresAt < now()) {
    sessionStore.delete(sessionId);
    return null;
  }
  return data;
}

export function assertStep(sessionId, expectedStep) {
  const data = getSession(sessionId);
  if (!data) {
    return { ok: false, error: 'Session not found or expired.' };
  }
  if (STEP_INDEX[data.step] > STEP_INDEX[expectedStep]) {
    return { ok: false, error: `Flow mismatch. Expected ${expectedStep}, current ${data.step}.` };
  }
  return { ok: true, data };
}

export function advanceSession(sessionId, nextStep, nextContext = {}) {
  const current = getSession(sessionId);
  if (!current) return null;
  const updated = {
    step: nextStep,
    context: {
      ...current.context,
      ...nextContext
    },
    expiresAt: now() + ttlMs()
  };
  sessionStore.set(sessionId, updated);
  return updated;
}
