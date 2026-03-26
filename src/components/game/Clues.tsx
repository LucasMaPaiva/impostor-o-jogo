/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, History } from 'lucide-react';
import { Room, Player } from '../../types/game';

interface CluesProps {
  room: Room;
  currentUserId: string;
  clueInput: string;
  onClueChange: (val: string) => void;
  onSendClue: () => void;
  onOpenHistory: (player: Player) => void;
}

export const Clues: React.FC<CluesProps> = ({ 
  room, 
  currentUserId, 
  clueInput, 
  onClueChange, 
  onSendClue,
  onOpenHistory 
}) => {
  const activeOrderedPlayers = room.players.filter(p => p.active);
  const activePlayer = activeOrderedPlayers[room.turnIndex % (activeOrderedPlayers.length || 1)];
  const isMyTurn = activePlayer?.id === currentUserId;
  
  const nextPlayerIndex = (room.turnIndex + 1) % (activeOrderedPlayers.length || 1);
  const nextPlayer = activeOrderedPlayers[nextPlayerIndex];

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
        {room.players.map((p) => {
          const isTurn = p.id === activePlayer?.id;
          const hasClue = !!p.clue;
          const isEliminated = !p.active;
          
          return (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 ${
                isTurn
                  ? "bg-emerald-500/10 border-emerald-500/30 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  : isEliminated
                    ? "bg-zinc-950/50 border-zinc-900 opacity-40 grayscale"
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
                    {isEliminated && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-600 px-1.5 py-0.5 rounded-md">Eliminado</span>
                    )}
                    {p.clueHistory && p.clueHistory.length > 0 && (
                      <button 
                        onClick={() => onOpenHistory(p)}
                        className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-emerald-500 transition-colors group/history relative"
                      >
                        <History size={14} />
                      </button>
                    )}
                  </div>
                  {p.clue ? (
                    <p className="text-xs text-zinc-200 font-medium italic mt-0.5">"{p.clue}"</p>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5" >
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

      <div className="mt-auto h-32" /> {/* Spacer for floating input */}

      <AnimatePresence>
        {isMyTurn && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-50"
          >
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/30 p-3 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(16,185,129,0.1)] flex flex-col gap-3">
              <div className="flex gap-2">
                <input 
                  value={clueInput}
                  onChange={(e) => onClueChange(e.target.value)}
                  placeholder="Sua dica secreta..."
                  autoFocus
                  className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full px-5 py-3 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && clueInput.trim() && onSendClue()}
                />
                <button 
                  onClick={onSendClue}
                  disabled={!clueInput.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 disabled:grayscale text-black p-3 rounded-full transition-all active:scale-90 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <Send size={20} fill="currentColor" />
                </button>
              </div>
              <div className="px-4 pb-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-black text-center animate-pulse">
                  ✨ É a sua vez de brilhar!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isMyTurn && (
        <div className="mt-auto pt-8 border-t border-zinc-900 px-8 py-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl text-center">
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
            Aguarde sua vez para enviar a dica.<br/>
            O jogador atual é <span className="text-zinc-400">{activePlayer?.name}</span>.
          </p>
        </div>
      )}
    </div>
  );
};
