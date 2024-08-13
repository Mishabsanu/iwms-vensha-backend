import mongoose from "mongoose";
import OutboundModel from "../../database/schema/warehouseExecutive/outbond.schema.js";
import OutboundForkliftModel from "../../database/schema/warehouseExecutive/outboundForklift.js";
import ProductionModel from "../../database/schema/warehouseExecutive/production.js";
import catchAsync from "../../utils/errors/catchAsync.js";
import UserModel from "../../database/schema/user.schema.js";
import RolesModel from "../../database/schema/roles.schema.js";





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


// export const AddOutbound = catchAsync(async (req, res) => {
//   let orderNumber;
//   const customerName = new mongoose.Types.ObjectId(req.body.entity_name); // Ensure this is an ObjectId
//   console.log("customerName", customerName);

//   // Find the most recent order for this customer
//   const lastOrder = await OutboundModel.findOne({
//     entity_name: customerName,
//   }).sort({ created_at: -1 });

//   // Initialize the order count and order number
//   let orderCount = 1; // Default to 1 if no previous orders exist

//   if (lastOrder) {
//     // If a previous order exists for this customer, use the same order number and increment the order count
//     orderNumber = lastOrder.order_number; // Use the same order number
//     orderCount = lastOrder.order_count+1; // Increment the order count
//   } else {
//     // If no previous order exists, generate a new order number
//     orderNumber = Date.now();
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
//   savedProduction.sku_count += skuCount;
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



// 




// export  const AddOutbound = catchAsync(async (req, res) => {
//   const { date, order_type, entity_name, skus } = req.body;

//   // Validate required fields
//   if (!date || !order_type || !entity_name || !skus || !Array.isArray(skus)) {
//       return res.status(400).json({
//           status: 'fail',
//           message: 'Missing required fields'
//       });
//   }

//   // Generate a unique order number
//   const orderNumber = Date.now();
//   // Count SKU codes and their quantities
//   const skuCount = skus.reduce((acc, sku) => {
//       if (!acc[sku.sku_code]) {
//           acc[sku.sku_code] = {
//               skuDescription: sku.sku_description,
//               sut: sku.sut,
//               stockQty: 0
//           };
//       }
//       acc[sku.sku_code].stockQty += parseInt(sku.stock_qty, 10); // Aggregate quantity
//       return acc;
//   }, {});
//   console.log("skuCount",skuCount)
//   // Convert the aggregated SKUs into an array
//   const processedSkus = Object.entries(skuCount).map(([skuCode, { skuDescription, sut, stockQty }]) => ({
//       skuCode,
//       skuDescription,
//       sut,
//       stockQty
//   }));
// console.log("processedSkus",processedSkus)



//   // Create a new outbound record
//   // const newOutbound = await OutboundModel.create({
//   //     orderNumber,
//   //     date,
//   //     orderType: order_type,
//   //     entityName: entity_name,
//   //     skus: processedSkus
//   // });

//   // Respond with the created outbound record
//   res.status(201).json({
//       status: 'success',
     
//   });
// });







// export const CrossDockPickup = catchAsync(async (req, res) => {
//   const { modifyList, dock, forklift, customerDetails } = req.body;
//   console.log(req.body);

//   await OutboundModel.updateOne(
//     { _id: modifyList[0]._id }, // Filter: find the document with this _id
//     { $set: { status: 'Complete' } } // Update: set the status field to the new value
//   );
  


//   // Check if modifyList is an array before iterating
//   if (Array.isArray(modifyList) && modifyList.length > 0) {
//     for (let item of modifyList) {
//       // Assuming skus is an array within modifyList
//       if (Array.isArray(item.skus) && item.skus.length > 0) {
//         for (let skuItem of item.skus) {
//           const existingItem = await ProductionModel.findOne({ sku_code: skuItem.sku_code ,status: "Verified",});
//               console.log("existingItem",existingItem)
//               console.log("existingItem",existingItem.batch)
//           if (existingItem) {
//             // Add your verification condition here
//             if (existingItem.status === "Verified" && existingItem.bin === "Cross Dock") {
//               // Create a new OutboundForkliftModel instance and save it
//               const outboundForkliftData = new OutboundForkliftModel({
//                 sku_code: skuItem.sku_code,
//                 sku_description: existingItem.sku_description,
//                 sut: skuItem.sut,
//                 order_qty: skuItem.stock_qty,
//                 forklift: forklift,
//                 customerDetails: customerDetails,
//                 order_number: item.order_number,
//                 order_type: item.order_type,
//                 entity_name: item.entity_name,
//                 date: item.date,
//                 bin: existingItem.bin,
//                 assigned_to: forklift,
//                 digit_3_codes: existingItem.digit_3_codes,
//                 batch: existingItem.batch
//               });

//               await outboundForkliftData.save();
//               console.log(`Saved outboundForkliftData: ${outboundForkliftData}`);
//             } else {
//               console.log(`Item with sku_code: ${skuItem.sku_code} is not verified or not in Cross Dock bin.`);
//             }
//           } else {
//             console.log(`No existing item found with sku_code: ${skuItem.sku_code}`);
//           }
//         }
//       } else {
//         console.log('No valid SKUs provided in modifyList item');
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




// export const CrossDockPickup = catchAsync(async (req, res) => {
//   const { modifyList, dock, assigned_to, customerDetails } = req.body;
//   console.log(req.body);

//   // await OutboundModel.updateOne(
//   //   { _id: modifyList[0]._id }, // Filter: find the document with this _id
//   //   { $set: { status: 'Complete' } } // Update: set the status field to the new value
//   // );
  
 


//   // Check if modifyList is an array before iterating
//   if (Array.isArray(modifyList) && modifyList.length > 0) {
//     for (let item of modifyList) {
//       // Assuming skus is an array within modifyList
//       if (Array.isArray(item.skus) && item.skus.length > 0) {
//         for (let skuItem of item.skus) {
//           const existingItem = await ProductionModel.findOne({ sku_code: skuItem.sku_code ,status: "Verified",});
//               console.log("existingItem",existingItem)
//               console.log("existingItem",existingItem.batch)
//           if (existingItem) {
//             // Add your verification condition here
//             if (existingItem.status === "Verified" && existingItem.bin === "Cross Dock") {
//               // Create a new OutboundForkliftModel instance and save it
// const assignedToCount =assigned_to.length

// const index =item %assignedToCount
//               const outboundForkliftData = new OutboundForkliftModel({
//                 sku_code: skuItem.sku_code,
//                 sku_description: existingItem.sku_description,
//                 sut: skuItem.sut,
//                 order_qty: skuItem.stock_qty,
               
//                 customerDetails: customerDetails,
//                 order_number: item.order_number,
//                 order_type: item.order_type,
//                 entity_name: item.entity_name,
//                 date: item.date,
//                 bin: existingItem.bin,
//                 assigned_to: assigned_to[index],
//                 digit_3_codes: existingItem.digit_3_codes,
//                 batch: existingItem.batch
//               });

//               await outboundForkliftData.save();
//               console.log(`Saved outboundForkliftData: ${outboundForkliftData}`);
//             } else {
//               console.log(`Item with sku_code: ${skuItem.sku_code} is not verified or not in Cross Dock bin.`);
//             }
//           } else {
//             console.log(`No existing item found with sku_code: ${skuItem.sku_code}`);
//           }
//         }
//       } else {
//         console.log('No valid SKUs provided in modifyList item');
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
          const existingItem = await ProductionModel.findOne({
            sku_code: skuItem.sku_code,
            status: "Verified",
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
