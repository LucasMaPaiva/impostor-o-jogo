/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Eye, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Player } from '../../types/game';

interface RevealProps {
  player: Player;
  players: Player[];
  category?: string;
  isReady: boolean;
  onReady: () => void;
}

export const Reveal: React.FC<RevealProps> = ({ player, players, category, isReady, onReady }) => {
  const [isHolding, setIsHolding] = React.useState(false);
  const [hasSeen, setHasSeen] = React.useState(false);

  const startReveal = () => {
    setIsHolding(true);
    setHasSeen(true);
  };
  const stopReveal = () => setIsHolding(false);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 w-full max-w-lg mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold italic uppercase tracking-tighter text-zinc-100">Sua Palavra Secreta</h2>
        <div className="flex flex-col gap-1">
          <p className="text-zinc-500 text-sm font-medium">Não deixe ninguém ver!</p>
          {category && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit mx-auto mt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Dica: {category}</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative group w-full max-w-[280px]">
        <div className={`absolute inset-0 bg-emerald-500/20 blur-3xl transition-opacity duration-500 ${isHolding ? "opacity-100" : "opacity-0"}`} />
        
        <div 
          onMouseDown={startReveal}
          onMouseUp={stopReveal}
          onMouseLeave={stopReveal}
          onTouchStart={startReveal}
          onTouchEnd={stopReveal}
          className="relative bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl backdrop-blur-sm overflow-hidden min-h-[160px] flex flex-col items-center justify-center cursor-pointer select-none active:scale-[0.98] transition-transform"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          
          <div className="space-y-4 w-full pointer-events-none">
            <div className="flex flex-col items-center justify-center gap-2">
              <p className={cn(
                "text-4xl font-black uppercase tracking-tighter transition-all duration-300",
                !isHolding ? "blur-xl text-emerald-500" : (player?.role === 'impostor' ? "blur-0 text-red-500" : "blur-0 text-emerald-500")
              )}>
                {player?.word}
              </p>
              {player?.role === 'impostor' && isHolding && (
                <motion.p 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-[10px] font-black uppercase tracking-widest text-red-100 bg-red-600 px-3 py-1 rounded-full shadow-lg shadow-red-900/40"
                >
                  ⚠️ VOCÊ É O IMPOSTOR
                </motion.p>
              )}
            </div>
          </div>

          {!isHolding && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 backdrop-blur-[2px]">
              <Eye className="text-emerald-500/50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Segure para revelar</span>
            </div>
          )}
        </div>
      </div>

      {/* Ready Status List */}
      <div className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Aguardando Jogadores</h3>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">
            {players.filter(p => p.isReady).length} / {players.length} PRONTOS
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {players.map(p => (
            <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-zinc-950/50 border border-zinc-800/30">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-500",
                p.isReady ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-800"
              )} />
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tight truncate",
                p.isReady ? "text-zinc-300" : "text-zinc-600"
              )}>
                {p.name}
              </span>
              {p.isReady && (
                <Check size={10} className="text-emerald-500 ml-auto shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full space-y-4 pt-12 border-t border-zinc-900 mt-auto">
        <button 
          onClick={onReady}
          disabled={isReady || !hasSeen}
          className={cn(
            "w-full py-4 rounded-2xl flex items-center justify-center gap-2 uppercase font-black tracking-tighter text-lg transition-all",
            (isReady || !hasSeen)
              ? "bg-zinc-800 text-zinc-500 opacity-50 cursor-default" 
              : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_10px_30px_rgba(16,185,129,0.2)] active:scale-95"
          )}
        >
          <Check size={20} />
          {isReady ? "Aguardando outros..." : "Entendi!"}
        </button>
      </div>
    </div>
  );
};
