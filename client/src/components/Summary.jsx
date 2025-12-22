import React from 'react';
import CountryStats from './CountryStats';

export default function Summary({ logs, selectedYear }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Summary</h2>
        <p className="text-slate-500 text-sm">Overview of your residency for {selectedYear}</p>
      </div>

      <CountryStats logs={logs} />
    </div>
  );
}
