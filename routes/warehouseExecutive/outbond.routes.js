import express from "express";
import {
  AddOutbound,
  ListOutbound,
} from "../../controllers/warehouseExecutive/outbond.js";
import CheckRoleAndTokenAccess from "../../middlewares/permission.js";

const router = express.Router();

router.post("/add-outbound", CheckRoleAndTokenAccess, AddOutbound);
router.post("/list-outbound", CheckRoleAndTokenAccess, ListOutbound);

export default router;
