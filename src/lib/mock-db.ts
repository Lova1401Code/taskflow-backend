export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenRecord {
  id: string;
  token: string;
  userId: string;
  createdAt: Date;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: string;
  userId: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockDB {
  users: UserRecord[];
  refreshTokens: RefreshTokenRecord[];
  projects: ProjectRecord[];
  tasks: TaskRecord[];
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function now(): Date {
  return new Date();
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function buildSeed(): Promise<MockDB> {
  const bcrypt = await import("bcryptjs");

  const users: UserRecord[] = [
    {
      id: "user-demo-1",
      email: "demo@taskflow.com",
      name: "Demo User",
      passwordHash: bcrypt.hashSync("demo123", 10),
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
    {
      id: "user-admin-1",
      email: "admin@taskflow.com",
      name: "Admin User",
      passwordHash: bcrypt.hashSync("admin123", 10),
      createdAt: daysAgo(60),
      updatedAt: daysAgo(60),
    },
  ];

  const projects: ProjectRecord[] = [
    {
      id: "proj-1",
      name: "Site Web",
      description: "Refonte du site vitrine",
      color: "#6366f1",
      userId: "user-demo-1",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(5),
    },
    {
      id: "proj-2",
      name: "App Mobile",
      description: "Application mobile React Native",
      color: "#f97316",
      userId: "user-demo-1",
      createdAt: daysAgo(15),
      updatedAt: daysAgo(3),
    },
    {
      id: "proj-3",
      name: "Marketing",
      description: "Campagne marketing Q1",
      color: "#10b981",
      userId: "user-demo-1",
      createdAt: daysAgo(10),
      updatedAt: daysAgo(1),
    },
  ];

  const tasks: TaskRecord[] = [
    {
      id: "task-1",
      title: "Configurer le routing",
      description: "Mettre en place React Router",
      status: "done",
      priority: "high",
      projectId: "proj-1",
      userId: "user-demo-1",
      dueDate: daysAgo(10),
      createdAt: daysAgo(18),
      updatedAt: daysAgo(8),
    },
    {
      id: "task-2",
      title: "Designer la page d'accueil",
      description: "Maquette Figma + intégration",
      status: "in-progress",
      priority: "high",
      projectId: "proj-1",
      userId: "user-demo-1",
      dueDate: daysAgo(2),
      createdAt: daysAgo(12),
      updatedAt: daysAgo(2),
    },
    {
      id: "task-3",
      title: "Optimiser le SEO",
      description: "Meta tags, sitemap, robots.txt",
      status: "todo",
      priority: "medium",
      projectId: "proj-1",
      userId: "user-demo-1",
      dueDate: null,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
    {
      id: "task-4",
      title: "Setup Expo project",
      description: "Initialiser le projet Expo avec navigation",
      status: "done",
      priority: "medium",
      projectId: "proj-2",
      userId: "user-demo-1",
      dueDate: daysAgo(7),
      createdAt: daysAgo(14),
      updatedAt: daysAgo(6),
    },
    {
      id: "task-5",
      title: "Créer la campagne email",
      description: "Sequence de 5 emails",
      status: "in-progress",
      priority: "low",
      projectId: "proj-3",
      userId: "user-demo-1",
      dueDate: daysAgo(1),
      createdAt: daysAgo(8),
      updatedAt: daysAgo(1),
    },
    {
      id: "task-6",
      title: "Planifier les posts réseaux sociaux",
      description: "Calendrier éditorial sur 3 mois",
      status: "todo",
      priority: "medium",
      projectId: "proj-3",
      userId: "user-demo-1",
      dueDate: null,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
  ];

  return {
    users,
    refreshTokens: [],
    projects,
    tasks,
  };
}

export function generateUid(prefix: string): string {
  return uid(prefix);
}

export function nowDate(): Date {
  return now();
}

let _db: MockDB | null = null;

export async function initSeed(): Promise<void> {
  _db = await buildSeed();
  console.log("[mock-db] Seed data loaded:",
    `${_db.users.length} users,`,
    `${_db.projects.length} projects,`,
    `${_db.tasks.length} tasks`,
  );
}

export function getDb(): MockDB {
  if (!_db) {
    throw new Error("Mock database not initialized. Call initSeed() first.");
  }
  return _db;
}