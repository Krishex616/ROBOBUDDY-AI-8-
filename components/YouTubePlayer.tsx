
import React, { useState, useEffect } from 'react';

interface YouTubePlayerProps {
  songName: string;
  onClose: () => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ songName, onClose }) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Use a more direct search embed that attempts to play the first result immediately.
  // We add mute=0 and enablejsapi=1 to help with browser audio policies.
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songName)}`;
  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(songName)}&autoplay=1&mute=0&enablejsapi=1`;

  return (
    <div className="bg-black/80 border border-fuchsia-500/30 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-[0_0_60px_rgba(217,70,239,0.2)] group flex flex-col h-full animate-in zoom-in duration-500 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-fuchsia-600/10 blur-[100px] rounded-full"></div>
      
      <div className="flex items-center justify-between mb-8 px-2 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-5 h-5 rounded-full bg-fuchsia-500 animate-[ping_2s_infinite] shadow-[0_0_20px_rgba(217,70,239,0.5)]"></div>
          <div className="flex flex-col">
            <span className="text-[15px] font-black uppercase text-fuchsia-400 tracking-[0.2em] truncate max-w-[260px]">
              {songName}
            </span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">RoboBuddy DJ Deck v3.0</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/5 hover:border-rose-500/30 group/close"
        >
          <i className="fa-solid fa-power-off text-sm group-hover:scale-110 transition-transform"></i>
        </button>
      </div>
      
      <div className="flex-1 rounded-[2.5rem] overflow-hidden bg-neutral-950 border border-white/5 relative group/player shadow-inner">
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="YouTube DJ Session"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 z-0"
        ></iframe>
        
        {/* Browser Audio Policy Fix: Tap Overlay */}
        {!hasInteracted && (
          <div 
            onClick={() => setHasInteracted(true)}
            className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 cursor-pointer group/tap"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-fuchsia-500 rounded-full blur-2xl opacity-20 group-hover/tap:opacity-40 transition-opacity"></div>
              <div className="w-24 h-24 rounded-full bg-fuchsia-600 flex items-center justify-center text-white text-3xl shadow-[0_0_40px_rgba(217,70,239,0.4)] transition-transform group-hover/tap:scale-110">
                <i className="fa-solid fa-play translate-x-1"></i>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white font-black uppercase tracking-[0.3em] text-sm animate-pulse">TAP TO SYNC AUDIO</p>
              <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-widest">Ensures Chrome allows the beats, bhai!</p>
            </div>
          </div>
        )}

        {/* Hover Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity flex flex-col items-center justify-end pb-12 gap-4 z-10 pointer-events-none">
           <a 
             href={searchUrl} 
             target="_blank" 
             rel="noopener noreferrer"
             className="pointer-events-auto px-10 py-4 rounded-2xl bg-fuchsia-600 text-[11px] font-black uppercase tracking-widest hover:bg-fuchsia-500 transition-all shadow-[0_20px_40px_rgba(217,70,239,0.3)] flex items-center gap-4"
           >
             <i className="fa-brands fa-youtube text-xl"></i>
             Open on YouTube
           </a>
           <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40">Manual Fallback for Music Labels</p>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-6 relative z-10">
        <div className="flex gap-4 items-end h-10">
          {[...Array(15)].map((_, i) => (
            <div 
              key={i} 
              className="w-1.5 bg-fuchsia-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(217,70,239,0.4)]" 
              style={{ 
                height: `${30 + Math.random() * 70}%`,
                animationDelay: `${i * 0.04}s`, 
                animationDuration: `${0.3 + Math.random() * 0.3}s`,
                opacity: 0.2 + (i / 15) * 0.8
              }}
            ></div>
          ))}
        </div>
        <div className="px-8 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <p className="text-[11px] font-black text-fuchsia-200 uppercase tracking-[0.25em] animate-pulse italic">
            "First video play kar raha hoon, bhai! Enjoy the vibe! 🎧"
          </p>
        </div>
      </div>
    </div>
  );
};
