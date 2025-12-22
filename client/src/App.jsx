import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getYear, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import Summary from './components/Summary';
import YearlyView from './components/calendar/YearlyView';
import MonthlyView from './components/calendar/MonthlyView';
import Login from './components/Login';
import Settings from './components/Settings';
import EditLogDialog from './components/EditLogDialog';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [toast, setToast] = useState(null);

  // View State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('yearly'); // 'yearly' | 'monthly'

  const fetchLogs = async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`${API_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch logs');
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchLogs();
    }
  }, [currentUser]);

  // Derived State: Available Years
  const availableYears = useMemo(() => {
    const years = new Set(logs.map(log => {
      // Safe parsing in case of bad data
      try {
        return getYear(parseISO(log.date));
      } catch {
        return null;
      }
    }).filter(Boolean));
    years.add(new Date().getFullYear()); // Always include current year
    return Array.from(years).sort((a, b) => b - a);
  }, [logs]);

  // Derived State: Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      try {
        return getYear(parseISO(log.date)) === selectedYear;
      } catch {
        return false;
      }
    });
  }, [logs, selectedYear]);


  // Toast timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDayClick = (date, log) => {
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      setToast("You cannot edit future dates.");
      return;
    }

    setEditingData({
      date,
      initialData: log || null
    });
  };

  const handleSaveLog = async (data) => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();

      // Call backend API to save log
      // POST /api/log
      await axios.post(`${API_URL}/log`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh logs
      await fetchLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to save log. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-800 text-slate-200 px-4 py-2 rounded-full border border-slate-700 shadow-lg text-sm font-medium flex items-center">
            <span className="mr-2">🚫</span>
            {toast}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Nomad Nights
            </h1>
            <p className="text-slate-500 text-sm mt-1">Precision Tax Residency Tracking</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Year Selector */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-slate-900 border border-slate-800 text-white py-1.5 px-4 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-slate-800 transition-colors"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>{currentUser?.email}</span>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              {showSettings ? 'Close Settings' : 'Settings'}
            </button>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {showSettings && <Settings />}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8 text-sm">
            {error}
          </div>
        )}

        {/* Pass filtered logs to Summary so it respects the year filter too */}
        <Summary logs={filteredLogs} />

        <div className="space-y-8">
          <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Audit Grid ({selectedYear})
              </h2>
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                  onClick={() => setViewMode('yearly')}
                  className={clsx(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    viewMode === 'yearly'
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  Yearly
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={clsx(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    viewMode === 'monthly'
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  Monthly
                </button>
              </div>
            </div>

            {viewMode === 'yearly' ? (
              <YearlyView logs={filteredLogs} year={selectedYear} onDayClick={handleDayClick} />
            ) : (
              <MonthlyView logs={filteredLogs} year={selectedYear} onDayClick={handleDayClick} />
            )}
          </div>
        </div>
      </div>

      <EditLogDialog
        isOpen={!!editingData}
        onClose={() => setEditingData(null)}
        date={editingData?.date}
        initialData={editingData?.initialData}
        onSave={handleSaveLog}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
