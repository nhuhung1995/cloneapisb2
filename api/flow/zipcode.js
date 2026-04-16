import { prisma } from '../../lib/db.js';
import { checkApiKey, methodNotAllowed, ok, badRequest, readJsonBody, serverError, unauthorized } from '../../lib/http.js';
import { createSession, advanceSession } from '../../lib/session-store.js';
import { fetchChomeByZipcode } from '../../lib/external-provider.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  if (!checkApiKey(req)) return unauthorized(res);

  try {
    const body = await readJsonBody(req);
    const zipCode = String(body.zipCode || '').replace(/\D/g, '').slice(0, 7);
    if (zipCode.length !== 7) {
      return badRequest(res, 'zipCode must be 7 digits.');
    }

    const sessionId = createSession({ zipCode });

    const external = await fetchChomeByZipcode({ zipCode }).catch(() => null);
    const chomeOptions =
      external?.chomeOptions ||
      (await prisma.addressUnit.findMany({
        where: { zipCode },
        select: { prefecture: true, city: true, chome: true },
        distinct: ['prefecture', 'city', 'chome'],
        take: 200
      })).map((x) => ({
        prefecture: x.prefecture,
        city: x.city,
        chome: x.chome
      }));

    advanceSession(sessionId, 'chome', { zipCode });

    return ok(res, {
      sessionId,
      zipCode,
      chomeOptions
    });
  } catch (error) {
    return serverError(res, error);
  }
}
