/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import path from 'path';
import { WordData } from './types.js';

const ALL_WORDS: WordData[] = [];

export function loadWords() {
  try {
    const jsonPath = path.join(process.cwd(), "palavras_dicas_1000(1).json");
    const rawData = readFileSync(jsonPath, "utf-8");
    const data: WordData[] = JSON.parse(rawData);
    
    ALL_WORDS.length = 0; // Clear the array
    ALL_WORDS.push(...data);
    
    console.log(`Loaded ${ALL_WORDS.length} words.`);
  } catch (err) {
    console.error("Error loading words JSON. Using hardcoded survival list.", err);
    ALL_WORDS.push({ palavra: "Maçã", dica: "Fruta" });
  }
}

export function getRandomWord(): WordData {
  if (ALL_WORDS.length === 0) {
    return { palavra: "Início", dica: "Sistema" };
  }
  return ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
}
