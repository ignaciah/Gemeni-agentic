
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { Login } from './components/Login';
import { VideoStudio } from './components/VideoStudio';
import { Message, ChatSession, User, MessagePart, Attachment } from './types';
import { geminiService } from './services/geminiService';
import { authService } from './services/authService';
import { Send, Loader2, RefreshCw, Terminal, Zap, Paperclip, X, Image as ImageIcon, FileText, Video, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showVideoStudio, setShowVideoStudio] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loggedInUser = authService.getUser();
    if (loggedInUser) {
      setUser(loggedInUser);
    }
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`cyberchat_sessions_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      } else {
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, isLoading]);

  useEffect(() => {
    if (user && sessions.length > 0) {
      localStorage.setItem(`cyberchat_sessions_${user.id}`, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  const handleLoginSuccess = (user: User) => setUser(user);
  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setSessions([]);
    setCurrentSessionId('');
  };

  const createNewChat = () => {
    const newId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Neural Stream',
      messages: [],
      lastUpdated: Date.now()
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newId);
  };

  const handleSelectSession = (id: string) => setCurrentSessionId(id);

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id && filtered.length > 0) {
      setCurrentSessionId(filtered[0].id);
    } else if (filtered.length === 0) {
      createNewChat();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files) as File[]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        const attachment: Attachment = {
          data: base64String,
          mimeType: file.type,
          fileName: file.name,
          previewUrl: URL.createObjectURL(file)
        };
        setAttachments(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newArr = [...prev];
      if (newArr[index].previewUrl) URL.revokeObjectURL(newArr[index].previewUrl!);
      newArr.splice(index, 1);
      return newArr;
    });
  };

  const handleVideoGenerated = (base64: string, prompt: string) => {
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      parts: [
        { text: `Neural Rendering Complete: "${prompt}"` },
        { 
          inlineData: { data: base64, mimeType: 'video/mp4' },
          fileName: 'Veo_Render.mp4'
        }
      ],
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, assistantMessage], lastUpdated: Date.now() } 
        : s
    ));
    setShowVideoStudio(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const parts: MessagePart[] = [];
    if (input.trim()) parts.push({ text: input });
    attachments.forEach(att => {
      parts.push({
        inlineData: { data: att.data, mimeType: att.mimeType },
        fileName: att.fileName
      });
    });

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      parts,
      timestamp: Date.now()
    };

    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    const updatedMessages = [...session.messages, userMessage];
    const isNewChat = session.messages.length === 0;
    
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { 
            ...s, 
            messages: updatedMessages, 
            lastUpdated: Date.now(),
            title: isNewChat ? (input.trim() || attachments.map(a => a.fileName).join(', ')).slice(0, 30) + '...' : s.title
          } 
        : s
    ));

    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const result = await geminiService.sendMessage(session.messages, parts);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [{ text: result.text }],
        timestamp: Date.now(),
        sources: result.sources,
        toolLogs: result.toolLogs
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, assistantMessage], lastUpdated: Date.now() } 
          : s
      ));
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [{ text: "CRITICAL_ERROR: Connection to Neural Core severed. Data injection failed." }],
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, errorMessage], lastUpdated: Date.now() } 
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 cyber-grid">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 cyber-grid overflow-hidden">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        user={user}
        onNewChat={createNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col relative bg-slate-950/40 backdrop-blur-sm overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center px-8 bg-slate-950/80 backdrop-blur-md justify-between">
          <div className="flex items-center gap-4">
            <Terminal className="text-cyan-500 w-4 h-4" />
            <h2 className="font-orbitron text-xs tracking-[0.2em] text-cyan-500 uppercase truncate max-w-[200px]">
              {currentSession?.title || 'System Idle'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowVideoStudio(true)}
              className="flex items-center gap-2 px-3 py-1 rounded border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 font-orbitron text-[10px] uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
            >
              <Video size={12} />
              Veo_Labs
            </button>
            <div className="hidden sm:flex gap-2 text-[10px] font-mono">
              <span className="text-slate-500 uppercase">Latency:</span>
              <span className="text-green-400">12ms</span>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {currentSession?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <Zap size={64} className="text-cyan-500 mb-6 animate-pulse" />
              <div className="font-orbitron text-xl text-cyan-400 tracking-widest mb-2">AWAITING_INPUT</div>
              <p className="text-slate-500 font-mono text-sm text-center max-w-md">Upload images, videos, or PDFs for neural analysis. Use Veo Labs for cinematic synthesis.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8">
              {currentSession?.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex gap-4 p-6 bg-slate-900/40 border-y border-slate-800/50">
                  <div className="flex-shrink-0 w-10 h-10 rounded-sm flex items-center justify-center border bg-cyan-500/10 border-cyan-500 text-cyan-500">
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="text-[10px] font-orbitron uppercase tracking-widest mb-2 text-cyan-500 flex items-center gap-2">
                      Decrypting Data Streams
                      <span className="flex gap-1">
                        <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                        <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                        <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                      </span>
                    </div>
                    <div className="h-4 w-2/3 bg-slate-800 rounded animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-8 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto">
            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {attachments.map((att, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded border border-slate-700 bg-slate-900 overflow-hidden">
                    {att.mimeType.startsWith('image/') ? (
                      <img src={att.previewUrl} className="w-full h-full object-cover" />
                    ) : att.mimeType.startsWith('video/') ? (
                      <div className="w-full h-full flex items-center justify-center text-pink-500 bg-pink-500/5">
                        <Video size={24} />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-500/5">
                        <FileText size={24} />
                      </div>
                    )}
                    <button 
                      onClick={() => removeAttachment(i)}
                      className="absolute top-1 right-1 p-0.5 bg-black/70 rounded-full text-white hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-mono text-center truncate px-1 py-0.5">
                      {att.fileName}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="relative group">
              <input 
                type="file" 
                multiple 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,video/*,application/pdf"
              />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-md opacity-20 group-focus-within:opacity-50 blur transition duration-300"></div>
              <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 text-slate-500 hover:text-cyan-400 transition-colors"
                  title="Attach Media"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Inject parameters or upload media..."
                  className="flex-1 bg-transparent px-2 py-4 outline-none text-slate-100 placeholder:text-slate-600 font-mono text-sm sm:text-base"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowVideoStudio(true)}
                  className="px-3 text-pink-500 hover:text-pink-400 transition-colors hidden sm:block"
                  title="Generate Video"
                >
                  <Sparkles size={20} />
                </button>
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && attachments.length === 0)}
                  className={`px-6 py-4 text-cyan-500 hover:text-cyan-400 transition-colors ${
                    (isLoading || (!input.trim() && attachments.length === 0)) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-cyan-500/10'
                  }`}
                >
                  {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {showVideoStudio && (
        <VideoStudio 
          onClose={() => setShowVideoStudio(false)} 
          onVideoGenerated={handleVideoGenerated}
        />
      )}
    </div>
  );
};

export default App;
