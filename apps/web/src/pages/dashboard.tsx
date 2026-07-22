import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { GeocodeResult } from "@workspace/shared-api-zod";
import { AdminLoginDialog } from "@/components/admin-login-dialog";
import { DashboardHeader } from "@/components/dashboard-header";
import { DeathsTab } from "@/components/deaths-tab";
import { MapPicker } from "@/components/map-picker";
import { NewsTab } from "@/components/news-tab";
import { WeatherTab } from "@/components/weather-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardData, type LocationState } from "@/hooks/use-dashboard-data";
import { useSavedArticles } from "@/hooks/use-saved-articles";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  FALLBACK_COUNTRY,
  FALLBACK_LAT,
  FALLBACK_LOCATION_NAME,
  FALLBACK_LON,
  FALLBACK_REGION,
  SUB_TAB_LATEST,
  SUB_TAB_SAVED,
  TAB_DEATHS,
  TAB_NEWS,
  TAB_WEATHER,
} from "@/lib/constants";
import { reportClientError } from "@/lib/report-error";
import { MUTED_LABEL } from "@/lib/styles";
import { CloudSun, Newspaper, Star } from "lucide-react";

const FALLBACK_LOCATION: LocationState = {
  name: FALLBACK_LOCATION_NAME,
  lat: FALLBACK_LAT,
  lon: FALLBACK_LON,
  region: FALLBACK_REGION,
  country: FALLBACK_COUNTRY,
};

const PAGE_CLASSES = {
  page: "min-h-screen bg-background",
  main: "max-w-6xl mx-auto px-4 py-6",
  mapWrap: "mb-6",
  tabIcon: "w-4 h-4 mr-1.5",
  footer: "border-t mt-12",
  footerInner: "max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3 flex-wrap",
} as const;

