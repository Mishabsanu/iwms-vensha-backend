import ProductionModel from "../../database/schema/warehouseExecutive/production.js";
import catchAsync from "../../utils/errors/catchAsync.js";

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
    status: "Verified",
  });
  const totalPages = Math.ceil(totalDocument / limit);
  const validPage = Math.min(Math.max(page, 1), totalPages);
  const skip = Math.max((validPage - 1) * limit, 0);

  const produntionLineList = await ProductionModel.aggregate([
    {
      $match: {
        ...searchQuery,
        bin: { $ne: null },
        status: "Verified",
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
