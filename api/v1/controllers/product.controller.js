const Product = require("../models/product.model");
const Category = require("../models/category.model");

// [GET] /api/v1/products
module.exports.getAllProducts = async (req, res) => {
  try {
    const data = await Product.find({ deleted: false }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [POST] /api/v1/products/create
// Tạo sản phẩm mới (Tự động điền categoryName từ categoryId nếu có)
module.exports.create = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Nếu lúc tạo có truyền categoryId, tự động tìm tên danh mục để lưu kèm
    if (productData.categoryId) {
      const category = await Category.findOne({ _id: productData.categoryId, deleted: false });
      if (category) {
        productData.categoryName = category.title;
      }
    }

    const newProduct = new Product(productData);
    await newProduct.save();

    res.status(201).json({ 
      success: true, 
      message: "Product created successfully!", 
      data: newProduct 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [PATCH] /api/v1/products/update/:id
// Cập nhật thông tin sản phẩm (Đồng bộ lại cả categoryName nếu thay đổi danh mục)
module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const dataUpdate = { ...req.body };

    // Nếu người dùng thay đổi danh mục (categoryId), tìm và cập nhật lại categoryName mới
    if (dataUpdate.categoryId) {
      const category = await Category.findOne({ _id: dataUpdate.categoryId, deleted: false });
      if (category) {
        dataUpdate.categoryName = category.title;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, dataUpdate, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "No product found!" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [DELETE] /api/v1/products/delete/:id
// Xóa mềm sản phẩm (Đánh dấu deleted: true và lưu thời gian xóa)
module.exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const deletedProduct = await Product.findByIdAndUpdate(
      id,
      {
        deleted: true,
        deletedAt: now
      },
      { new: true }
    );

    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: "Product not found!" });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully!"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [POST] /api/v1/products/by-ids
// Lấy danh sách sản phẩm dựa theo mảng ID truyền vào (Ví dụ dùng cho tính năng Giỏ hàng)
module.exports.getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    const products = await Product.find({
      _id: { $in: ids },
      deleted: false
    });
    
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving product list!" });
  }
};