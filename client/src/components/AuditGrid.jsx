import React, { useState } from 'react';
import YearlyView from './calendar/YearlyView';
import MonthlyView from './calendar/MonthlyView';
import clsx from 'clsx';

export default function AuditGrid({ logs, year }) {
  const [viewMode, setViewMode] = useState('yearly'); // 'yearly' | 'monthly'

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 mt-6 md:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">Your {year} Calendar</h2>
        <div className="flex bg-slate-900 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setViewMode('yearly')}
            className={clsx(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              viewMode === 'yearly'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Yearly
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={clsx(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              viewMode === 'monthly'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {viewMode === 'yearly' ? (
          <YearlyView logs={logs} year={year} />
        ) : (
          <MonthlyView logs={logs} year={year} />
        )}
      </div>
    </div>
  );
}
