/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { UserMinus, Check, ArrowRight } from 'lucide-react';
import { Room, Player } from '../../types/game';

interface EliminationResultProps {
  room: Room;
  currentUserId: string;
  onReady: () => void;
}

export const EliminationResult: React.FC<EliminationResultProps> = ({ room, currentUserId, onReady }) => {
  const eliminatedPlayer = room.players.find(p => p.id === room.lastEliminatedId);
  const currentPlayer = room.players.find(p => p.id === currentUserId);
  const isSpectator = !currentPlayer?.active;
  const isReady = currentPlayer?.isReady || false;

  const activePlayers = room.players.filter(p => p.active);
  const readyCount = activePlayers.filter(p => p.isReady).length;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10">
      <div className="space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-24 h-24 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl ${
            room.eliminatedRole === 'impostor' 
              ? "bg-red-500 text-white shadow-red-500/20" 
              : "bg-emerald-500 text-black shadow-emerald-500/20"
          }`}
        >
          <UserMinus size={48} />
        </motion.div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-100">
            {eliminatedPlayer?.name || "Jogador"} Eliminado
          </h2>
          <div className="flex flex-col items-center gap-1">
            <span className={`text-sm font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
              room.eliminatedRole === 'impostor' 
                ? "bg-red-500/20 text-red-500 border border-red-500/30" 
                : "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
            }`}>
              {room.eliminatedRole === 'impostor' ? "ERA UM IMPOSTOR" : "ERA UM CIVIL"}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[320px] space-y-8">
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <span>Prontidão</span>
            <span className="text-emerald-500">{readyCount}/{activePlayers.length}</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            {activePlayers.map(p => (
              <div 
                key={p.id}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  p.isReady ? "bg-emerald-500 text-black rotate-3 scale-110" : "bg-zinc-800 text-zinc-600"
                }`}
              >
                {p.isReady ? <Check size={20} strokeWidth={4} /> : <span className="text-xs font-bold">{p.name[0]}</span>}
              </div>
            ))}
          </div>
        </div>

        {!isSpectator && (
          <button 
            disabled={isReady}
            onClick={onReady}
            className={`w-full py-5 rounded-3xl flex items-center justify-center gap-3 uppercase font-black tracking-tighter text-xl transition-all active:scale-95 shadow-xl ${
              isReady 
                ? "bg-zinc-800 text-zinc-500 cursor-default opacity-50" 
                : "bg-white hover:bg-zinc-200 text-black shadow-white/10 group"
            }`}
          >
            {isReady ? (
              <>Aguardando...</>
            ) : (
              <>
                Continuar
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        )}

        {isSpectator && (
          <div className="text-sm font-medium text-zinc-500 animate-pulse">
            Aguardando os outros jogadores...
          </div>
        )}
      </div>
    </div>
  );
};