export default function Dashboard() {
  const [location, setLocation] = useState(FALLBACK_LOCATION);
  const [homeLocation, setHomeLocation] = useState(FALLBACK_LOCATION);
  const [geolocating, setGeolocating] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [newsTab, setNewsTab] = useState<typeof SUB_TAB_LATEST | typeof SUB_TAB_SAVED>(SUB_TAB_LATEST);
  const [deathsTab, setDeathsTab] = useState<typeof SUB_TAB_LATEST | typeof SUB_TAB_SAVED>(SUB_TAB_LATEST);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const geoAttempted = useRef(false);

  const { isLoggedIn, login, logout, user } = useAuth();
  const { toast } = useToast();
  const { favourites, isFavourite, toggleFavourite, removeFavourite } = useSavedArticles();

  const {
    weather,
    weatherLoading,
    weatherError,
    weatherErrorData,
    news,
    newsLoading,
    newsError,
    airQuality,
    deathsData,
    deathsLoading,
    deathsError,
    isRefreshing,
    handleRefresh,
  } = useDashboardData(location, !geolocating);

  const savedNewsArticles = favourites.filter((article) => !article.deathSubject);
  const savedDeathArticles = favourites.filter((article) => Boolean(article.deathSubject));
  const isCustomLocation = location.name !== homeLocation.name;

  useEffect(() => {
    if (!isLoggedIn) {
      setNewsTab(SUB_TAB_LATEST);
      setDeathsTab(SUB_TAB_LATEST);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (geoAttempted.current) return;
    geoAttempted.current = true;

    if (!navigator.geolocation) {
      setGeolocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`/api/reverse-geocode?lat=${latitude}&lon=${longitude}`);
          if (response.ok) {
            const data = await response.json();
            const detected = {
              name: data.name || "Your Location",
              lat: latitude,
              lon: longitude,
              region: data.region || "",
              country: data.country || "",
            };
            setLocation(detected);
            setHomeLocation(detected);
          }
        } catch (error) {
          reportClientError("Failed to reverse geocode browser location", error);
        } finally {
          setGeolocating(false);
        }
      },
      (error) => {
        reportClientError("Browser geolocation failed", error);
        setGeolocating(false);
      },
      { timeout: 8000, maximumAge: 300000 },
    );
  }, []);

  const handleLocationSelect = useCallback((result: GeocodeResult) => {
    setLocation({
      name: result.name,
      lat: result.latitude,
      lon: result.longitude,
      region: result.region || result.country,
      country: result.country || "",
    });
  }, []);

  const handleLocationReset = useCallback(() => {
    setLocation(homeLocation);
  }, [homeLocation]);

  const handleShare = async () => {
    const text = weather
      ? `Weather in ${location.name}: ${Math.round(weather.current.temperature)} deg C, ${weather.current.humidity}% humidity, Wind ${Math.round(weather.current.windSpeed)} km/h`
      : `Check the weather in ${location.name}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${location.name} Weather`, text, url: window.location.href });
        return;
      } catch (error) {
        reportClientError("Native share failed", error);
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    } catch (error) {
      reportClientError("Clipboard share failed", error);
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setLoginPending(true);

    try {
      await login(loginUsername, loginPassword);
      setLoginOpen(false);
      setLoginUsername("");
      setLoginPassword("");
      toast({ title: "Logged in", description: `Welcome back, ${loginUsername}` });
    } catch (error) {
      reportClientError("Login failed", error);
      setLoginError("Invalid username or password.");
    } finally {
      setLoginPending(false);
    }
  };

  const handleLoginOpenChange = (open: boolean) => {
    setLoginOpen(open);
    if (!open) {
      setLoginError("");
      setLoginUsername("");
      setLoginPassword("");
    }
  };

  const handleLogout = () => {
    void logout().then(() => toast({ title: "Logged out" }));
  };

  return (
    <div className={PAGE_CLASSES.page}>
      <DashboardHeader
        location={location}
        homeLocation={homeLocation}
        lastUpdated={weather?.lastUpdated}
        isCustomLocation={isCustomLocation}
        isRefreshing={isRefreshing}
        mapOpen={mapOpen}
        isLoggedIn={isLoggedIn}
        username={user?.username}
        onLocationSelect={handleLocationSelect}
        onLocationReset={handleLocationReset}
        onShare={handleShare}
        onRefresh={handleRefresh}
        onToggleMap={() => setMapOpen((open) => !open)}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />

      <AdminLoginDialog
        open={loginOpen}
        username={loginUsername}
        password={loginPassword}
        error={loginError}
        pending={loginPending}
        onOpenChange={handleLoginOpenChange}
        onUsernameChange={setLoginUsername}
        onPasswordChange={setLoginPassword}
        onSubmit={handleLogin}
      />

      <main className={PAGE_CLASSES.main}>
        {mapOpen && (
          <div className={PAGE_CLASSES.mapWrap}>
            <MapPicker
              currentLat={location.lat}
              currentLon={location.lon}
              onLocationSelect={(nextLocation) => {
                setLocation(nextLocation);
              }}
              isOpen={mapOpen}
              onClose={() => setMapOpen(false)}
            />
          </div>
        )}

        <Tabs defaultValue={TAB_WEATHER} className="w-full">
          <TabsList className="mb-6" data-testid="tabs-main">
            <TabsTrigger value={TAB_WEATHER} data-testid="tab-weather">
              <CloudSun className={PAGE_CLASSES.tabIcon} />
              Weather
            </TabsTrigger>
            <TabsTrigger value={TAB_NEWS} data-testid="tab-news">
              <Newspaper className={PAGE_CLASSES.tabIcon} />
              Local News
            </TabsTrigger>
            <TabsTrigger value={TAB_DEATHS} data-testid="tab-deaths">
              <Star className={PAGE_CLASSES.tabIcon} />
              Celebrity Deaths
            </TabsTrigger>
          </TabsList>

          <TabsContent value={TAB_WEATHER}>
            <WeatherTab
              weather={weather}
              airQuality={airQuality}
              weatherLoading={weatherLoading}
              geolocating={geolocating}
              weatherError={weatherError}
              errorMessage={weatherErrorData?.message}
              latitude={location.lat}
              longitude={location.lon}
              locationName={location.name}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value={TAB_NEWS}>
            <NewsTab
              activeTab={newsTab}
              news={news}
              savedArticles={savedNewsArticles}
              isLoggedIn={isLoggedIn}
              isLoading={newsLoading}
              geolocating={geolocating}
              hasError={newsError}
              isFavourite={isFavourite}
              onTabChange={setNewsTab}
              onToggleFavourite={toggleFavourite}
              onRemoveFavourite={removeFavourite}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value={TAB_DEATHS}>
            <DeathsTab
              activeTab={deathsTab}
              data={deathsData}
              savedArticles={savedDeathArticles}
              isLoggedIn={isLoggedIn}
              isLoading={deathsLoading}
              hasError={deathsError}
              isFavourite={isFavourite}
              onTabChange={setDeathsTab}
              onToggleFavourite={toggleFavourite}
              onRemoveFavourite={removeFavourite}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className={PAGE_CLASSES.footer}>
        <div className={PAGE_CLASSES.footerInner}>
          <p className={MUTED_LABEL}>Weather & air quality data from Open-Meteo</p>
          <p className={MUTED_LABEL}>News from Google News & regional sources</p>
        </div>
      </footer>
    </div>
  );
}
