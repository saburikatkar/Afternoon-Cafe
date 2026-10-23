import { db, galleryImagesTable, menuCategoriesTable, menuItemsTable, reviewsTable } from "@workspace/db";
import { logger } from "./logger";
import { syncAdminUserFromSecrets } from "./admin-auth";

export async function initializeCafeData(): Promise<void> {
  const categories = await db.select().from(menuCategoriesTable).limit(1);
  if (categories.length === 0) {
    const insertedCategories = await db
      .insert(menuCategoriesTable)
      .values([
        { name: "Coffee & chai", sortOrder: 0 },
        { name: "Something savoury", sortOrder: 1 },
        { name: "A little sweet", sortOrder: 2 },
      ])
      .returning();

    const [drinks, savoury, sweets] = insertedCategories;
    await db.insert(menuItemsTable).values([
      { categoryId: drinks.id, name: "House chai", description: "A small, comforting cup.", price: 80, sortOrder: 0 },
      { categoryId: drinks.id, name: "Filter coffee", description: "Strong, warm and familiar.", price: 120, sortOrder: 1 },
      { categoryId: drinks.id, name: "Cold coffee", description: "A chilled cafe favourite.", price: 190, sortOrder: 2 },
      { categoryId: savoury.id, name: "Classic toastie", description: "A crisp, warm sandwich.", price: 220, sortOrder: 0 },
      { categoryId: savoury.id, name: "Masala fries", description: "Golden fries with a little spice.", price: 180, sortOrder: 1 },
      { categoryId: savoury.id, name: "Clubhouse snack plate", description: "A sample shareable plate.", price: 400, sortOrder: 2 },
      { categoryId: sweets.id, name: "Brownie", description: "A little something with your coffee.", price: 170, sortOrder: 0 },
      { categoryId: sweets.id, name: "Warm brownie & ice cream", description: "A warm-and-cold favourite.", price: 240, sortOrder: 1 },
    ]);
    logger.info("Afternoons Cafe sample menu seeded");
  }

  const existingReviews = await db.select({ id: reviewsTable.id }).from(reviewsTable).limit(1);
  if (existingReviews.length === 0) {
    await db.insert(reviewsTable).values([
      {
        name: "Sample guest 1",
        rating: 5,
        message: "Sample setup review. Replace this with a real guest's words before launch.",
        status: "approved",
      },
      {
        name: "Sample guest 2",
        rating: 4,
        message: "Sample setup review. Replace this with a real guest's words before launch.",
        status: "approved",
      },
      {
        name: "Sample guest 3",
        rating: 5,
        message: "Sample setup review. Replace this with a real guest's words before launch.",
        status: "approved",
      },
    ]);
    logger.info("Afternoons Cafe sample reviews seeded");
  }

  const existingGalleryImages = await db
    .select({ id: galleryImagesTable.id })
    .from(galleryImagesTable)
    .limit(1);
  if (existingGalleryImages.length === 0) {
    await db.insert(galleryImagesTable).values([
      {
        url: "/images/cafe-balcony-evening.webp",
        caption: "A balcony seat beneath the lanterns",
        sortOrder: 0,
      },
      {
        url: "/images/cafe-woven-canopy.webp",
        caption: "The woven canopy, lit for the evening",
        sortOrder: 1,
      },
      {
        url: "/images/cafe-evening-seats.webp",
        caption: "Tables tucked under the warm lights",
        sortOrder: 2,
      },
    ]);
    logger.info("Afternoons Cafe uploaded photos added to the gallery");
  }

  await syncAdminUserFromSecrets();
}
