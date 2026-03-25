/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Info, RotateCcw, Bell, BellOff, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  isRoomActive: boolean;
  isHost: boolean;
  onShowRules: () => void;
  onShowAdmin: () => void;
  onRestartRequest?: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  connected, 
  isRoomActive, 
  isHost,
  onShowRules, 
  onShowAdmin,
  onRestartRequest, 
  notificationsEnabled, 
  onToggleNotifications 
}) => {
  return (
    <header className="mb-12 flex items-center justify-between">
      <div className="flex-1" /> {/* Spacer */}
      
      <div className="text-center flex-1">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black tracking-tighter uppercase italic text-emerald-500 mb-2"
        >
          Impostor
        </motion.h1>
        <div className="flex items-center justify-center gap-2">
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest leading-none">Das Palavras</p>
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
        </div>
      </div>

      <div className="flex-1 flex justify-end gap-2">
        {isHost && (
          <button
            onClick={onShowAdmin}
            title="Painel Admin"
            className="p-3 bg-zinc-900/50 hover:bg-amber-400/10 text-zinc-400 hover:text-amber-400 border border-zinc-800 hover:border-amber-400/20 rounded-2xl transition-all active:scale-90"
          >
            <ShieldAlert size={20} />
          </button>
        )}
        {isRoomActive && onRestartRequest && (
          <button
            onClick={onRestartRequest}
            title="Votar para Reiniciar"
            className="p-3 bg-zinc-900/50 hover:bg-red-400/10 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-400/20 rounded-2xl transition-all active:scale-90"
          >
            <RotateCcw size={20} />
          </button>
        )}
        <button
          onClick={onToggleNotifications}
          title={notificationsEnabled ? "Desativar Notificações" : "Ativar Notificações"}
          className={`p-3 border rounded-2xl transition-all active:scale-90 ${
            notificationsEnabled 
              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/20" 
              : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:text-zinc-400"
          }`}
        >
          {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
        <button
          onClick={onShowRules}
          title="Regras"
          className="p-3 bg-zinc-900/50 hover:bg-emerald-400/10 text-zinc-400 hover:text-emerald-400 border border-zinc-800 hover:border-emerald-400/20 rounded-2xl transition-all active:scale-90"
        >
          <Info size={20} />
        </button>
      </div>
    </header>
  );
};
