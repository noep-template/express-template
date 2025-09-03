import { Router } from "express";
import { tasksController } from "../controllers/tasksController";
import { validate } from "../middlewares/validate";
import {
  createTaskSchema,
  updateTaskSchema,
} from "../validators/tasksValidator";

const router = Router();

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Récupère toutes les tâches
 *     responses:
 *       200:
 *         description: Liste des tâches
 */
router.get("/", tasksController.getAll);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Crée une nouvelle tâche
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Faire le ménage"
 *     responses:
 *       201:
 *         description: Tâche créée
 */
router.post("/", validate(createTaskSchema), tasksController.create);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Met à jour une tâche
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la tâche
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tâche mise à jour
 *       404:
 *         description: Tâche non trouvée
 */
router.put("/:id", validate(updateTaskSchema), tasksController.update);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Supprime une tâche
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la tâche
 *     responses:
 *       204:
 *         description: Tâche supprimée
 *       404:
 *         description: Tâche non trouvée
 */
router.delete("/:id", tasksController.delete);

export default router;
