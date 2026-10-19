import { asc, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  AdminLoginBody,
  AdminLoginResponse,
  AdminLogoutResponse,
  CreateGalleryImageBody,
  CreateGalleryImageResponse,
  CreateMenuCategoryBody,
  CreateMenuCategoryResponse,
  CreateMenuItemBody,
  CreateMenuItemResponse,
  DeleteGalleryImageParams,
  DeleteGalleryImageResponse,
  DeleteMenuCategoryParams,
  DeleteMenuCategoryResponse,
  DeleteMenuItemParams,
  DeleteMenuItemResponse,
  DeleteReviewParams,
  DeleteReviewResponse,
  GetAdminGalleryResponse,
  GetAdminMenuResponse,
  GetAdminReviewsQueryParams,
  GetAdminReviewsResponse,
  GetAdminSessionResponse,
  GalleryImage,
  MenuCategory,
  MenuItem,
  ModerateReviewBody,
  ModerateReviewParams,
  ModerateReviewResponse,
  SuccessResult,
  UpdateGalleryImageBody,
  UpdateGalleryImageParams,
  UpdateGalleryImageResponse,
  UpdateMenuCategoryBody,
  UpdateMenuCategoryParams,
  UpdateMenuCategoryResponse,
  UpdateMenuItemBody,
  UpdateMenuItemParams,
  UpdateMenuItemResponse,
} from "@workspace/api-zod";
import {
  adminUsersTable,
  db,
  galleryImagesTable,
  menuCategoriesTable,
  menuItemsTable,
  reviewsTable,
} from "@workspace/db";
import {
  ADMIN_COOKIE,
  createAdminSession,
  getAdminUsernameFromRequest,
  requireAdmin,
  verifyPassword,
} from "../lib/admin-auth";
import { getGallery, getMenu, mapGalleryImage, mapMenuItem, mapReview } from "../lib/cafe-data";
import { checkRateLimit, pruneRateLimitMap } from "../lib/rate-limit";

const router: IRouter = Router();
const loginAttempts = new Map<string, number[]>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 6;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/admin",
  maxAge: 8 * 60 * 60 * 1000,
};

function parseId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function safeImageUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  pruneRateLimitMap(loginAttempts, LOGIN_WINDOW_MS);
  const rate = checkRateLimit(loginAttempts, ip, { limit: LOGIN_LIMIT, windowMs: LOGIN_WINDOW_MS });
  if (!rate.allowed) {
    res.setHeader("Retry-After", String(rate.retryAfterSeconds));
    res.status(429).json({ error: "Too many sign-in attempts. Please wait and try again." });
    return;
  }

  const configuredUsername = process.env.ADMIN_USERNAME?.trim();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredUsername || !configuredPassword || configuredPassword.length < 12) {
    res.status(503).json({ error: "Owner login is not configured yet. Add ADMIN_USERNAME and a 12-character-or-longer ADMIN_PASSWORD in Secrets." });
    return;
  }

  const [admin] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, parsed.data.username))
    .limit(1);
  if (!admin || !verifyPassword(parsed.data.password, admin.passwordHash)) {
    res.status(401).json({ error: "That username or password did not match." });
    return;
  }

  const session = createAdminSession(admin.username);
  if (!session) {
    res.status(503).json({ error: "The session secret is not configured." });
    return;
  }
  res.cookie(ADMIN_COOKIE, session, COOKIE_OPTIONS);
  res.setHeader("Cache-Control", "no-store");
  res.json(AdminLoginResponse.parse({ authenticated: true, username: admin.username }));
});

router.post("/admin/logout", (_req, res): void => {
  res.clearCookie(ADMIN_COOKIE, {
    httpOnly: COOKIE_OPTIONS.httpOnly,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
    path: COOKIE_OPTIONS.path,
  });
  res.json(AdminLogoutResponse.parse({ success: true }));
});

router.use("/admin", requireAdmin);

