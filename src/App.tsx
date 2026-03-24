/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Play, 
  UserPlus, 
  LogOut, 
  Eye, 
  MessageSquare, 
  Vote, 
  Trophy, 
  AlertCircle,
  Hash,
  Crown,
  Send
} from 'lucide-react';

// --- Types ---

type GameStatus = 'lobby' | 'reveal' | 'clues' | 'voting' | 'results';

interface Player {
  id: string;
  name: string;
  role: 'normal' | 'impostor';
  word: string;
  clue: string;
  votes: number;
  isReady: boolean;
  votedFor?: string;
  joinTime: number;
}

interface Room {
  id: string;
  status: GameStatus;
  wordA: string;
  wordB: string;
  category: string;
  impostorId: string;
  hostId: string;
  messages: { userId: string, name: string, text: string }[];
  winner?: 'normal' | 'impostor';
  players: Player[];
}

// --- Components ---

export default function App() {
  const [userId] = useState(() => {
    const saved = sessionStorage.getItem('impostor_user_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 12);
    sessionStorage.setItem('impostor_user_id', newId);
    return newId;
  });

  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('impostor_player_name') || '');
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWord, setShowWord] = useState(false);
  const [clueInput, setClueInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [connected, setConnected] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (room?.messages) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [room?.messages]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'SYNC') {
        setRoom(message.payload);
        setRoomCode(message.payload.id);
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('impostor_player_name', playerName);
  }, [playerName]);

  // Auto-rejoin on reconnect
  useEffect(() => {
    if (connected && room?.id && playerName) {
      send("JOIN", { roomId: room.id, userId, name: playerName });
    }
  }, [connected]);

  const currentPlayer = useMemo(() => {
    return (room?.players || []).find(p => p.id === userId);
  }, [room?.players, userId]);

  const isHost = room?.hostId === userId;

  // --- Actions ---

  const send = (type: string, payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
      return true;
    }
    setError("Sem conexão com o servidor. Tente novamente em instantes.");
    return false;
  };

  const createRoom = () => {
    if (!playerName.trim()) return setError("Digite seu nome!");
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (send("JOIN", { roomId: code, userId, name: playerName })) {
      setError(null);
    }
  };

  const joinRoom = (code: string) => {
    if (!playerName.trim()) return setError("Digite seu nome!");
    if (!code.trim()) return setError("Digite o código da sala!");
    if (send("JOIN", { roomId: code.toUpperCase(), userId, name: playerName })) {
      setError(null);
    }
  };

  const startGame = () => {
    if ((room?.players?.length || 0) < 3) return setError("Mínimo de 3 jogadores!");
    send("START_GAME", {});
  };

  const setReady = () => {
    send("READY", {});
  };

  const submitClue = () => {
    if (!clueInput.trim()) return;
    send("CLUE", { clue: clueInput.trim() });
    setClueInput('');
  };

  const submitChat = () => {
    if (!chatInput.trim()) return;
    send("CHAT", { text: chatInput.trim() });
    setChatInput('');
  };

  const submitVote = (targetId: string) => {
    if (currentPlayer?.votedFor) return;
    send("VOTE", { targetId });
  };

  const leaveRoom = () => {
    window.location.reload();
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      <main className="max-w-md mx-auto px-6 py-12 min-h-screen flex flex-col">
        
        {/* Header */}
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
            <div className={cn("w-2 h-2 rounded-full", connected ? "bg-emerald-500" : "bg-red-500")} />
          </div>
        </header>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!room ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Seu Nome</label>
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ex: Lucas"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={createRoom}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20"
                >
                  <Play size={20} fill="currentColor" />
                  Criar Nova Sala
                </button>
                
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                  <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest text-zinc-600"><span className="bg-zinc-950 px-4">Ou entre em uma</span></div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-colors uppercase tracking-widest font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && joinRoom(roomCode)}
                  />
                  <button 
                    onClick={() => joinRoom(roomCode)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 rounded-2xl transition-all"
                  >
                    <UserPlus size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="game"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Game Info Bar */}
              <div className="flex items-center justify-between mb-8 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                    <Hash size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sala</p>
                    <p className="font-mono font-bold text-lg leading-none">{room.id}</p>
                  </div>
                </div>
                <button 
                  onClick={leaveRoom}
                  className="text-zinc-500 hover:text-red-400 transition-colors p-2"
                >
                  <LogOut size={20} />
                </button>
              </div>

              {/* Lobby View */}
              {room.status === 'lobby' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={16} className="text-emerald-500" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Jogadores ({room.players.length})</h2>
                  </div>
                  <div className="space-y-2 mb-8 flex-1">
                    {room.players.map((p) => (
                      <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                        <span className="font-medium">{p.name} {p.id === userId && <span className="text-zinc-500 text-xs ml-2">(Você)</span>}</span>
                        {p.id === room.hostId && <Crown size={16} className="text-amber-500" />}
                      </div>
                    ))}
                  </div>
                  {isHost ? (
                    <button 
                      onClick={startGame}
                      disabled={room.players.length < 3}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-emerald-900/20"
                    >
                      Começar Jogo
                    </button>
                  ) : (
                    <div className="text-center p-6 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                      <p className="text-zinc-500 text-sm italic">Aguardando o host iniciar...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Word Reveal View */}
              {room.status === 'reveal' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold italic uppercase tracking-tighter">Sua Palavra Secreta</h2>
                    <div className="flex flex-col gap-1">
                      <p className="text-zinc-500 text-sm font-medium">Não deixe ninguém ver!</p>
                      {room.category && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit mx-auto">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Dica: {room.category}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onMouseDown={() => setShowWord(true)}
                    onMouseUp={() => setShowWord(false)}
                    onMouseLeave={() => setShowWord(false)}
                    onTouchStart={() => setShowWord(true)}
                    onTouchEnd={() => setShowWord(false)}
                    className="w-64 h-64 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-full flex flex-col items-center justify-center gap-4 transition-all active:scale-95 active:border-emerald-500/50"
                  >
                    {showWord ? (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1">
                          <p className="text-4xl font-black text-emerald-500 uppercase tracking-tighter">{currentPlayer?.word}</p>
                          {currentPlayer?.role === 'impostor' && (
                            <motion.p 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded uppercase tracking-widest animate-pulse"
                            >
                              ⚠️ VOCÊ É O IMPOSTOR
                            </motion.p>
                          )}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Solte para esconder</p>
                      </motion.div>
                    ) : (
                      <>
                        <Eye size={48} className="text-zinc-700" />
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Segure para ver</p>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={setReady}
                    disabled={currentPlayer?.isReady}
                    className={cn(
                      "w-full py-5 rounded-2xl font-bold transition-all",
                      currentPlayer?.isReady 
                        ? "bg-zinc-800 text-zinc-500 cursor-default"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    )}
                  >
                    {currentPlayer?.isReady ? "Aguardando outros..." : "Estou Pronto"}
                  </button>
                </div>
              )}

              {/* Clues View */}
              {room.status === 'clues' && (
                <div className="flex-1 flex flex-col">
                  <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold mb-1 italic uppercase tracking-tighter">Hora da Dica</h2>
                    <p className="text-zinc-500 text-xs">Apenas um jogador fala por vez.</p>
                  </div>

                  <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const players = room?.players || [];
                      const activePlayer = players.find(p => !p.clue);
                      return players.map((p) => {
                        const isTurn = activePlayer?.id === p.id;
                        return (
                          <div 
                            key={p.id} 
                            className={cn(
                              "bg-zinc-900 border p-4 rounded-2xl flex items-center justify-between transition-all",
                              isTurn ? "border-emerald-500 shadow-lg shadow-emerald-500/10" : "border-zinc-800 opacity-60"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", isTurn ? "bg-emerald-500 animate-pulse" : "bg-zinc-800")} />
                              <span className={cn("font-bold text-sm", isTurn ? "text-white" : "text-zinc-500")}>{p.name}</span>
                            </div>
                            {p.clue ? (
                              <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                                {p.clue}
                              </span>
                            ) : (
                              <span className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest italic">
                                {isTurn ? "Digitando..." : "Aguardando..."}
                              </span>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {(() => {
                    const players = room?.players || [];
                    const activePlayer = players.find(p => !p.clue);
                    return activePlayer?.id === userId && (
                      <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <input 
                          type="text" 
                          value={clueInput}
                          onChange={(e) => setClueInput(e.target.value)}
                          placeholder="Sua dica única..."
                          autoFocus
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-colors uppercase font-bold text-sm tracking-widest placeholder:text-zinc-700 placeholder:italic placeholder:tracking-normal"
                          onKeyDown={(e) => e.key === 'Enter' && submitClue()}
                        />
                        <button 
                          onClick={submitClue}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-2xl transition-all shadow-lg shadow-emerald-900/20"
                        >
                          <MessageSquare size={20} />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Voting View */}
              {room.status === 'voting' && (
                <div className="flex-1 flex flex-col max-h-[70vh]">
                  <div className="mb-4 text-center">
                    <h2 className="text-xl font-bold italic uppercase tracking-tighter">Debate e Votação</h2>
                    <p className="text-zinc-500 text-xs">Discuta no chat e selecione o impostor.</p>
                    <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest mt-1">
                      {room?.messages?.length || 0} mensagens recebidas
                    </p>
                  </div>

                  {/* Chat Section */}
                  <div className="flex-1 bg-zinc-900/30 border border-zinc-900 rounded-3xl mb-4 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {(room?.messages || []).length === 0 && (
                        <p className="text-center text-zinc-700 text-[10px] uppercase font-bold tracking-widest mt-8">Nenhuma mensagem ainda...</p>
                      )}
                      {(room?.messages || []).map((msg, i) => (
                        <div key={i} className={cn("flex flex-col gap-1", msg?.userId === userId ? "items-end" : "items-start")}>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">{msg?.name}</span>
                          <div className={cn(
                            "max-w-[80%] px-4 py-2 rounded-2xl text-sm",
                            msg?.userId === userId 
                              ? "bg-emerald-600 text-white rounded-tr-none" 
                              : "bg-zinc-800 text-zinc-300 rounded-tl-none"
                          )}>
                            {msg?.text}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    
                    <div className="p-2 bg-zinc-900/50 border-t border-zinc-800 flex gap-2">
                       <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Debata aqui..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && submitChat()}
                      />
                      <button 
                        onClick={submitChat}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-xl transition-all shadow-lg shadow-emerald-900/10"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Special Option: More Clues */}
                    <button 
                      disabled={!!currentPlayer?.votedFor}
                      onClick={() => submitVote("RE_ROUND")}
                      className={cn(
                        "p-3 rounded-2xl border flex flex-col items-center justify-center transition-all text-center gap-1",
                        currentPlayer?.votedFor === "RE_ROUND" 
                          ? "bg-amber-500/10 border-amber-500/50" 
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 disabled:opacity-50"
                      )}
                    >
                      <p className="font-bold text-sm text-amber-500">Mais uma rodada</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Pedir mais dicas</p>
                    </button>

                    {(room?.players || []).map((p) => (
                      <button 
                        key={p?.id} 
                        disabled={!!currentPlayer?.votedFor || p?.id === userId}
                        onClick={() => p?.id && submitVote(p.id)}
                        className={cn(
                          "p-3 rounded-2xl border flex flex-col items-center justify-center transition-all text-center gap-1",
                          currentPlayer?.votedFor === p?.id 
                            ? "bg-emerald-500/10 border-emerald-500/50" 
                            : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 disabled:opacity-50"
                        )}
                      >
                        <p className="font-bold text-sm truncate w-full">{p?.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black truncate w-full">{p?.clue}</p>
                        {currentPlayer?.votedFor === p?.id && <Vote size={14} className="text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results View */}
              {room.status === 'results' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="space-y-4">
                    <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                      <Trophy size={40} />
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                      {room.winner === 'normal' ? 'Tripulantes Venceram!' : 'Impostor Venceu!'}
                    </h2>
                    <p className="text-zinc-500">
                      {room.winner === 'normal' 
                        ? 'Vocês descobriram o impostor a tempo!' 
                        : 'O impostor conseguiu enganar a todos!'}
                    </p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Impostor</span>
                      <span className="font-bold text-red-400">{(room?.players || []).find(p => p.id === room?.impostorId)?.name || 'Desconhecido'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Palavra</span>
                      <span className="font-bold text-emerald-500 tracking-wider transition-all">{room?.wordA}</span>
                    </div>
                  </div>

                  {isHost && (
                    <button 
                      onClick={startGame}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-emerald-900/20"
                    >
                      Jogar Novamente
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-auto pt-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">
            Dedução Social • WebSockets • MongoDB
          </p>
        </footer>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}

