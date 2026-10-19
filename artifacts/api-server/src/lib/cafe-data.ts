import { asc, inArray } from "drizzle-orm";
import { db, galleryImagesTable, menuCategoriesTable, menuItemsTable } from "@workspace/db";

export async function getMenu(includeUnavailable = false) {
  const categories = await db
    .select()
    .from(menuCategoriesTable)
    .orderBy(asc(menuCategoriesTable.sortOrder), asc(menuCategoriesTable.id));

  if (categories.length === 0) return [];

  const items = await db
    .select()
    .from(menuItemsTable)
    .where(inArray(menuItemsTable.categoryId, categories.map((category) => category.id)))
    .orderBy(asc(menuItemsTable.sortOrder), asc(menuItemsTable.id));

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    sort_order: category.sortOrder,
    items: items
      .filter((item) => item.categoryId === category.id)
      .filter((item) => includeUnavailable || item.isAvailable)
      .map((item) => ({
        id: item.id,
        category_id: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        is_available: item.isAvailable,
        sort_order: item.sortOrder,
      })),
  }));
}

export async function getGallery() {
  const rows = await db
    .select()
    .from(galleryImagesTable)
    .orderBy(asc(galleryImagesTable.sortOrder), asc(galleryImagesTable.id));

  return rows.map((image) => ({
    id: image.id,
    url: image.url,
    caption: image.caption,
    sort_order: image.sortOrder,
  }));
}

export function mapReview(row: {
  id: number;
  name: string;
  rating: number;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    message: row.message,
    status: row.status,
    created_at: row.createdAt.toISOString(),
  };
}

export function mapMenuItem(row: {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  sortOrder: number;
}) {
  return {
    id: row.id,
    category_id: row.categoryId,
    name: row.name,
    description: row.description,
    price: row.price,
    is_available: row.isAvailable,
    sort_order: row.sortOrder,
  };
}

export function mapGalleryImage(row: {
  id: number;
  url: string;
  caption: string;
  sortOrder: number;
}) {
  return {
    id: row.id,
    url: row.url,
    caption: row.caption,
    sort_order: row.sortOrder,
  };
}
