const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  itemCost: { type: Number, required: true },
  image: { type: String },
  isEnabled: { type: Boolean, default: true },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  cateimage: { type: String },
  isEnabled: { type: Boolean, default: true },
  categoryType: {
    type: String,
    enum: ["Veg", "Non-Veg"],
    required: true,
  },
  items: [menuItemSchema],
});

module.exports = mongoose.model("Menu", categorySchema);