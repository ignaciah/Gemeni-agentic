
import React, { useState, useEffect } from 'react';
import { X, Video, Zap, Loader2, Sparkles, Monitor, Smartphone, Info, Cpu, AlertTriangle, RefreshCcw } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface VideoStudioProps {
  onClose: () => void;
  onVideoGenerated: (base64: string, prompt: string) => void;
}

const LOADING_MESSAGES = [
  "BUFFERING_TEMPORAL_DATA...",
  "INITIALIZING_PHOTON_MAPPING...",
  "ENCODING_NEURAL_VECTORS...",
  "SYNTHESIZING_VOXEL_ARRAYS...",
  "STABILIZING_TIME_DILATION...",
  "FLUX_CAPACITOR_COHERENCE_CHECK...",
  "DEEP_DREAM_RENDERING_ACTIVE...",
  "PARSING_SEMANTIC_QUANTA...",
];

// Define AIStudio interface to match environmental expectations and fix Window declaration modifiers
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /* Removing readonly modifier to match existing global definitions and avoid 'All declarations of aistudio must have identical modifiers' error */
    aistudio: AIStudio;
  }
}

export const VideoStudio: React.FC<VideoStudioProps> = ({ onClose, onVideoGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let msgInterval: any;
    let progressInterval: any;

    if (isGenerating) {
      msgInterval = setInterval(() => {
        setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 4000);

      // Simulate a progress bar that slows down as it approaches 100%
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) return 98;
          const increment = prev < 50 ? 0.8 : prev < 80 ? 0.3 : 0.1;
          return Math.min(prev + increment, 98);
        });
      }, 500);
    } else {
      setProgress(0);
    }

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      setError(null);
      setProgress(0);
      
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }

      setIsGenerating(true);
      let operation = await geminiService.generateVideo(prompt, resolution, aspectRatio);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await geminiService.checkVideoOperation(operation);
        
        // Check if the operation itself failed during polling
        if (operation.error) {
          throw operation.error;
        }
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) {
        const base64 = await geminiService.fetchVideoBlob(videoUri);
        onVideoGenerated(base64, prompt);
      } else {
        throw new Error("EMPTY_RENDER_RESULT: No video stream detected in response.");
      }
    } catch (err: any) {
      console.error("Video Studio Generation Error:", err);
      setIsGenerating(false);
      setProgress(0);

      let friendlyMsg = "RENDER_PIPELINE_ERROR: Critical failure in the neural core.";
      
      // Map technical errors to user-friendly but thematic messages
      if (err?.message?.includes("Requested entity was not found")) {
        friendlyMsg = "ACCESS_DENIED: Current API key is invalid or lacks 'Veo' permissions. Re-authorization required.";
        await window.aistudio.openSelectKey();
      } else if (err?.message?.includes("Safety") || err?.status === "PERMISSION_DENIED") {
        friendlyMsg = "SAFETY_FILTER_BLOCK: Prompt violates visualization safety protocols. Refine parameters.";
      } else if (err?.message?.includes("Quota") || err?.status === "RESOURCE_EXHAUSTED" || err?.message?.includes("429")) {
        friendlyMsg = "BANDWIDTH_EXCEEDED: Neural link quota reached. Cycle reset required before next render.";
      } else if (err?.message?.includes("Failed to fetch") || !navigator.onLine) {
        friendlyMsg = "CONNECTION_SEVERED: Lost uplink to Veo Processing Hub. Check your network link.";
      } else if (err?.message) {
        friendlyMsg = `PROTOCOL_ERR: ${err.message.toUpperCase()}`;
      }
      
      setError(friendlyMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-sm shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden cyber-grid">
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-pink-500/50"></div>

        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center rounded-sm">
              <Video className="text-cyan-400 w-4 h-4" />
            </div>
            <div>
              <h2 className="font-orbitron text-sm tracking-[0.3em] text-white uppercase italic">Veo_Neural_Studio</h2>
              <div className="text-[8px] font-mono text-cyan-500/50 uppercase tracking-widest">Temporal Synthesizer v3.1.4</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-slate-900 rounded-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-10">
              <div className="relative w-40 h-40">
                {/* Outer Ring */}
                <div className="absolute inset-0 border-[1px] border-cyan-500/10 rounded-full"></div>
                {/* Spinning Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="76"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={477.5}
                    strokeDashoffset={477.5 - (477.5 * progress) / 100}
                    className="text-cyan-500 transition-all duration-500 ease-out"
                  />
                </svg>
                {/* Inner Spinning Ring */}
                <div className="absolute inset-4 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-orbitron text-2xl font-bold text-white tracking-tighter">
                    {Math.floor(progress)}%
                  </div>
                  <div className="text-[8px] font-mono text-cyan-500/70 uppercase">Progress</div>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="flex justify-between items-end px-1">
                  <div className="space-y-1">
                    <div className="font-orbitron text-cyan-400 text-xs tracking-[0.2em] animate-pulse">
                      {loadingMsg}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase">
                      <Cpu size={10} className="text-pink-500" />
                      Neural Load: Optimized // {resolution} @ {aspectRatio}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    STATUS: <span className="text-green-500">ACTIVE_RENDER</span>
                  </div>
                </div>

                <div className="relative w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-pink-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="flex justify-center">
                  <p className="text-slate-500 font-mono text-[9px] uppercase tracking-widest text-center max-w-xs">
                    Synthesizing cinematic frames... This process typically requires 120-180 seconds of core compute time.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest px-1">Visual_Manifestation_Prompt</label>
                  <span className="text-[9px] font-mono text-cyan-500/50">INPUT_REQUIRED</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the scene you wish to materialize..."
                  className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-sm p-4 text-slate-200 font-mono text-sm focus:border-cyan-500 focus:bg-slate-900 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest px-1">Temporal_Resolution</label>
                  <div className="flex gap-2">
                    {(['720p', '1080p'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`flex-1 py-2 px-3 border rounded-sm text-[10px] font-orbitron transition-all ${
                          resolution === res ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest px-1">Aspect_Ratio_Protocol</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAspectRatio('16:9')}
                      className={`flex-1 py-2 px-3 border rounded-sm text-[10px] font-orbitron flex items-center justify-center gap-2 transition-all ${
                        aspectRatio === '16:9' ? 'border-pink-500 bg-pink-500/10 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <Monitor size={12} /> 16:9
                    </button>
                    <button
                      onClick={() => setAspectRatio('9:16')}
                      className={`flex-1 py-2 px-3 border rounded-sm text-[10px] font-orbitron flex items-center justify-center gap-2 transition-all ${
                        aspectRatio === '9:16' ? 'border-pink-500 bg-pink-500/10 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <Smartphone size={12} /> 9:16
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/30 rounded-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-[10px] font-orbitron text-red-500 uppercase font-bold tracking-widest">Protocol Sync Error</p>
                    <p className="text-[10px] font-mono text-red-400/80 uppercase leading-relaxed">{error}</p>
                    <button 
                      onClick={() => setError(null)}
                      className="mt-2 text-[8px] font-mono text-red-500 underline uppercase tracking-tighter hover:text-red-400"
                    >
                      Dismiss Notification
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full relative flex items-center justify-center gap-3 py-5 bg-cyan-500 text-slate-950 rounded-sm font-orbitron font-bold text-xs uppercase tracking-[0.3em] hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all group disabled:opacity-50 disabled:grayscale disabled:shadow-none"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {error ? (
                    <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  ) : (
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  )}
                  {error ? 'Re-Initiate Render' : 'Initiate Render Sequence'}
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-600 justify-center">
                <Info size={12} />
                <span className="text-[9px] font-mono uppercase tracking-tighter">Paid Billing Account Required // Veo Neural Core 3.1</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
