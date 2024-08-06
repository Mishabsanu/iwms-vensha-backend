import mongoose from "mongoose";
import XLSX from "xlsx";
// import BinModel from "../database/schema/bin.js";

import ProductionModel from "../../database/schema/warehouseExecutive/production.js";
import catchAsync from "../../utils/errors/catchAsync.js";
import MaterialModel from "../../database/schema/masters/materials.schema.js";

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

// export const BulkUploadBin = catchAsync(async (req, res, next) => {
//   const file = req.file;
//   if (!file || !file.path) {
//     return res.status(400).json({
//       result: [],
//       status: false,
//       message: "No file uploaded or file path not found.",
//     });
//   }

//   const session = await BinModel.startSession();
//   session.startTransaction();

//   try {
//     const workbook = XLSX.readFile(file.path);
//     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = XLSX.utils.sheet_to_json(worksheet, {
//       dateNF: "dd-mm-yyyy",
//       raw: false,
//     });
//     console.log(data, "data");

//     if (data.length === 0) {
//       return res.status(400).json({
//         result: [],
//         status: false,
//         message: "No items found in the uploaded file.",
//       });
//     }
//     await BinModel.insertMany(data, {
//       session,
//     });

//     await session.commitTransaction();
//     session.endSession();

//     return res.status(201).json({
//       result: [],
//       status: true,
//       message: "Bin Bulk uploaded successfully.",
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     return res.status(500).json({
//       status: false,
//       message: error.message,
//     });
//   }
// });

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
    const skus = await MaterialModel.find({
      sku_code: new RegExp(q, "i"), // Case-insensitive search
    }).limit(10); // Limit results for performance

    // Map SKUs to include multiple SUT values if applicable
    const skuData = skus.map((sku) => ({
      id: sku._id,
      label: sku.sku_code,
      value: sku.sku_code,
      sku_description: sku.sku_description,
      // Include SUT values specific to the SKU
    }));

    // Create a mapping of SKU to its SUT values
    const skuSutMap = {};
    skus.forEach((sku) => {
      if (!skuSutMap[sku.sku_code]) {
        skuSutMap[sku.sku_code] = [];
      }
      if (sku.sut && !skuSutMap[sku.sku_code].includes(sku.sut)) {
        skuSutMap[sku.sku_code].push(sku.sut);
      }
    });
    console.log(skuData, "skuData");
    console.log(skuSutMap, "skuSutMap");

    return res.status(200).json({
      status: "fail",
      skus: skuData,
      skuSutMap,
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
  const productionData = {
    ...req.body,
  };
  const newProductionList = new ProductionModel(productionData);
  const savedProduction = await newProductionList.save();
  return res.status(201).json({
    result: savedProduction,
    status: true,
    message: "Production created successfully",
  });
});
// export const ListBin = catchAsync(async (req, res) => {
//   const {
//     page = 1,
//     limit = 10,
//     sortBy = "updated_at",
//     sort = "desc",
//     search,
//   } = req.query;

//   var searchQuery = { deleted_at: null };
//   if (search) {
//     const searchRegex = new RegExp(".*" + search + ".*", "i");
//     searchQuery = {
//       ...searchQuery,
//       $or: [
//         { StorageType: searchRegex },
//         { BinNumber: searchRegex },
//         { Code3Digit: searchRegex },
//         { Status: searchRegex },

//         { Batch: searchRegex },
//         { SkuCode: searchRegex },
//       ],
//     };
//   }
//   const totalDocument = await BinModel.countDocuments({
//     ...searchQuery,
//   });
//   const totalPages = Math.ceil(totalDocument / limit);
//   const validPage = Math.min(Math.max(page, 1), totalPages);
//   const skip = Math.max((validPage - 1) * limit, 0);

//   const BinList = await BinModel.aggregate([
//     {
//       $match: { ...searchQuery },
//     },
//     {
//       $sort: { [sortBy]: sort == "desc" ? -1 : 1 },
//     },
//     {
//       $skip: skip,
//     },
//     {
//       $limit: limit,
//     },
//   ]);
//   if (BinList) {
//     return res.status(200).json({
//       result: BinList,
//       status: true,
//       totalPages: totalPages,
//       currentPage: validPage,
//       message: "All Bin List",
//     });
//   }
// });

// export const AllocateBin = catchAsync(async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const transferOrderIds = req.body.item_details.map((item) => item._id);
//     const transferOrders = await ProductionModel.find({
//       _id: { $in: transferOrderIds },
//     }).session(session);
//     let bins = await BinModel.find({ Status: { $ne: "No Available" } }).session(
//       session
//     );

//     // Initialize a map to store bin allocations and array for not available bins
//     const binAllocations = {};
//     const notAvailableBins = [];

//     // Function to check and allocate bins
//     const allocateToBin = async (bin, transferOrder) => {
//       const binKey = `${bin._id}`;

//       // Check if the bin has enough capacity
//       if (bin.AvailableCapacity >= transferOrder.Pallet_Qty) {
//         if (!binAllocations[binKey]) {
//           binAllocations[binKey] = {
//             bin,
//             transferOrders: [],
//             allocatedQty: 0,
//             threeDigitCode: bin.Code3Digit,
//             BinNumber: bin.BinNumber,
//           };
//         }
//         binAllocations[binKey].transferOrders.push(transferOrder._id);
//         binAllocations[binKey].allocatedQty += transferOrder.Pallet_Qty;
//         bin.AvailableCapacity -= transferOrder.Pallet_Qty;
//       } else {
//         // If there's not enough capacity, do not allocate the order
//         notAvailableBins.push({
//           SKU_Code: transferOrder.SKU_Code,
//           Batch: transferOrder.Batch,
//           Pallet_Qty: transferOrder.Pallet_Qty,
//           binId: bin._id,
//         });
//       }
//     };

//     // Check for partial bins and fully available bins
//     transferOrders.forEach((order) => {
//       let allocated = false;
//       bins.forEach((bin) => {
//         if (
//           bin.AvailableCapacity > 0 &&
//           bin.AvailableCapacity <= bin.BinCapacity &&
//           bin.SkuCode === order.SKU_Code &&
//           bin.Batch === order.Batch
//         ) {
//           allocateToBin(bin, order);
//           allocated = true;
//         } else if (
//           bin.AvailableCapacity >= order.Pallet_Qty &&
//           bin.SkuCode === order.SKU_Code &&
//           bin.Batch === order.Batch
//         ) {
//           allocateToBin(bin, order);
//           allocated = true;
//         }
//       });

//       if (!allocated) {
//         notAvailableBins.push({
//           SKU_Code: order.SKU_Code,
//           Batch: order.Batch,
//           Pallet_Qty: order.Pallet_Qty,
//         });
//       }
//     });

//     // If there are any not available bins, abort the transaction and return an error response
//     if (notAvailableBins.length > 0) {
//       await session.abortTransaction();
//       session.endSession();

//       // Construct a detailed error message
//       const message = `Bins are not available for the required pallet quantity:\n${notAvailableBins
//         .map(
//           (bin) =>
//             `SKU_Code: ${bin.SKU_Code}, Batch: ${bin.Batch}, Pallet_Qty: ${bin.Pallet_Qty}`
//         )
//         .join("\n")}`;

//       return res.status(400).json({
//         status: false,
//         message: message,
//         result: notAvailableBins,
//       });
//     }

//     // Update the bins and transfer orders in the database
//     const binUpdates = Object.values(binAllocations).map(async (allocation) => {
//       const bin = allocation.bin;
//       const transferOrderIds = allocation.transferOrders;

//       try {
//         console.log("Updating bin:", bin._id);
//         console.log("With transfer orders:", transferOrderIds);
//         const newStatus =
//           bin.AvailableCapacity === 0
//             ? "No Available"
//             : bin.AvailableCapacity <= bin.BinCapacity
//             ? "Partial Available"
//             : "Available";
//         await BinModel.updateOne(
//           { _id: bin._id },
//           {
//             AvailableCapacity: bin.AvailableCapacity,
//             Status: newStatus,
//           },
//           { session }
//         );

//         await ProductionModel.updateMany(
//           { _id: { $in: transferOrderIds } },
//           {
//             Bin: allocation.BinNumber,
//             status: "Allocated",
//             Three_Digit_Codes: allocation.threeDigitCode,
//           },
//           { session }
//         );
//       } catch (error) {
//         console.error("Update error:", error);
//         await session.abortTransaction();
//         session.endSession();
//         throw error;
//       }
//     });

//     await Promise.all(binUpdates);

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       status: true,
//       message: "Bins allocated successfully",
//       result: Object.values(binAllocations),
//     });
//   } catch (err) {
//     console.error("Error allocating bins:", err);
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     session.endSession();
//     res.status(500).json({
//       status: "error",
//       message: err.message,
//     });
//   }
// });
