import { Router, type IRouter } from "express";
import { z } from "zod";
import { insertSavedArticleSchema } from "../schema";
import { storage } from "../storage";
import { asyncRoute, requireSessionUserId, sendValidationError } from "./route-utils";

const router: IRouter = Router();

const savedArticleBodySchema = insertSavedArticleSchema.omit({ userId: true });
const deleteSavedArticleSchema = z.object({
  link: z.string().min(1),
});

router.get("/saved-articles", asyncRoute(async (req, res) => {
  const userId = requireSessionUserId(req, res);
  if (!userId) return;

  res.json(await storage.getSavedArticles(userId));
}));

router.post("/saved-articles", asyncRoute(async (req, res) => {
  const userId = requireSessionUserId(req, res);
  if (!userId) return;

  const parsed = savedArticleBodySchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  res.json(await storage.saveArticle({ ...parsed.data, userId }));
}));

router.delete("/saved-articles/all", asyncRoute(async (req, res) => {
  const userId = requireSessionUserId(req, res);
  if (!userId) return;

  await storage.clearSavedArticles(userId);
  res.json({ success: true });
}));

router.delete("/saved-articles", asyncRoute(async (req, res) => {
  const userId = requireSessionUserId(req, res);
  if (!userId) return;

  const parsed = deleteSavedArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  await storage.deleteSavedArticle(userId, parsed.data.link);
  res.json({ success: true });
}));

export default router;
