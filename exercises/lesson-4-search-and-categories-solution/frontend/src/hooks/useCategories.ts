import { useEffect, useState } from "react";
import type { Category } from "../types/Category";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function fetchAllCategories() {
  return fetch(`${API_BASE_URL}/api/categories`)
    .then((res) => res.json())
    .then((data) => (Array.isArray(data) ? (data as Category[]) : []))
    .catch((error) => {
      console.error("Error getting categories:", error);
      return [] as Category[];
    });
}

function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}

export default useCategories;