import { Router, type IRouter } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";
import { asyncRoute, sendValidationError } from "./route-utils";
import { reverseGeocode, searchLocations } from "../services/location-service";

const router: IRouter = Router();

const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
});

const coordinatesQuerySchema = z.object({
  lat: z.coerce.number().finite(),
  lon: z.coerce.number().finite(),
});

router.get("/geocode", asyncRoute(async (req, res) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const query = parsed.data.q;
  if (!query) {
    res.json({ results: [] });
    return;
  }

  const results = await searchLocations(query);
  res.json({ results });
}));

router.get("/reverse-geocode", asyncRoute(async (req, res) => {
  const parsed = coordinatesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    logger.warn({ errors: parsed.error.flatten() }, "Invalid reverse-geocode request");
    sendValidationError(res, parsed.error);
    return;
  }

  res.json(await reverseGeocode(parsed.data.lat, parsed.data.lon));
}));

export default router;
