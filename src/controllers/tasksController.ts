import { Request, Response, NextFunction } from "express";
import { tasksService } from "../services/tasksService";
import { TaskCreate, TaskUpdate } from "../types/tasks";

export const tasksController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await tasksService.getAll();
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input: TaskCreate = req.body;
      const newTask = await tasksService.create(input);
      res.status(201).json(newTask);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const input: TaskUpdate = req.body;

      const updatedTask = await tasksService.update(id, input);
      if (!updatedTask) throw { status: 404, message: "Task not found" };

      res.json(updatedTask);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;

      const success = await tasksService.delete(id);
      if (!success) throw { status: 404, message: "Task not found" };

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
