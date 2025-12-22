import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Settings() {
    const { currentUser } = useAuth();
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch existing token on load
    useEffect(() => {
        if (currentUser) {
            fetchToken();
        }
    }, [currentUser]);

    const getAuthHeaders = async () => {
        if (!currentUser) return {};
        const idToken = await currentUser.getIdToken();
        return { Authorization: `Bearer ${idToken}` };
    };

    const fetchToken = async () => {
        try {
            const headers = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/token`, { headers });
            if (response.data.token) {
                setToken(response.data.token);
            }
        } catch (error) {
            console.error("Error fetching token:", error);
        }
    };

    const generateToken = async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await axios.post(`${API_URL}/generate-token`, {}, { headers });
            setToken(response.data.token);
        } catch (error) {
            console.error("Error generating token:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">API Access</h2>
            <p className="text-slate-400 mb-4">
                Use this token in your iOS Shortcut to log data to your account.
                This token is unique to you and will persist until you regenerate it.
            </p>

            {token ? (
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                    <code className="text-emerald-400 font-mono break-all">{token}</code>
                    <button
                        onClick={() => navigator.clipboard.writeText(token)}
                        className="ml-4 text-sm text-slate-400 hover:text-white"
                    >
                        Copy
                    </button>
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-slate-500 mb-4">No API Token found.</p>
                    <button
                        onClick={generateToken}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate New API Token'}
                    </button>
                </div>
            )}

            {token && (
                <button
                    onClick={generateToken}
                    disabled={loading}
                    className="mt-4 text-xs text-red-400 hover:text-red-300 underline"
                >
                    Regenerate (Invalidates old token)
                </button>
            )}

            <div className="mt-6 text-sm text-slate-500">
                <h3 className="font-bold text-slate-400 mb-2">How to use:</h3>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Open your "Log Nomad Location" Shortcut.</li>
                    <li>Find the "Authorization" header field.</li>
                    <li>Paste this token as the value (keep "Bearer " prefix).</li>
                </ol>
            </div>
        </div>
    );
}
