// import express from "express";

// import {
//   AllocateBin,
//   BulkUploadBin,
//   BulkUploadProduction,
//   ListBin,
//   ListProduntion,
// } from "../controllers/production.js";
// import bulk from "../config/bulkUpload/bulk.js";
// const router = express.Router();
// //Raw Veneer
// router.post(
//   "/bulk-upload-production",
//   bulk("/raw_material_bulk_upload").single("excelFile"),
//   BulkUploadProduction
// );
// router.post(
//   "/bulk-upload-bin",
//   bulk("/bin_bulk_upload").single("excelFile"),
//   BulkUploadBin
// );
// router.post("/list-production", ListProduntion);
// router.post("/list-bin", ListBin);
// router.post("/allocate-bin", AllocateBin);
// export default router;
