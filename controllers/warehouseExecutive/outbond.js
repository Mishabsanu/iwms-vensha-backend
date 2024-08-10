import OutboundModel from "../../database/schema/warehouseExecutive/outbond.schema.js";
import catchAsync from "../../utils/errors/catchAsync.js";

export const ListOutbound = catchAsync(async (req, res) => {
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
          localField: "entity_name", // The field in ProductionModel to match
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

// export const AddOutbound = catchAsync(async (req, res) => {
//   const orderNumber = Date.now();
//   const customerName = req.body.entity_name;
//      console.log("customerName",customerName)
//   // Find the most recent order for this customer
//   const lastOrder = await OutboundModel.findOne({
//     customer_name: customerName,
//   }).sort({ created_at: -1 });

//   // Initialize the order count
//   let orderCount;

//   if (lastOrder) {
//     // If the last order exists for this customer, check if it's the same order
//     if (lastOrder) {
//       // If it's the same order, keep the same order count
//       orderCount = lastOrder.order_count;
//     } else {
//       // If it's a different order, increment the order count
//       orderCount = lastOrder.order_count + 1;
//     }
//   } else {
//     // If no previous order exists, this is the first order for the customer
//     orderCount = 1;
//   }

//   // Create new production data
//   const productionData = {
//     ...req.body,
//     order_number: orderNumber,
//     order_count: orderCount,
//   };

//   // Save the new order
//   const newProductionList = new OutboundModel(productionData);
//   const savedProduction = await newProductionList.save();

//   // Counting unique SKU codes for this customer
//   const skuCount = await OutboundModel.distinct("sku_code", {
//     entity_name: customerName,
//   }).then((result) => result.length);

//   // Summing order quantities for this customer
//   const orderQty = await OutboundModel.aggregate([
//     { $match: { entity_name: customerName } }, // Filter by customer
//     { $group: { _id: null, totalQty: { $sum: "$stock_qty" } } },
//   ]).then((result) => result[0]?.totalQty || 0);

//   // Update the saved document with SKU count and total order quantity
//   savedProduction.sku_count = skuCount;
//   savedProduction.order_qty_count = orderQty;

//   await savedProduction.save(); // Save the updated document
//    console.log("savedProduction",savedProduction);
//   return res.status(201).json({
//     result: savedProduction,
//     status: true,
//     message: "Order created successfully with customer-specific counts",
//   });
// });

import mongoose from "mongoose";

export const AddOutbound = catchAsync(async (req, res) => {
  const orderNumber = Date.now();
  const customerName = new mongoose.Types.ObjectId(req.body.entity_name); // Ensure this is an ObjectId
  console.log("customerName", customerName);

  // Find the most recent order for this customer
  const lastOrder = await OutboundModel.findOne({
    entity_name: customerName,
  }).sort({ created_at: -1 });

  // Initialize the order count
  let orderCount = 1; // Default to 1 if no previous orders exist

  if (lastOrder) {
    // If a previous order exists for this customer, increment the order count
    orderCount = lastOrder.order_count+1 ;
  }

  // Create new production data
  const productionData = {
    ...req.body,
    order_number: orderNumber,
    order_count: orderCount,
  };

  // Save the new order
  const newProductionList = new OutboundModel(productionData);
  const savedProduction = await newProductionList.save();

  // Counting unique SKU codes for this customer
  const skuCount = await OutboundModel.distinct("sku_code", {
    entity_name: customerName,
  }).then((result) => result.length);

  // Summing order quantities for this customer
  const orderQty = await OutboundModel.aggregate([
    { $match: { entity_name: customerName } }, // Filter by customer
    { $group: { _id: null, totalQty: { $sum: "$stock_qty" } } },
  ]).then((result) => result[0]?.totalQty || 0);

  // Update the saved document with SKU count and total order quantity
  savedProduction.sku_count = skuCount;
  savedProduction.order_qty_count = orderQty;

  await savedProduction.save(); // Save the updated document
  console.log("savedProduction", savedProduction);

  return res.status(201).json({
    result: savedProduction,
    status: true,
    message: "Order created successfully with customer-specific counts",
  });
});


