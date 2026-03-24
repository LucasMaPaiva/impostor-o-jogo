/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send } from 'lucide-react';
import { Room, Player } from '../../types/game';

interface CluesProps {
  room: Room;
  currentUserId: string;
  clueInput: string;
  onClueChange: (val: string) => void;
  onSendClue: () => void;
}

export const Clues: React.FC<CluesProps> = ({ room, currentUserId, clueInput, onClueChange, onSendClue }) => {
  const activePlayer = room.players[room.turnIndex % (room.players.length || 1)] || room.players.find(p => !p.clue);
  const isMyTurn = activePlayer?.id === currentUserId;
  const nextPlayerIndex = (room.turnIndex + 1) % (room.players.length || 1);
  const nextPlayer = room.players[nextPlayerIndex];

  return (
    <div className="flex-1 flex flex-col space-y-8">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Rodada de Dicas</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Vez de: <span className="text-white">{activePlayer?.name || "Aguardando..."}</span>
            </p>
          </div>
        </div>

        {nextPlayer && (
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            Próximo: {nextPlayer.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {room.players.map((p, index) => {
          const isTurn = index === room.turnIndex;
          const hasClue = !!p.clue;
          
          return (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 ${
                isTurn
                  ? "bg-emerald-500/10 border-emerald-500/30 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  : hasClue 
                    ? "bg-zinc-900/30 border-zinc-800/20 opacity-60" 
                    : "bg-zinc-900/50 border-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  hasClue ? "bg-emerald-500 text-black" : isTurn ? "bg-emerald-500/20 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                }`}>
                  <p className="text-xs font-bold leading-none">{p.name[0]}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold tracking-tight text-sm ${hasClue || isTurn ? "text-white" : "text-zinc-500"}`}>{p.name}</p>
                    {isTurn && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-md">Sua vez</span>
                    )}
                  </div>
                  {p.clue ? (
                    <p className="text-xs text-zinc-400 font-medium italic mt-0.5">"{p.clue}"</p>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1 h-1 rounded-full ${isTurn ? "bg-emerald-500 text-emerald-500" : "bg-zinc-700"} animate-pulse`} />
                      <p className="text-[10px] uppercase tracking-widest text-zinc-700 font-bold">
                        {isTurn ? "Escrevendo..." : "Esperando..."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-auto pt-8 border-t border-zinc-900">
        {isMyTurn ? (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-2xl flex gap-2">
              <input 
                value={clueInput}
                onChange={(e) => onClueChange(e.target.value)}
                placeholder="Sua dica rápida..."
                autoFocus
                className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium text-white placeholder:text-zinc-700"
                onKeyDown={(e) => e.key === 'Enter' && onSendClue()}
              />
              <button 
                onClick={onSendClue}
                disabled={!clueInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:grayscale text-black p-3 rounded-xl transition-all active:scale-90 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <Send size={18} fill="currentColor" />
              </button>
            </div>
            <p className="text-center text-[10px] uppercase tracking-widest text-emerald-500/50 font-black">
              Agora é a sua vez! Envie sua dica.
            </p>
          </div>
        ) : (
          <div className="px-8 py-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl text-center">
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
              Aguarde sua vez para enviar a dica.<br/>
              O jogador atual é <span className="text-zinc-400">{activePlayer?.name}</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
