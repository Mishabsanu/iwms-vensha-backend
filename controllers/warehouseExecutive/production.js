import XLSX from "xlsx";
import MaterialModel from "../../database/schema/masters/materials.schema.js";
import ProductionModel from "../../database/schema/warehouseExecutive/production.js";
import catchAsync from "../../utils/errors/catchAsync.js";

import mongoose from "mongoose";
import UserModel from "../../database/schema/user.schema.js";
import StorageSearchModel from "../../database/schema/masters/storageSearch.schema.js";
import BinModel from "../../database/schema/masters/bin.schema.js";
import RolesModel from "../../database/schema/roles.schema.js";

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

  const authUserDetail = req.userDetails;
  const userId = authUserDetail._id;

  // Fetch user and their role details
  const user = await UserModel.findOne({ _id: userId }).populate("role_id"); // Assuming 'role' is a reference field
  if (!user) {
    return res.status(404).json({
      status: false,
      message: "User not found",
    });
  }

  const isAdmin = user.role_id.role_name === "Admin"; // Adjust based on how you store and reference roles
  let searchQuery = { deleted_at: null };

  // If the user is not an admin, filter by the authenticated user's ID
  if (!isAdmin) {
    searchQuery = { ...searchQuery, created_employee_id: userId };
  }

  if (search) {
    const searchRegex = new RegExp(".*" + search + ".*", "i");
    searchQuery = {
      ...searchQuery,
      $or: [
        { sku_code: searchRegex },
        { sut: searchRegex },
        { status: searchRegex },
        { batch: searchRegex },
        { bin: searchRegex },
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
      $sort: {
        [sortBy]: sort === "desc" ? -1 : 1,
        ["transfer_order"]: sort === "desc" ? -1 : 1,
      },
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
      $or: [
        { sku_code: new RegExp(q, "i") }, // Case-insensitive search for sku_code
        { sku_description: new RegExp(q, "i") }, // Case-insensitive search for sku_description
      ],
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
      {
        $match: {
          $or: [{ sku_code: sku_code }, { sku_description: sku_code }],
        },
      },
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
  try {
    const { process_order_qty, pallet_qty, assigned_to } = req.body;
    const authUserDetail = req.userDetails;
    // Ensure correct types
    const processOrderQty = Number(process_order_qty);
    const palletQty = Number(pallet_qty);

    if (isNaN(processOrderQty) || isNaN(palletQty)) {
      return res.status(400).json({
        status: false,
        message: "Invalid quantity values provided",
      });
    }

    // Calculate the number of full pallets and the remaining quantity
    const fullPalletsCount = Math.floor(processOrderQty / palletQty);
    const remainingQty = processOrderQty % palletQty;

    // Get the latest transfer order number from the database
    const latestProduction = await ProductionModel.findOne().sort({
      transfer_order: -1,
    });
    const startingTransferOrderNo = latestProduction
      ? latestProduction.transfer_order + 1
      : 1;

    // Determine how many assigned_to IDs are available
    const assignedToCount = assigned_to.length;

    // Create production entries for the full pallets
    const productionEntries = [];

    // Determine how many production entries to create (full pallets + possibly one more for remaining quantity)
    const totalEntries = fullPalletsCount + (remainingQty > 0 ? 1 : 0);

    for (let i = 0; i < totalEntries; i++) {
      // Calculate the pallet quantity for the current entry
      const currentPalletQty = i < fullPalletsCount ? palletQty : remainingQty;

      // Calculate the assigned_to index (looping if there are more entries than assigned_to IDs)
      const assignedToIndex = i % assignedToCount;

      productionEntries.push({
        ...req.body,
        pallet_qty: currentPalletQty,
        created_employee_id: authUserDetail._id,
        transfer_order: startingTransferOrderNo + i,
        assigned_to: assigned_to[assignedToIndex],
        transaction_type: "inbount",
      });
    }

    // Save all production entries to the database
    const savedProductions = await ProductionModel.insertMany(
      productionEntries
    );

    return res.status(201).json({
      result: savedProductions,
      status: true,
      message: "Production entries created successfully",
    });
  } catch (error) {
    console.error("Error creating production entries:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while creating production entries",
      error: error.message,
    });
  }
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
        { storage_type: searchRegex },
        { bin_no: searchRegex },
        {
          digit_3_codes: searchRegex,
        },
        { status: searchRegex },

        { batch: searchRegex },
        { sku_code: searchRegex },
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

// export const AllocateBin = catchAsync(async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const transferOrderIds = req.body.item_details.map((item) => item._id);
//     const transferOrders = await ProductionModel.find({
//       _id: { $in: transferOrderIds },
//     }).session(session);
//     let bins = await BinModel.find({ status: { $ne: "No Available" } }).session(
//       session
//     );

//     const binAllocations = {};
//     const notAvailableBins = [];

//     const allocateToBin = (bin, transferOrder) => {
//       const binKey = `${bin._id}`;

//       if (bin.available_capacity >= transferOrder.pallet_qty) {
//         if (!binAllocations[binKey]) {
//           binAllocations[binKey] = {
//             bin,
//             transferOrders: [],
//             allocatedQty: 0,
//             digit_3_codes: bin.digit_3_codes,
//             bin_no: bin.bin_no,
//           };
//         }
//         binAllocations[binKey].transferOrders.push(transferOrder._id);
//         binAllocations[binKey].allocatedQty += transferOrder.pallet_qty;
//         bin.available_capacity -= transferOrder.pallet_qty;
//       } else {
//         notAvailableBins.push({
//           sku_code: transferOrder.sku_code,
//           batch: transferOrder.batch,
//           pallet_qty: transferOrder.pallet_qty,
//           binId: bin._id,
//         });
//       }
//     };

//     transferOrders.forEach((order) => {
//       let allocated = false;

//       bins.forEach((bin) => {
//         if (
//           bin.available_capacity > 0 &&
//           bin.available_capacity <= bin.bin_capacity &&
//           bin.sku_code === order.sku_code &&
//           bin.batch === order.batch
//         ) {
//           allocateToBin(bin, order);
//           allocated = true;
//         } else if (
//           bin.available_capacity >= order.pallet_qty &&
//           bin.sku_code === order.sku_code &&
//           bin.batch === order.batch
//         ) {
//           allocateToBin(bin, order);
//           allocated = true;
//         }
//       });

//       if (!allocated) {
//         notAvailableBins.push({
//           sku_code: order.sku_code,
//           batch: order.batch,
//           pallet_qty: order.pallet_qty,
//         });
//       }
//     });

//     if (notAvailableBins.length > 0) {
//       await session.abortTransaction();
//       session.endSession();

//       const message = `Bins are not available for the required pallet quantity:\n${notAvailableBins
//         .map(
//           (bin) =>
//             `SKU Code: ${bin.sku_code}, Batch: ${bin.batch}, Pallet Qty: ${bin.pallet_qty}`
//         )
//         .join("\n")}`;

//       return res.status(400).json({
//         status: false,
//         message: message,
//         result: notAvailableBins,
//       });
//     }

//     const binUpdates = Object.values(binAllocations).map(async (allocation) => {
//       const bin = allocation.bin;
//       const transferOrderIds = allocation.transferOrders;

//       const newStatus =
//         bin.available_capacity === 0
//           ? "No Available"
//           : bin.available_capacity <= bin.bin_capacity
//           ? "Partial Available"
//           : "Available";

//       await BinModel.updateOne(
//         { _id: bin._id },
//         {
//           available_capacity: bin.available_capacity,
//           status: newStatus,
//         },
//         { session }
//       );

//       await ProductionModel.updateMany(
//         { _id: { $in: transferOrderIds } },
//         {
//           bin: allocation.bin_no,
//           status: "Allocated",
//           digit_3_codes: allocation.digit_3_codes,
//         },
//         { session }
//       );
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

export const VerifyBin = catchAsync(async (req, res) => {
  try {
    // Extracting digit_3_codes and _id from the request body
    const { digit_3_codes, _id } = req.body;
    console.log(digit_3_codes, _id);

    // Fetching the document by _id
    const production = await ProductionModel.findById(_id);
    if (!production) {
      return res.status(404).json({
        status: false,
        message: "Bin not found",
      });
    }
    // Checking if the provided digit_3_codes matches the one in the database
    if (production.digit_3_codes === digit_3_codes) {
      const now = new Date();
      const formattedDateTime = now.toISOString();
      production.confirm_date = formattedDateTime;
      production.status = "verified"; // Update with your actual field name for status
      await production.save();
      return res.status(200).json({
        status: true,
        message: "Digit codes match",
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Digit codes do not match",
      });
    }
  } catch (error) {
    console.error("Error verifying bin:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while verifying the bin",
    });
  }
});

export const CrossDockerAllocate = catchAsync(async (req, res) => {
  try {
    const { items } = req.body;
    console.log(items, "items");

    if (!items || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No items provided",
      });
    }

    // Create an array to store update promises
    const updatePromises = items.map(async (item) => {
      const { id, cross_dock_name } = item;

      // Generate a 3-character code
      const threeCharCode = "111";

      // Update the production collection
      return ProductionModel.updateOne(
        { _id: id }, // Find the document by its ID
        {
          $set: {
            bin: cross_dock_name,
            digit_3_codes: threeCharCode,
            status: "Allocated",
          },
        } // Set the new values
      );
    });

    // Execute all update promises
    await Promise.all(updatePromises);

    return res.status(200).json({
      result: items,
      status: true,
      message: "Production updated successfully",
    });
  } catch (error) {
    console.error("Error updating production:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating the production",
    });
  }
});

