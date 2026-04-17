import { AddressChecker } from '@/components/address-checker';

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Network Infrastructure Checker</h1>
        <p className="mt-2 text-sm text-slate-600">
          Flow: Zipcode -&gt; Chome -&gt; Banchi/Building Match -&gt; Eligible Plans
        </p>
        <AddressChecker />
      </div>
    </main>
  );
}
