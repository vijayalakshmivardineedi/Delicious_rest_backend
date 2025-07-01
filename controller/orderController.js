const Order = require("../model/Order");
const User = require("../model/User");


function generate4DigitOrderId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function isOrderIdUnique(orderId) {
  const existing = await Order.findOne({ orderId });
  return !existing;
}


async function generateUniqueOrderId() {
  for (let i = 0; i < 5; i++) {
    const newId = generate4DigitOrderId();
    if (await isOrderIdUnique(newId)) return newId;
  }
  throw new Error("Failed to generate unique orderId, try again");
}


exports.createOrder = async (req, res) => {
  try {
    const {
      userId,
      items,
      deliveryLocation,
      subtotal,
      deliveryFee,
      taxes,
      discount,
      total,
      paymentMethod,
      status,
      cookingInstructions = "", 
    } = req.body;

    if (
      !userId ||
      !items ||
      !deliveryLocation ||
      !subtotal ||
      !deliveryFee ||
      !taxes ||
      !discount ||
      !total ||
      !paymentMethod ||
      !status
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const orderId = await generateUniqueOrderId();

    const order = new Order({
      userId,
      items,
      deliveryLocation,
      subtotal,
      deliveryFee,
      taxes,
      discount,
      total,
      orderId,
      cookingInstructions,
      paymentMethod,
      status,
    });

    await order.save();
    res.status(200).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getOrderByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId: userId });
    if (!orders || orders.length === 0)
      return res.status(404).json({ message: "No orders found for user" });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Cancel Order by User
exports.cancleByUser = async (req, res) => {
  try {
    const { userId, orderId } = req.params;
    const order = await Order.findOne({ userId: userId, orderId: orderId });

    if (!order)
      return res.status(404).json({ message: "User or Order not found" });

    if (order.status !== "Ordered")
      return res
        .status(400)
        .json({ message: "Order Cancel Not Possible at this stage" });

    order.status = "Cancelled";
    await order.save();
    res.status(200).json({ message: "Order Cancelled Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

////  ADMIN CONTROLS
exports.getAllOrdersForAdmin = async (req, res) => {
  try {
    const orders = await Order.find();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    const userIds = [...new Set(orders.map(order => order.userId))];

    const users = await User.find({ userId: { $in: userIds } });

    const userMap = {};
    users.forEach(user => {
      userMap[user.userId] = user;
    });

    const ordersWithUsers = orders.map(order => {
      return {
        ...order._doc,
        user: userMap[order.userId] || null
      };
    });

    res.status(200).json(ordersWithUsers);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.adminStatusUpdate = async (req, res) => {
  try {
    const { orderId, status } = req.params;
    const { prepTime } = req.body;

    const order = await Order.findOne({ orderId: orderId });

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    if (order.status === "Cancelled")
      return res.status(400).json({ message: "Order already cancelled" });

    order.status = status;

    if (status === "Preparing" && prepTime) {
      order.prepTime = prepTime;
    }

    await order.save();

    res.status(200).json({ message: `Order marked as ${status}` });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Order status update failed",
    });
  }
};

exports.getOrderInsightsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required" });

    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: {
        $gte: start,
        $lte: end,
      },
    });

    const insights = {
      placed: orders.length,
      delivered: orders.filter((o) => o.status === "Delivered").length,
      cancelled: orders.filter((o) => o.status === "Cancelled" || o.status === "Rejected").length,
      pending: orders.filter((o) =>
        ["Preparing", "Ready", "Picked Up"].includes(o.status)
      ).length,
    };

    res.status(200).json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


