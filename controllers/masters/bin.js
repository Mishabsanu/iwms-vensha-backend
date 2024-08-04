import mongoose from "mongoose";
import catchAsync from "../../utils/errors/catchAsync.js";
import { DynamicSearch } from "../../utils/dynamicSearch/dynamic.js";
import BinModel from "../../database/schema/masters/bin.schema.js";
import storageTypeModel from "../../database/schema/masters/storageType.schema.js";

export const AddBinMaster = catchAsync(async (req, res) => {
  const authUserDetail = req.userDetails;
  const binData = {
    ...req.body,
    created_employee_id: authUserDetail._id,
  };
  const newBinList = new BinModel(binData);
  const savedBin = await newBinList.save();
  return res.status(201).json({
    result: savedBin,
    status: true,
    message: "Bin created successfully",
  });
});

export const UpdateBinMaster = catchAsync(async (req, res) => {
  const binId = req.query.id;
  const updateData = req.body;
  if (!mongoose.Types.ObjectId.isValid(binId)) {
    return res
      .status(400)
      .json({ result: [], status: false, message: "Invalid bin ID" });
  }
  const bin = await BinModel.findByIdAndUpdate(
    binId,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!bin) {
    return res.status(404).json({
      result: [],
      status: false,
      message: "Bin not found.",
    });
  }
  res.status(200).json({
    result: bin,
    status: true,
    message: "Updated successfully",
  });
});

export const ListBinMaster = catchAsync(async (req, res) => {
  const {
    string,
    boolean,
    numbers,
    arrayField = [],
  } = req?.body?.searchFields || {};
  const {
    page = 1,
    limit = 10,
    sortBy = "updated_at",
    sort = "desc",
  } = req.query;
  const search = req.query.search || "";
  let searchQuery = {};
  if (search != "" && req?.body?.searchFields) {
    const searchdata = DynamicSearch(
      search,
      boolean,
      numbers,
      string,
      arrayField
    );
    if (searchdata?.length == 0) {
      return res.status(404).json({
        statusCode: 404,
        status: false,
        data: {
          user: [],
        },
        message: "Results Not Found",
      });
    }
    searchQuery = searchdata;
  }
  const totalDocument = await BinModel.countDocuments({
    ...searchQuery,
  });
  const totalPages = Math.ceil(totalDocument / limit);
  const validPage = Math.min(Math.max(page, 1), totalPages);
  const skip = Math.max((validPage - 1) * limit, 0);
  const binList = await BinModel.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "created_employee_id",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              password: 0,
            },
          },
        ],
        as: "created_employee_id",
      },
    },
    {
      $unwind: {
        path: "$created_employee_id",
        preserveNullAndEmptyArrays: true,
      },
    },
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
  if (binList) {
    return res.status(200).json({
      result: binList,
      status: true,
      totalPages: totalPages,
      currentPage: validPage,
      message: "All Bin List",
    });
  }
});

export const ListBinMasterWithOutPermission = catchAsync(async (req, res) => {
  const binList = await storageTypeModel.find();
  return res.status(201).json({
    result: binList,
    status: true,
    message: "All Bin List",
  });
});
