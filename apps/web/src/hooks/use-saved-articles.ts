import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import type { SavedArticle, DeathArticle, NewsArticle } from "@workspace/shared-api-zod";
import { reportClientError } from "@/lib/report-error";

export function useSavedArticles() {
  const { isLoggedIn } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery<SavedArticle[]>({
    queryKey: ["/api/saved-articles"],
    enabled: isLoggedIn,
    staleTime: 30_000,
  });

  const favourites: SavedArticle[] = isLoggedIn ? (data ?? []) : [];

  const isFavourite = useCallback(
    (link: string) => favourites.some(f => f.link === link),
    [favourites]
  );

  const toggleFavourite = useCallback(async (article: DeathArticle | NewsArticle) => {
    if (!isLoggedIn) return;
    const exists = favourites.some(f => f.link === article.link);
    try {
      if (exists) {
        await apiRequest("DELETE", "/api/saved-articles", { link: article.link });
      } else {
        await apiRequest("POST", "/api/saved-articles", {
          title: article.title ?? "",
          description: article.description ?? "",
          link: article.link,
          pubDate: article.pubDate ?? "",
          source: article.source ?? "",
          deathSubject: "deathSubject" in article ? article.deathSubject ?? null : null,
        });
      }
      qc.invalidateQueries({ queryKey: ["/api/saved-articles"] });
    } catch (error) {
      reportClientError("Failed to toggle saved article", error);
    }
  }, [isLoggedIn, favourites, qc]);

  const removeFavourite = useCallback(async (link: string) => {
    if (!isLoggedIn) return;
    try {
      await apiRequest("DELETE", "/api/saved-articles", { link });
      qc.invalidateQueries({ queryKey: ["/api/saved-articles"] });
    } catch (error) {
      reportClientError("Failed to remove saved article", error);
    }
  }, [isLoggedIn, qc]);

  return { favourites, isFavourite, toggleFavourite, removeFavourite };
}
