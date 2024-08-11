import express from "express";
import bulk from "../../config/bulkUpload/bulk.js";
import {
  AddProduction,
  AllocateBin,
  BinOverflow,
  BulkUploadBin,
  BulkUploadProduction,
  CrossDockerAllocate,
  FetchAllSkuDetails,
  FetchSkuDetails,
  GetAllStatusCount,
  ListBin,
  ListProduntion,
  ListStockTable,
  ListTransaction,
  UpdatePartialQtyToDeleteMaster,
  UpdateProduntionMaster,
  VerifyBin,
} from "../../controllers/warehouseExecutive/production.js";
import CheckRoleAndTokenAccess from "../../middlewares/permission.js";
const router = express.Router();
//Raw Veneer
router.post(
  "/bulk-upload-production",
  bulk("/raw_material_bulk_upload").single("excelFile"),
  BulkUploadProduction
);
router.post(
  "/bulk-upload-bin",
  bulk("/bin_bulk_upload").single("excelFile"),
  BulkUploadBin
);
router.post("/add-production", CheckRoleAndTokenAccess, AddProduction);
router.post("/list-production", CheckRoleAndTokenAccess, ListProduntion);
router.post("/list-stock-table", CheckRoleAndTokenAccess, ListStockTable);
router.post("/list-transaction", CheckRoleAndTokenAccess, ListTransaction); 
router.post("/update-partial-to-delete-production", CheckRoleAndTokenAccess, UpdatePartialQtyToDeleteMaster); 
router.post("/update-production", CheckRoleAndTokenAccess, UpdateProduntionMaster); 
router.get("/sku-details", FetchSkuDetails);
router.get("/get-all-status-count", GetAllStatusCount);
router.get("/sku-all-details", FetchAllSkuDetails);
router.post("/list-bin", ListBin);
router.post("/allocate-bin", AllocateBin);
router.post("/cross-docker-allocate", CrossDockerAllocate);
router.post("/verify-bin", VerifyBin);
router.post("/bin-overflow-allocate", BinOverflow);
export default router;
