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

import { Chat } from './components/game/Chat';

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

  // Sync roomCode with URL if it changes externally
  useEffect(() => {
    if (urlRoomId && urlRoomId.toUpperCase() !== roomCode) {
      setRoomCode(urlRoomId.toUpperCase());
    }
  }, [urlRoomId]);

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
      <main className={cn(
        "mx-auto px-6 py-12 min-h-screen flex flex-col",
        room ? "max-w-6xl" : "max-w-md"
      )}>
        
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
              key="game-layout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col lg:flex-row gap-8 items-start"
            >
              {/* Main Content Area */}
              <div className="flex-1 w-full flex flex-col min-w-0">
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
                  <div className="flex items-center gap-2">
                    {currentPlayer && !currentPlayer.active && room.status !== 'lobby' && (
                      <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border border-amber-500/20">
                        Espectador
                      </span>
                    )}
                    <button 
                      onClick={leaveRoom}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-2"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
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
                    <Voting 
                      room={room} 
                      currentUserId={userId} 
                      onVote={submitVote} 
                    />
                  )}

                  {room.status === 'results' && (
                    <Results 
                      room={room} 
                      onPlayAgain={startGame} 
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Sidebar Chat */}
              <aside className="w-full lg:w-[360px] lg:sticky lg:top-12 flex flex-col h-[500px] lg:h-[calc(100vh-160px)]">
                <Chat 
                  room={room}
                  userId={userId}
                  chatInput={chatInput}
                  onChatInputChange={setChatInput}
                  onSendChat={submitChat}
                />
              </aside>
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

