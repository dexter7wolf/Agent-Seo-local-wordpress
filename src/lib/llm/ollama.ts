export const generateText = async (prompt: string, model: string = "llama3") => {
    const response = await fetch(`${process.env.OLLAMA_HOST}/api/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false,
        }),
    });

    if (!response.ok) {
        throw new Error(`Ollama Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
};

export const analyzeImage = async (imageBase64: string, prompt: string, model: string = "llava") => {
    const response = await fetch(`${process.env.OLLAMA_HOST}/api/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            images: [imageBase64],
            stream: false,
        }),
    });

    if (!response.ok) {
        throw new Error(`Ollama Vision Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
};
