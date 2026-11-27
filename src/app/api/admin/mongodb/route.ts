import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  buildMongoUriFromCluster,
  connectMongoDatabase,
  disconnectMongoDatabase,
  getMongoStatus,
} from "@/lib/store";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const status = await getMongoStatus();
  return NextResponse.json({ status });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const mode = record.mode === "cluster" ? "cluster" : "uri";
  const dbName =
    typeof record.dbName === "string" && record.dbName.trim()
      ? record.dbName.trim()
      : "akvai_associates";

  let uriToConnect = "";

  if (mode === "cluster") {
    const clusterId = typeof record.clusterId === "string" ? record.clusterId : "";
    const username = typeof record.username === "string" ? record.username : "";
    const password = typeof record.password === "string" ? record.password : "";
    const built = buildMongoUriFromCluster({
      clusterId,
      username,
      password,
      dbName,
    });
    if (!built.valid || !built.uri) {
      return NextResponse.json(
        { error: built.error || "Invalid MongoDB cluster details." },
        { status: 400 }
      );
    }
    uriToConnect = built.uri;
  } else {
    uriToConnect = typeof record.uri === "string" ? record.uri.trim() : "";
  }

  try {
    const status = await connectMongoDatabase(uriToConnect, dbName, "runtime");
    return NextResponse.json({ status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not connect to MongoDB.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const status = await disconnectMongoDatabase();
  return NextResponse.json({ status });
}
