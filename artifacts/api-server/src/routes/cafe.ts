import { asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetGalleryResponse,
  GetMenuResponse,
  GetReviewsResponse,
  SubmitReviewBody,
  SubmitReviewResponse,
} from "@workspace/api-zod";
import { db, reviewsTable } from "@workspace/db";
import { getGallery, getMenu, mapReview } from "../lib/cafe-data";
import { sendReviewAlert } from "../lib/review-alert";
import { checkRateLimit, pruneRateLimitMap } from "../lib/rate-limit";

const router: IRouter = Router();
const submissionAttempts = new Map<string, number[]>();
const SUBMISSION_WINDOW_MS = 60 * 60 * 1000;
const SUBMISSION_LIMIT = 4;

function cleanText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

router.get("/menu", async (_req, res): Promise<void> => {
  const menu = await getMenu(false);
  res.json(GetMenuResponse.parse(menu));
});

router.get("/gallery", async (_req, res): Promise<void> => {
  const gallery = await getGallery();
  res.json(GetGalleryResponse.parse(gallery));
});

router.get("/reviews", async (_req, res): Promise<void> => {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.status, "approved"))
    .orderBy(asc(reviewsTable.createdAt));
  res.json(GetReviewsResponse.parse(reviews.map(mapReview)));
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = SubmitReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const name = cleanText(parsed.data.name);
  const message = cleanText(parsed.data.message);
  if (name.length === 0 || message.length < 8 || message.length > 1200) {
    res.status(400).json({ error: "Please add a name and a review of at least 8 characters." });
    return;
  }

  // Quietly accept honeypot submissions so simple bots don't learn the field is monitored.
  if (parsed.data.website?.trim()) {
    res.status(201).json(
      SubmitReviewResponse.parse({
        id: 0,
        status: "pending",
        message: "Thanks. Your note has been sent for review.",
      }),
    );
    return;
  }

  pruneRateLimitMap(submissionAttempts, SUBMISSION_WINDOW_MS);
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const rate = checkRateLimit(submissionAttempts, ip, {
    limit: SUBMISSION_LIMIT,
    windowMs: SUBMISSION_WINDOW_MS,
  });
  if (!rate.allowed) {
    res.setHeader("Retry-After", String(rate.retryAfterSeconds));
    res.status(429).json({ error: "A few notes have come from this connection already. Please try again later." });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      name,
      rating: parsed.data.rating,
      message,
      status: "pending",
    })
    .returning();

  await sendReviewAlert({ name: review.name, rating: review.rating, message: review.message }, req.log);

  res.status(201).json(
    SubmitReviewResponse.parse({
      id: review.id,
      status: review.status,
      message: "Thanks. Your note has been sent for review.",
    }),
  );
});

export default router;
