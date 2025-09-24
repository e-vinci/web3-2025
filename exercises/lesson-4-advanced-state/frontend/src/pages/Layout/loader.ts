import ApiClient, { type User } from '@/lib/api';

export interface LoaderData {
  users: User[];
}

export async function loader() {
  const users = await ApiClient.getUsers();
  return { users };
}
