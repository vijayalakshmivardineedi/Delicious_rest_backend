const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    cost: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  deliveryLocation: { type: String, required: true },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  taxes: { type: Number, required: true },
  discount: { type: Number, required: true },
  total: { type: Number, required: true },
  orderId: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: v => /^\d{4}$/.test(v),
      message: props => `${props.value} is not a valid 4-digit order ID!`
    }
  },
  cookingInstructions: { type: String, default: "" },
  paymentMethod: { type: String, required: true, enum: ["Online", "Cash"] },
  status: {
    type: String,
    required: true,
    enum: ["Ordered", "Cancelled", "Rejected", "Approved", "Preparing", "Ready", "Delivered", "Picked Up"]
  },
  rating: { type: String },
  prepTime: { type: Number, default: 20 },
}, {
  timestamps: true  
});

module.exports = mongoose.model("Order", orderSchema);