import XLSX from "xlsx";
import MaterialModel from "../../database/schema/masters/materials.schema.js";
import ProductionModel from "../../database/schema/warehouseExecutive/production.js";
import catchAsync from "../../utils/errors/catchAsync.js";
import BinModel from "../../database/schema/bin.js";
import mongoose from "mongoose";

export const BulkUploadProduction = catchAsync(async (req, res, next) => {
  const file = req.file;
  if (!file || !file.path) {
    return res.status(400).json({
      result: [],
      status: false,
      message: "No file uploaded or file path not found.",
    });
  }

  const session = await ProductionModel.startSession();
  session.startTransaction();

  try {
    const workbook = XLSX.readFile(file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, {
      dateNF: "dd-mm-yyyy",
      raw: false,
    });
    console.log(data, "data");

    if (data.length === 0) {
      return res.status(400).json({
        result: [],
        status: false,
        message: "No items found in the uploaded file.",
      });
    }
    await ProductionModel.insertMany(data, {
      session,
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      result: [],
      status: true,
      message: "Pallet Bulk uploaded successfully.",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
});

export const BulkUploadBin = catchAsync(async (req, res, next) => {
  const file = req.file;
  if (!file || !file.path) {
    return res.status(400).json({
      result: [],
      status: false,
      message: "No file uploaded or file path not found.",
    });
  }

  const session = await BinModel.startSession();
  session.startTransaction();

  try {
    const workbook = XLSX.readFile(file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, {
      dateNF: "dd-mm-yyyy",
      raw: false,
    });
    console.log(data, "data");

    if (data.length === 0) {
      return res.status(400).json({
        result: [],
        status: false,
        message: "No items found in the uploaded file.",
      });
    }
    await BinModel.insertMany(data, {
      session,
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      result: [],
      status: true,
      message: "Bin Bulk uploaded successfully.",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
});

export const ListProduntion = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "updated_at",
    sort = "desc",
    search,
  } = req.query;
  console.log(search);

  var searchQuery = { deleted_at: null };
  if (search) {
    const searchRegex = new RegExp(".*" + search + ".*", "i");
    searchQuery = {
      ...searchQuery,
      $or: [
        { Production_Line: searchRegex },
        { SKU_Code: searchRegex },
        { SUT: searchRegex },
        { status: searchRegex },
        { Assigned_To: searchRegex },
        { Batch: searchRegex },
        { Bin: searchRegex },
      ],
    };
  }

  const totalDocument = await ProductionModel.countDocuments({
    ...searchQuery,
  });
  const totalPages = Math.ceil(totalDocument / limit);
  const validPage = Math.min(Math.max(page, 1), totalPages);
  const skip = Math.max((validPage - 1) * limit, 0);

  const produntionLineList = await ProductionModel.aggregate([
    {
      $match: { ...searchQuery },
    },
    {
      $sort: { [sortBy]: sort == "desc" ? -1 : 1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: "users", // The name of the User collection
        localField: "assigned_to", // The field in ProductionModel to match
        foreignField: "_id", // The field in the User collection to match
        as: "assigned_user", // The name of the field to add the matched documents
      },
    },
    {
      $unwind: {
        path: "$assigned_user",
        preserveNullAndEmptyArrays: true, // Preserves the document if no match is found
      },
    },
    {
      $lookup: {
        from: "production_lines", // The name of the ProductLine collection
        localField: "production_line", // The field in ProductionModel to match
        foreignField: "_id", // The field in the ProductLine collection to match
        as: "production_line_details", // The name of the field to add the matched documents
      },
    },
    {
      $unwind: {
        path: "$production_line_details",
        preserveNullAndEmptyArrays: true, // Preserves the document if no match is found
      },
    },
  ]);

  if (produntionLineList) {
    return res.status(200).json({
      result: produntionLineList,
      status: true,
      totalPages: totalPages,
      currentPage: validPage,
      message: "All ProduntionLine List",
    });
  }
});

export const FetchSkuDetails = catchAsync(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      status: "fail",
      message: 'Query parameter "q" is required',
    });
  }

  try {
    // Find SKUs matching the query
    const skus = await MaterialModel.find({
      sku_code: new RegExp(q, "i"), // Case-insensitive search
    }).limit(10); // Limit results for performance

    // Extract unique SKU codes
    // const matchedSkuCodes = [...new Set(skus.map((sku) => sku.sku_code))];

    console.log(skus, "matchedSkuCodes");

    return res.status(200).json({
      status: "success",
      data: skus, // Return only the array of matched SKU codes
      message: "List",
    });
  } catch (error) {
    console.error("Error fetching SKUs:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching SKUs",
    });
  }
});

