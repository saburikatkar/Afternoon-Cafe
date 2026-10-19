import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cafeRouter from "./cafe";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cafeRouter);
router.use(adminRouter);

export default router;
