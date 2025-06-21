const Cart = require("../model/Cart");

exports.saveCart = async (req, res) => {
  const { userId, items, deliveryLocation, coupon, estimatedTime, cookingInstructions } = req.body;
  console.log("req.body", req.body)
 try {
  await Cart.findOneAndUpdate(
    { userId },
    { userId, items, deliveryLocation, coupon, estimatedTime, cookingInstructions },
    { upsert: true }
  );

  res.status(200).json({ message: "Cart saved" });
}catch (error){
 res.status(400).json({ error});
  }
};

exports.getCart = async (req, res) => {
  const { userId } = req.params;
  const cart = await Cart.findOne({ userId });
  res.json(cart);
};
