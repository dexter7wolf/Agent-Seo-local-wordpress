import { uploadWPMedia } from "@/lib/integrations/wordpress";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const slug = process.argv[2];
    if (!slug) {
        console.error("Please provide an article slug.");
        process.exit(1);
    }

    try {
        const imagesDir = path.join(process.cwd(), "temp", "images", slug);
        if (!fs.existsSync(imagesDir)) {
            console.log("No images found for this article.");
            return;
        }

        const files = fs.readdirSync(imagesDir);
        const uploadResults = [];

        for (const file of files) {
            const filePath = path.join(imagesDir, file);
            const buffer = fs.readFileSync(filePath);

            console.log(`Uploading ${file}...`);
            const result = await uploadWPMedia(buffer, file);
            uploadResults.push({ file, wpId: result.id, url: result.source_url });
        }

        const resultsPath = path.join(process.cwd(), "temp", "uploads");
        if (!fs.existsSync(resultsPath)) fs.mkdirSync(resultsPath, { recursive: true });

        fs.writeFileSync(
            path.join(resultsPath, `${slug}-uploads.json`),
            JSON.stringify(uploadResults, null, 2)
        );

        console.log(`Media upload results saved to temp/uploads/${slug}-uploads.json`);
    } catch (error) {
        console.error("Media upload failed:", error);
    }
}

if (require.main === module) {
    main();
}
