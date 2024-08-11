import express from "express";
import {
  AddOutbound,
  ListOutbound,
  CrossDockPickup,
  sendToForklift,
  sendToDock
 
 
} from "../../controllers/warehouseExecutive/outbond.js";
import CheckRoleAndTokenAccess from "../../middlewares/permission.js";

const router = express.Router();

router.post("/add-outbound", CheckRoleAndTokenAccess, AddOutbound);
router.post("/list-outbound", CheckRoleAndTokenAccess, ListOutbound);
router.post("/send-to-crossDockPickup",  CrossDockPickup);
router.post("/send-to-forklift",  sendToForklift);
router.post("/send-to-sendToDock",  sendToDock);






export default router;
