import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signSessionToken } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const email =
    typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Please enter your name (2 to 80 characters)." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (password.length < 6 || password.length > 128) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  const user = await createUser({
    name,
    email,
    passwordHash: hashPassword(password),
    role: "user",
  });

  const token = signSessionToken(user);
  return NextResponse.json({ user, token }, { status: 201 });
}
