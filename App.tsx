
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { RoboBuddyUI } from './components/RoboBuddyUI.tsx';
import { ProfileManager } from './components/ProfileManager.tsx';
import { SystemLogs } from './components/SystemLogs.tsx';
import { ChatHistory } from './components/ChatHistory.tsx';
import { YouTubePlayer } from './components/YouTubePlayer.tsx';
import { RoboMode, UserProfile, RoboExpression, Message } from './types.ts';
import { SYSTEM_INSTRUCTIONS } from './constants.ts';
import { decode, decodeAudioData, createPcmBlob } from './utils/audioUtils.ts';

const supabaseUrl = 'https://dlsskhnmfoubvfvyxhdx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IjpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsc3NraG5tZm91YnZmdnl4aDR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNzgyMTksImV4cCI6MjA4Mzg1NDIxOX0.UHU0DPYOhWq5pGJ1rlmnYdhXiljfbwGYwFV1TTOgqMU';
const supabase = createClient(supabaseUrl, supabaseKey);

const WORKLET_CODE = `
  class RoboProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      if (input && input.length > 0 && input[0]) {
        const hasSignal = input[0].some(sample => Math.abs(sample) > 0.01);
        if (hasSignal) {
          this.port.postMessage(input[0]);
        }
      }
      return true;
    }
  }
  registerProcessor('robo-processor', RoboProcessor);
`;

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<RoboMode>(RoboMode.Companion);
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'connecting'>('idle');
  const [hwStatus, setHwStatus] = useState<string>('RoboCore Standby');
  const [expression, setExpression] = useState<RoboExpression>('neutral');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [vocalEmotion, setVocalEmotion] = useState<'HAPPY' | 'STRESSED' | 'NEUTRAL'>('NEUTRAL');
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState<boolean>(false);
  
  const [profile, setProfile] = useState<UserProfile>(() => {
    const cached = localStorage.getItem('robobuddy_operator');
    if (cached) return JSON.parse(cached);
    return { name: 'Operator', preferredMode: RoboMode.Companion, lastCheckInDate: null, summary: 'New Raspberry Pi link established.' };
  });

  const sessionRef = useRef<any>(null);
  const isSessionActiveRef = useRef(false);
  const isConnectingRef = useRef(false);
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  // Check if API key is effectively available (via shim or aistudio)
  const checkKeyAvailability = useCallback(async () => {
    const shimmedKeyExists = typeof process !== 'undefined' && process.env.API_KEY && !process.env.API_KEY.includes('PLACEHOLDER');
    
    if (window.aistudio) {
      const hasSelected = await window.aistudio.hasSelectedApiKey();
      if (!hasSelected && !shimmedKeyExists) {
        setNeedsKey(true);
      } else {
        setNeedsKey(false);
      }
    } else if (!shimmedKeyExists) {
      setNeedsKey(true);
    }
  }, []);

  useEffect(() => {
    checkKeyAvailability();
  }, [checkKeyAvailability]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
      // Proceed immediately to start link per instruction to mitigate race condition
      startNeuralLink();
    }
  };

  const cleanupAudio = useCallback(async () => {
    isSessionActiveRef.current = false;
    isConnectingRef.current = false;
    if (sessionRef.current) {
      try { await sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const startNeuralLink = useCallback(async () => {
    if (isConnectingRef.current || isSessionActiveRef.current) return;
    
    setConnectionError(null);
    isConnectingRef.current = true;
    setIsActive(true);
    setStatus('connecting');
    setExpression('scanning');
    setHwStatus('Igniting Synapses...');

    // Rule: Initialize AI client right before the call to catch the latest injected key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      if (!inputAudioCtxRef.current) {
        inputAudioCtxRef.current = new AudioContext({ sampleRate: 16000 });
        outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
        const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        await inputAudioCtxRef.current.audioWorklet.addModule(url);
      }

      if (inputAudioCtxRef.current.state === 'suspended') await inputAudioCtxRef.current.resume();
      if (outputAudioCtxRef.current?.state === 'suspended') await outputAudioCtxRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            isSessionActiveRef.current = true;
            isConnectingRef.current = false;
            setStatus('listening');
            setExpression('listening');
            setHwStatus(`RoboBuddy Online ⚡`);
            
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            micSourceRef.current = source;
            
            const workletNode = new AudioWorkletNode(inputAudioCtxRef.current!, 'robo-processor');
            workletNodeRef.current = workletNode;

            workletNode.port.onmessage = (event) => {
              if (!isSessionActiveRef.current || !sessionRef.current) return;
              const pcmBlob = createPcmBlob(event.data);
              sessionRef.current.sendRealtimeInput({ media: pcmBlob });
            };

            source.connect(workletNode);
            workletNode.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              const responses = [];
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'switchMode') {
                  const target = (fc.args as any).targetMode as RoboMode;
                  setMode(target);
                  responses.push({ id: fc.id, name: fc.name, response: { status: 'switched', mode: target } });
                } else if (fc.name === 'saveOperatorName') {
                  const newName = (fc.args as any).newName;
                  setProfile(prev => {
                    const updated = { ...prev, name: newName };
                    localStorage.setItem('robobuddy_operator', JSON.stringify(updated));
                    return updated;
                  });
                  responses.push({ id: fc.id, name: fc.name, response: { status: 'success', message: 'Memory updated!' } });
                } else if (fc.name === 'playSong') {
                  const songName = (fc.args as any).songName;
                  setCurrentSong(null); 
                  setTimeout(() => setCurrentSong(songName), 50);
                  setMode(RoboMode.SongPlayer);
                  responses.push({ id: fc.id, name: fc.name, response: { status: 'playing', song: songName } });
                }
              }
              if (responses.length > 0 && sessionRef.current) {
                sessionRef.current.sendToolResponse({ functionResponses: responses });
              }
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioCtxRef.current) {
              setStatus('speaking');
              setExpression('smiling');
              
              const buffer = await decodeAudioData(decode(audioData), outputAudioCtxRef.current, 24000, 1);
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioCtxRef.current.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              audioSourcesRef.current.add(source);
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                  setStatus('listening');
                  setExpression('neutral');
                }
              };
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (e: any) => {
            console.error("Neural Link Error:", e);
            if (e.message?.includes("entity was not found") || e.message?.includes("API key")) {
              setNeedsKey(true);
            }
            setHwStatus('Neural Link Fault');
            setConnectionError(e.message || "WebSocket Error");
            cleanupAudio();
            setIsActive(false);
          },
          onclose: (e) => {
            cleanupAudio();
            setIsActive(false);
            setStatus('idle');
            setHwStatus(e.reason ? `Terminated: ${e.reason}` : 'Partner Dormant');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: [
            { name: 'switchMode', parameters: { type: Type.OBJECT, properties: { targetMode: { type: Type.STRING } }, required: ['targetMode'] } },
            { name: 'saveOperatorName', parameters: { type: Type.OBJECT, properties: { newName: { type: Type.STRING } }, required: ['newName'] } },
            { name: 'playSong', parameters: { type: Type.OBJECT, properties: { songName: { type: Type.STRING } }, required: ['songName'] } }
          ]}],
          systemInstruction: SYSTEM_INSTRUCTIONS
            .replace('{name}', profile.name)
            .replace('{mode}', mode)
            .replace('{summary}', profile.summary)
            .replace('{emotion}', vocalEmotion),
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
        }
      });
      sessionRef.current = session;
    } catch (err: any) {
      console.error("Initialization Failed:", err);
      if (err.message?.includes("API key") || err.message?.includes("not found")) {
        setNeedsKey(true);
      }
      cleanupAudio();
      setHwStatus("Sync Failed");
      setConnectionError(err.message || "Initialization Failed");
      setIsActive(false);
    }
  }, [isActive, mode, profile, vocalEmotion, cleanupAudio]);

  useEffect(() => {
    const handleFirstClick = () => {
      if (!isActive && !isConnectingRef.current) {
        startNeuralLink();
      }
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, [isActive, startNeuralLink]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col overflow-y-auto font-sans pb-12 selection:bg-emerald-500/30">
      {/* Neural Handshake Modal */}
      {needsKey && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="max-w-md w-full bg-[#0d0d0d] border border-emerald-500/30 rounded-[3rem] p-10 text-center shadow-[0_0_120px_rgba(16,185,129,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-microchip text-4xl text-emerald-400 animate-pulse"></i>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white mb-4">Neural Auth Required</h2>
            <p className="text-neutral-500 text-sm mb-10 leading-relaxed font-medium">
              Oy partner! Your link is missing a valid neural key. 
              Please select a paid Gemini project key to bridge the core and start our session.
              <br/>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline mt-4 inline-block font-black transition-colors">Billing Documentation</a>
            </p>
            <button 
              onClick={handleSelectKey}
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.4em] rounded-2xl transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-bolt-lightning"></i>
              Select Neural Key
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 px-8 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-xl bg-black/60 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <i className={`fa-solid fa-microchip text-emerald-400 ${isActive ? 'animate-pulse' : ''}`}></i>
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-[0.2em] text-white">RoboBuddy <span className="text-emerald-500">v3.5</span></h1>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{hwStatus}</p>
          </div>
        </div>

        <div className="flex gap-4">
           {connectionError && (
             <button 
                onClick={startNeuralLink}
                className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-widest animate-pulse hover:bg-rose-500/20 transition-all flex items-center gap-2"
             >
               <i className="fa-solid fa-rotate"></i>
               Retry Link
             </button>
           )}
           <button 
              onClick={() => setIsProfileOpen(true)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all shadow-lg"
              title="Settings"
           >
             <i className="fa-solid fa-gear text-xs"></i>
           </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-8 gap-12 relative max-w-7xl mx-auto w-full">
        <div className="scanline"></div>
        
        {/* Face Section */}
        <div className="w-full flex flex-col items-center justify-center relative z-10 pt-4">
          <div className={`transition-all duration-700 ${!isActive ? 'scale-75 grayscale opacity-30' : 'scale-100 grayscale-0 opacity-100'}`}>
            <RoboBuddyUI status={status} mode={mode} isActive={isActive} expression={expression} />
          </div>
          
          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="px-12 py-6 rounded-[2.5rem] bg-white/5 border border-white/10 text-[13px] font-bold text-emerald-200/60 max-w-2xl text-center leading-relaxed italic backdrop-blur-md animate-float shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
               "Oy {profile.name}! I'm RoboBuddy, your 24/7 Raspberry Pi partner! Let's build some memories! ⚡"
            </div>
            
            {isActive && (
              <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Neural Connection Live</span>
              </div>
            )}
            
            {connectionError && (
              <div className="px-6 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest">
                Error: {connectionError}
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 px-4">
          <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col h-[600px] shadow-2xl backdrop-blur-sm group hover:border-emerald-500/20 transition-colors">
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Neural Sync Dashboard</span>
                <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-tighter">Latency: Fast-Sync Mode</span>
              </div>
              <div className="flex gap-1.5">
                 {[...Array(3)].map((_, i) => (
                   <div key={i} className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-800'}`} style={{ animationDelay: `${i * 0.15}s` }}></div>
                 ))}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatHistory messages={messages} />
            </div>
          </div>

          <div className="flex flex-col gap-6 h-[600px]">
            {currentSong ? (
               <YouTubePlayer 
                 songName={currentSong} 
                 onClose={() => {
                   setCurrentSong(null);
                   setMode(RoboMode.Companion);
                 }} 
               />
            ) : (
              <div className="flex-1">
                 <SystemLogs status={status} />
              </div>
            )}
            
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex items-center justify-between backdrop-blur-sm mt-auto">
               <div className="flex items-center gap-4">
                 <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-ping' : 'bg-neutral-800'}`}></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Memory Integrity: 100%</span>
               </div>
               <div className="flex items-center gap-4">
                 <i className="fa-solid fa-bolt text-emerald-400 text-xs"></i>
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Pi-Core: Stable</span>
               </div>
            </div>
          </div>
        </div>
      </main>

      <ProfileManager 
        profile={profile}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdate={(updates) => {
          const newProfile = { ...profile, ...updates };
          setProfile(newProfile);
          localStorage.setItem('robobuddy_operator', JSON.stringify(newProfile));
          if (updates.preferredMode) setMode(updates.preferredMode);
        }}
      />
    </div>
  );
};

export default App;
