import React, { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Hash,
  Send
} from 'lucide-react';

import { Room, Player } from './types/game';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorAlert } from './components/ErrorAlert';
import { RoomAccess } from './components/RoomAccess';
import { Lobby } from './components/game/Lobby';
import { Reveal } from './components/game/Reveal';
import { Clues } from './components/game/Clues';
import { Voting } from './components/game/Voting';
import { Results } from './components/game/Results';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';

function GameContainer() {
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();

  const [userId] = useState(() => {
    const saved = sessionStorage.getItem('impostor_user_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 12);
    sessionStorage.setItem('impostor_user_id', newId);
    return newId;
  });

  const [roomCode, setRoomCode] = useState(urlRoomId?.toUpperCase() || '');
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('impostor_player_name') || '');
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clueInput, setClueInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [connected, setConnected] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync roomCode with URL if it changes externally
  useEffect(() => {
    if (urlRoomId && urlRoomId.toUpperCase() !== roomCode) {
      setRoomCode(urlRoomId.toUpperCase());
    }
  }, [urlRoomId]);

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
        const syncedRoom = message.payload;
        setRoom(syncedRoom);
        setRoomCode(syncedRoom.id);
        // Ensure URL is correct if we just joined/created
        if (window.location.pathname !== `/room/${syncedRoom.id}`) {
          navigate(`/room/${syncedRoom.id}`, { replace: true });
        }
      }
    };

    return () => socket.close();
  }, [navigate]);

  useEffect(() => {
    sessionStorage.setItem('impostor_player_name', playerName);
  }, [playerName]);

  // Auto-rejoin on reconnect
  useEffect(() => {
    if (connected && roomCode && playerName && !room) {
      // If we have a roomCode from URL, auto-join if we have a name
      // But only if we're not already in a room session
      send("JOIN", { roomId: roomCode, userId, name: playerName });
    } else if (connected && room?.id && playerName) {
      send("JOIN", { roomId: room.id, userId, name: playerName });
    }
  }, [connected]);

  const currentPlayer = useMemo(() => {
    return (room?.players || []).find(p => p.id === userId);
  }, [room?.players, userId]);

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
      navigate(`/room/${code}`);
    }
  };

  const joinRoom = (code: string) => {
    if (!playerName.trim()) return setError("Digite seu nome!");
    const targetCode = (code || roomCode).trim().toUpperCase();
    if (!targetCode) return setError("Digite o código da sala!");
    
    if (send("JOIN", { roomId: targetCode, userId, name: playerName })) {
      setError(null);
      navigate(`/room/${targetCode}`);
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
    navigate('/');
    setRoom(null);
    setRoomCode('');
  };

  const copyRoomId = () => {
    if (room?.id) {
      const url = `${window.location.origin}/room/${room.id}`;
      navigator.clipboard.writeText(url);
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      <main className="max-w-md mx-auto px-6 py-12 min-h-screen flex flex-col">
        
        <Header connected={connected} />

        {error && <ErrorAlert error={error} />}

        <AnimatePresence mode="wait">
          {!room ? (
            <RoomAccess 
              name={playerName}
              roomId={roomCode}
              isLinkEntry={!!urlRoomId}
              onNameChange={setPlayerName}
              onRoomIdChange={setRoomCode}
              onJoinRoom={() => joinRoom(roomCode)}
              onCreateRoom={createRoom}
            />
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

              {room.status === 'lobby' && (
                <Lobby 
                  room={room} 
                  currentUserId={userId} 
                  onStartGame={startGame} 
                  onCopyRoomId={copyRoomId} 
                />
              )}

              {room.status === 'reveal' && currentPlayer && (
                <Reveal 
                  player={currentPlayer} 
                  category={room.category} 
                  isReady={currentPlayer.isReady} 
                  onReady={setReady} 
                />
              )}

              {room.status === 'clues' && (
                <Clues 
                  room={room} 
                  currentUserId={userId} 
                  clueInput={clueInput} 
                  onClueChange={setClueInput} 
                  onSendClue={submitClue} 
                />
              )}

              {room.status === 'voting' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="shrink-0">
                    <Voting 
                      room={room} 
                      currentUserId={userId} 
                      onVote={submitVote} 
                    />
                  </div>
                  
                  <div className="flex-1 min-h-[200px] bg-zinc-900/30 border border-zinc-900 rounded-3xl mb-4 flex flex-col overflow-hidden mt-6">
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
                </div>
              )}

              {room.status === 'results' && (
                <Results 
                  room={room} 
                  onPlayAgain={startGame} 
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GameContainer />} />
      <Route path="/room/:roomId" element={<GameContainer />} />
    </Routes>
  );
}

