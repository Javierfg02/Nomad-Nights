import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { getYear, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import Summary from './components/Summary';
import YearlyView from './components/calendar/YearlyView';
import MonthlyView from './components/calendar/MonthlyView';
import Login from './components/Login';
import Setup from './components/Setup';
import Audit from './components/Audit';
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
  const [editingData, setEditingData] = useState(null);
  const [toast, setToast] = useState(null);

  // View State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('monthly'); // 'yearly' | 'monthly'

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
      try {
        return getYear(parseISO(log.date));
      } catch {
        return null;
      }
    }).filter(Boolean));
    years.add(new Date().getFullYear());
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
      await axios.post(`${API_URL}/log`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchLogs();
    } catch (err) {
      console.error(err);
      alert('Failed to save log. Please try again.');
    }
  };

  const handleDeleteLog = async (date) => {
    if (!currentUser || !date) return;
    if (!confirm('Are you sure you want to delete this log?')) return;

    try {
      const token = await currentUser.getIdToken();
      await axios.delete(`${API_URL}/log/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchLogs();
      setEditingData(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete log.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-800 text-slate-200 px-4 py-2 rounded-full border border-slate-700 shadow-lg text-sm font-medium flex items-center">
            <span className="mr-2">🚫</span>
            {toast}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <Link to="/" className="group">
            <h1 className="text-4xl font-black text-white tracking-tighter group-hover:text-indigo-400 transition-colors">
              Nomad Nights
            </h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Tax Residency tracking</p>
          </Link>

          <div className="flex items-center space-x-6">
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-slate-900 border border-slate-800 text-white py-2 px-4 pr-10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:bg-slate-800 transition-colors shadow-lg"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="h-4 w-4 fill-current font-bold" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              <Link
                to="/setup"
                className="text-slate-400 hover:text-white text-sm font-black uppercase tracking-widest transition-all hover:scale-105"
              >
                Setup
              </Link>
              <Link
                to="/audit"
                className="text-slate-400 hover:text-white text-sm font-black uppercase tracking-widest transition-all hover:scale-105"
              >
                Audit
              </Link>
              <button
                onClick={logout}
                className="text-slate-500 hover:text-red-400 text-xs font-black uppercase tracking-widest transition-colors py-2 px-4 border border-slate-900 rounded-xl hover:bg-red-500/5 hover:border-red-500/20"
              >
                Logout
              </button>
            </nav>
          </div>
        </header>

        <Summary logs={filteredLogs} selectedYear={selectedYear} />

        <div className="space-y-8 mt-12">
          <div className="bg-slate-900/20 p-8 rounded-[2rem] border border-slate-800/50 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {selectedYear} Residency Calendar
              </h2>
              <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                <button
                  onClick={() => setViewMode('yearly')}
                  className={clsx(
                    "px-5 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all",
                    viewMode === 'yearly'
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/30"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Yearly
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={clsx(
                    "px-5 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all",
                    viewMode === 'monthly'
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/30"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="animate-in fade-in duration-700">
              {viewMode === 'yearly' ? (
                <YearlyView logs={filteredLogs} year={selectedYear} onDayClick={handleDayClick} />
              ) : (
                <MonthlyView logs={filteredLogs} year={selectedYear} onDayClick={handleDayClick} />
              )}
            </div>
          </div>
        </div>
      </div>

      <EditLogDialog
        isOpen={!!editingData}
        onClose={() => setEditingData(null)}
        date={editingData?.date}
        initialData={editingData?.initialData}
        onSave={handleSaveLog}
        onDelete={handleDeleteLog}
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
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/audit" element={<PrivateRoute><Audit /></PrivateRoute>} />
          <Route path="/setup" element={<PrivateRoute><Setup /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