export const ListStockTable = catchAsync(async (req, res) => {
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
        { production_line: searchRegex },
        { sku_code: searchRegex },
        { sut: searchRegex },
        { status: searchRegex },
        { assigned_to: searchRegex },
        { batch: searchRegex },
        { bin: searchRegex },
      ],
    };
  }

  const totalDocument = await ProductionModel.countDocuments({
    ...searchQuery,
    bin: { $ne: null },
    status: "verified",
  });
  const totalPages = Math.ceil(totalDocument / limit);
  const validPage = Math.min(Math.max(page, 1), totalPages);
  const skip = Math.max((validPage - 1) * limit, 0);

  const produntionLineList = await ProductionModel.aggregate([
    {
      $match: {
        ...searchQuery,
        bin: { $ne: null },
        status: "verified",
      },
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
    {
      $lookup: {
        from: "bins", // The name of the BinModel collection
        localField: "bin_id", // The field in ProductionModel to match
        foreignField: "_id", // The field in the BinModel collection to match
        as: "bin_details", // The name of the field to add the matched documents
      },
    },
    {
      $unwind: {
        path: "$bin_details",
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

export const ListTransaction = catchAsync(async (req, res) => {
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
        { production_line: searchRegex },
        { sku_code: searchRegex },
        { sut: searchRegex },
        { status: searchRegex },
        { assigned_to: searchRegex },
        { batch: searchRegex },
        { bin: searchRegex },
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
    {
      $lookup: {
        from: "bins", // The name of the BinModel collection
        localField: "bin_id", // The field in ProductionModel to match
        foreignField: "_id", // The field in the BinModel collection to match
        as: "bin_details", // The name of the field to add the matched documents
      },
    },
    {
      $unwind: {
        path: "$bin_details",
        preserveNullAndEmptyArrays: true, // Preserves the document if no match is found
      },
    },
    {
      $lookup: {
        from: "materials", // The name of the BinModel collection
        localField: "material_id", // The field in ProductionModel to match
        foreignField: "_id", // The field in the BinModel collection to match
        as: "material_details", // The name of the field to add the matched documents
      },
    },
    {
      $unwind: {
        path: "$material_details",
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

export const GetAllStatusCount = catchAsync(async (req, res) => {
  const authUserDetail = req.userDetails;
  const userId = authUserDetail._id;

  // Fetch user and their role details
  const user = await UserModel.findOne({ _id: userId }).populate("role_id"); // Assuming 'role' is a reference field
  if (!user) {
    return res.status(404).json({
      status: false,
      message: "User not found",
    });
  }

  const isAdmin = user.role_id.role_name === "Admin"; // Adjust based on how you store and reference roles
  let searchQuery = { deleted_at: null };
  if (!isAdmin) {
    searchQuery = { ...searchQuery, created_employee_id: userId };
  }

  const statusCounts = await ProductionModel.aggregate([
    {
      $facet: {
        // Group by status and count
        statusCounts: [
          {
            $match: {
              deleted_at: { $eq: null },
              ...searchQuery, // Filter out documents where deleted_at is not null
            },
          },
          {
            $group: {
              _id: "$status", // Group by the 'status' field
              count: { $sum: 1 }, // Sum 1 for each document in the group
            },
          },
          {
            $project: {
              status: "$_id", // Rename '_id' to 'status'
              count: 1, // Include the count in the output
              _id: 0, // Exclude the '_id' field from the output
            },
          },
        ],
        // Count deleted documents
        deletedCount: [
          {
            $match: {
              deleted_at: { $ne: null }, // Match documents where deleted_at is not null
            },
          },
          {
            $count: "count", // Count the number of documents
          },
        ],
      },
    },
    {
      $project: {
        statusCounts: 1,
        deletedCount: {
          $arrayElemAt: ["$deletedCount.count", 0], // Extract the count value from the array
        },
      },
    },
  ]);

  // Transform the array into an object with status as keys
  const statusCountObject = statusCounts[0].statusCounts.reduce((acc, cur) => {
    acc[cur.status] = cur.count;
    return acc;
  }, {});

  res.status(200).json({
    data: {
      pending: statusCountObject["Pending"] || 0,
      verified: statusCountObject["Verified"] || 0,
      allocated: statusCountObject["Allocated"] || 0,
      deleted: statusCounts[0].deletedCount || 0,
    },
    status: true,
    message: "Status List",
  });
});

export const AllocateBin = catchAsync(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transferOrderIds = req.body.item_details.map((item) => item._id);

    const transferOrders = await ProductionModel.find({
      _id: { $in: transferOrderIds },
    }).session(session);

    const results = [];

    for (const item of transferOrders) {
      console.log(item, "item");

      const fetchingMaterial = await MaterialModel.findOne({
        sku_code: item.sku_code,
      })
        .select("sku_group ssi")
        .session(session);

      if (!fetchingMaterial) {
        results.push({
          status: false,
          production_id: item._id,
          transfer_order: item.transfer_order,
          sku_code: item.sku_code,

          message: `Material with SKU code ${item.sku_code} not found`,
        });
        continue;
      }

      const fetchingStorage = await StorageSearchModel.findOne({
        sku_group: fetchingMaterial.sku_group,
        ssi: fetchingMaterial.ssi,
      }).session(session);

      if (!fetchingStorage) {
        results.push({
          status: false,
          production_id: item._id,
          transfer_order: item.transfer_order,
          sku_code: item.sku_code,
          message: "Storage not found",
        });
        continue;
      }

      const fetchingBin = await BinModel.findOne({
        storage_section: { $in: fetchingStorage.storage_sections },
      }).session(session);
      console.log(fetchingBin, "fetchingBin");

      if (!fetchingBin) {
        results.push({
          status: false,
          production_id: item._id,
          transfer_order: item.transfer_order,
          sku_code: item.sku_code,

          message: "Bin not found",
        });
        continue;
      }

      await ProductionModel.updateMany(
        { _id: { $in: transferOrderIds } },
        {
          bin: fetchingBin.bin_no,
          bin_id: fetchingBin._id,
          status: "Allocated",
          digit_3_codes: fetchingBin.digit_3_code,
        },
        { session }
      );

      results.push({
        status: true,
        production_id: item._id,
        sku_code: item.sku_code,
        transfer_order: item.transfer_order,
        sku_code: item.transfer_order,
        message: "Bin allocated successfully",
      });
    }

    if (results.some((result) => result.status === false)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({
        status: false,
        data: results.filter((result) => result.status === false),
        message: "Some bins could not be allocated",
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      status: true,
      message: "Bins allocated successfully",
      result: results,
    });
  } catch (err) {
    console.error("Error allocating bins:", err);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
    });
  }
});

export const BinOverflow = catchAsync(async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No items provided for updating bins",
      });
    }

    // Loop through each item in the array and update the corresponding document
    const updatePromises = items.map((item) =>
      ProductionModel.updateOne(
        { _id: item.productionId },
        {
          $set: {
            bin: item.binNumber,
            digit_3_codes: "123",
            status: "Overflow",
          },
        }
      )
    );

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);

    return res.status(200).json({
      status: true,
      message: "Bins updated successfully",
      results,
    });
  } catch (err) {
    console.error("Error updating bins:", err);
    return res.status(500).json({
      status: false,
      message: `Something went wrong: ${err.message}`,
    });
  }
});

