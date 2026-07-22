import { Router, type IRouter } from "express";
import { z } from "zod";
import { DEFAULT_COUNTRY, DEFAULT_LOCATION_NAME, DEFAULT_REGION } from "../lib/default-location";
import { asyncRoute, sendValidationError } from "./route-utils";
import { getCelebrityDeaths, getLocalNews } from "../services/news-service";

const router: IRouter = Router();

const newsQuerySchema = z.object({
  name: z.string().trim().optional(),
  region: z.string().trim().optional(),
  country: z.string().trim().optional(),
  refresh: z.enum(["true", "false"]).optional(),
});

const refreshQuerySchema = z.object({
  refresh: z.enum(["true", "false"]).optional(),
});

router.get("/news", asyncRoute(async (req, res) => {
  const parsed = newsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  res.json(await getLocalNews({
    locationName: parsed.data.name || DEFAULT_LOCATION_NAME,
    region: parsed.data.region || DEFAULT_REGION,
    country: parsed.data.country || DEFAULT_COUNTRY,
    forceRefresh: parsed.data.refresh === "true",
  }));
}));

router.get("/celebrity-deaths", asyncRoute(async (req, res) => {
  const parsed = refreshQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  res.json(await getCelebrityDeaths(parsed.data.refresh === "true"));
}));

export default router;
