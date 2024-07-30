import express from "express";

import CheckRoleAndTokenAccess from "../../middlewares/permission.js";
import {
  AddMaterialMaster,
  ListMaterialMaster,
  ListMaterialMasterWithOutPermission,
  UpdateMaterialMaster,
} from "../../controllers/masters/material.js";

const router = express.Router();

router.post("/add-material-master", CheckRoleAndTokenAccess, AddMaterialMaster);
router.post(
  "/update-material-master",
  CheckRoleAndTokenAccess,
  UpdateMaterialMaster
);
router.post(
  "/list-material-master",
  CheckRoleAndTokenAccess,
  ListMaterialMaster
);
router.get(
  "/list-material-master-without-permission",
  ListMaterialMasterWithOutPermission
);

export default router;
