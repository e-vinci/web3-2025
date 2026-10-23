import type { UserJWT } from "./auth.ts";

/**
 * What every resolver is handed as its third argument.
 *
 * `userJWT` is optional on purpose: a request with no token is not an error at
 * this layer. The context's job is to answer "who is asking?", and "nobody" is
 * a valid answer. Deciding whether that is good enough is each resolver's job —
 * see `graphql/authHelpers.ts`.
 *
 * The name is `userJWT`, not `user`, because it is not one. It is the claims
 * the server signed, with no name and no bank account in it. Keeping the names
 * apart keeps the call sites honest: `ctx.userJWT.userId` is a claim out of a
 * token, `user.id` is a row out of the database.
 */
export interface GraphQLContext {
  userJWT?: UserJWT;
}
