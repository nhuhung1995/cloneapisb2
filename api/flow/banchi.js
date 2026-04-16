import { prisma } from '../../lib/db.js';
import { checkApiKey, methodNotAllowed, ok, badRequest, readJsonBody, serverError, unauthorized } from '../../lib/http.js';
import { assertStep, advanceSession } from '../../lib/session-store.js';
import { fetchRoomByBanchi } from '../../lib/external-provider.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  if (!checkApiKey(req)) return unauthorized(res);

  try {
    const body = await readJsonBody(req);
    const { sessionId, banchi } = body;

    if (!sessionId || !banchi) {
      return badRequest(res, 'sessionId and banchi are required.');
    }

    const guard = assertStep(sessionId, 'banchi');
    if (!guard.ok) return badRequest(res, guard.error);

    const { zipCode, prefecture, city, chome } = guard.data.context;

    const external = await fetchRoomByBanchi({ zipCode, prefecture, city, chome, banchi }).catch(() => null);

    const roomOptions =
      external?.roomOptions ||
      (await prisma.addressUnit.findMany({
        where: { zipCode, prefecture, city, chome, banchi },
        select: { go: true, buildingName: true, room: true },
        take: 500
      })).map((x) => ({
        go: x.go,
        buildingName: x.buildingName,
        room: x.room
      }));

    advanceSession(sessionId, 'room', { banchi });

    return ok(res, {
      sessionId,
      roomOptions
    });
  } catch (error) {
    return serverError(res, error);
  }
}