router.get("/admin/session", async (req, res): Promise<void> => {
  const username = await getAdminUsernameFromRequest(req);
  if (!username) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  res.json(GetAdminSessionResponse.parse({ authenticated: true, username }));
});

router.get("/admin/reviews", async (req, res): Promise<void> => {
  const query = GetAdminReviewsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const rows = query.data.status
    ? await db
        .select()
        .from(reviewsTable)
        .where(eq(reviewsTable.status, query.data.status))
        .orderBy(desc(reviewsTable.createdAt))
    : await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt));
  res.json(GetAdminReviewsResponse.parse(rows.map(mapReview)));
});

router.patch("/admin/reviews/:id", async (req, res): Promise<void> => {
  const params = ModerateReviewParams.safeParse(req.params);
  const body = ModerateReviewBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.error?.message ?? body.error?.message ?? "Invalid review update." });
    return;
  }
  const [review] = await db
    .update(reviewsTable)
    .set({ status: body.data.status })
    .where(eq(reviewsTable.id, params.data.id))
    .returning();
  if (!review) {
    res.status(404).json({ error: "Review not found." });
    return;
  }
  res.json(ModerateReviewResponse.parse(mapReview(review)));
});

router.delete("/admin/reviews/:id", async (req, res): Promise<void> => {
  const params = DeleteReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(reviewsTable)
    .where(eq(reviewsTable.id, params.data.id))
    .returning({ id: reviewsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Review not found." });
    return;
  }
  res.json(DeleteReviewResponse.parse({ success: true }));
});

router.get("/admin/menu", async (_req, res): Promise<void> => {
  res.json(GetAdminMenuResponse.parse(await getMenu(true)));
});

router.post("/admin/menu/categories", async (req, res): Promise<void> => {
  const body = CreateMenuCategoryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [category] = await db
    .insert(menuCategoriesTable)
    .values({ name: body.data.name.trim(), sortOrder: body.data.sort_order })
    .returning();
  const result: MenuCategory = {
    ...category,
    items: [],
  };
  res.status(201).json(CreateMenuCategoryResponse.parse({
    id: result.id,
    name: result.name,
    sort_order: result.sortOrder,
    items: [],
  }));
});

router.patch("/admin/menu/categories/:id", async (req, res): Promise<void> => {
  const params = UpdateMenuCategoryParams.safeParse(req.params);
  const body = UpdateMenuCategoryBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.error?.message ?? body.error?.message ?? "Invalid category update." });
    return;
  }
  const [category] = await db
    .update(menuCategoriesTable)
    .set({ name: body.data.name.trim(), sortOrder: body.data.sort_order })
    .where(eq(menuCategoriesTable.id, params.data.id))
    .returning();
  if (!category) {
    res.status(404).json({ error: "Menu category not found." });
    return;
  }
  const current = (await getMenu(true)).find((entry) => entry.id === category.id);
  res.json(UpdateMenuCategoryResponse.parse(current));
});

