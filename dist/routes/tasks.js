import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
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
    projectId: z.string().min(1),
});
const updateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    dueDate: z.string().nullable().optional(),
});
router.use(requireAuth);
router.get("/", async (req, res, next) => {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const search = String(req.query.search ?? "").trim();
        const status = req.query.status ? String(req.query.status) : undefined;
        const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
        const where = {
            userId: req.auth.userId,
            ...(status ? { status: status } : {}),
            ...(projectId ? { projectId } : {}),
            ...(search
                ? {
                    OR: [
                        { title: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {}),
        };
        const [total, tasks] = await Promise.all([
            prisma.task.count({ where }),
            prisma.task.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
        ]);
        res.json({
            data: tasks.map(toTaskDto),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get("/:id", async (req, res, next) => {
    try {
        const task = await prisma.task.findFirst({
            where: { id: req.params.id, userId: req.auth.userId },
        });
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        res.json({ data: toTaskDto(task) });
    }
    catch (error) {
        next(error);
    }
});
router.post("/", async (req, res, next) => {
    try {
        const input = createTaskSchema.parse(req.body);
        const project = await prisma.project.findFirst({
            where: { id: input.projectId, userId: req.auth.userId },
        });
        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }
        const task = await prisma.task.create({
            data: {
                title: input.title,
                description: input.description ?? "",
                status: input.status,
                priority: input.priority,
                projectId: input.projectId,
                userId: req.auth.userId,
                dueDate: input.dueDate ? new Date(input.dueDate) : null,
            },
        });
        res.status(201).json({ data: toTaskDto(task) });
    }
    catch (error) {
        next(error);
    }
});
router.patch("/:id", async (req, res, next) => {
    try {
        const input = updateTaskSchema.parse(req.body);
        const existing = await prisma.task.findFirst({
            where: { id: req.params.id, userId: req.auth.userId },
        });
        if (!existing) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        const task = await prisma.task.update({
            where: { id: existing.id },
            data: {
                ...input,
                dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null,
            },
        });
        res.json({ data: toTaskDto(task) });
    }
    catch (error) {
        next(error);
    }
});
router.delete("/:id", async (req, res, next) => {
    try {
        const existing = await prisma.task.findFirst({
            where: { id: req.params.id, userId: req.auth.userId },
        });
        if (!existing) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        await prisma.task.delete({ where: { id: existing.id } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
export { router as tasksRouter };
