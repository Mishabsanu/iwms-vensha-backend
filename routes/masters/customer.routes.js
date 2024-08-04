import express from "express";

import {
  AddCustomerMaster,
  ListCustomerMaster,
  UpdateCustomerMaster,
} from "../../controllers/masters/customer.js";
import CheckRoleAndTokenAccess from "../../middlewares/permission.js";

const router = express.Router();

router.post("/add-customer", CheckRoleAndTokenAccess, AddCustomerMaster);
router.post("/update-customer", CheckRoleAndTokenAccess, UpdateCustomerMaster);
router.post("/list-customer", CheckRoleAndTokenAccess, ListCustomerMaster);
export default router;
