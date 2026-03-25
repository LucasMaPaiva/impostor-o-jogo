/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { User, Copy, Play, UserMinus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Room, Player } from '../../types/game';

interface LobbyProps {
  room: Room;
  currentUserId: string;
  onStartGame: () => void;
  onCopyRoomId: () => void;
  onUpdateSettings: (settings: { impostorCount: number }) => void;
  onKickPlayer: (targetId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ 
  room, 
  currentUserId, 
  onStartGame, 
  onCopyRoomId, 
  onUpdateSettings,
  onKickPlayer
}) => {
  const isHost = room.hostId === currentUserId;
  const canStart = room.players.length >= 3;
  
  // Calculate max allowed impostors (approx 40% of room)
  const maxImpostors = Math.max(1, Math.floor(room.players.length / 2.5));
  const impostorOptions = Array.from({ length: maxImpostors }, (_, i) => i + 1);

  return (
    <div className="flex-1 flex flex-col space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-100">Sala de Espera</h2>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest leading-none flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {room.players.length} {room.players.length === 1 ? "Jogador" : "Jogadores"}
            </p>
          </div>
          <button 
            onClick={onCopyRoomId}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-zinc-800"
          >
            <Copy size={12} />
            ID: {room.id}
          </button>
        </div>

        {/* Impostor Count Setting (Host Only) */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Configurações da Partida</h3>
            {!isHost && (
              <span className="text-[10px] text-zinc-600 font-bold uppercase italic">Apenas Host</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-zinc-300">Número de Impostores</p>
              <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-tight">Recomendado: {room.players.length >= 7 ? '2' : '1'}</p>
            </div>
            
            <div className="flex gap-1.5">
              {impostorOptions.map(num => (
                <button
                  key={num}
                  disabled={!isHost}
                  onClick={() => onUpdateSettings({ impostorCount: num })}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-black transition-all",
                    room.impostorCount === num 
                      ? "bg-red-500 text-white shadow-lg shadow-red-900/20" 
                      : isHost 
                        ? "bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700" 
                        : "bg-zinc-800/50 text-zinc-700"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {room.players.sort((a, b) => b.joinTime - a.joinTime).map((p) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                p.id === currentUserId 
                  ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
                  : "bg-zinc-900/50 border-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${p.id === currentUserId ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                  <User size={16} />
                </div>
                <div>
                  <p className={`font-bold tracking-tight ${p.id === currentUserId ? "text-emerald-500" : "text-zinc-300"}`}>
                    {p.name}
                    {p.id === currentUserId && <span className="ml-2 text-[10px] uppercase tracking-widest opacity-60">(Você)</span>}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                    {p.id === room.hostId ? "Anfitrião" : "Jogador"}
                  </p>
                </div>
              </div>

              {p.id !== currentUserId && isHost && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onKickPlayer(p.id)}
                    title="Expulsar Jogador"
                    className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 hover:border-transparent active:scale-95"
                  >
                    <UserMinus size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-4 pt-8 border-t border-zinc-900">
        {!isHost ? (
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aguardando Host</p>
            <p className="text-[10px] text-zinc-600 font-medium tracking-tight leading-relaxed">O anfitrião iniciará a partida assim que todos estiverem prontos.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {!canStart && (
              <p className="text-[10px] text-center uppercase tracking-widest font-black text-amber-500/60 animate-pulse">
                ⚠️ Mínimo 3 jogadores para iniciar
              </p>
            )}
            <button 
              disabled={!canStart}
              onClick={onStartGame}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 disabled:grayscale text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-tighter text-lg transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] active:scale-95 group"
            >
              <Play size={20} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" />
              Começar Jogo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
