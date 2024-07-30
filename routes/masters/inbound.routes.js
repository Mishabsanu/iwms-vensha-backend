import express from "express";

import {
  AddInbound,
  ListInbound,
  UpdateInbound,
} from "../../controllers/masters/inbound.js";
import CheckRoleAndTokenAccess from "../../middlewares/permission.js";

const router = express.Router();

router.post("/add-inbound", CheckRoleAndTokenAccess, AddInbound);
router.post("/update-inbound", CheckRoleAndTokenAccess, UpdateInbound);
router.post("/list-inbound", CheckRoleAndTokenAccess, ListInbound);
export default router;
