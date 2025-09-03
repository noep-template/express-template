#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync } = require("child_process");

const CONTAINER_NAME = process.env.MONGO_CONTAINER_NAME || "mongo-rs";
const IMAGE = process.env.MONGO_IMAGE || "mongo:7";
const PORT = process.env.MONGO_PORT || "27017";
const REPLSET = process.env.MONGO_REPLSET || "rs0";

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: "inherit", ...opts });
}

function checkDocker() {
  try {
    execSync("docker -v", { stdio: "ignore" });
  } catch (e) {
    console.error(
      "Docker n'est pas disponible. Installez/ouvrez Docker Desktop."
    );
    process.exit(1);
  }
}

function containerExists() {
  try {
    execSync(`docker inspect ${CONTAINER_NAME} >/dev/null 2>&1`);
    return true;
  } catch {
    return false;
  }
}

function start() {
  checkDocker();
  const exists = containerExists();
  if (!exists) {
    console.log(`Création du conteneur ${CONTAINER_NAME} (${IMAGE})...`);
    sh(
      `docker run -d --name ${CONTAINER_NAME} -p ${PORT}:27017 ${IMAGE} --replSet ${REPLSET}`
    );
  } else {
    console.log(
      `Le conteneur ${CONTAINER_NAME} existe déjà. Tentative de démarrage...`
    );
    try {
      sh(`docker start ${CONTAINER_NAME}`);
    } catch {}
  }

  console.log("Initialisation du replica set (si nécessaire)...");
  try {
    sh(
      `docker exec ${CONTAINER_NAME} mongosh --quiet --eval "try {rs.status()} catch(e) {rs.initiate({_id:'${REPLSET}', members:[{_id:0, host:'localhost:${PORT}'}]})}"`
    );
  } catch (e) {
    console.warn(
      "Impossible d'initialiser le replica set automatiquement. Vous pouvez le faire manuellement dans le conteneur."
    );
  }
  console.log(
    `MongoDB prêt sur mongodb://localhost:${PORT} (replica set ${REPLSET}).`
  );
}

function stop() {
  checkDocker();
  sh(`docker stop ${CONTAINER_NAME}`);
}

function rm() {
  checkDocker();
  try {
    sh(`docker stop ${CONTAINER_NAME}`);
  } catch {}
  sh(`docker rm ${CONTAINER_NAME}`);
}

function status() {
  checkDocker();
  try {
    sh(`docker ps -a --filter name=${CONTAINER_NAME}`);
  } catch {}
}

function logs() {
  checkDocker();
  sh(`docker logs -f ${CONTAINER_NAME}`);
}

function waitReady() {
  checkDocker();
  const maxAttempts = 60;
  const sleep = (ms) =>
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  console.log("Attente de la disponibilité de MongoDB...");
  for (let i = 0; i < maxAttempts; i++) {
    try {
      execSync(
        `docker exec ${CONTAINER_NAME} mongosh --quiet --eval "db.adminCommand({ ping: 1 })"`,
        { stdio: "ignore" }
      );
      break;
    } catch {
      sleep(1000);
      if (i === maxAttempts - 1) {
        console.error("MongoDB ne répond pas (ping) après attente.");
        process.exit(1);
      }
    }
  }

  // Vérifier/initier le replica set si nécessaire
  try {
    execSync(
      `docker exec ${CONTAINER_NAME} mongosh --quiet --eval "rs.status()"`,
      { stdio: "ignore" }
    );
  } catch {
    try {
      sh(
        `docker exec ${CONTAINER_NAME} mongosh --quiet --eval "rs.initiate({_id:'${REPLSET}', members:[{_id:0, host:'localhost:${PORT}'}]})"`
      );
    } catch (e) {
      console.warn("Impossible d'initier le replica set automatiquement.");
    }
  }

  console.log("Attente de l'état PRIMARY du replica set...");
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const out = execSync(
        `docker exec ${CONTAINER_NAME} mongosh --quiet --eval "rs.status().myState"`,
        { encoding: "utf8" }
      );
      if (String(out).trim() === "1") {
        console.log("Replica set en état PRIMARY.");
        return;
      }
    } catch {}
    sleep(1000);
  }
  console.warn(
    "Le replica set n'a pas atteint l'état PRIMARY dans le temps imparti, Prisma pourrait échouer."
  );
}

function help() {
  console.log(`Usage: node scripts/docker-mongo.cjs <commande>

Commandes:
  start   Démarrer MongoDB (Docker) avec replica set
  stop    Arrêter le conteneur
  status  Afficher l'état du conteneur
  logs    Suivre les logs du conteneur
  rm      Supprimer le conteneur
  wait    Attendre que Mongo soit prêt et PRIMARY

Variables d'environnement:
  MONGO_CONTAINER_NAME (defaut: mongo-rs)
  MONGO_IMAGE          (defaut: mongo:7)
  MONGO_PORT           (defaut: 27017)
  MONGO_REPLSET        (defaut: rs0)
`);
}

function main() {
  const cmd = process.argv[2];
  switch (cmd) {
    case "start":
      start();
      break;
    case "stop":
      stop();
      break;
    case "status":
      status();
      break;
    case "logs":
      logs();
      break;
    case "rm":
      rm();
      break;
    case "wait":
      waitReady();
      break;
    default:
      help();
      process.exit(cmd ? 1 : 0);
  }
}

main();
