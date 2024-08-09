import express from "express";
import bulk from "../../config/bulkUpload/bulk.js";
import {
  AddProduction,
  AllocateBin,
  BulkUploadBin,
  BulkUploadProduction,
  FetchAllSkuDetails,
  FetchSkuDetails,
  ListBin,
  ListProduntion,
  VerifyBin,
} from "../../controllers/warehouseExecutive/production.js";
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
router.post("/add-production", AddProduction);
router.post("/list-production", ListProduntion);
router.get("/sku-details", FetchSkuDetails);
router.get("/sku-all-details", FetchAllSkuDetails);
router.post("/list-bin", ListBin);
router.post("/allocate-bin", AllocateBin);
router.post("/verify-bin", VerifyBin);
export default router;
