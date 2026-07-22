import { Router, type IRouter } from "express";
import { z } from "zod";
import webpush from "web-push";
import { updateNotificationPrefsSchema } from "../schema";
import { BIRMINGHAM_LAT, BIRMINGHAM_LON, DEFAULT_LOCATION_NAME } from "../lib/default-location";
import { logger } from "../lib/logger";
import { configureWebPush, hasVapidConfig, vapidPublicKey } from "../lib/vapid";
import { storage } from "../storage";
import { sendNotificationsForSub } from "../notifications";
import { asyncRoute, sendValidationError } from "./route-utils";

const router: IRouter = Router();

const endpointBodySchema = z.object({
  endpoint: z.string().min(1),
});

const endpointQuerySchema = z.object({
  endpoint: z.string().min(1),
});

const subscribeSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  locationName: z.string().trim().optional(),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
});

configureWebPush();

router.get("/vapid-public-key", (_req, res) => {
  res.json({ publicKey: hasVapidConfig ? vapidPublicKey ?? "" : "" });
});

router.post("/push/subscribe", asyncRoute(async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const subscription = await storage.savePushSubscription({
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    locationName: parsed.data.locationName || DEFAULT_LOCATION_NAME,
    latitude: String(parsed.data.latitude ?? BIRMINGHAM_LAT),
    longitude: String(parsed.data.longitude ?? BIRMINGHAM_LON),
  });

  res.json({ success: true, subscription });
}));

router.post("/push/unsubscribe", asyncRoute(async (req, res) => {
  const parsed = endpointBodySchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  await storage.deletePushSubscription(parsed.data.endpoint);
  res.json({ success: true });
}));

router.get("/push/preferences", asyncRoute(async (req, res) => {
  const parsed = endpointQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const subscription = await storage.getPushSubscriptionByEndpoint(parsed.data.endpoint);
  if (!subscription) {
    res.status(404).json({ message: "Subscription not found" });
    return;
  }

  res.json({
    notifyExtremeWeather: subscription.notifyExtremeWeather,
    notifyGeneralWeather: subscription.notifyGeneralWeather,
    notifyNewsSummary: subscription.notifyNewsSummary,
    notifyCelebrityDeaths: subscription.notifyCelebrityDeaths ?? 1,
    frequencyMinutes: subscription.frequencyMinutes,
    newsArticleCount: subscription.newsArticleCount,
    scheduledTimes: subscription.scheduledTimes ?? "",
    lastNotifiedAt: subscription.lastNotifiedAt ?? null,
    quietHoursStart: subscription.quietHoursStart ?? null,
    quietHoursEnd: subscription.quietHoursEnd ?? null,
  });
}));

router.post("/push/preferences", asyncRoute(async (req, res) => {
  const parsed = updateNotificationPrefsSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const updated = await storage.updateNotificationPrefs(parsed.data);
  if (!updated) {
    res.status(404).json({ message: "Subscription not found" });
    return;
  }

  res.json({
    success: true,
    notifyExtremeWeather: updated.notifyExtremeWeather,
    notifyGeneralWeather: updated.notifyGeneralWeather,
    notifyNewsSummary: updated.notifyNewsSummary,
    notifyCelebrityDeaths: updated.notifyCelebrityDeaths ?? 1,
    frequencyMinutes: updated.frequencyMinutes,
    newsArticleCount: updated.newsArticleCount,
    scheduledTimes: updated.scheduledTimes ?? "",
    lastNotifiedAt: updated.lastNotifiedAt ?? null,
    quietHoursStart: updated.quietHoursStart ?? null,
    quietHoursEnd: updated.quietHoursEnd ?? null,
  });
}));

router.post("/push/test", asyncRoute(async (req, res) => {
  if (!hasVapidConfig) {
    res.status(503).json({ message: "Push notifications not configured" });
    return;
  }

  const parsed = endpointBodySchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const subscription = await storage.getPushSubscriptionByEndpoint(parsed.data.endpoint);
  if (!subscription) {
    res.status(404).json({ message: "Subscription not found" });
    return;
  }

  const payload = JSON.stringify({
    title: "Weather Alert Test",
    body: "Push notifications are working!",
    url: "/",
  });
  const results = await Promise.allSettled(
    [
      webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload,
      ),
    ],
  );

  const succeeded = results.filter((result) => result.status === "fulfilled").length;
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed > 0) logger.warn({ failed }, "Some test push notifications failed");
  res.json({ success: true, sent: succeeded, failed });
}));

router.post("/push/send-now", asyncRoute(async (req, res) => {
  if (!hasVapidConfig) {
    res.status(503).json({ message: "Push notifications not configured" });
    return;
  }

  const parsed = endpointBodySchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const subscription = await storage.getPushSubscriptionByEndpoint(parsed.data.endpoint);
  if (!subscription) {
    res.status(404).json({ message: "Subscription not found" });
    return;
  }

  const sendKey = `manual|${Date.now()}`;
  const sent = await sendNotificationsForSub(subscription, sendKey, true);
  await storage.updateNotificationPrefs({
    endpoint: parsed.data.endpoint,
    lastNotifiedAt: new Date().toISOString(),
  });
  res.json({ success: true, sent });
}));

export default router;
