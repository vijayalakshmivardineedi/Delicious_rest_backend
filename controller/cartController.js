const Cart = require("../model/Cart");

exports.saveCart = async (req, res) => {
  try {
    let { userId, items } = req.body;
    if (typeof userId === 'string') {
      userId = userId.replace(/^"|"$/g, '');
    }
    const transformedItems = Object.values(items).map((item) => ({
      itemId: item._id,
      itemName: item.itemName,
      itemCost: item.itemCost,
      quantity: item.quantity,
      image: item.image,
    }));

    await Cart.findOneAndUpdate(
      { userId },
      { userId, items: transformedItems,},
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Cart saved" });
  } catch (error) {
    console.error("Error saving cart:", error);
    res.status(400).json({ error });
  }
};

exports.updateCart = async (req, res) => {
  try {
    let { userId, items } = req.body;
    const transformedItems = Object.values(items).map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      itemCost: item.itemCost,
      quantity: item.quantity,
      image: item.image,
    }));

    await Cart.findOneAndUpdate(
      { userId },
      { userId, items: transformedItems},
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Cart updated" });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(400).json({ error });
  }
};

exports.deleteCart = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const deletedCart = await Cart.findOneAndDelete({ userId });

    if (!deletedCart) {
      return res.status(404).json({ message: "No cart found for this user" });
    }
    res.status(200).json({ message: "Cart deleted successfully" });
  } catch (error) {
    console.error("Error deleting cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.getCart = async (req, res) => {
  const { userId } = req.params;
  const cart = await Cart.findOne({ userId });
  res.status(200).json(cart);
};
