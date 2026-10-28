
import { Router } from "express";
import { CategoriesService } from "../services/categories.service.ts";

const router = Router();

router.get("/", async (_req, res) => {
  console.log("GET /api/categories");
  try {
    const categories = await CategoriesService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;