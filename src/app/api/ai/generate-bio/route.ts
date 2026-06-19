import { z } from "zod";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

const MAX_BIO_LENGTH = 700;

const generateBioSchema = z.object({
  display_name: z.string().trim().max(120).optional().default(""),
  displayName: z.string().trim().max(120).optional().default(""),
  role: z.string().trim().max(120).optional().default(""),
  experience: z
    .union([z.array(z.string().trim().max(240)), z.string().trim().max(700)])
    .optional()
    .default([]),
  existingBio: z.string().trim().max(MAX_BIO_LENGTH).optional().default(""),
  tone: z
    .enum(["professional", "friendly", "cinematic", "minimal", "confident"])
    .optional()
    .default("professional"),
  maxLength: z.coerce.number().int().min(120).max(MAX_BIO_LENGTH).optional().default(MAX_BIO_LENGTH),
  skills: z.array(z.string().trim().max(80)).optional().default([]),
  socialLinks: z.array(z.string().trim().max(160)).optional().default([]),
});

type GenerateBioInput = z.infer<typeof generateBioSchema>;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function normalizeInput(input: GenerateBioInput) {
  const displayName = input.displayName || input.display_name || "Creator";
  const experience = Array.isArray(input.experience)
    ? input.experience.filter(Boolean)
    : input.experience
      ? [input.experience]
      : [];

  return {
    ...input,
    displayName,
    experience,
    maxLength: Math.min(input.maxLength || MAX_BIO_LENGTH, MAX_BIO_LENGTH),
  };
}

function clampBio(text: string, maxLength: number) {
  const normalized = text
    .replace(/^```(?:text|markdown)?/i, "")
    .replace(/```$/i, "")
    .replace(/^bio\s*:/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxLength).trim();
  const lastSentence = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?")
  );

  return lastSentence > 120 ? truncated.slice(0, lastSentence + 1) : truncated.replace(/[,.!?;:]+$/, "");
}

function buildFallbackSuggestions(input: ReturnType<typeof normalizeInput>) {
  const role = input.role || "creative creator";
  const primaryExperience =
    input.experience.find((item) => item.trim().length > 0) ||
    "membantu brand dan client membangun konten yang rapi";
  const skills = input.skills.filter(Boolean).slice(0, 3).join(", ");
  const skillText = skills ? ` dengan fokus pada ${skills}` : "";

  return [
    `${input.displayName} adalah ${role} yang berfokus pada karya video clean, terarah, dan mudah dipresentasikan ke client${skillText}.`,
    `${role} dengan pengalaman ${primaryExperience}. Siap membantu project kreatif dari konsep sampai hasil akhir yang siap dibagikan.`,
    `Saya ${input.displayName}, ${role} yang mengutamakan storytelling visual, detail eksekusi, dan output profesional untuk kebutuhan brand maupun personal${skillText}.`,
  ].map((item) => clampBio(item, input.maxLength));
}

function buildGeminiPrompt(input: ReturnType<typeof normalizeInput>) {
  return [
    "Tulis bio singkat untuk halaman bio link creator Showreels.id.",
    "Ikuti bahasa dari data input user. Jika input dominan Bahasa Indonesia, jawab Bahasa Indonesia.",
    `Maksimal ${input.maxLength} karakter.`,
    "Jangan membuat klaim palsu, jangan menyebut brand/client yang tidak ada di input, dan jangan menggunakan bahasa berlebihan.",
    "Output hanya 1 bio final tanpa markdown, tanpa bullet, tanpa tanda kutip.",
    `Tone: ${input.tone}.`,
    `Display name: ${input.displayName}.`,
    `Role/profession: ${input.role || "Tidak diisi"}.`,
    `Experience: ${input.experience.length ? input.experience.join("; ") : "Tidak diisi"}.`,
    `Skills: ${input.skills.length ? input.skills.join(", ") : "Tidak diisi"}.`,
    `Social links/context: ${input.socialLinks.length ? input.socialLinks.join(", ") : "Tidak diisi"}.`,
    `Existing bio: ${input.existingBio || "Tidak ada"}.`,
  ].join("\n");
}

async function requestGeminiBio(input: ReturnType<typeof normalizeInput>) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
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
        temperature: input.tone === "minimal" ? 0.35 : 0.65,
        topP: 0.9,
        maxOutputTokens: 220,
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as GeminiResponse | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Gemini request failed.");
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join(" ")
    .trim();

  return text ? clampBio(text, input.maxLength) : null;
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

  const input = normalizeInput(parsed.data);
  const fallbackSuggestions = buildFallbackSuggestions(input);

  try {
    const bio = await requestGeminiBio(input);
    if (bio) {
      return NextResponse.json({
        success: true,
        bio,
        suggestions: [bio, ...fallbackSuggestions].slice(0, 3),
        provider: "gemini",
      });
    }
  } catch (error) {
    console.error("gemini_generate_bio_failed", {
      userId: currentUser.id,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return NextResponse.json({
    success: true,
    bio: fallbackSuggestions[0],
    suggestions: fallbackSuggestions,
    provider: "fallback",
  });
}
