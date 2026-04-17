import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, internalError } from '@/lib/http';

export async function GET(request: NextRequest) {
  try {
    const buildingId = request.nextUrl.searchParams.get('buildingId') ?? '';

    if (!buildingId) {
      return badRequest('buildingId is required');
    }

    const rows = await prisma.serviceAvailability.findMany({
      where: {
        buildingId,
        isEligible: true
      },
      include: {
        servicePlan: true
      },
      orderBy: {
        scoreBoost: 'desc'
      }
    });

    const eligiblePlans = rows.map((row) => ({
      plan_code: row.servicePlan.code,
      name: row.servicePlan.name,
      provider: row.servicePlan.provider,
      infra_type: row.infrastructureType,
      max_speed_mbps: row.servicePlan.maxSpeedMbps,
      monthly_price_yen: row.servicePlan.monthlyPriceYen,
      reason: row.reason,
      score_boost: row.scoreBoost
    }));

    return NextResponse.json({
      buildingId,
      eligible_plans: eligiblePlans
    });
  } catch {
    return internalError();
  }
}
