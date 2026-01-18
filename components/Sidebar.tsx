
import React from 'react';
import { ChatSession, User as UserType } from '../types';
import { LayoutGrid, MessageSquare, Plus, Trash2, Zap, LogOut, Settings } from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  user: UserType | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  user,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onLogout
}) => {
  return (
    <aside className="w-80 h-full border-r border-slate-800 bg-slate-950 flex flex-col relative z-10">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="text-pink-500 fill-pink-500 w-5 h-5 animate-pulse" />
          <h1 className="font-orbitron font-bold text-lg tracking-widest text-cyan-400">NEURAL_LINK</h1>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded border border-cyan-500/50 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all duration-300 font-orbitron text-sm uppercase tracking-tighter group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Initialize Sequence
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        <div className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest mb-4 px-2">
          Agent History [Logs]
        </div>
        
        {sessions.length === 0 ? (
          <div className="text-center py-10 text-slate-600 italic text-sm">
            Empty data clusters...
          </div>
        ) : (
          sessions.sort((a, b) => b.lastUpdated - a.lastUpdated).map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group flex items-center justify-between p-3 rounded cursor-pointer transition-all border ${
                currentSessionId === session.id
                  ? 'bg-pink-500/10 border-pink-500 text-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                  : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-pink-500' : 'text-slate-600'}`} />
                <span className="truncate text-sm font-medium">{session.title}</span>
              </div>
              <button
                onClick={(e) => onDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* User Profile & Logout */}
      <div className="mt-auto border-t border-slate-800 bg-slate-900/30 p-4">
        {user && (
          <div className="flex items-center gap-3 mb-4 p-2 rounded-sm border border-slate-800 bg-slate-950/50">
            <div className="w-10 h-10 rounded-sm border border-cyan-500/50 overflow-hidden bg-slate-800">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-orbitron text-slate-200 truncate">{user.name}</div>
              <div className="text-[10px] font-mono text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button 
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-sm border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-400/50 transition-all text-[10px] font-orbitron uppercase tracking-widest"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
          <button className="p-2 rounded-sm border border-slate-800 text-slate-500 hover:text-cyan-400 hover:border-cyan-400/50 transition-all">
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Footer Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-500/70">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          SYSTEM_STABLE // 2.5.0-FW
        </div>
      </div>
    </aside>
  );
};
