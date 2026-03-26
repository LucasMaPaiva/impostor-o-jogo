import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface WarningModalProps {
  message: string | null;
  onClose: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 flex flex-col items-center text-center">
          <div className="bg-amber-500/10 p-4 rounded-2xl text-amber-500 mb-4">
            <AlertCircle size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Ops!</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            {message}
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-amber-500/10"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
};
