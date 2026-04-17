'use client';

import { useEffect, useMemo, useState } from 'react';

type ZipItem = {
  chomeId: string;
  zipCode: string;
  prefecture: string;
  city: string;
  chome: string;
  normalized: string;
};

type MatchPayload = {
  match: {
    id: string;
    score: number;
    reason: string;
  } | null;
  reason?: string;
};

type Plan = {
  plan_code: string;
  name: string;
  provider: string;
  infra_type: string;
  max_speed_mbps: number;
  monthly_price_yen: number | null;
  reason?: string | null;
  score_boost: number;
};

const MIN_ZIP_LENGTH = 3;

export function AddressChecker() {
  const [zipCode, setZipCode] = useState('');
  const [zipSuggestions, setZipSuggestions] = useState<ZipItem[]>([]);
  const [selectedChome, setSelectedChome] = useState<ZipItem | null>(null);

  const [rawBanchi, setRawBanchi] = useState('');
  const [banchiSuggestions, setBanchiSuggestions] = useState<Array<{ buildingId: string; label: string }>>([]);
  const [matchedBuildingId, setMatchedBuildingId] = useState<string>('');
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const sanitized = zipCode.replace(/\D/g, '').slice(0, 7);
    if (sanitized !== zipCode) {
      setZipCode(sanitized);
      return;
    }

    if (sanitized.length !== MIN_ZIP_LENGTH) {
      setZipSuggestions([]);
      setSelectedChome(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address/zipcode?zipCode=${sanitized}`);
        const json = await res.json();
        setZipSuggestions(json.items ?? []);
      } catch {
        setZipSuggestions([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [zipCode]);

  const canMatch = Boolean(selectedChome && rawBanchi.trim());

  const summaryAddress = useMemo(() => {
    if (!selectedChome) return '-';
    return `${selectedChome.prefecture} ${selectedChome.city} ${selectedChome.chome}`;
  }, [selectedChome]);

  useEffect(() => {
    if (!selectedChome || !rawBanchi.trim()) {
      setBanchiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const q = encodeURIComponent(rawBanchi);
        const res = await fetch(
          `/api/address/banchi-suggest?chomeId=${selectedChome.chomeId}&query=${q}`
        );
        const json = await res.json();
        setBanchiSuggestions(json.suggestions ?? []);
      } catch {
        setBanchiSuggestions([]);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [selectedChome, rawBanchi]);

  async function runBanchiMatching() {
    if (!selectedChome || !rawBanchi.trim()) return;

    setLoading(true);
    setError('');
    setPlans([]);

    try {
      const res = await fetch('/api/address/banchi-matching', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chomeId: selectedChome.chomeId,
          rawBanchi
        })
      });

      const json: MatchPayload = await res.json();

      if (!json.match) {
        setMatchedBuildingId('');
        setMatchScore(null);
        setError(json.reason ?? 'No matching building found.');
        return;
      }

      setMatchedBuildingId(json.match.id);
      setMatchScore(json.match.score);
    } catch {
      setError('Failed to match banchi/building.');
    } finally {
      setLoading(false);
    }
  }

  async function checkEligibility() {
    if (!matchedBuildingId) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/address/eligibility?buildingId=${matchedBuildingId}`);
      const json = await res.json();
      setPlans(json.eligible_plans ?? []);
    } catch {
      setError('Failed to fetch eligibility plans.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Step 1: Enter Zipcode (Realtime Suggestion)</p>
        <p className="mt-1 text-xs text-slate-500">Suggestions start from 3 digits.</p>
        <input
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-600 focus:ring-2"
          placeholder="e.g. 3320034"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
        />

        {zipSuggestions.length > 0 && (
          <ul className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white">
            {zipSuggestions.map((item) => (
              <li key={item.chomeId}>
                <button
                  type="button"
                  onClick={() => setSelectedChome(item)}
                  className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-brand-50"
                >
                  {item.prefecture} {item.city} {item.chome}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Step 2: Confirm Chome</p>
        <p className="mt-2 text-sm text-slate-900">{summaryAddress}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Step 3: Input Banchi / Building Name</p>
        <input
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-600 focus:ring-2"
          placeholder="e.g. 2-17 or 2丁目17番6号 レジデンス"
          value={rawBanchi}
          onChange={(e) => setRawBanchi(e.target.value)}
        />
        {banchiSuggestions.length > 0 && (
          <ul className="mt-2 max-h-44 overflow-auto rounded-lg border border-slate-200 bg-white">
            {banchiSuggestions.map((item) => (
              <li key={item.buildingId}>
                <button
                  type="button"
                  className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-brand-50"
                  onClick={() => {
                    setMatchedBuildingId(item.buildingId);
                    setRawBanchi(item.label);
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          disabled={!canMatch || loading}
          onClick={runBanchiMatching}
          className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? 'Matching...' : 'Run Banchi Matching'}
        </button>

        {matchedBuildingId && (
          <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
            <p>Matched Building ID: {matchedBuildingId}</p>
            <p>Matching Score: {matchScore ?? '-'}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Step 4: Check Eligibility</p>
        <button
          type="button"
          disabled={!matchedBuildingId || loading}
          onClick={checkEligibility}
          className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? 'Checking...' : 'Get Eligible Plans'}
        </button>

        {plans.length > 0 && (
          <ul className="mt-3 space-y-2">
            {plans.map((plan) => (
              <li key={plan.plan_code} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <p className="font-semibold text-slate-900">{plan.name}</p>
                <p className="text-slate-600">Provider: {plan.provider}</p>
                <p className="text-slate-600">Infra: {plan.infra_type}</p>
                <p className="text-slate-600">Speed: {plan.max_speed_mbps} Mbps</p>
                <p className="text-slate-600">Price: {plan.monthly_price_yen ?? '-'} JPY / month</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </section>
  );
}
