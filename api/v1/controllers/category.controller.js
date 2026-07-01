const Category = require("../models/category.model");
const Product = require("../models/product.model");

// [GET] /api/v1/categories
module.exports.getAllCategories = async (req, res) => {
  try {
    const data = await Category.find({ deleted: false }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [POST] /api/v1/categories/create
// Tạo danh mục mới (Mẹo: plugin slug tự tạo slug tiếng Việt từ 'title')
module.exports.create = async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();

    res.status(201).json({ 
      success: true, 
      message: "Category created successfully!", 
      data: newCategory 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [PATCH] /api/v1/categories/update/:id
// Cập nhật thông tin danh mục
module.exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const dataUpdate = { ...req.body };

    // Cập nhật danh mục
    const updatedCategory = await Category.findByIdAndUpdate(id, dataUpdate, { new: true });

    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: "No category found!" });
    }

    // Nếu cấu trúc Product của bạn có lưu kèm tên danh mục để tối ưu hiển thị, 
    // lệnh dưới đây sẽ cập nhật đồng bộ. Nếu không dùng thì có thể comment lại.
    await Product.updateMany(
      { categoryId: id },
      {
        $set: {
          categoryName: updatedCategory.title
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Category updated successfully!",
      data: updatedCategory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [DELETE] /api/v1/categories/delete/:id
// Xóa mềm danh mục và xử lý các sản phẩm thuộc danh mục đó
module.exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    // 1. Thực hiện xóa mềm danh mục
    const deletedCategory = await Category.findByIdAndUpdate(
      id,
      {
        deleted: true,
        deletedAt: now
      },
      { new: true }
    );

    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: "Category not found!" });
    }

    // 2. Xử lý các sản phẩm liên quan: Ép trạng thái các sản phẩm thuộc danh mục này thành 'inactive'
    // (Vì danh mục không còn bán thì sản phẩm của nó hôm nay cũng không hiển thị được nữa)
    await Product.updateMany(
      { categoryId: id },
      {
        $set: {
          status: "inactive"
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Category deleted successfully. Related products are set to inactive!"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [POST] /api/v1/categories/by-ids
// Lấy danh sách các danh mục theo mảng ID truyền vào
module.exports.getCategoriesByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    const categories = await Category.find({
      _id: { $in: ids },
      deleted: false
    });
    
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving category list!" });
  }
};