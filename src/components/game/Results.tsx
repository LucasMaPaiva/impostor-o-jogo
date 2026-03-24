/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, History } from 'lucide-react';
import { Room } from '../../types/game';

interface ResultsProps {
  room: Room;
  onPlayAgain: () => void;
}

export const Results: React.FC<ResultsProps> = ({ room, onPlayAgain }) => {
  const winner = room.winner;
  const wordA = room.wordA;
  const impostorLabel = room.players.find(p => p.id === room.impostorId)?.name || 'Desconhecido';

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10">
      <div className="space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-xl ${
            winner === 'normal' ? "bg-emerald-500 text-black shadow-emerald-500/20" : "bg-red-400 text-black shadow-red-400/20"
          }`}
        >
          <Trophy size={40} />
        </motion.div>
        
        <div className="space-y-1">
          <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${
            winner === 'normal' ? "text-emerald-500" : "text-red-400"
          }`}>
            {winner === 'normal' ? "Vitória Civis!" : "Impostor Venceu!"}
          </h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Fim de jogo</p>
        </div>
      </div>

      <div className="w-full max-w-[280px] bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-3xl space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Impostor</span>
            <span className="font-bold text-red-400">{impostorLabel}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Palavra</span>
            <span className="font-bold text-emerald-500 tracking-wider transition-all">{wordA}</span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 pt-12 border-t border-zinc-900 mt-auto">
        <button 
          onClick={onPlayAgain}
          className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase font-black tracking-tighter text-lg transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 group"
        >
          <History size={20} className="group-hover:-rotate-45 transition-transform" />
          Jogar Novamente
        </button>
      </div>
    </div>
  );
};
