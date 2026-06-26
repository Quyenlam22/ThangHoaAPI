const Category = require("../models/category.model");

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
