import mongoose from "mongoose";
import OutboundModel from "../../database/schema/warehouseExecutive/outbond.schema.js";
import OutboundForkliftModel from "../../database/schema/warehouseExecutive/outboundForklift.js";
import ProductionModel from "../../database/schema/warehouseExecutive/production.js";
import catchAsync from "../../utils/errors/catchAsync.js";
import UserModel from "../../database/schema/user.schema.js";
import RolesModel from "../../database/schema/roles.schema.js";
import StockModel from "../../database/schema/stock/stock.shema.js";





export const ListOutbound = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "updated_at",
    sort = "desc",
    search,
  } = req.query;
  console.log(search);

  let searchQuery = { deleted_at: null };
  if (search) {
    const searchRegex = new RegExp("." + search + ".", "i");
    searchQuery = {
      ...searchQuery,
      $or: [{ sku_code: searchRegex }],
    };
  }

  const totalDocument = await OutboundModel.countDocuments({
    ...searchQuery,
  });
  const totalPages = Math.ceil(totalDocument / limit);
  const validPage = Math.min(Math.max(page, 1), totalPages);
  const skip = Math.max((validPage - 1) * limit, 0);

  const produntionLineList = await OutboundModel.aggregate([
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
          from: "customers", // The name of the ProductLine collection
          localField: "entity_name", // The field in OutboundForkliftModel to match
          foreignField: "_id", // The field in the ProductLine collection to match
          as: "customerDetails", // The name of the field to add the matched documents
        },
      },
      {
        $unwind: {
          path: "$customerDetails",
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





export const CrossDockPickup = catchAsync(async (req, res) => {
  const { modifyList, dock, assigned_to, customerDetails } = req.body;
  console.log(req.body);

  // Check if modifyList is an array before iterating
  if (Array.isArray(modifyList) && modifyList.length > 0) {
    const assignedToCount = assigned_to.length;

    for (let i = 0; i < modifyList.length; i++) {
      const item = modifyList[i];

      // Assuming skus is an array within modifyList
      if (Array.isArray(item.skus) && item.skus.length > 0) {
        for (let skuItem of item.skus) {
          const existingItem = await StockModel.findOne({
            sku_code: skuItem.sku_code,
          });

          if (existingItem) {
            console.log("existingItem", existingItem);
            console.log("existingItem.batch", existingItem.batch);

            if (existingItem.bin === "Cross Dock") {
              const index = i % assignedToCount;

              // Create a new OutboundForkliftModel instance and save it
              const outboundForkliftData = new OutboundForkliftModel({
                sku_code: skuItem.sku_code,
                sku_description: existingItem.sku_description,
                sut: skuItem.sut,
                order_qty: skuItem.stock_qty,
                customerDetails: customerDetails,
                order_number: item.order_number,
                order_type: item.order_type,
                entity_name: item.entity_name,
                date: item.date,
                bin: existingItem.bin,
                assigned_to: assigned_to[index],
                digit_3_codes: existingItem.digit_3_codes,
                batch: existingItem.batch,
              });

              await outboundForkliftData.save();
              console.log(`Saved outboundForkliftData: ${outboundForkliftData}`);
            } else {
              console.log(`Item with sku_code: ${skuItem.sku_code} is not in Cross Dock bin.`);
            }
          } else {
            console.log(`No existing item found with sku_code: ${skuItem.sku_code}`);
          }
        }
      } else {
        console.log('No valid SKUs provided in modifyList item');
      }
    }

    // Respond with success after processing all items
    res.status(200).json({
      status: 'success',
      message: 'Cross Dock data processed successfully',
    });
  } else {
    // Handle the case where modifyList is not provided or empty
    console.log('No valid modifyList provided');
    res.status(400).json({
      status: 'error',
      message: 'Invalid or missing modifyList data',
    });
  }
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
  const taskCounts = await OutboundForkliftModel.aggregate([
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









// export const sendToForklift= catchAsync(async (req, res) => {

//   console.log(req.body,'req.body');
  
// });















// Function to generate a unique order number (simple example)
const generateOrderNumber = () => {
    return `ORD-${Date.now()}`; // Generates a unique number based on the current timestamp
};

export const AddOutbound = catchAsync(async (req, res) => {
    console.log("data",req.body);
    const { date, order_type, entity_name, skus } = req.body;

    // Validate required fields
    if (!date || !order_type || !entity_name || !skus || !Array.isArray(skus)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Missing required fields'
        });
    }

    // Generate a unique order number
    const orderNumber = Date.now();

    // Calculate the total SKU count
    const totalSkuCount = skus.length;

    // Calculate the total stock quantity
    let totalStockQty = 0;

    skus.forEach(sku => {
        totalStockQty += parseInt(sku.stock_qty, 10);
    });
    
    const newOutbound = await OutboundModel.create({
        order_number:orderNumber,
        date,
        order_type: order_type,
        entity_name: entity_name,
        skus,
        totalStockQty,  // Store the total stock quantity in the outbound record
        totalSkuCount   // Store the total SKU count
    });


    

    // Respond with the created outbound record
    res.status(201).json({
        status: 'success',
        data: {
            outbount:newOutbound ,
            totalSkuCount, // Return the total SKU count
            totalStockQty, // Return the total stock quantity
        }

        
    });
});
