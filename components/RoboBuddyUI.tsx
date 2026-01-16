
import React from 'react';
import { RoboStatusProps, RoboMode } from '../types.ts';

export const RoboBuddyUI: React.FC<RoboStatusProps> = ({ 
  status, 
  mode, 
  isActive, 
  expression = 'neutral',
}) => {
  const getModeStyles = () => {
    switch (mode) {
      case RoboMode.Student: return 'bg-amber-300 shadow-amber-400 text-amber-300 border-amber-400/40';
      case RoboMode.Teacher: return 'bg-emerald-300 shadow-emerald-400 text-emerald-300 border-emerald-400/40';
      case RoboMode.Manager: return 'bg-indigo-300 shadow-indigo-400 text-indigo-300 border-indigo-400/40';
      case RoboMode.Developer: return 'bg-purple-300 shadow-purple-400 text-purple-300 border-purple-400/40';
      case RoboMode.HealthAdvisor: return 'bg-lime-300 shadow-lime-400 text-lime-300 border-lime-400/40';
      case RoboMode.SongPlayer: return 'bg-fuchsia-400 shadow-fuchsia-500 text-fuchsia-400 border-fuchsia-400/40';
      default: return 'bg-emerald-300 shadow-emerald-400 text-emerald-300 border-emerald-400/40';
    }
  };

  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';
  const isThinking = status === 'connecting' || expression === 'thinking';
  const modeStyles = getModeStyles();
  const themeColor = modeStyles.split(' ')[0];

  const renderEye = () => {
    if (!isActive) return <div className="w-4 h-0.5 bg-neutral-800 rounded-full transition-all duration-700"></div>;
    
    if (isThinking) {
      return (
        <div className="relative flex items-center justify-center">
          <div className={`w-10 h-10 rounded-full ${themeColor} opacity-40 animate-ping absolute`}></div>
          <div className={`w-6 h-6 rounded-full ${themeColor} shadow-[0_0_25px_currentColor]`}></div>
        </div>
      );
    }

    if (mode === RoboMode.SongPlayer) {
        return (
          <div className="relative flex items-center justify-center">
            <i className={`fa-solid fa-music text-2xl ${themeColor.replace('bg-', 'text-')} animate-bounce shadow-[0_0_20px_currentColor]`}></i>
          </div>
        );
    }

    switch (expression) {
      case 'smiling':
        return (
          <div className="relative w-12 h-6 overflow-hidden -mb-2">
            <div className={`w-12 h-12 border-[6px] ${themeColor.replace('bg-', 'border-')} rounded-full mt-1 animate-[pulse_0.8s_infinite]`}></div>
          </div>
        );
      case 'listening':
        return <div className={`w-8 h-8 ${themeColor} rounded-full animate-[pulse_0.4s_infinite] blur-[1px] shadow-[0_0_20px_currentColor]`}></div>;
      default:
        return (
          <div className={`relative flex items-center justify-center`}>
            <div className={`w-6 h-6 rounded-full ${themeColor} ${isSpeaking ? 'scale-y-[0.15] scale-x-[1.3]' : 'scale-100'} transition-transform duration-75 shadow-[0_0_20px_currentColor]`}></div>
            {isSpeaking && <div className={`absolute w-12 h-2 ${themeColor} blur-md opacity-80`}></div>}
          </div>
        );
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Hyper-Aura */}
      <div className={`absolute -inset-60 rounded-full blur-[140px] opacity-20 transition-all duration-500 ${themeColor} ${isActive ? 'scale-125 opacity-30' : 'scale-50 opacity-0'}`}></div>

      <div className={`
        relative w-80 h-80 rounded-full bg-[#080808] border-[14px] border-neutral-900 flex flex-col items-center justify-center gap-6 transition-all duration-300 shadow-[inset_0_0_80px_rgba(0,0,0,0.95)]
        ${isActive ? 'border-neutral-800 ring-8 ring-white/5' : 'opacity-40'}
      `}>
        {/* Core Attachment Indicator - Corrected Identity */}
        <div className="absolute top-10 flex flex-col items-center gap-1">
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-neutral-500">RoboBuddy Sync Level</span>
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-4 h-1.5 rounded-full transition-all duration-300 ${isActive ? (i < 4 ? themeColor : 'bg-white opacity-20') : 'bg-neutral-800'}`}></div>
            ))}
          </div>
        </div>

        <div className="flex gap-14 items-center h-24 z-10">
          <div className="w-16 h-16 flex items-center justify-center">{renderEye()}</div>
          <div className="w-16 h-16 flex items-center justify-center">{renderEye()}</div>
        </div>

        {/* Mouth */}
        <div className="h-16 flex items-center justify-center gap-2 w-56 z-10 relative">
          {isSpeaking ? (
            <div className="flex gap-1.5 items-center h-14">
              {[...Array(14)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 ${themeColor} rounded-full animate-[bounce_0.25s_infinite] shadow-[0_0_12px_currentColor]`}
                  style={{ 
                    height: `${20 + Math.random() * 45}px`, 
                    animationDelay: `${i * 0.02}s`
                  }}
                ></div>
              ))}
            </div>
          ) : isActive ? (
            <div className="flex flex-col items-center gap-3">
               <div className={`h-1.5 rounded-full ${themeColor} transition-all duration-300 ${isListening ? 'w-40 opacity-100 shadow-[0_0_20px_currentColor] animate-pulse' : 'w-20 opacity-30'}`}></div>
               {isListening && <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] animate-pulse">Bolo Bhai! ✨</span>}
            </div>
          ) : (
            <div className="w-14 h-2 bg-neutral-900 rounded-full"></div>
          )}
        </div>
      </div>
      
      {/* Energetic Tag */}
      {isActive && (
        <div className="mt-10 flex items-center gap-4 px-8 py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-2xl animate-in slide-in-from-bottom-6 duration-500 shadow-xl">
          <div className={`w-3 h-3 rounded-full ${themeColor} animate-[ping_0.8s_infinite]`}></div>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
            {mode === RoboMode.SongPlayer ? 'DJ Mode: On 🎵' : 'Hyper-Core: Active ⚡'}
          </span>
        </div>
      )}
    </div>
  );
};
