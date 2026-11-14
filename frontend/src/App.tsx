import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! I am your AI assistant. Ask me anything!" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to bottom as new tokens arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userPrompt = input.trim();
    setInput("");
    setIsLoading(true);

    // 1. Add user message + empty placeholder bubble for AI
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userPrompt },
      { role: "ai", text: "" },
    ]);

    try {
      // 2. Call your Express backend
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!response.body) throw new Error("No response body");

      // 3. Read stream chunk-by-chunk
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        // 4. Update the last AI message live
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          const currentAiMessage = updated[lastIndex];
          if (currentAiMessage) {
            updated[lastIndex] = {
              ...currentAiMessage,
              text: currentAiMessage.text + chunk,
            };
          }
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Error: Failed to connect to server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur py-4 px-6 text-center sticky top-0 z-10">
        <h1 className="text-lg font-semibold tracking-wide text-indigo-400 flex items-center justify-center gap-2">
          Minimal AI Chat
        </h1>
      </header>

      {/* Chat Messages Feed */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-4 max-w-3xl w-full mx-auto">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={index}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-br-xs"
                    : "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-xs"
                }`}
              >
                {msg.text || (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-400 animate-pulse delay-150"></span>
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-400 animate-pulse delay-300"></span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Floating Bottom Input Bar */}
      <footer className="p-4 bg-slate-950 border-t border-slate-800/80">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-5 py-3 rounded-xl transition duration-200 shadow-md flex items-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}
