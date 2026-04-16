import { prisma } from '../../lib/db.js';
import { checkApiKey, methodNotAllowed, ok, badRequest, readJsonBody, serverError, unauthorized } from '../../lib/http.js';
import { assertStep, advanceSession } from '../../lib/session-store.js';
import { fetchBanchiByChome } from '../../lib/external-provider.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  if (!checkApiKey(req)) return unauthorized(res);

  try {
    const body = await readJsonBody(req);
    const { sessionId, prefecture, city, chome } = body;
    if (!sessionId || !prefecture || !city || !chome) {
      return badRequest(res, 'sessionId, prefecture, city, chome are required.');
    }

    const guard = assertStep(sessionId, 'chome');
    if (!guard.ok) return badRequest(res, guard.error);

    const zipCode = guard.data.context.zipCode;

    const external = await fetchBanchiByChome({ zipCode, prefecture, city, chome }).catch(() => null);
    const banchiOptions =
      external?.banchiOptions ||
      (await prisma.addressUnit.findMany({
        where: { zipCode, prefecture, city, chome },
        select: { banchi: true },
        distinct: ['banchi'],
        take: 1000
      })).map((x) => ({ banchi: x.banchi }));

    advanceSession(sessionId, 'banchi', { prefecture, city, chome });

    return ok(res, {
      sessionId,
      banchiOptions
    });
  } catch (error) {
    return serverError(res, error);
  }
}
