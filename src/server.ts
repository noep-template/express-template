import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import tasksRouter from "./routes/tasks";
import { errorHandler } from "./middlewares/errorHandler";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";

dotenv.config();

const app = express();
const origins = (process.env.CORS_ORIGIN || "").split(",").filter(Boolean);

app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/tasks", tasksRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
