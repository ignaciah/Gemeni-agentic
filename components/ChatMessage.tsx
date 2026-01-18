
import React, { useState } from 'react';
import { Message, MessagePart } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Cpu, Copy, Check, FileText, Video, ExternalLink, Globe, Database } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy sequence: ', err);
    }
  };

  return (
    <div className="group my-4 rounded-md overflow-hidden border border-slate-700 relative">
      <div className="bg-slate-800 px-4 py-1.5 text-[10px] font-mono text-slate-400 border-b border-slate-700 flex justify-between items-center transition-colors group-hover:bg-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-cyan-500 font-bold">{language.toUpperCase()}</span>
          <span className="text-[8px] text-slate-600">// DATA_SEGMENT</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-cyan-400 transition-all duration-200 opacity-0 group-hover:opacity-100"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-500" />
              <span className="text-green-500 font-bold tracking-tighter">COPIED</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="tracking-tighter">COPY_BUFFER</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={atomDark}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem', background: '#0f172a' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex gap-4 p-6 ${isAssistant ? 'bg-slate-900/40 border-y border-slate-800/50' : ''}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-sm flex items-center justify-center border ${
        isAssistant ? 'bg-cyan-500/10 border-cyan-500 text-cyan-500' : 'bg-pink-500/10 border-pink-500 text-pink-500'
      }`}>
        {isAssistant ? <Cpu size={20} /> : <User size={20} />}
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="text-[10px] font-orbitron uppercase tracking-widest mb-1 text-slate-500 flex justify-between">
          <span>{isAssistant ? 'Neural Core [V3]' : 'Client Protocol'}</span>
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        <div className="space-y-4">
          {/* Tool Execution Logs */}
          {message.toolLogs && message.toolLogs.length > 0 && (
            <div className="space-y-2 mb-4">
              {message.toolLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-sm p-3 font-mono text-[10px] space-y-2">
                  <div className="flex items-center gap-2 text-pink-500/70 border-b border-slate-800 pb-2 uppercase tracking-widest">
                    <Database size={12} />
                    Tool_Execution: {log.name}
                  </div>
                  <div className="text-slate-500">
                    <span className="text-cyan-500">ARGS:</span> {JSON.stringify(log.args)}
                  </div>
                  <div className="text-slate-300">
                    <span className="text-pink-500">DATA:</span> {log.result}
                  </div>
                </div>
              ))}
            </div>
          )}

          {message.parts.map((part, idx) => {
            if (part.text) {
              return (
                <div key={idx} className="prose prose-invert max-w-none text-slate-300 font-light leading-relaxed">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : 'text';
                        const value = String(children).replace(/\n$/, '');

                        return !inline ? (
                          <CodeBlock language={language} value={value} />
                        ) : (
                          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-4">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-4">{children}</ol>,
                      strong: ({ children }) => <strong className="text-cyan-400 font-bold">{children}</strong>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-pink-500 pl-4 italic text-slate-400 my-4">
                          {children}
                        </blockquote>
                      )
                    }}
                  >
                    {part.text}
                  </ReactMarkdown>
                </div>
              );
            }

            if (part.inlineData) {
              const { data, mimeType } = part.inlineData;
              const src = `data:${mimeType};base64,${data}`;

              if (mimeType.startsWith('image/')) {
                return (
                  <div key={idx} className="relative group max-w-md my-2">
                    <img src={src} alt="Attached" className="rounded border border-slate-700 hover:border-cyan-500 transition-colors shadow-lg" />
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[8px] font-mono text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                      Image_Data :: {part.fileName || 'binary'}
                    </div>
                  </div>
                );
              }

              if (mimeType.startsWith('video/')) {
                return (
                  <div key={idx} className="max-w-md my-2 rounded border border-slate-700 overflow-hidden bg-black">
                    <video src={src} controls className="w-full" />
                    <div className="bg-slate-900 p-2 border-t border-slate-800 flex items-center gap-2">
                      <Video size={14} className="text-pink-500" />
                      <span className="text-[10px] font-mono text-slate-400 truncate">{part.fileName || 'Stream.mp4'}</span>
                    </div>
                  </div>
                );
              }

              if (mimeType === 'application/pdf') {
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded border border-slate-700 bg-slate-800/50 max-w-sm my-2 hover:border-cyan-500 transition-all cursor-pointer group">
                    <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/30 text-cyan-400">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-xs font-medium text-slate-200 truncate group-hover:text-cyan-400 transition-colors">{part.fileName || 'document.pdf'}</div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase">PDF_SECURE_STORAGE</div>
                    </div>
                  </div>
                );
              }
            }

            return null;
          })}

          {/* Search Grounding Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-800/50 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-orbitron text-cyan-500 uppercase tracking-widest">
                <Globe size={12} className="animate-pulse" />
                Neural Uplink: Web Grounding Verified
              </div>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 py-1.5 px-3 rounded-sm border border-slate-800 bg-slate-900/50 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
                  >
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-cyan-400 transition-colors truncate max-w-[150px]">
                      {source.title}
                    </span>
                    <ExternalLink size={10} className="text-slate-600 group-hover:text-cyan-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
