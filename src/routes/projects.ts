import { Router } from "express";
import { z } from "zod";
import { getDb, generateUid, nowDate } from "../lib/mock-db.js";
import { requireAuth } from "../middleware/auth.js";
import { toProjectDto } from "../utils/serializers.js";

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const updateProjectSchema = createProjectSchema.partial();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const search = String(req.query.search ?? "").trim().toLowerCase();
    const db = getDb();

    let items = db.projects.filter((p) => p.userId === req.auth!.userId);

    if (search) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    res.json({
      data: paged.map((p) => {
        const tasksCount = db.tasks.filter((t) => t.projectId === p.id).length;
        const completedTasksCount = db.tasks.filter(
          (t) => t.projectId === p.id && t.status === "done"
        ).length;
        return toProjectDto(p, tasksCount, completedTasksCount);
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const db = getDb();
    const project = db.projects.find(
      (p) => p.id === req.params.id && p.userId === req.auth!.userId
    );

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const tasksCount = db.tasks.filter((t) => t.projectId === project.id).length;
    const completedTasksCount = db.tasks.filter(
      (t) => t.projectId === project.id && t.status === "done"
    ).length;

    res.json({ data: toProjectDto(project, tasksCount, completedTasksCount) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const input = createProjectSchema.parse(req.body);
    const db = getDb();
    const now = nowDate();

    const project = {
      id: generateUid("proj"),
      name: input.name,
      description: input.description ?? "",
      color: input.color,
      userId: req.auth!.userId,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.push(project);

    res.status(201).json({ data: toProjectDto(project, 0, 0) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const input = updateProjectSchema.parse(req.body);
    const db = getDb();

    const idx = db.projects.findIndex(
      (p) => p.id === req.params.id && p.userId === req.auth!.userId
    );

    if (idx === -1) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const updated = {
      ...db.projects[idx],
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.color !== undefined && { color: input.color }),
      updatedAt: nowDate(),
    };
    db.projects[idx] = updated;

    const tasksCount = db.tasks.filter((t) => t.projectId === updated.id).length;
    const completedTasksCount = db.tasks.filter(
      (t) => t.projectId === updated.id && t.status === "done"
    ).length;

    res.json({ data: toProjectDto(updated, tasksCount, completedTasksCount) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const db = getDb();
    const idx = db.projects.findIndex(
      (p) => p.id === req.params.id && p.userId === req.auth!.userId
    );

    if (idx === -1) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    db.projects.splice(idx, 1);
    db.tasks = db.tasks.filter((t) => t.projectId !== req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/:id/tasks", async (req, res, next) => {
  try {
    const db = getDb();
    const project = db.projects.find(
      (p) => p.id === req.params.id && p.userId === req.auth!.userId
    );

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const status = req.query.status ? String(req.query.status) : undefined;

    let items = db.tasks.filter(
      (t) => t.projectId === project.id && t.userId === req.auth!.userId
    );

    if (status) {
      items = items.filter((t) => t.status === status);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    res.json({
      data: paged.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        projectId: t.projectId,
        userId: t.userId,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as projectsRouter };