const Product = require("../models/product.model");

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
