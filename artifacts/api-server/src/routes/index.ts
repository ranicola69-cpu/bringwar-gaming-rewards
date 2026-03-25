import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import offersRouter from "./offers.js";
import completionsRouter from "./completions.js";
import withdrawalsRouter from "./withdrawals.js";
import usersRouter from "./users.js";
import statsRouter from "./stats.js";
import autoGenerateRouter from "./auto-generate.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/offers", offersRouter);
router.use("/completions", completionsRouter);
router.use("/withdrawals", withdrawalsRouter);
router.use("/users", usersRouter);
router.use("/stats", statsRouter);
router.use("/admin", autoGenerateRouter);

export default router;
