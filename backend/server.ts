import express, { type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import path from "path";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

app.post("/api/chat", async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Set HTTP headers for text streaming
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    // Stream each word packet to the browser as it arrives!
    for await (const chunk of responseStream) {
      res.write(chunk.text ?? "");
    }

    res.end(); // close connection when done
  } catch (error: any) {
    console.error("Error:", error);
    res.write("\n[Error generating response]");
    res.end();
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Chat app running at: http://localhost:${PORT}`);
});
