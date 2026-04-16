import { prisma } from '../lib/db.js';
import { bestMatch } from '../lib/matching-logic.js';
import { checkApiKey, methodNotAllowed, ok, badRequest, readJsonBody, serverError, unauthorized } from '../lib/http.js';
import { getSession } from '../lib/session-store.js';
import { fetchEligibility } from '../lib/external-provider.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  if (!checkApiKey(req)) return unauthorized(res);

  try {
    const body = await readJsonBody(req);
    const { sessionId, address = {} } = body;

    if (!sessionId) {
      return badRequest(res, 'sessionId is required.');
    }

    const session = getSession(sessionId);
    if (!session) {
      return badRequest(res, 'Session not found or expired.');
    }

    const fullAddress = {
      zipCode: session.context.zipCode,
      prefecture: session.context.prefecture,
      city: session.context.city,
      chome: session.context.chome,
      banchi: session.context.banchi,
      go: session.context.go,
      buildingName: session.context.buildingName,
      room: session.context.room,
      ...address
    };

    const external = await fetchEligibility({ address: fullAddress }).catch(() => null);
    if (external?.is_eligible !== undefined) {
      return ok(res, external);
    }

    const candidates = await prisma.addressUnit.findMany({
      where: {
        zipCode: fullAddress.zipCode,
        city: fullAddress.city || undefined
      },
      include: {
        eligibilities: {
          where: { isEligible: true },
          include: { plan: true }
        }
      },
      take: 500
    });

    if (!candidates.length) {
      return ok(res, {
        is_eligible: false,
        matching_score: 0,
        matched_address_id: null,
        suggested_plans: [],
        reason: 'No candidates found for this zipcode/city.'
      });
    }

    const match = bestMatch(fullAddress, candidates);
    if (!match) {
      return ok(res, {
        is_eligible: false,
        matching_score: 0,
        matched_address_id: null,
        suggested_plans: [],
        reason: 'Unable to match address.'
      });
    }

    const suggestedPlans = (match.candidate.eligibilities || []).map((e) => ({
      code: e.plan.code,
      name: e.plan.name,
      speedMbps: e.plan.speedMbps,
      monthlyPrice: e.plan.monthlyPrice,
      provider: e.plan.provider
    }));

    return ok(res, {
      is_eligible: suggestedPlans.length > 0,
      matching_score: match.matching_score,
      component_scores: match.component_scores,
      matched_address_id: match.candidate.id,
      suggested_plans: suggestedPlans
    });
  } catch (error) {
    return serverError(res, error);
  }
}
