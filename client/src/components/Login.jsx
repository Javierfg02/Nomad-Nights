import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleLogin() {
        try {
            await login();
            navigate('/');
        } catch (error) {
            console.error("Failed to log in", error);
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome to Nomad Nights</h1>
                <p className="text-slate-400 mb-8">Sign in to track your travel history.</p>

                <button
                    onClick={handleLogin}
                    className="w-full bg-white text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-3"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}
