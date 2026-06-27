import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string; action?: string };
    console.log("AI API called:", body);

    const { text, action } = body;

    if (!text || text.length > 10000) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: "No API key" }, { status: 500 });
    }

    const prompts: Record<string, string> = {
      fix: `Fix grammar and spelling in this text, return only the corrected text with no explanation:\n\n${text}`,
      summarize: `Summarize this text in 2-3 sentences, return only the summary with no explanation:\n\n${text}`,
      expand: `Expand this text with more detail, return only the expanded text with no explanation:\n\n${text}`,
      shorter: `Make this text shorter and concise, return only the result with no explanation:\n\n${text}`,
      professional: `Rewrite this text in a professional tone, return only the result with no explanation:\n\n${text}`,
    };

    const prompt = prompts[action ?? ""];
    if (!prompt) {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const modelId = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
    const { text: result } = await generateText({
      model: groq(modelId),
      prompt,
    });

    console.log("AI result:", result);
    return Response.json({ result });
  } catch (e) {
    console.error("AI route error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