router.delete("/admin/menu/categories/:id", async (req, res): Promise<void> => {
  const params = DeleteMenuCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(menuCategoriesTable)
    .where(eq(menuCategoriesTable.id, params.data.id))
    .returning({ id: menuCategoriesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Menu category not found." });
    return;
  }
  res.json(DeleteMenuCategoryResponse.parse({ success: true }));
});

router.post("/admin/menu/items", async (req, res): Promise<void> => {
  const body = CreateMenuItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [category] = await db
    .select({ id: menuCategoriesTable.id })
    .from(menuCategoriesTable)
    .where(eq(menuCategoriesTable.id, body.data.category_id))
    .limit(1);
  if (!category) {
    res.status(400).json({ error: "Choose an existing menu category." });
    return;
  }
  const [item] = await db
    .insert(menuItemsTable)
    .values({
      categoryId: body.data.category_id,
      name: body.data.name.trim(),
      description: body.data.description.trim(),
      price: body.data.price,
      isAvailable: body.data.is_available,
      sortOrder: body.data.sort_order,
    })
    .returning();
  res.status(201).json(CreateMenuItemResponse.parse(mapMenuItem(item)));
});

router.patch("/admin/menu/items/:id", async (req, res): Promise<void> => {
  const params = UpdateMenuItemParams.safeParse(req.params);
  const body = UpdateMenuItemBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.error?.message ?? body.error?.message ?? "Invalid menu item update." });
    return;
  }
  if (Object.keys(body.data).length === 0) {
    res.status(400).json({ error: "Add at least one field to update." });
    return;
  }
  if (body.data.category_id !== undefined) {
    const [category] = await db
      .select({ id: menuCategoriesTable.id })
      .from(menuCategoriesTable)
      .where(eq(menuCategoriesTable.id, body.data.category_id))
      .limit(1);
    if (!category) {
      res.status(400).json({ error: "Choose an existing menu category." });
      return;
    }
  }

  const update = {
    ...(body.data.category_id !== undefined ? { categoryId: body.data.category_id } : {}),
    ...(body.data.name !== undefined ? { name: body.data.name.trim() } : {}),
    ...(body.data.description !== undefined ? { description: body.data.description.trim() } : {}),
    ...(body.data.price !== undefined ? { price: body.data.price } : {}),
    ...(body.data.is_available !== undefined ? { isAvailable: body.data.is_available } : {}),
    ...(body.data.sort_order !== undefined ? { sortOrder: body.data.sort_order } : {}),
  };
  const [item] = await db
    .update(menuItemsTable)
    .set(update)
    .where(eq(menuItemsTable.id, params.data.id))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Menu item not found." });
    return;
  }
  res.json(UpdateMenuItemResponse.parse(mapMenuItem(item)));
});

router.delete("/admin/menu/items/:id", async (req, res): Promise<void> => {
  const params = DeleteMenuItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(menuItemsTable)
    .where(eq(menuItemsTable.id, params.data.id))
    .returning({ id: menuItemsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Menu item not found." });
    return;
  }
  res.json(DeleteMenuItemResponse.parse({ success: true }));
});

router.get("/admin/gallery", async (_req, res): Promise<void> => {
  res.json(GetAdminGalleryResponse.parse(await getGallery()));
});

router.post("/admin/gallery", async (req, res): Promise<void> => {
  const body = CreateGalleryImageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const url = body.data.url.trim();
  if (!safeImageUrl(url)) {
    res.status(400).json({ error: "Use an http(s) image URL or a local path beginning with /." });
    return;
  }
  const [image] = await db
    .insert(galleryImagesTable)
    .values({ url, caption: body.data.caption.trim(), sortOrder: body.data.sort_order })
    .returning();
  res.status(201).json(CreateGalleryImageResponse.parse(mapGalleryImage(image)));
});

router.patch("/admin/gallery/:id", async (req, res): Promise<void> => {
  const params = UpdateGalleryImageParams.safeParse(req.params);
  const body = UpdateGalleryImageBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.error?.message ?? body.error?.message ?? "Invalid image update." });
    return;
  }
  const url = body.data.url.trim();
  if (!safeImageUrl(url)) {
    res.status(400).json({ error: "Use an http(s) image URL or a local path beginning with /." });
    return;
  }
  const [image] = await db
    .update(galleryImagesTable)
    .set({ url, caption: body.data.caption.trim(), sortOrder: body.data.sort_order })
    .where(eq(galleryImagesTable.id, params.data.id))
    .returning();
  if (!image) {
    res.status(404).json({ error: "Gallery image not found." });
    return;
  }
  res.json(UpdateGalleryImageResponse.parse(mapGalleryImage(image)));
});

router.delete("/admin/gallery/:id", async (req, res): Promise<void> => {
  const params = DeleteGalleryImageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(galleryImagesTable)
    .where(eq(galleryImagesTable.id, params.data.id))
    .returning({ id: galleryImagesTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Gallery image not found." });
    return;
  }
  res.json(DeleteGalleryImageResponse.parse({ success: true }));
});

export default router;
