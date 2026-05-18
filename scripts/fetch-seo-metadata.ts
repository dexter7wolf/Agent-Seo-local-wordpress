import { fetchSheetMetadata, getGoogleAuth } from "@/lib/integrations/google";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const sheetId = process.argv[2];
    const slug = process.argv[3];

    if (!sheetId || !slug) {
        console.error("Usage: tsx scripts/fetch-seo-metadata.ts <sheetId> <slug>");
        process.exit(1);
    }

    const auth = getGoogleAuth();

    try {
        // Assuming metadata is in a sheet named 'SEO' or the first one
        const rows = await fetchSheetMetadata(sheetId, "A:Z", auth);

        if (!rows) throw new Error("No data found in sheet.");

        // Match row by slug (assuming slug is in column B, adjust as needed)
        const header = rows[0];
        const slugIndex = header.indexOf("slug");
        const metaRow = rows.find(row => row[slugIndex] === slug);

        if (!metaRow) {
            throw new Error(`No metadata found for slug: ${slug}`);
        }

        const metadata: Record<string, any> = {};
        header.forEach((col: string, i: number) => {
            metadata[col] = metaRow[i];
        });

        const tempPath = path.join(process.cwd(), "temp", "seo");
        if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });

        fs.writeFileSync(
            path.join(tempPath, `${slug}.json`),
            JSON.stringify(metadata, null, 2)
        );

        console.log(`SEO metadata for ${slug} saved to temp/seo/${slug}.json`);
    } catch (error) {
        console.error("Metadata fetch failed:", error);
    }
}

if (require.main === module) {
    main();
}
