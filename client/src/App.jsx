import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Summary from './components/Summary';
import AuditGrid from './components/AuditGrid';
import Login from './components/Login';
import Settings from './components/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getYear, parseISO, format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [currentUser]);

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
      setError('Failed to fetch logs. Ensure server is running.');
    } finally {
      setLoading(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set(logs.map(log => getYear(parseISO(log.date))));
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
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {showSettings ? 'Hide Settings' : 'Settings'}
            </button>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
            <div className="h-6 w-px bg-slate-700 mx-2"></div>
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

        {showSettings && <Settings />}

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
