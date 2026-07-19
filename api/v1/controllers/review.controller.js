const Review = require("../models/review.model");

// [GET] /api/v1/reviews
// Lấy toàn bộ danh sách đánh giá chưa bị xóa
module.exports.getAllReviews = async (req, res) => {
  try {
    const data = await Review.find({ deleted: false }).sort({ isAdmin: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [POST] /api/v1/reviews/create
// Tạo đánh giá mới
module.exports.create = async (req, res) => {
  try {
    const newReview = new Review(req.body);
    await newReview.save();

    res.status(201).json({
      success: true,
      message: "Review created successfully!",
      data: newReview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [PATCH] /api/v1/reviews/like/:id
// Tăng số lượt thích của đánh giá
module.exports.like = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { returnDocument: 'after' }
    );

    if (!updatedReview) {
      return res.status(404).json({ success: false, message: "Review not found!" });
    }

    res.status(200).json({
      success: true,
      message: "Review liked successfully!",
      data: updatedReview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [DELETE] /api/v1/reviews/delete/:id
// Xóa mềm đánh giá (Chỉ dùng cho admin nếu cần dọn spam)
module.exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const deletedReview = await Review.findByIdAndUpdate(
      id,
      {
        deleted: true,
        deletedAt: now
      },
      { returnDocument: 'after' }
    );

    if (!deletedReview) {
      return res.status(404).json({ success: false, message: "Review not found!" });
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully!"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [PATCH] /api/v1/reviews/reply/:id
// Thêm phản hồi cho đánh giá
module.exports.reply = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, isAdmin } = req.body;

    if (!name || !content) {
      return res.status(400).json({ success: false, message: "Name and content are required!" });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      {
        $push: {
          replies: {
            name,
            content,
            isAdmin: !!isAdmin,
            createdAt: new Date()
          }
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedReview) {
      return res.status(404).json({ success: false, message: "Review not found!" });
    }

    res.status(200).json({
      success: true,
      message: "Reply added successfully!",
      data: updatedReview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [DELETE] /api/v1/reviews/delete-reply/:reviewId/:replyId
// Xóa một phản hồi của đánh giá
module.exports.deleteReply = async (req, res) => {
  try {
    const { reviewId, replyId } = req.params;

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        $pull: {
          replies: { _id: replyId }
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedReview) {
      return res.status(404).json({ success: false, message: "Review not found!" });
    }

    res.status(200).json({
      success: true,
      message: "Reply deleted successfully!",
      data: updatedReview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

