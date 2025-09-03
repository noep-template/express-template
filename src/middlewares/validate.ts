import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodIssue } from "zod";

export const validate = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e: ZodIssue) => ({
        field: e.path[0],
        message: e.message,
      }));
      return res.status(400).json({ errors });
    }
    req.body = result.data;
    next();
  };
};
