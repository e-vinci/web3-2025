import { useState, useEffect } from "react";
import type { User } from "../types/User";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function fetchAllUsers(): Promise<User[]> {
  return fetch(`${API_BASE_URL}/api/users`)
    .then((res) => res.json())
    .then((data) => (Array.isArray(data) ? (data as User[]) : []))
    .catch((error) => {
      console.error("Error getting users:", error);
      return [] as User[];
    });
}

function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
}

export default useUsers;
