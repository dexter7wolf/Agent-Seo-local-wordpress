import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware for protected procedures could be added here
export const protectedProcedure = t.procedure.use(async ({ next, ctx }) => {
    // Add auth check here once NextAuth is configured
    return next();
});
