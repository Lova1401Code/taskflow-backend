import type { ProjectRecord, TaskRecord } from "../lib/mock-db.js";

export function toProjectDto(project: ProjectRecord, tasksCount = 0, completedTasksCount = 0) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    userId: project.userId,
    tasksCount,
    completedTasksCount,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function toTaskDto(task: TaskRecord) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    projectId: task.projectId,
    userId: task.userId,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}