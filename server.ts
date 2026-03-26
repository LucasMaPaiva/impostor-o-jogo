import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { MongoClient, Db } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongodb:27017/impostor";

let db: Db | null = null;

async function connectToMongo() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    await client.connect();
    db = client.db();
    console.log("Connected to MongoDB at " + MONGODB_URI);
  } catch (err) {
    console.warn("MongoDB unavailable at " + MONGODB_URI + ". Using in-memory fallback (game sessions won't persist on restart).");
  }
}

import { Player, Room, GameStatus } from './server/types.js';
import { loadWords, getRandomWord } from './server/gameLogic.js';

// --- Room State ---
const rooms = new Map<string, Room>();

// Load words on startup
loadWords();

const roomsCollection = () => db?.collection("rooms");

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

async function saveRoomToDb(room: Room) {
  if (!db) return;
  try {
    const playersObj: Record<string, any> = {};
    room.players.forEach((p, id) => {
      const { socket, ...pData } = p;
      playersObj[id] = pData;
    });

    await roomsCollection()?.updateOne(
      { id: room.id },
      { $set: { ...room, players: playersObj } },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error saving room to MongoDB:", err);
  }
}

async function startServer() {
  await connectToMongo();
  const app = express();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, payload } = message;

        switch (type) {
          case "SET_SETTINGS": {
            const room = rooms.get(currentRoomId!);
            if (!room || room.hostId !== currentUserId) return;
            room.impostorCount = Math.max(1, payload.impostorCount || 1);
            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }

          case "JOIN": {
            const { roomId, userId, name } = payload;
            currentRoomId = roomId;
            currentUserId = userId;

            let room = rooms.get(roomId);
            if (!room && db) {
              const dbRoom = await roomsCollection()?.findOne({ id: roomId });
              if (dbRoom) {
                const { _id, players, ...roomData } = dbRoom as any;
                const playerMap = new Map<string, Player>();
                Object.entries(players || {}).forEach(([id, p]: [string, any]) => {
                  playerMap.set(id, { ...p, socket: undefined });
                });
                room = { ...roomData, players: playerMap };
                rooms.set(roomId, room!);
              }
            }
            if (!room) {
              room = {
                id: roomId,
                status: 'lobby',
                wordA: '',
                wordB: '',
                category: '',
                impostorIds: [],
                impostorCount: 1,
                hostId: userId,
                players: new Map(),
                turnIndex: 0
              };
              rooms.set(roomId, room);
            }

            let player = room.players.get(userId);
            if (player) {
              player.socket = ws;
              player.name = name;
            } else {
              player = {
                id: userId,
                name,
                role: 'normal',
                word: '',
                clue: '',
                votes: 0,
                isAlive: true,
                isReady: false,
                joinTime: Date.now(),
                socket: ws,
                active: room.status === 'lobby' || room.status === 'results',
                clueHistory: []
              };
              room.players.set(userId, player);
            }
            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }

          case "START_GAME": {
            const room = rooms.get(currentRoomId!);
            if (!room || room.hostId !== currentUserId) return;

            const { palavra, dica } = getRandomWord();
            const playerIds = Array.from(room.players.keys());
            room.status = 'reveal';
            room.wordA = palavra;
            room.wordB = dica;
            room.category = ''; 
            room.winner = undefined;
            room.turnIndex = 0;
            room.turnOrder = shuffle(playerIds);
            room.reRoundVotes = 0;

            const count = Math.min(room.impostorCount || 1, Math.max(1, Math.floor(playerIds.length / 2)));
            const potentialImpostors = shuffle([...playerIds]);
            room.impostorIds = potentialImpostors.slice(0, count);

            room.players.forEach((p) => {
              const isImpostor = room.impostorIds.includes(p.id);
              p.role = isImpostor ? 'impostor' : 'normal';
              p.word = isImpostor ? dica : palavra;
              p.clue = '';
              p.clueHistory = [];
              p.votes = 0;
              p.votedFor = undefined;
              p.isReady = false;
              p.active = true;
            });

            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }

          case "READY": {
            const room = rooms.get(currentRoomId!);
            if (!room) return;
            const player = room.players.get(currentUserId!);
            if (!player) return;
            if (!player.active) return;

            player.isReady = true;
            const allReady = Array.from(room.players.values())
              .filter(p => p.active)
              .every(p => p.isReady);
            if (allReady) {
              if (room.status === 'reveal_elimination') {
                room.status = 'clues';
                room.turnIndex = 0;
                // Clear state for next round is already done in VOTE handler
              } else {
                room.status = 'clues';
              }
              room.players.forEach(p => p.isReady = false);
            }
            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }

          case "CLUE": {
            const room = rooms.get(currentRoomId!);
            if (!room) return;
            const player = room.players.get(currentUserId!);
            if (!player) return;

            const orderedIds = room.turnOrder || Array.from(room.players.keys()).sort((a,b) => (room.players.get(a)?.joinTime || 0) - (room.players.get(b)?.joinTime || 0));
            const sortedPlayers = orderedIds.map(id => room.players.get(id)).filter(Boolean) as Player[];
            const activeOrderedPlayers = sortedPlayers.filter(p => p.active);
            const activePlayer = activeOrderedPlayers[room.turnIndex];
            
            if (!activePlayer || activePlayer.id !== currentUserId) return;

            const normalizedClue = payload.clue.trim().toLowerCase();
            const isDuplicate = Array.from(room.players.values()).some(p => 
              p.clueHistory.some(h => h.trim().toLowerCase() === normalizedClue)
            );

            if (isDuplicate) {
              ws.send(JSON.stringify({
                type: "ERROR",
                payload: {
                  message: `⚠️ A dica "${payload.clue}" já foi usada! Tente outra.`
                }
              }));
              return;
            }

            player.clue = payload.clue;
            player.clueHistory = [...(player.clueHistory || []), payload.clue];
            room.turnIndex++;
            
            const allClues = activeOrderedPlayers.every(p => !!p.clue);
            if (allClues) {
              room.status = 'voting';
              room.players.forEach(p => p.isReady = false);
            }
            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }

          case "CHAT": {
            const room = rooms.get(currentRoomId!);
            if (!room) return;
            const player = room.players.get(currentUserId!);
            if (!player) return;

            broadcastToRoom(currentRoomId!, {
              type: "CHAT_MESSAGE",
              payload: {
                userId: currentUserId!,
                name: player.name,
                text: payload.text
              }
            });
            break;
          }

          case "VOTE": {
            const room = rooms.get(currentRoomId!);
            if (!room) return;
            const player = room.players.get(currentUserId!);
            if (!player || !player.active) return;

            if (player.votedFor) return;
            player.votedFor = payload.targetId;

            if (payload.targetId === "RE_ROUND") {
              room.reRoundVotes = (room.reRoundVotes || 0) + 1;
            } else {
              const target = room.players.get(payload.targetId);
              if (target && target.active) target.votes++;
            }

            const activePlayers = Array.from(room.players.values()).filter(p => p.active);
            const allVoted = activePlayers.every(p => p.votedFor);
            if (allVoted) {
              const sorted = [...activePlayers].sort((a, b) => b.votes - a.votes);
              const topPlayer = sorted[0];
              const reRoundTotal = room.reRoundVotes || 0;

              if (reRoundTotal > topPlayer.votes) {
                room.status = 'clues';
                room.reRoundVotes = 0;
                room.turnIndex = 0;
                room.players.forEach(p => {
                  p.clue = '';
                  p.votes = 0;
                  p.votedFor = undefined;
                });
              } else {
                // Eliminate logic
                topPlayer.active = false;
                topPlayer.clue = '';
                
                const allImpostorsOut = room.impostorIds.every(id => {
                  const p = room.players.get(id);
                  return !p || !p.active;
                });

                if (allImpostorsOut) {
                  room.status = 'results';
                  room.winner = 'normal';
                } else {
                  const currentActive = Array.from(room.players.values()).filter(p => p.active);
                  const activeNormal = currentActive.filter(p => !room.impostorIds.includes(p.id));
                  const activeImpostors = currentActive.filter(p => room.impostorIds.includes(p.id));

                    if (activeNormal.length <= activeImpostors.length) {
                      room.status = 'results';
                      room.winner = 'impostor';
                    } else {
                      room.status = 'reveal_elimination';
                      room.lastEliminatedId = topPlayer.id;
                      room.eliminatedRole = room.impostorIds.includes(topPlayer.id) ? 'impostor' : 'normal';
                      
                      room.players.forEach(p => {
                        p.clue = '';
                        p.votes = 0;
                        p.votedFor = undefined;
                        p.isReady = false;
                      });
                    }
                  }
                }
              }
            
            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }

          case "RESTART_VOTE": {
            const room = rooms.get(currentRoomId!);
            if (!room) return;
            const player = room.players.get(currentUserId!);
            if (!player) return;

            if (!room.restartVotes) room.restartVotes = [];
            if (room.restartVotes.includes(currentUserId!)) return;

            room.restartVotes.push(currentUserId!);
            
            const activePlayers = Array.from(room.players.values()).filter(p => p.active);
            const votesNeeded = Math.ceil(activePlayers.length / 2);

            // Notify in chat
            broadcastToRoom(currentRoomId!, {
              type: "CHAT_MESSAGE",
              payload: {
                userId: "system",
                name: "Sistema",
                text: `⚠️ ${player.name} quer reiniciar o jogo (${room.restartVotes.length}/${votesNeeded})`
              }
            });

            if (room.restartVotes.length >= votesNeeded) {
              room.status = 'lobby';
              room.restartVotes = [];
              room.reRoundVotes = 0;
              room.turnIndex = 0;
              room.players.forEach(p => {
                p.clue = '';
                p.clueHistory = [];
                p.votes = 0;
                p.votedFor = undefined;
                p.isReady = false;
              });
              
              broadcastToRoom(currentRoomId!, {
                type: "CHAT_MESSAGE",
                payload: {
                  userId: "system",
                  name: "Sistema",
                  text: "🔄 Votação concluída! Reiniciando para o Lobby..."
                }
              });
            }

            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }

          case "KICK_PLAYER": {
            const room = rooms.get(currentRoomId!);
            if (!room || room.hostId !== currentUserId) return;
            
            const targetId = payload.targetId;
            if (targetId === currentUserId) return; // Cannot kick self

            const target = room.players.get(targetId);
            if (!target) return;

            // Notify target
            if (target.socket && target.socket.readyState === WebSocket.OPEN) {
              target.socket.send(JSON.stringify({ type: "KICKED", payload: { reason: "Você foi expulso pelo host." } }));
            }

            room.players.delete(targetId);
            
            broadcastToRoom(currentRoomId!, {
              type: "CHAT_MESSAGE",
              payload: {
                userId: "system",
                name: "Sistema",
                text: `🚫 ${target.name} foi expulso pelo host.`
              }
            });

            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }
        }
      } catch (err) {
        console.error("Error processing message:", err);
      }
    });

    ws.on("close", async () => {
      if (currentRoomId && currentUserId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.players.delete(currentUserId);
          if (room.players.size === 0) {
            rooms.delete(currentRoomId);
            if (db) await roomsCollection()?.deleteOne({ id: currentRoomId });
          } else {
            // Check if game was active and an impostor left
            const wasImpostor = room.impostorIds.includes(currentUserId!);
            const isGameActive = room.status !== 'lobby' && room.status !== 'results';

            if (isGameActive && wasImpostor) {
              room.status = 'lobby';
              // Broadcast system message
              broadcastToRoom(currentRoomId!, {
                type: "CHAT_MESSAGE",
                payload: {
                  userId: 'system',
                  name: 'SISTEMA',
                  text: '⚠️ Um IMPOSTOR saiu da partida! O jogo foi reiniciado para o lobby.'
                }
              });
            }

            if (room.hostId === currentUserId) {
              room.hostId = Array.from(room.players.keys())[0];
            }
            await saveRoomToDb(room);
            broadcastRoom(room);
          }
        }
      }
    });
  });

  function broadcastRoom(room: Room) {
    room.players.forEach((p) => {
      if (p.socket && p.socket.readyState === WebSocket.OPEN) {
        // Construct the player-specific view of the room state
        const playerState: any = {
          id: room.id,
          status: room.status,
          category: '', 
          impostorIds: room.status === 'results' ? room.impostorIds : [],
          impostorCount: room.impostorCount,
          wordA: room.status === 'results' ? room.wordA : '',
          hostId: room.hostId,
          winner: room.winner,
          lastEliminatedId: room.lastEliminatedId,
          eliminatedRole: room.eliminatedRole,
          turnIndex: room.turnIndex,
          turnOrder: room.turnOrder,
          players: (room.turnOrder || Array.from(room.players.keys()).sort((a,b) => (room.players.get(a)?.joinTime || 0) - (room.players.get(b)?.joinTime || 0)))
            .map(id => room.players.get(id))
            .filter(Boolean)
            .map((player) => {
              const pl = player!;
              const { socket, word, role, ...pData } = pl;
              const isCurrent = pl.id === p.id;
              const revealAll = room.status === 'results';
              
              return {
                ...pData,
                clueHistory: pl.clueHistory || [],
                role: (isCurrent || revealAll) ? role : undefined,
                word: (isCurrent || revealAll) ? word : ''
              };
            })
        };
        p.socket.send(JSON.stringify({ type: "SYNC", payload: playerState }));
      }
    });
  }

  function broadcastToRoom(roomId: string, message: { type: string; payload: any }) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.players.forEach((p) => {
      if (p.socket && p.socket.readyState === WebSocket.OPEN) {
        p.socket.send(JSON.stringify(message));
      }
    });
  }
}

startServer();
