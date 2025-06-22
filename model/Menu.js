const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  itemType:{type: String, required: true , enum: ["Veg", "Non-Veg"]},
  itemCategory:{type: String},
  itemName: { type: String, required: true },
  itemCost: { type: Number, required: true },
  image: { type: String },
  isEnabled: { type: Boolean, default: true },
});



module.exports = mongoose.model("Menu", menuItemSchema);
