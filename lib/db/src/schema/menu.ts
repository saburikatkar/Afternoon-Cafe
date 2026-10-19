import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, numeric, pgTable, serial, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod/v4";

export const menuCategoriesTable = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const menuItemsTable = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => menuCategoriesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const menuCategoriesRelations = relations(menuCategoriesTable, ({ many }) => ({
  items: many(menuItemsTable),
}));

export const menuItemsRelations = relations(menuItemsTable, ({ one }) => ({
  category: one(menuCategoriesTable, {
    fields: [menuItemsTable.categoryId],
    references: [menuCategoriesTable.id],
  }),
}));

export const insertMenuCategorySchema = createInsertSchema(menuCategoriesTable).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItemsTable).omit({ id: true });
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuCategory = typeof menuCategoriesTable.$inferSelect;
export type MenuItem = typeof menuItemsTable.$inferSelect;