export const UpdatePartialQtyToDeleteMaster = catchAsync(async (req, res) => {
  const productionId = req.query.id;
  const updateData = req.body;

  // Validate the production ID
  if (!mongoose.Types.ObjectId.isValid(productionId)) {
    return res.status(400).json({
      result: [],
      status: false,
      message: "Invalid production ID",
    });
  }

  try {
    // Fetch the production line details
    const productionLine = await ProductionModel.findById(productionId);
    if (!productionLine) {
      return res.status(404).json({
        result: [],
        status: false,
        message: "Production line not found.",
      });
    }

    // Check if pallet_qty has changed
    if (
      updateData.pallet_qty &&
      updateData.pallet_qty !== productionLine.pallet_qty
    ) {
      // Fetch all related production lines
      const relatedProductionLines = await ProductionModel.find({
        process_order: productionLine.process_order,
        production_line: productionLine.production_line,
      }).sort({ process_order: 1 }); // Ensure proper ordering

      // Find the index of the current production line
      const currentIndex = relatedProductionLines.findIndex(
        (line) => line._id.toString() === productionId
      );

      if (currentIndex !== -1) {
        // Update the status of all documents following the current one
        const idsToUpdate = relatedProductionLines
          .slice(currentIndex + 1)
          .map((line) => line._id);

        await ProductionModel.updateMany(
          { _id: { $in: idsToUpdate } },
          { $set: { deleted_at: new Date() } }
        );
      }
    }

    // Update the production line with new data
    const updatedProductionLine = await ProductionModel.findByIdAndUpdate(
      productionId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      result: updatedProductionLine,
      status: true,
      message: "Updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      result: [],
      status: false,
      message: "Server error occurred",
    });
  }
});

