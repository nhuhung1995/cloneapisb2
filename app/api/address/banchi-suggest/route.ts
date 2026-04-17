import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeJapaneseAddress } from '@/lib/normalization';
import { badRequest, internalError } from '@/lib/http';
import { findDemoBuildingsByChome } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
  try {
    const chomeId = request.nextUrl.searchParams.get('chomeId') ?? '';
    const query = request.nextUrl.searchParams.get('query') ?? '';

    if (!chomeId) {
      return badRequest('chomeId is required');
    }

    const normalized = normalizeJapaneseAddress(query);

    let suggestions: Array<{ buildingId: string; label: string; normalized: string }> = [];

    try {
      const rows = await prisma.banchi.findMany({
        where: { chomeId },
        include: {
          buildings: {
            select: { id: true, nameJa: true, normalizationKey: true },
            take: 20
          }
        },
        take: 80
      });

      suggestions = rows
        .flatMap((row) =>
          row.buildings.map((building) => {
            const label = `${row.banchiNumber}${row.goNumber ? `-${row.goNumber}` : ''}${building.nameJa ? ` ${building.nameJa}` : ''}`;
            return {
              buildingId: building.id,
              label,
              normalized: normalizeJapaneseAddress(label)
            };
          })
        )
        .filter((x) => !normalized || x.normalized.includes(normalized))
        .slice(0, 20);
    } catch {
      suggestions = [];
    }

    if (!suggestions.length) {
      suggestions = findDemoBuildingsByChome(chomeId)
        .map((x) => {
          const label = `${x.banchiNumber}-${x.goNumber} ${x.buildingName}`;
          return {
            buildingId: x.buildingId,
            label,
            normalized: normalizeJapaneseAddress(label)
          };
        })
        .filter((x) => !normalized || x.normalized.includes(normalized))
        .slice(0, 20);
    }

    return NextResponse.json({ suggestions });
  } catch {
    return internalError();
  }
}