export const FetchAllSkuDetails = catchAsync(async (req, res) => {
  const { sku_code } = req.query;

  try {
    if (!sku_code) {
      return res.status(400).json({
        status: false,
        message: "sku_code query parameter is required",
      });
    }

    // Use aggregation to get unique sku_code, sku_decr, and sut
    const result = await MaterialModel.aggregate([
      { $match: { sku_code: sku_code } },
      {
        $group: {
          _id: "$sku_code",
          uniqueSkuDecrs: { $addToSet: "$sku_description" },
          uniqueSuts: { $addToSet: "$sut" },
        },
      },
      {
        $project: {
          _id: 0,
          uniqueSkuCodes: "$_id",
          uniqueSkuDecrs: 1,
          uniqueSuts: 1,
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No records found",
      });
    }

    const { uniqueSkuCodes, uniqueSkuDecrs, uniqueSuts } = result[0];

    return res.status(200).json({
      status: true,
      data: {
        uniqueSkuCodes: [uniqueSkuCodes],
        uniqueSkuDecrs: uniqueSkuDecrs,
        uniqueSuts: uniqueSuts,
      },
      message: "List",
    });
  } catch (error) {
    console.error("Error fetching SKUs:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching SKUs",
    });
  }
});

export const AddProduction = catchAsync(async (req, res) => {
  const { process_order_qty, pallet_qty } = req.body;

  // Calculate the number of full pallets and the remaining quantity
  const fullPalletsCount = Math.floor(process_order_qty / pallet_qty);
  const remainingQty = process_order_qty % pallet_qty;

  // Get the latest transfer order number from the database
  const latestProduction = await ProductionModel.findOne().sort({
    transfer_order: -1,
  });
  const startingTransferOrderNo = latestProduction
    ? latestProduction.transfer_order + 1
    : 1;

  // Create production entries for the full pallets
  const productionEntries = [];

  for (let i = 0; i < fullPalletsCount; i++) {
    productionEntries.push({
      ...req.body,
      pallet_qty: pallet_qty,
      transfer_order: startingTransferOrderNo + i,
    });
  }

  // Add the remaining quantity as the last production entry if there's any
  if (remainingQty > 0) {
    productionEntries.push({
      ...req.body,
      pallet_qty: remainingQty,
      transfer_order: startingTransferOrderNo + fullPalletsCount,
    });
  }

  // Save all production entries to the database
  const savedProductions = await ProductionModel.insertMany(productionEntries);

  return res.status(201).json({
    result: savedProductions,
    status: true,
    message: "Production entries created successfully",
  });
});
export const ListBin = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "updated_at",
    sort = "desc",
    search,
  } = req.query;

  var searchQuery = { deleted_at: null };
  if (search) {
    const searchRegex = new RegExp(".*" + search + ".*", "i");
    searchQuery = {
      ...searchQuery,
      $or: [
        { StorageType: searchRegex },
        { BinNumber: searchRegex },
        { Code3Digit: searchRegex },
        { Status: searchRegex },

        { Batch: searchRegex },
        { SkuCode: searchRegex },
      ],
    };
  }
  const totalDocument = await BinModel.countDocuments({
    ...searchQuery,
  });
  const totalPages = Math.ceil(totalDocument / limit);
  const validPage = Math.min(Math.max(page, 1), totalPages);
  const skip = Math.max((validPage - 1) * limit, 0);

  const BinList = await BinModel.aggregate([
    {
      $match: { ...searchQuery },
    },
    {
      $sort: { [sortBy]: sort == "desc" ? -1 : 1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);
  if (BinList) {
    return res.status(200).json({
      result: BinList,
      status: true,
      totalPages: totalPages,
      currentPage: validPage,
      message: "All Bin List",
    });
  }
});

export const AllocateBin = catchAsync(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transferOrderIds = req.body.item_details.map((item) => item._id);
    const transferOrders = await ProductionModel.find({
      _id: { $in: transferOrderIds },
    }).session(session);
    let bins = await BinModel.find({ status: { $ne: "No Available" } }).session(session);

    const binAllocations = {};
    const notAvailableBins = [];

    const allocateToBin = (bin, transferOrder) => {
      const binKey = `${bin._id}`;

      if (bin.available_capacity >= transferOrder.pallet_qty) {
        if (!binAllocations[binKey]) {
          binAllocations[binKey] = {
            bin,
            transferOrders: [],
            allocatedQty: 0,
            digit_3_codes: bin.digit_3_codes,
            bin_no: bin.bin_no,
          };
        }
        binAllocations[binKey].transferOrders.push(transferOrder._id);
        binAllocations[binKey].allocatedQty += transferOrder.pallet_qty;
        bin.available_capacity -= transferOrder.pallet_qty;
      } else {
        notAvailableBins.push({
          sku_code: transferOrder.sku_code,
          batch: transferOrder.batch,
          pallet_qty: transferOrder.pallet_qty,
          binId: bin._id,
        });
      }
    };

    transferOrders.forEach((order) => {
      let allocated = false;

      bins.forEach((bin) => {
        if (
          bin.available_capacity > 0 &&
          bin.available_capacity <= bin.bin_capacity &&
          bin.sku_code === order.sku_code &&
          bin.batch === order.batch
        ) {
          allocateToBin(bin, order);
          allocated = true;
        } else if (
          bin.available_capacity >= order.pallet_qty &&
          bin.sku_code === order.sku_code &&
          bin.batch === order.batch
        ) {
          allocateToBin(bin, order);
          allocated = true;
        }
      });

      if (!allocated) {
        notAvailableBins.push({
          sku_code: order.sku_code,
          batch: order.batch,
          pallet_qty: order.pallet_qty,
        });
      }
    });

    if (notAvailableBins.length > 0) {
      await session.abortTransaction();
      session.endSession();

      const message = `Bins are not available for the required pallet quantity:\n${notAvailableBins
        .map(
          (bin) =>
            `SKU Code: ${bin.sku_code}, Batch: ${bin.batch}, Pallet Qty: ${bin.pallet_qty}`
        )
        .join("\n")}`;

      return res.status(400).json({
        status: false,
        message: message,
        result: notAvailableBins,
      });
    }

    const binUpdates = Object.values(binAllocations).map(async (allocation) => {
      const bin = allocation.bin;
      const transferOrderIds = allocation.transferOrders;

      const newStatus =
        bin.available_capacity === 0
          ? "No Available"
          : bin.available_capacity <= bin.bin_capacity
          ? "Partial Available"
          : "Available";

      await BinModel.updateOne(
        { _id: bin._id },
        {
          available_capacity: bin.available_capacity,
          status: newStatus,
        },
        { session }
      );

      await ProductionModel.updateMany(
        { _id: { $in: transferOrderIds } },
        {
          bin: allocation.bin_no,
          status: "Allocated",
          digit_3_codes: allocation.digit_3_codes,
        },
        { session }
      );
    });

    await Promise.all(binUpdates);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      status: true,
      message: "Bins allocated successfully",
      result: Object.values(binAllocations),
    });
  } catch (err) {
    console.error("Error allocating bins:", err);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

