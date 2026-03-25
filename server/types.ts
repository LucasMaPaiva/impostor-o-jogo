/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameStatus = 'lobby' | 'reveal' | 'clues' | 'voting' | 'results' | 'reveal_elimination';

export interface Player {
  id: string;
  name: string;
  role: 'normal' | 'impostor';
  word: string;
  clue: string;
  votes: number;
  isReady: boolean;
  isAlive: boolean;
  active: boolean;
  votedFor?: string;
  joinTime: number;
  socket?: any; // Use any for WebSocket to avoid circular dependency or complex typing for now
}

export interface Room {
  id: string;
  status: GameStatus;
  wordA: string;
  wordB: string;
  category: string;
  impostorIds: string[];
  impostorCount: number;
  hostId: string;
  winner?: 'normal' | 'impostor';
  players: Map<string, Player>;
  reRoundVotes?: number;
  turnIndex: number;
  turnOrder?: string[];
  restartVotes?: string[];
  kickVotes?: Record<string, string[]>; // targetId -> array of userIds who voted to kick
  lastEliminatedId?: string;
  eliminatedRole?: string;
}

export interface WordData {
  palavra: string;
  dica: string;
}
