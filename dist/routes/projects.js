import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
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
        const search = String(req.query.search ?? "").trim();
        const where = {
            userId: req.auth.userId,
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {}),
        };
        const [total, projects] = await Promise.all([
            prisma.project.count({ where }),
            prisma.project.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    _count: { select: { tasks: true } },
                    tasks: { where: { status: "done" }, select: { id: true } },
                },
            }),
        ]);
        res.json({
            data: projects.map((p) => toProjectDto(p, p._count.tasks, p.tasks.length)),
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
        const project = await prisma.project.findFirst({
            where: { id: req.params.id, userId: req.auth.userId },
            include: {
                _count: { select: { tasks: true } },
                tasks: { where: { status: "done" }, select: { id: true } },
            },
        });
        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }
        res.json({ data: toProjectDto(project, project._count.tasks, project.tasks.length) });
    }
    catch (error) {
        next(error);
    }
});
router.post("/", async (req, res, next) => {
    try {
        const input = createProjectSchema.parse(req.body);
        const project = await prisma.project.create({
            data: {
                ...input,
                description: input.description ?? "",
                userId: req.auth.userId,
            },
        });
        res.status(201).json({ data: toProjectDto(project, 0, 0) });
    }
    catch (error) {
        next(error);
    }
});
router.patch("/:id", async (req, res, next) => {
    try {
        const input = updateProjectSchema.parse(req.body);
        const exists = await prisma.project.findFirst({
            where: { id: req.params.id, userId: req.auth.userId },
        });
        if (!exists) {
            res.status(404).json({ message: "Project not found" });
            return;
        }
        const updated = await prisma.project.update({
            where: { id: req.params.id },
            data: input,
        });
        const count = await prisma.task.count({ where: { projectId: updated.id } });
        const doneCount = await prisma.task.count({ where: { projectId: updated.id, status: "done" } });
        res.json({ data: toProjectDto(updated, count, doneCount) });
    }
    catch (error) {
        next(error);
    }
});
router.delete("/:id", async (req, res, next) => {
    try {
        const project = await prisma.project.findFirst({
            where: { id: req.params.id, userId: req.auth.userId },
        });
        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }
        await prisma.project.delete({ where: { id: project.id } });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
router.get("/:id/tasks", async (req, res, next) => {
    try {
        const project = await prisma.project.findFirst({
            where: { id: req.params.id, userId: req.auth.userId },
        });
        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const status = req.query.status ? String(req.query.status) : undefined;
        const where = {
            projectId: project.id,
            userId: req.auth.userId,
            ...(status ? { status: status } : {}),
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
            data: tasks.map((t) => ({
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
    }
    catch (error) {
        next(error);
    }
});
export { router as projectsRouter };
