import { PrismaClient, InfrastructureType } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeJapaneseAddress(input = '') {
  return input
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '')
    .replace(/丁目/g, '-')
    .replace(/番地/g, '-')
    .replace(/番/g, '-')
    .replace(/号/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const pref = await prisma.prefecture.upsert({
    where: { code: '11' },
    update: {},
    create: {
      code: '11',
      nameJa: '埼玉県',
      normalizationKey: normalizeJapaneseAddress('埼玉県')
    }
  });

  const city = await prisma.city.upsert({
    where: {
      prefectureId_normalizationKey: {
        prefectureId: pref.id,
        normalizationKey: normalizeJapaneseAddress('川口市')
      }
    },
    update: {},
    create: {
      prefectureId: pref.id,
      nameJa: '川口市',
      normalizationKey: normalizeJapaneseAddress('川口市')
    }
  });

  const chome = await prisma.chome.upsert({
    where: {
      cityId_normalizationKey_zipCode: {
        cityId: city.id,
        normalizationKey: normalizeJapaneseAddress('芝2丁目'),
        zipCode: '3320034'
      }
    },
    update: {},
    create: {
      cityId: city.id,
      zipCode: '3320034',
      nameJa: '芝2丁目',
      chomeNumber: 2,
      normalizationKey: normalizeJapaneseAddress('芝2丁目')
    }
  });

  const banchi = await prisma.banchi.upsert({
    where: {
      chomeId_normalizationKey: {
        chomeId: chome.id,
        normalizationKey: normalizeJapaneseAddress('17-6')
      }
    },
    update: {},
    create: {
      chomeId: chome.id,
      banchiNumber: '17',
      goNumber: '6',
      normalizationKey: normalizeJapaneseAddress('17-6')
    }
  });

  let building = await prisma.building.findFirst({
    where: {
      banchiId: banchi.id,
      normalizationKey: normalizeJapaneseAddress('芝2-17 レジデンス')
    }
  });

  if (!building) {
    building = await prisma.building.create({
      data: {
        banchiId: banchi.id,
        nameJa: '芝2-17 レジデンス',
        normalizationKey: normalizeJapaneseAddress('芝2-17 レジデンス')
      }
    });
  }

  const hikari = await prisma.servicePlan.upsert({
    where: { code: 'SBHIKARI-1G' },
    update: {},
    create: {
      code: 'SBHIKARI-1G',
      name: 'SoftBank Hikari 1G',
      provider: 'SoftBank',
      infrastructureType: InfrastructureType.FIBER_1G,
      maxSpeedMbps: 1000,
      monthlyPriceYen: 5200
    }
  });

  const air = await prisma.servicePlan.upsert({
    where: { code: 'SBAIR-5G' },
    update: {},
    create: {
      code: 'SBAIR-5G',
      name: 'SoftBank Air 5G',
      provider: 'SoftBank',
      infrastructureType: InfrastructureType.AIR_5G,
      maxSpeedMbps: 2100,
      monthlyPriceYen: 5368
    }
  });

  await prisma.serviceAvailability.upsert({
    where: {
      buildingId_servicePlanId: {
        buildingId: building.id,
        servicePlanId: hikari.id
      }
    },
    update: {},
    create: {
      buildingId: building.id,
      servicePlanId: hikari.id,
      infrastructureType: InfrastructureType.FIBER_1G,
      isEligible: true,
      reason: 'FTTH available in this building',
      scoreBoost: 0.2
    }
  });

  await prisma.serviceAvailability.upsert({
    where: {
      buildingId_servicePlanId: {
        buildingId: building.id,
        servicePlanId: air.id
      }
    },
    update: {},
    create: {
      buildingId: building.id,
      servicePlanId: air.id,
      infrastructureType: InfrastructureType.AIR_5G,
      isEligible: true,
      reason: '5G signal strong area',
      scoreBoost: 0.1
    }
  });

  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
