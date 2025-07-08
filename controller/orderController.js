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
      coupon, // Optional
    } = req.body;

    if (
      !userId ||
      !items ||
      !deliveryLocation ||
      subtotal == null ||
      deliveryFee == null ||
      taxes == null ||
      discount == null ||
      total == null ||
      !paymentMethod ||
      !status
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    console.log("yeswanth", userId);
    let parsedUserId = userId;
    if (typeof userId === "string") {
      parsedUserId = userId.replace(/^"|"$/g, "");
    }

    const orderId = await generateUniqueOrderId();

    const orderData = {
      userId: parsedUserId,
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
    };

    // Conditionally include coupon if it exists
    if (coupon) {
      orderData.coupon = coupon;
    }

    const order = new Order(orderData);
    await order.save();

    res.status(200).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = await Order.findById(orderId);
    if (!orders) return res.status(404).json({ message: "Order not found" });
    const userId = orders.userId;

    const user = await User.findOne({ userId });

    const order = {
      orders,
      user,
    };

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderByUserId = async (req, res) => {
  try {
    let { userId } = req.params;

    // Clean up if userId comes with extra quotes like "\"3138\""
    if (typeof userId === "string") {
      userId = userId.replace(/^"|"$/g, "");
    }

    console.log("Requested userId:", userId);

    const orders = await Order.find({ userId });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for user" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: error.message });
  }
};


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

    const userIds = [...new Set(orders.map((order) => order.userId))];

    const users = await User.find({ userId: { $in: userIds } });

    const userMap = {};
    users.forEach((user) => {
      userMap[user.userId] = user;
    });

    const ordersWithUsers = orders.map((order) => {
      return {
        ...order._doc,
        user: userMap[order.userId] || null,
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

    if (!order) return res.status(404).json({ message: "Order not found" });

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

exports.getTodaysOrders = async (req, res) => {
  try {
    const orders = await Order.find();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= startOfDay && createdAt <= endOfDay;
    });

    const countByStatus = {
      Ordered: 0,
      Cancelled: 0,
      Rejected: 0,
      Delivered: 0,
      Pending: 0,
    };

    const pendingStatuses = ["Picked Up", "Approved", "Preparing", "Ready"];

    todaysOrders.forEach((order) => {
      const status = order.status;
      if (countByStatus[status] !== undefined) {
        countByStatus[status]++;
      } else if (pendingStatuses.includes(status)) {
        countByStatus.Pending++;
      }
    });

    const data = {
      todaysOrders,
      counts: countByStatus,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in getTodaysOrders:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOrdersByDates = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ message: "fromDate and toDate are required" });
    }

    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const orders = await Order.find();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    const filteredOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= from && createdAt <= to;
    });

    const countByStatus = {
      Ordered: 0,
      Cancelled: 0,
      Rejected: 0,
      Delivered: 0,
      Pending: 0,
    };

    const pendingStatuses = ["Picked Up", "Approved", "Preparing", "Ready"];

    filteredOrders.forEach((order) => {
      const status = order.status;
      if (countByStatus[status] !== undefined) {
        countByStatus[status]++;
      } else if (pendingStatuses.includes(status)) {
        countByStatus.Pending++;
      }
    });

    const data = {
      filteredOrders,
      counts: countByStatus,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in getOrdersByDtares:", error);
    res.status(500).json({ error: error.message });
  }
};
