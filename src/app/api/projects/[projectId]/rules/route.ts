import { NextRequest, NextResponse } from "next/server";
import { listRules, createRule } from "@/lib/db/queries/rules";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const rules = listRules(projectId);
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  const { title, content, source } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const rule = createRule({ project_id: projectId, title, content, source: source || "editor" });
  return NextResponse.json(rule, { status: 201 });
}
