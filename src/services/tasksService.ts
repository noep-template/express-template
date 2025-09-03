import { PrismaClient } from "@prisma/client";
import { TaskDTO } from "../types/tasks";
import { taskMapper } from "../mappers/taskMapper";

const prisma = new PrismaClient();

export const tasksService = {
  async getAll(): Promise<TaskDTO[]> {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
    return taskMapper.toDTOs(tasks);
  },

  async create(input: { title: string }): Promise<TaskDTO> {
    const task = await prisma.task.create({ data: { title: input.title } });
    return taskMapper.toDTO(task);
  },

  async update(
    id: string,
    input: { title?: string; completed?: boolean }
  ): Promise<TaskDTO | null> {
    try {
      const task = await prisma.task.update({
        where: { id },
        data: input,
      });
      return taskMapper.toDTO(task);
    } catch {
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.task.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};
