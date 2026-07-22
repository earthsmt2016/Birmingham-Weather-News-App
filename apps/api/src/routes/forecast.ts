import { Router, type IRouter } from "express";
import { z } from "zod";
import { DEFAULT_LOCATION_NAME } from "../lib/default-location";
import { asyncRoute, sendValidationError } from "./route-utils";
import { getAirQuality, getWeatherForecast } from "../services/weather-service";

const router: IRouter = Router();

const forecastQuerySchema = z.object({
  lat: z.coerce.number().finite().optional(),
  lon: z.coerce.number().finite().optional(),
  name: z.string().trim().optional(),
  refresh: z.enum(["true", "false"]).optional(),
});

const airQualityQuerySchema = z.object({
  lat: z.coerce.number().finite().optional(),
  lon: z.coerce.number().finite().optional(),
});

router.get("/weather", asyncRoute(async (req, res) => {
  const parsed = forecastQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const forecast = await getWeatherForecast({
    lat: parsed.data.lat,
    lon: parsed.data.lon,
    locationName: parsed.data.name || DEFAULT_LOCATION_NAME,
    forceRefresh: parsed.data.refresh === "true",
  });
  res.json(forecast);
}));

router.get("/air-quality", asyncRoute(async (req, res) => {
  const parsed = airQualityQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  res.json(await getAirQuality(parsed.data.lat, parsed.data.lon));
}));

export default router;
