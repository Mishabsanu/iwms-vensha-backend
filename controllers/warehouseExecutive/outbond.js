import mongoose from "mongoose";
import OutboundModel from "../../database/schema/warehouseExecutive/outbond.schema.js";
import OutboundForkliftModel from "../../database/schema/warehouseExecutive/outboundForklift.js";
import ProductionModel from "../../database/schema/warehouseExecutive/production.js";
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



// export const AddOutbound = catchAsync(async (req, res) => {
//   const orderNumber = Date.now();
//   const customerName = new mongoose.Types.ObjectId(req.body.entity_name); // Ensure this is an ObjectId
//   console.log("customerName", customerName);

//   // Find the most recent order for this customer
//   const lastOrder = await OutboundModel.findOne({
//     entity_name: customerName,
//   }).sort({ created_at: -1 });

//   // Initialize the order count
//   let orderCount = 1; // Default to 1 if no previous orders exist

//   if (lastOrder) {
//     // If a previous order exists for this customer, increment the order count
//     orderCount = lastOrder.order_count+1 ;
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
//   console.log("savedProduction", savedProduction);

//   return res.status(201).json({
//     result: savedProduction,
//     status: true,
//     message: "Order created successfully with customer-specific counts",
//   });
// });




















// export const CrossDockPickup = catchAsync(async (req, res) => {
//   const data =req.body;
//   const bin="Cross Dock";
//   // Iterate through each item in the data array
//   for (let item of data) {
//       // Check if the bin is present in the StockReportModel for the given sku_code with status "verified"
//       const stockReportEntry = await OutboundForkliftModel.findOne({ sku_code: item.sku_code, status: "verified",bin:"Cross Dock" });
      
//       console.log("stockReportEntry", stockReportEntry);

//       if (stockReportEntry) {
//           // If the bin is not present, set stock_qty to 0
//           if (stockReportEntry.bin !== bin) {
//               console.log("value is zero");
//               item.stock_qty = 0;
//           }
//       } else {
//           // If no entry is found in StockReportModel, also set stock_qty to 0
//           console.log("value is zero");
//           item.stock_qty = 0;
//       }
//   }

//   // Send the modified data as a response
//   res.status(200).json({
//       message: 'Stock quantities processed successfully',
//       data: data
//   });
// });


