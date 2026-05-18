import { fetchDocContent, getGoogleAuth } from "@/lib/integrations/google";
import * as fs from "fs";
import * as path from "path";

/**
 * Basic parser for Google Docs elements.
 * This is a simplified version; in a real-world scenario, you'd handle more element types.
 */
function parseDocContent(doc: any) {
    const content: any[] = [];
    const body = doc.body.content;

    body.forEach((element: any) => {
        if (element.paragraph) {
            const text = element.paragraph.elements
                .map((e: any) => e.textRun?.content || "")
                .join("");
            const style = element.paragraph.paragraphStyle?.namedStyleType;

            if (text.trim()) {
                content.push({ type: "paragraph", text, style });
            }
        } else if (element.inlineObjectElement) {
            // Logic for images could go here
        }
    });

    return {
        title: doc.title,
        sections: content,
    };
}

async function main() {
    const docId = process.argv[2];
    if (!docId) {
        console.error("Please provide a Google Doc ID.");
        process.exit(1);
    }

    const auth = getGoogleAuth();
    // In a real CLI, you'd handle token exchange here. 
    // For now, we assume auth is handled or credentials are in env.

    try {
        const doc = await fetchDocContent(docId, auth);
        const structuredArticle = parseDocContent(doc);

        const tempPath = path.join(process.cwd(), "temp", "articles");
        if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });

        fs.writeFileSync(
            path.join(tempPath, `${docId}.json`),
            JSON.stringify(structuredArticle, null, 2)
        );

        console.log(`Article extracted to temp/articles/${docId}.json`);
    } catch (error) {
        console.error("Extraction failed:", error);
    }
}

// Only run if called directly
if (require.main === module) {
    main();
}
