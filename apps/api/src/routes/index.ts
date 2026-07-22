import { Router, type IRouter } from "express";
import authRouter from "./auth";
import forecastRouter from "./forecast";
import healthRouter from "./health";
import locationRouter from "./location";
import newsRouter from "./news";
import pushRouter from "./push";
import savedArticlesRouter from "./saved-articles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(locationRouter);
router.use(forecastRouter);
router.use(newsRouter);
router.use(pushRouter);
router.use(authRouter);
router.use(savedArticlesRouter);

export default router;
