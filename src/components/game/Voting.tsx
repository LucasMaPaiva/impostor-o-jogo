/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Vote, Check } from 'lucide-react';
import { Room, Player } from '../../types/game';

interface VotingProps {
  room: Room;
  currentUserId: string;
  onVote: (targetId: string) => void;
}

export const Voting: React.FC<VotingProps> = ({ room, currentUserId, onVote }) => {
  const currentPlayer = room.players.find(p => p.id === currentUserId);
  const playersLeft = room.players.filter(p => !p.votedFor).length;

  return (
    <div className="flex-1 flex flex-col space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-red-400">Hora de Votar</h2>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest leading-none flex items-center gap-2">
          {playersLeft} {playersLeft === 1 ? "Jogador falta" : "Jogadores faltam"} votar
        </p>
      </div>

      <div className="max-h-[340px] overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
        {room.players.map((p) => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              p.votedFor 
                ? "bg-zinc-900/40 border-zinc-800/50 opacity-60" 
                : "bg-zinc-900/60 border-zinc-800/80"
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${p.votedFor ? "bg-zinc-800 text-zinc-600" : "bg-red-400 text-black"}`}>
                <p className="text-xs font-bold leading-none">{p.name[0]}</p>
              </div>
              <div className="space-y-0.5 overflow-hidden">
                <p className={`font-bold tracking-tight text-sm truncate ${p.votedFor ? "text-zinc-500" : "text-zinc-200"}`}>
                  {p.name}
                  {p.id === currentUserId && <span className="ml-1 text-[10px] uppercase tracking-widest opacity-40 font-black">(Você)</span>}
                </p>
                {p.clue && (
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic truncate">"{p.clue}"</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              {currentPlayer && !currentPlayer.votedFor && p.id !== currentUserId && (
                <button 
                  onClick={() => onVote(p.id)}
                  className="bg-red-400/10 hover:bg-red-400 text-red-400 hover:text-black p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center border border-red-400/20 hover:border-transparent"
                >
                  <Vote size={18} />
                </button>
              )}

              {p.votedFor && (
                <div className="bg-zinc-800/80 p-2 rounded-xl text-emerald-500/50 shadow-inner">
                  <Check size={16} strokeWidth={3} />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {currentPlayer && !currentPlayer.votedFor && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onVote("RE_ROUND")}
          className="w-full mt-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all group flex items-center justify-between shrink-0"
        >
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-black uppercase tracking-tighter text-emerald-500">Mais uma rodada</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Peça mais dicas.</span>
          </div>
          <div className="bg-emerald-500 p-2 rounded-xl text-black group-hover:scale-110 transition-transform">
            <Vote size={18} />
          </div>
        </motion.button>
      )}
    </div>
  );
};
