const mongoose = require("mongoose");

module.exports.connect = () => {
  try{
    console.log("Success!");
  } catch (e) {
    console.log("Error: ", e);
  }
}

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB kết nối thành công!"))
  .catch(err => console.error("Lỗi kết nối MongoDB:", err.message));