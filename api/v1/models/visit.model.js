const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  ip: {
    type: String,
    default: "127.0.0.1"
  },
  userAgent: {
    type: String,
    default: "unknown"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Visit = mongoose.model("Visit", visitSchema, "visits");

module.exports = Visit;
