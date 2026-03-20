import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { deckMeta } from '../db/schema';
import type { ScrapedDeck } from './meta-scraper.service';

type Db = any;

export async function upsertDeckMeta(db: Db, decks: ScrapedDeck[]): Promise<void> {
  const now = new Date();

  for (const deck of decks) {
    // Check if deck already exists by name
    const existing = await db
      .select({ id: deckMeta.id })
      .from(deckMeta)
      .where(eq(deckMeta.name, deck.name))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(deckMeta)
        .set({
          winRate: deck.winRate,
          usageRate: deck.usageRate,
          playCount: deck.playCount,
          matchRecord: deck.matchRecord,
          scrapedAt: now,
          updatedAt: now,
        })
        .where(eq(deckMeta.id, existing[0].id));
    } else {
      await db.insert(deckMeta).values({
        id: randomUUID(),
        name: deck.name,
        winRate: deck.winRate,
        usageRate: deck.usageRate,
        playCount: deck.playCount,
        matchRecord: deck.matchRecord,
        cards: null,
        matchups: null,
        tournamentResults: null,
        scrapedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

export async function getDeckMeta(db: Db, isPremium: boolean) {
  const decks = await db
    .select()
    .from(deckMeta)
    .orderBy(desc(deckMeta.winRate));

  return decks.map((deck: any) => {
    const base = {
      id: deck.id,
      name: deck.name,
      winRate: deck.winRate,
      usageRate: deck.usageRate,
      playCount: deck.playCount,
      matchRecord: deck.matchRecord,
      // Free users get top 3 cards only
      cards: isPremium
        ? deck.cards
        : Array.isArray(deck.cards)
          ? deck.cards.slice(0, 3)
          : deck.cards,
      scrapedAt: deck.scrapedAt?.toISOString() ?? null,
    };

    if (isPremium) {
      return {
        ...base,
        matchups: deck.matchups,
        tournamentResults: deck.tournamentResults,
      };
    }

    return base;
  });
}

export async function getDeckDetail(db: Db, deckId: string, isPremium: boolean) {
  const rows = await db
    .select()
    .from(deckMeta)
    .where(eq(deckMeta.id, deckId))
    .limit(1);

  if (rows.length === 0) return null;

  const deck = rows[0];

  const base = {
    id: deck.id,
    name: deck.name,
    winRate: deck.winRate,
    usageRate: deck.usageRate,
    playCount: deck.playCount,
    matchRecord: deck.matchRecord,
    cards: isPremium
      ? deck.cards
      : Array.isArray(deck.cards)
        ? deck.cards.slice(0, 3)
        : deck.cards,
    scrapedAt: deck.scrapedAt?.toISOString() ?? null,
  };

  if (isPremium) {
    return {
      ...base,
      matchups: deck.matchups,
      tournamentResults: deck.tournamentResults,
    };
  }

  return base;
}

export async function getScrapedAt(db: Db): Promise<string | null> {
  const rows = await db
    .select({ scrapedAt: deckMeta.scrapedAt })
    .from(deckMeta)
    .orderBy(desc(deckMeta.scrapedAt))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0].scrapedAt?.toISOString() ?? null;
}
