import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { users } from "@/db/schema";
import { signUpSchema } from "@/lib/auth-schemas";
import { hashPassword } from "@/lib/password";
import {
 checkRegisterRateLimit,
 getClientIp,
 rateLimitExceededResponse,
} from "@/lib/rate-limit";
import {
 isReservedUsername,
 sanitizeUsername,
 generateUsernameFromName,
} from "@/lib/username-rules";

async function findAvailableUsername(base: string): Promise<string> {
 const candidate = base || generateUsernameFromName("user");
 if (!candidate || isReservedUsername(candidate)) {
   return findAvailableUsername(
     `${candidate || "user"}${Math.random().toString(36).substring(2, 6)}`
   );
 }

 const existing = await db.query.users.findFirst({
   where: eq(users.username, candidate),
   columns: { id: true },
 });

 if (!existing) {
   return candidate;
 }

 // Append random suffix until unique
 for (let attempt = 0; attempt < 10; attempt++) {
   const suffix = Math.random().toString(36).substring(2, 6);
   const next = sanitizeUsername(`${candidate}${suffix}`);
   if (!next || isReservedUsername(next)) continue;

   const conflict = await db.query.users.findFirst({
     where: eq(users.username, next),
     columns: { id: true },
   });

   if (!conflict) {
     return next;
   }
 }

 // Fallback: random username
 return `user${randomUUID().slice(0, 8)}`;
}

export async function POST(request: NextRequest) {
 const ip = getClientIp(request);
 const rateLimit = await checkRegisterRateLimit(ip);

 if (!rateLimit.success) {
   return rateLimitExceededResponse(rateLimit);
 }

 if (!isDatabaseConfigured || !db) {
   return NextResponse.json(
     { code: "db_not_configured", error: "DB_NOT_CONFIGURED" },
     { status: 503 }
   );
 }

 try {
   const body = await request.json();
   const parsed = signUpSchema.safeParse(body);

   if (!parsed.success) {
     const firstIssue = parsed.error.issues[0];
     return NextResponse.json(
       { code: "invalid_payload", error: firstIssue?.message || "INVALID_PAYLOAD" },
       { status: 400 }
     );
   }

   const email = parsed.data.email.trim().toLowerCase();
   const fullName = parsed.data.fullName.trim();

   // Generate username if not provided
   let username: string;
   if (parsed.data.username && parsed.data.username.trim()) {
     username = sanitizeUsername(parsed.data.username);
     if (!username || isReservedUsername(username)) {
       return NextResponse.json(
         { code: "username_reserved", error: "USERNAME_RESERVED" },
         { status: 400 }
       );
     }
     const existingUsername = await db.query.users.findFirst({
       where: eq(users.username, username),
       columns: { id: true },
     });
     if (existingUsername) {
       return NextResponse.json(
         { code: "username_taken", error: "USERNAME_TAKEN" },
         { status: 409 }
       );
     }
   } else {
     // Auto-generate from fullName
     const base = generateUsernameFromName(fullName);
     username = await findAvailableUsername(base);
   }

   const existingUser = await db.query.users.findFirst({
     where: eq(users.email, email),
     columns: { id: true },
   });

   if (existingUser) {
     return NextResponse.json(
       { code: "email_taken", error: "EMAIL_TAKEN" },
       { status: 409 }
     );
   }

   const passwordHash = await hashPassword(parsed.data.password);

   const [createdUser] = await db
     .insert(users)
     .values({
       id: randomUUID(),
       email,
       name: fullName,
       username,
       passwordHash,
       emailVerified: new Date(),
     })
     .returning({
       id: users.id,
       email: users.email,
       username: users.username,
     });

   return NextResponse.json(
     {
       ok: true,
       user: createdUser,
     },
     { status: 201 }
   );
 } catch (error) {
   console.error("[auth/register] failed", error);
   return NextResponse.json(
     { code: "register_failed", error: "REGISTER_FAILED" },
     { status: 500 }
   );
 }}
