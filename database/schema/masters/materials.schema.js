
import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema({
  // item_id: {
  //   type: String,
  //   required: [true, "Item ID is required."],
  //   trim: true,
  // },
  warehouse_code: {
    type: String,
    required: [true, "Warehouse Code is required."],
    trim: true,
  },
  item_type: {
    type: String,
    required: [true, "Item Type is required."],
    trim: true,
  },
  storage_type: {
    type: String,
    required: [true, "Storage Type is required."],
    trim: true,
  },
  vendor_code: {
    type: String,
    required: [true, "Vendor Code is required."],
    trim: true,
  },
  customer_code: {
    type: String,
    required: [true, "Customer Code is required."],
    trim: true,
  },
  sku_code: {
    type: String,
    required: [true, "Sku Code is required."],
    trim: true,
  },
  sku_description: {
    type: String,
    required: [true, "Sku description is required."],
    trim: true,
  },
  // wh_code: {
  //   type: String,
  //   required: [true, "WH Code is required."],
  //   trim: true,
  // },
  material_detail: {
    type: String,
    required: [true, "Material Detail is required."],
    trim: true,
  },
  item_life: {
    type: Number,
    required: [true, "Item Life is required."],
  },
  sut: {
    type: String,
    required: [true, "SUT is required."],
    trim: true,
  },
  sut_qty: {
    type: Number,
    required: [true, "SUT QTY is required."],
  },
  pallet_qty: {
    type: Number,
    required: [true, "PALLET QTY is required."],
  },
  unit: {
    type: String,
    required: [true, "Unit is required."],
    trim: true,
  },
  sub_category: {
    type: String,
    required: [true, "Sub Category is required."],
    trim: true,
  },
  combination: {
    type: String,
    required: [true, "Combination is required."],
    trim: true,
  },
  bulk_structure: {
    type: String,
    required: [true, "Bulk Structure is required."],
    trim: true,
  },
  length: {
    type: Number,
    required: [true, "Length is required."],
  },
  breadth: {
    type: Number,
    required: [true, "Breadth is required."],
  },
  height: {
    type: Number,
    required: [true, "Height is required."],
  },
  total_craft: {
    type: Number,
    required: [true, "Total Craft is required."],
  },
  gross_weight: {
    type: Number,
    required: [true, "Gross Weight is required."],
  },
  actual_weight: {
    type: Number,
    required: [true, "Actual Weight is required."],
  },
  excel_filename: {
    type: String,
    required: [true, "Excel File Name is required."],
    trim: true,
  },
  sku_grp: {
    type: String,
    required: [true, "SKU Group is required."],
    trim: true,
  },
  ssi: {
    type: String,
    required: [true, "SSI is required."],
    trim: true,
  },
  sub_category: {
    type: String,
    required: [true, "Sub Category is required."],
    trim: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  created_employee_id: {
    type: mongoose.Types.ObjectId,
    ref: "users",
    required: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null },
});

const MaterialModel = mongoose.model("Material", MaterialSchema);

export default MaterialModel;
