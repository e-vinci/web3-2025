export interface GraphQLContext {
  user?: {
    userId: number;
    email: string;
  };
}