import { NextResponse } from "next/server";
import { signInSchema } from "@/lib/auth-schemas";
import { validateCredentialsAttempt } from "@/server/auth-security";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data login tidak valid." },
      { status: 400 }
    );
  }

  const result = await validateCredentialsAttempt(
    parsed.data.email,
    parsed.data.password
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
