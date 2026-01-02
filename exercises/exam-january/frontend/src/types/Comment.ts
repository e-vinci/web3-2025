import type { User } from './User';

export interface Comment {
  id: string;
  content: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  author: User;
}

export interface NewCommentPayload {
  content: string;
  authorId: number;
  expenseId: number;
}

export interface UpdateCommentPayload {
  id: number;
  content: string;
}
