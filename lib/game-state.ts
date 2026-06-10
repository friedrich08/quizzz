import { Redis } from '@upstash/redis';
import { GameState } from '../types/game';

// On nettoie l'URL pour enlever les éventuels "/" à la fin qui font planter la connexion
const rawUrl = process.env.UPSTASH_REDIS_REST_URL;
const cleanUrl = rawUrl ? rawUrl.replace(/\/$/, "") : "";

const redis = (cleanUrl && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: cleanUrl,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const localGames = new Map<string, GameState>();

export async function getGame(code: string): Promise<GameState | undefined> {
  if (redis) {
    try {
      console.log(`[DB] Recherche du jeu game:${code}`);
      const data = await redis.get<GameState>(`game:${code}`);
      if (!data) console.warn(`[DB] Jeu game:${code} non trouvé dans Redis`);
      return data || undefined;
    } catch (err) {
      console.error("[DB ERROR] Échec lecture Redis:", err);
      return undefined;
    }
  }
  console.log(`[LOCAL] Recherche du jeu ${code} en mémoire`);
  return localGames.get(code);
}

export async function setGame(code: string, state: GameState): Promise<void> {
  if (redis) {
    try {
      console.log(`[DB] Sauvegarde du jeu game:${code}`);
      await redis.set(`game:${code}`, state, { ex: 7200 });
    } catch (err) {
      console.error("[DB ERROR] Échec écriture Redis:", err);
    }
  } else {
    console.log(`[LOCAL] Sauvegarde du jeu ${code} en mémoire`);
    localGames.set(code, state);
  }
}

export async function deleteGame(code: string): Promise<void> {
  if (redis) {
    await redis.del(`game:${code}`);
  } else {
    localGames.delete(code);
  }
}
