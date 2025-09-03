import { Task } from "@prisma/client";
import { TaskDTO } from "../types/tasks";

export const taskMapper = {
  toDTO(task: Task): TaskDTO {
    return {
      id: task.id,
      title: task.title,
      completed: task.completed,
      createdAt: task.createdAt,
    };
  },

  toDTOs(tasks: Task[]): TaskDTO[] {
    return tasks.map(this.toDTO);
  },
};
