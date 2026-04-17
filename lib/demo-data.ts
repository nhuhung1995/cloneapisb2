export type DemoChome = {
  chomeId: string;
  zipCode: string;
  prefecture: string;
  city: string;
  chome: string;
};

export type DemoBuilding = {
  buildingId: string;
  chomeId: string;
  banchiNumber: string;
  goNumber: string;
  buildingName: string;
  plans: Array<{
    plan_code: string;
    name: string;
    provider: string;
    infra_type: string;
    max_speed_mbps: number;
    monthly_price_yen: number;
    reason: string;
    score_boost: number;
  }>;
};

const DEMO_CHOMES: DemoChome[] = [
  { chomeId: 'demo-chome-3320034-2', zipCode: '3320034', prefecture: '埼玉県', city: '川口市', chome: '芝2丁目' },
  { chomeId: 'demo-chome-3320035-1', zipCode: '3320035', prefecture: '埼玉県', city: '川口市', chome: '芝1丁目' },
  { chomeId: 'demo-chome-3320035-2', zipCode: '3320035', prefecture: '埼玉県', city: '川口市', chome: '芝2丁目' },
  { chomeId: 'demo-chome-3320035-3', zipCode: '3320035', prefecture: '埼玉県', city: '川口市', chome: '芝3丁目' },
  { chomeId: 'demo-chome-3320035-4', zipCode: '3320035', prefecture: '埼玉県', city: '川口市', chome: '芝4丁目' }
];

const DEMO_BUILDINGS: DemoBuilding[] = [
  {
    buildingId: 'demo-bld-3320034-2-17-6-a',
    chomeId: 'demo-chome-3320034-2',
    banchiNumber: '17',
    goNumber: '6',
    buildingName: '芝2-17 レジデンスA',
    plans: [
      {
        plan_code: 'SBHIKARI-1G',
        name: 'SoftBank Hikari 1G',
        provider: 'SoftBank',
        infra_type: 'FIBER_1G',
        max_speed_mbps: 1000,
        monthly_price_yen: 5200,
        reason: 'FTTH available',
        score_boost: 0.2
      },
      {
        plan_code: 'SBAIR-5G',
        name: 'SoftBank Air 5G',
        provider: 'SoftBank',
        infra_type: 'AIR_5G',
        max_speed_mbps: 2100,
        monthly_price_yen: 5368,
        reason: '5G area supported',
        score_boost: 0.1
      }
    ]
  },
  {
    buildingId: 'demo-bld-3320035-1-12-3-a',
    chomeId: 'demo-chome-3320035-1',
    banchiNumber: '12',
    goNumber: '3',
    buildingName: '芝1-12 マンション',
    plans: [
      {
        plan_code: 'SBHIKARI-10G',
        name: 'SoftBank Hikari 10G',
        provider: 'SoftBank',
        infra_type: 'FIBER_10G',
        max_speed_mbps: 10000,
        monthly_price_yen: 6380,
        reason: '10G-enabled building',
        score_boost: 0.35
      }
    ]
  },
  {
    buildingId: 'demo-bld-3320035-2-17-6-a',
    chomeId: 'demo-chome-3320035-2',
    banchiNumber: '17',
    goNumber: '6',
    buildingName: '芝2-17 レジデンス',
    plans: [
      {
        plan_code: 'SBHIKARI-1G',
        name: 'SoftBank Hikari 1G',
        provider: 'SoftBank',
        infra_type: 'FIBER_1G',
        max_speed_mbps: 1000,
        monthly_price_yen: 5200,
        reason: 'Fiber available',
        score_boost: 0.25
      }
    ]
  }
];

export function findDemoChomesByZip(zipQuery: string) {
  return DEMO_CHOMES.filter((x) =>
    zipQuery.length === 7 ? x.zipCode === zipQuery : x.zipCode.startsWith(zipQuery)
  );
}

export function findDemoBuildingsByChome(chomeId: string) {
  return DEMO_BUILDINGS.filter((x) => x.chomeId === chomeId);
}

export function findDemoBuildingById(buildingId: string) {
  return DEMO_BUILDINGS.find((x) => x.buildingId === buildingId) ?? null;
}

