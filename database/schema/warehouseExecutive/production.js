import mongoose from "mongoose";
const productionSchema = new mongoose.Schema({
  Production_Line: {
    type: String,
    required: true,
  },
  Process_Qty: {
    type: Number,
    required: true,
    trim: true,
    default: 0,
  },
  SKU_Code: {
    type: String,
    required: true,
    trim: true,
  },
  Sku_Description: {
    type: String,
    trim: true,
  },
  SUT: {
    type: String,
    trim: true,
  },
  UOM: {
    type: String,
    trim: true,
  },
  Transfer_Order: {
    type: Number,
    trim: true,
    default: 0,
  },
  Pallet_Qty: {
    type: Number,
    trim: true,
    default: 0,
  },
  Bin: {
    type: String,
    trim: true,
    default: null,
  },
  Assigned_To: {
    type: String,
    required: true,
    trim: true,
  },
  // Bin: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "BinModel",
  //   default: null,
  // },
  Batch: {
    type: String,
    trim: true,
    default: null,
  },
  Date: {
    type: String,
    trim: true,
    default: null,
  },
  Three_Digit_Codes: {
    type: String,
    trim: true,
    default: null,
  },
  status: { type: String, default: "Pending" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null },
});

const ProductionModel = mongoose.model("Production", productionSchema);

export default ProductionModel;
