import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StudyRequest = {
  question?: string;
  subject?: string;
  grade?: string;
  language?: string;
  mode?: "explain" | "solve" | "quiz" | "summarize" | "flashcards";
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function buildPrompt(input: StudyRequest) {
  const mode = input.mode ?? "explain";
  const language = input.language ?? "English";

  const modeInstruction = {
    explain:
      "Explain the concept clearly from basics, using simple steps and a short example.",
    solve:
      "Solve the problem step by step. Show the important reasoning and final answer.",
    quiz:
      "Create a short practice quiz based on the topic. Do not reveal answers immediately.",
    summarize:
      "Give a concise student-friendly summary with key points and important formulas or facts.",
    flashcards:
      "Create useful question-and-answer flashcards for revision.",
  }[mode];

  return `
You are EduConnect Study AI, an educational assistant.

Student grade: ${input.grade ?? "Not specified"}
Subject: ${input.subject ?? "General"}
Language preference: ${language}
Task mode: ${mode}

${modeInstruction}

Student request:
${input.question ?? ""}

Rules:
- Be accurate and age-appropriate.
- Prefer clear headings and short sections.
- Use simple language.
- Do not invent textbook references or sources.
- If the question is ambiguous, state the assumption you are making.
- For calculations, show enough steps for the student to understand.
- Do not claim to be a teacher or human.
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as StudyRequest;

    if (!body.question?.trim()) {
      return json({ error: "Question is required." }, 400);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return json(
        {
          error:
            "Study AI is not configured. Add OPENAI_API_KEY to Supabase Edge Function secrets.",
        },
        503,
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") ?? "gpt-5-mini",
        input: buildPrompt(body),
        max_output_tokens: 1800,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", result);
      return json(
        {
          error:
            result?.error?.message ??
            "Study AI could not generate a response.",
        },
        response.status,
      );
    }

    const output =
      result.output_text ??
      result.output
        ?.flatMap((item: any) => item.content ?? [])
        ?.filter((item: any) => item.type === "output_text")
        ?.map((item: any) => item.text)
        ?.join("\n") ??
      "";

    if (!output.trim()) {
      return json({ error: "Study AI returned an empty response." }, 502);
    }

    return json({
      answer: output,
      model: result.model ?? Deno.env.get("OPENAI_MODEL") ?? "gpt-5-mini",
    });
  } catch (error) {
    console.error("study-ai error:", error);

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected Study AI error.",
      },
      500,
    );
  }
});
