import type { DeathResponse, NewsArticle, NewsResponse } from "@workspace/shared-api-zod";
import { DEFAULT_COUNTRY, DEFAULT_LOCATION_NAME, DEFAULT_REGION } from "../lib/default-location";
import { errMsg } from "../lib/error-utils";
import { fetchCelebrityDeathArticles, getDeathsCache, setDeathsCache } from "../lib/death-feeds";
import { logger } from "../lib/logger";
import { getNewsFeeds } from "../lib/news-feeds";

const NEWS_CACHE_TTL = 10 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const newsCache = new Map<string, CacheEntry<NewsResponse>>();

interface RssItem {
  title?: string;
  contentSnippet?: string;
  content?: string;
  link?: string;
  pubDate?: string;
}

interface RssParser {
  parseURL(url: string): Promise<{ items?: RssItem[] }>;
}

export interface NewsRequest {
  locationName?: string;
  region?: string;
  country?: string;
  forceRefresh?: boolean;
}

export async function getLocalNews({
  locationName = DEFAULT_LOCATION_NAME,
  region = DEFAULT_REGION,
  country = DEFAULT_COUNTRY,
  forceRefresh = false,
}: NewsRequest): Promise<NewsResponse> {
  const cacheKey = `${locationName.toLowerCase()}|${region.toLowerCase()}|${country.toLowerCase()}`;
  const cached = newsCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < NEWS_CACHE_TTL) {
    return cached.data;
  }

  const { feeds, label } = getNewsFeeds(locationName, region, country);
  const Parser = (await import("rss-parser")).default;
  const parser: RssParser = new Parser({ timeout: 10000, headers: { "User-Agent": "BirminghamNewsApp/1.0" } });
  const articles: NewsArticle[] = [];

  const feedResults = await Promise.allSettled(
    feeds.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return (parsed.items || []).slice(0, 15).map((item) => ({
          title: item.title || "Untitled",
          description: item.contentSnippet || item.content || "",
          link: item.link || "",
          pubDate: item.pubDate || new Date().toISOString(),
          source: feed.source,
        }));
      } catch (error: unknown) {
        logger.warn(`Feed error (${feed.source}): ${errMsg(error)}`);
        return [];
      }
    }),
  );

  for (const result of feedResults) {
    if (result.status === "fulfilled") articles.push(...result.value);
  }

  if (articles.length === 0) {
    const fallback = await fetchFallbackNews(parser, locationName);
    articles.push(...fallback);
  }

  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  const response: NewsResponse = {
    articles: articles.slice(0, 30),
    lastUpdated: new Date().toISOString(),
    regionLabel: label,
  };

  if (articles.length > 0) newsCache.set(cacheKey, { data: response, timestamp: Date.now() });
  return response;
}

export async function getCelebrityDeaths(forceRefresh = false): Promise<DeathResponse> {
  const cached = getDeathsCache();
  if (!forceRefresh && cached) {
    return { articles: cached.articles, lastUpdated: cached.lastUpdated };
  }

  const articles = await fetchCelebrityDeathArticles();
  if (articles.length > 0) setDeathsCache(articles);
  const refreshed = getDeathsCache();

  return {
    articles,
    lastUpdated: refreshed?.lastUpdated ?? new Date().toISOString(),
  };
}

async function fetchFallbackNews(parser: RssParser, locationName: string): Promise<NewsArticle[]> {
  try {
    const fallbackQuery = encodeURIComponent(locationName);
    const fallbackUrl = `https://news.google.com/rss/search?q=${fallbackQuery}&hl=en&gl=US&ceid=US:en`;
    const parsed = await parser.parseURL(fallbackUrl);
    return (parsed.items || []).slice(0, 15).map((item) => ({
      title: item.title || "Untitled",
      description: item.contentSnippet || item.content || "",
      link: item.link || "",
      pubDate: item.pubDate || new Date().toISOString(),
      source: "Google News",
    }));
  } catch (error: unknown) {
    logger.warn(`Fallback news feed failed: ${errMsg(error)}`);
    return [];
  }
}
