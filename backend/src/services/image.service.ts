import { env } from '../config/env';
import { logger } from '../config/logger';

interface UnsplashResult {
  results: { urls: { regular: string; small: string }; alt_description: string | null }[];
}

const cache = new Map<string, string | null>();

/**
 * Fetches a relevant stock photo URL for a given query. Returns null (not a fake image)
 * if Unsplash isn't configured or no result is found - callers should render a graceful
 * gradient placeholder in that case rather than a broken image.
 */
export async function fetchImageForQuery(query: string): Promise<string | null> {
  if (!env.UNSPLASH_ACCESS_KEY || !query) return null;

  if (cache.has(query)) return cache.get(query) ?? null;

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query,
    )}&per_page=1&orientation=landscape`;

    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` },
    });

    if (!res.ok) {
      logger.warn(`Unsplash API error ${res.status} for query "${query}"`);
      cache.set(query, null);
      return null;
    }

    const data = (await res.json()) as UnsplashResult;
    const imageUrl = data.results?.[0]?.urls?.regular ?? null;
    cache.set(query, imageUrl);
    return imageUrl;
  } catch (err) {
    logger.warn(`Unsplash fetch failed for "${query}": ${(err as Error).message}`);
    return null;
  }
}

export async function fetchImagesForQueries(queries: string[]): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  await Promise.all(
    queries.map(async (q) => {
      results.set(q, await fetchImageForQuery(q));
    }),
  );
  return results;
}
