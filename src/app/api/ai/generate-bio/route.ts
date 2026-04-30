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

  return NextResponse.json({
    success: true,
    suggestions: buildFallbackSuggestions(parsed.data),
  });
}
