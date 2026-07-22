import { Router, type IRouter } from "express";
import { z } from "zod";
import { asyncRoute, sendValidationError } from "./route-utils";

const router: IRouter = Router();

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

router.get("/auth/me", (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.session?.userId) {
    res.json({ userId: req.session.userId, username: req.session.username ?? null });
    return;
  }
  res.json({ userId: null, username: null });
});

router.post("/auth/login", asyncRoute(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminUsername || !adminPassword) {
    res.status(503).json({ message: "Admin credentials not configured." });
    return;
  }

  const { username, password } = parsed.data;
  if (username === adminUsername.trim() && password === adminPassword) {
    req.session.userId = "admin";
    req.session.username = username;
    res.json({ success: true, username });
    return;
  }

  res.status(401).json({ message: "Invalid credentials" });
}));

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;
