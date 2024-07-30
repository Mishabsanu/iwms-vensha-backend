import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema({
  warehouse_code: {
    type: String,
    required: [true, "Warehouse Code is required."],
    trim: true,
  },
  item_type: {
    type: String,
    required: true,
    trim: true,
  },

  storage_type: {
    type: String,
    required: true,
    trim: true,
  },
  customer_code: {
    type: String,
    required: true,
    trim: true,
  },
  vendor_no: {
    type: String,
    required: true,
    trim: true,
  },
  sap_code: {
    type: String,
    required: true,
    trim: true,
  },
  material_detail: {
    type: String,
    required: true,
    trim: true,
  },
  sut: {
    type: String,
    required: true,
    trim: true,
  },
  pallet_qty: {
    type: String,
    required: true,
    trim: true,
  },
  sku_group: {
    type: String,
    required: true,
    trim: true,
  },
  sii: {
    type: String,
    required: true,
    trim: true,
  },
  sub_category: {
    type: String,
    required: true,
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
    trim: true,
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null },
});

const MaterialModel = mongoose.model("material", MaterialSchema);

export default MaterialModel;
