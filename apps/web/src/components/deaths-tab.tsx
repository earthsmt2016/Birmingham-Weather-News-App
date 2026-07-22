import type { DeathArticle, DeathResponse, SavedArticle } from "@workspace/shared-api-zod";
import { AlertCircle, Heart, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeathCard } from "@/components/death-card";
import { SUB_TAB_LATEST, SUB_TAB_SAVED } from "@/lib/constants";
import { EMPTY_STATE, MUTED_LABEL, TEXT_SM_MUTED } from "@/lib/styles";

type DeathsTabValue = typeof SUB_TAB_LATEST | typeof SUB_TAB_SAVED;

interface DeathsTabProps {
  activeTab: DeathsTabValue;
  data?: DeathResponse;
  savedArticles: SavedArticle[];
  isLoggedIn: boolean;
  isLoading: boolean;
  hasError: boolean;
  isFavourite: (link: string) => boolean;
  onTabChange: (tab: DeathsTabValue) => void;
  onToggleFavourite: (article: DeathArticle) => void;
  onRemoveFavourite: (link: string) => void;
}

const SUB_TAB_CLASSES = {
  base: "text-sm font-medium pb-1 border-b-2 transition-colors",
  savedBase: "flex items-center gap-1.5 text-sm font-medium pb-1 border-b-2 transition-colors",
  active: "border-foreground text-foreground",
  inactive: "border-transparent text-muted-foreground hover:text-foreground",
} as const;

const DEATHS_TAB_CLASSES = {
  header: "flex items-center justify-between gap-3 mb-4 flex-wrap",
  group: "flex items-center gap-3",
  countBadge: "text-[10px] h-4 px-1.5 min-w-4",
  iconSm: "w-3.5 h-3.5",
  list: "flex flex-col gap-3",
  content: "flex flex-col gap-4",
  skeletonInner: "flex flex-col gap-2",
  skeletonLine1: "h-4 bg-muted animate-pulse rounded w-3/4",
  skeletonLine2: "h-3 bg-muted animate-pulse rounded w-full",
  skeletonLine3: "h-3 bg-muted animate-pulse rounded w-1/2",
  emptyIcon: "w-10 h-10 text-muted-foreground",
  title: "font-medium",
  savedTitle: "text-base font-medium text-muted-foreground",
  body: TEXT_SM_MUTED,
  bodySm: `${TEXT_SM_MUTED} max-w-xs`,
  errorIcon: "w-10 h-10 text-destructive",
  savedHeader: "flex items-center justify-between",
  savedCount: TEXT_SM_MUTED,
  clearBtn: "text-muted-foreground hover:text-destructive",
  trashIcon: "w-3.5 h-3.5 mr-1",
} as const;

