import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Room } from '../../types/game';

interface ChatProps {
  room: Room;
  userId: string;
  chatInput: string;
  onChatInputChange: (val: string) => void;
  onSendChat: () => void;
}

export function Chat({ room, userId, chatInput, onChatInputChange, onSendChat }: ChatProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [room?.messages]);

  return (
    <div className="flex-1 lg:flex-none lg:w-80 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl flex flex-col overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/50">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Debate & Estratégia</h3>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-[300px] lg:min-h-0"
      >
        {(room?.messages || []).length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 py-12">
            <p className="text-center text-zinc-500 text-[10px] uppercase font-bold tracking-widest leading-relaxed">
              O silêncio é o melhor amigo<br/>do impostor...
            </p>
          </div>
        )}
        
        {(room?.messages || []).map((msg, i) => (
          <div key={i} className={cn("flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2", msg?.userId === userId ? "items-end" : "items-start")}>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">{msg?.name}</span>
            <div className={cn(
              "max-w-[90%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
              msg?.userId === userId 
                ? "bg-emerald-600 text-white rounded-tr-none shadow-emerald-900/20" 
                : "bg-zinc-800 text-zinc-300 rounded-tl-none shadow-black/20"
            )}>
              {msg?.text}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-zinc-900/80 border-t border-zinc-800/50 flex gap-2">
         <input 
          type="text" 
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500/50 transition-all text-sm placeholder:text-zinc-700"
          onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
        />
        <button 
          onClick={onSendChat}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
