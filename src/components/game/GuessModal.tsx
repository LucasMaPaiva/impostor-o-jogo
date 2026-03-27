import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send } from 'lucide-react';

interface GuessModalProps {
  onClose: () => void;
  onSubmit: (guess: string) => void;
}

export function GuessModal({ onClose, onSubmit }: GuessModalProps) {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onSubmit(guess.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
      >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Chutar Palavra</h2>
              <p className="text-zinc-400 text-sm">
                Cuidado! Se você acertar, ganha o jogo imediatamente. Se errar, perde na hora!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Qual a palavra secreta?"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 transition-colors placeholder:text-zinc-700 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={!guess.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-zinc-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                Tentar Sorte
                <Send size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
      </motion.div>
    </div>
  );
}
