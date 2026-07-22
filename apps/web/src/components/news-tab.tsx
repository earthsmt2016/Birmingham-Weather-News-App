import type { NewsArticle, NewsResponse, SavedArticle } from "@workspace/shared-api-zod";
import { AlertCircle, Heart, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NewsFeed, SavedFeed } from "@/components/news-feed";
import { SUB_TAB_LATEST, SUB_TAB_SAVED } from "@/lib/constants";
import { EMPTY_STATE, MUTED_LABEL } from "@/lib/styles";

type NewsTabValue = typeof SUB_TAB_LATEST | typeof SUB_TAB_SAVED;

interface NewsTabProps {
  activeTab: NewsTabValue;
  news?: NewsResponse;
  savedArticles: SavedArticle[];
  isLoggedIn: boolean;
  isLoading: boolean;
  geolocating: boolean;
  hasError: boolean;
  isFavourite: (link: string) => boolean;
  onTabChange: (tab: NewsTabValue) => void;
  onToggleFavourite: (article: NewsArticle) => void;
  onRemoveFavourite: (link: string) => void;
  onRefresh: () => void;
}

const SUB_TAB_CLASSES = {
  base: "text-sm font-medium pb-1 border-b-2 transition-colors",
  savedBase: "flex items-center gap-1.5 text-sm font-medium pb-1 border-b-2 transition-colors",
  active: "border-foreground text-foreground",
  inactive: "border-transparent text-muted-foreground hover:text-foreground",
} as const;

const NEWS_TAB_CLASSES = {
  header: "flex items-center justify-between gap-3 mb-4 flex-wrap",
  group: "flex items-center gap-3",
  countBadge: "text-[10px] h-4 px-1.5 min-w-4",
  iconSm: "w-3.5 h-3.5",
  tabIcon: "w-4 h-4 mr-1.5",
  errorIcon: "w-10 h-10 text-destructive",
  title: "font-medium",
  body: "text-sm text-muted-foreground",
  regionLabel: `${MUTED_LABEL} hidden sm:block`,
} as const;

export function NewsTab({
  activeTab,
  news,
  savedArticles,
  isLoggedIn,
  isLoading,
  geolocating,
  hasError,
  isFavourite,
  onTabChange,
  onToggleFavourite,
  onRemoveFavourite,
  onRefresh,
}: NewsTabProps) {
  return (
    <>
      <div className={NEWS_TAB_CLASSES.header}>
        <div className={NEWS_TAB_CLASSES.group}>
          <button
            className={`${SUB_TAB_CLASSES.base} ${activeTab === SUB_TAB_LATEST ? SUB_TAB_CLASSES.active : SUB_TAB_CLASSES.inactive}`}
            onClick={() => onTabChange(SUB_TAB_LATEST)}
            data-testid="tab-news-latest"
          >
            Latest
          </button>
          {isLoggedIn && (
            <button
              className={`${SUB_TAB_CLASSES.savedBase} ${activeTab === SUB_TAB_SAVED ? SUB_TAB_CLASSES.active : SUB_TAB_CLASSES.inactive}`}
              onClick={() => onTabChange(SUB_TAB_SAVED)}
              data-testid="tab-news-saved"
            >
              <Heart className={NEWS_TAB_CLASSES.iconSm} />
              Saved
              {savedArticles.length > 0 && (
                <Badge variant="secondary" className={NEWS_TAB_CLASSES.countBadge}>
                  {savedArticles.length}
                </Badge>
              )}
            </button>
          )}
        </div>
        {activeTab === SUB_TAB_LATEST && news && (
          <span className={MUTED_LABEL}>
            Updated {new Date(news.lastUpdated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        {activeTab === SUB_TAB_LATEST && news?.regionLabel && (
          <span className={NEWS_TAB_CLASSES.regionLabel}>{news.regionLabel}</span>
        )}
      </div>

      {activeTab === SUB_TAB_LATEST ? (
        <>
          {hasError && (
            <Card className={EMPTY_STATE}>
              <AlertCircle className={NEWS_TAB_CLASSES.errorIcon} />
              <h3 className={NEWS_TAB_CLASSES.title}>Unable to load news</h3>
              <p className={NEWS_TAB_CLASSES.body}>Please try again in a moment.</p>
              <Button variant="outline" onClick={onRefresh} data-testid="button-retry-news">
                <RefreshCw className={NEWS_TAB_CLASSES.tabIcon} />
                Retry
              </Button>
            </Card>
          )}
          <NewsFeed
            articles={news?.articles || []}
            isLoading={isLoading || geolocating}
            isFavourite={isLoggedIn ? isFavourite : undefined}
            onToggleFavourite={isLoggedIn ? onToggleFavourite : undefined}
          />
        </>
      ) : (
        <SavedFeed
          articles={savedArticles}
          onRemove={onRemoveFavourite}
          onClearAll={() => savedArticles.forEach((article) => onRemoveFavourite(article.link))}
        />
      )}
    </>
  );
}
