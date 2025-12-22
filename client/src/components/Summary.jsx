import React from 'react';
import CountryStats from './CountryStats';

export default function Summary({ logs }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Where you spent your nights</h2>
      <CountryStats logs={logs} />
    </div>
  );
}
