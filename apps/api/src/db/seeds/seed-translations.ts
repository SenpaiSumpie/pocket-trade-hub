import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { cards, cardTranslations } from '../schema';

const TCGDEX_BASE = 'https://api.tcgdex.net/v2';
const DELAY_MS = 500;

// Languages available on TCGdex for TCG Pocket (ja, ko, zh return 404)
const AVAILABLE_LANGUAGES = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;

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
  image?: string;
  attacks?: Array<{
    name: string;
    damage?: string | number;
    cost?: string[];
    effect?: string;
  }>;
}

interface TcgdexSet {
  id: string;
  name: string;
  cards?: TcgdexCard[];
}

async function seedTranslations() {
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log('[DRY RUN] Translation seed script validated.');
    console.log(`[DRY RUN] Would fetch translations for ${AVAILABLE_LANGUAGES.length} languages from TCGdex API.`);
    console.log(`[DRY RUN] Languages: ${AVAILABLE_LANGUAGES.join(', ')}`);
    console.log('[DRY RUN] Run without --dry-run flag with DATABASE_URL set to actually seed.');
    process.exit(0);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is required.');
    console.error('Set it to your PostgreSQL connection string and try again.');
    process.exit(1);
  }

  const sqlClient = postgres(connectionString);
  const db = drizzle(sqlClient);

  try {
    // Load all existing card IDs for validation
    const existingCards = await db.select({ id: cards.id }).from(cards);
    const cardIdSet = new Set(existingCards.map((c) => c.id));
    console.log(`Found ${cardIdSet.size} existing cards in database.\n`);

    let totalInserted = 0;

    for (const lang of AVAILABLE_LANGUAGES) {
      console.log(`\n=== Language: ${lang.toUpperCase()} ===`);

      let seriesData: any;
      try {
        seriesData = await fetchJson(`${TCGDEX_BASE}/${lang}/series/tcgp`);
      } catch (err) {
        console.warn(`  Warning: Could not fetch series for ${lang}, skipping language.`);
        continue;
      }

      const setList = seriesData.sets || [];
      console.log(`  Found ${setList.length} sets.`);
      let langTotal = 0;

      for (const setInfo of setList) {
        const setId = setInfo.id;

        console.log(`  Fetching set: ${setInfo.name} (${setId})...`);
        await sleep(DELAY_MS);

        let setData: TcgdexSet;
        try {
          setData = await fetchJson(`${TCGDEX_BASE}/${lang}/sets/${setId}`);
        } catch (err) {
          console.warn(`    Warning: Could not fetch set ${setId} for ${lang}, skipping.`);
          continue;
        }

        const setCards = setData.cards || [];
        if (setCards.length === 0) {
          console.warn(`    Warning: Set ${setId} has no cards for ${lang}, skipping.`);
          continue;
        }

        // Build translation values, only for cards that exist in our DB
        const translationValues = [];
        let skipped = 0;

        for (const card of setCards) {
          const localId = card.localId || card.id || '000';
          const cardId = `${setId}-${localId}`;

          if (!cardIdSet.has(cardId)) {
            skipped++;
            continue;
          }

          const imageUrl = card.image
            ? `${card.image}/high.webp`
            : `https://assets.tcgdex.net/${lang}/tcgp/${setId}/${localId}/high.webp`;

          const attacks = card.attacks
            ? card.attacks.map((a) => ({
                name: a.name,
                damage: a.damage != null ? String(a.damage) : null,
                energyCost: a.cost || [],
                description: a.effect || null,
              }))
            : null;

          translationValues.push({
            id: `${cardId}-${lang}`,
            cardId,
            language: lang,
            name: card.name || 'Unknown',
            imageUrl,
            attacks,
          });
        }

        if (translationValues.length > 0) {
          // Upsert in batches of 50
          for (let i = 0; i < translationValues.length; i += 50) {
            const batch = translationValues.slice(i, i + 50);
            await db
              .insert(cardTranslations)
              .values(batch as any)
              .onConflictDoUpdate({
                target: [cardTranslations.cardId, cardTranslations.language],
                set: {
                  name: sql`excluded.name`,
                  imageUrl: sql`excluded.image_url`,
                  attacks: sql`excluded.attacks`,
                },
              });
          }
        }

        const msg = skipped > 0 ? ` (${skipped} skipped - not in cards table)` : '';
        console.log(`    Seeded ${translationValues.length} translations${msg}`);
        langTotal += translationValues.length;
      }

      console.log(`  Total for ${lang.toUpperCase()}: ${langTotal} translations`);
      totalInserted += langTotal;
    }

    console.log(`\n=== Seed complete! Total translations: ${totalInserted} ===`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await sqlClient.end();
  }
}

seedTranslations();
