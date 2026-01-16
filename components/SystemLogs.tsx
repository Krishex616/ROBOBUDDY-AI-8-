
import React, { useState, useEffect, useRef } from 'react';

interface Log {
  id: number;
  message: string;
  type: 'info' | 'warn' | 'success' | 'error';
}

export const SystemLogs: React.FC<{ status: string }> = ({ status }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev.slice(-20), { id: Date.now(), message: msg, type }]);
  };

  useEffect(() => {
    if (status === 'speaking') addLog('[PARTNER] Emitting Neural Response (24kHz PCM)', 'success');
    if (status === 'listening') addLog('[LINK] Acoustic Bond Active (16kHz PCM)', 'info');
    if (status === 'connecting') {
      addLog('[SYNC] Initiating WebSocket Handshake...', 'warn');
      addLog('[SYNC] Requesting Modality: [AUDIO]', 'info');
    }
    if (status === 'idle') addLog('[CORE] Partner Dormant', 'info');
  }, [status]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 font-['JetBrains_Mono'] text-[11px] h-full min-h-[400px] overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm hover:border-sky-500/20 transition-colors">
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div className="flex flex-col">
          <span className="text-neutral-500 uppercase font-black tracking-widest text-[10px]">Kernel Pulse Monitoring</span>
          <span className="text-[8px] text-neutral-700 font-bold uppercase">Raspberry Pi v3.5 OS [Debug Mode]</span>
        </div>
        <div className="flex items-center gap-3">
           <span className={`text-[9px] font-black uppercase tracking-widest ${status !== 'idle' ? 'text-emerald-500 animate-pulse' : 'text-neutral-700'}`}>
             ● {status !== 'idle' ? 'LINK_ACTIVE' : 'OFFLINE'}
           </span>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
        {logs.map(log => (
          <div key={log.id} className="flex gap-4 group animate-in slide-in-from-left-2 duration-300">
            <span className="text-neutral-800 font-bold text-[9px]">[{new Date(log.id).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            <span className={`flex-1 ${
              log.type === 'success' ? 'text-emerald-500' : 
              log.type === 'warn' ? 'text-amber-500' : 
              log.type === 'error' ? 'text-rose-500' :
              'text-sky-400'
            }`}>
              <span className="opacity-30 mr-2">$</span>{log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center text-neutral-800 italic uppercase tracking-[0.2em] font-black opacity-30">
            Awaiting Neural Signal...
          </div>
        )}
      </div>
    </div>
  );
};
