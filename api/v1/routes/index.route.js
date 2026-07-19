const productRoute = require("./product.route");
const categoryRoute = require("./category.route");
const reviewRoute = require("./review.route");
const chatbotRoute = require("./chatbot.route");

module.exports = (app) => {
  const version = `/api/v1`;

  app.use(`${version}/categories`, categoryRoute);
  app.use(`${version}/products`, productRoute);
  app.use(`${version}/reviews`, reviewRoute);
  app.use(`${version}/chatbot`, chatbotRoute);
}