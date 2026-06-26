const express = require('express');
const route = express.Router();
const multer = require("multer");

const controller = require('../controllers/product.controller');

// const uploadCloud = require("../middleware/uploadCloud.middleware");

// const upload = multer();

route.get("/", controller.getAllProducts);

// route.post("/create", upload.single("avatar"), uploadCloud.uploadSingle, controller.create);

// route.patch("/update/:id", upload.single("avatar"), uploadCloud.uploadSingle, controller.update);

// route.delete("/delete/:id", upload.single("avatar"), uploadCloud.uploadSingle, controller.delete);

// route.post("/get-products-by-ids", controller.getProductsByIds);

module.exports = route;