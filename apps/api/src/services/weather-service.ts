import type { AirQuality, WeatherForecast } from "@workspace/shared-api-zod";
import { BIRMINGHAM_LAT, BIRMINGHAM_LON, DEFAULT_LOCATION_NAME } from "../lib/default-location";

const WEATHER_CACHE_TTL = 5 * 60 * 1000;
const AIR_QUALITY_CACHE_TTL = 15 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface OpenMeteoForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    precipitation: number;
    cloud_cover: number;
    is_day: number;
    uv_index: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    cloud_cover: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
}

interface OpenMeteoAirQualityResponse {
  current: {
    european_aqi: number;
    pm10: number;
    pm2_5: number;
    nitrogen_dioxide: number;
    ozone: number;
  };
}

const weatherCache = new Map<string, CacheEntry<WeatherForecast>>();
const airQualityCache = new Map<string, CacheEntry<AirQuality>>();

export interface WeatherRequest {
  lat?: number;
  lon?: number;
  locationName?: string;
  forceRefresh?: boolean;
}

export async function getWeatherForecast({
  lat = BIRMINGHAM_LAT,
  lon = BIRMINGHAM_LON,
  locationName = DEFAULT_LOCATION_NAME,
  forceRefresh = false,
}: WeatherRequest): Promise<WeatherForecast> {
  const cacheKey = `${lat},${lon}`;
  const cached = weatherCache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL) {
    return { ...cached.data, location: locationName };
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,precipitation,is_day,uv_index");
  url.searchParams.set("hourly", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,cloud_cover,wind_speed_10m,is_day");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,precipitation_probability_max,sunrise,sunset,uv_index_max");
  url.searchParams.set("timezone", "Europe/London");
  url.searchParams.set("forecast_days", "7");

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Open-Meteo API error: ${response.status}`);

  const data = await response.json() as OpenMeteoForecastResponse;
  const current = {
    time: data.current.time,
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,
    precipitation: data.current.precipitation,
    cloudCover: data.current.cloud_cover,
    isDay: data.current.is_day,
    uvIndex: data.current.uv_index,
  };

  const todayStr = data.current.time.split("T")[0];
  const hourly = data.hourly.time.map((time, index) => ({
    time,
    temperature: data.hourly.temperature_2m[index],
    feelsLike: data.hourly.apparent_temperature[index],
    humidity: data.hourly.relative_humidity_2m[index],
    windSpeed: data.hourly.wind_speed_10m[index],
    weatherCode: data.hourly.weather_code[index],
    precipitation: data.hourly.precipitation_probability[index] || 0,
    cloudCover: data.hourly.cloud_cover[index],
    isDay: data.hourly.is_day[index],
    uvIndex: 0,
  }));

  const todayHourly = hourly.filter((hour) => hour.time.startsWith(todayStr));
  const threeHourly = todayHourly.filter((_, index) => index % 3 === 0);
  const daily = data.daily.time.map((date: string, index: number) => ({
    date,
    weatherCode: data.daily.weather_code[index],
    temperatureMax: data.daily.temperature_2m_max[index],
    temperatureMin: data.daily.temperature_2m_min[index],
    precipitationSum: data.daily.precipitation_sum[index],
    windSpeedMax: data.daily.wind_speed_10m_max[index],
    precipitationProbabilityMax: data.daily.precipitation_probability_max[index] || 0,
    sunrise: data.daily.sunrise[index],
    sunset: data.daily.sunset[index],
    uvIndexMax: data.daily.uv_index_max[index],
  }));

  const forecast: WeatherForecast = {
    location: locationName,
    latitude: lat,
    longitude: lon,
    timezone: "Europe/London",
    current,
    hourly,
    threeHourly,
    daily,
    lastUpdated: new Date().toISOString(),
  };

  weatherCache.set(cacheKey, { data: forecast, timestamp: Date.now() });
  return forecast;
}

export async function getAirQuality(lat = BIRMINGHAM_LAT, lon = BIRMINGHAM_LON): Promise<AirQuality> {
  const cacheKey = `${lat},${lon}`;
  const cached = airQualityCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AIR_QUALITY_CACHE_TTL) return cached.data;

  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("current", "european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone");

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Air Quality API error: ${response.status}`);

  const data = await response.json() as OpenMeteoAirQualityResponse;
  const airQuality: AirQuality = {
    europeanAqi: data.current.european_aqi,
    pm10: data.current.pm10,
    pm25: data.current.pm2_5,
    nitrogenDioxide: data.current.nitrogen_dioxide,
    ozone: data.current.ozone,
    lastUpdated: new Date().toISOString(),
  };

  airQualityCache.set(cacheKey, { data: airQuality, timestamp: Date.now() });
  return airQuality;
}
