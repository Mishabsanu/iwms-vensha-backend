import mongoose from "mongoose";
const outboundSchema = new mongoose.Schema({
  stock_qty: {
    type: Number,
    required: true,
    trim: true,
    default: 0,
  },
  sku_code: {
    type: String,
    required: true,
    trim: true,
  },
  sku_description: {
    type: String,
    required: true,
    trim: true,
  },
  sut: {
    type: String,
    required: true,
    trim: true,
  },
  order_type: {
    type: String,
    required: true,
    trim: true,
  },

  entity_name: {
    type: mongoose.Types.ObjectId,
    ref: "customers",
    required: true,
    trim: true,
  },

  order_number: {
    type: Number,
    // required: true,
    // trim: true,
  },

  date: {
    type: String,
    required: [true, "Date is required."],
  },

  order_count: {
    type: Number,
    default: 1,
  },
  sku_count: {
    type: Number,
    default: 0,
  },
  order_qty_count: {
    type: Number,
    default: 0,
  },

  // status: { type: String, default: "Pending" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null },
});

const OutboundModel = mongoose.model("outbound", outboundSchema);

export default OutboundModel;
