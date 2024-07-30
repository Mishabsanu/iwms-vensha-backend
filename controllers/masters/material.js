import mongoose from "mongoose";

import catchAsync from "../../utils/errors/catchAsync.js";
import { DynamicSearch } from "../../utils/dynamicSearch/dynamic.js";
import MaterialModel from "../../database/schema/masters/materials.schema.js";
export const AddMaterialMaster = catchAsync(async (req, res) => {
  const authUserDetail = req.userDetails;
  const materialData = {
    ...req.body,
    created_employee_id: authUserDetail._id,
  };
  const newMaterialList = new MaterialModel(materialData);
  const savedMaterial = await newMaterialList.save();
  return res.status(201).json({
    result: savedMaterial,
    status: true,
    message: "Material created successfully",
  });
});

export const UpdateMaterialMaster = catchAsync(async (req, res) => {
  const materialId = req.query.id;
  const updateData = req.body;
  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    return res
      .status(400)
      .json({ result: [], status: false, message: "Invalid material ID" });
  }
  const material = await MaterialModel.findByIdAndUpdate(
    materialId,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!material) {
    return res.status(404).json({
      result: [],
      status: false,
      message: "Material not found.",
    });
  }
  res.status(200).json({
    result: material,
    status: true,
    message: "Updated successfully",
  });
});

export const ListMaterialMaster = catchAsync(async (req, res) => {
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
  const totalDocument = await MaterialModel.countDocuments({
    ...searchQuery,
  });
  const totalPages = Math.ceil(totalDocument / limit);
  const validPage = Math.min(Math.max(page, 1), totalPages);
  const skip = Math.max((validPage - 1) * limit, 0);
  const materialList = await MaterialModel.aggregate([
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
  if (materialList) {
    return res.status(200).json({
      result: materialList,
      status: true,
      totalPages: totalPages,
      currentPage: validPage,
      message: "All Material List",
    });
  }
});

export const ListMaterialMasterWithOutPermission = catchAsync(
  async (req, res) => {
    const materialList = await MaterialModel.find({ status: "active" });
    return res.status(201).json({
      result: materialList,
      status: true,
      message: "All Material List",
    });
  }
);
