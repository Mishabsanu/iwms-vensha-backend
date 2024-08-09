import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema({
  item_id: {
    type: String,
    trim: true,
  },
  warehouse_code: {
    type: String,

    trim: true,
  },
  item_type: {
    type: String,
    trim: true,
  },
  storage_type: {
    type: String,

    trim: true,
  },
  vendor_code: {
    type: String,

    trim: true,
  },
  customer_code: {
    type: String,

    trim: true,
  },
  sku_code: {
    type: String,

    trim: true,
  },
  sku_description: {
    type: String,

    trim: true,
  },
  wh_code: {
    type: String,
    trim: true,
  },
  sku_description: {
    type: String,

    trim: true,
  },
  item_life: {
    type: Number,
  },
  sut: {
    type: String,

    trim: true,
  },
  sut_qty: {
    type: Number,
  },
  pallete_qty: {
    type: Number,
  },
  unit: {
    type: String,

    trim: true,
  },
  sub_category: {
    type: String,

    trim: true,
  },
  combination: {
    type: String,

    trim: true,
  },
  bulk_structure: {
    type: String,

    trim: true,
  },
  length: {
    type: Number,
  },
  breadth: {
    type: Number,
  },
  height: {
    type: Number,
  },
  total_craft: {
    type: Number,
  },
  gross_weight: {
    type: Number,
  },
  actual_weight: {
    type: Number,
  },
  excel_filename: {
    type: String,

    trim: true,
  },
  sku_grp: {
    type: String,

    trim: true,
  },
  ssi: {
    type: String,

    trim: true,
  },
  sub_category: {
    type: String,

    trim: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  // created_employee_id: {
  //   type: mongoose.Types.ObjectId,
  //   ref: "users",
  //   required: true,
  // },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null },
});

const MaterialModel = mongoose.model("Material", MaterialSchema);

export default MaterialModel;
