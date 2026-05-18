import { generateText } from "@/lib/llm/ollama";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const slug = process.argv[2];
    if (!slug) {
        console.error("Please provide an article slug.");
        process.exit(1);
    }

    try {
        const articlePath = path.join(process.cwd(), "temp", "articles", `${slug}.json`);
        const seoPath = path.join(process.cwd(), "temp", "seo", `${slug}.json`);

        if (!fs.existsSync(articlePath) || !fs.existsSync(seoPath)) {
            throw new Error(`Article or SEO metadata not found for slug: ${slug}`);
        }

        const article = JSON.parse(fs.readFileSync(articlePath, "utf-8"));
        const seo = JSON.parse(fs.readFileSync(seoPath, "utf-8"));

        const prompt = `
      You are an SEO expert. Please synthesize the following article content with the provided SEO metadata.
      
      ARTICLE CONTENT:
      ${JSON.stringify(article.sections)}
      
      SEO METADATA:
      ${JSON.stringify(seo)}
      
      STRICT REQUIREMENTS:
      1. Preserve the exact wording of the original content.
      2. If images are present, generate SEO-optimized alt-text for them.
      3. Return a clean JSON object with the finalized content and metadata.
    `;

        const finalContent = await generateText(prompt);

        const finalPath = path.join(process.cwd(), "temp", "final");
        if (!fs.existsSync(finalPath)) fs.mkdirSync(finalPath, { recursive: true });

        fs.writeFileSync(
            path.join(finalPath, `${slug}-final.json`),
            JSON.stringify({ content: finalContent, seo }, null, 2)
        );

        console.log(`Synthesized article saved to temp/final/${slug}-final.json`);
    } catch (error) {
        console.error("Synthesis failed:", error);
    }
}

if (require.main === module) {
    main();
}
