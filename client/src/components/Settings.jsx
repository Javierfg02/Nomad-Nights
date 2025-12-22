import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Settings({ selectedYear }) {
    const { currentUser } = useAuth();
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [publicKey, setPublicKey] = useState('');

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

    const handleFetchPublicKey = async () => {
        try {
            const response = await axios.get(`${API_URL}/public-key`);
            setPublicKey(response.data.publicKey);
            setShowKey(!showKey);
        } catch (err) {
            console.error('Failed to fetch public key:', err);
        }
    };

    const handleDownloadCertificate = async () => {
        if (!currentUser) return;
        setDownloading(true);
        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get(`${API_URL}/certificate/${selectedYear}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const dataStr = JSON.stringify(response.data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `nomad-nights-compliance-${selectedYear}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } catch (err) {
            console.error('Failed to download certificate:', err);
            alert('Failed to generate compliance certificate.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Connectivity Section */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">API Connectivity</h2>
                            <p className="text-slate-500 text-xs mt-0.5">Automate logs via Shortcuts</p>
                        </div>
                    </div>

                    <p className="text-slate-400 text-sm mb-6 flex-grow">
                        Connect your device to your account using this secure token.
                        Required for the iOS "Log Nomad Location" automated shortcut.
                    </p>

                    <div className="space-y-4">
                        {token ? (
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between group">
                                <code className="text-emerald-400 font-mono text-xs break-all truncate mr-4">{token}</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(token);
                                        alert('Token copied to clipboard');
                                    }}
                                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
                                >
                                    Copy
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={generateToken}
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-900/20 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Generating...' : 'Generate Access Token'}
                            </button>
                        )}

                        {token && (
                            <button
                                onClick={generateToken}
                                disabled={loading}
                                className="w-full text-xs text-slate-500 hover:text-red-400 py-1 transition-colors"
                            >
                                Regenerate Token (Invalidates old one)
                            </button>
                        )}
                    </div>
                </div>

                {/* Compliance Records Section */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Tax Compliance</h2>
                            <p className="text-slate-500 text-xs mt-0.5">Evidentiary records for {selectedYear}</p>
                        </div>
                    </div>

                    <p className="text-slate-400 text-sm mb-6 flex-grow">
                        Download cryptographically signed records for verification by tax authorities.
                        Includes GPS and IP metadata to prove physical presence.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleDownloadCertificate}
                            disabled={downloading}
                            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-3 rounded-xl font-semibold border border-emerald-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {downloading ? (
                                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <span>🛡️</span>
                            )}
                            Download Signed Logs ({selectedYear})
                        </button>

                        <button
                            onClick={handleFetchPublicKey}
                            className="w-full text-xs text-slate-500 hover:text-white py-1 transition-colors"
                        >
                            {showKey ? 'Hide Public Key' : 'Show Server Public Key for Verification'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Public Key Display Area */}
            {showKey && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold">Tax Authority Verification Protocol</h3>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 font-mono">RSA-2048 / SHA-256</span>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed mb-4">
                        Provide this Public Key and the downloaded JSON manifest to the auditing authority.
                        They can verify the integrity of the record using the standard OpenSSL library.
                    </p>

                    <div className="space-y-4">
                        <div className="relative group">
                            <pre className="bg-black/50 p-4 rounded-xl text-[10px] text-slate-500 overflow-x-auto border border-slate-800 font-mono leading-tight">
                                {publicKey}
                            </pre>
                            <button
                                onClick={() => navigator.clipboard.writeText(publicKey)}
                                className="absolute top-2 right-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Copy Key
                            </button>
                        </div>

                        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <p className="text-slate-300 text-[10px] font-mono uppercase tracking-widest font-bold">Verification Command</p>
                            </div>
                            <div className="relative group">
                                <code className="block text-slate-400 text-[11px] break-all bg-black/40 p-3 rounded-lg border border-slate-900 font-mono">
                                    openssl dgst -sha256 -verify public_key.pem -signature signature.bin manifest.json
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText('openssl dgst -sha256 -verify public_key.pem -signature signature.bin manifest.json')}
                                    className="absolute top-1/2 -translate-y-1/2 right-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Installation Section */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Mobile Setup</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Install the official Nomad Log Shortcut</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-grow text-slate-400 text-sm">
                        Install our secure iOS Shortcut to log your location with a single tap.
                        The shortcut uses your device's native GPS to provide cryptographically verifiable proof of presence.
                    </div>
                    <a
                        href="https://www.icloud.com/shortcuts/0144efd5bb9547a79234495ed17cb0fa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whitespace-nowrap bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-900/20 transition-all flex items-center gap-2"
                    >
                        Install Shortcut
                    </a>
                </div>
            </div>
        </div>
    );
}
