import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, { message: "Le champ est requis" }),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Le titre ne peut pas être vide" })
    .optional(),
  completed: z.boolean().optional(),
});
