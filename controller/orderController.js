const Order = require("../model/Order");
const User = require("../model/User");

// Helper to generate a random 4-digit string orderId
function generate4DigitOrderId() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper to check if orderId exists in DB
async function isOrderIdUnique(orderId) {
  const existing = await Order.findOne({ orderId });
  return !existing;
}

// Generate a unique 4-digit orderId (try up to 5 times)
async function generateUniqueOrderId() {
  for (let i = 0; i < 5; i++) {
    const newId = generate4DigitOrderId();
    if (await isOrderIdUnique(newId)) return newId;
  }
  throw new Error("Failed to generate unique orderId, try again");
}

exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;

    if (!orderData.orderId) {
      orderData.orderId = await generateUniqueOrderId();
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
    const {orderId} = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderByUserId = async (req, res) => {
  try {
    const {userId} = req.params;
    const orders = await Order.find({userId: userId});
    if (!orders) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancleByUser = async (req, res) => {
  try {
    const {userId, orderId} = req.params;

    const order = await Order.findOne({userId: userId, orderId: orderId});
    if (!order) return res.status(404).json({ message: "User or Order not found" });

 if (order.status !== "Ordered") return res.status(404).json({ message: "Order Cancel Not Posible"});
    order.status = "Cancelled";
      await order.save();
    res.status(200).json({message: "Order Canceled"});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

////admins



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
    const {orderId, status} = req.params;
    const order = await Order.findOne({orderId: orderId});

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "Cancelled") return res.status(404).json({ message: `Order ${status} Not Possible`});
      order.status = status;
      await order.save();
    
    res.status(200).status(200).json({message: `Order ${status} Successfully`});
  } catch (error) {
    res.status(500).json({ error: error.message, message:"Order has been Cancled." });
  }
};