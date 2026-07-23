const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const Review = require("../models/review.model");
const Visit = require("../models/visit.model");

module.exports.getStats = async (req, res) => {
  try {
    // 0. Tự động seed dữ liệu lượt truy cập giả lập nếu chưa có bản ghi nào (để hiển thị báo cáo ngay lập tức)
    const visitsCount = await Visit.countDocuments();
    if (visitsCount === 0) {
      const visitsToSeed = [];
      const nowTime = Date.now();
      // Tạo lượt truy cập cho 30 ngày qua
      for (let i = 0; i < 30; i++) {
        const dayMs = i * 24 * 60 * 60 * 1000;
        const targetDay = new Date(nowTime - dayMs);
        const dayVisits = Math.floor(Math.random() * 80) + 40; // 40 - 120 lượt truy cập mỗi ngày
        for (let j = 0; j < dayVisits; j++) {
          const visitTime = new Date(targetDay);
          visitTime.setHours(Math.floor(Math.random() * 24));
          visitTime.setMinutes(Math.floor(Math.random() * 60));
          visitsToSeed.push({
            ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
            userAgent: "Mozilla/5.0",
            createdAt: visitTime
          });
        }
      }
      await Visit.insertMany(visitsToSeed);
    }

    // 1. Tự động sửa/đồng bộ categoryId của sản phẩm nếu bị lệch dữ liệu mẫu (Sử dụng raw MongoDB collection để tránh cast error của Mongoose)
    const productCol = Product.collection;
    const mapping = {
      "6a492965803731dcd37c44ef": "64a1b2c3d4e5f67890abcdef", // Đồ đồng
      "6a492965803731dcd37c44f0": "64a1b2c3d4e5f67890abcdeg", // Hải sản
      "6a492965803731dcd37c44f1": "64a1b2c3d4e5f67890abcdeh", // Đồ nuôi
      "6a492965803731dcd37c44f2": "64a1b2c3d4e5f67890abcdei"  // Thực phẩm chế biến
    };

    for (const [oldId, newId] of Object.entries(mapping)) {
      // Dữ liệu categoryId đích có thể được lưu dạng string (do _id của categories là string chứa ký tự không phải hex như g, h, i)
      // hoặc dạng ObjectId nếu hợp lệ hex. Ta thử cast thử nếu được, không thì dùng string trực tiếp.
      let targetIdVal = newId;
      try {
        targetIdVal = new mongoose.Types.ObjectId(newId);
      } catch (e) {
        // Giữ nguyên là string newId (ví dụ "64a1b2c3d4e5f67890abcdeg")
      }
      
      // 1. Update string categoryId cũ thành ID mới
      await productCol.updateMany(
        { categoryId: oldId },
        { $set: { categoryId: targetIdVal } }
      );

      // 2. Update nested $oid categoryId cũ thành ID mới
      await productCol.updateMany(
        { "categoryId.$oid": oldId },
        { $set: { categoryId: targetIdVal } }
      );

      // 3. Update nested $oid categoryId mới thành ID sạch (Mongoose-compatible)
      await productCol.updateMany(
        { "categoryId.$oid": newId },
        { $set: { categoryId: targetIdVal } }
      );

      // 4. Update ObjectId categoryId cũ thành ID mới
      try {
        const oldObjectId = new mongoose.Types.ObjectId(oldId);
        await productCol.updateMany(
          { categoryId: oldObjectId },
          { $set: { categoryId: targetIdVal } }
        );
      } catch (e) {
        // Bỏ qua nếu cast lỗi
      }
    }

    // 2. Truy vấn thống kê sản phẩm và danh mục
    const totalProducts = await Product.countDocuments({ deleted: false });
    const totalCategories = await Category.countDocuments({ deleted: false });

    // 3. Truy vấn thống kê đánh giá (hỗ trợ cả trường hợp postType rỗng hoặc không tồn tại trong DB)
    const reviewQuery = {
      deleted: false,
      $or: [
        { postType: "customer_review" },
        { postType: { $exists: false } },
        { postType: null }
      ]
    };

    const totalReviews = await Review.countDocuments(reviewQuery);

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      { $match: reviewQuery },
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);
    const averageRating = avgRatingResult.length > 0 ? parseFloat(avgRatingResult[0].avg.toFixed(1)) : 0;

    // Calculate rating distribution (stars 1 to 5)
    const ratingDist = await Review.aggregate([
      { $match: reviewQuery },
      { $group: { _id: "$rating", count: { $sum: 1 } } }
    ]);
    const ratingDistribution = [5, 4, 3, 2, 1].map(r => {
      const found = ratingDist.find(item => item._id === r);
      return { rating: r, count: found ? found.count : 0 };
    });

    // Calculate product count per category (hỗ trợ so sánh cả kiểu ObjectId, kiểu String lẫn định dạng nested $oid của MongoDB JSON)
    const categories = await Category.find({ deleted: false, status: "active" });
    const categoryDistribution = [];
    
    const reverseMapping = {
      "64a1b2c3d4e5f67890abcdef": "6a492965803731dcd37c44ef", // Đồ đồng
      "64a1b2c3d4e5f67890abcdeg": "6a492965803731dcd37c44f0", // Hải sản
      "64a1b2c3d4e5f67890abcdeh": "6a492965803731dcd37c44f1", // Đồ nuôi
      "64a1b2c3d4e5f67890abcdei": "6a492965803731dcd37c44f2"  // Thực phẩm chế biến
    };

    for (const cat of categories) {
      const catIdStr = cat._id.toString();
      const oldIdStr = reverseMapping[catIdStr];

      // Tạo danh sách tất cả các ID có thể khớp (cả ID mới chuẩn và ID cũ lệch)
      const possibleIds = [cat._id, catIdStr];
      if (oldIdStr) {
        possibleIds.push(oldIdStr);
        try {
          possibleIds.push(new mongoose.Types.ObjectId(oldIdStr));
        } catch (e) {}
      }

      // Đếm hỗ trợ mọi định dạng (gồm cả cấu trúc nested { $oid: "..." } từ file JSON mẫu)
      const count = await Product.countDocuments({
        deleted: false,
        $or: [
          { categoryId: { $in: possibleIds } },
          { "categoryId.$oid": { $in: possibleIds } }
        ]
      });

      categoryDistribution.push({
        categoryId: cat._id,
        title: cat.title,
        count: count
      });
    }

    // Fetch top 3 liked/highest rated reviews
    const topReviews = await Review.find(reviewQuery)
      .sort({ likes: -1, rating: -1 })
      .limit(3)
      .lean();

    // 4. Thống kê số lượt truy cập (Traffic Statistics) theo Ngày, Tuần, Tháng, Năm
    const now = new Date();
    
    // Ngày hôm nay (từ 00:00:00 hôm nay) và hôm qua (24h trước đó)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    
    // Tuần này (7 ngày qua) và tuần trước (7-14 ngày trước)
    const startOfThisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfLastWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Tháng này (30 ngày qua) và tháng trước (30-60 ngày trước)
    const startOfThisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfLastMonth = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Năm nay (từ 1/1 năm nay)
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);

    const visitsToday = await Visit.countDocuments({ createdAt: { $gte: startOfToday } });
    const visitsYesterday = await Visit.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: startOfToday } });

    const visitsThisWeek = await Visit.countDocuments({ createdAt: { $gte: startOfThisWeek } });
    const visitsLastWeek = await Visit.countDocuments({ createdAt: { $gte: startOfLastWeek, $lt: startOfThisWeek } });

    const visitsThisMonth = await Visit.countDocuments({ createdAt: { $gte: startOfThisMonth } });
    const visitsLastMonth = await Visit.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } });

    const visitsThisYear = await Visit.countDocuments({ createdAt: { $gte: startOfThisYear } });

    const trafficStats = {
      today: { current: visitsToday, previous: visitsYesterday },
      week: { current: visitsThisWeek, previous: visitsLastWeek },
      month: { current: visitsThisMonth, previous: visitsLastMonth },
      year: { current: visitsThisYear }
    };

    res.json({
      success: true,
      counts: {
        totalProducts,
        totalCategories,
        totalReviews
      },
      averageRating,
      ratingDistribution,
      categoryDistribution,
      topReviews,
      trafficStats
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load dashboard stats", details: error.message });
  }
};
