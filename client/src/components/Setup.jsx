import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { clsx } from 'clsx';
import { Smartphone, Download, CheckCircle, Info, ArrowLeft, Key, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Setup() {
    const { currentUser } = useAuth();
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);

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

    const copyToClipboard = (text, setter) => {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center gap-4">
                    <Link to="/">
                        <Button variant="ghost" size="icon" className="rounded-full bg-slate-900/50 hover:bg-slate-800 border border-slate-800">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Automatic Tracker Setup</h1>
                        <p className="text-slate-500 text-sm">Configure your device for seamless daily tracking</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-8">
                    {/* Setup Guide Card */}
                    <Card className="bg-slate-900/50 border-slate-800 shadow-xl border-t-indigo-500/50 border-t-2">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                                    <Smartphone className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-2xl">Configuration Guide</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400 text-base">
                                Accurate tax residency records require a daily log of your location.
                                Follow these steps to automate the process using an iOS or macOS Shortcut.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/60 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Download className="w-12 h-12" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-black">1</span>
                                        <h4 className="text-white font-bold text-lg">Shortcut Info</h4>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Download the Nomad Nights shortcut. The shortcut captures your <span className="text-slate-200 font-bold">GPS coordinates</span> and sends them to the server, which automatically determines your country.
                                        Open the shortcut settings, find the <span className="text-slate-200 font-bold">URL</span> field, and replace the placeholder with your unique <span className="text-indigo-400 font-bold">Connection Key</span>.
                                    </p>
                                </div>
                                <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/60 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <CheckCircle className="w-12 h-12" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-black">2</span>
                                        <h4 className="text-white font-bold text-lg">Automate Daily</h4>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        In the Shortcuts app, create a new <span className="text-slate-200 font-bold">Personal Automation</span>.
                                        Schedule it to run the shortcut daily at <span className="text-emerald-400 font-bold">11:50 PM</span>. Disable "Ask Before Running" for fully automatic logging.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4 border-t border-slate-800">
                                <a
                                    href="https://www.icloud.com/shortcuts/f39a1b73d43344bda6de0ebec4978f24"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-900/30 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Download className="w-5 h-5" />
                                    Download Shortcut
                                </a>

                                {token ? (
                                    <div className="w-full max-w-md bg-slate-950 p-2 rounded-2xl border border-slate-800 flex items-center shadow-inner group transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
                                        <div className="pl-4 pr-2 text-indigo-400">
                                            <Key className="w-4 h-4" />
                                        </div>
                                        <code className="flex-grow px-2 text-emerald-400 font-mono text-sm truncate font-bold">{token}</code>
                                        <button
                                            onClick={() => copyToClipboard(token, setCopiedToken)}
                                            className={clsx(
                                                "px-6 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-widest leading-none h-10",
                                                copiedToken
                                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                                                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                                            )}
                                        >
                                            {copiedToken ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={generateToken}
                                        disabled={loading}
                                        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-7 rounded-2xl font-black transition-all active:scale-95"
                                    >
                                        {loading ? 'Generating...' : 'Generate Connection Key'}
                                    </Button>
                                )}
                            </div>

                            {token && (
                                <div className="text-center">
                                    <button
                                        onClick={generateToken}
                                        className="text-[10px] text-slate-600 hover:text-red-400 transition-colors uppercase tracking-[0.2em] font-black flex items-center gap-2 mx-auto"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Regenerate Key (invalidates previous)
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800 flex items-start gap-4">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                            <Info className="w-5 h-5" />
                        </div>
                        <div className="space-y-2">
                            <h5 className="font-bold text-slate-200">Security & Privacy</h5>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Your Connection Key acts as a unique identifier for your device.
                                It only allows the shortcut to log a location point—it cannot be used to delete data or access your account details.
                                Regenerating the key will immediately stop any old shortcuts from working.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