export const AddOutbound = catchAsync(async (req, res) => {
  let orderNumber;
  const customerName = new mongoose.Types.ObjectId(req.body.entity_name); // Ensure this is an ObjectId
  console.log("customerName", customerName);

  // Find the most recent order for this customer
  const lastOrder = await OutboundModel.findOne({
    entity_name: customerName,
  }).sort({ created_at: -1 });

  // Initialize the order count and order number
  let orderCount = 1; // Default to 1 if no previous orders exist

  if (lastOrder) {
    // If a previous order exists for this customer, use the same order number and increment the order count
    orderNumber = lastOrder.order_number; // Use the same order number
    orderCount = lastOrder.order_count+1; // Increment the order count
  } else {
    // If no previous order exists, generate a new order number
    orderNumber = Date.now();
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
  savedProduction.sku_count += skuCount;
  savedProduction.order_qty_count = orderQty;

  await savedProduction.save(); // Save the updated document
  console.log("savedProduction", savedProduction);

  return res.status(201).json({
    result: savedProduction,
    status: true,
    message: "Order created successfully with customer-specific counts",
  });
});







// export const CrossDockPickup = catchAsync(async (req, res) => {
//   const { modifyList, dock, forklift, customerDetails } = req.body;

//   console.log('Received Cross Dock data:', req.body);

//   for (let item of modifyList) {
//     // Find the item in the database by sku_code
//     const existingItem = await ProductionModel.findOne({ sku_code: item.sku_code });

//     if (existingItem) {
//       // Add your verification condition here, e.g., checking if the item is verified
//       if (existingItem.Verified) {
//         console.log(`Verified and updated item with sku_code: ${item.sku_code}`);


//       } else {
//         res.status(200).json({
//           status: 'success',
//           message: 'No existing item found verified',
//         });
//       }

//     } else {
//       console.log(`No existing item found with sku_code: ${item.sku_code}`);
//     }
//   }

//   // Respond with success
//   res.status(200).json({
//     status: 'success',
//     message: 'Cross Dock data processed successfully',
//   });
// });



// export const CrossDockPickup = catchAsync(async (req, res) => {
//   const { modifyList, dock, forklift, customerDetails } = req.body;

//   console.log('Received Cross Dock data:', req.body);

//   // Check if modifyList is an array before iterating
//   if (Array.isArray(modifyList) && modifyList.length > 0) {
//     for (let item of modifyList) {
//       // Find the item in the database by sku_code
//       const existingItem = await ProductionModel.findOne({ sku_code: item.sku_code });
     
//       if (existingItem) {
//         // Add your verification condition here
//         if (existingItem.status=="Verified" && existingItem.bin=="Cross Dock") {
            
//         } else {
//           console.log(`Item with sku_code: ${item.sku_code} is not verified.`);
//         }
//       } else {
//         console.log(`No existing item found with sku_code: ${item.sku_code}`);
//       }
//     }

//     // Respond with success after processing all items
//     res.status(200).json({
//       status: 'success',
//       message: 'Cross Dock data processed successfully',
//     });
//   } else {
//     // Handle the case where modifyList is not provided or empty
//     console.log('No valid modifyList provided');
//     res.status(400).json({
//       status: 'error',
//       message: 'Invalid or missing modifyList data',
//     });
//   }
// });



export const CrossDockPickup = catchAsync(async (req, res) => {
  const { modifyList, dock, forklift, customerDetails } = req.body;

  console.log('Received Cross Dock data:', req.body);

  // Check if modifyList is an array before iterating
  if (Array.isArray(modifyList) && modifyList.length > 0) {
    for (let item of modifyList) {
      // Find the item in the database by sku_code
      const existingItem = await ProductionModel.findOne({ sku_code: item.sku_code });
     
      if (existingItem) {
        // Add your verification condition here
        if (existingItem.status === "Verified" && existingItem.bin === "Cross Dock") {
          // Create a new OutboundForkliftModel instance and save it
          const outboundForkliftData = new OutboundForkliftModel({
            sku_code: item.sku_code,
            sku_description:existingItem.sku_description,
            sut:item.sut,
            order_qty: item.stock_qty,
            forklift: forklift,
            customerDetails: customerDetails,
            order_number: item.order_number,
            order_type: item.order_type,
            entity_name: item.entity_name,
            date: item.date,
            bin:dock,
            assigned_to:forklift,
            digit_3_codes:existingItem.digit_3_codes
          });

          await outboundForkliftData.save();
          console.log(`Saved outboundForkliftData: ${outboundForkliftData}`);
        } else {
          console.log(`Item with sku_code: ${item.sku_code} is not verified or not in Cross Dock bin.`);
        }
      } else {
        console.log(`No existing item found with sku_code: ${item.sku_code}`);
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










export const sendToForklift = catchAsync(async (req, res) => {
  const { forkliftValue, assignedTo } = req.body;

  // Basic validation
  if (!forkliftValue || !Array.isArray(assignedTo)) {
    throw new ApiError(400, 'Invalid input data');
  }

  console.log('Forklift Value:', forkliftValue);
  console.log('Assigned To:', assignedTo);

  // Perform the necessary operation (e.g., save to database)
  // ...

  res.status(200).json({
    status: 'success',
    message: 'Forklift data processed successfully',
  });
});



// export const sendToForklift= catchAsync(async (req, res) => {

//   console.log(req.body,'req.body');
  
// });

export const sendToDock = catchAsync(async (req, res) => {
  try {
    // Log the request body to verify the incoming data
    console.log(req.body, 'req.body');

    // Perform the operation to handle the dock value (e.g., save to database)
    // Assuming you save the dock value in a database or perform some action

    // Send a success response back to the client
    res.status(200).json({
      status: 'success',
      message: 'Dock value saved successfully',
    });
  } catch (error) {
    // Handle any errors and send an error response
    res.status(500).json({
      status: 'error',
      message: 'Failed to save dock value',
    });
  }
});





