/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { User, Hash, DoorOpen, Plus } from 'lucide-react';

interface RoomAccessProps {
  name: string;
  roomId: string;
  isLinkEntry?: boolean;
  onNameChange: (val: string) => void;
  onRoomIdChange: (val: string) => void;
  onJoinRoom: () => void;
  onCreateRoom: () => void;
}

export const RoomAccess: React.FC<RoomAccessProps> = ({ 
  name, 
  roomId, 
  isLinkEntry = false,
  onNameChange, 
  onRoomIdChange, 
  onJoinRoom, 
  onCreateRoom 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        {/* Name Input */}
        <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl flex items-center gap-3 group focus-within:border-emerald-500/50 transition-all shadow-xl">
          <div className="bg-zinc-800 p-2.5 rounded-xl text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
            <User size={18} />
          </div>
          <input 
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Seu nome"
            autoFocus
            className="bg-transparent border-none outline-none flex-1 text-sm font-medium placeholder:text-zinc-700"
          />
        </div>

        {/* Room ID Input - Hidden if entering via direct link */}
        {!isLinkEntry && (
          <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl flex items-center gap-3 group focus-within:border-emerald-500/50 transition-all shadow-xl">
            <div className="bg-zinc-800 p-2.5 rounded-xl text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
              <Hash size={18} />
            </div>
            <input 
              value={roomId}
              onChange={(e) => onRoomIdChange(e.target.value)}
              placeholder="ID da Sala (Opcional)"
              className="bg-transparent border-none outline-none flex-1 text-sm font-medium placeholder:text-zinc-700"
            />
          </div>
        )}
      </div>

      <div className={`grid ${isLinkEntry ? "grid-cols-1" : "grid-cols-2"} gap-3 pt-4`}>
        <button 
          onClick={onJoinRoom}
          className={`flex ${isLinkEntry ? "flex-row py-5 px-8" : "flex-col p-4"} items-center justify-center rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group gap-3 active:scale-95 shadow-xl`}
        >
          <div className="p-3 bg-zinc-800 rounded-2xl text-zinc-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
            <DoorOpen size={isLinkEntry ? 20 : 24} />
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 group-hover:text-emerald-500">
            {isLinkEntry ? "Entrar na Sala Agora" : "Entrar"}
          </span>
        </button>

        {!isLinkEntry && (
          <button 
            onClick={onCreateRoom}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-emerald-500 hover:bg-emerald-400 group space-y-2 transition-all active:scale-95 shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
          >
            <div className="p-3 bg-black/10 rounded-2xl text-black/40 group-hover:text-black group-hover:bg-black/5 transition-all">
              <Plus size={24} />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-black">Criar Sala</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
