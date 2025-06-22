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
      { userId, items: transformedItems },
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

    console.log("userId", userId)
    console.log("items", items)

    // if (typeof userId === 'string') {
    //   userId = userId.replace(/^"|"$/g, '');
    // }
    const transformedItems = Object.values(items).map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      itemCost: item.itemCost,
      quantity: item.quantity,
      image: item.image,
    }));

    await Cart.findOneAndUpdate(
      { userId },
      { userId, items: transformedItems },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Cart saved" });
  } catch (error) {
    console.error("Error saving cart:", error);
    res.status(400).json({ error });
  }
};


exports.getCart = async (req, res) => {
  const { userId } = req.params;
  const cart = await Cart.findOne({ userId });
  res.status(200).json(cart);
};
