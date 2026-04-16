import { checkApiKey, methodNotAllowed, ok, badRequest, readJsonBody, serverError, unauthorized } from '../../lib/http.js';
import { assertStep, advanceSession } from '../../lib/session-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  if (!checkApiKey(req)) return unauthorized(res);

  try {
    const body = await readJsonBody(req);
    const { sessionId, go, buildingName, room } = body;

    if (!sessionId) {
      return badRequest(res, 'sessionId is required.');
    }

    const guard = assertStep(sessionId, 'room');
    if (!guard.ok) return badRequest(res, guard.error);

    advanceSession(sessionId, 'eligibility', { go, buildingName, room });

    return ok(res, {
      sessionId,
      next: '/check-availability'
    });
  } catch (error) {
    return serverError(res, error);
  }
}
