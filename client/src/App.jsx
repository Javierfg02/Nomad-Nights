import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Summary from './components/Summary';
import AuditGrid from './components/AuditGrid';
import { getYear, parseISO, format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function App() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/logs`);
      setLogs(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch logs. Ensure server is running.');
      if (import.meta.env.DEV) {
        console.warn('Using mock data for development demonstration');
        setLogs([
          { date: '2025-12-20', country_code: 'US', country_name: 'United States', city: 'New York' },
          { date: '2025-12-21', country_code: 'ES', country_name: 'Spain', city: 'Madrid' },
          { date: '2025-01-01', country_code: 'FR', country_name: 'France', city: 'Paris' }, // Different year test
          { date: '2025-12-22', country_code: 'ES', country_name: 'Spain', city: 'Barcelona' },
        ]);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set(logs.map(log => getYear(parseISO(log.date))));
    // Always include selected year (default current) even if no logs
    years.add(selectedYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [logs, selectedYear]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => getYear(parseISO(log.date)) === selectedYear);
  }, [logs, selectedYear]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Nomad Nights
            </h1>
            <p className="text-slate-400 mt-2">Precision Tax Residency Tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700"
            >
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <>
            <Summary logs={filteredLogs} />
            <AuditGrid logs={filteredLogs} year={selectedYear} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
