import { Schema, model } from "mongoose";

const binSchema = new Schema({
  StorageType: {
    type: String,
    required: true,
  },
  StorageSection: {
    type: String,
    minlength: 1,
    maxlength: 25,
    required: true,
    trim: true,
  },
  BinNumber: {
    type: String,
    minlength: 1,
    maxlength: 25,
    required: true,
    trim: true,
  },
  Description: {
    type: String,
    trim: true,
    default: null,
  },
  BinCapacity: {
    type: Number,
    trim: true,
    default: 0,
  },
  Code3Digit: {
    type: String,
    trim: true,
    default: null,
  },
  InboundTransferOrder: {
    type: Number,
    trim: true,
    default: null,
  },
  Batch: {
    type: String,
    trim: true,
    default: null,
  },
  SkuCode: {
    type: String,
    trim: true,
    default: null,
  },

  OutboundTransfeOrder: {
    type: String,
    trim: true,
    default: null,
  },
  AvailableCapacity: {
    type: Number,
    trim: true,
    default: 0,
  },
  Status: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null },
});

const BinModel = model("Bin", binSchema);
export default BinModel;
