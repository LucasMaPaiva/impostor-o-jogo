import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { MongoClient, Db } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/impostor";

let db: Db | null = null;

async function connectToMongo() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB, using in-memory fallback", err);
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
  socket?: WebSocket;
}

interface Room {
  id: string;
  status: 'lobby' | 'reveal' | 'clues' | 'voting' | 'results';
  wordA: string;
  wordB: string;
  impostorId: string;
  hostId: string;
  winner?: 'normal' | 'impostor';
  players: Map<string, Player>;
}

const rooms = new Map<string, Room>();

const WORD_PAIRS = [
  ["Maçã", "Pêra"], ["Café", "Chá"], ["Cachorro", "Lobo"], ["Avião", "Helicóptero"],
  ["Praia", "Piscina"], ["Livro", "Revista"], ["Futebol", "Basquete"], ["Pizza", "Hambúrguer"],
  ["Inverno", "Verão"], ["Cinema", "Teatro"], ["Violão", "Guitarra"], ["Gato", "Tigre"],
  ["Ouro", "Prata"], ["Sol", "Lua"], ["Carro", "Moto"], ["Escola", "Faculdade"],
  ["Médico", "Enfermeiro"], ["Padaria", "Supermercado"], ["Cerveja", "Vinho"], ["Chocolate", "Morango"]
];

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
            if (!room) {
              room = {
                id: roomId,
                status: 'lobby',
                wordA: '',
                wordB: '',
                impostorId: '',
                hostId: userId,
                players: new Map()
              };
              rooms.set(roomId, room);
            }

            const player: Player = {
              id: userId,
              name,
              role: 'normal',
              word: '',
              clue: '',
              votes: 0,
              isAlive: true,
              isReady: false,
              socket: ws
            };
            room.players.set(userId, player);
            await saveRoomToDb(room);
            broadcastRoom(room);
            break;
          }

          case "START_GAME": {
            const room = rooms.get(currentRoomId!);
            if (!room || room.hostId !== currentUserId) return;

            const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
            const playerIds = Array.from(room.players.keys());
            const impostorId = playerIds[Math.floor(Math.random() * playerIds.length)];

            room.status = 'reveal';
            room.wordA = pair[0];
            room.wordB = pair[1];
            room.impostorId = impostorId;
            room.winner = undefined;

            room.players.forEach((p) => {
              p.role = p.id === impostorId ? 'impostor' : 'normal';
              p.word = p.id === impostorId ? pair[1] : pair[0];
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

            player.clue = payload.clue;
            player.isReady = true;
            const allClues = Array.from(room.players.values()).every(p => p.clue);
            if (allClues) {
              room.status = 'voting';
              room.players.forEach(p => p.isReady = false);
            }
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
      impostorId: room.impostorId,
      hostId: room.hostId,
      winner: room.winner,
      players: Array.from(room.players.values()).map(({ socket, ...p }) => p)
    };

    room.players.forEach((p) => {
      if (p.socket && p.socket.readyState === WebSocket.OPEN) {
        p.socket.send(JSON.stringify({ type: "SYNC", payload: state }));
      }
    });
  }
}

startServer();