export const UpdateProduntionMaster = catchAsync(async (req, res) => {
  const produntionId = req.query.id;
  const updateData = req.body;
  if (!mongoose.Types.ObjectId.isValid(produntionId)) {
    return res.status(400).json({
      result: [],
      status: false,
      message: "Invalid produntion ID",
    });
  }
  const produntionLine = await ProductionModel.findByIdAndUpdate(
    produntionId,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!produntionLine) {
    return res.status(404).json({
      result: [],
      status: false,
      message: "Produntion not found.",
    });
  }
  res.status(200).json({
    result: produntionLine,
    status: true,
    message: "Updated successfully",
  });
});

export const GetForkliftTaskCounts = catchAsync(async (req, res) => {
  // Step 1: Find Forklift Operated Role ID
  const forkliftRole = await RolesModel.findOne({
    role_name: "Forklift Operator",
  });
  if (!forkliftRole) {
    return res.status(404).json({
      status: false,
      message: "Forklift Operator role not found",
    });
  }

  // Step 2: Find Users with the Forklift Role ID
  const users = await UserModel.find({ role_id: forkliftRole._id }).select(
    "_id"
  );
  const userIds = users.map((user) => user._id);

  // If no users found, return a response
  if (userIds.length === 0) {
    return res.status(404).json({
      status: false,
      message: "No users with Forklift Operator role found",
    });
  }

  // Step 3: Aggregate task counts by user and status
  const taskCounts = await ProductionModel.aggregate([
    {
      $match: {
        assigned_to: { $in: userIds },
        deleted_at: { $eq: null },
      },
    },
    {
      $group: {
        _id: {
          userId: "$assigned_to",
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.userId",
        pendingCount: {
          $sum: {
            $cond: [{ $eq: ["$_id.status", "Pending"] }, "$count", 0],
          },
        },
        verifiedCount: {
          $sum: {
            $cond: [{ $eq: ["$_id.status", "Verified"] }, "$count", 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users", // Assuming your users collection is named "users"
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        first_name: "$user.first_name",
        last_name: "$user.last_name",
        pendingCount: 1,
        verifiedCount: 1,
      },
    },
  ]);

  // Step 4: Return the results
  res.status(200).json({
    data: taskCounts,
    status: true,
    message: "User task counts retrieved successfully",
  });
});
