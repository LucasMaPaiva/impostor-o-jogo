/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface HeaderProps {
  connected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ connected }) => {
  return (
    <header className="mb-12 text-center">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-black tracking-tighter uppercase italic text-emerald-500 mb-2"
      >
        Impostor
      </motion.h1>
      <div className="flex items-center justify-center gap-2">
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Das Palavras</p>
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
      </div>
    </header>
  );
};
