
import React from 'react';
import { RoboMode, UserProfile } from '../types';

interface ProfileManagerProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<UserProfile>) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ profile, isOpen, onClose, onUpdate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-neutral-900 border border-sky-500/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(56,189,248,0.15)] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50"></div>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-sky-400">User Profile</h2>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.3em]">Identity & Directives</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-sky-500 hover:bg-sky-500 hover:text-white transition-all">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Operator Name</label>
            <input 
              type="text" 
              value={profile.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-4 text-sky-100 font-bold tracking-wide focus:outline-none focus:border-sky-500/50 transition-colors"
              placeholder="Enter your name..."
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Primary Directive (Mode)</label>
            <div className="grid grid-cols-2 gap-2 h-48 overflow-y-auto pr-2 scrollbar-hide">
              {Object.values(RoboMode).map((m) => (
                <button
                  key={m}
                  onClick={() => onUpdate({ preferredMode: m as RoboMode })}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                    profile.preferredMode === m 
                      ? 'bg-sky-500 border-transparent text-neutral-950 shadow-lg' 
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-sky-500/30'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_20px_rgba(56,189,248,0.2)]"
          >
            Update Core Systems
          </button>
        </div>
      </div>
    </div>
  );
};
