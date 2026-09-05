import { Router } from "express";
import { z } from "zod";
import { getDb, generateUid, nowDate } from "../lib/mock-db.js";
import { requireAuth } from "../middleware/auth.js";
import { toTaskDto } from "../utils/serializers.js";

const router = Router();

const statusEnum = z.enum(["todo", "in-progress", "done"]);
const priorityEnum = z.enum(["low", "medium", "high"]);

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().default(""),
  status: statusEnum.default("todo"),
  priority: priorityEnum.default("medium"),
  dueDate: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  projectId: z.string().min(1),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
});

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const search = String(req.query.search ?? "").trim().toLowerCase();
    const status = req.query.status ? String(req.query.status) : undefined;
    const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
    const db = getDb();

    let items = db.tasks.filter((t) => t.userId === req.auth!.userId);

    if (status) {
      items = items.filter((t) => t.status === status);
    }

    if (projectId) {
      items = items.filter((t) => t.projectId === projectId);
    }

    if (search) {
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
      );
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = items.length;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    res.json({
      data: paged.map(toTaskDto),
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
    const task = db.tasks.find(
      (t) => t.id === req.params.id && t.userId === req.auth!.userId
    );

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.json({ data: toTaskDto(task) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const input = createTaskSchema.parse(req.body);
    const db = getDb();

    const project = db.projects.find(
      (p) => p.id === input.projectId && p.userId === req.auth!.userId
    );

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const now = nowDate();
    const task = {
      id: generateUid("task"),
      title: input.title,
      description: input.description ?? "",
      status: input.status,
      priority: input.priority,
      projectId: input.projectId,
      userId: req.auth!.userId,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      coverImage: input.coverImage ?? null,
      createdAt: now,
      updatedAt: now,
    };
    db.tasks.push(task);

    res.status(201).json({ data: toTaskDto(task) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const input = updateTaskSchema.parse(req.body);
    const db = getDb();

    const idx = db.tasks.findIndex(
      (t) => t.id === req.params.id && t.userId === req.auth!.userId
    );

    if (idx === -1) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const updated = {
      ...db.tasks[idx],
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      }),
      ...(input.coverImage !== undefined && { coverImage: input.coverImage }),
      updatedAt: nowDate(),
    };
    db.tasks[idx] = updated;

    res.json({ data: toTaskDto(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const db = getDb();
    const idx = db.tasks.findIndex(
      (t) => t.id === req.params.id && t.userId === req.auth!.userId
    );

    if (idx === -1) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    db.tasks.splice(idx, 1);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as tasksRouter };