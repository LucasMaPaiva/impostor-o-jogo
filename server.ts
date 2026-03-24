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

// --- Game State ---
interface Player {
  id: string;
  name: string;
  role: 'normal' | 'impostor';
  word: string;
  clue: string;
  votes: number;
  isAlive: boolean;
  isReady: boolean;
  votedFor?: string;
  joinTime: number;
  socket?: WebSocket;
}

interface Room {
  id: string;
  status: 'lobby' | 'reveal' | 'clues' | 'voting' | 'results';
  wordA: string;
  wordB: string;
  category: string;
  impostorId: string;
  hostId: string;
  messages: { userId: string, name: string, text: string }[];
  winner?: 'normal' | 'impostor';
  players: Map<string, Player>;
}

const rooms = new Map<string, Room>();

// --- Word Loading ---
interface WordData {
  palavra: string;
  dica: string;
}

const CATEGORIES = new Map<string, string[]>();

try {
  const jsonPath = path.join(__dirname, "palavras_dicas_1000(1).json");
  const rawData = readFileSync(jsonPath, "utf-8");
  const data: WordData[] = JSON.parse(rawData);
  
  data.forEach(item => {
    if (!CATEGORIES.has(item.dica)) {
      CATEGORIES.set(item.dica, []);
    }
    CATEGORIES.get(item.dica)!.push(item.palavra);
  });
  
  console.log(`Loaded ${data.length} words into ${CATEGORIES.size} categories.`);
} catch (err) {
  console.error("Error loading words JSON. Using hardcoded survival list.", err);
  CATEGORIES.set("Geral", ["Maçã", "Pêra", "Banana", "Uva", "Melancia", "Abacaxi"]);
}

function getRandomPair(): [string, string, string] {
  // Filter categories that have at least 2 words
  const validHints = Array.from(CATEGORIES.keys()).filter(h => CATEGORIES.get(h)!.length >= 2);
  
  if (validHints.length === 0) {
    return ["Início", "Fim", "Sistema"];
  }

  const randomHint = validHints[Math.floor(Math.random() * validHints.length)];
  const words = CATEGORIES.get(randomHint)!;
  
  // Pick two distinct random words
  const shuffled = [...words].sort(() => 0.5 - Math.random());
  return [shuffled[0], shuffled[1], randomHint];
}

const roomsCollection = () => db?.collection("rooms");

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
                players: new Map()
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
                socket: ws
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

            const [wordA, wordB, category] = getRandomPair();
            const playerIds = Array.from(room.players.keys());
            const impostorId = playerIds[Math.floor(Math.random() * playerIds.length)];

            room.status = 'reveal';
            room.wordA = wordA;
            room.wordB = wordB;
            room.category = category;
            room.impostorId = impostorId;
            room.winner = undefined;
            room.messages = [];

            room.players.forEach((p) => {
              p.role = p.id === impostorId ? 'impostor' : 'normal';
              p.word = p.id === impostorId ? wordB : wordA;
              p.clue = '';
              p.votes = 0;
              p.votedFor = undefined;
              p.isReady = false;
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
            const allReady = Array.from(room.players.values()).every(p => p.isReady);
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

            const sortedPlayers = Array.from(room.players.values()).sort((a, b) => a.joinTime - b.joinTime);
            const activePlayer = sortedPlayers.find(p => !p.clue);
            
            if (activePlayer?.id !== currentUserId) return;

            player.clue = payload.clue;
            
            const allClues = sortedPlayers.every(p => p.clue || p.id === currentUserId);
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
            const target = room.players.get(payload.targetId);
            if (target) target.votes++;

            const allVoted = Array.from(room.players.values()).every(p => p.votedFor);
            if (allVoted) {
              const sorted = Array.from(room.players.values()).sort((a, b) => b.votes - a.votes);
              const mostVoted = sorted[0];
              room.status = 'results';
              room.winner = mostVoted.id === room.impostorId ? 'normal' : 'impostor';
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
    const state = {
      id: room.id,
      status: room.status,
      wordA: room.wordA,
      wordB: room.wordB,
      category: room.category,
      impostorId: room.impostorId,
      hostId: room.hostId,
      messages: room.messages,
      winner: room.winner,
      players: Array.from(room.players.values())
        .sort((a, b) => a.joinTime - b.joinTime)
        .map(({ socket, ...p }) => p)
    };

    room.players.forEach((p) => {
      if (p.socket && p.socket.readyState === WebSocket.OPEN) {
        p.socket.send(JSON.stringify({ type: "SYNC", payload: state }));
      }
    });
  }
}

startServer();
