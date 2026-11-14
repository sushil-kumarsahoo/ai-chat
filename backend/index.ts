import {GoogleGenAI} from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
})

async function main(): Promise<void> {
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: "Give me 3 tips for learning typescript quickly.",
        config: {
            temperature: 0.7,
            systemInstruction: "You are an expert senior typescript developer.",
        },
    });
    console.log(response.text);
}

main().catch(console.error);