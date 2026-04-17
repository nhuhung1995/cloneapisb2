import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeJapaneseAddress } from '@/lib/normalization';
import { badRequest, internalError } from '@/lib/http';
import { findDemoChomesByZip } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
  try {
    const zipCode = request.nextUrl.searchParams.get('zipCode')?.replace(/\D/g, '') ?? '';

    if (zipCode.length < 3) {
      return badRequest('zipCode must be at least 3 digits');
    }

    let payload: Array<{
      chomeId: string;
      zipCode: string;
      prefecture: string;
      city: string;
      chome: string;
      normalized: string;
    }> = [];

    try {
      const rows = await prisma.chome.findMany({
        where: {
          zipCode: zipCode.length === 7 ? zipCode : { startsWith: zipCode }
        },
        include: {
          city: {
            include: {
              prefecture: true
            }
          }
        },
        take: 80
      });

      payload = rows.map((row) => ({
        chomeId: row.id,
        zipCode: row.zipCode,
        prefecture: row.city.prefecture.nameJa,
        city: row.city.nameJa,
        chome: row.nameJa,
        normalized: normalizeJapaneseAddress(
          `${row.city.prefecture.nameJa}${row.city.nameJa}${row.nameJa}`
        )
      }));
    } catch {
      payload = [];
    }

    if (!payload.length) {
      payload = findDemoChomesByZip(zipCode).map((x) => ({
        ...x,
        normalized: normalizeJapaneseAddress(`${x.prefecture}${x.city}${x.chome}`)
      }));
    }

    return NextResponse.json({
      zipCode,
      count: payload.length,
      items: payload
    });
  } catch {
    return internalError();
  }
}
