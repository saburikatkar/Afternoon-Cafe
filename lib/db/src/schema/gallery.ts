import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const galleryImagesTable = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertGalleryImageSchema = createInsertSchema(galleryImagesTable).omit({ id: true });
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type GalleryImage = typeof galleryImagesTable.$inferSelect;
