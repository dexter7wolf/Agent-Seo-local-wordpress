import { describe, it, expect, vi } from "vitest";
import { generateText } from "../src/lib/llm/ollama";

vi.stubGlobal("fetch", vi.fn());

describe("Ollama Integration", () => {
    it("should generate text correctly", async () => {
        const mockResponse = { response: "Synthesized SEO content" };
        (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const result = await generateText("Test prompt");
        expect(result).toBe("Synthesized SEO content");
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/generate"),
            expect.any(Object)
        );
    });

    it("should throw error on fetch failure", async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
            statusText: "Not Found",
        });

        await expect(generateText("Test prompt")).rejects.toThrow("Ollama Error: Not Found");
    });
});
