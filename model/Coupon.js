// model/Coupon.js
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponId: { type: String, required: true, unique: true },
  couponCode: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  discountAmount: { type: Number, required: true },
  nthOrder: { type: Number },
  minOrderAmount: { type: Number, required: true },
  expiryDate: { type: Date, required: true }
});

module.exports = mongoose.model("Coupon", couponSchema);