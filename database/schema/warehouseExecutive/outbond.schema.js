import mongoose from "mongoose";
const outboundSchema = new mongoose.Schema({
  skus: [
    {
      sku_code: {
        type: String,
        trim: true,
      },
      sku_description: {
        type: String,
        trim: true,
      },
      sut: {
        type: String,
        trim: true,
      },
      stock_qty: {
        type: String,
        trim: true,
      },
    }
  ],
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

  totalStockQty: {
    type: Number,
    default: 0,
  },
  totalSkuCount: {
    type: Number,
    default: 0,
  },

  batch: {
    type: String,
    trim: true,
    default: null,
  },

   status: { type: String, default: "Pending" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null },
});

const OutboundModel = mongoose.model("outbound", outboundSchema);

export default OutboundModel;
