const express = require('express');
const route = express.Router();
const multer = require("multer");

const controller = require('../controllers/category.controller');
const uploadCloud = require("../middleware/uploadCloud.middleware");

const upload = multer();

// [GET] /api/v1/categories - Lấy tất cả danh mục
route.get("/", controller.getAllCategories);

// [POST] /api/v1/categories/create - Tạo danh mục mới kèm upload ảnh
route.post(
  "/create", 
  upload.single("avatar"), 
  uploadCloud.uploadSingle, 
  controller.create
);

// [PATCH] /api/v1/categories/update/:id - Chỉnh sửa danh mục kèm upload ảnh
route.patch(
  "/update/:id", 
  upload.single("avatar"), 
  uploadCloud.uploadSingle, 
  controller.update
);

// [DELETE] /api/v1/categories/delete/:id - Xóa mềm danh mục
route.delete("/delete/:id", controller.delete);

// [POST] /api/v1/categories/by-ids - Lấy các danh mục theo danh sách ID
route.post("/by-ids", controller.getCategoriesByIds);

module.exports = route;