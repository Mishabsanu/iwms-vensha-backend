import XLSX from "xlsx";
import MaterialModel from "../../database/schema/masters/materials.schema.js";
import ProductionModel from "../../database/schema/warehouseExecutive/production.js";
import catchAsync from "../../utils/errors/catchAsync.js";
import BinModel from "../../database/schema/bin.js";
import mongoose from "mongoose";
import UserModel from "../../database/schema/user.schema.js";

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
    // console.log(data, "data");

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
  // console.log(search);
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
  console.log(user, "user");

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
        { production_Line: searchRegex },
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
      $or: [
        { sku_code: new RegExp(q, "i") }, // Case-insensitive search for sku_code
        { sku_description: new RegExp(q, "i") }, // Case-insensitive search for sku_description
      ],
    }).limit(10); // Limit results for performance

    // Extract unique SKU codes
    // const matchedSkuCodes = [...new Set(skus.map((sku) => sku.sku_code))];

    // console.log(skus, "matchedSkuCodes");

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
    const { process_order_qty, pallete_qty, assigned_to } = req.body;
    const authUserDetail = req.userDetails;
    // Ensure correct types
    const processOrderQty = Number(process_order_qty);
    const palletQty = Number(pallete_qty);

    if (isNaN(processOrderQty) || isNaN(palletQty)) {
      return res.status(400).json({
        status: false,
        message: "Invalid quantity values provided",
      });
    }

    // Calculate the number of full pallets and the remaining quantity
    const fullPalletsCount = Math.floor(processOrderQty / palletQty);
    const remainingQty = processOrderQty % palletQty;

    console.log("Full Pallets Count:", fullPalletsCount);
    console.log("Remaining Quantity:", remainingQty);

    // Get the latest transfer order number from the database
    const latestProduction = await ProductionModel.findOne().sort({
      transfer_order: -1,
    });
    const startingTransferOrderNo = latestProduction
      ? latestProduction.transfer_order + 1
      : 1;

    // Determine how many assigned_to IDs are available
    const assignedToCount = assigned_to.length;

    // console.log("Assigned To IDs:", assigned_to);

    // Create production entries for the full pallets
    const productionEntries = [];

    // Determine how many production entries to create (full pallets + possibly one more for remaining quantity)
    const totalEntries = fullPalletsCount + (remainingQty > 0 ? 1 : 0);

    // console.log("Total Entries:", totalEntries);

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
        assigned_to: assigned_to[assignedToIndex], // Assign the corresponding ID
      });

      console.log("Production Entry Created:", productionEntries[i]);
    }

    // Log the productionEntries to verify the data before saving
    console.log("Production Entries to be saved:", productionEntries);

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

export const AllocateBin = catchAsync(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transferOrderIds = req.body.item_details.map((item) => item._id);
    const transferOrders = await ProductionModel.find({
      _id: { $in: transferOrderIds },
    }).session(session);
    let bins = await BinModel.find({ status: { $ne: "No Available" } }).session(
      session
    );

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
  // console.log(search);

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
