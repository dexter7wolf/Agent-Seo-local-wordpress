import { router, publicProcedure } from "./trpc";
import { articleRouter } from "./routers/article";
import { z } from "zod";

export const appRouter = router({
    article: articleRouter,
    hello: publicProcedure
        .input(z.object({ text: z.string() }))
        .query(({ input }) => {
            return {
                greeting: `Hello ${input.text}`,
            };
        }),
});

export type AppRouter = typeof appRouter;
