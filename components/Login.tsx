
import React, { useState } from 'react';
import { Shield, Github, Chrome, Zap, Loader2 } from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);
  const [logs, setLogs] = useState<string[]>(['WAITING_FOR_HANDSHAKE...']);

  const handleLogin = async (provider: 'google' | 'github') => {
    setLoading(provider);
    setLogs(prev => [...prev, `INITIATING_${provider.toUpperCase()}_PROTOCOL...`]);
    
    try {
      const user = await authService.login(provider);
      setLogs(prev => [...prev, 'HANDSHAKE_COMPLETE', 'ENCRYPTING_SESSION...', 'ACCESS_GRANTED']);
      setTimeout(() => onLoginSuccess(user), 800);
    } catch (err) {
      setLogs(prev => [...prev, 'AUTH_FAILURE: DATA_CORRUPTION']);
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-hidden cyber-grid">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative w-full max-w-md p-8 border border-slate-800 bg-slate-900/80 backdrop-blur-xl rounded-sm shadow-2xl">
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500 -translate-x-1 -translate-y-1"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500 translate-x-1 -translate-y-1"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-pink-500 -translate-x-1 translate-y-1"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pink-500 translate-x-1 translate-y-1"></div>

        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-slate-800 rounded-sm border border-slate-700 flex items-center justify-center mb-6 relative group">
            <Zap className="text-cyan-400 w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 border border-cyan-500/50 animate-ping rounded-sm"></div>
          </div>
          <h1 className="font-orbitron text-2xl font-bold tracking-[0.3em] text-white mb-2 uppercase italic">Neural Link</h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">System Access Protocol Required</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleLogin('google')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-sm border border-slate-700 bg-slate-800/50 text-slate-200 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-300 group disabled:opacity-50"
          >
            {loading === 'google' ? <Loader2 className="w-5 h-5 animate-spin text-cyan-400" /> : <Chrome className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />}
            <span className="font-orbitron text-xs tracking-widest uppercase">Connect via Google</span>
          </button>

          <button
            onClick={() => handleLogin('github')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-sm border border-slate-700 bg-slate-800/50 text-slate-200 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all duration-300 group disabled:opacity-50"
          >
            {loading === 'github' ? <Loader2 className="w-5 h-5 animate-spin text-pink-400" /> : <Github className="w-5 h-5 group-hover:text-pink-400 transition-colors" />}
            <span className="font-orbitron text-xs tracking-widest uppercase">Connect via GitHub</span>
          </button>
        </div>

        {/* Terminal Logs */}
        <div className="mt-8 p-4 bg-black/40 border border-slate-800 rounded-sm font-mono text-[10px] space-y-1 h-24 overflow-hidden">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-slate-600">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
              <span className={log.includes('FAILURE') ? 'text-red-500' : 'text-cyan-500/70'}>{log}</span>
            </div>
          ))}
          {loading && <div className="text-cyan-500/70 animate-pulse">_</div>}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-slate-600">
          <Shield className="w-3 h-3" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em]">End-to-End Neural Encryption Active</span>
        </div>
      </div>
    </div>
  );
};
