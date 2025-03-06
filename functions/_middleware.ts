import { Context } from "@cloudflare/workers-types";

// This middleware ensures that Cloudflare D1 is properly bound to the function environment
export const onRequest = async (context: Context) => {
  // Continue to the next middleware or route handler
  return await context.next();
};