const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const categorySchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true, 
        trim: true 
    },
    slug: {
        type: String,
        slug: "title",
        unique: true
    },
    avatar: {
        type: String,
        default: "" // Đặt mặc định là chuỗi rỗng nếu danh mục không có ảnh
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date
}, {
    timestamps: true
});

const Category = mongoose.model('Category', categorySchema, "categories");

module.exports = Category;