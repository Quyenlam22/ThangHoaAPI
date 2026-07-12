const productRoute = require("./product.route");
const categoryRoute = require("./category.route");
const reviewRoute = require("./review.route");

module.exports = (app) => {
  const version = `/api/v1`;

  app.use(`${version}/categories`, categoryRoute);
  app.use(`${version}/products`, productRoute);
  app.use(`${version}/reviews`, reviewRoute);
}