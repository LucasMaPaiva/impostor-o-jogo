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
  active: boolean;
  votedFor?: string;
  joinTime: number;
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
  players: Player[];
  turnIndex: number;
  turnOrder?: string[];
  restartVotes?: string[];
  lastEliminatedId?: string;
  eliminatedRole?: 'normal' | 'impostor';
}
