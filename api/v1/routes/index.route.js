const productRoute = require("./product.route");
const categoryRoute = require("./category.route");

module.exports = (app) => {
  const version = `/api/v1`;

  app.use(`${version}/categories`, categoryRoute);
  app.use(`${version}/products`, productRoute);
}