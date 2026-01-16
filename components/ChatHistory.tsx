
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatHistoryProps {
  messages: Message[];
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-hide"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 text-center">
          <i className="fa-solid fa-ghost text-4xl"></i>
          <p className="text-sm">Neural logs empty...</p>
        </div>
      ) : (
        messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">
              {msg.role === 'user' ? 'Operator' : 'RoboBuddy'}
            </span>
            <div className={`
              px-4 py-3 rounded-2xl text-sm max-w-[90%] leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-neutral-800 border border-neutral-700 text-sky-100 rounded-tr-none' 
                : 'bg-sky-500/10 border border-sky-500/20 text-sky-200 rounded-tl-none'}
            `}>
              {msg.content}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
