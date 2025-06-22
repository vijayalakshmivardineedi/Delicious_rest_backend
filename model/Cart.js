const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  itemCost: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  items: [itemSchema],
}, {
  timestamps: true
});

module.exports = mongoose.model("Cart", cartSchema);
