import { NextResponse } from "next/server";
import { DEMO_MODE, findDemoAccount } from "@/lib/demo-mode";
import { setDemoSession } from "@/lib/demo-session";

export async function POST(request: Request) {
  if (!DEMO_MODE) {
    return NextResponse.json(
      { error: "Demo mode is not enabled." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { error: "Email dan password wajib diisi." },
      { status: 400 }
    );
  }

  const account = findDemoAccount(body.email, body.password);
  if (!account) {
    return NextResponse.json(
      { error: "Email atau password tidak cocok." },
      { status: 401 }
    );
  }

  await setDemoSession(account.id);

  const redirectTo = account.isAdmin ? "/admin" : "/dashboard";

  return NextResponse.json({
    ok: true,
    redirectTo,
    user: {
      id: account.id,
      email: account.email,
      name: account.name,
      username: account.username,
      role: account.role,
      isAdmin: account.isAdmin,
    },
  });
}
