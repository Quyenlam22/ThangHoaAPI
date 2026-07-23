const productRoute = require("./product.route");
const categoryRoute = require("./category.route");
const reviewRoute = require("./review.route");
const chatbotRoute = require("./chatbot.route");
const dashboardRoute = require("./dashboard.route");
const Visit = require("../models/visit.model");

// Bộ nhớ đệm tạm thời để chống race condition (ghi đè trùng lặp do request đồng thời)
const lastLoggedIPs = new Set();

module.exports = (app) => {
  const version = `/api/v1`;

  // Tự động ghi nhận lượt truy cập của khách hàng từ client (chỉ log các API GET client thông thường, giới hạn 1 IP tối đa 1 lượt mỗi 10 giây)
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.includes("/admin") && !req.path.includes("/dashboard") && !req.path.includes("/assets")) {
      const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
      
      // Giải quyết tranh chấp đồng thời bằng Set đồng bộ (Blocking race conditions)
      if (!lastLoggedIPs.has(clientIp)) {
        lastLoggedIPs.add(clientIp);
        
        // Tự động giải phóng IP sau 10 giây
        setTimeout(() => {
          lastLoggedIPs.delete(clientIp);
        }, 10000);

        const userAgent = req.headers["user-agent"] || "unknown";
        Visit.create({
          ip: clientIp,
          userAgent: userAgent
        }).catch(err => console.error("Lỗi ghi nhận truy cập:", err.message));
      }
    }
    next();
  });

  app.use(`${version}/categories`, categoryRoute);
  app.use(`${version}/products`, productRoute);
  app.use(`${version}/reviews`, reviewRoute);
  app.use(`${version}/chatbot`, chatbotRoute);
  app.use(`${version}/dashboard`, dashboardRoute);
}