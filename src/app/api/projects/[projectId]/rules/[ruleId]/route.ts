import { NextRequest, NextResponse } from "next/server";
import { updateRule, deleteRule } from "@/lib/db/queries/rules";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ ruleId: string }> }) {
  const { ruleId } = await params;
  const body = await req.json();
  const rule = updateRule(ruleId, body);
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ ruleId: string }> }) {
  const { ruleId } = await params;
  const deleted = deleteRule(ruleId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
