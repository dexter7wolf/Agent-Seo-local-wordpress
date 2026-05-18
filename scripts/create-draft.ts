import { wpBrowser } from "@/server/agents/playwright-client";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const slug = process.argv[2];
    if (!slug) {
        console.error("Please provide an article slug.");
        process.exit(1);
    }

    try {
        const finalPath = path.join(process.cwd(), "temp", "final", `${slug}-final.json`);
        if (!fs.existsSync(finalPath)) {
            throw new Error(`Final synthesized article not found for slug: ${slug}`);
        }

        const { content, seo } = JSON.parse(fs.readFileSync(finalPath, "utf-8"));

        const page = await wpBrowser.createPage();
        await wpBrowser.loginToWordPress(page);

        console.log("Creating new post...");
        await page.goto(`${process.env.WP_URL}/wp-admin/post-new.php`);

        // Note: Selectors for Gutenberg vary, this is a general approach
        await page.fill(".editor-post-title__input", seo.title || "Untitled Article");

        // Inject content (simplified for this example)
        // In a real scenario, you'd use Gutenberg blocks
        await page.evaluate((html) => {
            const editor = document.querySelector(".editor-styles-wrapper");
            if (editor) editor.innerHTML = html;
        }, content);

        // Inject Yoast SEO fields if plugin is active
        console.log("Injecting Yoast SEO fields...");
        // These selectors are specific to Yoast Local SEO/Standard
        await page.fill("#yoast_wpseo_focuskw", seo.focus_keyphrase || "");
        await page.fill("#yoast_wpseo_metadesc", seo.meta_description || "");

        await page.click("#save-post");
        console.log("Draft saved successfully.");

        await wpBrowser.close();
    } catch (error) {
        console.error("Draft creation failed:", error);
        await wpBrowser.close();
    }
}

if (require.main === module) {
    main();
}
