import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  airQualitySchema,
  deathResponseSchema,
  newsResponseSchema,
  weatherForecastSchema,
  type WeatherForecast,
  type NewsResponse,
  type AirQuality,
  type DeathResponse,
} from "@workspace/shared-api-zod";
import { queryClient } from "@/lib/queryClient";
import { reportClientError } from "@/lib/report-error";

export interface LocationState {
  name: string;
  lat: number;
  lon: number;
  region: string;
  country: string;
}

export function useDashboardData(location: LocationState, enabled: boolean) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const weatherParams = `lat=${location.lat}&lon=${location.lon}&name=${encodeURIComponent(location.name)}`;
  const newsParams    = `name=${encodeURIComponent(location.name)}&region=${encodeURIComponent(location.region)}&country=${encodeURIComponent(location.country)}`;

  const {
    data: weather,
    isLoading: weatherLoading,
    isError: weatherError,
    error: weatherErrorData,
  } = useQuery<WeatherForecast, Error>({
    queryKey: ["weather", location.lat, location.lon, location.name],
    queryFn: async () => {
      const res = await fetch(`/api/weather?${weatherParams}`);
      if (!res.ok) throw new Error("Failed to fetch weather");
      return weatherForecastSchema.parse(await res.json());
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const {
    data: news,
    isLoading: newsLoading,
    isError: newsError,
  } = useQuery<NewsResponse>({
    queryKey: ["news", location.name, location.region, location.country],
    queryFn: async () => {
      const res = await fetch(`/api/news?${newsParams}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return newsResponseSchema.parse(await res.json());
    },
    staleTime: 10 * 60 * 1000,
    enabled,
  });

  const { data: airQuality } = useQuery<AirQuality>({
    queryKey: ["air-quality", location.lat, location.lon],
    queryFn: async () => {
      const res = await fetch(`/api/air-quality?lat=${location.lat}&lon=${location.lon}`);
      if (!res.ok) throw new Error("Failed to fetch air quality");
      return airQualitySchema.parse(await res.json());
    },
    staleTime: 15 * 60 * 1000,
    enabled,
  });

  const {
    data: deathsData,
    isLoading: deathsLoading,
    isError: deathsError,
  } = useQuery<DeathResponse>({
    queryKey: ["celebrity-deaths"],
    queryFn: async () => {
      const res = await fetch("/api/celebrity-deaths");
      if (!res.ok) throw new Error("Failed to fetch celebrity deaths");
      return deathResponseSchema.parse(await res.json());
    },
    staleTime: 15 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [weatherRes, newsRes, aqRes] = await Promise.all([
        fetch(`/api/weather?${weatherParams}&refresh=true`),
        fetch(`/api/news?${newsParams}&refresh=true`),
        fetch(`/api/air-quality?lat=${location.lat}&lon=${location.lon}`),
      ]);
      if (weatherRes.ok) queryClient.setQueryData(["weather", location.lat, location.lon, location.name], weatherForecastSchema.parse(await weatherRes.json()));
      if (newsRes.ok)    queryClient.setQueryData(["news", location.name, location.region, location.country], newsResponseSchema.parse(await newsRes.json()));
      if (aqRes.ok)      queryClient.setQueryData(["air-quality", location.lat, location.lon], airQualitySchema.parse(await aqRes.json()));
    } catch (error) {
      reportClientError("Dashboard refresh failed", error);
    }
    setIsRefreshing(false);
  };

  return {
    weather, weatherLoading, weatherError, weatherErrorData,
    news, newsLoading, newsError,
    airQuality,
    deathsData, deathsLoading, deathsError,
    isRefreshing, handleRefresh,
  };
}
