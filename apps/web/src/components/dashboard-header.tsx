import type { GeocodeResult } from "@workspace/shared-api-zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocationSearch } from "@/components/location-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { MUTED_LABEL } from "@/lib/styles";
import { CloudSun, Clock, Lock, LogOut, Map, MapPin, Navigation, RefreshCw, Share2 } from "lucide-react";
import type { LocationState } from "@/hooks/use-dashboard-data";

interface DashboardHeaderProps {
  location: LocationState;
  homeLocation: LocationState;
  lastUpdated?: string;
  isCustomLocation: boolean;
  isRefreshing: boolean;
  mapOpen: boolean;
  isLoggedIn: boolean;
  username?: string | null;
  onLocationSelect: (location: GeocodeResult) => void;
  onLocationReset: () => void;
  onShare: () => void;
  onRefresh: () => void;
  onToggleMap: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

const HEADER_CLASSES = {
  header: "sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
  inner: "max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3",
  row: "flex items-center justify-between gap-3 flex-wrap",
  left: "flex items-center gap-3",
  icon: "w-6 h-6 text-foreground",
  title: "text-base font-semibold leading-tight",
  right: "flex items-center gap-2",
  lastUpdated: `hidden sm:flex items-center gap-1 ${MUTED_LABEL}`,
  iconXs: "w-3 h-3",
  iconSm: "w-4 h-4",
  navIcon: "w-4 h-4 mr-1",
  regionBadge: "hidden sm:flex",
  regionBadgeIcon: "w-3 h-3 mr-1",
  logoutBtn: "gap-1.5 text-xs",
  logoutIcon: "w-3.5 h-3.5",
  searchRow: "flex items-center gap-2",
} as const;

export function DashboardHeader({
  location,
  homeLocation,
  lastUpdated,
  isCustomLocation,
  isRefreshing,
  mapOpen,
  isLoggedIn,
  username,
  onLocationSelect,
  onLocationReset,
  onShare,
  onRefresh,
  onToggleMap,
  onOpenLogin,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className={HEADER_CLASSES.header}>
      <div className={HEADER_CLASSES.inner}>
        <div className={HEADER_CLASSES.row}>
          <div className={HEADER_CLASSES.left}>
            <CloudSun className={HEADER_CLASSES.icon} />
            <div>
              <h1 className={HEADER_CLASSES.title} data-testid="text-app-title">
                {location.name}
              </h1>
              <p className={MUTED_LABEL}>Weather & Local News</p>
            </div>
            {isCustomLocation && (
              <Button variant="outline" size="sm" onClick={onLocationReset} data-testid="button-back-to-home">
                <Navigation className={HEADER_CLASSES.navIcon} />
                {homeLocation.name.length > 20 ? homeLocation.name.slice(0, 18) + "..." : homeLocation.name}
              </Button>
            )}
          </div>

          <div className={HEADER_CLASSES.right}>
            {lastUpdated && (
              <span className={HEADER_CLASSES.lastUpdated} data-testid="text-last-updated">
                <Clock className={HEADER_CLASSES.iconXs} />
                Updated {formatLastUpdated(lastUpdated)}
              </span>
            )}
            {location.region && (
              <Badge variant="outline" className={HEADER_CLASSES.regionBadge}>
                <MapPin className={HEADER_CLASSES.regionBadgeIcon} />
                {location.region.split(",")[0].trim()}
              </Badge>
            )}
            <Button size="icon" variant="ghost" onClick={onShare} data-testid="button-share">
              <Share2 className={HEADER_CLASSES.iconSm} />
            </Button>
            <Button size="icon" variant="ghost" onClick={onRefresh} disabled={isRefreshing} data-testid="button-refresh">
              <RefreshCw className={`${HEADER_CLASSES.iconSm} ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            {isLoggedIn ? (
              <Button variant="ghost" size="sm" onClick={onLogout} data-testid="button-logout" className={HEADER_CLASSES.logoutBtn}>
                <LogOut className={HEADER_CLASSES.logoutIcon} />
                <span className="hidden sm:inline">{username}</span>
                <span className="sm:hidden">Log out</span>
              </Button>
            ) : (
              <Button size="icon" variant="ghost" onClick={onOpenLogin} data-testid="button-login" title="Admin login">
                <Lock className={HEADER_CLASSES.iconSm} />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>

        <div className={HEADER_CLASSES.searchRow}>
          <div className="flex-1">
            <LocationSearch
              currentLocation={location.name}
              onLocationSelect={onLocationSelect}
              onReset={onLocationReset}
            />
          </div>
          <Button
            size="icon"
            variant={mapOpen ? "default" : "outline"}
            onClick={onToggleMap}
            data-testid="button-toggle-map"
          >
            <Map className={HEADER_CLASSES.iconSm} />
          </Button>
        </div>
      </div>
    </header>
  );
}

function formatLastUpdated(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
