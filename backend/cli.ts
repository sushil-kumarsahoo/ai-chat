import { GoogleGenAI } from "@google/genai";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import chalk from "chalk";
import ora from "ora";
import "dotenv/config";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

async function runCli(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  const chat = ai.chats.create({
    model: "gemini-3.5-flash",
    config: {
      systemInstruction:
        "You are a helpful, concise AI assistant in a terminal cli.",
    },
  });

  console.log("\n========================================");
  console.log("🤖 AI Terminal Assistant is ready!");
  console.log("Type your question and press Enter.");
  console.log("Type 'exit' or 'quit' to close.");
  console.log("========================================\n");

  while (true) {
    const userInput = await rl.question(chalk.bold.blue("You > "));

    if (
      userInput.trim().toLowerCase() === "exit" ||
      userInput.trim().toLowerCase() === "quit"
    ) {
      console.log("\nGoodbye! 👋\n");
      rl.close();
      break;
    }

    if (!userInput.trim()) continue;

    const spinner = ora({
      text: chalk.gray("Thinking..."),
      spinner: "dots",
    }).start();

    try {
      const responseStream = await chat.sendMessageStream({
        message: userInput,
      });

      let isFirstChunk = true;

      for await (const chunk of responseStream) {
        if (isFirstChunk) {
          spinner.stop();
          process.stdout.write(chalk.bold.green("AI  > "));
          isFirstChunk = false;
        }
        const text = chunk.text ?? "";
        for (const char of text) {
          process.stdout.write(chalk.white(char));
          await sleep(80);
        }
      }
    } catch (error: any) {
      spinner.fail(chalk.red("Failed to generate response!"));
      console.error(chalk.red(error.message), "\n");
    }
  }
}

runCli();
