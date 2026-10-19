import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { eq } from "drizzle-orm";
import type { Request, RequestHandler } from "express";
import { adminUsersTable, db } from "@workspace/db";
import { logger } from "./logger";

export const ADMIN_COOKIE = "afternoons_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const derived = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, salt, expected] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const actualBuffer = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "base64url");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function getSessionSecret(): string | null {
  return process.env.SESSION_SECRET?.trim() || null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminSession(username: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const payload = Buffer.from(
    JSON.stringify({ username, expiresAt: Date.now() + SESSION_TTL_MS }),
  ).toString("base64url");
  return `${payload}.${signPayload(payload, secret)}`;
}

export function readAdminSession(token: unknown): string | null {
  const secret = getSessionSecret();
  if (!secret || typeof token !== "string") return null;
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return null;
  const expectedSignature = signPayload(payload, secret);
  const expectedBuffer = Buffer.from(expectedSignature);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      username?: unknown;
      expiresAt?: unknown;
    };
    if (
      typeof decoded.username !== "string" ||
      typeof decoded.expiresAt !== "number" ||
      decoded.expiresAt <= Date.now()
    ) {
      return null;
    }
    return decoded.username;
  } catch {
    return null;
  }
}

export async function syncAdminUserFromSecrets(): Promise<void> {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    logger.warn("Admin login is not configured; /api/admin/login will remain disabled");
    return;
  }
  if (username.length > 80 || password.length < 12 || password.length > 200) {
    logger.warn("Admin credentials are invalid; use a username up to 80 characters and a password of 12–200 characters");
    return;
  }

  const currentUsers = await db.select().from(adminUsersTable).limit(2);
  const passwordHash = hashPassword(password);
  if (currentUsers.length === 1) {
    await db
      .update(adminUsersTable)
      .set({ username, passwordHash })
      .where(eq(adminUsersTable.id, currentUsers[0].id));
  } else {
    await db
      .insert(adminUsersTable)
      .values({ username, passwordHash })
      .onConflictDoUpdate({
        target: adminUsersTable.username,
        set: { passwordHash },
      });
  }
  logger.info("Owner admin account synchronized from configured secrets");
}

export async function getAdminUsernameFromRequest(req: Request): Promise<string | null> {
  const username = readAdminSession(req.cookies?.[ADMIN_COOKIE]);
  if (!username) return null;
  const [admin] = await db
    .select({ username: adminUsersTable.username })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, username))
    .limit(1);
  return admin?.username ?? null;
}

export const requireAdmin: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const username = await getAdminUsernameFromRequest(req);
    if (!username) {
      res.status(401).json({ error: "Please sign in to continue." });
      return;
    }
    (req as Request & { adminUsername?: string }).adminUsername = username;
    next();
  } catch (error) {
    req.log.error({ err: error }, "Admin session check failed");
    res.status(500).json({ error: "Unable to check the admin session." });
  }
}
