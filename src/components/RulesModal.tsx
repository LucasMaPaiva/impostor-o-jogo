import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Target, Sword, Trophy, Info } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter text-zinc-100">Como Jogar</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-none">Guia do Impostor das Palavras</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500 hover:text-zinc-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
              {/* Objective */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Target size={18} />
                  <h3 className="font-bold uppercase tracking-widest text-sm">O Objetivo</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                    <p className="text-xs font-black uppercase text-zinc-500 mb-1">Civis</p>
                    <p className="text-sm text-zinc-300">Descobrir quem são os impostores antes que eles dominem a sala.</p>
                  </div>
                  <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                    <p className="text-xs font-black uppercase text-red-400 mb-1">Impostores</p>
                    <p className="text-sm text-zinc-300">Se misturar aos civis e sobreviver até que restem poucos jogadores.</p>
                  </div>
                </div>
              </section>

              {/* Steps */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Sword size={18} />
                  <h3 className="font-bold uppercase tracking-widest text-sm">Fases da Partida</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 font-black text-emerald-500 text-sm">1</div>
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-200 text-sm">Revelação</p>
                      <p className="text-sm text-zinc-400">Todos recebem uma palavra secreta. Os civis recebem a mesma, mas o impostor recebe uma palavra diferente (porém parecida!).</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 font-black text-emerald-500 text-sm">2</div>
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-200 text-sm">Dicas</p>
                      <p className="text-sm text-zinc-400">Cada jogador escreve uma dica de uma única palavra. Cuidado: se sua dica for óbvia demais, o impostor descobre sua palavra. Se for estranha demais, vão achar que VOCÊ é o impostor!</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 font-black text-emerald-500 text-sm">3</div>
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-200 text-sm">Votação</p>
                      <p className="text-sm text-zinc-400">Hora de debater e votar em quem você acha que está com a palavra intrusa. A votação é aberta!</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Victory */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Trophy size={18} />
                  <h3 className="font-bold uppercase tracking-widest text-sm">Condições de Vitória</h3>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-zinc-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>Os **Civis** ganham se todos os impostores forem eliminados.</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-zinc-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span>Os **Impostores** ganham se o número de impostores vivos for igual ao de civis.</span>
                  </li>
                </ul>
              </section>

              {/* Pro-Tip */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex gap-3">
                <Info className="text-emerald-500 shrink-0" size={20} />
                <p className="text-xs text-emerald-500/80 leading-relaxed">
                  <span className="font-black uppercase tracking-tighter mr-1 text-emerald-500">Dica:</span>
                  Se estiverem em dúvida, podem votar em "MAIS UMA RODADA" para pedir uma segunda dica de cada jogador antes de decidir!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-zinc-900/80 border-t border-zinc-800">
              <button 
                onClick={onClose}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_8px_0_0_#059669] active:shadow-none active:translate-y-1"
              >
                Entendido!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
