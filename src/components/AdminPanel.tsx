import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserMinus, ShieldAlert } from 'lucide-react';
import { Room } from '../types/game';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  room: Room;
  currentUserId: string;
  onClose: () => void;
  onKickPlayer: (playerId: string) => void;
}

export function AdminPanel({ room, currentUserId, onClose, onKickPlayer }: AdminPanelProps) {
  const isHost = room.hostId === currentUserId;

  if (!isHost) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Painel do Host</h2>
              <p className="text-xs text-zinc-500">Gerencie os jogadores da sala</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            {room.players.map((player) => {
              const matchesHost = player.id === room.hostId;
              
              return (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border transition-all",
                    matchesHost 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-zinc-800/50 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                      matchesHost ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                    )}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200">{player.name}</span>
                        {matchesHost && (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                            Host
                          </span>
                        )}
                        {!player.active && (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-500 border border-zinc-700">
                            Eliminado
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500">ID: {player.id.substring(0, 8)}...</p>
                    </div>
                  </div>

                  {!matchesHost && (
                    <button
                      onClick={() => onKickPlayer(player.id)}
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 group"
                      title="Expulsar jogador"
                    >
                      <UserMinus size={18} />
                      <span className="text-xs font-bold hidden group-hover:inline">Expulsar</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
          <p className="text-[10px] text-center text-zinc-500 uppercase tracking-widest font-medium">
            Ações realizadas aqui são imediatas
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
