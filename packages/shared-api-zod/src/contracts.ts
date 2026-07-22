import { z } from "zod";

export const weatherConditionSchema = z.object({
  time: z.string(),
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
  windSpeed: z.number(),
  weatherCode: z.number(),
  precipitation: z.number(),
  cloudCover: z.number(),
  isDay: z.number(),
  uvIndex: z.number(),
});

export const dailyForecastSchema = z.object({
  date: z.string(),
  weatherCode: z.number(),
  temperatureMax: z.number(),
  temperatureMin: z.number(),
  precipitationSum: z.number(),
  windSpeedMax: z.number(),
  precipitationProbabilityMax: z.number(),
  sunrise: z.string(),
  sunset: z.string(),
  uvIndexMax: z.number(),
});

export const weatherForecastSchema = z.object({
  location: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: weatherConditionSchema,
  hourly: z.array(weatherConditionSchema),
  threeHourly: z.array(weatherConditionSchema),
  daily: z.array(dailyForecastSchema),
  lastUpdated: z.string(),
});

export const newsArticleSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string(),
  pubDate: z.string(),
  source: z.string(),
});

export const newsResponseSchema = z.object({
  articles: z.array(newsArticleSchema),
  lastUpdated: z.string(),
  regionLabel: z.string().optional(),
});

export const geocodeResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string(),
  region: z.string(),
});

export const airQualitySchema = z.object({
  europeanAqi: z.number(),
  pm10: z.number(),
  pm25: z.number(),
  nitrogenDioxide: z.number(),
  ozone: z.number(),
  lastUpdated: z.string(),
});

export const deathArticleSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string(),
  pubDate: z.string(),
  source: z.string(),
  deathSubject: z.string().nullish(),
});

export const deathResponseSchema = z.object({
  articles: z.array(deathArticleSchema),
  lastUpdated: z.string(),
});

export const savedArticleSchema = newsArticleSchema.extend({
  id: z.string(),
  userId: z.string(),
  deathSubject: z.string().nullable(),
  savedAt: z.string(),
});

export const insertSavedArticleSchema = z.object({
  userId: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  link: z.string().min(1),
  pubDate: z.string().optional(),
  source: z.string().optional(),
  deathSubject: z.string().nullable().optional(),
});

export const pushSubscriptionSchema = z.object({
  id: z.string(),
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  locationName: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  createdAt: z.string(),
  notifyExtremeWeather: z.number(),
  notifyGeneralWeather: z.number(),
  notifyNewsSummary: z.number(),
  frequencyMinutes: z.number(),
  newsArticleCount: z.number(),
  notifyCelebrityDeaths: z.number().nullable(),
  lastNotifiedAt: z.string().nullable(),
  lastCelebDeathNotifiedAt: z.string().nullable(),
  scheduledTimes: z.string(),
  quietHoursStart: z.string().nullable(),
  quietHoursEnd: z.string().nullable(),
});

export const insertPushSubscriptionSchema = z.object({
  endpoint: z.string().min(1),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  locationName: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const updateNotificationPrefsSchema = z.object({
  endpoint: z.string().min(1),
  notifyExtremeWeather: z.number().min(0).max(1).optional(),
  notifyGeneralWeather: z.number().min(0).max(1).optional(),
  notifyNewsSummary: z.number().min(0).max(1).optional(),
  frequencyMinutes: z.number().min(15).max(360).optional(),
  newsArticleCount: z.number().min(1).max(5).optional(),
  notifyCelebrityDeaths: z.number().min(0).max(1).optional(),
  scheduledTimes: z.string().optional(),
  lastNotifiedAt: z.string().nullable().optional(),
  lastCelebDeathNotifiedAt: z.string().nullable().optional(),
  quietHoursStart: z.string().nullable().optional(),
  quietHoursEnd: z.string().nullable().optional(),
});

export type WeatherCondition = z.infer<typeof weatherConditionSchema>;
export type DailyForecast = z.infer<typeof dailyForecastSchema>;
export type WeatherForecast = z.infer<typeof weatherForecastSchema>;
export type NewsArticle = z.infer<typeof newsArticleSchema>;
export type NewsResponse = z.infer<typeof newsResponseSchema>;
export type GeocodeResult = z.infer<typeof geocodeResultSchema>;
export type AirQuality = z.infer<typeof airQualitySchema>;
export type DeathArticle = z.infer<typeof deathArticleSchema>;
export type DeathResponse = z.infer<typeof deathResponseSchema>;
export type InsertSavedArticle = z.infer<typeof insertSavedArticleSchema>;
export type SavedArticle = z.infer<typeof savedArticleSchema>;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = z.infer<typeof pushSubscriptionSchema>;
export type UpdateNotificationPrefs = z.infer<typeof updateNotificationPrefsSchema>;
