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
    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedCommand, setCopiedCommand] = useState(false);

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

    const copyToClipboard = (text, setter) => {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
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
            const exportFileDefaultName = `nomad-nights-records-${selectedYear}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } catch (err) {
            console.error('Failed to download certificate:', err);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Automatic Tracker Setup Card */}
                <div className="lg:col-span-2 bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="max-w-2xl space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Automatic Tracker Setup</h2>
                                    <p className="text-slate-400 text-sm mt-1">Configure your device for seamless daily tracking</p>
                                </div>
                            </div>

                            <p className="text-slate-300 leading-relaxed text-lg">
                                To ensure accurate tax residency records, this web-app necessitates a companion <span className="text-indigo-400 font-semibold underline decoration-indigo-500/30 underline-offset-4">iOS/macOS Shortcut</span> to log your location daily.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                            <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/60 text-left">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                                    <h4 className="text-white font-bold">Download & Configure</h4>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Download the shortcut and edit the <span className="text-slate-200 font-medium">URL</span> section. Replace <code className="text-pink-400 bg-pink-400/10 px-1.5 py-0.5 rounded">API_CONNECTIVITY_KEY_HERE</code> with your key below.
                                </p>
                            </div>
                            <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/60 text-left">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                                    <h4 className="text-white font-bold">Automate Daily</h4>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    In the Shortcuts app, go to the <span className="text-slate-200 font-medium">Automations</span> tab and schedule this shortcut to run daily at <span className="text-indigo-400 font-bold">11:55 PM</span>.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full pt-4">
                            <a
                                href="https://www.icloud.com/shortcuts/45fa496027a446be8cdc891b7ca93659"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Shortcut
                            </a>

                            {token ? (
                                <div className="w-full max-w-md bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center transition-all focus-within:border-indigo-500/50">
                                    <code className="flex-grow px-4 text-emerald-400 font-mono text-sm truncate select-all">{token}</code>
                                    <button
                                        onClick={() => copyToClipboard(token, setCopiedToken)}
                                        className={clsx(
                                            "min-w-[100px] px-5 py-2.5 rounded-lg transition-all text-xs font-bold uppercase tracking-wider",
                                            copiedToken
                                                ? "bg-emerald-500 text-white"
                                                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                                        )}
                                    >
                                        {copiedToken ? 'Copied!' : 'Copy Key'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={generateToken}
                                    disabled={loading}
                                    className="w-full sm:w-auto bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-8 py-4 rounded-xl font-bold border border-emerald-500/20 transition-all active:scale-95"
                                >
                                    {loading ? 'Generating...' : 'Generate Connection Key'}
                                </button>
                            )}
                        </div>

                        {token && (
                            <button
                                onClick={generateToken}
                                className="text-[10px] text-slate-600 hover:text-red-400 transition-colors uppercase tracking-widest font-bold"
                            >
                                Regenerate Key (invalidates previous)
                            </button>
                        )}
                    </div>
                </div>

                {/* Official Tax Records Section */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Official Tax Records</h2>
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            )}
                            Download Signed Logs ({selectedYear})
                        </button>
                    </div>
                </div>

                {/* Verification Tools Section */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Verification Tools</h2>
                            <p className="text-slate-500 text-xs mt-0.5">Server Public Key for authenticity</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {publicKey ? (
                            <div className="space-y-3">
                                <div className="relative group">
                                    <pre className="bg-black/50 p-3 rounded-xl text-[9px] text-slate-500 overflow-x-auto border border-slate-800 font-mono leading-tight max-h-32">
                                        {publicKey}
                                    </pre>
                                    <button
                                        onClick={() => copyToClipboard(publicKey, setCopiedKey)}
                                        className={clsx(
                                            "absolute top-2 right-2 text-[10px] px-3 py-1.5 rounded-lg border border-slate-700 transition-all font-bold",
                                            copiedKey
                                                ? "bg-emerald-500 text-white border-emerald-400"
                                                : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                                        )}
                                    >
                                        {copiedKey ? 'Copied!' : 'Copy Key'}
                                    </button>
                                </div>
                                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 group relative">
                                    <p className="text-slate-300 text-[10px] font-mono uppercase tracking-widest font-bold mb-1">Audit Command</p>
                                    <code className="block text-slate-500 text-[10px] break-all font-mono">
                                        openssl dgst -sha256 -verify public.pem -signature sig.bin data.json
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard('openssl dgst -sha256 -verify public.pem -signature sig.bin data.json', setCopiedCommand)}
                                        className={clsx(
                                            "absolute top-1/2 -translate-y-1/2 right-2 text-[10px] px-2 py-1 rounded transition-all font-bold",
                                            copiedCommand
                                                ? "text-emerald-400"
                                                : "text-slate-600 hover:text-slate-400"
                                        )}
                                    >
                                        {copiedCommand ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleFetchPublicKey}
                                className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-3 rounded-xl font-semibold border border-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <span>🔍</span>
                                Reveal Verification Key
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
