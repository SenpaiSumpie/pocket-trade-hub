import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { sets, cards } from '../schema';

const TCGDEX_BASE = 'https://api.tcgdex.net/v2/en';
const DELAY_MS = 500;

/**
 * Map TCGdex rarity strings to our enum values.
 * TCGdex uses descriptive strings; we map to diamond1-4, star1-3, crown.
 */
function mapRarity(tcgdexRarity: string | null | undefined): string | null {
  if (!tcgdexRarity) return null;

  const lower = tcgdexRarity.toLowerCase();

  // Common mappings based on TCGdex rarity field values
  const rarityMap: Record<string, string> = {
    'common': 'diamond1',
    'uncommon': 'diamond2',
    'rare': 'diamond3',
    'double rare': 'diamond4',
    'art rare': 'star1',
    'super art rare': 'star2',
    'special art rare': 'star2',
    'immersive art rare': 'star3',
    'hyper rare': 'star3',
    'crown rare': 'crown',
    // One/Two/Three diamond patterns
    'one diamond': 'diamond1',
    'two diamond': 'diamond2',
    'three diamond': 'diamond3',
    'four diamond': 'diamond4',
    'one star': 'star1',
    'two star': 'star2',
    'three star': 'star3',
  };

  // Try exact match first
  if (rarityMap[lower]) return rarityMap[lower];

  // Try partial matching
  if (lower.includes('crown')) return 'crown';
  if (lower.includes('three star') || lower.includes('3 star')) return 'star3';
  if (lower.includes('two star') || lower.includes('2 star')) return 'star2';
  if (lower.includes('one star') || lower.includes('1 star')) return 'star1';
  if (lower.includes('four diamond') || lower.includes('4 diamond')) return 'diamond4';
  if (lower.includes('three diamond') || lower.includes('3 diamond')) return 'diamond3';
  if (lower.includes('two diamond') || lower.includes('2 diamond')) return 'diamond2';
  if (lower.includes('one diamond') || lower.includes('1 diamond')) return 'diamond1';

  console.warn(`  Unknown rarity "${tcgdexRarity}", defaulting to null`);
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.json();
}

interface TcgdexCard {
  id?: string;
  localId?: string;
  name?: string;
  rarity?: string;
  types?: string[];
  category?: string;
  hp?: number;
  stage?: string;
  image?: string;
  attacks?: Array<{
    name: string;
    damage?: string | number;
    cost?: string[];
    effect?: string;
  }>;
  weaknesses?: Array<{ type: string }>;
  resistances?: Array<{ type: string }>;
  retreat?: number;
  illustrator?: string;
}

interface TcgdexSet {
  id: string;
  name: string;
  serie?: { id: string; name: string };
  releaseDate?: string;
  logo?: string;
  cards?: TcgdexCard[];
}

async function seed() {
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log('[DRY RUN] Seed script validated. Would fetch from TCGdex API and insert cards.');
    console.log('[DRY RUN] Run without --dry-run flag with DATABASE_URL set to actually seed.');
    process.exit(0);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is required.');
    console.error('Set it to your PostgreSQL connection string and try again.');
    process.exit(1);
  }

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    console.log('Fetching TCG Pocket series from TCGdex...');
    let seriesData: any;
    try {
      seriesData = await fetchJson(`${TCGDEX_BASE}/series/tcgp`);
    } catch (err) {
      console.error('ERROR: Could not reach TCGdex API.');
      console.error('Check your internet connection and try again.');
      console.error('API URL:', `${TCGDEX_BASE}/series/tcgp`);
      await sql.end();
      process.exit(1);
    }

    const setList = seriesData.sets || [];
    console.log(`Found ${setList.length} sets in TCG Pocket series.`);

    for (const setInfo of setList) {
      const setId = setInfo.id;

      // Check if set already exists
      const existing = await db
        .select()
        .from(sets)
        .where(eq(sets.id, setId))
        .limit(1);

      if (existing.length > 0) {
        console.log(`Skipping "${setInfo.name}" (${setId}) - already exists`);
        continue;
      }

      console.log(`Fetching set: ${setInfo.name} (${setId})...`);
      await sleep(DELAY_MS);

      let setData: TcgdexSet;
      try {
        setData = await fetchJson(`${TCGDEX_BASE}/sets/${setId}`);
      } catch (err) {
        console.warn(`  Warning: Could not fetch set ${setId}, skipping.`);
        continue;
      }

      const setCards = setData.cards || [];
      if (setCards.length === 0) {
        console.warn(`  Warning: Set ${setId} has no cards, skipping.`);
        continue;
      }

      // Transform and insert within a transaction per set
      await db.transaction(async (tx) => {
        // Insert set
        await tx.insert(sets).values({
          id: setId,
          name: setData.name,
          series: setData.serie?.id || 'tcgp',
          cardCount: setCards.length,
          releaseDate: setData.releaseDate || null,
          imageUrl: setData.logo || null,
        });

        // Transform cards
        const cardValues = setCards.map((card: TcgdexCard) => {
          const localId = card.localId || card.id || '000';
          return {
            id: `${setId}-${localId}`,
            setId,
            localId,
            name: card.name || 'Unknown',
            rarity: mapRarity(card.rarity),
            type: card.types?.[0] || null,
            category: card.category?.toLowerCase() || null,
            hp: card.hp || null,
            stage: card.stage || null,
            imageUrl: card.image
              ? `${card.image}/high.webp`
              : `https://assets.tcgdex.net/en/tcgp/${setId}/${localId}/high.webp`,
            attacks: card.attacks
              ? card.attacks.map((a) => ({
                  name: a.name,
                  damage: a.damage != null ? String(a.damage) : null,
                  energyCost: a.cost || [],
                  description: a.effect || null,
                }))
              : null,
            weakness: card.weaknesses?.[0]?.type || null,
            resistance: card.resistances?.[0]?.type || null,
            retreatCost: card.retreat ?? null,
            illustrator: card.illustrator || null,
            cardNumber: `${localId}/${setCards.length}`,
          };
        });

        // Insert cards in batches of 50
        for (let i = 0; i < cardValues.length; i += 50) {
          const batch = cardValues.slice(i, i + 50);
          await tx.insert(cards).values(batch as any);
        }
      });

      console.log(`  Seeded ${setData.name}: ${setCards.length} cards`);
    }

    console.log('\nSeed complete!');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seed();
