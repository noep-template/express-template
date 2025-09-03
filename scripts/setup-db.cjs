#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync } = require("child_process");
const {
  existsSync,
  writeFileSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
} = require("fs");
const { join } = require("path");
const readline = require("readline");

function parseArgs() {
  const arg = process.argv.find((a) => a.startsWith("--db="));
  const db = arg ? arg.split("=")[1] : undefined;
  const clean = process.argv.includes("--clean");
  return { db, clean };
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(rl, question) {
  return new Promise((resolve) =>
    rl.question(question, (answer) => resolve(answer))
  );
}

async function promptForOptions(current) {
  if (current.db && ["sqlite", "mongodb"].includes(current.db)) {
    return current;
  }
  const rl = createInterface();
  let db = (
    await askQuestion(
      rl,
      "Choisir la base de données [sqlite/mongodb] (defaut: sqlite): "
    )
  )
    .trim()
    .toLowerCase();
  if (!db) db = "sqlite";
  if (!["sqlite", "mongodb"].includes(db)) {
    rl.close();
    console.error("Choix invalide. Valeurs possibles: sqlite, mongodb.");
    process.exit(1);
  }
  let clean = current.clean;
  if (
    db === "mongodb" &&
    current.clean === false &&
    !process.argv.some((a) => a.startsWith("--db="))
  ) {
    const ans = (
      await askQuestion(
        rl,
        "Supprimer la base SQLite locale (prisma/dev.db) ? [y/N]: "
      )
    )
      .trim()
      .toLowerCase();
    clean = ans === "y" || ans === "yes";
  }
  rl.close();
  return { db, clean };
}

function ensureEnv(databaseUrl) {
  const envPath = join(process.cwd(), ".env");
  // Lire le contenu existant (si présent)
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

  // Transformer en objet clé=valeur tout en préservant les lignes inconnues
  const lines = content.split(/\r?\n/).filter(() => true);
  const kv = new Map();
  const otherLines = [];
  for (const line of lines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) {
      otherLines.push(line);
      continue;
    }
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1);
    kv.set(key, value);
  }

  // Mettre à jour/ajouter les variables nécessaires
  kv.set("DATABASE_URL", databaseUrl);
  if (!kv.has("PORT")) kv.set("PORT", "4000");

  const defaultCorsOrigins = "http://localhost:5173,http://localhost:3000";
  if (!kv.has("CORS_ORIGIN")) {
    kv.set("CORS_ORIGIN", defaultCorsOrigins);
  } else {
    const currentCors = String(kv.get("CORS_ORIGIN") || "").trim();
    if (currentCors === "") {
      kv.set("CORS_ORIGIN", defaultCorsOrigins);
    }
  }

  // Reconstruire le contenu: conserver lignes non KV, puis KV triées par clé (stable)
  const kvLines = Array.from(kv.entries()).map(([k, v]) => `${k}=${v}`);
  const next = [...otherLines.filter((l) => l !== undefined), ...kvLines]
    .filter((l, i, arr) => !(l === "" && (i === 0 || arr[i - 1] === "")))
    .join("\n");

  writeFileSync(envPath, next.endsWith("\n") ? next : next + "\n");
  console.log(`.env mis à jour avec DATABASE_URL, PORT et CORS_ORIGIN`);
}

function writePrismaSchema(db) {
  const prismaDir = join(process.cwd(), "prisma");
  if (!existsSync(prismaDir)) mkdirSync(prismaDir, { recursive: true });
  const schemaPath = join(prismaDir, "schema.prisma");

  const sqliteSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Task {
  id        String   @id @default(uuid())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
`;

  const mongoSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model Task {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
`;

  const content = db === "mongodb" ? mongoSchema : sqliteSchema;
  writeFileSync(schemaPath, content);
  console.log(`prisma/schema.prisma écrit pour ${db}`);
}

function installDeps(db) {
  const deps = [];
  if (db === "mongodb") {
    // Prisma MongoDB n'a pas besoin du driver mongodb comme dépendance directe, mais on peut l'ajouter au besoin
    // deps.push("mongodb");
  }
  if (deps.length) {
    console.log("Installation des dépendances:", deps.join(", "));
    execSync(`npm install ${deps.join(" ")}`, { stdio: "inherit" });
  }
}

function startMongoDockerIfNeeded(db) {
  if (db !== "mongodb") return;
  try {
    console.log("Démarrage de MongoDB (Docker, replica set)...");
    execSync("node scripts/docker-mongo.cjs start", { stdio: "inherit" });
    // Attendre que MongoDB soit prêt et PRIMARY avant Prisma
    execSync("node scripts/docker-mongo.cjs wait", { stdio: "inherit" });
  } catch (e) {
    console.warn(
      "Impossible de démarrer MongoDB via Docker automatiquement. Assurez-vous que Docker est installé et lancé, ou démarrez-le manuellement avec: make mongo-start"
    );
  }
}

function runPrisma(db) {
  try {
    if (db === "sqlite") {
      execSync("npx prisma generate", { stdio: "inherit" });
      execSync("npx prisma migrate dev --name init --skip-seed", {
        stdio: "inherit",
      });
    } else {
      execSync("npx prisma generate", { stdio: "inherit" });
      execSync("npx prisma db push", { stdio: "inherit" });
    }
  } catch (e) {
    console.error("Erreur lors de l'exécution de Prisma:", e.message || e);
    process.exit(1);
  }
}

function cleanSqliteArtifacts() {
  const dbPath = join(process.cwd(), "prisma", "dev.db");
  if (existsSync(dbPath)) {
    try {
      unlinkSync(dbPath);
      console.log("Fichier SQLite prisma/dev.db supprimé");
    } catch (e) {
      console.warn("Impossible de supprimer prisma/dev.db:", e.message || e);
    }
  }
}

async function main() {
  const parsed = parseArgs();
  const { db, clean } = await promptForOptions(parsed);
  const databaseUrl =
    db === "sqlite" ? "file:./dev.db" : "mongodb://localhost:27017/mini_todo";
  ensureEnv(databaseUrl);
  writePrismaSchema(db);
  if (db === "mongodb" && clean) {
    cleanSqliteArtifacts();
  }
  installDeps(db);
  startMongoDockerIfNeeded(db);
  runPrisma(db);
  if (db === "mongodb") {
    console.log(
      "Note: Prisma avec MongoDB requiert un replica set. Si vous voyez une erreur de transaction, initialisez un replica set local."
    );
  }
  console.log("Setup terminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
