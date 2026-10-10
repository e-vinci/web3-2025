import { useEffect, useState } from "react";
import type { Category } from "../types/Category";
import { apiRequest } from "../lib/rest";

function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Category[]>("/api/categories")
      .then(setCategories)
      .catch((error) => console.error("Error getting categories:", error))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}

export default useCategories;
