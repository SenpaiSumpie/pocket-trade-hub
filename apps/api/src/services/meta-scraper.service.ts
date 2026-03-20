import * as cheerio from 'cheerio';
import axios from 'axios';

export interface ScrapedDeck {
  name: string;
  playCount: number | null;
  usageRate: number | null;
  winRate: number | null;
  matchRecord: string | null;
}

const LIMITLESS_URL = 'https://play.limitlesstcg.com/decks?game=pocket';
const USER_AGENT = 'PocketTradeHub/1.0';
const RETRY_DELAY_MS = 3000;

async function fetchWithRetry(url: string, attempts: number = 2): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 15000,
      });
      return data;
    } catch (err) {
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, i)));
      } else {
        throw err;
      }
    }
  }
  throw new Error('Unreachable');
}

function parseBasisPoints(text: string): number | null {
  const cleaned = text.replace('%', '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}

function parseIntSafe(text: string): number | null {
  const num = parseInt(text.replace(/,/g, '').trim(), 10);
  return isNaN(num) ? null : num;
}

export async function scrapeDeckMeta(): Promise<ScrapedDeck[]> {
  try {
    const html = await fetchWithRetry(LIMITLESS_URL);
    const $ = cheerio.load(html);

    const decks: ScrapedDeck[] = [];

    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 3) return;

      // Limitless TCG table structure may vary; extract what's available
      // Typical columns: rank, deck name, play count, usage %, win %, match record
      const name = $(cells[1]).text().trim();
      if (!name) return;

      const playCount = parseIntSafe($(cells[2]).text());
      const usageRate = parseBasisPoints($(cells[3]).text());
      const winRate = parseBasisPoints($(cells[5]).text());
      const matchRecord = $(cells[4]).text().trim() || null;

      decks.push({
        name,
        playCount,
        usageRate,
        winRate,
        matchRecord,
      });
    });

    if (decks.length === 0) {
      console.warn('[meta-scraper] Scrape returned 0 decks - HTML structure may have changed');
    }

    return decks;
  } catch (err) {
    console.error('[meta-scraper] Failed to scrape Limitless TCG:', err);
    return [];
  }
}
