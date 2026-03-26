import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, User } from 'lucide-react';
import { Player } from '../../types/game';
import { cn } from '../../lib/utils';

interface HistoryModalProps {
  player: Player | null;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 leading-none">Histórico de Dicas</h2>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                <User size={10} /> {player.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {!player.clueHistory || player.clueHistory.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-zinc-500 text-sm">Nenhuma dica enviada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {player.clueHistory.map((clue, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between",
                    index === player.clueHistory.length - 1
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-zinc-800/30 border-zinc-800 text-zinc-400"
                  )}
                >
                  <span className={cn(
                    "font-medium",
                    index !== player.clueHistory.length - 1 && "line-through opacity-50"
                  )}>
                    "{clue}"
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">
                    Rodada {index + 1}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-white/5"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
