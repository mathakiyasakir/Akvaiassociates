import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createOrder, listOrders } from "@/lib/store";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const scope = request.nextUrl.searchParams.get("scope");
  const filterByUser =
    auth.user.role === "admin" && scope === "all" ? undefined : auth.user.id;

  const orders = await listOrders(filterByUser);
  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const serviceTitle =
    typeof record.serviceTitle === "string" ? record.serviceTitle.trim() : "";
  const projectType =
    typeof record.projectType === "string" ? record.projectType.trim() : "Residential";
  const location =
    typeof record.location === "string" ? record.location.trim() : "";
  const budgetRange =
    typeof record.budgetRange === "string" ? record.budgetRange.trim() : "";
  const message = typeof record.message === "string" ? record.message.trim() : "";

  if (!serviceTitle || serviceTitle.length > 100) {
    return NextResponse.json(
      { error: "Please select a valid architectural service." },
      { status: 400 }
    );
  }
  if (message.length < 8 || message.length > 1500) {
    return NextResponse.json(
      { error: "Please describe your project (8 to 1500 characters)." },
      { status: 400 }
    );
  }

  const order = await createOrder({
    userId: auth.user.id,
    userName: auth.user.name,
    userEmail: auth.user.email,
    serviceTitle,
    projectType: projectType.slice(0, 60),
    location: location.slice(0, 120),
    budgetRange: budgetRange.slice(0, 80),
    message,
  });

  return NextResponse.json({ order }, { status: 201 });
}
