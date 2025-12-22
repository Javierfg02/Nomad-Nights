import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, FileSearch, Download, Info, ArrowLeft, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Audit({ selectedYear: initialYear }) {
    const { currentUser } = useAuth();
    const [selectedYear, setSelectedYear] = useState(initialYear || new Date().getFullYear());
    const [file, setFile] = useState(null);
    const [auditResult, setAuditResult] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);



    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setAuditResult(null);
            setError(null);
        }
    };

    const handleDownloadCertificate = async () => {
        if (!currentUser) return;
        setDownloading(true);
        setError(null);
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
            setError("Failed to download records. Ensure you have logs for this year.");
        } finally {
            setDownloading(false);
        }
    };

    const verifyProof = async () => {
        if (!file) return;
        setVerifying(true);
        setError(null);
        setAuditResult(null);

        try {
            const text = await file.text();
            let proof;
            try {
                proof = JSON.parse(text);
            } catch (e) {
                throw new Error("Invalid JSON file. Please upload a valid Nomad Nights certificate.");
            }

            const { manifest, signature } = proof;
            if (!manifest || !signature) {
                throw new Error("Missing manifest or signature in the certificate.");
            }

            // 1. Fetch Public Key
            const response = await axios.get(`${API_URL}/public-key`);
            const publicKeyPem = response.data.publicKey;

            if (!publicKeyPem) {
                throw new Error("Server did not provide a public key for verification.");
            }

            // 2. Prepare Public Key for Web Crypto
            const pemHeader = "-----BEGIN PUBLIC KEY-----";
            const pemFooter = "-----END PUBLIC KEY-----";
            const pemContents = publicKeyPem
                .replace(pemHeader, "")
                .replace(pemFooter, "")
                .replace(/\s/g, "");

            const binaryDerString = window.atob(pemContents);
            const binaryDer = new Uint8Array(binaryDerString.length);
            for (let i = 0; i < binaryDerString.length; i++) {
                binaryDer[i] = binaryDerString.charCodeAt(i);
            }

            const cryptoKey = await window.crypto.subtle.importKey(
                "spki",
                binaryDer.buffer,
                {
                    name: "RSASSA-PKCS1-v1_5",
                    hash: "SHA-256",
                },
                false,
                ["verify"]
            );

            // 3. Verify Signature
            const manifestString = JSON.stringify(manifest);
            const encoder = new TextEncoder();
            const data = encoder.encode(manifestString);

            const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

            const isValid = await window.crypto.subtle.verify(
                "RSASSA-PKCS1-v1_5",
                cryptoKey,
                signatureBytes,
                data
            );

            if (isValid) {
                const stats = {};
                manifest.data.forEach(log => {
                    const country = log.country_name || 'Unknown';
                    stats[country] = (stats[country] || 0) + 1;
                });

                setAuditResult({
                    authentic: true,
                    manifest,
                    stats: Object.entries(stats).sort((a, b) => b[1] - a[1])
                });
            } else {
                setAuditResult({ authentic: false });
            }

        } catch (err) {
            console.error("Audit Error:", err);
            setError(err.message || "An unexpected error occurred during verification.");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="icon" className="rounded-full bg-slate-900/50 hover:bg-slate-800 border border-slate-800 transition-all">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Audit</h1>
                            <p className="text-slate-500 text-sm">Download signed documents and verify their integrity</p>
                        </div>
                    </div>


                </header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Left Column: Actions */}
                    <div className="md:col-span-4 space-y-6">
                        {/* Download Card */}
                        <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden relative group border-t-emerald-500/30 border-t-2">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <History className="w-12 h-12" />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Download className="w-5 h-5 text-emerald-400" />
                                    Official Records
                                </CardTitle>
                                <CardDescription>Get your signed residency proof for {selectedYear}.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    onClick={handleDownloadCertificate}
                                    disabled={downloading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                                >
                                    {downloading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        "Download JSON Proof"
                                    )}
                                </Button>
                                <p className="text-[10px] text-slate-500 text-center leading-relaxed font-medium">
                                    Contains GPS, IP metadata, and RSA signature for total legal irrefutability.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Verify Card */}
                        <Card className="bg-slate-900/50 border-slate-800 shadow-xl border-t-indigo-500/30 border-t-2">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileSearch className="w-5 h-5 text-indigo-400" />
                                    Verify Records
                                </CardTitle>
                                <CardDescription>Verify any Nomad Nights proof to ensure no tampering.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="group transition-all">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileChange}
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer border border-slate-800 rounded-xl p-1 bg-slate-950/30 focus-within:border-indigo-500/30"
                                    />
                                </div>
                                <Button
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black h-12 rounded-xl border border-slate-700 transition-all active:scale-95"
                                    disabled={!file || verifying}
                                    onClick={verifyProof}
                                >
                                    {verifying ? "Auditing Content..." : "Run Security Audit"}
                                </Button>
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold animate-in fade-in slide-in-from-top-2">
                                        {error}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/50 space-y-3 shadow-inner">
                            <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                                <Info className="h-4 w-4 text-indigo-400" />
                                <span>Cryptographic Standard</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                We use <span className="text-slate-300 font-bold">SHA-256 with RSA-2048</span>.
                                Any manual edits to the JSON file will result in a signature mismatch.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Results */}
                    <div className="md:col-span-8">
                        {!auditResult ? (
                            <div className="h-full min-h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800/50 rounded-[2.5rem] p-12 text-center bg-slate-900/10">
                                <div className="w-24 h-24 bg-slate-950 rounded-[2rem] flex items-center justify-center text-slate-800 border-2 border-slate-900 mb-8 shadow-inner transition-transform hover:scale-105 duration-500">
                                    <FileSearch className="h-12 w-12" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-slate-300 tracking-tight">Ready for Audit</h3>
                                    <p className="text-slate-500 text-base max-w-sm mx-auto font-medium">Download your certificate or upload a previous one to verify the cryptographic seal and view detailed residency analytics.</p>
                                </div>
                            </div>
                        ) : auditResult.authentic ? (
                            <div className="animate-in fade-in zoom-in-95 duration-700 space-y-6">
                                {/* Success Header */}
                                <div className="bg-emerald-500/5 border-2 border-emerald-500/10 rounded-[2.5rem] p-12 flex flex-col items-center text-center space-y-6 shadow-2xl shadow-emerald-900/5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
                                    <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 ring-[12px] ring-emerald-500/5 animate-in zoom-in duration-500 delay-200">
                                        <ShieldCheck className="h-12 w-12" />
                                    </div>
                                    <div className="space-y-2 relative">
                                        <h2 className="text-4xl font-black text-emerald-400 tracking-tighter">AUTHENTIC RECORD</h2>
                                        <p className="text-emerald-500/60 font-black text-xs uppercase tracking-[0.3em]">Verified Secure by Nomad Nights Authority</p>
                                    </div>
                                </div>

                                {/* Manifest Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Card className="bg-indigo-600/5 border-indigo-500/20 shadow-none rounded-[2rem]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em]">Audit Year</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <span className="text-5xl font-black text-white">{auditResult.manifest.year}</span>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-emerald-600/5 border-emerald-500/20 shadow-none rounded-[2rem]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em]">Total Days Logged</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <span className="text-5xl font-black text-white">{auditResult.manifest.log_count}</span>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Residency Summary */}
                                <Card className="bg-slate-900/50 border-slate-800 overflow-hidden shadow-2xl rounded-[2rem]">
                                    <CardHeader className="border-b border-slate-800/80 bg-slate-900/80 p-6">
                                        <CardTitle className="text-xl font-black tracking-tight">Residency Breakdown</CardTitle>
                                    </CardHeader>
                                    <div className="divide-y divide-slate-800/50">
                                        {auditResult.stats.map(([country, count]) => (
                                            <div key={country} className="flex items-center justify-between p-7 hover:bg-slate-800/40 transition-colors group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-2.5 h-10 bg-indigo-500 rounded-full group-hover:scale-y-110 group-hover:bg-indigo-400 transition-all duration-300"></div>
                                                    <span className="font-black text-xl text-slate-200 tracking-tight">{country}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-mono text-emerald-400 font-black text-2xl">{count}</span>
                                                    <span className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-black">Days verified</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 p-8 bg-slate-900/30 rounded-[2.5rem] border border-slate-800 shadow-xl group">
                                    <div className="space-y-1.5 overflow-hidden">
                                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-[0.25em]">Cryptographic Signature Date</p>
                                        <code className="text-[11px] text-indigo-400/70 font-mono block truncate group-hover:text-indigo-400 transition-colors">
                                            {auditResult.manifest.generated_at}
                                        </code>
                                    </div>
                                    <Button variant="ghost" className="text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl px-10 gap-3 font-black text-[10px] uppercase tracking-[0.2em] border border-transparent hover:border-slate-700 transition-all shrink-0 h-14">
                                        <Download className="h-5 w-5" />
                                        Save Official Report
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-500/5 border-2 border-red-500/10 rounded-[3rem] p-20 flex flex-col items-center text-center space-y-10 animate-shake shadow-2xl shadow-red-950/20">
                                <div className="w-28 h-28 bg-red-500 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-red-500/40 ring-[15px] ring-red-500/5">
                                    <ShieldAlert className="h-16 w-16" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black text-red-500 tracking-tighter">SIG_VERIFY_FAILURE</h2>
                                    <h3 className="text-xl font-bold text-slate-100">Integrity Check Failed</h3>
                                    <p className="text-slate-500 text-base max-w-sm mx-auto leading-relaxed font-medium">
                                        This document's cryptographic signature is invalid. The record has been tampered with or was not officially issued by Nomad Nights.
                                    </p>
                                </div>
                                <div className="bg-black/60 p-6 rounded-2xl text-left font-mono text-[11px] text-red-400/70 border border-red-500/10 max-w-md shadow-inner backdrop-blur-sm">
                                    <span className="text-red-500 font-black block mb-2 uppercase tracking-widest text-[10px]">Security Audit Log</span>
                                    ERR_RSA_PKCS_PADDING_INVALID: The signature provided does not match the computed hash for the manifest contents. Access denied.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
