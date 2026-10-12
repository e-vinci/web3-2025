import { z } from "zod";

export const categorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(50),
  colour: z.string().min(1),
});

export type Category = z.infer<typeof categorySchema>;

/** The shape Prisma gives us for a `category` row. */
export interface CategoryDBO {
  id: number;
  name: string;
  colour: string;
}

export function categoryFromDBO(dbo: CategoryDBO): Category {
  return {
    id: dbo.id,
    name: dbo.name,
    colour: dbo.colour,
  };
}