export function DeathsTab({
  activeTab,
  data,
  savedArticles,
  isLoggedIn,
  isLoading,
  hasError,
  isFavourite,
  onTabChange,
  onToggleFavourite,
  onRemoveFavourite,
}: DeathsTabProps) {
  return (
    <>
      <div className={DEATHS_TAB_CLASSES.header}>
        <div className={DEATHS_TAB_CLASSES.group}>
          <button
            className={`${SUB_TAB_CLASSES.base} ${activeTab === SUB_TAB_LATEST ? SUB_TAB_CLASSES.active : SUB_TAB_CLASSES.inactive}`}
            onClick={() => onTabChange(SUB_TAB_LATEST)}
            data-testid="tab-deaths-latest"
          >
            Latest
          </button>
          {isLoggedIn && (
            <button
              className={`${SUB_TAB_CLASSES.savedBase} ${activeTab === SUB_TAB_SAVED ? SUB_TAB_CLASSES.active : SUB_TAB_CLASSES.inactive}`}
              onClick={() => onTabChange(SUB_TAB_SAVED)}
              data-testid="tab-deaths-saved"
            >
              <Heart className={DEATHS_TAB_CLASSES.iconSm} />
              Saved
              {savedArticles.length > 0 && (
                <Badge variant="secondary" className={DEATHS_TAB_CLASSES.countBadge}>
                  {savedArticles.length}
                </Badge>
              )}
            </button>
          )}
        </div>
        {activeTab === SUB_TAB_LATEST && data && (
          <span className={MUTED_LABEL}>
            Updated {new Date(data.lastUpdated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {activeTab === SUB_TAB_LATEST ? (
        <div className={DEATHS_TAB_CLASSES.content}>
          {hasError && (
            <Card className={EMPTY_STATE}>
              <AlertCircle className={DEATHS_TAB_CLASSES.errorIcon} />
              <h3 className={DEATHS_TAB_CLASSES.title}>Unable to load celebrity deaths</h3>
              <p className={DEATHS_TAB_CLASSES.body}>Please try again in a moment.</p>
            </Card>
          )}
          {isLoading && <DeathSkeleton />}
          {!isLoading && !hasError && (!data?.articles || data.articles.length === 0) && (
            <Card className={EMPTY_STATE}>
              <Star className={DEATHS_TAB_CLASSES.emptyIcon} />
              <h3 className={DEATHS_TAB_CLASSES.title}>No recent celebrity deaths</h3>
              <p className={DEATHS_TAB_CLASSES.body}>No notable celebrity deaths reported in the last 3 days.</p>
            </Card>
          )}
          {!isLoading && data?.articles && data.articles.length > 0 && (
            <div className={DEATHS_TAB_CLASSES.list}>
              {data.articles.map((article, index) => (
                <DeathCard
                  key={article.link || index}
                  article={article}
                  index={index}
                  isFavourite={isLoggedIn ? isFavourite : undefined}
                  onToggleFavourite={isLoggedIn ? onToggleFavourite : undefined}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <SavedDeaths
          articles={savedArticles}
          isFavourite={isFavourite}
          onToggleFavourite={onToggleFavourite}
          onRemoveFavourite={onRemoveFavourite}
        />
      )}
    </>
  );
}

function DeathSkeleton() {
  return (
    <div className={DEATHS_TAB_CLASSES.list}>
      {[1, 2, 3, 4].map((item) => (
        <Card key={item} className="p-4">
          <div className={DEATHS_TAB_CLASSES.skeletonInner}>
            <div className={DEATHS_TAB_CLASSES.skeletonLine1} />
            <div className={DEATHS_TAB_CLASSES.skeletonLine2} />
            <div className={DEATHS_TAB_CLASSES.skeletonLine3} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function SavedDeaths({
  articles,
  isFavourite,
  onToggleFavourite,
  onRemoveFavourite,
}: {
  articles: SavedArticle[];
  isFavourite: (link: string) => boolean;
  onToggleFavourite: (article: DeathArticle) => void;
  onRemoveFavourite: (link: string) => void;
}) {
  if (articles.length === 0) {
    return (
      <Card className={EMPTY_STATE}>
        <Heart className={DEATHS_TAB_CLASSES.emptyIcon} />
        <p className={DEATHS_TAB_CLASSES.savedTitle}>No saved articles yet</p>
        <p className={DEATHS_TAB_CLASSES.bodySm}>
          Tap the heart icon on any celebrity death article to save it here.
        </p>
      </Card>
    );
  }

  return (
    <div className={DEATHS_TAB_CLASSES.list}>
      <div className={DEATHS_TAB_CLASSES.savedHeader}>
        <p className={DEATHS_TAB_CLASSES.savedCount}>
          {articles.length} saved {articles.length === 1 ? "article" : "articles"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className={DEATHS_TAB_CLASSES.clearBtn}
          onClick={() => articles.forEach((article) => onRemoveFavourite(article.link))}
          data-testid="button-clear-all-death-saved"
        >
          <Trash2 className={DEATHS_TAB_CLASSES.trashIcon} />
          Clear all
        </Button>
      </div>
      {articles.map((article, index) => (
        <DeathCard
          key={article.link || index}
          article={article}
          index={index}
          isFavourite={isFavourite}
          onToggleFavourite={onToggleFavourite}
          savedAt={article.savedAt}
          onRemove={onRemoveFavourite}
        />
      ))}
    </div>
  );
}
