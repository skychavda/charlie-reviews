import { NextRequest, NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/db/queries/projects";
import fs from "fs";

export async function GET() {
  const projects = listProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, directory_path, file_patterns, ignore_patterns } = body;

  if (!name || !directory_path) {
    return NextResponse.json({ error: "Name and directory path are required" }, { status: 400 });
  }

  if (!fs.existsSync(directory_path)) {
    return NextResponse.json({ error: "Directory does not exist" }, { status: 400 });
  }

  const project = createProject({ name, description, directory_path, file_patterns, ignore_patterns });
  return NextResponse.json(project, { status: 201 });
}
