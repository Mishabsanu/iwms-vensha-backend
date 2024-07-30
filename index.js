import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import http from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import getConfigs from "./config/config.js";
import mongo_service from "./database/mongo.service.js";
import authRouter from "./routes/auth.routes.js";
import ProductionLineMasterRouter from "./routes/masters/produntionLine.routes.js";
import ProductionMasterRouter from "./routes/production.routes.js";
import MaterialMasterRouter from "./routes/masters/material.routes.js";
import InboundRouter from "./routes/masters/inbound.routes.js";
import profileRouter from "./routes/profile.routes.js";
import rolesRouter from "./routes/roles.routes.js";
import usersRouter from "./routes/users.routes.js";

import { globalErrorHandler } from "./utils/errors/globalErrorHandler.js";
const Configs = getConfigs();
mongo_service();
const app = express();
app.get("/", (req, res) => {
  res.send("working fineeeeeeeeee");
});
const server = http.createServer(app);
const PORT = Configs.server.port;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.json());

var corsOptions = {
  origin: Configs.cors.origin,
  optionsSuccessStatus: 200,
  credentials: Configs.cors.credentials,
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use("/upload", express.static("./upload"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname));
app.use(cookieParser());

app.use(`/api/${Configs.server.version}/auth`, authRouter);
app.use(`/api/${Configs.server.version}/user`, usersRouter);
app.use(`/api/${Configs.server.version}/role`, rolesRouter);
app.use(`/api/${Configs.server.version}/profile`, profileRouter);

// master
app.use(`/api/${Configs.server.version}/material-master`, MaterialMasterRouter);
app.use(
  `/api/${Configs.server.version}/production-line`,
  ProductionLineMasterRouter
);
app.use(`/api/${Configs.server.version}/production`, ProductionMasterRouter);
app.use(`/api/${Configs.server.version}/inbound`, InboundRouter);

app.use(globalErrorHandler);
// Error handling for the server
server.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
