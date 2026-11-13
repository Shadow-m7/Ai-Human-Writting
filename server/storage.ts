import fs from 'node:fs/promises';
import path from 'node:path';
import type { AssignmentProject } from '../src/types/assignment.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PROJECTS_FILE);
  } catch {
    await fs.writeFile(PROJECTS_FILE, '[]', 'utf-8');
  }
}

export async function listProjects(): Promise<AssignmentProject[]> {
  await ensureStore();
  try {
    const raw = await fs.readFile(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as AssignmentProject[]).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function getProjectById(id: string): Promise<AssignmentProject | null> {
  const projects = await listProjects();
  return projects.find((p) => p.id === id) ?? null;
}

export async function saveProject(project: AssignmentProject): Promise<AssignmentProject> {
  await ensureStore();
  const projects = await listProjects();
  const now = new Date().toISOString();
  const updatedProject: AssignmentProject = {
    ...project,
    updatedAt: now,
    createdAt: project.createdAt || now,
  };

  const index = projects.findIndex((p) => p.id === updatedProject.id);
  if (index >= 0) {
    projects[index] = updatedProject;
  } else {
    projects.unshift(updatedProject);
  }

  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  return updatedProject;
}

export async function deleteProjectById(id: string): Promise<boolean> {
  await ensureStore();
  const projects = await listProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) {
    return false;
  }
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}
