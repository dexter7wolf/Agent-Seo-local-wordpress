import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const articleRouter = router({
    process: protectedProcedure
        .input(z.object({ docId: z.string() }))
        .mutation(async ({ input }) => {
            const { docId } = input;

            try {
                // Sequentially execute the pipeline scripts
                // In a production app, you'd use a job queue like BullMQ
                console.log(`Starting pipeline for ${docId}`);

                await execAsync(`npx tsx scripts/extract-article.ts ${docId}`);
                // For the sake of the demo, we'll use a dummy slug 'demo-article'
                const slug = "demo-article";

                // This is a simplified chain
                // await execAsync(`npx tsx scripts/fetch-seo-metadata.ts ${sheetId} ${slug}`);
                // await execAsync(`npx tsx scripts/synthesize-content.ts ${slug}`);
                // await execAsync(`npx tsx scripts/upload-media.ts ${slug}`);
                // await execAsync(`npx tsx scripts/create-draft.ts ${slug}`);

                return { success: true, message: "Pipeline started successfully" };
            } catch (error: any) {
                throw new Error(`Pipeline failed: ${error.message}`);
            }
        }),
});
