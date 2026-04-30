import { z } from "zod";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

const generateBioSchema = z.object({
  display_name: z.string().trim().max(120).optional().default(""),
  role: z.string().trim().max(120).optional().default(""),
  experience: z.array(z.string().trim().max(240)).optional().default([]),
  skills: z.array(z.string().trim().max(80)).optional().default([]),
});

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

function buildFallbackSuggestions(input: z.infer<typeof generateBioSchema>) {
  const name = input.display_name || "Creator";
  const role = input.role || "creative creator";
  const primaryExperience =
    input.experience.find((item) => item.trim().length > 0) ||
    "membantu brand dan client membangun konten yang rapi";
  const skills = input.skills.filter(Boolean).slice(0, 3).join(", ");
  const skillText = skills ? ` dengan fokus pada ${skills}` : "";

  return [
    `${name} adalah ${role} yang berfokus pada karya video clean, terarah, dan mudah dipresentasikan ke client${skillText}.`,
    `${role} dengan pengalaman ${primaryExperience}. Siap membantu project kreatif dari konsep sampai hasil akhir yang siap dibagikan.`,
    `Saya ${name}, ${role} yang mengutamakan storytelling visual, detail eksekusi, dan output profesional untuk kebutuhan brand maupun personal${skillText}.`,
  ];
}

function buildGeminiPrompt(input: z.infer<typeof generateBioSchema>) {
  const experience = input.experience.filter(Boolean).slice(0, 5).join("; ") || "Belum ada experience detail";
  const skills = input.skills.filter(Boolean).slice(0, 8).join(", ") || "Belum ada skill detail";

  return [
    "Buat 3 opsi bio singkat untuk creator Showreels.id dalam Bahasa Indonesia.",
    "Syarat: tiap bio maksimal 220 karakter, profesional, hangat, fokus pada portfolio video/creative work, tanpa emoji, tanpa markdown, tanpa numbering.",
    `Nama: ${input.display_name || "Creator"}`,
    `Role: ${input.role || "creative creator"}`,
    `Experience: ${experience}`,
    `Skills: ${skills}`,
    "Balas hanya JSON array string, contoh: [\"bio 1\",\"bio 2\",\"bio 3\"].",
  ].join("\n");
}

function extractGeminiSuggestions(payload: GeminiResponse) {
  const text = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts?.map((part) => part.text || "") || [])
    .join("\n")
    .trim();

  if (!text) return [];

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim().slice(0, 240))
          .filter(Boolean)
          .slice(0, 3);
      }
    } catch {
      // Fall through to line parsing.
    }
  }

  return text
    .split("\n")
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim().slice(0, 240))
    .filter(Boolean)
    .slice(0, 3);
}

async function generateGeminiSuggestions(input: z.infer<typeof generateBioSchema>) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildGeminiPrompt(input) }],
          },
        ],
        generationConfig: {
          temperature: 0.75,
          topP: 0.9,
          maxOutputTokens: 320,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) return null;

  const payload = (await response.json().catch(() => null)) as GeminiResponse | null;
  if (!payload) return null;

  const suggestions = extractGeminiSuggestions(payload);
  return suggestions.length > 0 ? suggestions : null;
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(currentUser.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan fitur creator." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = generateBioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Payload bio tidak valid." },
      { status: 400 }
    );
  }

  const suggestions =
    (await generateGeminiSuggestions(parsed.data).catch(() => null)) ||
    buildFallbackSuggestions(parsed.data);

  return NextResponse.json({
    success: true,
    suggestions,
  });
}
