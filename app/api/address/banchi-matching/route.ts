import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { matchBanchi } from '@/lib/matching';
import { badRequest, internalError } from '@/lib/http';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const chomeId = String(body?.chomeId ?? '');
    const rawBanchi = String(body?.rawBanchi ?? '');

    if (!chomeId || !rawBanchi) {
      return badRequest('chomeId and rawBanchi are required');
    }

    const rows = await prisma.banchi.findMany({
      where: { chomeId },
      include: {
        buildings: {
          select: {
            id: true,
            nameJa: true,
            normalizationKey: true
          }
        }
      },
      take: 1000
    });

    const candidates = rows.flatMap((row) =>
      row.buildings.map((building) => ({
        id: building.id,
        banchiNumber: row.banchiNumber,
        goNumber: row.goNumber,
        buildingName: building.nameJa,
        normalizationKey: building.normalizationKey
      }))
    );

    if (!candidates.length) {
      return NextResponse.json({
        match: null,
        reason: 'No candidates found in selected chome'
      });
    }

    const best = matchBanchi(rawBanchi, candidates);

    return NextResponse.json({
      input: { chomeId, rawBanchi },
      match: best
    });
  } catch {
    return internalError();
  }
}
