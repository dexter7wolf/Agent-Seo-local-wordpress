import { z } from "zod";

const wpMediaSchema = z.object({
    id: z.number(),
    source_url: z.string().url(),
});

const wpPostSchema = z.object({
    id: z.number(),
    link: z.string().url(),
    status: z.string(),
});

export const createWPPost = async (data: {
    title: string;
    content: string;
    status?: string;
}) => {
    const auth = Buffer.from(
        `${process.env.WP_USERNAME}:${process.env.WP_APPLICATION_PASSWORD}`
    ).toString("base64");

    const response = await fetch(`${process.env.WP_URL}/wp-json/wp/v2/posts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`WordPress API Error: ${JSON.stringify(error)}`);
    }

    return wpPostSchema.parse(await response.json());
};

export const uploadWPMedia = async (fileBuffer: Buffer, fileName: string) => {
    const auth = Buffer.from(
        `${process.env.WP_USERNAME}:${process.env.WP_APPLICATION_PASSWORD}`
    ).toString("base64");

    const response = await fetch(`${process.env.WP_URL}/wp-json/wp/v2/media`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Content-Type": "image/jpeg", // Should be dynamic based on file type
        },
        body: fileBuffer as any,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`WordPress Media Upload Error: ${JSON.stringify(error)}`);
    }

    return wpMediaSchema.parse(await response.json());
};
