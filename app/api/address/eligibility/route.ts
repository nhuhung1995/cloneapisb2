import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { badRequest, internalError } from '@/lib/http';
import { findDemoBuildingById } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
  try {
    const buildingId = request.nextUrl.searchParams.get('buildingId') ?? '';

    if (!buildingId) {
      return badRequest('buildingId is required');
    }

    let eligiblePlans: Array<{
      plan_code: string;
      name: string;
      provider: string;
      infra_type: string;
      max_speed_mbps: number;
      monthly_price_yen: number | null;
      reason: string | null;
      score_boost: number;
    }> = [];

    try {
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

      eligiblePlans = rows.map((row) => ({
        plan_code: row.servicePlan.code,
        name: row.servicePlan.name,
        provider: row.servicePlan.provider,
        infra_type: row.infrastructureType,
        max_speed_mbps: row.servicePlan.maxSpeedMbps,
        monthly_price_yen: row.servicePlan.monthlyPriceYen,
        reason: row.reason,
        score_boost: row.scoreBoost
      }));
    } catch {
      eligiblePlans = [];
    }

    if (!eligiblePlans.length) {
      const demo = findDemoBuildingById(buildingId);
      if (demo) {
        eligiblePlans = demo.plans;
      }
    }

    return NextResponse.json({
      buildingId,
      eligible_plans: eligiblePlans
    });
  } catch {
    return internalError();
  }
}
