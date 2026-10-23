import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const frontendDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../afternoons-cafe/dist/public",
);

app.set("trust proxy", 1);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", router);
app.use(express.static(frontendDirectory));
app.use((req, res, next) => {
  if (
    req.method !== "GET" ||
    req.path === "/api" ||
    req.path.startsWith("/api/")
  ) {
    return next();
  }

  res.sendFile(path.join(frontendDirectory, "index.html"), (error) => {
    if (error) next(error);
  });
});

export default app;
