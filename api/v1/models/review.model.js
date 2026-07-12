const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    rating: { 
        type: Number, 
        required: true,
        min: 1,
        max: 5
    }, 
    dish: {
        type: String,
        trim: true,
        default: ""
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    likes: {
        type: Number,
        default: 0
    },
    replies: [
        {
            name: { type: String, required: true, trim: true },
            content: { type: String, required: true, trim: true },
            isAdmin: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date
}, {
    timestamps: true
});

const Review = mongoose.model('Review', reviewSchema, "reviews");

module.exports = Review;
