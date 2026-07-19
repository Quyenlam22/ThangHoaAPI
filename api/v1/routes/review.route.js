const express = require('express');
const route = express.Router();

const controller = require('../controllers/review.controller');

// [GET] /api/v1/reviews
route.get("/", controller.getAllReviews);

// [POST] /api/v1/reviews/create
route.post("/create", controller.create);

// [PATCH] /api/v1/reviews/like/:id
route.patch("/like/:id", controller.like);

// [PATCH] /api/v1/reviews/reply/:id
route.patch("/reply/:id", controller.reply);

// [DELETE] /api/v1/reviews/delete/:id
route.delete("/delete/:id", controller.delete);

// [DELETE] /api/v1/reviews/delete-reply/:reviewId/:replyId
route.delete("/delete-reply/:reviewId/:replyId", controller.deleteReply);

module.exports = route;
