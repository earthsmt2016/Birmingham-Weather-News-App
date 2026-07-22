import { detectWeatherAlerts, type AirQuality, type WeatherForecast } from "@workspace/shared-api-zod";
import { AirQualityCard } from "@/components/air-quality";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrentWeather } from "@/components/current-weather";
import { HourlyBreakdown } from "@/components/hourly-breakdown";
import { NotificationSettings } from "@/components/notification-settings";
import { SevenDayForecast } from "@/components/seven-day-forecast";
import { ThreeHourForecast } from "@/components/three-hour-forecast";
import { WeatherAlerts } from "@/components/weather-alerts";
import { WeatherRadar } from "@/components/weather-radar";
import { WeatherSkeleton } from "@/components/weather-skeleton";
import { EMPTY_STATE } from "@/lib/styles";
import { AlertCircle, RefreshCw } from "lucide-react";

interface WeatherTabProps {
  weather?: WeatherForecast;
  airQuality?: AirQuality;
  weatherLoading: boolean;
  geolocating: boolean;
  weatherError: boolean;
  errorMessage?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  onRefresh: () => void;
}

const WEATHER_TAB_CLASSES = {
  content: "flex flex-col gap-4",
  errorIcon: "w-10 h-10 text-destructive",
  title: "font-medium",
  body: "text-sm text-muted-foreground",
  tabIcon: "w-4 h-4 mr-1.5",
} as const;

export function WeatherTab({
  weather,
  airQuality,
  weatherLoading,
  geolocating,
  weatherError,
  errorMessage,
  latitude,
  longitude,
  locationName,
  onRefresh,
}: WeatherTabProps) {
  return (
    <>
      {weatherError && (
        <Card className={EMPTY_STATE}>
          <AlertCircle className={WEATHER_TAB_CLASSES.errorIcon} />
          <h3 className={WEATHER_TAB_CLASSES.title}>Unable to load weather</h3>
          <p className={WEATHER_TAB_CLASSES.body}>
            {errorMessage || "Please try again in a moment."}
          </p>
          <Button variant="outline" onClick={onRefresh} data-testid="button-retry-weather">
            <RefreshCw className={WEATHER_TAB_CLASSES.tabIcon} />
            Retry
          </Button>
        </Card>
      )}

      {(weatherLoading || geolocating) && <WeatherSkeleton />}

      {weather && (
        <div className={WEATHER_TAB_CLASSES.content}>
          <WeatherAlerts alerts={detectWeatherAlerts(weather.current, weather.daily)} />
          <CurrentWeather forecast={weather} />
          {airQuality && <AirQualityCard data={airQuality} />}
          <ThreeHourForecast forecast={weather.threeHourly} />
          <HourlyBreakdown hourly={weather.hourly} />
          <SevenDayForecast daily={weather.daily} hourly={weather.hourly} />
          <WeatherRadar latitude={latitude} longitude={longitude} locationName={locationName} />
          <NotificationSettings />
        </div>
      )}
    </>
  );
}
