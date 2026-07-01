const express = require('express');
const route = express.Router();
const multer = require("multer");

const controller = require('../controllers/product.controller');
const uploadCloud = require("../middleware/uploadCloud.middleware");

const upload = multer();

// [GET] /api/v1/products
// Lấy toàn bộ danh sách sản phẩm
route.get("/", controller.getAllProducts);

// [POST] /api/v1/products/create
// Tạo sản phẩm mới kèm upload ảnh lên Cloudinary (Dùng field name "avatar" theo mẫu của bạn)
route.post(
  "/create", 
  upload.single("avatar"), 
  uploadCloud.uploadSingle, 
  controller.create
);

// [PATCH] /api/v1/products/update/:id
// Chỉnh sửa thông tin sản phẩm và cập nhật lại ảnh mới
route.patch(
  "/update/:id", 
  upload.single("avatar"), 
  uploadCloud.uploadSingle, 
  controller.update
);

// [DELETE] /api/v1/products/delete/:id
// Xóa mềm sản phẩm (Chuyển deleted thành true)
route.delete("/delete/:id", controller.delete);

// [POST] /api/v1/products/by-ids
// Lấy danh sách sản phẩm dựa vào mảng các ID truyền lên (Dùng cho giỏ hàng/hóa đơn)
route.post("/by-ids", controller.getProductsByIds);

module.exports = route;