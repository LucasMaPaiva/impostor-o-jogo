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
                impostorId: '',
                hostId: userId,
                messages: [],
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
                active: room.status === 'lobby' || room.status === 'results'
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
            const impostorId = playerIds[Math.floor(Math.random() * playerIds.length)];

            room.status = 'reveal';
            room.wordA = palavra;
            room.wordB = dica;
            room.category = ''; // Not used for hints anymore
            room.impostorId = impostorId;
            room.winner = undefined;
            room.messages = [];
            room.turnIndex = 0;
            room.turnOrder = shuffle(playerIds);
            room.reRoundVotes = 0;

            room.players.forEach((p) => {
              p.role = p.id === impostorId ? 'impostor' : 'normal';
              p.word = p.id === impostorId ? dica : palavra;
              p.clue = '';
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

            player.isReady = true;
            const allReady = Array.from(room.players.values())
              .filter(p => p.active)
              .every(p => p.isReady);
            if (allReady) {
              room.status = 'clues';
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
            const activePlayer = sortedPlayers[room.turnIndex];
            
            if (!activePlayer || activePlayer.id !== currentUserId) {
              console.log(`[CLUE REJECTED] Not player's turn. Expected: ${activePlayer?.name}, Got: ${player.name}`);
              return;
            }

            player.clue = payload.clue;
            room.turnIndex++;
            
            const activePlayers = sortedPlayers.filter(p => p.active);
            const allClues = activePlayers.every(p => !!p.clue);
            if (allClues) {
              room.status = 'voting';
              room.players.forEach(p => p.isReady = false);
            }
            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }

          case "CHAT": {
            console.log(`[CHAT RECEIVED] room:${currentRoomId} user:${currentUserId}`);
            const room = rooms.get(currentRoomId!);
            if (!room) {
              console.warn(`[CHAT IGNORED] Room not found: ${currentRoomId}`);
              return;
            }
            const player = room.players.get(currentUserId!);
            if (!player) {
              console.warn(`[CHAT IGNORED] Player not found: ${currentUserId} in ${currentRoomId}`);
              return;
            }

            console.log(`[CHAT OK] pushing message from ${player.name}`);
            room.messages.push({
              userId: currentUserId!,
              name: player.name,
              text: payload.text
            });
            
            if (room.messages.length > 50) room.messages.shift();
            
            console.log(`[CHAT] ${player.name} em ${room.id}: ${payload.text}`);
            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }

          case "VOTE": {
            const room = rooms.get(currentRoomId!);
            if (!room) return;
            const player = room.players.get(currentUserId!);
            if (!player) return;

            if (player.votedFor) return;
            player.votedFor = payload.targetId;

            if (payload.targetId === "RE_ROUND") {
              room.reRoundVotes = (room.reRoundVotes || 0) + 1;
            } else {
              const target = room.players.get(payload.targetId);
              if (target) target.votes++;
            }

            const activePlayers = Array.from(room.players.values()).filter(p => p.active);
            const allVoted = activePlayers.every(p => p.votedFor);
            if (allVoted) {
              const sorted = activePlayers.sort((a, b) => b.votes - a.votes);
              const topPlayer = sorted[0];
              const reRoundTotal = room.reRoundVotes || 0;

              if (reRoundTotal > topPlayer.votes) {
                // Restart for another round of clues with the same words
                room.status = 'clues';
                room.reRoundVotes = 0;
                room.turnIndex = 0;
                room.players.forEach(p => {
                  p.clue = '';
                  p.votes = 0;
                  p.votedFor = undefined;
                });
              } else {
                room.status = 'results';
                room.winner = topPlayer.id === room.impostorId ? 'normal' : 'impostor';
              }
            }
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
        const state = {
          id: room.id,
          status: room.status,
          // Hide shared words
          category: '', // No longer sending category to anyone
          impostorId: room.status === 'results' ? room.impostorId : '',
          wordA: room.status === 'results' ? room.wordA : '',
          wordB: '', // No longer sending wordB to everyone
          hostId: room.hostId,
          messages: room.messages,
          winner: room.winner,
          turnIndex: room.turnIndex,
          turnOrder: room.turnOrder,
          players: (room.turnOrder || Array.from(room.players.keys()).sort((a,b) => (room.players.get(a)?.joinTime || 0) - (room.players.get(b)?.joinTime || 0)))
            .map(id => room.players.get(id))
            .filter(Boolean)
            .map((player) => {
              const p = player!;
              const { socket, word, role, ...pData } = player;
              const isCurrent = player.id === p.id;
              const revealAll = room.status === 'results';
              
              return {
                ...pData,
                // Only send the player's own word/role unless the game is over
                role: (isCurrent || revealAll) ? role : undefined,
                word: (isCurrent || revealAll) ? word : ''
              };
            })
        };
        p.socket.send(JSON.stringify({ type: "SYNC", payload: state }));
      }
    });
  }
}

startServer();
